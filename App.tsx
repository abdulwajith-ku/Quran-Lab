
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import AyahReader from './components/AyahReader';
import HifzTracker from './components/HifzTracker';
import AIReviewer from './components/AIReviewer';
import TajweedTips from './components/TajweedTips';
import HifzMaster from './components/HifzMaster';
import { ViewState, ListMode, HifzProgress, SearchResult, QuranScript, FontSize } from './types';
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
  
  const [quranScript, setQuranScript] = useState<QuranScript>(() => {
    const saved = localStorage.getItem('quran-script');
    return (saved as QuranScript) || 'uthmani';
  });

  const [arabicFontSize, setArabicFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('arabic-font-size');
    return (saved as FontSize) || 'md';
  });

  const [englishFontSize, setEnglishFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('english-font-size');
    return (saved as FontSize) || 'md';
  });

  const [tamilFontSize, setTamilFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem('tamil-font-size');
    return (saved as FontSize) || 'md';
  });
  
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

  useEffect(() => {
    localStorage.setItem('quran-script', quranScript);
  }, [quranScript]);

  useEffect(() => {
    localStorage.setItem('arabic-font-size', arabicFontSize);
    localStorage.setItem('english-font-size', englishFontSize);
    localStorage.setItem('tamil-font-size', tamilFontSize);
  }, [arabicFontSize, englishFontSize, tamilFontSize]);

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
      <div className="space-y-3 animate-in fade-in duration-500">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-emerald-800 uppercase tracking-tight">The Holy Quran</h2>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="text-slate-400 group-focus-within:text-emerald-500 text-sm">🔍</span>
              </div>
              <input 
                type="text"
                placeholder={listMode === 'surah' ? "Search word or topic..." : "Search Juz..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value === '') setSearchResults([]);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleDeepSearch()}
                className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-32 text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
              />
              <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
                <button 
                  onClick={isRecordingSearch ? stopVoiceSearch : startVoiceSearch}
                  className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                    isRecordingSearch 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                  title="Voice Search"
                >
                  <span className="text-base">{isRecordingSearch ? '⏹' : '🎙️'}</span>
                </button>
                <button 
                  onClick={() => handleDeepSearch()}
                  className="bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
            
            {(isTranscribing || isRecordingSearch) && (
              <div className="flex items-center gap-2 px-3 animate-pulse">
                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                  {isRecordingSearch ? 'Listening...' : 'Transcribing...'}
                </span>
              </div>
            )}
          </div>

          { (isSearchingContent || searchResults.length > 0) && (
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 animate-in slide-in-from-top-2 shadow-xl overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Matches for "{searchQuery}"</h3>
                {isSearchingContent && <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>}
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
                {searchResults.length === 0 && !isSearchingContent ? (
                   <p className="text-slate-500 text-[10px] italic text-center py-2">No matches found.</p>
                ) : (
                  searchResults.map((res, i) => (
                    <div 
                      key={i}
                      className="w-full bg-white/5 p-3 rounded-xl border border-white/5 text-left hover:bg-white/[0.08] transition-all group relative"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <button 
                          onClick={() => openSurahById(res.surahId)}
                          className="text-[9px] font-black text-emerald-400 hover:underline"
                        >
                          {res.surahName} {res.surahId}:{res.ayahNumber}
                        </button>
                        <button 
                          onClick={() => copyToClipboard(res)}
                          className={`p-1 px-2 rounded-lg text-[8px] font-bold transition-all ${
                            copyStatus === (res.surahId + '-' + res.ayahNumber) ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {copyStatus === (res.surahId + '-' + res.ayahNumber) ? 'Done!' : 'Copy'}
                        </button>
                      </div>
                      <p className={`${quranScript === 'uthmani' ? 'font-uthmani' : 'font-indopak'} text-lg text-right text-white leading-relaxed mb-2 dir-rtl`}>{res.arabicText}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 shadow-inner">
            <button
              onClick={() => setListMode('surah')}
              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                listMode === 'surah' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500'
              }`}
            >
              Surahs
            </button>
            <button
              onClick={() => setListMode('juz')}
              className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                listMode === 'juz' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500'
              }`}
            >
              Juz
            </button>
          </div>
        </div>

        {listMode === 'surah' ? (
          <div className="grid grid-cols-1 gap-2">
            {filteredSurahs.map((surah) => (
              <button
                key={surah.id}
                onClick={() => openSurahById(surah.id)}
                className="w-full bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between transition-all group hover:border-emerald-100 hover:shadow-md"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    {surah.id}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 text-sm">{surah.name}</h4>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Surah {surah.id}</span>
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-[9px] text-emerald-600 font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Read →</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredJuzs.map((juz) => (
              <button
                key={juz.id}
                onClick={() => openSurahById(juz.startSurah)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-100 hover:shadow-md transition-all group text-left flex flex-col justify-between h-28"
              >
                <div>
                  <h4 className="font-black text-slate-800 text-lg">Juz {juz.id}</h4>
                  <p className="text-[8px] text-slate-400 font-bold leading-tight mt-1 uppercase tracking-tighter">
                    Starts: {ALL_SURAH_NAMES[juz.startSurah - 1]}
                  </p>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                    Begin
                  </span>
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
          script={quranScript}
          setScript={setQuranScript}
          arabicFontSize={arabicFontSize}
          setArabicFontSize={setArabicFontSize}
          englishFontSize={englishFontSize}
          setEnglishFontSize={setEnglishFontSize}
          tamilFontSize={tamilFontSize}
          setTamilFontSize={setTamilFontSize}
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
      case 'hifz-master':
        return <HifzMaster script={quranScript} fontSize={arabicFontSize} setFontSize={setArabicFontSize} />;
      case 'tracker':
        return <HifzTracker progress={progress} />;
      case 'ai-verify':
        return <AIReviewer script={quranScript} fontSize={arabicFontSize} />;
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
