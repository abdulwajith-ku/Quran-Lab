
import { Surah, JuzInfo } from '../types';

export const SURAH_METADATA: Partial<Surah>[] = [
  { id: 1, name: "Al-Fatihah", name_ar: "الفاتحة", total_ayahs: 7, description: "The Opening of the Quran." },
  { id: 2, name: "Al-Baqarah", name_ar: "البقرة", total_ayahs: 286, description: "The Cow - longest Surah." },
  { id: 3, name: "Al-Imran", name_ar: "آل عمران", total_ayahs: 200, description: "The Family of Imran." },
  { id: 4, name: "An-Nisa", name_ar: "النساء", total_ayahs: 176, description: "The Women." },
  { id: 5, name: "Al-Ma'idah", name_ar: "المائدة", total_ayahs: 120, description: "The Table Spread." },
  { id: 6, name: "Al-An'am", name_ar: "الأنعام", total_ayahs: 165, description: "The Cattle." },
  { id: 7, name: "Al-A'raf", name_ar: "الأعراف", total_ayahs: 206, description: "The Heights." },
  { id: 8, name: "Al-Anfal", name_ar: "الأنفال", total_ayahs: 75, description: "The Spoils of War." },
  { id: 9, name: "At-Tawbah", name_ar: "التوبة", total_ayahs: 129, description: "The Repentance." },
  { id: 10, name: "Yunus", name_ar: "يونس", total_ayahs: 109, description: "Prophet Jonah." },
  // ... including others for metadata list in selection
  { id: 36, name: "Ya-Sin", name_ar: "يس", total_ayahs: 83, description: "The Heart of the Quran." },
  { id: 55, name: "Ar-Rahman", name_ar: "الرحمن", total_ayahs: 78, description: "The Most Merciful." },
  { id: 67, name: "Al-Mulk", name_ar: "الملك", total_ayahs: 30, description: "The Sovereignty." },
  { id: 108, name: "Al-Kawthar", name_ar: "الكوثر", total_ayahs: 3, description: "Abundance." },
  { id: 112, name: "Al-Ikhlas", name_ar: "الإخلاص", total_ayahs: 4, description: "Purity of Faith." },
  { id: 113, name: "Al-Falaq", name_ar: "الفلق", total_ayahs: 5, description: "The Daybreak." },
  { id: 114, name: "An-Nas", name_ar: "الناس", total_ayahs: 6, description: "Mankind." }
];

// Helper to get full 114 surah list names (compact)
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

