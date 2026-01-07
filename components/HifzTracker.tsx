
import React from 'react';
import { ALL_SURAH_NAMES } from '../data/quranData';
import { HifzProgress } from '../types';

interface HifzTrackerProps {
  progress: HifzProgress[];
}

const HifzTracker: React.FC<HifzTrackerProps> = ({ progress }) => {
  const totalAyahs = 6236; // Constant for the full Quran
  const memorizedAyahs = progress.reduce((acc, p) => acc + p.ayahsMemorized.length, 0);
  const percentage = ((memorizedAyahs / totalAyahs) * 100).toFixed(2);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl">🌙</div>
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-5xl font-black italic">{percentage}%</h2>
              <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mt-1">Quran Journey Progress</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-300 text-[10px] uppercase tracking-widest font-black">Ayahs Mastered</p>
              <p className="font-black text-xl">{memorizedAyahs} <span className="text-sm opacity-50">/ {totalAyahs}</span></p>
            </div>
          </div>
          <div className="w-full bg-white/10 h-4 rounded-2xl overflow-hidden backdrop-blur-md p-1">
            <div 
              className="bg-white h-full rounded-xl transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-slate-800 px-2 uppercase text-xs tracking-widest">Memorization Breakdown</h3>
        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {progress.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-[2rem] border border-slate-100">
              <p className="text-slate-400 text-sm">No progress recorded yet. Start reading!</p>
            </div>
          ) : (
            progress.map(p => {
              const name = ALL_SURAH_NAMES[p.surahId - 1];
              return (
                <div key={p.surahId} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm hover:border-emerald-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-black border border-emerald-100 text-xs">
                      {p.surahId}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{p.ayahsMemorized.length} Ayahs memorized</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-50 flex items-center justify-center">
                      <span className="text-[9px] font-black text-emerald-700">✓</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
        <h3 className="font-black text-emerald-400 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest">
          <span>🧠</span> Hifz Methodology
        </h3>
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="font-bold text-white mb-1">Visual Recall</p>
            <p className="text-slate-400 leading-relaxed">Focus on the Arabic word positions in the reader. Use the Tamil translation to connect meanings to sounds.</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="font-bold text-white mb-1">Audio Immersion</p>
            <p className="text-slate-400 leading-relaxed">Play the Ayah audio repeatedly while following word-by-word. This strengthens your 'Tartil' (rhythmic pattern).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HifzTracker;
