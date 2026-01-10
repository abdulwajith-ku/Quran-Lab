
import { Surah, JuzInfo } from '../types';

export const SURAH_METADATA: (Partial<Surah> & { type: 'Meccan' | 'Medinan' })[] = [
  { id: 1, name: "Al-Fatihah", name_ar: "الفاتحة", total_ayahs: 7, type: 'Meccan', description: "The Opening of the Quran." },
  { id: 2, name: "Al-Baqarah", name_ar: "البقرة", total_ayahs: 286, type: 'Medinan', description: "The Cow - longest Surah." },
  { id: 3, name: "Al-Imran", name_ar: "آل عمران", total_ayahs: 200, type: 'Medinan', description: "The Family of Imran." },
  { id: 4, name: "An-Nisa", name_ar: "النساء", total_ayahs: 176, type: 'Medinan', description: "The Women." },
  { id: 5, name: "Al-Ma'idah", name_ar: "المائدة", total_ayahs: 120, type: 'Medinan', description: "The Table Spread." },
  { id: 6, name: "Al-An'am", name_ar: "الأنعام", total_ayahs: 165, type: 'Meccan', description: "The Cattle." },
  { id: 7, name: "Al-A'raf", name_ar: "الأعراف", total_ayahs: 206, type: 'Meccan', description: "The Heights." },
  { id: 8, name: "Al-Anfal", name_ar: "الأنفال", total_ayahs: 75, type: 'Medinan', description: "The Spoils of War." },
  { id: 9, name: "At-Tawbah", name_ar: "التوبة", total_ayahs: 129, type: 'Medinan', description: "The Repentance." },
  { id: 10, name: "Yunus", name_ar: "யونس", total_ayahs: 109, type: 'Meccan', description: "Prophet Jonah." },
  { id: 36, name: "Ya-Sin", name_ar: "يس", total_ayahs: 83, type: 'Meccan', description: "The Heart of the Quran." },
  { id: 55, name: "Ar-Rahman", name_ar: "الرحمن", total_ayahs: 78, type: 'Meccan', description: "The Most Merciful." },
  { id: 67, name: "Al-Mulk", name_ar: "الملك", total_ayahs: 30, type: 'Meccan', description: "The Sovereignty." },
  { id: 108, name: "Al-Kawthar", name_ar: "الكوثر", total_ayahs: 3, type: 'Meccan', description: "Abundance." },
  { id: 112, name: "Al-Ikhlas", name_ar: "الإخلاص", total_ayahs: 4, type: 'Meccan', description: "Purity of Faith." },
  { id: 113, name: "Al-Falaq", name_ar: "الفلق", total_ayahs: 5, type: 'Meccan', description: "The Daybreak." },
  { id: 114, name: "An-Nas", name_ar: "الناس", total_ayahs: 6, type: 'Meccan', description: "Mankind." }
];

export const ALL_SURAH_NAMES: string[] = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
  "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Ta-Ha",
  "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum",
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat",
  "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

export const JUZ_DATA: JuzInfo[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  startSurah: [1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 11, 12, 14, 16, 18, 21, 23, 25, 27, 29, 33, 36, 39, 41, 46, 51, 58, 67, 78][i],
  startAyah: [1, 142, 253, 93, 24, 148, 82, 111, 88, 41, 93, 6, 53, 1, 1, 75, 1, 1, 21, 56, 46, 31, 28, 32, 47, 1, 31, 1, 1, 1][i],
  description: `Section ${i + 1} of the Quran.`
}));
