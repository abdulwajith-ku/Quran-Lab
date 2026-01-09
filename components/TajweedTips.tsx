
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Rule {
  title: string;
  category: string;
  desc_en: string;
  desc_ta: string;
  tip_en: string;
  tip_ta: string;
  example: string;
  letters?: string;
}

const TAJWEED_RULES: Rule[] = [
  // Qalqalah
  {
    category: "Qalqalah",
    title: "Echoing Sound (قلقلة)",
    desc_en: "An echoing sound produced when the letters (ق ط ب ج د) are Sakin. There are 3 levels: Kubra (major), Wusta (middle), and Sughra (minor).",
    desc_ta: "குத்பு ஜத்தின் (ق ط ب ج د) ஆகிய எழுத்துக்களுக்கு சுக்கூன் இருக்கும்போது ஒருவித அதிரும் சத்தத்துடன் ஓதுதல்.",
    tip_en: "Bounce the sound off. Don't let it be flat.",
    tip_ta: "ஒலியை அதிரச் செய்யவும். தட்டையாக ஓத வேண்டாம்.",
    example: "الْفَلَقِ",
    letters: "ق ط ب ج د"
  },
  // Ghunnah
  {
    category: "Ghunnah",
    title: "Nasal Sound (غنة)",
    desc_en: "A 2-count nasal sound that is obligatory when Noon (ن) or Meem (م) has a Shaddah.",
    desc_ta: "நூன் (ن) அல்லது மீம் (م) எழுத்துக்களுக்கு ஷத்தா இருக்கும்போது 2 மாத்திரை அளவு மூக்கொலியுடன் ஓதுவது கடமையாகும்.",
    tip_en: "Hold the sound in your nose for exactly 2 seconds.",
    tip_ta: "ஒலியை மூக்கினுள் சரியாக 2 மாத்திரை அளவு நிறுத்தி ஓதவும்.",
    example: "إِنَّ / ثُمَّ",
    letters: "نّ مّ"
  },
  // Noon Sakinah & Tanween
  {
    category: "Noon Sakinah",
    title: "Ikhfa (إخفاء)",
    desc_en: "Hiding the sound of Noon. Pronounce it between Izhaar and Idghaam with a Ghunnah.",
    desc_ta: "நூன் ஒலியை மறைத்து ஓதுதல். இது இழ்ஹாருக்கும் இத் காமிற்கும் இடைப்பட்ட ஒரு நிலையாகும்.",
    tip_en: "Prepare your mouth for the next letter while making the nasal sound.",
    tip_ta: "மூக்கொலியை உருவாக்கும்போதே அடுத்த எழுத்தை ஓத வாயைத் தயார் செய்யவும்.",
    example: "مِنْ قَبْلُ",
    letters: "ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك"
  },
  {
    category: "Noon Sakinah",
    title: "Iqlab (إقلاب)",
    desc_en: "Changing the sound of Noon/Tanween into a Meem when followed by 'Ba' (ب).",
    desc_ta: "நூன் அல்லது தன்வீனை அடுத்து 'பா' (ب) வரும்போது நூன் ஒலியை 'மீம்' ஆக மாற்றி ஓதுதல்.",
    tip_en: "Lightly close your lips. Don't press them too hard.",
    tip_ta: "உதடுகளை இலேசாக மூடவும். பலமாக அழுத்த வேண்டாம்.",
    example: "مِنْ بَعْدِ",
    letters: "ب"
  },
  // More Makharij
  {
    category: "Makharij",
    title: "Al-Lisaan (The Tongue)",
    desc_en: "The tongue has 18 letters emerging from 10 different points. Crucial for clear speech.",
    desc_ta: "நாவிலிருந்து 18 எழுத்துக்கள் பிறக்கின்றன. இது தெளிவான ஓதுதலுக்கு மிக முக்கியமானது.",
    tip_en: "Notice if the tip, middle, or back of your tongue is touching the palate.",
    tip_ta: "நாவின் நுனி, நடு அல்லது பின்பகுதி அண்ணத்தைத் தொடுகிறதா என்பதை கவனிக்கவும்.",
    example: "ق ك ج ش ي ض ل ن ر ط د ت ص ز س ظ ذ ث"
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
      const prompt = `You are an expert Quran Teacher. Explain the Tajweed rule or concept: "${searchQuery}". 
      Include: 
      1. Technical Definition (EN & TA)
      2. Practical "How to do it" steps (EN & TA)
      3. Quranic examples.
      Keep the formatting very clean and easy to read on mobile.`;
      
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
          <h2 className="text-2xl font-black mb-1 italic tracking-tight">Recitation Science</h2>
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">Tajweed & Tartil Guide</p>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
            <span className="text-3xl">🎙️</span>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              "Tajweed is giving every letter its right and its due."
            </p>
          </div>
        </div>
      </div>

      {/* AI Tajweed Assistant Search */}
      <div className="space-y-3">
        <div className="relative group">
          <input 
            type="text"
            placeholder="Ask AI teacher about any rule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-6 pr-24 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
          />
          <button 
            onClick={handleAskAI}
            disabled={isAsking}
            className="absolute right-1.5 top-1.5 bottom-1.5 bg-indigo-600 text-white px-4 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isAsking ? '...' : 'Ask AI'}
          </button>
        </div>

        {aiResponse && (
          <div className="bg-white border border-indigo-100 p-6 rounded-[2rem] animate-in zoom-in duration-300 relative shadow-xl">
            <button 
              onClick={() => setAiResponse(null)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 p-2"
            >✕</button>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">🎓</span>
              <h4 className="text-[9px] font-black text-indigo-900 uppercase tracking-widest">AI Expert Breakdown</h4>
            </div>
            <div className="prose prose-sm prose-indigo max-h-[400px] overflow-y-auto scrollbar-hide">
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
            className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
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
      <div className="grid grid-cols-1 gap-4">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-50 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-5 relative z-10">
                <div>
                  <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-[0.1em] mb-2 block w-max">
                    {rule.category}
                  </span>
                  <h3 className="font-black text-lg text-slate-800 tracking-tight">{rule.title}</h3>
                </div>
                <div className="bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
                  <span className="font-uthmani text-2xl text-indigo-700">{rule.example}</span>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[11px] text-slate-700 leading-relaxed font-semibold mb-3">
                    {rule.desc_en}
                  </p>
                  <p className="text-[11px] text-indigo-700 tamil-font leading-relaxed font-bold italic">
                    {rule.desc_ta}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">💡</span>
                    <p className="text-[10px] text-slate-500 font-medium italic">{rule.tip_en}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px]">📍</span>
                    <p className="text-[10px] text-emerald-700 tamil-font font-bold">{rule.tip_ta}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
             <p className="text-4xl mb-4 grayscale opacity-20">📖</p>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No matching rules</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TajweedTips;
