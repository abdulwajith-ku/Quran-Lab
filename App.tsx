
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import AyahReader from './components/AyahReader';
import HifzTracker from './components/HifzTracker';
import AIReviewer from './components/AIReviewer';
import TajweedTips from './components/TajweedTips';
import { ViewState, ListMode, HifzProgress, SearchResult } from './types';
import { ALL_SURAH_NAMES, JUZ_DATA } from './data/quranData';
import { searchQuranContent } from './services/quranService';
import { transcribeAudio } from './services/geminiService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('surah-list');
  const [listMode, setListMode] = useState<ListMode>('surah');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchingContent, setIsSearchingContent] = useState(false);
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  
  // Voice Search State
  const [isRecordingSearch, setIsRecordingSearch] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [progress, setProgress] = useState<HifzProgress[]>(() => {
    const saved = localStorage.getItem('hifz-progress');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('hifz-progress', JSON.stringify(progress));
  }, [progress]);

  // Handle global content search
  const handleDeepSearch = async (queryOverride?: string) => {
    const queryToUse = queryOverride !== undefined ? queryOverride : searchQuery;
    if (!queryToUse.trim()) return;
    
    setIsSearchingContent(true);
    setSearchResults([]);
    try {
      const results = await searchQuranContent(queryToUse);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingContent(false);
    }
  };

  // Voice Search Logic
  const startVoiceSearch = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsTranscribing(true);
          try {
            const transcription = await transcribeAudio(base64Audio);
            if (transcription) {
              setSearchQuery(transcription);
              handleDeepSearch(transcription);
            }
          } finally {
            setIsTranscribing(false);
          }
        };
      };

      recorder.start();
      setIsRecordingSearch(true);
    } catch (err) {
      alert("Microphone access is required for voice search.");
    }
  };

  const stopVoiceSearch = () => {
    mediaRecorderRef.current?.stop();
    setIsRecordingSearch(false);
  };

  const copyToClipboard = (res: SearchResult) => {
    const textToCopy = `${res.surahName} (${res.surahId}:${res.ayahNumber})\n\n${res.arabicText}\n\nEnglish: ${res.snippet}\n\nTamil: ${res.tamilSnippet}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyStatus(res.surahId + '-' + res.ayahNumber);
      setTimeout(() => setCopyStatus(null), 2000);
    });
  };

  const toggleStatus = (surahId: number, ayahNum: number, type: 'hifz' | 'recite') => {
    setProgress(prev => {
      const existingSurah = prev.find(p => p.surahId === surahId);
      if (existingSurah) {
        const listName = type === 'hifz' ? 'ayahsMemorized' : 'ayahsRecited';
        const currentList = existingSurah[listName] || [];
        const isSet = currentList.includes(ayahNum);
        const newList = isSet 
          ? currentList.filter(n => n !== ayahNum)
          : [...currentList, ayahNum];
        
        return prev.map(p => p.surahId === surahId 
          ? { ...p, [listName]: newList } 
          : p
        );
      } else {
        const initialData = {
          surahId,
          ayahsMemorized: type === 'hifz' ? [ayahNum] : [],
          ayahsRecited: type === 'recite' ? [ayahNum] : [],
          isComplete: false
        };
        return [...prev, initialData];
      }
    });
  };

  const isAyahMemorized = (surahId: number, ayahNum: number) => {
    return progress.find(p => p.surahId === surahId)?.ayahsMemorized?.includes(ayahNum) || false;
  };

  const isAyahRecited = (surahId: number, ayahNum: number) => {
    return progress.find(p => p.surahId === surahId)?.ayahsRecited?.includes(ayahNum) || false;
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
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter text-emerald-800">The Holy Quran</h2>
              <p className="text-xs text-slate-400 font-medium">Tamil & English Translation</p>
            </div>
          </div>

          {/* Enhanced Search Box with Voice Input */}
          <div className="space-y-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="text-slate-400 group-focus-within:text-emerald-500 transition-colors">🔍</span>
              </div>
              <input 
                type="text"
                placeholder={listMode === 'surah' ? "Search word or topic..." : "Search Juz number..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value === '') setSearchResults([]);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleDeepSearch()}
                className="w-full bg-white border border-slate-200 rounded-[2rem] py-4 pl-12 pr-40 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md"
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                <button 
                  onClick={isRecordingSearch ? stopVoiceSearch : startVoiceSearch}
                  className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
                    isRecordingSearch 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                  title="Voice Search"
                >
                  <span className="text-lg">{isRecordingSearch ? '⏹' : '🎙️'}</span>
                </button>
                <button 
                  onClick={() => handleDeepSearch()}
                  className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-4 py-2.5 rounded-2xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Search
                </button>
              </div>
            </div>
            
            {(isTranscribing || isRecordingSearch) && (
              <div className="flex items-center gap-3 px-4 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  {isRecordingSearch ? 'Listening to your query...' : 'Transcribing voice input...'}
                </span>
              </div>
            )}
          </div>

          {/* Scrollable Search Content Results Section */}
          { (isSearchingContent || searchResults.length > 0) && (
            <div className="bg-slate-900 rounded-[2.5rem] p-6 border border-slate-800 animate-in slide-in-from-top-4 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Global Matches for "{searchQuery}"</h3>
                {isSearchingContent && <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>}
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide pr-1">
                {searchResults.length === 0 && !isSearchingContent ? (
                   <p className="text-slate-500 text-xs italic text-center py-4">No specific verse matches found.</p>
                ) : (
                  searchResults.map((res, i) => (
                    <div 
                      key={i}
                      className="w-full bg-white/5 p-5 rounded-3xl border border-white/10 text-left hover:bg-white/[0.08] transition-all group relative"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <button 
                          onClick={() => openSurahById(res.surahId)}
                          className="text-[10px] font-black text-emerald-400 hover:underline"
                        >
                          {res.surahName} {res.surahId}:{res.ayahNumber}
                        </button>
                        <div className="flex items-center gap-2">
                           <button 
                            onClick={() => copyToClipboard(res)}
                            className={`p-2 rounded-xl text-[10px] font-bold transition-all ${
                              copyStatus === (res.surahId + '-' + res.ayahNumber) ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'
                            }`}
                          >
                            {copyStatus === (res.surahId + '-' + res.ayahNumber) ? 'Copied! ✅' : 'Copy 📋'}
                          </button>
                          <span className="text-[8px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full">{res.relevance}</span>
                        </div>
                      </div>
                      
                      <p className="quran-font text-xl text-right text-white leading-relaxed mb-3 dir-rtl">{res.arabicText}</p>
                      
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <p className="text-[11px] text-slate-400 leading-relaxed italic"><span className="text-[8px] font-black text-slate-600 uppercase mr-1">EN</span> {res.snippet}</p>
                        <p className="text-[11px] text-emerald-100/60 tamil-font leading-relaxed"><span className="text-[8px] font-black text-emerald-900 uppercase mr-1 bg-emerald-400/20 px-1 rounded">TA</span> {res.tamilSnippet}</p>
                      </div>
                    </div>
                  ))
                )}
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
              onClick={() => setListMode('surah')} // Juz logic can be re-enabled if data mapping is finished
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
                  onClick={() => handleDeepSearch()}
                  className="mt-4 text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline"
                >
                  Try Global Content Search?
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
          isAyahRecited={isAyahRecited}
          toggleStatus={toggleStatus}
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