// Full Data for actual reading demo
export const QURAN_DATA: Surah[] = [
  {
    id: 1,
    name: "Al-Fatihah",
    name_ar: "الفاتحة",
    description: "The Opening of the Quran, serving as a prayer for guidance.",
    total_ayahs: 7,
    ayahs: [
      {
        number: 1,
        text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        translation_en: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
        translation_ta: "அளவற்ற அருளாளனும், நிகரற்ற அன்புடையோனுமாகிய அல்லாஹ்வின் திருப்பெயரால் (தொடங்குகிறேன்).",
        words: [
          { arabic: "بِسْمِ", english: "In the name", tamil: "பெயரால்" },
          { arabic: "اللَّهِ", english: "of Allah", tamil: "அல்லாஹ்வின்" },
          { arabic: "الرَّحْمَٰنِ", english: "The Most Gracious", tamil: "அளவற்ற அருளாளன்" },
          { arabic: "الرَّحِيمِ", english: "The Most Merciful", tamil: "நிகரற்ற அன்புடையோன்" }
        ]
      },
      {
        number: 2,
        text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        translation_en: "[All] praise is [due] to Allah, Lord of the worlds",
        translation_ta: "அனைத்துப் புகழும் அகிலங்கள் அனைத்தையும் படைத்து வளர்க்கும் அல்லாஹ்வுக்கே உரியது.",
        words: [
          { arabic: "الْحَمْدُ", english: "All praise", tamil: "அனைத்து புகழும்" },
          { arabic: "لِلَّهِ", english: "for Allah", tamil: "அல்லாஹ்வுக்கே" },
          { arabic: "رَبِّ", english: "Lord", tamil: "இறைவன்" },
          { arabic: "الْعَالَمِينَ", english: "of the worlds", tamil: "அகிலங்களின்" }
        ]
      }
    ]
  },
  {
    id: 108,
    name: "Al-Kawthar",
    name_ar: "الكوثر",
    description: "The shortest Surah, promising abundance.",
    total_ayahs: 3,
    ayahs: [
      {
        number: 1,
        text: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",
        translation_en: "Indeed, We have granted you, [O Muhammad], al-Kawthar.",
        translation_ta: "(நபியே!) நிச்சயமாக நாம் உமக்குக் கவ்ஸரை (அதிகமான நன்மைகளை) அளித்தோம்.",
        words: [
          { arabic: "إِنَّا", english: "Indeed, We", tamil: "நிச்சயமாக நாம்" },
          { arabic: "أَعْطَيْنَاكَ", english: "have given you", tamil: "உமக்கு அளித்தோம்" },
          { arabic: "الْكَوْثَرَ", english: "Al-Kawthar", tamil: "அல்-கவ்ஸரை" }
        ]
      },
      {
        number: 2,
        text: "فَصَلِّ لِرَبِّكَ وَانْحَرْ",
        translation_en: "So pray to your Lord and sacrifice [to Him alone].",
        translation_ta: "ஆகவே, உம்முடைய இறைவனுக்காகத் தொழுது, குர்பானியும் கொடுப்பீராக.",
        words: [
          { arabic: "فَصَلِّ", english: "So pray", tamil: "தொழுது" },
          { arabic: "لِرَبِّكَ", english: "to your Lord", tamil: "உம் இறைவனுக்காக" },
          { arabic: "وَانْحَرْ", english: "and sacrifice", tamil: "குர்பானியும் கொடுப்பீர்" }
        ]
      },
      {
        number: 3,
        text: "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",
        translation_en: "Indeed, your enemy is the one cut off.",
        translation_ta: "நிச்சயமாக உம்மைப் பகைப்பவன் எவனோ, அவன்தான் (சந்ததி) அற்றவன்.",
        words: [
          { arabic: "إِنَّ", english: "Indeed", tamil: "நிச்சயமாக" },
          { arabic: "شَانِئَكَ", english: "your enemy", tamil: "உம்மைப் பகைப்பவன்" },
          { arabic: "هُوَ", english: "he (is)", tamil: "அவன் தான்" },
          { arabic: "الْأَبْتَرُ", english: "the cut off", tamil: "அற்றவன்" }
        ]
      }
    ]
  },
  {
    id: 112,
    name: "Al-Ikhlas",
    name_ar: "الإخلاص",
    description: "Declaration of the absolute oneness of God.",
    total_ayahs: 4,
    ayahs: [
      {
        number: 1,
        text: "قُلْ هُوَ اللَّهُ أَحَدٌ",
        translation_en: "Say, \"He is Allah, [who is] One,",
        translation_ta: "(நபியே!) நீர் கூறுவீராக: அல்லாஹ் அவன் ஒருவனே.",
        words: [
          { arabic: "قُلْ", english: "Say", tamil: "கூறுவீராக" },
          { arabic: "هُوَ", english: "He (is)", tamil: "அவன்" },
          { arabic: "اللَّهُ", english: "Allah", tamil: "அல்லாஹ்" },
          { arabic: "أَحَدٌ", english: "One", tamil: "ஒருவன்" }
        ]
      }
    ]
  },
  {
    id: 113,
    name: "Al-Falaq",
    name_ar: "الفلق",
    description: "Protection from the evils of darkness.",
    total_ayahs: 5,
    ayahs: [
      {
        number: 1,
        text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
        translation_en: "Say, \"I seek refuge in the Lord of daybreak",
        translation_ta: "(நபியே!) நீர் கூறுவீராக: அதிகாலையின் இறைவனிடம் நான் பாதுகாப்புக் கோருகிறேன்.",
        words: [
          { arabic: "قُلْ", english: "Say", tamil: "கூறுவீராக" },
          { arabic: "أَعُوذُ", english: "I seek refuge", tamil: "நான் பாதுகாப்புக் கோருகிறேன்" },
          { arabic: "بِرَبِّ", english: "in (the) Lord", tamil: "இறைவனிடம்" },
          { arabic: "الْفَلَقِ", english: "of the daybreak", tamil: "அதிகாலையின்" }
        ]
      }
    ]
  },
  {
    id: 114,
    name: "An-Nas",
    name_ar: "الناس",
    description: "Protection from mankind and whispers.",
    total_ayahs: 6,
    ayahs: [
      {
        number: 1,
        text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
        translation_en: "Say, \"I seek refuge in the Lord of mankind,",
        translation_ta: "(நபியே!) நீர் கூறுவீராக: மனிதர்களின் இறைவனிடம் நான் பாதுகாப்புக் கோருகிறேன்.",
        words: [
          { arabic: "قُلْ", english: "Say", tamil: "கூறுவீராக" },
          { arabic: "أَعُوذُ", english: "I seek refuge", tamil: "பாதுகாப்புக் கோருகிறேன்" },
          { arabic: "بِرَبِّ", english: "in (the) Lord", tamil: "இறைவனிடம்" },
          { arabic: "النَّاسِ", english: "of mankind", tamil: "மனிதர்களின்" }
        ]
      }
    ]
  }
];
