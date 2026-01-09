
import React, { useState, useRef, useEffect } from 'react';
import { verifyRecitation } from '../services/geminiService';
import { fetchSurahData } from '../services/quranService';
import { ALL_SURAH_NAMES } from '../data/quranData';
import { PastReview, Surah, Ayah } from '../types';

const AIReviewer: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSurahId, setSelectedSurahId] = useState(1);
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
  const [selectedAyahNum, setSelectedAyahNum] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [showFullSurah, setShowFullSurah] = useState(false);
  const [history, setHistory] = useState<PastReview[]>([]);
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const [loadingSurah, setLoadingSurah] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem('hifz-reviews');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Fetch full Surah data when ID changes
  useEffect(() => {
    const loadSurah = async () => {
      setLoadingSurah(true);
      try {
        const data = await fetchSurahData(selectedSurahId);
        setCurrentSurah(data);
        // Reset Ayah num if current is out of bounds
        if (selectedAyahNum > data.total_ayahs) {
          setSelectedAyahNum(1);
        }
      } catch (err) {
        console.error("Failed to load surah", err);
      } finally {
        setLoadingSurah(false);
      }
    };
    loadSurah();
  }, [selectedSurahId]);

  const saveToHistory = (newReview: PastReview) => {
    const updatedHistory = [newReview, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('hifz-reviews', JSON.stringify(updatedHistory));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsAnalyzing(true);
          try {
            const ayah = currentSurah?.ayahs.find(a => a.number === selectedAyahNum);
            const result = await verifyRecitation(
              base64Audio, 
              ayah?.text || "", 
              currentSurah?.name || ""
            );
            setFeedback(result);
            
            const newReview: PastReview = {
              id: Date.now().toString(),
              surahName: currentSurah?.name || "Unknown",
              ayahNum: selectedAyahNum,
              feedback: result,
              timestamp: Date.now(),
              audioBase64: base64Audio
            };
            saveToHistory(newReview);
          } catch (error) {
            setFeedback("Error analyzing audio. Please ensure you have a stable connection.");
          } finally {
            setIsAnalyzing(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedback(null);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please enable microphone access to use AI Review.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const playHistoryAudio = (base64: string, id: string) => {
    if (playingHistoryId === id) {
      historyAudioRef.current?.pause();
      setPlayingHistoryId(null);
      return;
    }
    if (historyAudioRef.current) historyAudioRef.current.pause();
    
    const audio = new Audio(`data:audio/webm;base64,${base64}`);
    historyAudioRef.current = audio;
    setPlayingHistoryId(id);
    audio.play();
    audio.onended = () => setPlayingHistoryId(null);
  };

  const selectedAyah = currentSurah?.ayahs.find(a => a.number === selectedAyahNum);

  if (showHistory) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Review History</h2>
          <button 
            onClick={() => setShowHistory(false)}
            className="text-emerald-700 text-sm font-bold bg-emerald-50 px-4 py-2 rounded-xl"
          >
            ← Back to Recite
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-4">📭</p>
            <p>No history yet. Start reciting!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">{item.surahName}</h3>
                    <p className="text-xs text-slate-400">Ayah {item.ayahNum} • {new Date(item.timestamp).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => playHistoryAudio(item.audioBase64, item.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      playingHistoryId === item.id ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-emerald-700 border border-slate-100'
                    }`}
                  >
                    {playingHistoryId === item.id ? '⏸' : '▶'}
                  </button>
                </div>
                <div className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {item.feedback.slice(0, 150)}{item.feedback.length > 150 ? '...' : ''}
                </div>
                <button 
                  onClick={() => {
                    setFeedback(item.feedback);
                    setShowHistory(false);
                  }}
                  className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest"
                >
                  View Full Feedback
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-emerald-900 mb-1">AI Recitation Review</h2>
          <p className="text-xs text-emerald-700">Practice with full Surah context.</p>
        </div>
        <button 
          onClick={() => setShowHistory(true)}
          className="bg-white text-emerald-700 font-bold text-xs py-2 px-4 rounded-xl shadow-sm border border-emerald-100 hover:bg-emerald-100 transition-colors"
        >
          History 🕒
        </button>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">SURAH</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={selectedSurahId}
              onChange={(e) => setSelectedSurahId(parseInt(e.target.value))}
            >
              {ALL_SURAH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">AYAH</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={selectedAyahNum}
              onChange={(e) => setSelectedAyahNum(parseInt(e.target.value))}
              disabled={loadingSurah}
            >
              {currentSurah ? currentSurah.ayahs.map(a => (
                <option key={a.number} value={a.number}>Ayah {a.number}</option>
              )) : <option>Loading...</option>}
            </select>
          </div>
        </div>

        {/* Highlighted Target Ayah */}
        <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100 relative group overflow-hidden">
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-black uppercase tracking-wider">Target Verse</div>
          {loadingSurah ? (
            <div className="animate-pulse space-y-3">
               <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto"></div>
               <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto"></div>
            </div>
          ) : (
            <>
              <p className="quran-font text-3xl text-slate-800 leading-relaxed mb-4 dir-rtl">{selectedAyah?.text}</p>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Translation</p>
              <p className="text-xs text-slate-500 italic px-4 line-clamp-3">{selectedAyah?.translation_en}</p>
            </>
          )}
        </div>

        {/* Full Surah Verse List - "AL View" */}
        <div className="mt-4">
          <button 
            onClick={() => setShowFullSurah(!showFullSurah)}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {showFullSurah ? 'Hide Full Surah Text' : '📖 View Full Surah Context'}
          </button>
          
          {showFullSurah && currentSurah && (
            <div className="mt-4 max-h-[400px] overflow-y-auto border border-slate-100 rounded-2xl p-4 bg-slate-50/30 space-y-4 scrollbar-hide">
              {currentSurah.ayahs.map((ayah) => (
                <div 
                  key={ayah.number}
                  onClick={() => {
                    setSelectedAyahNum(ayah.number);
                    setShowFullSurah(false);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                    selectedAyahNum === ayah.number 
                      ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500' 
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${selectedAyahNum === ayah.number ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      VERSE {ayah.number}
                    </span>
                  </div>
                  <p className="quran-font text-xl text-right text-slate-800 leading-relaxed dir-rtl">{ayah.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-6 gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing || loadingSurah}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
            } shadow-lg text-white text-2xl disabled:opacity-50`}
          >
            {isRecording ? '⏹️' : '🎙️'}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {isRecording ? 'Recording... Tap to stop' : isAnalyzing ? 'Analyzing...' : 'Tap to Start Review'}
          </span>
        </div>
      </div>

      {isAnalyzing && (
        <div className="flex flex-col items-center gap-3 p-10 bg-white rounded-[2.5rem] border border-dashed border-emerald-300 shadow-inner">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-emerald-700 font-bold text-xs uppercase tracking-widest">Gemini is analyzing...</p>
        </div>
      )}

      {feedback && (
        <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full opacity-50"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3 text-emerald-700">
              <span className="text-2xl">🎓</span>
              <h3 className="font-black text-sm uppercase tracking-widest">AI Teacher Feedback</h3>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-300 hover:text-slate-500 p-2">✕</button>
          </div>
          <div className="relative z-10 space-y-4">
            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
              {feedback}
            </div>
          </div>
          <p className="mt-6 text-[9px] text-slate-400 text-center font-bold uppercase tracking-[0.2em] relative z-10">
            Progress saved to your review history
          </p>
        </div>
      )}
    </div>
  );
};

export default AIReviewer;
