import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface ProcessedDocument {
  fileUri: string;
  mimeType: string;
  displayName: string;
}

export const uploadFileToGemini = async (file: File): Promise<ProcessedDocument> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const uploadedFile = await ai.files.upload({
      file: {
        data: uint8Array,
        mimeType: file.type || 'application/octet-stream'
      },
      config: {
        displayName: file.name
      }
    });

    return {
      fileUri: uploadedFile.uri,
      mimeType: uploadedFile.mimeType,
      displayName: uploadedFile.name
    };

  } catch (error) {
    console.error("File upload to Gemini failed:", error);
    throw new Error(`Failed to upload ${file.name} to Gemini API`);
  }
};
