
import { GoogleGenAI } from "@google/genai";

/**
 * Generates art using the user-selected Gemini API key.
 * The instance is created per-call to ensure it uses the latest process.env.API_KEY.
 */
export const generateArt = async (base64Image: string, prompt: string): Promise<string> => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    throw new Error("No API Key selected. Please select your key first.");
  }

  // Create instance right before making an API call to ensure use of latest injected key
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt + ". Output should be a single beautiful artistic image.",
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "1K"
        }
      }
    });

    let generatedImageBase64 = '';
    // Iterate through candidates and parts to find the image part as recommended
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageBase64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!generatedImageBase64) {
      throw new Error("The museum curator was unable to finalize your piece. Please try a different style.");
    }

    return generatedImageBase64;
  } catch (error: any) {
    console.error("Gemini Art Generation Error:", error);
    // Reset key selection state if the requested entity (API key) was not found
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};
