const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export interface ProcessedDocument {
  fileUri: string;
  mimeType: string;
  displayName: string;
}

export const uploadFileToGemini = async (file: File): Promise<ProcessedDocument> => {
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not configured");
  }

  try {
    const numBytes = file.size;
    const mimeType = file.type || 'application/octet-stream';
    const displayName = file.name;

    const initialUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;

    const initialResponse = await fetch(initialUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': numBytes.toString(),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          display_name: displayName
        }
      })
    });

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      throw new Error(`Initial upload request failed: ${initialResponse.status} ${errorText}`);
    }

    const uploadUrl = initialResponse.headers.get('X-Goog-Upload-URL');
    if (!uploadUrl) {
      throw new Error('No upload URL received from initial request');
    }

    const arrayBuffer = await file.arrayBuffer();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': numBytes.toString(),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: arrayBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`File upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const result = await uploadResponse.json();

    return {
      fileUri: result.file.uri,
      mimeType: result.file.mimeType,
      displayName: result.file.displayName || result.file.name
    };

  } catch (error) {
    console.error("File upload to Gemini failed:", error);
    throw new Error(`Failed to upload ${file.name} to Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
