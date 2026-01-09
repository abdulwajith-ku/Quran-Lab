
import React from 'react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange }) => {
  const navItems: { id: ViewState; label: string; icon: string }[] = [
    { id: 'surah-list', label: 'Read', icon: '📖' },
    { id: 'hifz-master', label: 'Practice', icon: '🎯' },
    { id: 'tracker', label: 'Tracker', icon: '📈' },
    { id: 'ai-verify', label: 'AI Review', icon: '🎙️' },
    { id: 'tajweed-tips', label: 'Tajweed', icon: '✨' },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto bg-white shadow-xl relative">
      <header className="bg-emerald-700 text-white p-4 sticky top-0 z-50 rounded-b-2xl shadow-lg">
        <h1 className="text-xl font-bold text-center flex items-center justify-center gap-2">
          <span>🌙</span> Al-Hifz Companion
        </h1>
        <p className="text-emerald-100 text-[10px] text-center mt-0.5 opacity-80 uppercase tracking-widest font-medium">Tamil & English Word-By-Word</p>
      </header>

      <main className="flex-1 p-3 pb-32 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around p-2 z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${
              activeView === item.id ? 'text-emerald-700 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[9px] uppercase tracking-wider font-bold">{item.label}</span>
            {activeView === item.id && <div className="w-1 h-1 bg-emerald-700 rounded-full mt-0.5"></div>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
