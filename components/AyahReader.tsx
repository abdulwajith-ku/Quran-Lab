
import React, { useState, useRef, useEffect } from 'react';
import { Surah, Ayah, Word, TajweedRule, QuranScript, QuranFontSize } from '../types';
import { fetchSurahData, getWordByWordTranslation, getAyahTajweedRules } from '../services/quranService';

interface AyahReaderProps {
  surahId: number;
  script: QuranScript;
  setScript: (s: QuranScript) => void;
  fontSize: QuranFontSize;
  setFontSize: (s: QuranFontSize) => void;
  onBack: () => void;
  isAyahMemorized: (surahId: number, ayahNum: number) => boolean;
  isAyahRecited: (surahId: number, ayahNum: number) => boolean;
  toggleStatus: (surahId: number, ayahNum: number, type: 'hifz' | 'recite') => void;
}

const BISMILLAH_TEXT = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

const AyahReader: React.FC<AyahReaderProps> = ({ surahId, script, setScript, fontSize, setFontSize, onBack, isAyahMemorized, isAyahRecited, toggleStatus }) => {
  const [surah, setSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWordByWord, setShowWordByWord] = useState(true);
  const [isMushafMode, setIsMushafMode] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [wbwData, setWbwData] = useState<Record<number, Word[]>>({});
  const [tajweedData, setTajweedData] = useState<Record<number, TajweedRule[]>>({});
  const [loadingTajweed, setLoadingTajweed] = useState<Record<number, boolean>>({});
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchSurahData(surahId);
        setSurah(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [surahId]);

  const loadWbw = async (ayah: Ayah) => {
    if (wbwData[ayah.number]) return;
    const words = await getWordByWordTranslation(ayah.text);
    setWbwData(prev => ({ ...prev, [ayah.number]: words }));
  };

  const loadTajweed = async (ayah: Ayah) => {
    if (tajweedData[ayah.number]) return;
    setLoadingTajweed(prev => ({ ...prev, [ayah.number]: true }));
    try {
      const rules = await getAyahTajweedRules(ayah.text);
      setTajweedData(prev => ({ ...prev, [ayah.number]: rules }));
    } finally {
      setLoadingTajweed(prev => ({ ...prev, [ayah.number]: false }));
    }
  };

  const getAudioUrl = (sId: number, aNum: number) => {
    const sPadded = sId.toString().padStart(3, '0');
    const aPadded = aNum.toString().padStart(3, '0');
    return `https://everyayah.com/data/Alafasy_128kbps/${sPadded}${aPadded}.mp3`;
  };

  const playAyahAudio = (ayahNum: number) => {
    if (playingAyah === ayahNum) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAyah(null);
      return;
    }

    if (audioRef.current) audioRef.current.pause();

    const audioUrl = getAudioUrl(surahId, ayahNum);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingAyah(ayahNum);

    audio.play();
    audio.onended = () => setPlayingAyah(null);
  };

  const getFontSizeClass = (isMushaf: boolean) => {
    if (isMushaf) {
        switch(fontSize) {
            case 'sm': return 'text-3xl leading-[4rem]';
            case 'md': return 'text-5xl leading-[5rem]';
            case 'lg': return 'text-6xl leading-[6rem]';
            case 'xl': return 'text-7xl leading-[7rem]';
            default: return 'text-5xl leading-[5rem]';
        }
    } else {
        switch(fontSize) {
            case 'sm': return 'text-2xl leading-[3.5rem]';
            case 'md': return 'text-4xl leading-[4.5rem]';
            case 'lg': return 'text-5xl leading-[5.5rem]';
            case 'xl': return 'text-6xl leading-[6.5rem]';
            default: return 'text-4xl leading-[4.5rem]';
        }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 w-1/3 bg-slate-200 rounded-lg mb-8"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-slate-100 rounded-3xl"></div>
        ))}
      </div>
    );
  }

  if (!surah) return <div>Error loading Surah.</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-emerald-700 font-bold flex items-center gap-1 hover:bg-emerald-50 px-3 py-1 rounded-xl transition-colors">
          ← Back
        </button>
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-800">{surah.name}</h2>
          <span className="text-slate-400 text-xs font-medium">{surah.name_ar} • {surah.total_ayahs} Ayahs</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 pb-2 scrollbar-hide items-center">
        <button 
          onClick={() => setIsMushafMode(!isMushafMode)}
          className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
            isMushafMode ? 'bg-slate-800 border-slate-700 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          {isMushafMode ? 'Standard View' : 'Mushaf Mode'}
        </button>

        <div className="bg-slate-100 p-1 rounded-full flex gap-1 border border-slate-200">
           <button 
            onClick={() => setScript('uthmani')}
            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
              script === 'uthmani' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Uthmani
          </button>
          <button 
            onClick={() => setScript('indopak')}
            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
              script === 'indopak' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Indo-Pak
          </button>
        </div>

        <div className="bg-slate-100 p-1 rounded-full flex gap-1 border border-slate-200">
           {(['sm', 'md', 'lg', 'xl'] as QuranFontSize[]).map(size => (
             <button 
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                  fontSize === size ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                {size}
              </button>
           ))}
        </div>

        {!isMushafMode && (
          <button 
            onClick={() => setShowWordByWord(!showWordByWord)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              showWordByWord ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm' : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            {showWordByWord ? 'Word-By-Word ON' : 'Word-By-Word OFF'}
          </button>
        )}
      </div>

      <div className={`${isMushafMode ? 'bg-white border border-slate-100 rounded-[3rem] p-10 shadow-lg space-y-8' : 'space-y-12'}`}>
        {surah.ayahs.map((ayah) => {
          const showBismillahHeader = ayah.number === 1 && surah.id !== 1 && surah.id !== 9;
          const arabicClass = script === 'uthmani' ? 'font-uthmani' : 'font-indopak';
          const fontSizeClass = getFontSizeClass(isMushafMode);

          if (isMushafMode) {
            return (
              <div key={ayah.number} className="animate-in fade-in duration-700">
                {showBismillahHeader && (
                  <div className="text-center mb-10">
                    <div className={`${arabicClass} ${fontSizeClass} text-slate-800 tracking-widest leading-relaxed`}>
                      {BISMILLAH_TEXT}
                    </div>
                    <div className="h-0.5 w-32 bg-slate-100 mx-auto mt-6 rounded-full"></div>
                  </div>
                )}
                <div 
                  id={`ayah-${ayah.number}`}
                  onClick={() => playAyahAudio(ayah.number)}
                  className={`relative cursor-pointer group transition-all duration-500 ${
                    playingAyah === ayah.number ? 'bg-emerald-50/50 -mx-4 px-4 py-2 rounded-2xl' : ''
                  }`}
                >
                  <div className={`${arabicClass} ${fontSizeClass} text-right text-slate-800 dir-rtl selection:bg-emerald-200 tracking-wide font-medium`}>
                    {ayah.text}
                    <span className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 border border-slate-200 rounded-full text-[14px] font-black font-sans mx-4 align-middle text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {ayah.number}
                    </span>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-2">
                    {isAyahMemorized(surah.id, ayah.number) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                    {isAyahRecited(surah.id, ayah.number) && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={ayah.number} 
              id={`ayah-${ayah.number}`}
              className={`bg-white border transition-all duration-700 rounded-[3rem] p-8 shadow-sm hover:shadow-xl ${
                playingAyah === ayah.number ? 'ring-2 ring-emerald-500 bg-emerald-50/20 scale-[1.02]' : 'border-slate-100'
              }`}
            >
              {showBismillahHeader && (
                <div className="text-center mb-8 animate-in fade-in duration-1000">
                  <div className={`${arabicClass} ${fontSizeClass} text-slate-800 tracking-widest leading-relaxed`}>
                    {BISMILLAH_TEXT}
                  </div>
                  <div className="h-0.5 w-24 bg-emerald-100 mx-auto mt-4 rounded-full"></div>
                </div>
              )}

              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-emerald-700 flex items-center justify-center text-[10px] font-black border border-slate-100 shadow-inner">
                    {ayah.number}
                  </div>
                  <button 
                    onClick={() => playAyahAudio(ayah.number)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      playingAyah === ayah.number ? 'bg-emerald-600 text-white shadow-xl scale-110' : 'bg-white text-emerald-700 border border-slate-200 shadow-md hover:bg-emerald-50'
                    }`}
                  >
                    {playingAyah === ayah.number ? '⏸' : '▶'}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleStatus(surah.id, ayah.number, 'recite')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border ${
                      isAyahRecited(surah.id, ayah.number) 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                        : 'bg-white text-blue-500 border-blue-100 hover:bg-blue-50'
                    }`}
                  >
                    {isAyahRecited(surah.id, ayah.number) ? 'Recited ✓' : 'Mark Recited'}
                  </button>
                  <button 
                    onClick={() => toggleStatus(surah.id, ayah.number, 'hifz')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border ${
                      isAyahMemorized(surah.id, ayah.number) 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                        : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                    }`}
                  >
                    {isAyahMemorized(surah.id, ayah.number) ? 'Hifz ✓' : 'Mark Hifz'}
                  </button>
                </div>
              </div>

              <div className={`${arabicClass} ${fontSizeClass} text-right mb-10 text-slate-800 dir-rtl selection:bg-emerald-200 tracking-wide`}>
                {ayah.text}
              </div>

              {showWordByWord && (
                <div className="mb-10">
                  {wbwData[ayah.number] ? (
                    <div className="flex flex-wrap flex-row-reverse gap-4 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                      {wbwData[ayah.number].map((word, idx) => (
                        <div key={idx} className="flex flex-col items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm min-w-[85px] hover:border-emerald-200 transition-colors cursor-default group text-center">
                          <span className={`${arabicClass} text-xl text-emerald-900 mb-2 group-hover:scale-110 transition-transform`}>{word.arabic}</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mb-1 leading-none">{word.english}</span>
                          <span className="text-[10px] text-emerald-600 font-bold tamil-font italic leading-none">{word.tamil}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button 
                      onClick={() => loadWbw(ayah)}
                      className="w-full py-6 border-2 border-dashed border-emerald-100 rounded-[2.5rem] text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-center gap-3"
                    >
                      <span>✨</span> Generate Tamil Word-By-Word
                    </button>
                  )}
                </div>
              )}

              <div className="mb-10">
                {tajweedData[ayah.number] ? (
                  <div className="bg-indigo-50/50 rounded-[2.5rem] p-6 border border-indigo-100 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">✨</span>
                      <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Tajweed & Tartil Guide</h4>
                    </div>
                    <div className="space-y-4">
                      {tajweedData[ayah.number].map((rule, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-indigo-50 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-lg uppercase tracking-wider">{rule.rule}</span>
                            <span className={`${arabicClass} text-sm text-indigo-900 font-bold`}>{rule.location}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-1 font-medium">{rule.explanation_en}</p>
                          <p className="text-xs text-indigo-700 tamil-font leading-relaxed italic">{rule.explanation_ta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => loadTajweed(ayah)}
                    disabled={loadingTajweed[ayah.number]}
                    className="w-full py-5 bg-indigo-50 text-indigo-700 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loadingTajweed[ayah.number] ? (
                      <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <><span>💎</span> View Tajweed & Tartil Guide</>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-6 pt-8 border-t border-slate-100">
                <div className="flex gap-4">
                  <span className="text-[10px] font-black text-slate-300 uppercase mt-1.5 w-6 shrink-0">EN</span>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium italic">{ayah.translation_en}</p>
                </div>
                <div className="flex gap-4">
                  <span className="text-[10px] font-black text-emerald-200 uppercase mt-1.5 w-6 shrink-0">TA</span>
                  <p className="text-sm text-slate-500 tamil-font leading-relaxed font-medium">{ayah.translation_ta}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AyahReader;
