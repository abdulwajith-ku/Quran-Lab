
import React, { useState, useRef, useEffect } from 'react';
import { Surah, Ayah, Word, TajweedRule, QuranScript, FontSize } from '../types';
import { fetchSurahData, getWordByWordTranslation, getAyahTajweedRules } from '../services/quranService';

interface AyahReaderProps {
  surahId: number;
  script: QuranScript;
  setScript: (s: QuranScript) => void;
  arabicFontSize: FontSize;
  setArabicFontSize: (s: FontSize) => void;
  englishFontSize: FontSize;
  setEnglishFontSize: (s: FontSize) => void;
  tamilFontSize: FontSize;
  setTamilFontSize: (s: FontSize) => void;
  onBack: () => void;
  isAyahMemorized: (surahId: number, ayahNum: number) => boolean;
  isAyahRecited: (surahId: number, ayahNum: number) => boolean;
  toggleStatus: (surahId: number, ayahNum: number, type: 'hifz' | 'recite') => void;
}

const BISMILLAH_TEXT = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

const AyahReader: React.FC<AyahReaderProps> = ({ 
  surahId, script, setScript, 
  arabicFontSize, setArabicFontSize, 
  englishFontSize, setEnglishFontSize, 
  tamilFontSize, setTamilFontSize,
  onBack, isAyahMemorized, isAyahRecited, toggleStatus 
}) => {
  const [surah, setSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWordByWord, setShowWordByWord] = useState(true);
  const [showTajweed, setShowTajweed] = useState(true);
  const [isMushafMode, setIsMushafMode] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [wbwData, setWbwData] = useState<Record<number, Word[]>>({});
  const [tajweedData, setTajweedData] = useState<Record<number, TajweedRule[]>>({});
  const [loadingTajweed, setLoadingTajweed] = useState<Record<number, boolean>>({});
  const [loadingWbw, setLoadingWbw] = useState<Record<number, boolean>>({});
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initial Surah Load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchSurahData(surahId);
        setSurah(data);
        // Pre-fetch first 5 Ayahs immediately for "instant" feel
        data.ayahs.slice(0, 5).forEach(ayah => {
          preFetchAyahDetails(ayah);
        });
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

  const preFetchAyahDetails = async (ayah: Ayah) => {
    loadWbw(ayah);
    loadTajweed(ayah);
  };

  const loadWbw = async (ayah: Ayah) => {
    if (wbwData[ayah.number] || loadingWbw[ayah.number]) return;
    setLoadingWbw(prev => ({ ...prev, [ayah.number]: true }));
    try {
      const words = await getWordByWordTranslation(ayah.text);
      setWbwData(prev => ({ ...prev, [ayah.number]: words }));
    } finally {
      setLoadingWbw(prev => ({ ...prev, [ayah.number]: false }));
    }
  };

  const loadTajweed = async (ayah: Ayah) => {
    if (tajweedData[ayah.number] || loadingTajweed[ayah.number]) return;
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
    audio.playbackRate = playbackSpeed;
    audioRef.current = audio;
    setPlayingAyah(ayahNum);
    audio.play();
    audio.onended = () => setPlayingAyah(null);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const getArabicFontSizeClass = (isMushaf: boolean) => {
    if (isMushaf) {
        switch(arabicFontSize) {
            case 'sm': return 'text-3xl leading-[4.5rem]';
            case 'md': return 'text-5xl leading-[6rem]';
            case 'lg': return 'text-6xl leading-[7rem]';
            case 'xl': return 'text-7xl leading-[8.5rem]';
            default: return 'text-5xl leading-[6rem]';
        }
    } else {
        switch(arabicFontSize) {
            case 'sm': return 'text-2xl leading-[4rem]';
            case 'md': return 'text-4xl leading-[5rem]';
            case 'lg': return 'text-5xl leading-[6rem]';
            case 'xl': return 'text-6xl leading-[7.5rem]';
            default: return 'text-4xl leading-[5rem]';
        }
    }
  };

  const getEnglishFontSizeClass = () => {
    switch(englishFontSize) {
      case 'sm': return 'text-[11px]';
      case 'md': return 'text-sm';
      case 'lg': return 'text-base';
      case 'xl': return 'text-lg';
      default: return 'text-sm';
    }
  };

  const getTamilFontSizeClass = () => {
    switch(tamilFontSize) {
      case 'sm': return 'text-[11px]';
      case 'md': return 'text-sm';
      case 'lg': return 'text-base';
      case 'xl': return 'text-lg';
      default: return 'text-sm';
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
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-emerald-700 font-bold flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors text-sm">
          ← Back
        </button>
        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-800 leading-none mb-1">{surah.name}</h2>
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">{surah.name_ar} • {surah.total_ayahs} Ayahs</span>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {/* Toggle Controls bar */}
        <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <div className="flex gap-1.5 items-center">
            <button 
              onClick={() => setIsMushafMode(!isMushafMode)}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                isMushafMode ? 'bg-slate-800 border-slate-700 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              Mushaf
            </button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
            <button 
              onClick={() => setShowWordByWord(!showWordByWord)}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-1 ${
                showWordByWord ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <span>WBW</span>
              <span className="opacity-50 text-[7px]">{showWordByWord ? 'ON' : 'OFF'}</span>
            </button>
            <button 
              onClick={() => setShowTajweed(!showTajweed)}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-1 ${
                showTajweed ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <span>Tajweed</span>
              <span className="opacity-50 text-[7px]">{showTajweed ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={playbackSpeed} 
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase px-2 py-1 outline-none"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
            <div className="bg-white p-1 rounded-xl flex gap-1 border border-slate-200">
               <button 
                onClick={() => setScript('uthmani')}
                className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${
                  script === 'uthmani' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'
                }`}
              >
                Uth
              </button>
              <button 
                onClick={() => setScript('indopak')}
                className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${
                  script === 'indopak' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'
                }`}
              >
                Pak
              </button>
            </div>
          </div>
        </div>

        {/* Font Controls - Condensed */}
        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm space-y-2">
          {[
            { label: 'AR', color: 'emerald', val: arabicFontSize, setter: setArabicFontSize },
            { label: 'EN', color: 'slate', val: englishFontSize, setter: setEnglishFontSize },
            { label: 'TA', color: 'indigo', val: tamilFontSize, setter: setTamilFontSize }
          ].map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-3">
              <span className={`text-[8px] font-black text-${f.color}-700 uppercase tracking-widest w-4`}>{f.label}</span>
              <div className={`flex-1 bg-${f.color}-50 p-0.5 rounded-lg flex gap-1`}>
                {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map(size => (
                  <button 
                      key={size}
                      onClick={() => f.setter(size)}
                      className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase transition-all ${
                        f.val === size ? `bg-${f.color}-600 text-white shadow-sm` : `text-${f.color}-400`
                      }`}
                    >
                      {size}
                    </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${isMushafMode ? 'bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-lg space-y-6' : 'space-y-8'}`}>
        {surah.ayahs.map((ayah) => {
          const showBismillahHeader = ayah.number === 1 && surah.id !== 1 && surah.id !== 9;
          const arabicClass = script === 'uthmani' ? 'font-uthmani' : 'font-indopak';
          const arabicSizeClass = getArabicFontSizeClass(isMushafMode);
          const englishSizeClass = getEnglishFontSizeClass();
          const tamilSizeClass = getTamilFontSizeClass();

          if (isMushafMode) {
            return (
              <div key={ayah.number} className="animate-in fade-in duration-700">
                {showBismillahHeader && (
                  <div className="text-center mb-6">
                    <div className={`${arabicClass} ${arabicSizeClass} text-slate-800 tracking-widest leading-relaxed`}>
                      {BISMILLAH_TEXT}
                    </div>
                    <div className="h-0.5 w-20 bg-slate-100 mx-auto mt-4 rounded-full"></div>
                  </div>
                )}
                <div 
                  id={`ayah-${ayah.number}`}
                  onClick={() => playAyahAudio(ayah.number)}
                  className={`relative cursor-pointer group transition-all duration-500 ${
                    playingAyah === ayah.number ? 'bg-emerald-50/50 -mx-4 px-4 py-2 rounded-xl' : ''
                  }`}
                >
                  <div className={`${arabicClass} ${arabicSizeClass} text-right text-slate-800 dir-rtl selection:bg-emerald-200 tracking-wide font-medium`}>
                    {ayah.text}
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-slate-50 border border-slate-200 rounded-full text-[12px] font-black font-sans mx-3 align-middle text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {ayah.number}
                    </span>
                  </div>
                  <div className="flex justify-end gap-1.5 mt-1.5">
                    {isAyahMemorized(surah.id, ayah.number) && <span className="w-1 h-1 rounded-full bg-emerald-500"></span>}
                    {isAyahRecited(surah.id, ayah.number) && <span className="w-1 h-1 rounded-full bg-blue-500"></span>}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={ayah.number} 
              id={`ayah-${ayah.number}`}
              className={`bg-white border transition-all duration-500 rounded-[2rem] p-5 shadow-sm hover:shadow-md ${
                playingAyah === ayah.number ? 'ring-2 ring-emerald-500 bg-emerald-50/10' : 'border-slate-100'
              }`}
            >
              {showBismillahHeader && (
                <div className="text-center mb-6 animate-in fade-in">
                  <div className={`${arabicClass} ${arabicSizeClass} text-slate-800 tracking-widest leading-relaxed`}>
                    {BISMILLAH_TEXT}
                  </div>
                  <div className="h-0.5 w-16 bg-emerald-100 mx-auto mt-3 rounded-full"></div>
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 text-emerald-700 flex items-center justify-center text-[9px] font-black border border-slate-100">
                    {ayah.number}
                  </div>
                  <button 
                    onClick={() => playAyahAudio(ayah.number)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      playingAyah === ayah.number ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-700 border border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="text-sm">{playingAyah === ayah.number ? '⏸' : '▶'}</span>
                  </button>
                </div>
                
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => toggleStatus(surah.id, ayah.number, 'recite')}
                    className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border transition-all ${
                      isAyahRecited(surah.id, ayah.number) 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-blue-500 border-blue-100 hover:bg-blue-50'
                    }`}
                  >
                    Recited
                  </button>
                  <button 
                    onClick={() => toggleStatus(surah.id, ayah.number, 'hifz')}
                    className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border transition-all ${
                      isAyahMemorized(surah.id, ayah.number) 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                    }`}
                  >
                    Hifz
                  </button>
                </div>
              </div>

              <div className={`${arabicClass} ${arabicSizeClass} text-right mb-8 text-slate-800 dir-rtl tracking-wide`}>
                {ayah.text}
              </div>

              {showWordByWord && (
                <div className="mb-6">
                  {wbwData[ayah.number] ? (
                    <div className="flex flex-wrap flex-row-reverse gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 animate-in fade-in">
                      {wbwData[ayah.number].map((word, idx) => (
                        <div key={idx} className="flex flex-col items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm min-w-[70px] text-center">
                          <span className={`${arabicClass} text-lg text-emerald-900 mb-1`}>{word.arabic}</span>
                          <span className={`${englishSizeClass} text-slate-400 font-black uppercase tracking-tighter mb-0.5 leading-none`}>{word.english}</span>
                          <span className={`${tamilSizeClass} text-emerald-600 font-bold tamil-font italic leading-none`}>{word.tamil}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button 
                      onClick={() => loadWbw(ayah)}
                      disabled={loadingWbw[ayah.number]}
                      className="w-full py-2 border-2 border-dashed border-emerald-100 rounded-xl text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      {loadingWbw[ayah.number] ? <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span> : 'Word-By-Word ✨'}
                    </button>
                  )}
                </div>
              )}

              {showTajweed && (
                <div className="mb-6">
                  {tajweedData[ayah.number] ? (
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">💎</span>
                        <h4 className="text-[8px] font-black text-indigo-900 uppercase tracking-widest">Tajweed & Tartil</h4>
                      </div>
                      <div className="space-y-3">
                        {tajweedData[ayah.number].map((rule, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-indigo-50 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded uppercase">{rule.rule}</span>
                              <span className={`${arabicClass} text-[10px] text-indigo-900 font-bold`}>{rule.location}</span>
                            </div>
                            <p className={`${englishSizeClass} text-slate-600 leading-tight mb-1 font-medium italic`}>{rule.explanation_en}</p>
                            <p className={`${tamilSizeClass} text-indigo-700 tamil-font leading-tight italic`}>{rule.explanation_ta}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => loadTajweed(ayah)}
                      disabled={loadingTajweed[ayah.number]}
                      className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                      {loadingTajweed[ayah.number] ? <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span> : 'Tajweed Guide 💎'}
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex gap-3">
                  <span className="text-[8px] font-black text-slate-300 uppercase mt-1 w-4 shrink-0">EN</span>
                  <p className={`${englishSizeClass} text-slate-600 leading-relaxed font-medium italic`}>{ayah.translation_en}</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-[8px] font-black text-emerald-200 uppercase mt-1 w-4 shrink-0">TA</span>
                  <p className={`${tamilSizeClass} text-slate-500 tamil-font leading-relaxed font-medium`}>{ayah.translation_ta}</p>
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
