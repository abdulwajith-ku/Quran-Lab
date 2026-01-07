
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

export const verifyRecitation = async (
  audioBase64: string, 
  ayahText: string,
  surahName: string
): Promise<string> => {
  const ai = getAIClient();
  
  const audioPart = {
    inlineData: {
      mimeType: 'audio/webm',
      data: audioBase64,
    },
  };
  
  const promptPart = {
    text: `You are a certified Tajweed and Quran teacher. The user is reciting: "${ayahText}" from Surah ${surahName}. 
    Analyze the audio for:
    1. Correctness of words (Tartil).
    2. Tajweed rules (Makhraj, Sifat, Noon/Meem Sakinah).
    3. Fluency.
    Provide detailed feedback in English and Tamil. If they made a mistake, point it out gently.`
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    contents: { parts: [audioPart, promptPart] },
  });

  return response.text || "Could not analyze recitation. Please try again.";
};

export const getHifzTips = async (surahName: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide practical Hifz (memorization) tips specifically for Surah ${surahName}. Include psychological techniques, repetition patterns, and spiritual advice. Provide the output in both English and Tamil clearly separated.`,
  });

  return response.text || "Tips unavailable at the moment.";
};
