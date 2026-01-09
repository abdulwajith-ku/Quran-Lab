
import { GoogleGenAI, Type } from "@google/genai";
import { Surah, Ayah, Word, TajweedRule, SearchResult } from "../types";

const BISMILLAH_TEXT = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const BISMILLAH_ALT = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

/**
 * Fetches Surah content (Arabic, English, Tamil) from public APIs
 */
export const fetchSurahData = async (surahId: number): Promise<Surah> => {
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,en.sahih,ta.tamil`);
  const data = await response.json();

  if (data.code !== 200) throw new Error("Failed to fetch Quran data");

  const [arabic, english, tamil] = data.data;

  const ayahs: Ayah[] = arabic.ayahs.map((ayah: any, index: number) => {
    let text = ayah.text;
    
    // Strip Bismillah from first ayah of Surahs 2-114 (except 9)
    // We leave it for Surah 1 (Al-Fatihah) as it is technically the first verse
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

/**
 * Uses Gemini to search for specific content/topics across the Quran
 */
export const searchQuranContent = async (query: string): Promise<SearchResult[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `You are an expert Quran search engine. The user is searching for: "${query}".
  Search the entire Quran (all 114 Surahs) for the most relevant verses matching this keyword, phrase, or topic.
  
  Provide a list of up to 10 relevant verses.
  For each result, provide:
  1. surahId (1-114)
  2. surahName (English name)
  3. ayahNumber (the number of the verse in that surah)
  4. arabicText (The full Arabic text of that verse)
  5. snippet (The English translation of that verse)
  6. tamilSnippet (The Tamil translation of that verse)
  7. relevance (A short explanation of why it matches)
  
  Format as a JSON array.`;

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

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Quran Search Error:", error);
    return [];
  }
};

/**
 * Uses Gemini to generate word-by-word translation
 */
export const getWordByWordTranslation = async (ayahText: string): Promise<Word[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

/**
 * Uses Gemini to provide Tartil and Tajweed rules for a specific Ayah
 */
export const getAyahTajweedRules = async (ayahText: string): Promise<TajweedRule[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze the following Arabic Ayah for Tajweed and Tartil rules. 
  Identify rules like Qalqalah, Ghunnah, Ikhfa, Idgham, Madd, and correct articulation (Makhraj).
  Provide a list of rules found. For each rule, include:
  1. The name of the rule (e.g., "Qalqalah")
  2. The specific part of the text it applies to (location)
  3. A short explanation in English
  4. A short explanation in Tamil
  
  Ayah: "${ayahText}"
  Format as a JSON array.`;

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

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Tajweed Error:", error);
    return [];
  }
};
