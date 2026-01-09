export interface ProcessedDocument {
  content: string;
  mimeType: string;
  displayName: string;
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

export const processFileForClaude = async (file: File): Promise<ProcessedDocument> => {
  try {
    const mimeType = file.type || 'application/octet-stream';
    const displayName = file.name;

    const base64Content = await fileToBase64(file);

    return {
      content: base64Content,
      mimeType: mimeType,
      displayName: displayName
    };

  } catch (error) {
    console.error("File processing failed:", error);
    throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
