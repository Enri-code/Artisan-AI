
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

export const generateArt = async (base64Image: string, prompt: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    // We use gemini-2.5-flash-image for image editing tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1], // Remove metadata prefix
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt + ". Output should be a single beautiful artistic image.",
          },
        ],
      },
    });

    let generatedImageBase64 = '';
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        generatedImageBase64 = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!generatedImageBase64) {
      throw new Error("Model failed to return an image.");
    }

    return generatedImageBase64;
  } catch (error) {
    console.error("Gemini Art Generation Error:", error);
    throw error;
  }
};
