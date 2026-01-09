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

const isWordDocument = (file: File): boolean => {
  const mimeType = file.type;
  const fileName = file.name.toLowerCase();

  return (
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('msword') ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.doc')
  );
};

const convertDocxToPdf = async (fileData: string, fileName: string, mimeType: string): Promise<{ pdfData: string; newFileName: string }> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const apiUrl = `${supabaseUrl}/functions/v1/convert-document`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileData,
      fileName,
      mimeType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Conversion failed with status ${response.status}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    pdfData: result.pdfData,
    newFileName: result.converted ? result.newFileName : fileName,
  };
};

export const processFileForClaude = async (file: File): Promise<ProcessedDocument> => {
  try {
    let mimeType = file.type || 'application/octet-stream';
    let displayName = file.name;
    let base64Content = await fileToBase64(file);

    if (isWordDocument(file)) {
      console.log(`Converting ${file.name} from DOCX to PDF...`);

      const { pdfData, newFileName } = await convertDocxToPdf(base64Content, file.name, mimeType);

      base64Content = pdfData;
      mimeType = 'application/pdf';
      displayName = newFileName;

      console.log(`Successfully converted ${file.name} to ${newFileName}`);
    }

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
