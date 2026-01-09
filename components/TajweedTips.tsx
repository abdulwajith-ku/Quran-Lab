
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Rule {
  title: string;
  category: string;
  desc_en: string;
  desc_ta: string;
  tip_en: string;
  tip_ta: string;
  examples: { text: string; label: string }[];
  letters?: string;
}

const TAJWEED_RULES: Rule[] = [
  // Noon Sakinah & Tanween
  {
    category: "Noon Sakinah",
    title: "Izhaar (إظهار - Clear)",
    desc_en: "Pronounce the 'N' sound clearly without any nasalization when followed by throat letters (ء ه ع ح غ خ).",
    desc_ta: "தொண்டை எழுத்துக்கள் (ء ه ع ح غ خ) வரும்போது 'நூன்' ஒலியை மூக்கொலி இன்றி தெளிவாக ஓதுதல்.",
    tip_en: "Place your tongue firmly on the upper palate and release quickly.",
    tip_ta: "நாவினை மேல் அண்ணத்தில் உறுதியாக வைத்து விரைவாக விடுவிக்கவும்.",
    examples: [
      { text: "مِنْ هَادٍ", label: "Min Haadin" },
      { text: "أَنْعَمْتَ", label: "An'amta" },
      { text: "كُفُوًا أَحَدٌ", label: "Kufuwan Ahad" }
    ],
    letters: "ء ه ع ح غ خ"
  },
  {
    category: "Noon Sakinah",
    title: "Idghaam with Ghunnah (إدغام بغنة - Merging)",
    desc_en: "Merge the Noon/Tanween into the next letter with a 2-count nasal sound. Happens with: ي ن م و.",
    desc_ta: "நூன் அல்லது தன்வீனை அடுத்து (ي ن م و) வரும்போது அவற்றுடன் இணைத்து 2 மாத்திரை அளவு மூக்கொலியுடன் ஓதுதல்.",
    tip_en: "The sound should vibrate in your nose, not your mouth.",
    tip_ta: "ஒலி வாயில் அல்லாமல் மூக்கில் அதிர வேண்டும்.",
    examples: [
      { text: "مَنْ يَقُولُ", label: "May-yaqool" },
      { text: "مِنْ مَالٍ", label: "Mim-maalin" },
      { text: "لَهَبٍ وَتَبَّ", label: "Lahabiw-watab" }
    ],
    letters: "ي ن م و"
  },
  {
    category: "Noon Sakinah",
    title: "Idghaam without Ghunnah (إدغام بغير غنة)",
    desc_en: "Complete merging without any nasal sound. Happens only with: ل ر.",
    desc_ta: "மூக்கொலி இன்றி முழுமையாக இணைத்து ஓதுதல். இது (ل ر) ஆகிய எழுத்துக்களுக்கு மட்டும் உரியது.",
    tip_en: "Transition directly to the L or R sound with zero delay.",
    tip_ta: "எந்த தாமதமும் இன்றி நேரடியாக 'லாம்' அல்லது 'ரா' எழுத்திற்கு செல்லவும்.",
    examples: [
      { text: "مِنْ رَبِّهِمْ", label: "Mir-rabbihim" },
      { text: "لَطِيفٌ لِمَا", label: "Lateeful-limaa" },
      { text: "أَنْ لَنْ", label: "Al-lan" }
    ],
    letters: "ل ر"
  },
  {
    category: "Noon Sakinah",
    title: "Iqlab (إقلاب - Changing)",
    desc_en: "Turn the Noon/Tanween sound into a 'Meem' when followed by the letter 'Ba' (ب).",
    desc_ta: "நூன் அல்லது தன்வீனை அடுத்து 'பா' (ب) வரும்போது நூன் ஒலியை 'மீம்' ஆக மாற்றி ஓதுதல்.",
    tip_en: "Close your lips very lightly as if holding a piece of paper between them.",
    tip_ta: "உதடுகளை மிக இலேசாக மூடவும், அவற்றுக்கிடையே ஒரு காகிதம் இருப்பது போல கற்பனை செய்யவும்.",
    examples: [
      { text: "مِنْ بَعْدِ", label: "Mim-ba'di" },
      { text: "سَمِيعٌ بَصِيرٌ", label: "Samee'um-baseer" },
      { text: "أَنْبِئْهُمْ", label: "Ambi'hum" }
    ],
    letters: "ب"
  },
  {
    category: "Noon Sakinah",
    title: "Ikhfa (إخفاء - Hiding)",
    desc_en: "Hide the Noon sound by placing your tongue near the exit of the next letter with Ghunnah.",
    desc_ta: "நூன் ஒலியை அடுத்த எழுத்தின் பிறப்பிடத்திற்கு அருகில் நாவை வைத்து மூக்கொலியுடன் மறைத்து ஓதுதல்.",
    tip_en: "Your tongue should NOT touch the roof of your mouth during the Ghunnah.",
    tip_ta: "மூக்கொலி செய்யும்போது நாவு மேல் அண்ணத்தைத் தொடக்கூடாது.",
    examples: [
      { text: "كُنْتُمْ", label: "Kuntum" },
      { text: "أَنْجَيْنَاكُمْ", label: "Anjaynaakum" },
      { text: "مِنْ صَلْصَالٍ", label: "Min Salsalin" }
    ],
    letters: "ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك"
  },
  // Meem Sakinah
  {
    category: "Meem Sakinah",
    title: "Ikhfa Shafawi (إخفاء شفوي)",
    desc_en: "When Meem Sakinah is followed by 'Ba' (ب), hide the Meem with a nasal sound.",
    desc_ta: "சுக்கூன் பெற்ற 'மீம்' எழுத்தைத் தொடர்ந்து 'பா' (ب) வரும்போது, மீமை மூக்கொலியுடன் மறைத்து ஓதுதல்.",
    tip_en: "This is a labial (lip) rule. Focus on the soft touch of the lips.",
    tip_ta: "இது உதடு சார்ந்த விதி. உதடுகளின் மென்மையான தொடுதலில் கவனம் செலுத்தவும்.",
    examples: [
      { text: "تَرْمِيهِمْ بِحِجَارَةٍ", label: "Tarmeehim-bihijarah" },
      { text: "أَنْتُمْ بِهِ", label: "Antum-bihi" },
      { text: "يَعْتَصِمْ بِاللَّهِ", label: "Ya'tasim-billah" }
    ],
    letters: "ب"
  },
  // Qalqalah
  {
    category: "Recitation Style",
    title: "Qalqalah (قلقلة - Echoing)",
    desc_en: "A bounce or echoing sound produced when these 5 letters have a Suqun (Sakin).",
    desc_ta: "(ق ط ب ج د) ஆகிய எழுத்துக்களுக்கு சுக்கூன் இருக்கும்போது ஒருவித அதிரும் சத்தத்துடன் ஓதுதல்.",
    tip_en: "Don't add a vowel sound. It's an echo, not a 'Fat-ha'.",
    tip_ta: "உயிர் எழுத்து ஒலியைச் சேர்க்க வேண்டாம். இது ஒரு எதிரொலி மட்டுமே.",
    examples: [
      { text: "الْفَلَقِ", label: "Al-Falaq (Major)" },
      { text: "مَطْلَعِ", label: "Matla'i (Minor)" },
      { text: "حَبْلٌ", label: "Hablun (Minor)" }
    ],
    letters: "ق ط ب ج د"
  },
  // Ghunnah
  {
    category: "Recitation Style",
    title: "Ghunnah (غنة - Nasalization)",
    desc_en: "Compulsory 2-count nasal sound whenever Noon or Meem has a Shaddah (ّ).",
    desc_ta: "நூன் அல்லது மீம் எழுத்துக்களுக்கு ஷத்தா இருக்கும்போது 2 மாத்திரை அளவு மூக்கொலியுடன் ஓதுவது கட்டாயம்.",
    tip_en: "This is the most common Tajweed rule. Never skip it!",
    tip_ta: "இது குர்ஆனில் மிக அதிகமாக வரும் விதி. இதை ஒருபோதும் தவிர்க்க வேண்டாம்.",
    examples: [
      { text: "إِنَّ", label: "Inna" },
      { text: "ثُمَّ", label: "Thumma" },
      { text: "عَمَّ", label: "Amma" }
    ],
    letters: "نّ مّ"
  }
];

