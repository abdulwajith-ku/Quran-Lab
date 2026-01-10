
import React, { useState, useRef, useEffect } from 'react';
import { Surah, Ayah, HifzMethod, QuranScript, FontSize } from '../types';
import { fetchSurahData } from '../services/quranService';
import { ALL_SURAH_NAMES } from '../data/quranData';

interface HifzMasterProps {
  script: QuranScript;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
}

type HifzPhase = 'focus' | 'chain';

const HifzMaster: React.FC<HifzMasterProps> = ({ script, fontSize, setFontSize }) => {
  const [selectedSurahId, setSelectedSurahId] = useState(1);
  const [surah, setSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  
  const [hifzMethod, setHifzMethod] = useState<HifzMethod>('chain');
  const [hifzStart, setHifzStart] = useState(1);
  const [hifzEnd, setHifzEnd] = useState(7);
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
  const playPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchSurahData(selectedSurahId);
        setSurah(data);
        setHifzStart(1);
        setHifzEnd(Math.min(data.total_ayahs, 7));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    return () => {
      stopPractice();
    };
  }, [selectedSurahId]);

  const getAudioUrl = (sId: number, aNum: number) => {
    const sPadded = sId.toString().padStart(3, '0');
    const aPadded = aNum.toString().padStart(3, '0');
    return `https://everyayah.com/data/Alafasy_128kbps/${sPadded}${aPadded}.mp3`;
  };

  const playAyahAudio = async (ayahNum: number) => {
    if (audioRef.current) {
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }
      audioRef.current.pause();
      audioRef.current.onended = null;
    }

    const audioUrl = getAudioUrl(selectedSurahId, ayahNum);
    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackSpeed;
    audioRef.current = audio;
    setPlayingAyah(ayahNum);

    const playPromise = audio.play();
    playPromiseRef.current = playPromise;

    playPromise.catch(error => {
      if (error.name !== 'AbortError') {
        console.error("Practice Playback error:", error);
        stopPractice();
      }
    });

    audio.onended = () => {
      handleHifzProgression();
    };
  };

  const handleHifzProgression = () => {
    const s = playbackStateRef.current;
    
    if (hifzMethod === 'standard') {
      if (s.currentLoop + 1 < repeats) {
        s.currentLoop += 1;
        setUiState({ ...s });
        playAyahAudio(s.currentAyahIndex);
      } else {
        if (s.currentAyahIndex < hifzEnd) {
          s.currentLoop = 0;
          s.currentAyahIndex += 1;
          setUiState({ ...s });
          playAyahAudio(s.currentAyahIndex);
        } else {
          stopPractice();
        }
      }
    } else {
      if (s.phase === 'focus') {
        if (s.currentLoop + 1 < repeats) {
          s.currentLoop += 1;
          setUiState({ ...s });
          playAyahAudio(s.chainEnd);
        } else {
          if (s.chainEnd === hifzStart) {
            moveToNextFocus();
          } else {
            s.phase = 'chain';
            s.currentLoop = 0;
            s.currentAyahIndex = hifzStart;
            setUiState({ ...s });
            playAyahAudio(s.currentAyahIndex);
          }
        }
      } else {
        if (s.currentAyahIndex < s.chainEnd) {
          s.currentAyahIndex += 1;
          setUiState({ ...s });
          playAyahAudio(s.currentAyahIndex);
        } else {
          if (s.currentLoop + 1 < repeats) {
            s.currentLoop += 1;
            s.currentAyahIndex = hifzStart;
            setUiState({ ...s });
            playAyahAudio(s.currentAyahIndex);
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
      playAyahAudio(s.chainEnd);
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
    playAyahAudio(hifzStart);
  };

  const stopPractice = async () => {
    if (audioRef.current) {
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }
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

  const getFontSizeClass = () => {
    switch(fontSize) {
      case 'sm': return 'text-3xl leading-[4.5rem]';
      case 'md': return 'text-5xl leading-[6rem]';
      case 'lg': return 'text-6xl leading-[7rem]';
      case 'xl': return 'text-7xl leading-[8rem]';
      default: return 'text-5xl leading-[6rem]';
    }
  };

  const currentPlayingText = surah?.ayahs.find(a => a.number === playingAyah)?.text;
  const arabicClass = script === 'uthmani' ? 'font-uthmani' : 'font-indopak';
  const fontSizeClass = getFontSizeClass();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-slate-900 text-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl rotate-12 pointer-events-none">🎯</div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-emerald-400 italic">Hifz Master</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Specialized Practice Module</p>
            </div>
            {playingAyah && (
               <div className="flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Session</span>
               </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Surah</label>
                <select 
                  value={selectedSurahId}
                  onChange={(e) => { stopPractice(); setSelectedSurahId(Number(e.target.value)); }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                >
                  {ALL_SURAH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1} className="text-slate-900">{idx + 1}. {name}</option>
                  ))}
                </select>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">From</label>
                  <select 
                    value={hifzStart}
                    onChange={(e) => { stopPractice(); setHifzStart(Number(e.target.value)); }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    {surah?.ayahs.map(a => <option key={a.number} value={a.number} className="text-slate-900">Ayah {a.number}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">To</label>
                  <select 
                    value={hifzEnd}
                    onChange={(e) => { stopPractice(); setHifzEnd(Number(e.target.value)); }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    {surah?.ayahs.map(a => <option key={a.number} value={a.number} className="text-slate-900">Ayah {a.number}</option>)}
                  </select>
                </div>
             </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="bg-white/5 p-1 rounded-2xl flex gap-1 border border-white/5 flex-1 min-w-[200px]">
                <button 
                  onClick={() => { stopPractice(); setHifzMethod('standard'); }}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${hifzMethod === 'standard' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Standard Repetition
                </button>
                <button 
                  onClick={() => { stopPractice(); setHifzMethod('chain'); }}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${hifzMethod === 'chain' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Chain Method
                </button>
              </div>

              <div className="bg-white/5 p-1 rounded-2xl flex gap-1 border border-white/5">
                {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map(size => (
                  <button 
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${
                        fontSize === size ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Repeats Per Verse</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 h-12">
                  <button onClick={() => setRepeats(Math.max(1, repeats - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg">-</button>
                  <span className="flex-1 text-center font-black text-sm">{repeats}</span>
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
          </div>

          <div className="pt-4">
            <button 
              onClick={playingAyah ? stopPractice : startPractice}
              disabled={loading}
              className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] transition-all transform active:scale-95 shadow-xl ${
                playingAyah ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-400 text-slate-900 hover:bg-emerald-300'
              } disabled:opacity-50`}
            >
              {loading ? 'Fetching Surah...' : playingAyah ? 'Stop Practice' : 'Start Practice'}
            </button>
          </div>
        </div>
      </div>

      {playingAyah && currentPlayingText && (
        <div className="bg-white border border-emerald-100 p-10 rounded-[4rem] shadow-2xl animate-in zoom-in duration-500 space-y-10 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((playingAyah - hifzStart + 1) / (hifzEnd - hifzStart + 1)) * 100}%` }}
              ></div>
           </div>

           <div className="flex flex-col items-center gap-4">
              <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                {hifzMethod === 'chain' 
                  ? (uiState.phase === 'focus' ? `Currently Focusing: Ayah ${uiState.chainEnd}` : `Chaining: 1 → ${uiState.chainEnd}`)
                  : `Ayah ${playingAyah} of ${hifzEnd}`
                }
              </span>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Repeat {uiState.currentLoop + 1} of {repeats}
              </p>
           </div>

           <div className={`${arabicClass} ${fontSizeClass} text-slate-800 dir-rtl`}>
              {currentPlayingText}
           </div>

           <div className="flex items-center justify-center gap-10 opacity-30">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
           </div>
        </div>
      )}

      {!playingAyah && (
        <div className="bg-slate-50 border border-slate-100 p-12 rounded-[3.5rem] text-center border-dashed">
           <p className="text-4xl mb-6 grayscale opacity-30">🎧</p>
           <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-3">Practice Mode Ready</h3>
           <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs mx-auto">
             Select your Surah and range above, then press start to begin focused repetition loops.
           </p>
        </div>
      )}
    </div>
  );
};

export default HifzMaster;
