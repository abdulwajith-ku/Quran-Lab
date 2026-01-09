
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const getAIClient = () => {
  // Use the API key directly from environment variable as per guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

export const transcribeAudio = async (audioBase64: string): Promise<string> => {
  const ai = getAIClient();
  
  const audioPart = {
    inlineData: {
      mimeType: 'audio/webm',
      data: audioBase64,
    },
  };
  
  const promptPart = {
    text: "Transcribe the following audio which contains a search query for the Quran. It might be a topic, a verse snippet, or a surah name in English, Arabic, or Tamil. Return ONLY the transcribed text in English or Arabic script as appropriate. Do not include any other text."
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      contents: { parts: [audioPart, promptPart] },
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Transcription error:", error);
    return "";
  }
};

export const getHifzTips = async (surahName: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide practical Hifz (memorization) tips specifically for Surah ${surahName}. Include psychological techniques, repetition patterns, and spiritual advice. Provide the output in both English and Tamil clearly separated.`,
  });

  return response.text || "Tips unavailable at the moment.";
};