const TajweedTips: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const categories = ["All", ...Array.from(new Set(TAJWEED_RULES.map(r => r.category)))];

  const filteredRules = TAJWEED_RULES.filter(rule => 
    (activeCategory === "All" || rule.category === activeCategory) &&
    (rule.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     rule.desc_en.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAskAI = async () => {
    if (!searchQuery.trim()) return;
    setIsAsking(true);
    setAiResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const prompt = `You are an expert Quran Teacher. The student is asking about: "${searchQuery}". 
      Explain this Tajweed rule clearly. 
      Include: 
      1. Technical Definition in English and Tamil.
      2. Exactly 3 distinct examples from the Quran.
      3. A practical "Pro-Tip" for perfect pronunciation.
      Format it beautifully for a mobile app user.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setAiResponse(response.text || "I couldn't find an explanation for that.");
    } catch (err) {
      setAiResponse("Error connecting to AI teacher. Please try again.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Hero Header */}
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl rotate-12">✨</div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-1 italic tracking-tight">Tajweed Handbook</h2>
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">Complete Simplified Guide</p>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
            <span className="text-3xl">🎙️</span>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              "Beautify the Quran with your voices, for a beautiful voice increases the beauty of the Quran."
            </p>
          </div>
        </div>
      </div>

      {/* AI Tajweed Assistant Search */}
      <div className="space-y-3">
        <div className="relative group">
          <input 
            type="text"
            placeholder="Ask AI about any specific rule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-6 pr-24 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
          />
          <button 
            onClick={handleAskAI}
            disabled={isAsking}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isAsking ? '...' : 'Ask AI'}
          </button>
        </div>

        {aiResponse && (
          <div className="bg-white border border-indigo-100 p-6 rounded-[2.5rem] animate-in zoom-in duration-300 relative shadow-xl">
            <button 
              onClick={() => setAiResponse(null)}
              className="absolute top-5 right-5 text-slate-300 hover:text-slate-600 p-2"
            >✕</button>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">🎓</span>
              <h4 className="text-[9px] font-black text-indigo-900 uppercase tracking-widest">AI Masterclass</h4>
            </div>
            <div className="prose prose-sm max-h-[400px] overflow-y-auto scrollbar-hide">
              <div className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                {aiResponse}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeCategory === cat 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule, idx) => (
            <div key={idx} className="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-50 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-[0.15em] mb-2.5 block w-max">
                    {rule.category}
                  </span>
                  <h3 className="font-black text-xl text-slate-800 tracking-tight">{rule.title}</h3>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100">
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold mb-4">
                    {rule.desc_en}
                  </p>
                  <p className="text-xs text-indigo-700 tamil-font leading-relaxed font-bold italic border-l-4 border-indigo-200 pl-4">
                    {rule.desc_ta}
                  </p>
                </div>

                {/* Examples Section */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Example Practice</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {rule.examples.map((ex, i) => (
                      <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm group/ex hover:border-emerald-200 transition-colors">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{ex.label}</span>
                        <span className="font-uthmani text-2xl text-slate-800 group-hover/ex:text-emerald-700 transition-colors">{ex.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-6">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs shrink-0">💡</span>
                    <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed pt-1">{rule.tip_en}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs shrink-0">📍</span>
                    <p className="text-[11px] text-emerald-700 tamil-font font-bold leading-relaxed pt-1">{rule.tip_ta}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-[3.5rem] border border-dashed border-slate-200">
             <p className="text-5xl mb-6 grayscale opacity-20">📖</p>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Explore another rule</p>
          </div>
        )}
      </div>

      {/* Methodology Section */}
      <div className="bg-emerald-900 p-8 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden mt-10">
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
        <h3 className="font-black text-white mb-6 flex items-center gap-3 uppercase text-[10px] tracking-[0.2em]">
          <span className="text-xl">🏆</span> Why Tajweed Matters
        </h3>
        <div className="space-y-4">
          <p className="text-emerald-100 text-[11px] leading-relaxed font-medium">
            Reciting with Tajweed is not just about rules; it's about preserving the original sound revealed to the Prophet (PBUH). 
          </p>
          <p className="text-emerald-200 tamil-font text-[11px] leading-relaxed font-bold italic">
            தஜ்வீத் என்பது வெறும் சட்டங்கள் மட்டுமல்ல; அது குர்ஆன் அருளப்பட்ட அதே தூய ஒலியில் ஓதுவதாகும்.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TajweedTips;
