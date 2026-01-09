
import React, { useState, useRef, useEffect } from 'react';
import { Surah, Ayah, Word, HifzMethod, TajweedRule } from '../types';
import { fetchSurahData, getWordByWordTranslation, getAyahTajweedRules } from '../services/quranService';

interface AyahReaderProps {
  surahId: number;
  onBack: () => void;
  isAyahMemorized: (surahId: number, ayahNum: number) => boolean;
  isAyahRecited: (surahId: number, ayahNum: number) => boolean;
  toggleStatus: (surahId: number, ayahNum: number, type: 'hifz' | 'recite') => void;
}

type HifzPhase = 'focus' | 'chain';

const BISMILLAH_TEXT = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

const AyahReader: React.FC<AyahReaderProps> = ({ surahId, onBack, isAyahMemorized, isAyahRecited, toggleStatus }) => {
  const [surah, setSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWordByWord, setShowWordByWord] = useState(true);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [wbwData, setWbwData] = useState<Record<number, Word[]>>({});
  const [tajweedData, setTajweedData] = useState<Record<number, TajweedRule[]>>({});
  const [loadingTajweed, setLoadingTajweed] = useState<Record<number, boolean>>({});
  
  // Hifz Mode State
  const [hifzMode, setHifzMode] = useState(false);
  const [hifzMethod, setHifzMethod] = useState<HifzMethod>('chain');
  const [hifzStart, setHifzStart] = useState(1);
  const [hifzEnd, setHifzEnd] = useState(10);
  const [repeats, setRepeats] = useState(3);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const playbackStateRef = useRef({
    currentLoop: 0,
    chainEnd: 1,
    phase: 'focus' as HifzPhase,
    currentAyahIndex: 1
  });
  
  const [uiState, setUiState] = useState(playbackStateRef.current);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchSurahData(surahId);
        setSurah(data);
        const endLimit = data.total_ayahs > 10 ? 10 : data.total_ayahs;
        setHifzEnd(endLimit);
        setHifzStart(1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

  const playAyahAudio = (ayahNum: number, isAutoNext = false) => {
    if (!isAutoNext && playingAyah === ayahNum) {
      stopPractice();
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
    }

    const audio = new Audio(getAudioUrl(surahId, ayahNum));
    audio.playbackRate = playbackSpeed;
    audioRef.current = audio;
    setPlayingAyah(ayahNum);

    audio.play().catch(() => stopPractice());

    audio.onended = () => {
      if (hifzMode) {
        handleHifzProgression();
      } else {
        setPlayingAyah(null);
      }
    };
  };

  const handleHifzProgression = () => {
    const s = playbackStateRef.current;
    
    if (hifzMethod === 'standard') {
      if (playingAyah! < hifzEnd) {
        playAyahAudio(playingAyah! + 1, true);
      } else {
        if (s.currentLoop + 1 < repeats) {
          s.currentLoop += 1;
          setUiState({ ...s });
          playAyahAudio(hifzStart, true);
        } else {
          stopPractice();
        }
      }
    } else {
      if (s.phase === 'focus') {
        if (s.currentLoop + 1 < repeats) {
          s.currentLoop += 1;
          setUiState({ ...s });
          playAyahAudio(s.chainEnd, true);
        } else {
          if (s.chainEnd === hifzStart) {
            moveToNextFocus();
          } else {
            s.phase = 'chain';
            s.currentLoop = 0;
            s.currentAyahIndex = hifzStart;
            setUiState({ ...s });
            playAyahAudio(s.currentAyahIndex, true);
          }
        }
      } else {
        if (s.currentAyahIndex < s.chainEnd) {
          s.currentAyahIndex += 1;
          setUiState({ ...s });
          playAyahAudio(s.currentAyahIndex, true);
        } else {
          if (s.currentLoop + 1 < repeats) {
            s.currentLoop += 1;
            s.currentAyahIndex = hifzStart;
            setUiState({ ...s });
            playAyahAudio(s.currentAyahIndex, true);
          } else {
            moveToNextFocus();
          }
        }
      }
    }
  };

  const moveToNextFocus = () => {
    const s = playbackStateRef.current;
    if (s.chainEnd < hifzEnd) {
      s.chainEnd += 1;
      s.phase = 'focus';
      s.currentLoop = 0;
      s.currentAyahIndex = s.chainEnd;
      setUiState({ ...s });
      playAyahAudio(s.chainEnd, true);
      document.getElementById(`ayah-${s.chainEnd}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      stopPractice();
    }
  };

  const startPractice = () => {
    playbackStateRef.current = {
      currentLoop: 0,
      chainEnd: hifzStart,
      phase: 'focus',
      currentAyahIndex: hifzStart
    };
    setUiState({ ...playbackStateRef.current });
    playAyahAudio(hifzStart, true);
  };

  const stopPractice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
    }
    setPlayingAyah(null);
    playbackStateRef.current = {
      currentLoop: 0,
      chainEnd: hifzStart,
      phase: 'focus',
      currentAyahIndex: hifzStart
    };
    setUiState({ ...playbackStateRef.current });
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

      <div className="mb-8 bg-slate-900 text-white rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-7xl rotate-12">🧠</div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="text-xl">🕌</span> Hifz Master Settings
            </h3>
            <button 
              onClick={() => {
                if (hifzMode) stopPractice();
                setHifzMode(!hifzMode);
              }}
              className={`px-5 py-2 rounded-2xl text-[10px] font-black transition-all ${
                hifzMode ? 'bg-emerald-500 text-slate-900' : 'bg-white/10 text-emerald-400 border border-white/10'
              }`}
            >
              {hifzMode ? 'MODE ON' : 'ACTIVATE'}
            </button>
          </div>

          {hifzMode && (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
              <div className="bg-white/5 p-1.5 rounded-2xl flex gap-1 border border-white/5">
                <button 
                  onClick={() => { stopPractice(); setHifzMethod('standard'); }}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${hifzMethod === 'standard' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Standard
                </button>
                <button 
                  onClick={() => { stopPractice(); setHifzMethod('chain'); }}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${hifzMethod === 'chain' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Chain Method
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Practice From</label>
                  <select 
                    value={hifzStart}
                    onChange={(e) => { stopPractice(); setHifzStart(Number(e.target.value)); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    {surah.ayahs.map(a => <option key={a.number} value={a.number} className="text-slate-900">Ayah {a.number}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Practice To</label>
                  <select 
                    value={hifzEnd}
                    onChange={(e) => { stopPractice(); setHifzEnd(Number(e.target.value)); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    {surah.ayahs.map(a => <option key={a.number} value={a.number} className="text-slate-900">Ayah {a.number}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Repetitions</label>
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 h-12">
                    <button onClick={() => setRepeats(Math.max(1, repeats - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg">-</button>
                    <span className="flex-1 text-center font-black text-sm">{repeats}x</span>
                    <button onClick={() => setRepeats(repeats + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg">+</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reciter Speed</label>
                  <div className="flex gap-1.5 h-12 items-center">
                    {[0.75, 1, 1.25].map(speed => (
                      <button 
                        key={speed}
                        onClick={() => {
                          setPlaybackSpeed(speed);
                          if (audioRef.current) audioRef.current.playbackRate = speed;
                        }}
                        className={`flex-1 h-full rounded-xl text-[10px] font-black transition-all ${
                          playbackSpeed === speed ? 'bg-emerald-500 text-slate-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={playingAyah ? stopPractice : startPractice}
                  className={`w-full py-4 rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-xl ${
                    playingAyah ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-900'
                  }`}
                >
                  {playingAyah ? 'Stop Session' : 'Begin Hifz Session'}
                </button>
              </div>

              {playingAyah && (
                <div className="bg-emerald-500/10 p-5 rounded-[2rem] border border-emerald-500/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        {hifzMethod === 'chain' 
                          ? (uiState.phase === 'focus' ? `Focusing: Verse ${uiState.chainEnd}` : `Chaining: 1-${uiState.chainEnd}`)
                          : 'Standard Loop'
                        }
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                      Repeat {uiState.currentLoop + 1} of {repeats}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-700 ease-out"
                        style={{ width: `${((playingAyah - hifzStart + 1) / (hifzEnd - hifzStart + 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-black italic whitespace-nowrap">V{playingAyah}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setShowWordByWord(!showWordByWord)}
          className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
            showWordByWord ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          {showWordByWord ? 'Word-By-Word ON' : 'Word-By-Word OFF'}
        </button>
      </div>

      <div className="space-y-12">
        {surah.ayahs.map((ayah) => {
          let displayArabic = ayah.text;
          let bismillahHeader = null;
          
          if (ayah.number === 1 && surah.id !== 9) {
            if (surah.id !== 1 && displayArabic.startsWith(BISMILLAH_TEXT)) {
              displayArabic = displayArabic.replace(BISMILLAH_TEXT, "").trim();
              bismillahHeader = BISMILLAH_TEXT;
            } else if (surah.id !== 1) {
              bismillahHeader = BISMILLAH_TEXT;
            }
          }

          return (
            <div 
              key={ayah.number} 
              id={`ayah-${ayah.number}`}
              className={`bg-white border transition-all duration-700 rounded-[3rem] p-8 shadow-sm hover:shadow-xl ${
                playingAyah === ayah.number ? 'ring-2 ring-emerald-500 bg-emerald-50/20 scale-[1.02]' : 'border-slate-100'
              } ${hifzMode && (ayah.number < hifzStart || ayah.number > hifzEnd) ? 'opacity-25 blur-[1px]' : ''}`}
            >
              {bismillahHeader && (
                <div className="text-center mb-8 animate-in fade-in duration-1000">
                  <div className="quran-font text-4xl text-slate-800 tracking-widest leading-relaxed">
                    {bismillahHeader}
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

              <div className="quran-font text-4xl leading-[4.5rem] text-right mb-10 text-slate-800 dir-rtl selection:bg-emerald-200 tracking-wide">
                {displayArabic}
              </div>

              {showWordByWord && (
                <div className="mb-10">
                  {wbwData[ayah.number] ? (
                    <div className="flex flex-wrap flex-row-reverse gap-4 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                      {wbwData[ayah.number].map((word, idx) => (
                        <div key={idx} className="flex flex-col items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm min-w-[85px] hover:border-emerald-200 transition-colors cursor-default group">
                          <span className="quran-font text-xl text-emerald-900 mb-2 group-hover:scale-110 transition-transform">{word.arabic}</span>
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
                            <span className="quran-font text-sm text-indigo-900 font-bold">{rule.location}</span>
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
