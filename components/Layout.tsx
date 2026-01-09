
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
      <header className="bg-emerald-700 text-white p-6 sticky top-0 z-50 rounded-b-3xl shadow-lg">
        <h1 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <span>🌙</span> Al-Hifz Companion
        </h1>
        <p className="text-emerald-100 text-xs text-center mt-1">Memorize The Quran with Tajweed & Translation.</p>
      </header>

      <main className="flex-1 p-4 pb-32 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around p-3 z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeView === item.id ? 'text-emerald-700 font-bold' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
            {activeView === item.id && <div className="w-1 h-1 bg-emerald-700 rounded-full"></div>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
