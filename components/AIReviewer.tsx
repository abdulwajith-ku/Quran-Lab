
import React, { useState, useRef, useEffect } from 'react';
import { verifyRecitation } from '../services/geminiService';
import { fetchSurahData } from '../services/quranService';
import { ALL_SURAH_NAMES } from '../data/quranData';
import { PastReview, Surah, Ayah, QuranScript, FontSize } from '../types';

interface AIReviewerProps {
  script?: QuranScript;
  fontSize?: FontSize;
}

const AIReviewer: React.FC<AIReviewerProps> = ({ script = 'uthmani', fontSize = 'md' }) => {
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
  const [micError, setMicError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);

  const arabicClass = script === 'uthmani' ? 'font-uthmani' : 'font-indopak';
  
  const getFontSizeClass = () => {
    switch(fontSize) {
      case 'sm': return 'text-xl leading-relaxed';
      case 'md': return 'text-3xl leading-relaxed';
      case 'lg': return 'text-4xl leading-relaxed';
      case 'xl': return 'text-5xl leading-relaxed';
      default: return 'text-3xl leading-relaxed';
    }
  };

  const fontSizeClass = getFontSizeClass();

  useEffect(() => {
    const saved = localStorage.getItem('hifz-reviews');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const loadSurah = async () => {
      setLoadingSurah(true);
      try {
        const data = await fetchSurahData(selectedSurahId);
        setCurrentSurah(data);
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
    setMicError(null);
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
            setFeedback("Error analyzing audio. Please check your connection.");
          } finally {
            setIsAnalyzing(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedback(null);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError("Microphone access denied. Please allow microphone access in your browser settings and system privacy settings.");
      } else {
        setMicError("Could not access microphone. Please check your hardware or system settings.");
      }
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
            ← Back
          </button>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-4">📭</p>
            <p>No history yet.</p>
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      playingHistoryId === item.id ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-emerald-700'
                    }`}
                  >
                    {playingHistoryId === item.id ? '⏸' : '▶'}
                  </button>
                </div>
                <div className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl">
                  {item.feedback.slice(0, 100)}...
                </div>
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
          <h2 className="text-xl font-bold text-emerald-900 mb-1">AI Reviewer</h2>
          <p className="text-xs text-emerald-700">Practice your recitation.</p>
        </div>
        <button 
          onClick={() => setShowHistory(true)}
          className="bg-white text-emerald-700 font-bold text-xs py-2 px-4 rounded-xl shadow-sm"
        >
          History 🕒
        </button>
      </div>

      {micError && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
          <span className="text-red-500">⚠️</span>
          <div className="space-y-1">
            <p className="text-xs font-bold text-red-700">Microphone Access Error</p>
            <p className="text-[10px] text-red-600 leading-tight">{micError}</p>
            <p className="text-[10px] text-red-500 italic mt-2">Tip: Check if another app is using the mic or refresh the page.</p>
          </div>
        </div>
      )}

      <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Surah</label>
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
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Ayah</label>
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

        <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100 relative group overflow-hidden">
          {loadingSurah ? (
            <div className="animate-pulse h-12 bg-slate-200 rounded w-full"></div>
          ) : (
            <>
              <p className={`${arabicClass} ${fontSizeClass} text-slate-800 mb-4 dir-rtl`}>{selectedAyah?.text}</p>
              <p className="text-xs text-slate-500 italic">{selectedAyah?.translation_en}</p>
            </>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-6 gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing || loadingSurah}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700 shadow-xl'
            } text-white text-2xl disabled:opacity-50`}
          >
            {isRecording ? '⏹️' : '🎙️'}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
            {isRecording ? 'Recording... Tap to stop' : isAnalyzing ? 'Gemini is analyzing...' : 'Tap to start recording'}
          </span>
        </div>
      </div>

      {feedback && (
        <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-xl animate-in zoom-in duration-300 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-sm uppercase tracking-widest text-emerald-800">AI Feedback</h3>
            <button onClick={() => setFeedback(null)} className="text-slate-300">✕</button>
          </div>
          <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-[2rem]">
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReviewer;
