
import { GoogleGenAI, Type } from "@google/genai";
import { Surah, Ayah, Word } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

/**
 * Fetches Surah content (Arabic, English, Tamil) from public APIs
 */
export const fetchSurahData = async (surahId: number): Promise<Surah> => {
  // We fetch 3 editions: Arabic (Uthmani), English (Sahih Intl), and Tamil (Jan Turst)
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,en.sahih,ta.tamil`);
  const data = await response.json();

  if (data.code !== 200) throw new Error("Failed to fetch Quran data");

  const [arabic, english, tamil] = data.data;

  const ayahs: Ayah[] = arabic.ayahs.map((ayah: any, index: number) => ({
    number: ayah.numberInSurah,
    text: ayah.text,
    translation_en: english.ayahs[index].text,
    translation_ta: tamil.ayahs[index].text,
    words: [] // Will be populated on-demand or via AI
  }));

  return {
    id: surahId,
    name: english.englishName,
    name_ar: arabic.name,
    description: `A Surah from the Holy Quran (${arabic.revelationType}).`,
    total_ayahs: arabic.numberOfAyahs,
    ayahs: ayahs
  };
};

/**
 * Uses Gemini to generate word-by-word translation for a specific Ayah
 */
export const getWordByWordTranslation = async (ayahText: string): Promise<Word[]> => {
  const prompt = `Break down the following Arabic Ayah into individual words and provide their English and Tamil translations. 
  Format your response as a JSON array of objects with properties: "arabic", "english", "tamil".
  Ayah: "${ayahText}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
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

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini WBW Error:", error);
    return [];
  }
};
