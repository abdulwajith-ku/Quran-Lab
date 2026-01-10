
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Surah, Ayah, Word, TajweedRule, QuranScript, FontSize } from '../types';
import { fetchSurahData, getWordByWordTranslation, getAyahTajweedRules } from '../services/quranService';
import { getHifzTips } from '../services/geminiService';

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
  mushafMode: boolean;
  showWordByWord: boolean;
  showTajweed: boolean;
  showEnglish: boolean;
  showTamil: boolean;
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
  mushafMode, showWordByWord, showTajweed,
  showEnglish, showTamil,
  onBack, isAyahMemorized, isAyahRecited, toggleStatus 
}) => {
  const [surah, setSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [wbwData, setWbwData] = useState<Record<number, Word[]>>({});
  const [tajweedData, setTajweedData] = useState<Record<number, TajweedRule[]>>({});
  const [loadingTajweed, setLoadingTajweed] = useState<Record<number, boolean>>({});
  const [loadingWbw, setLoadingWbw] = useState<Record<number, boolean>>({});
  const [copyStatus, setCopyStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [surahId]);

  const loadWbw = useCallback(async (ayah: Ayah) => {
    if ((wbwData[ayah.number] && wbwData[ayah.number].length > 0) || loadingWbw[ayah.number]) return;
    setLoadingWbw(prev => ({ ...prev, [ayah.number]: true }));
    try {
      const words = await getWordByWordTranslation(ayah.text);
      if (words && words.length > 0) {
        setWbwData(prev => ({ ...prev, [ayah.number]: words }));
      }
    } catch (err) {
      console.warn("WBW Load throttled", err);
    } finally {
      setLoadingWbw(prev => ({ ...prev, [ayah.number]: false }));
    }
  }, [wbwData, loadingWbw]);

  const loadTajweed = useCallback(async (ayah: Ayah) => {
    if ((tajweedData[ayah.number] && tajweedData[ayah.number].length > 0) || loadingTajweed[ayah.number]) return;
    setLoadingTajweed(prev => ({ ...prev, [ayah.number]: true }));
    try {
      const rules = await getAyahTajweedRules(ayah.text);
      if (rules && rules.length > 0) {
        setTajweedData(prev => ({ ...prev, [ayah.number]: rules }));
      }
    } catch (err) {
      console.warn("Tajweed Load throttled", err);
    } finally {
      setLoadingTajweed(prev => ({ ...prev, [ayah.number]: false }));
    }
  }, [tajweedData, loadingTajweed]);

  /**
   * Proactive visible data trigger.
   * Ensures visible content is loaded immediately when settings are toggled ON.
   */
  const triggerVisibleLoad = useCallback(() => {
    if (loading || !surah || mushafMode) return;
    
    const ayahElements = document.querySelectorAll('.ayah-container');
    const viewportHeight = window.innerHeight;

    ayahElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const isVisible = (rect.top >= 0 && rect.top <= viewportHeight) || (rect.bottom >= 0 && rect.bottom <= viewportHeight);
      
      if (isVisible) {
        const ayahNum = parseInt(el.getAttribute('data-ayah-num') || '0');
        const ayah = surah.ayahs.find(a => a.number === ayahNum);
        if (ayah) {
          if (showWordByWord) loadWbw(ayah);
          if (showTajweed) loadTajweed(ayah);
        }
      }
    });
  }, [loading, surah, mushafMode, showWordByWord, showTajweed, loadWbw, loadTajweed]);

  // Initial and Toggle trigger
  useEffect(() => {
    triggerVisibleLoad();
  }, [showWordByWord, showTajweed, triggerVisibleLoad]);

  // Observer for scroll trigger
  useEffect(() => {
    if (loading || !surah || mushafMode) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const ayahNum = parseInt(entry.target.getAttribute('data-ayah-num') || '0');
            const ayah = surah.ayahs.find(a => a.number === ayahNum);
            if (ayah) {
              if (showWordByWord) loadWbw(ayah);
              if (showTajweed) loadTajweed(ayah);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const ayahElements = document.querySelectorAll('.ayah-container');
    ayahElements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [loading, surah, showWordByWord, showTajweed, mushafMode, loadWbw, loadTajweed]);

  const fetchInsights = async () => {
    if (insights || loadingInsights || !surah) return;
    setLoadingInsights(true);
    setErrorMessage(null);
    try {
      const tips = await getHifzTips(surah.name);
      setInsights(tips);
    } catch (err) {
      setErrorMessage("AI Quota busy. Please wait a moment.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoadingInsights(false);
    }
  };

  const getAudioUrl = (sId: number, aNum: number) => {
    const sPadded = sId.toString().padStart(3, '0');
    const aPadded = aNum.toString().padStart(3, '0');
    return `https://everyayah.com/data/Alafasy_128kbps/${sPadded}${aPadded}.mp3`;
  };

  const playAyahAudio = async (ayahNum: number) => {
    if (playingAyah === ayahNum) {
      if (audioRef.current) {
        if (playPromiseRef.current) await playPromiseRef.current.catch(() => {});
        audioRef.current.pause();
      }
      setPlayingAyah(null);
      return;
    }

    if (audioRef.current) {
      if (playPromiseRef.current) await playPromiseRef.current.catch(() => {});
      audioRef.current.pause();
    }

    const audioUrl = getAudioUrl(surahId, ayahNum);
    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackSpeed;
    audioRef.current = audio;
    
    setPlayingAyah(ayahNum);
    
    const playPromise = audio.play();
    playPromiseRef.current = playPromise;
    
    playPromise.catch(error => {
      if (error.name !== 'AbortError') {
        console.error("Playback error:", error);
      }
    });

    audio.onended = () => {
      setPlayingAyah(null);
      playPromiseRef.current = null;
    };
  };

  const handleCopy = (ayah: Ayah) => {
    const text = `${surah?.name} (${surahId}:${ayah.number})\n\n${ayah.text}\n\nEN: ${ayah.translation_en}\n\nTA: ${ayah.translation_ta}\n\nShared via Al-Hifz Companion`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(ayah.number);
      setTimeout(() => setCopyStatus(null), 2000);
    });
  };

  const handleShare = (ayah: Ayah) => {
    const shareData = {
      title: `${surah?.name} - Ayah ${ayah.number}`,
      text: `${ayah.text}\n\nEN: ${ayah.translation_en}\n\nTA: ${ayah.translation_ta}\n\n(${surah?.name} ${surahId}:${ayah.number})`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch((err) => console.log('Error sharing', err));
    } else {
      handleCopy(ayah);
    }
  };

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

  const memorizedCount = surah.ayahs.filter(a => isAyahMemorized(surahId, a.number)).length;
  const progressPercent = (memorizedCount / surah.total_ayahs) * 100;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-2xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-4 duration-300">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="sticky top-[68px] z-40 bg-white/80 backdrop-blur-md -mx-3 px-3 py-3 border-b border-slate-100 mb-6 flex items-center justify-between">
        <button onClick={onBack} className="text-emerald-700 font-bold flex items-center gap-1 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-all">
          ← Back
        </button>
        <div className="text-center flex-1">
          <h2 className="text-lg font-black text-slate-800 leading-none">{surah.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
             <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
             </div>
             <span className="text-[9px] font-black text-slate-400 uppercase">{Math.round(progressPercent)}%</span>
          </div>
        </div>
        <button 
          onClick={() => { setShowInsights(!showInsights); fetchInsights(); }} 
          className={`p-2 rounded-xl border transition-all ${showInsights ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
        >
          ✨
        </button>
      </div>

      {showInsights && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl mb-8 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-7xl rotate-12">💎</div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">AI</span>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Surah Insights & Hifz Tips</h3>
            </div>
            {loadingInsights ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
              </div>
            ) : (
              <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-medium text-slate-200 prose prose-invert">
                {insights || "Insights temporarily unavailable due to quota constraints."}
              </div>
            )}
            <button 
              onClick={() => setShowInsights(false)}
              className="w-full py-2.5 bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}

      <div className={`${mushafMode ? 'bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-lg space-y-6' : 'space-y-8'}`}>
        {surah.ayahs.map((ayah) => {
          const showBismillahHeader = ayah.number === 1 && surah.id !== 1 && surah.id !== 9;
          const arabicClass = script === 'uthmani' ? 'font-uthmani' : 'font-indopak';
          const arabicSizeClass = getArabicFontSizeClass(mushafMode);
          const englishSizeClass = getEnglishFontSizeClass();
          const tamilSizeClass = getTamilFontSizeClass();

          if (mushafMode) {
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
                    <span className={`inline-flex items-center justify-center w-10 h-10 border rounded-full text-[12px] font-black font-sans mx-3 align-middle transition-all ${
                      isAyahMemorized(surahId, ayah.number) 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-emerald-800'
                    }`}>
                      {ayah.number}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          const hasWbw = wbwData[ayah.number] && wbwData[ayah.number].length > 0;
          const hasTajweed = tajweedData[ayah.number] && tajweedData[ayah.number].length > 0;

          return (
            <div 
              key={ayah.number} 
              id={`ayah-${ayah.number}`}
              data-ayah-num={ayah.number}
              className={`ayah-container bg-white border transition-all duration-500 rounded-[2rem] p-5 shadow-sm hover:shadow-md ${
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
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[9px] font-black border transition-colors ${
                    isAyahMemorized(surahId, ayah.number) ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-50 text-emerald-700 border-slate-100'
                  }`}>
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
                  <button 
                    onClick={() => handleCopy(ayah)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 transition-colors text-[10px]"
                  >
                    {copyStatus === ayah.number ? '✅' : '📋'}
                  </button>
                  <button 
                    onClick={() => handleShare(ayah)}
                    className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors text-[10px]"
                  >
                    🔗
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
                  {hasWbw ? (
                    <div className="flex flex-row-reverse gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 animate-in fade-in overflow-x-auto scrollbar-hide pb-6">
                      {wbwData[ayah.number].map((word, idx) => (
                        <div key={idx} className="flex flex-col items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm min-w-[85px] text-center shrink-0">
                          <span className={`${arabicClass} text-lg text-emerald-900 mb-1`}>{word.arabic}</span>
                          {showEnglish && <span className={`${englishSizeClass} text-slate-400 font-black uppercase tracking-tighter mb-0.5 leading-none`}>{word.english}</span>}
                          {showTamil && <span className={`${tamilSizeClass} text-emerald-600 font-bold tamil-font italic leading-none`}>{word.tamil}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full py-4 border-2 border-dashed border-emerald-100 rounded-xl flex items-center justify-center gap-3">
                       <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                       <span className="text-emerald-600 text-[9px] font-black uppercase tracking-widest">Loading Word-By-Word...</span>
                    </div>
                  )}
                </div>
              )}

              {showTajweed && (
                <div className="mb-6">
                  {hasTajweed ? (
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">💎</span>
                        <h4 className="text-[8px] font-black text-indigo-900 uppercase tracking-widest">Tajweed & Tartil</h4>
                      </div>
                      <div className="max-h-56 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {tajweedData[ayah.number].map((rule, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-indigo-50 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded uppercase">{rule.rule}</span>
                              <span className={`${arabicClass} text-[10px] text-indigo-900 font-bold`}>{rule.location}</span>
                            </div>
                            {showEnglish && <p className={`${englishSizeClass} text-slate-600 leading-tight mb-1 font-medium italic`}>{rule.explanation_en}</p>}
                            {showTamil && <p className={`${tamilSizeClass} text-indigo-700 tamil-font leading-tight italic`}>{rule.explanation_ta}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full py-4 bg-indigo-50 rounded-xl flex items-center justify-center gap-3 border border-indigo-100">
                       <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                       <span className="text-indigo-700 text-[9px] font-black uppercase tracking-widest">Analyzing Tajweed...</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-slate-100">
                {showEnglish && (
                  <div className="flex gap-3">
                    <span className="text-[8px] font-black text-slate-300 uppercase mt-1 w-4 shrink-0">EN</span>
                    <p className={`${englishSizeClass} text-slate-600 leading-relaxed font-medium italic`}>{ayah.translation_en}</p>
                  </div>
                )}
                {showTamil && (
                  <div className="flex gap-3">
                    <span className="text-[8px] font-black text-emerald-200 uppercase mt-1 w-4 shrink-0">TA</span>
                    <p className={`${tamilSizeClass} text-slate-500 tamil-font leading-relaxed font-medium`}>{ayah.translation_ta}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AyahReader;
