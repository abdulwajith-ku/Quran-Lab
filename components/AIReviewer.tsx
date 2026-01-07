
import React, { useState, useRef, useEffect } from 'react';
import { verifyRecitation } from '../services/geminiService';
import { QURAN_DATA } from '../data/quranData';
import { PastReview } from '../types';

const AIReviewer: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(QURAN_DATA[0]);
  const [selectedAyahNum, setSelectedAyahNum] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<PastReview[]>([]);
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hifz-reviews');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = (newReview: PastReview) => {
    const updatedHistory = [newReview, ...history].slice(0, 10); // Keep last 10 to manage storage
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
            const ayah = selectedSurah.ayahs.find(a => a.number === selectedAyahNum);
            const result = await verifyRecitation(
              base64Audio, 
              ayah?.text || "", 
              selectedSurah.name
            );
            setFeedback(result);
            
            // Save to history
            const newReview: PastReview = {
              id: Date.now().toString(),
              surahName: selectedSurah.name,
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

  const selectedAyah = selectedSurah.ayahs.find(a => a.number === selectedAyahNum);

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
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest py-4">
              Showing last 10 reviews
            </p>
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
          <p className="text-xs text-emerald-700">Get instant Tajweed feedback.</p>
        </div>
        <button 
          onClick={() => setShowHistory(true)}
          className="bg-white text-emerald-700 font-bold text-xs py-2 px-4 rounded-xl shadow-sm border border-emerald-100 hover:bg-emerald-100 transition-colors"
        >
          View History 🕒
        </button>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">SURAH</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={selectedSurah.id}
              onChange={(e) => {
                const s = QURAN_DATA.find(s => s.id === parseInt(e.target.value))!;
                setSelectedSurah(s);
                setSelectedAyahNum(1);
              }}
            >
              {QURAN_DATA.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">AYAH</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={selectedAyahNum}
              onChange={(e) => setSelectedAyahNum(parseInt(e.target.value))}
            >
              {selectedSurah.ayahs.map(a => <option key={a.number} value={a.number}>Ayah {a.number}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
          <p className="quran-font text-2xl text-slate-800 leading-relaxed mb-2">{selectedAyah?.text}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">English Translation</p>
          <p className="text-xs text-slate-500 italic px-4">{selectedAyah?.translation_en}</p>
        </div>

        <div className="flex flex-col items-center justify-center py-6 gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
            } shadow-lg text-white text-2xl disabled:opacity-50`}
          >
            {isRecording ? '⏹️' : '🎙️'}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {isRecording ? 'Recording... Tap to stop' : isAnalyzing ? 'Analyzing...' : 'Tap to Record'}
          </span>
        </div>
      </div>

      {isAnalyzing && (
        <div className="flex flex-col items-center gap-3 p-10 bg-white rounded-3xl border border-dashed border-emerald-300">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-emerald-700 font-medium text-sm">Gemini Teacher is analyzing your recitation...</p>
        </div>
      )}

      {feedback && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-md animate-in zoom-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="text-xl">🎓</span>
              <h3 className="font-bold">AI Teacher Feedback</h3>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-300 hover:text-slate-500">✕</button>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <div className="whitespace-pre-wrap font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">{feedback}</div>
          </div>
          <p className="mt-4 text-[10px] text-slate-400 text-center uppercase tracking-widest">Feedback saved to history</p>
        </div>
      )}
    </div>
  );
};

export default AIReviewer;
