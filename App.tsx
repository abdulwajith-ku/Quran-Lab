
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import AyahReader from './components/AyahReader';
import HifzTracker from './components/HifzTracker';
import AIReviewer from './components/AIReviewer';
import HifzMaster from './components/HifzMaster';
import Settings from './components/Settings';
import { ViewState, ListMode, HifzProgress, SearchResult, QuranScript, FontSize } from './types';
import { ALL_SURAH_NAMES, JUZ_DATA, SURAH_METADATA } from './data/quranData';
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
  
  const [mushafMode, setMushafMode] = useState<boolean>(() => {
    return localStorage.getItem('mushaf-mode') === 'true';
  });
  const [showWordByWord, setShowWordByWord] = useState<boolean>(() => {
    const saved = localStorage.getItem('show-wbw');
    return saved === null ? true : saved === 'true';
  });
  const [showTajweed, setShowTajweed] = useState<boolean>(() => {
    const saved = localStorage.getItem('show-tajweed');
    return saved === null ? true : saved === 'true';
  });

  const [showEnglish, setShowEnglish] = useState<boolean>(() => {
    const saved = localStorage.getItem('show-english');
    return saved === null ? true : saved === 'true';
  });

  const [showTamil, setShowTamil] = useState<boolean>(() => {
    const saved = localStorage.getItem('show-tamil');
    return saved === null ? true : saved === 'true';
  });

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
    localStorage.setItem('arabic-font-size', arabicFontSize);
    localStorage.setItem('english-font-size', englishFontSize);
    localStorage.setItem('tamil-font-size', tamilFontSize);
    localStorage.setItem('mushaf-mode', mushafMode.toString());
    localStorage.setItem('show-wbw', showWordByWord.toString());
    localStorage.setItem('show-tajweed', showTajweed.toString());
    localStorage.setItem('show-english', showEnglish.toString());
    localStorage.setItem('show-tamil', showTamil.toString());
  }, [quranScript, arabicFontSize, englishFontSize, tamilFontSize, mushafMode, showWordByWord, showTajweed, showEnglish, showTamil]);

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
    return ALL_SURAH_NAMES.map((name, idx) => {
        const meta = SURAH_METADATA.find(m => m.id === idx + 1);
        return { 
            name, 
            id: idx + 1, 
            type: meta?.type || 'Meccan', 
            total: meta?.total_ayahs || 0 
        };
    }).filter(s => 
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
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Explore Al-Quran</h2>
            <div className="flex gap-2">
                 <button onClick={() => setListMode('surah')} className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${listMode === 'surah' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Surahs</button>
                 <button onClick={() => setListMode('juz')} className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${listMode === 'juz' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Juz</button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <input 
                type="text"
                placeholder="Search surah, verse or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDeepSearch()}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-sm"
              />
              <div className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</div>
              <button 
                onClick={isRecordingSearch ? stopVoiceSearch : startVoiceSearch}
                className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600 border border-slate-200"
              >
                {isRecordingSearch ? '⏹' : '🎙️'}
              </button>
            </div>
          </div>

          { (isSearchingContent || searchResults.length > 0) && (
            <div className="bg-slate-900 rounded-[2.5rem] p-6 border border-slate-800 animate-in slide-in-from-top-2 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Search Matches</h3>
                <button onClick={() => setSearchResults([])} className="text-slate-500 text-xs">Close</button>
              </div>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {searchResults.map((res, i) => (
                  <button 
                    key={i}
                    onClick={() => openSurahById(res.surahId)}
                    className="w-full bg-white/5 p-4 rounded-2xl text-left border border-white/5 hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-black text-emerald-500 uppercase">{res.surahName} • {res.surahId}:{res.ayahNumber}</span>
                    </div>
                    <p className={`${quranScript === 'uthmani' ? 'font-uthmani' : 'font-indopak'} text-lg text-white text-right dir-rtl leading-relaxed`}>{res.arabicText}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {listMode === 'surah' ? (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredSurahs.map((surah) => {
              const prog = progress.find(p => p.surahId === surah.id);
              const memCount = prog?.ayahsMemorized?.length || 0;
              const surahPercent = surah.total > 0 ? (memCount / surah.total) * 100 : 0;
              
              return (
                <button
                  key={surah.id}
                  onClick={() => openSurahById(surah.id)}
                  className="w-full bg-white p-4 rounded-[2rem] border border-slate-100 flex items-center justify-between transition-all group hover:border-emerald-100 hover:shadow-md active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90 absolute">
                          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-slate-100" />
                          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="transparent" strokeDasharray={125.6} strokeDashoffset={125.6 * (1 - surahPercent / 100)} className={`${surahPercent > 0 ? 'text-emerald-500' : 'text-transparent'} transition-all duration-1000`} />
                        </svg>
                        <span className="font-black text-xs text-slate-800">{surah.id}</span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm leading-none">{surah.name}</h4>
                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full ${surah.type === 'Meccan' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {surah.type}
                        </span>
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">
                        {surah.total} Ayahs {memCount > 0 && `• ${memCount} Memorized`}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                     <span className="text-xs">→</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredJuzs.map((juz) => (
              <button
                key={juz.id}
                onClick={() => openSurahById(juz.startSurah)}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-emerald-100 active:scale-[0.98] transition-all group text-left h-36 flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-black text-slate-800 text-xl">Juz {juz.id}</h4>
                  <p className="text-[9px] text-slate-400 font-black leading-tight mt-1 uppercase tracking-tighter">
                    Starts at {ALL_SURAH_NAMES[juz.startSurah - 1]}
                  </p>
                </div>
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase self-start group-hover:bg-emerald-600 group-hover:text-white transition-all">Open Section</span>
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
          mushafMode={mushafMode}
          showWordByWord={showWordByWord}
          showTajweed={showTajweed}
          showEnglish={showEnglish}
          showTamil={showTamil}
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
      case 'surah-list': return renderSelectionList();
      case 'hifz-master': return <HifzMaster script={quranScript} fontSize={arabicFontSize} setFontSize={setArabicFontSize} />;
      case 'tracker': return <HifzTracker progress={progress} />;
      case 'ai-verify': return <AIReviewer script={quranScript} fontSize={arabicFontSize} />;
      case 'settings':
        return (
          <Settings 
            mushafMode={mushafMode} setMushafMode={setMushafMode}
            showWordByWord={showWordByWord} setShowWordByWord={setShowWordByWord}
            showTajweed={showTajweed} setShowTajweed={setShowTajweed}
            showEnglish={showEnglish} setShowEnglish={setShowEnglish}
            showTamil={showTamil} setShowTamil={setShowTamil}
            quranScript={quranScript} setQuranScript={setQuranScript}
            arabicFontSize={arabicFontSize} setArabicFontSize={setArabicFontSize}
            englishFontSize={englishFontSize} setEnglishFontSize={setEnglishFontSize}
            tamilFontSize={tamilFontSize} setTamilFontSize={setTamilFontSize}
          />
        );
      default: return null;
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {renderContent()}
    </Layout>
  );
};

export default App;
