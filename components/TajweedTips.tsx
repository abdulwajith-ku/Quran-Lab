
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Rule {
  title: string;
  category: string;
  desc_en: string;
  desc_ta: string;
  example: string;
}

const TAJWEED_RULES: Rule[] = [
  // Noon Sakinah & Tanween
  {
    category: "Noon Sakinah",
    title: "Izhaar (إظهار)",
    desc_en: "Clear pronunciation of Noon Sakinah or Tanween when followed by Throat letters.",
    desc_ta: "தொண்டை எழுத்துக்கள் வரும்போது நூன் சாக்கின் அல்லது தன்வீனினைத் தெளிவாக ஓதுதல்.",
    example: "مِنْ هَادٍ"
  },
  {
    category: "Noon Sakinah",
    title: "Idghaam (إدغام)",
    desc_en: "Merging the Noon Sakinah or Tanween into the following letter.",
    desc_ta: "நூன் சாக்கின் அல்லது தன்வீனினை அடுத்து வரும் எழுத்துடன் இணைத்து ஓதுதல்.",
    example: "مَنْ يَقُولُ"
  },
  {
    category: "Noon Sakinah",
    title: "Iqlaab (إقلاب)",
    desc_en: "Changing Noon Sakinah or Tanween into a small 'Meem' when followed by 'Ba'.",
    desc_ta: "நூன் சாக்கின் அல்லது தன்வீனினை அடுத்து 'பா' வரும்போது அதை 'மீம்' ஆக மாற்றி ஓதுதல்.",
    example: "مِنْ بَعْدِ"
  },
  {
    category: "Noon Sakinah",
    title: "Ikhfaa (إخفاء)",
    desc_en: "Hiding the sound of Noon Sakinah or Tanween with a slight nasal sound.",
    desc_ta: "நூன் சாக்கின் அல்லது தன்வீனினை மறைத்து இலேசான மூக்கொலியுடன் ஓதுதல்.",
    example: "أَنْ كَانَ"
  },
  // Meem Sakinah
  {
    category: "Meem Sakinah",
    title: "Ikhfaa Shafawi (إخفاء شفوي)",
    desc_en: "Hiding the Meem Sakinah when followed by 'Ba' with Ghunnah.",
    desc_ta: "மீம் சாக்கினை அடுத்து 'பா' வரும்போது குன்னாவோடு மறைத்து ஓதுதல்.",
    example: "تَرْمِيهِمْ بِحِجَارَةٍ"
  },
  {
    category: "Meem Sakinah",
    title: "Izhaar Shafawi (إظهار شفوي)",
    desc_en: "Pronouncing Meem Sakinah clearly when followed by any letter except 'Ba' or 'Meem'.",
    desc_ta: "'பா' மற்றும் 'மீம்' தவிர மற்ற எழுத்துக்கள் வரும்போது மீம் சாக்கினைத் தெளிவாக ஓதுதல்.",
    example: "لَكُمْ دِينُكُمْ"
  },
  // Madd
  {
    category: "Madd (Prolongation)",
    title: "Madd Muttasil (مصل)",
    desc_en: "Compulsory prolongation of 4-5 counts when Hamzah follows Madd in the same word.",
    desc_ta: "ஒரே வார்த்தையில் மத் எழுத்தைத் தொடர்ந்து ஹம்ஸா வரும்போது 4-5 மாத்திரை அளவு நீட்டி ஓதுதல்.",
    example: "السَّمَاءُ"
  },
  {
    category: "Madd (Prolongation)",
    title: "Madd Munfasil (منفصل)",
    desc_en: "Prolongation of 2, 4, or 5 counts when Hamzah follows Madd in the next word.",
    desc_ta: "மத் எழுத்தைத் தொடர்ந்து அடுத்த வார்த்தையின் ஆரம்பத்தில் ஹம்ஸா வரும்போது நீட்டி ஓதுதல்.",
    example: "إِنَّا أَعْطَيْنَاكَ"
  },
  // Others
  {
    category: "General Rules",
    title: "Qalqalah (قلقلة)",
    desc_en: "Bouncing or echoing sound when these letters have Sukun.",
    desc_ta: "சுகூன் பெற்ற நிலையில் இந்த எழுத்துக்கள் வரும்போது ஒலி எதிரொலித்தல்.",
    example: "ق , ط , ب , ج , د"
  },
  {
    category: "General Rules",
    title: "Ghunnah (غنة)",
    desc_en: "A nasal sound produced from the nose for 2 counts for Mushaddad Noon and Meem.",
    desc_ta: "நூன் மற்றும் மீம் ஷத்தா பெற்று வரும்போது மூக்கிலிருந்து வெளிப்படும் 2 மாத்திரை அளவு ஒலி.",
    example: "نّ , مّ"
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
      const prompt = `Explain the Tajweed rule or concept: "${searchQuery}". 
      Provide a concise explanation in English and Tamil. 
      Include examples from the Quran. 
      Format clearly with headings.`;
      
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl rotate-12">✨</div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-2 italic tracking-tight">Tajweed Handbook</h2>
          <p className="text-indigo-100 text-xs font-medium max-w-xs leading-relaxed">
            "Recite the Quran with measured recitation (Tartil)" 
            <span className="block mt-1 opacity-60">— Surah Al-Muzzammil</span>
          </p>
        </div>
      </div>

      {/* AI Tajweed Assistant Search */}
      <div className="space-y-3">
        <div className="relative group">
          <input 
            type="text"
            placeholder="Ask AI about any Tajweed rule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            className="w-full bg-white border border-slate-200 rounded-3xl py-4 pl-6 pr-24 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          <button 
            onClick={handleAskAI}
            disabled={isAsking}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isAsking ? '...' : 'Ask AI'}
          </button>
        </div>

        {aiResponse && (
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] animate-in zoom-in duration-300 relative">
            <button 
              onClick={() => setAiResponse(null)}
              className="absolute top-4 right-4 text-indigo-300 hover:text-indigo-600"
            >✕</button>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎓</span>
              <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">AI Expert Explanation</h4>
            </div>
            <div className="prose prose-sm prose-indigo">
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                {aiResponse}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeCategory === cat 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 block">
                    {rule.category}
                  </span>
                  <h3 className="font-black text-lg text-slate-800 tracking-tight">{rule.title}</h3>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-2xl">
                  <span className="quran-font text-2xl text-indigo-700">{rule.example}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-1.5 h-auto bg-slate-100 rounded-full shrink-0"></div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {rule.desc_en}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-auto bg-indigo-200 rounded-full shrink-0"></div>
                  <p className="text-xs text-indigo-700 tamil-font leading-relaxed font-bold italic">
                    {rule.desc_ta}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
             <p className="text-4xl mb-4">📖</p>
             <p className="text-slate-400 text-sm font-medium italic">No rules found in this category.</p>
          </div>
        )}
      </div>
      
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full"></div>
        <h4 className="font-black mb-3 text-indigo-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
          <span>🧠</span> Pro Tip for Hifz
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed relative z-10">
          Reciting with proper Tajweed makes memorization significantly easier as the rules create mental anchors and rhythmic patterns. 
          The Quran was revealed with these sounds—learning them is learning its heart.
        </p>
      </div>
    </div>
  );
};

export default TajweedTips;
