
import React from 'react';
import { FontSize, QuranScript } from '../types';

interface SettingsProps {
  mushafMode: boolean;
  setMushafMode: (v: boolean) => void;
  showWordByWord: boolean;
  setShowWordByWord: (v: boolean) => void;
  showTajweed: boolean;
  setShowTajweed: (v: boolean) => void;
  showEnglish: boolean;
  setShowEnglish: (v: boolean) => void;
  showTamil: boolean;
  setShowTamil: (v: boolean) => void;
  quranScript: QuranScript;
  setQuranScript: (v: QuranScript) => void;
  arabicFontSize: FontSize;
  setArabicFontSize: (v: FontSize) => void;
  englishFontSize: FontSize;
  setEnglishFontSize: (v: FontSize) => void;
  tamilFontSize: FontSize;
  setTamilFontSize: (v: FontSize) => void;
}

const Settings: React.FC<SettingsProps> = ({
  mushafMode, setMushafMode,
  showWordByWord, setShowWordByWord,
  showTajweed, setShowTajweed,
  showEnglish, setShowEnglish,
  showTamil, setShowTamil,
  quranScript, setQuranScript,
  arabicFontSize, setArabicFontSize,
  englishFontSize, setEnglishFontSize,
  tamilFontSize, setTamilFontSize,
}) => {
  const fontSizes: FontSize[] = ['sm', 'md', 'lg', 'xl'];

  const SettingSection = ({ title, icon, children }: { title: string, icon: string, children?: React.ReactNode }) => (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{icon}</span>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }: { label: string, desc: string, value: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2 group cursor-pointer" onClick={() => onChange(!value)}>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-slate-800 transition-colors group-hover:text-emerald-700">{label}</h4>
        <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
      </div>
      <button 
        className={`w-12 h-6 rounded-full transition-all relative pointer-events-none ${value ? 'bg-emerald-600 shadow-inner' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${value ? 'left-7' : 'left-1'}`}></div>
      </button>
    </div>
  );

  const SizePicker = ({ label, value, onChange, theme }: { label: string, value: FontSize, onChange: (v: FontSize) => void, theme: 'emerald' | 'slate' | 'indigo' }) => {
    const activeColors = {
      emerald: 'bg-emerald-600 text-white',
      slate: 'bg-slate-600 text-white',
      indigo: 'bg-indigo-600 text-white'
    };
    const labelColors = {
      emerald: 'text-emerald-600',
      slate: 'text-slate-600',
      indigo: 'text-indigo-600'
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-500 uppercase">{label}</span>
          <span className={`text-[10px] font-black uppercase ${labelColors[theme]}`}>{value}</span>
        </div>
        <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-100 shadow-inner">
          {fontSizes.map(size => (
            <button
              key={size}
              onClick={() => onChange(size)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                value === size ? activeColors[theme] + ' shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-emerald-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl rotate-12">⚙️</div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-1 italic tracking-tight">Settings</h2>
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Customize your experience</p>
        </div>
      </div>

      <SettingSection title="Reading Preferences" icon="📖">
        <Toggle 
          label="Mushaf Mode" 
          desc="Full-width Arabic text for focused reading" 
          value={mushafMode} 
          onChange={setMushafMode} 
        />
        <div className="h-[1px] bg-slate-50 w-full"></div>
        <Toggle 
          label="Word-By-Word" 
          desc="Show meanings per word" 
          value={showWordByWord} 
          onChange={setShowWordByWord} 
        />
        <div className="h-[1px] bg-slate-50 w-full"></div>
        <Toggle 
          label="Tajweed & Tartil" 
          desc="Show recitation rules and guides" 
          value={showTajweed} 
          onChange={setShowTajweed} 
        />
        <div className="h-[1px] bg-slate-50 w-full"></div>
        <Toggle 
          label="English Translation" 
          desc="Show Sahih International English translation" 
          value={showEnglish} 
          onChange={setShowEnglish} 
        />
        <div className="h-[1px] bg-slate-50 w-full"></div>
        <Toggle 
          label="Tamil Translation" 
          desc="Show John Trusty Tamil translation" 
          value={showTamil} 
          onChange={setShowTamil} 
        />
      </SettingSection>

      <SettingSection title="Typography Control" icon="✍️">
        <SizePicker label="Arabic Font Size" value={arabicFontSize} onChange={setArabicFontSize} theme="emerald" />
        <SizePicker label="English Font Size" value={englishFontSize} onChange={setEnglishFontSize} theme="slate" />
        <SizePicker label="Tamil Font Size" value={tamilFontSize} onChange={setTamilFontSize} theme="indigo" />
      </SettingSection>

      <SettingSection title="Script Style" icon="📜">
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 shadow-inner">
          <button
            onClick={() => setQuranScript('uthmani')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              quranScript === 'uthmani' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500'
            }`}
          >
            Uthmani
          </button>
          <button
            onClick={() => setQuranScript('indopak')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              quranScript === 'indopak' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500'
            }`}
          >
            IndoPak
          </button>
        </div>
      </SettingSection>

      <div className="text-center py-6">
        <p className="text-slate-300 text-[9px] font-black uppercase tracking-widest">Al-Hifz Companion v1.2</p>
      </div>
    </div>
  );
};

export default Settings;
