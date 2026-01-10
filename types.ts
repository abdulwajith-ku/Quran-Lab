
export interface Word {
  arabic: string;
  english: string;
  tamil: string;
}

export interface TajweedRule {
  rule: string;
  explanation_en: string;
  explanation_ta: string;
  location: string; // The part of the Arabic text this applies to
}

export interface Ayah {
  number: number;
  text: string;
  translation_en: string;
  translation_ta: string;
  words: Word[];
  tajweed_rules?: TajweedRule[];
}

export interface Surah {
  id: number;
  name: string;
  name_ar: string;
  description: string;
  total_ayahs: number;
  ayahs: Ayah[];
}

export interface SearchResult {
  surahId: number;
  surahName: string;
  ayahNumber: number;
  arabicText: string;
  snippet: string;
  tamilSnippet: string;
  relevance: string;
}

export interface JuzInfo {
  id: number;
  startSurah: number;
  startAyah: number;
  description: string;
}

export interface HifzProgress {
  surahId: number;
  ayahsMemorized: number[];
  ayahsRecited: number[];
  isComplete: boolean;
}

export interface PastReview {
  id: string;
  surahName: string;
  ayahNum: number;
  feedback: string;
  timestamp: number;
  audioBase64: string;
}

export type ViewState = 'surah-list' | 'reader' | 'tracker' | 'ai-verify' | 'hifz-master' | 'settings';
export type ListMode = 'surah' | 'juz';
export type HifzMethod = 'standard' | 'chain';
export type QuranScript = 'uthmani' | 'indopak';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
