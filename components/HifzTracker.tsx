
import React, { useState } from 'react';
import { ALL_SURAH_NAMES, SURAH_METADATA } from '../data/quranData';
import { HifzProgress } from '../types';

interface HifzTrackerProps {
  progress: HifzProgress[];
}

type TrackerMode = 'recite' | 'hifz';

const HifzTracker: React.FC<HifzTrackerProps> = ({ progress }) => {
  const [mode, setMode] = useState<TrackerMode>('hifz');
  const totalAyahs = 6236; 
  
  const countItems = (type: TrackerMode) => {
    return progress.reduce((acc, p) => {
      const list = type === 'recite' ? p.ayahsRecited : p.ayahsMemorized;
      return acc + (list?.length || 0);
    }, 0);
  };

  const currentCount = countItems(mode);
  const percentage = ((currentCount / totalAyahs) * 100).toFixed(2);

  // Helper to get total ayahs for a surah ID (mapping from metadata if available)
  const getSurahTotal = (id: number) => {
    const meta = SURAH_METADATA.find(m => m.id === id);
    return meta?.total_ayahs || 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Mode Switcher */}
      <div className="bg-slate-100 p-1.5 rounded-[2rem] flex gap-1 shadow-inner sticky top-0 z-10 backdrop-blur-sm bg-slate-50/80">
        <button
          onClick={() => setMode('recite')}
          className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-2 ${
            mode === 'recite' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-500'
          }`}
        >
          <span>📖</span> Recitation
        </button>
        <button
          onClick={() => setMode('hifz')}
          className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-2 ${
            mode === 'hifz' ? 'bg-white shadow-lg text-emerald-600' : 'text-slate-500'
          }`}
        >
          <span>🧠</span> Hifz Progress
        </button>
      </div>

      {/* Hero Stats Card */}
      <div className={`p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden transition-all duration-700 ${
        mode === 'recite' ? 'bg-gradient-to-br from-blue-600 to-indigo-900' : 'bg-gradient-to-br from-emerald-600 to-emerald-900'
      }`}>
        <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl -mr-10 -mt-10 rotate-12">
          {mode === 'recite' ? '📖' : '🧠'}
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Your Journey</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              </div>
              <h2 className="text-6xl font-black italic tracking-tighter">{percentage}%</h2>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-2">
                Total {mode === 'recite' ? 'Recited' : 'Memorized'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[9px] uppercase tracking-widest font-black mb-1">Completion</p>
              <p className="font-black text-2xl">{currentCount} <span className="text-sm opacity-40">/ {totalAyahs}</span></p>
            </div>
          </div>
          <div className="w-full bg-black/20 h-5 rounded-3xl overflow-hidden backdrop-blur-md p-1.5 border border-white/5">
            <div 
              className="bg-white h-full rounded-2xl transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em]">Surah-wise Breakdown</h3>
          <span className="text-[10px] font-bold text-slate-400">{progress.length} Surahs in Progress</span>
        </div>
        
        <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-hide">
          {progress.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="text-5xl mb-6 grayscale opacity-20">🍃</div>
              <p className="text-slate-400 text-sm font-medium italic">No activity recorded yet.</p>
              <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest mt-2">Start your first Ayah today</p>
            </div>
          ) : (
            progress
              .filter(p => (mode === 'recite' ? p.ayahsRecited : p.ayahsMemorized)?.length > 0)
              .map(p => {
                const name = ALL_SURAH_NAMES[p.surahId - 1];
                const list = mode === 'recite' ? p.ayahsRecited : p.ayahsMemorized;
                const total = getSurahTotal(p.surahId);
                const surahPercentage = total > 0 ? (list.length / total) * 100 : 0;
                
                return (
                  <div key={p.surahId} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm hover:border-slate-200 hover:shadow-lg transition-all group">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border transition-all ${
                        mode === 'recite' 
                          ? 'bg-blue-50 text-blue-700 border-blue-100 group-hover:bg-blue-600 group-hover:text-white' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white'
                      }`}>
                        {p.surahId}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base group-hover:text-slate-900">{name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${mode === 'recite' ? 'text-blue-500' : 'text-emerald-600'}`}>
                            {list.length} {total > 0 ? `/ ${total}` : ''} Ayahs
                          </span>
                          <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{mode === 'recite' ? 'Recited' : 'Memorized'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                       <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="transparent"
                              className="text-slate-100"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 20}
                              strokeDashoffset={2 * Math.PI * 20 * (1 - surahPercentage / 100)}
                              className={`${mode === 'recite' ? 'text-blue-500' : 'text-emerald-500'} transition-all duration-1000`}
                            />
                          </svg>
                          <span className="absolute text-[8px] font-black">{Math.round(surahPercentage)}%</span>
                       </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Methodology Section */}
      <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full"></div>
        <h3 className="font-black text-white mb-6 flex items-center gap-3 uppercase text-[10px] tracking-[0.2em]">
          <span className="text-xl">🌟</span> Master Consistency
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors">
            <p className="font-black text-white text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Recitation Goal
            </p>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Read with translation. Understanding the meaning creates a mental map that speeds up Hifz by 50%.
            </p>
          </div>
          <div className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors">
            <p className="font-black text-white text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Memorization Loop
            </p>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">
              Use the Chain Method in the Reader tab. Link new verses to previously mastered ones for long-term retention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HifzTracker;
