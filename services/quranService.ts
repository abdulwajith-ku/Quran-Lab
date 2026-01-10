
import { GoogleGenAI, Type } from "@google/genai";
import { Surah, Ayah, Word, TajweedRule, SearchResult } from "../types";

const BISMILLAH_TEXT = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const BISMILLAH_ALT = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

/**
 * Global Serial Queue to prevent concurrent Gemini API calls.
 * Adjusted to 5 seconds for a "faster response" feel while staying safe.
 */
class GeminiQueue {
  private queue: Promise<any> = Promise.resolve();
  private lastRequestTime: number = 0;
  private minInterval: number = 5000; // 5 seconds between requests

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    this.queue = this.queue.then(async () => {
      const now = Date.now();
      const timeSinceLast = now - this.lastRequestTime;
      if (timeSinceLast < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLast;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      try {
        const result = await task();
        this.lastRequestTime = Date.now();
        return result;
      } catch (error) {
        // Longer wait on error
        this.lastRequestTime = Date.now() + 3000; 
        throw error;
      }
    });
    return this.queue;
  }
}

const geminiQueue = new GeminiQueue();

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 8000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = JSON.stringify(error)?.toLowerCase() || "";
    const isRateLimit = errorMsg.includes('429') || 
                        errorMsg.includes('resource_exhausted') || 
                        errorMsg.includes('quota exceeded') ||
                        error.status === 'RESOURCE_EXHAUSTED';
    
    if (retries > 0 && isRateLimit) {
      console.warn(`Gemini Rate Limit hit. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const paceRequest = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchSurahData = async (surahId: number): Promise<Surah> => {
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,en.sahih,ta.tamil`);
  const data = await response.json();

  if (data.code !== 200) throw new Error("Failed to fetch Quran data");

  const [arabic, english, tamil] = data.data;

  const ayahs: Ayah[] = arabic.ayahs.map((ayah: any, index: number) => {
    let text = ayah.text;
    if (surahId !== 1 && surahId !== 9 && ayah.numberInSurah === 1) {
      if (text.startsWith(BISMILLAH_TEXT)) {
        text = text.replace(BISMILLAH_TEXT, "").trim();
      } else if (text.startsWith(BISMILLAH_ALT)) {
        text = text.replace(BISMILLAH_ALT, "").trim();
      }
    }

    return {
      number: ayah.numberInSurah,
      text: text,
      translation_en: english.ayahs[index].text,
      translation_ta: tamil.ayahs[index].text,
      words: []
    };
  });

  return {
    id: surahId,
    name: english.englishName,
    name_ar: arabic.name,
    description: `A Surah from the Holy Quran (${arabic.revelationType}).`,
    total_ayahs: arabic.numberOfAyahs,
    ayahs: ayahs
  };
};

export const searchQuranContent = async (query: string): Promise<SearchResult[]> => {
  return geminiQueue.enqueue(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search the Quran for: "${query}". Return the most relevant matches in JSON format.`,
        config: {
          systemInstruction: "You are a Quran search engine. Return JSON matching the schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                surahId: { type: Type.NUMBER },
                surahName: { type: Type.STRING },
                ayahNumber: { type: Type.NUMBER },
                arabicText: { type: Type.STRING },
                snippet: { type: Type.STRING },
                tamilSnippet: { type: Type.STRING },
                relevance: { type: Type.STRING }
              },
              required: ["surahId", "surahName", "ayahNumber", "arabicText", "snippet", "tamilSnippet", "relevance"]
            }
          }
        }
      });
      return response.text ? JSON.parse(response.text) : [];
    });
  });
};

export const getWordByWordTranslation = async (ayahText: string): Promise<Word[]> => {
  return geminiQueue.enqueue(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Translate this Quranic Ayah word-by-word: "${ayahText}"`;

    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Quranic linguist. Return JSON array of word objects with arabic, english, and tamil properties.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                arabic: { type: Type.STRING },
                english: { type: Type.STRING },
                tamil: { type: Type.STRING }
              },
              required: ["arabic", "english", "tamil"]
            }
          }
        }
      });
      return response.text ? JSON.parse(response.text) : [];
    });
  });
};

export const getAyahTajweedRules = async (ayahText: string): Promise<TajweedRule[]> => {
  return geminiQueue.enqueue(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Tajweed rules for: "${ayahText}"`;

    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Tajweed teacher. Return JSON array of rules with rule, location, explanation_en, and explanation_ta.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                rule: { type: Type.STRING },
                location: { type: Type.STRING },
                explanation_en: { type: Type.STRING },
                explanation_ta: { type: Type.STRING }
              },
              required: ["rule", "location", "explanation_en", "explanation_ta"]
            }
          }
        }
      });
      return response.text ? JSON.parse(response.text) : [];
    });
  });
};
