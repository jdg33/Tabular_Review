import Anthropic from "@anthropic-ai/sdk";
import { DocumentFile, ExtractionCell, Column, ExtractionResult } from "../types";

const MODEL_ID = "claude-haiku-4-5-20251001";

const apiKey = import.meta.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is not set in environment variables");
}

const anthropic = new Anthropic({
  apiKey: apiKey || "",
  dangerouslyAllowBrowser: true
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(operation: () => Promise<T>, retries = 5, initialDelay = 1000): Promise<T> {
  let currentTry = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      currentTry++;

      const isRateLimit =
        error?.status === 429 ||
        error?.error?.type === 'rate_limit_error' ||
        error?.message?.includes('429') ||
        error?.message?.includes('rate_limit');

      if (isRateLimit && currentTry <= retries) {
        const delay = initialDelay * Math.pow(2, currentTry - 1) + (Math.random() * 1000);
        console.warn(`Claude API Rate Limit hit. Retrying attempt ${currentTry} in ${delay.toFixed(0)}ms...`);
        await wait(delay);
        continue;
      }

      throw error;
    }
  }
}

export const extractColumnData = async (
  doc: DocumentFile,
  column: Column
): Promise<ExtractionCell> => {
  return withRetry(async () => {
    try {
      const content: Anthropic.MessageParam[] = [];

      let formatInstruction = "";
      switch (column.type) {
        case 'date':
          formatInstruction = "Format the date as YYYY-MM-DD.";
          break;
        case 'boolean':
          formatInstruction = "Return 'true' or 'false' as the value string.";
          break;
        case 'number':
          formatInstruction = "Return a clean number string, removing currency symbols if needed.";
          break;
        case 'list':
          formatInstruction = "Return the items as a comma-separated string.";
          break;
        default:
          formatInstruction = "Keep the text concise.";
      }

      const prompt = `Task: Extract specific information from the provided document.

Column Name: "${column.name}"
Extraction Instruction: ${column.prompt}

Format Requirements:
- ${formatInstruction}
- Provide a confidence score (High/Medium/Low).
- Include the exact quote from the text where the answer is found.
- Provide a brief reasoning.

You MUST respond with valid JSON in exactly this format:
{
  "value": "the extracted answer",
  "confidence": "High/Medium/Low",
  "quote": "exact text from document",
  "page": 1,
  "reasoning": "brief explanation"
}`;

      if (doc.mimeType?.startsWith('image/') || doc.mimeType === 'application/pdf') {
        content.push({
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: doc.mimeType as any,
                data: doc.content
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        });
      } else {
        let docText = "";
        try {
          docText = decodeURIComponent(escape(atob(doc.content)));
        } catch (e) {
          docText = atob(doc.content);
        }

        content.push({
          role: 'user',
          content: `DOCUMENT CONTENT:\n${docText}\n\n${prompt}`
        });
      }

      const response = await anthropic.messages.create({
        model: MODEL_ID,
        max_tokens: 2048,
        system: "You are a precise data extraction agent. You must extract data exactly as requested and respond only with valid JSON.",
        messages: content
      });

      const responseText = response.content[0]?.type === 'text' ? response.content[0].text : "";

      if (!responseText) {
        throw new Error("Empty response from model");
      }

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const json = JSON.parse(jsonMatch[0]);

      return {
        value: String(json.value || ""),
        confidence: (json.confidence as any) || "Low",
        quote: json.quote || "",
        page: json.page || 1,
        reasoning: json.reasoning || "",
        status: 'needs_review'
      };

    } catch (error) {
      console.error("Extraction error:", error);
      throw error;
    }
  });
};

export const generatePromptHelper = async (
  name: string,
  type: string,
  currentPrompt: string | undefined
): Promise<string> => {
  const prompt = `I need to configure a Large Language Model to extract a specific data field from business documents.

Field Name: "${name}"
Field Type: "${type}"
${currentPrompt ? `Draft Prompt: "${currentPrompt}"` : ""}

Please write a clear, effective prompt that I can send to the LLM to get the best extraction results for this field.
The prompt should describe what to look for and how to handle edge cases if applicable.
Return ONLY the prompt text, no conversational filler.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : "";
    return text.trim() || currentPrompt || `Extract the ${name} from the document.`;
  } catch (error) {
    console.error("Prompt generation error:", error);
    return currentPrompt || `Extract the ${name} from the document.`;
  }
};

export const analyzeDataWithChat = async (
  message: string,
  context: { documents: DocumentFile[], columns: Column[], results: ExtractionResult },
  history: { role: 'user' | 'assistant', content: string }[]
): Promise<string> => {
  let dataContext = "CURRENT EXTRACTION DATA:\n";
  dataContext += `Documents: ${context.documents.map(d => d.name).join(", ")}\n`;
  dataContext += `Columns: ${context.columns.map(c => c.name).join(", ")}\n\n`;
  dataContext += "DATA TABLE (CSV Format):\n";

  const headers = ["Document Name", ...context.columns.map(c => c.name)].join(",");
  dataContext += headers + "\n";

  context.documents.forEach(doc => {
    const row = [doc.name];
    context.columns.forEach(col => {
      const cell = context.results[doc.id]?.[col.id];
      const val = cell ? cell.value.replace(/,/g, ' ') : "N/A";
      row.push(val);
    });
    dataContext += row.join(",") + "\n";
  });

  const systemInstruction = `You are an intelligent data analyst assistant.
You have access to a dataset extracted from documents (provided in context).

${dataContext}

Instructions:
1. Answer the user's question based strictly on the provided data table.
2. If comparing documents, mention them by name.
3. If the data is missing or N/A, state that clearly.
4. Keep answers professional and concise.`;

  try {
    const messages: Anthropic.MessageParam[] = [
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    const response = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: 2048,
      system: systemInstruction,
      messages: messages
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : "";
    return text || "No response generated.";
  } catch (error) {
    console.error("Chat analysis error:", error);
    return "I apologize, but I encountered an error while analyzing the data. Please try again.";
  }
};
