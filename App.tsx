
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import AyahReader from './components/AyahReader';
import HifzTracker from './components/HifzTracker';
import AIReviewer from './components/AIReviewer';
import TajweedTips from './components/TajweedTips';
import { ViewState, ListMode, HifzProgress, SearchResult } from './types';
import { ALL_SURAH_NAMES, JUZ_DATA } from './data/quranData';
import { searchQuranContent } from './services/quranService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('surah-list');
  const [listMode, setListMode] = useState<ListMode>('surah');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchingContent, setIsSearchingContent] = useState(false);
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [progress, setProgress] = useState<HifzProgress[]>(() => {
    const saved = localStorage.getItem('hifz-progress');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('hifz-progress', JSON.stringify(progress));
  }, [progress]);

  // Handle global content search
  const handleDeepSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingContent(true);
    setSearchResults([]);
    try {
      const results = await searchQuranContent(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingContent(false);
    }
  };

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

  const filteredSurahs = useMemo(() => {
    return ALL_SURAH_NAMES.map((name, idx) => ({ name, id: idx + 1 }))
      .filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.id.toString().includes(searchQuery)
      );
  }, [searchQuery]);

  const filteredJuzs = useMemo(() => {
    return JUZ_DATA.filter(j => 
      j.id.toString().includes(searchQuery) || 
      ALL_SURAH_NAMES[j.startSurah - 1].toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const renderSelectionList = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">The Holy Quran</h2>
              <p className="text-xs text-slate-400 font-medium">Tamil & English Translation</p>
            </div>
          </div>

          {/* Enhanced Search Box */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="text-slate-400 group-focus-within:text-emerald-500 transition-colors">🔍</span>
            </div>
            <input 
              type="text"
              placeholder={listMode === 'surah' ? "Search Surah, meaning, or topic..." : "Search Juz number or Surah..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === '') setSearchResults([]);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleDeepSearch()}
              className="w-full bg-white border border-slate-200 rounded-[2rem] py-4 pl-12 pr-28 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md"
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                <button 
                  onClick={handleDeepSearch}
                  className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Search
                </button>
                <button 
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="p-2 text-slate-300 hover:text-slate-500"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Search Content Results Section */}
          { (isSearchingContent || searchResults.length > 0) && (
            <div className="bg-emerald-50/50 rounded-[2.5rem] p-6 border border-emerald-100/50 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Verse & Topic Matches</h3>
                {isSearchingContent && <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>}
              </div>
              <div className="space-y-3">
                {searchResults.map((res, i) => (
                  <button 
                    key={i}
                    onClick={() => openSurahById(res.surahId)}
                    className="w-full bg-white p-4 rounded-2xl border border-emerald-100/50 text-left hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-emerald-700">{res.surahName} {res.surahId}:{res.ayahNumber}</span>
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{res.relevance}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 italic">"{res.snippet}"</p>
                  </button>
                ))}
              </div>
            </div>
          )}

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
            {filteredSurahs.length > 0 ? (
              filteredSurahs.map((surah) => (
                <button
                  key={surah.id}
                  onClick={() => openSurahById(surah.id)}
                  className="w-full bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between transition-all group hover:border-emerald-200 hover:shadow-xl hover:translate-y-[-2px]"
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      {surah.id}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800 text-base">{surah.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Surah {surah.id}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Explore →</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-3xl mb-4">🔍</p>
                <p className="text-slate-400 text-sm font-medium">No Surahs found matching "{searchQuery}"</p>
                <button 
                  onClick={handleDeepSearch}
                  className="mt-4 text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline"
                >
                  Try Deep Content Search?
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredJuzs.length > 0 ? (
              filteredJuzs.map((juz) => (
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
              ))
            ) : (
              <div className="col-span-2 text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-3xl mb-4">🔍</p>
                <p className="text-slate-400 text-sm font-medium">No Juz found matching "{searchQuery}"</p>
              </div>
            )}
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
