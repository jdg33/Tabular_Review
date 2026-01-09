import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ConversionRequest {
  fileData: string;
  fileName: string;
  mimeType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { fileData, fileName, mimeType }: ConversionRequest = await req.json();

    if (!fileData || !fileName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: fileData and fileName" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if file is DOCX or DOC
    const isWordDoc = mimeType.includes('wordprocessingml') || 
                      mimeType.includes('msword') || 
                      fileName.endsWith('.docx') || 
                      fileName.endsWith('.doc');

    if (!isWordDoc) {
      // Not a Word document, return as-is
      return new Response(
        JSON.stringify({
          pdfData: fileData,
          converted: false,
          message: "File is not a Word document, no conversion needed"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get CloudConvert API key from environment
    const apiKey = Deno.env.get("CLOUDCONVERT_API_KEY");
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "CloudConvert API key not configured. Please set CLOUDCONVERT_API_KEY environment variable.",
          instructions: "Get a free API key at https://cloudconvert.com/register"
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Create conversion job
    const createJobResponse = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          "import-file": {
            operation: "import/base64",
            file: fileData,
            filename: fileName,
          },
          "convert-to-pdf": {
            operation: "convert",
            input: "import-file",
            output_format: "pdf",
          },
          "export-pdf": {
            operation: "export/url",
            input: "convert-to-pdf",
          },
        },
      }),
    });

    if (!createJobResponse.ok) {
      const errorText = await createJobResponse.text();
      console.error("CloudConvert job creation failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create conversion job", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jobData = await createJobResponse.json();
    const jobId = jobData.data.id;

    // Step 2: Wait for job to complete (poll status)
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    let jobStatus = null;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error("Failed to check job status");
      }

      jobStatus = await statusResponse.json();
      const status = jobStatus.data.status;

      if (status === "finished") {
        break;
      } else if (status === "error") {
        throw new Error("Conversion job failed");
      }

      // Wait 1 second before next check
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return new Response(
        JSON.stringify({ error: "Conversion timeout" }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Get the export task and download PDF
    const exportTask = jobStatus.data.tasks.find((task: any) => task.name === "export-pdf");
    if (!exportTask || !exportTask.result?.files?.[0]?.url) {
      throw new Error("No PDF output URL found");
    }

    const pdfUrl = exportTask.result.files[0].url;

    // Download the PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error("Failed to download converted PDF");
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    return new Response(
      JSON.stringify({
        pdfData: pdfBase64,
        converted: true,
        originalFileName: fileName,
        newFileName: fileName.replace(/\.(docx?|doc)$/i, '.pdf'),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Document conversion error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Document conversion failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});