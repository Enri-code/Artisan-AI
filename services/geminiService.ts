import { GoogleGenAI } from "@google/genai";

/**
 * Generates mesmerizing art using the user-selected Gemini API key.
 * Strictly uses gemini-3-pro-image-preview for high-fidelity museum-worthy results.
 */
export const generateArt = async (base64Image: string, prompt: string): Promise<string> => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    throw new Error("API Key required. Please select a valid key to access the Artisan Studio.");
  }

  // Guidelines: Create a fresh GoogleGenAI instance right before the call
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
            text: `${prompt}. Create a single, uniquely beautiful, high-fidelity fine art masterpiece based on the content and composition of this photo. Focus on artistic expression and mesmerizing detail.`,
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
    
    // Guidelines: Safely iterate through candidates and parts to find image data
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageBase64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!generatedImageBase64) {
      throw new Error("The rendering engine failed to produce an image part. Please try another style.");
    }

    return generatedImageBase64;
  } catch (error: any) {
    console.error("Gemini Art Generation Failure:", error);
    
    // Guidelines: Detect invalid project/key and signal for key selection reset
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_INVALID");
    }
    
    throw new Error(error.message || "A technical interruption occurred in the digital archive.");
  }
};
