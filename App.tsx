
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AyahReader from './components/AyahReader';
import HifzTracker from './components/HifzTracker';
import AIReviewer from './components/AIReviewer';
import TajweedTips from './components/TajweedTips';
import { ViewState, ListMode, HifzProgress } from './types';
import { ALL_SURAH_NAMES, JUZ_DATA } from './data/quranData';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('surah-list');
  const [listMode, setListMode] = useState<ListMode>('surah');
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [progress, setProgress] = useState<HifzProgress[]>(() => {
    const saved = localStorage.getItem('hifz-progress');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('hifz-progress', JSON.stringify(progress));
  }, [progress]);

  const toggleMemorized = (surahId: number, ayahNum: number) => {
    setProgress(prev => {
      const existingSurah = prev.find(p => p.surahId === surahId);
      if (existingSurah) {
        const isMemorized = existingSurah.ayahsMemorized.includes(ayahNum);
        const newAyahs = isMemorized 
          ? existingSurah.ayahsMemorized.filter(n => n !== ayahNum)
          : [...existingSurah.ayahsMemorized, ayahNum];
        
        return prev.map(p => p.surahId === surahId 
          ? { ...p, ayahsMemorized: newAyahs } 
          : p
        );
      } else {
        return [...prev, { surahId, ayahsMemorized: [ayahNum], isComplete: false }];
      }
    });
  };

  const isAyahMemorized = (surahId: number, ayahNum: number) => {
    return progress.find(p => p.surahId === surahId)?.ayahsMemorized.includes(ayahNum) || false;
  };

  const openSurahById = (id: number) => {
    setSelectedSurahId(id);
    setActiveView('reader');
  };

  const renderSelectionList = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">The Holy Quran</h2>
              <p className="text-xs text-slate-400 font-medium">Tamil & English Translation</p>
            </div>
          </div>

          <div className="bg-slate-100 p-1.5 rounded-3xl flex gap-1 shadow-inner">
            <button
              onClick={() => setListMode('surah')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                listMode === 'surah' ? 'bg-white shadow-md text-emerald-700 translate-y-[-1px]' : 'text-slate-500'
              }`}
            >
              Surah-wise
            </button>
            <button
              onClick={() => setListMode('juz')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                listMode === 'juz' ? 'bg-white shadow-md text-emerald-700 translate-y-[-1px]' : 'text-slate-500'
              }`}
            >
              Juz-wise
            </button>
          </div>
        </div>

        {listMode === 'surah' ? (
          <div className="grid grid-cols-1 gap-3">
            {ALL_SURAH_NAMES.map((name, idx) => {
              const id = idx + 1;
              return (
                <button
                  key={id}
                  onClick={() => openSurahById(id)}
                  className="w-full bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between transition-all group hover:border-emerald-200 hover:shadow-xl hover:translate-y-[-2px]"
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      {id}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800 text-base">{name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Surah {id}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Explore →</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {JUZ_DATA.map((juz) => (
              <button
                key={juz.id}
                onClick={() => openSurahById(juz.startSurah)}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-2xl transition-all group text-left flex flex-col justify-between h-40"
              >
                <div>
                  <h4 className="font-black text-slate-800 text-xl italic">Juz {juz.id}</h4>
                  <p className="text-[10px] text-slate-400 font-bold leading-tight mt-2 uppercase tracking-tighter">
                    Starts at <br/>{ALL_SURAH_NAMES[juz.startSurah - 1]}
                  </p>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                    Begin
                  </span>
                  <div className="w-8 h-8 rounded-2xl bg-slate-50 group-hover:bg-emerald-500 group-hover:scale-110 transition-all flex items-center justify-center text-white text-xs">
                    {juz.id}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (selectedSurahId && activeView === 'reader') {
      return (
        <AyahReader 
          surahId={selectedSurahId} 
          onBack={() => {
            setSelectedSurahId(null);
            setActiveView('surah-list');
          }}
          isAyahMemorized={isAyahMemorized}
          toggleMemorized={toggleMemorized}
        />
      );
    }

    switch (activeView) {
      case 'surah-list':
        return renderSelectionList();
      case 'tracker':
        return <HifzTracker progress={progress} />;
      case 'ai-verify':
        return <AIReviewer />;
      case 'tajweed-tips':
        return <TajweedTips />;
      default:
        return null;
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {renderContent()}
    </Layout>
  );
};

export default App;
