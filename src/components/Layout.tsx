import React, { useState } from 'react';
import { LayoutDashboard, Users, Settings, Wifi, WifiOff, Brain, Activity } from 'lucide-react';
import { AvatarPanel } from './AvatarPanel';
import { SettingsModal } from './SettingsModal';
import { useStratyxContext } from '../contexts/StratyxContext';
import { useCoachAnalytics } from '../contexts/CoachAnalyticsContext';

type View = 'dashboard' | 'player-analysis' | 'strategy-debt';

interface LayoutProps {
  children: React.ReactNode;
  currentView?: View;
  onViewChange?: (view: View) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView = 'dashboard', onViewChange }) => {
  const { currentSeries: legacySeries, isLive: legacyIsLive } = useStratyxContext();
  const { selectedSeries, analyzedSeries, seriesError } = useCoachAnalytics();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Prioritize Coach Analytics Context (New System)
  const isAnalysisActive = !!selectedSeries;
  const homeTeam = selectedSeries?.teams?.[0]?.baseInfo?.name 
    || legacySeries?.teams?.[0]?.baseInfo?.name 
    || 'TEAM A';
  const awayTeam = selectedSeries?.teams?.[1]?.baseInfo?.name 
    || legacySeries?.teams?.[1]?.baseInfo?.name 
    || 'TEAM B';
  const tournamentName = selectedSeries?.tournament?.name 
    || legacySeries?.tournament?.name 
    || 'Select a Match';
  const gameName = selectedSeries?.title?.name 
    || legacySeries?.title?.name 
    || '';
    
  // Determine Live Status and Series Score
  // For now, if we have an analyzed series and it's not finished, we treat it as potentially live or just "Analyzed"
  const isLive = legacyIsLive || (analyzedSeries?.state?.started && !analyzedSeries?.state?.finished);
  const displayStatus = isLive ? 'LIVE MATCH' : isAnalysisActive ? 'ANALYSIS ACTIVE' : 'C9 STANDBY';
  
  // Get actual series score from API data
  const homeScore = analyzedSeries?.state?.teams?.[0]?.score ?? 0;
  const awayScore = analyzedSeries?.state?.teams?.[1]?.score ?? 0;
  const hasSeriesData = !!analyzedSeries?.state;

  const apiError = seriesError; // Use series error from analytics context

  return (
    <div className="relative flex h-screen bg-background text-slate-200 overflow-hidden">
      <div className="app-background" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="bg-grid" />
        <div className="bg-stars" />
        <div className="bg-scan" />
      </div>
      {/* Sidebar */}
      <aside className="relative z-10 w-64 border-r border-slate-800 bg-surface/90 backdrop-blur-md flex flex-col">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-game tracking-widest drop-shadow-[0_0_10px_rgba(0,204,255,0.5)]">STRATYX</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mt-1">AI TACTICAL SYS</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Live Dashboard"
            active={currentView === 'dashboard'}
            onClick={() => onViewChange?.('dashboard')}
          />
          <NavItem
            icon={<Brain size={20} />}
            label="Coach Insights"
            active={currentView === 'strategy-debt'}
            onClick={() => onViewChange?.('strategy-debt')}
          />
          <NavItem
            icon={<Users size={20} />}
            label="Player Analysis"
            active={currentView === 'player-analysis'}
            onClick={() => onViewChange?.('player-analysis')}
          />
        </nav>

        {/* API Status Indicator */}
        <div className="px-4 py-2">
          <div 
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
              apiError 
                ? 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/20' 
                : 'bg-success/10 border border-success/20 hover:bg-success/20'
            }`}
            onClick={() => setIsSettingsOpen(true)}
          >
            {apiError ? (
              <>
                <WifiOff size={12} className="text-red-500" />
                <span className="text-red-500 font-medium">API Error</span>
              </>
            ) : (
              <>
                <Wifi size={12} className="text-success" />
                <span className="text-success font-medium">API Connected</span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            onClick={() => setIsSettingsOpen(true)}
          />
        </div>
      </aside>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />


      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Header HUD */}
        <header className="h-16 border-b border-slate-800 bg-surface/80 backdrop-blur flex items-center justify-between px-8 relative">
           <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
           
          <div className="flex items-center space-x-6">
            <div className={`flex items-center gap-2 px-3 py-1 rounded border ${
              isLive 
                ? 'bg-danger/10 border-danger/20 animate-pulse' 
                : isAnalysisActive 
                  ? 'bg-primary/10 border-primary/20'
                  : 'bg-slate-500/10 border-slate-500/20'
            }`}>
                {isLive ? (
                  <Wifi size={12} className="text-success" />
                ) : isAnalysisActive ? (
                  <Activity size={12} className="text-primary" />
                ) : (
                  <WifiOff size={12} className="text-slate-500" />
                )}
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]' : isAnalysisActive ? 'bg-primary' : 'bg-slate-600'}`} />
                <span className={`text-xs font-bold tracking-widest ${isLive ? 'text-danger' : isAnalysisActive ? 'text-primary' : 'text-slate-500'}`}>
                  {displayStatus}
                </span>
            </div>
            
            <div className="flex flex-col">
                <h2 className="text-lg font-game text-white tracking-wider flex items-center gap-2">
                    <span className="text-primary">{homeTeam}</span>
                    <span className="text-slate-600 text-xs">VS</span>
                    <span className="text-accent">{awayTeam}</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">{tournamentName} {gameName && `// ${gameName}`}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            {apiError && (
              <div className="text-xs text-danger bg-danger/10 px-2 py-1 rounded">
                API Error: {apiError}
              </div>
            )}
            {hasSeriesData ? (
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Series Score</p>
                <div className="flex items-center justify-end gap-3">
                    <span className="text-2xl font-game font-bold text-primary drop-shadow-[0_0_10px_rgba(0,204,255,0.5)]">
                      {homeScore}
                    </span>
                    <span className="text-lg text-slate-600">-</span>
                    <span className="text-2xl font-game font-bold text-accent drop-shadow-[0_0_10px_rgba(255,107,107,0.5)]">
                      {awayScore}
                    </span>
                </div>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Status</p>
                <div className="flex items-end justify-end gap-2">
                    <span className="text-lg font-game text-slate-400">
                      Select Match
                    </span>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto p-8">
            {children}
          </div>
          <aside className="hidden lg:flex w-80 xl:w-96 border-l border-slate-800 bg-surface/80 backdrop-blur flex-col">
            <AvatarPanel />
          </aside>
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`relative w-full flex items-center space-x-3 px-4 py-3 rounded-none text-sm font-medium transition-all duration-300 group overflow-hidden ${
      active 
        ? 'text-primary bg-gradient-to-r from-primary/10 to-transparent border-l-2 border-primary' 
        : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent hover:border-slate-600'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,204,255,0.8)]' : 'group-hover:scale-110'}`}>
        {icon}
    </div>
    <span className="font-game tracking-wide uppercase">{label}</span>
    
    {/* Hover Glitch Effect Line */}
    <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 transform skew-x-12 opacity-50" />
  </button>
);
