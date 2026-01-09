import mammoth from 'mammoth';

export interface ProcessedDocument {
  content: string;
  mimeType: string;
  displayName: string;
  extractedText?: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = error => reject(error);
  });
};

const extractTextFromDocx = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await fileToArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Failed to extract text from Word document:", error);
    throw error;
  }
};

export const processFileForClaude = async (file: File): Promise<ProcessedDocument> => {
  try {
    const mimeType = file.type || 'application/octet-stream';
    const displayName = file.name;

    const base64Content = await fileToBase64(file);

    let extractedText: string | undefined;

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword' ||
        file.name.toLowerCase().endsWith('.docx') ||
        file.name.toLowerCase().endsWith('.doc')) {
      try {
        extractedText = await extractTextFromDocx(file);
      } catch (error) {
        console.warn("Could not extract text from Word document, will send as-is:", error);
      }
    }

    return {
      content: base64Content,
      mimeType: mimeType,
      displayName: displayName,
      extractedText
    };

  } catch (error) {
    console.error("File processing failed:", error);
    throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
