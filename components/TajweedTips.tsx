
import React from 'react';

const TajweedTips: React.FC = () => {
  const rules = [
    {
      title: "Ghunnah (غنة)",
      desc_en: "A nasal sound produced from the nose for 2 counts.",
      desc_ta: "மூக்கிலிருந்து வெளிப்படும் 2 மாத்திரை அளவுள்ள ஒலி.",
      example: "نّ , مّ"
    },
    {
      title: "Qalqalah (قلقلة)",
      desc_en: "Bouncing or echoing sound when these letters have Sukun.",
      desc_ta: "சுகூன் பெற்ற நிலையில் இந்த எழுத்துக்கள் வரும்போது ஒலி எதிரொலித்தல்.",
      example: "ق , ط , ب , ج , د"
    },
    {
      title: "Ikhfa (إخفاء)",
      desc_en: "To hide the sound of Noon Sakinah or Tanween.",
      desc_ta: "நூன் சாக்கின் அல்லது தன்வீனினை மறைத்து ஓதுதல்.",
      example: "أَنْ كَانَ"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 p-8 rounded-3xl text-white">
        <h2 className="text-2xl font-bold mb-2 italic">Tartil & Tajweed</h2>
        <p className="text-indigo-100 text-sm">\"Recite the Quran with measured recitation (Tartil)\" - Surah Al-Muzzammil</p>
      </div>

      <div className="space-y-4">
        {rules.map((rule, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">{rule.title}</h3>
              <span className="quran-font text-2xl text-indigo-600">{rule.example}</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-slate-200 pl-3">
                {rule.desc_en}
              </p>
              <p className="text-sm text-slate-500 tamil-font leading-relaxed border-l-2 border-indigo-200 pl-3">
                {rule.desc_ta}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-slate-900 text-white p-6 rounded-3xl">
        <h4 className="font-bold mb-2 text-indigo-400">Pro Tip for Hifz</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Reciting with Tajweed makes memorization easier as the rhythm and rules create patterns in your mind. 
          Never sacrifice Tajweed for speed!
        </p>
      </div>
    </div>
  );
};

export default TajweedTips;
