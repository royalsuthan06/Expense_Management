import React, { useState, useEffect } from 'react';
import {
  Home,
  Receipt,
  PieChart,
  Handshake,
  Menu,
  Plus,
  Wifi,
  Battery,
  Smartphone,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface PhoneFrameProps {
  currentTab: 'home' | 'records' | 'budget' | 'lending' | 'more';
  onTabChange: (tab: 'home' | 'records' | 'budget' | 'lending' | 'more') => void;
  onOpenAddModal: () => void;
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  currentTab,
  onTabChange,
  onOpenAddModal,
  children,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(() => {
    return window.innerWidth >= 1024 && localStorage.getItem('dhantrack_view_mode') === 'desktop';
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleViewMode = () => {
    const next = !isDesktopMode;
    setIsDesktopMode(next);
    localStorage.setItem('dhantrack_view_mode', next ? 'desktop' : 'phone');
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'records', label: 'Records', icon: Receipt },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'lending', label: 'Lending', icon: Handshake },
    { id: 'more', label: 'More', icon: Menu },
  ] as const;

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100 flex flex-col items-center justify-center p-0 md:p-6 selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Device Mode Toolbar for Preview (Responsive Controls) */}
      <div className="w-full max-w-5xl hidden md:flex items-center justify-between pb-3 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-xs shadow-teal-400/50" />
          <span className="font-semibold text-slate-200">DhanTrack Finance Manager</span>
          <span className="text-slate-500">·</span>
          <span>Android Flutter · SQLite Drift · Offline-First</span>
        </div>

        <button
          onClick={toggleViewMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          {isDesktopMode ? (
            <>
              <Smartphone className="h-3.5 w-3.5 text-teal-400" />
              <span>Switch to Phone Frame</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5 text-teal-400" />
              <span>Expand to Desktop View</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col bg-[#0b0f19] ${
          isDesktopMode
            ? 'max-w-4xl h-[92vh] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden'
            : 'max-w-[430px] h-screen md:h-[880px] md:rounded-[44px] md:border-[10px] md:border-slate-800/90 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden'
        }`}
      >
        {/* Android Status Bar */}
        <div className="shrink-0 h-11 px-6 flex items-center justify-between text-xs font-semibold text-slate-300 select-none bg-[#0b0f19] z-20">
          <span className="tabular-nums tracking-tight">{currentTime}</span>

          {/* Camera punch-hole simulation */}
          {!isDesktopMode && (
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800/80 shadow-inner" />
          )}

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[10px] font-bold tracking-tight text-teal-400 mr-0.5">5G</span>
            <Wifi className="h-3.5 w-3.5" />
            <Battery className="h-4 w-4" />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {children}

          {/* Floating Action Button (FAB) for quick add */}
          <button
            onClick={onOpenAddModal}
            aria-label="Add transaction"
            className="absolute bottom-20 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-400 text-slate-950 shadow-xl shadow-teal-500/25 hover:bg-teal-300 active:scale-95 transition-all"
          >
            <Plus className="h-7 w-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="shrink-0 h-16 border-t border-slate-800/80 bg-[#0d131f]/95 backdrop-blur-md px-2 flex items-center justify-around z-20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors group"
              >
                <div
                  className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-teal-500/20 text-teal-300 scale-105' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-tight mt-0.5 ${
                    isActive ? 'text-teal-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Android Gesture Pill */}
        {!isDesktopMode && (
          <div className="shrink-0 h-3 flex items-center justify-center bg-[#0d131f]">
            <div className="w-28 h-1 rounded-full bg-slate-700/60" />
          </div>
        )}
      </div>
    </div>
  );
};
