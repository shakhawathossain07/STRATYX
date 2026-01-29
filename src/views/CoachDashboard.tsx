/**
 * Coach Dashboard View - 100% GRID API Verified Data
 * 
 * Main dashboard showing:
 * - Series selection from GRID API
 * - Real match scores and results
 * - Player performance (kills, deaths, K/D)
 * - Team comparison
 * - Map breakdown
 * 
 * All data shown is directly from GRID API.
 */

import React, { useMemo } from 'react';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  RefreshCw,
  Database,
  ChevronRight,
  Brain,
  Award,
  Map,
  Crosshair,
  Info,
} from 'lucide-react';
import { useCoachAnalytics, GameType } from '../contexts/CoachAnalyticsContext';

interface CoachDashboardProps {
  onNavigate: (view: 'dashboard' | 'player-analysis' | 'strategy-debt') => void;
}

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ onNavigate }) => {
  const {
    selectedGame,
    setSelectedGame,
    filteredSeries,
    selectedSeries,
    analyzedSeries,
    isLoadingSeries,
    isAnalyzing,
    seriesError,
    analysisError,
    selectSeries,
    loadSeries,
  } = useCoachAnalytics();

  // Extract real data from analyzed series
  const matchData = useMemo(() => {
    if (!analyzedSeries?.state) return null;

    const state = analyzedSeries.state;
    const teams = state.teams || [];
    const games = state.games || [];

    // Team data
    const team1 = teams[0] || { id: '', name: 'Team 1', score: 0, won: false };
    const team2 = teams[1] || { id: '', name: 'Team 2', score: 0, won: false };

    // Calculate player stats from API data
    const playerStats: Record<string, {
      name: string;
      teamId: string;
      teamName: string;
      kills: number;
      deaths: number;
      kd: number;
      characters: string[];
    }> = {};

    games.forEach(game => {
      game.teams.forEach(gameTeam => {
        const teamName = teams.find(t => t.id === gameTeam.id)?.name || gameTeam.name || 'Unknown';
        
        gameTeam.players.forEach(player => {
          if (!playerStats[player.id]) {
            playerStats[player.id] = {
              name: player.name,
              teamId: gameTeam.id,
              teamName,
              kills: 0,
              deaths: 0,
              kd: 0,
              characters: [],
            };
          }
          playerStats[player.id].kills += player.kills || 0;
          playerStats[player.id].deaths += player.deaths || 0;
          
          const charName = typeof player.character === 'object' 
            ? player.character?.name 
            : player.character;
          if (charName && !playerStats[player.id].characters.includes(charName)) {
            playerStats[player.id].characters.push(charName);
          }
        });
      });
    });

    // Calculate K/D ratios
    Object.values(playerStats).forEach(p => {
      p.kd = p.deaths > 0 ? p.kills / p.deaths : p.kills;
    });

    // Team totals
    const team1Players = Object.values(playerStats).filter(p => p.teamId === team1.id);
    const team2Players = Object.values(playerStats).filter(p => p.teamId === team2.id);
    
    const team1Kills = team1Players.reduce((sum, p) => sum + p.kills, 0);
    const team1Deaths = team1Players.reduce((sum, p) => sum + p.deaths, 0);
    const team2Kills = team2Players.reduce((sum, p) => sum + p.kills, 0);
    const team2Deaths = team2Players.reduce((sum, p) => sum + p.deaths, 0);

    // Map breakdown
    const mapBreakdown = games.map((game, idx) => {
      const mapName = typeof game.map === 'object' ? game.map?.name : game.map;
      const t1 = game.teams.find(t => t.id === team1.id);
      const t2 = game.teams.find(t => t.id === team2.id);
      
      return {
        name: mapName || `Map ${idx + 1}`,
        team1Score: t1?.score || 0,
        team2Score: t2?.score || 0,
        team1Won: t1?.won || false,
      };
    });

    return {
      team1,
      team2,
      team1Kills,
      team1Deaths,
      team2Kills,
      team2Deaths,
      team1KD: team1Deaths > 0 ? team1Kills / team1Deaths : team1Kills,
      team2KD: team2Deaths > 0 ? team2Kills / team2Deaths : team2Kills,
      players: Object.values(playerStats).sort((a, b) => b.kd - a.kd),
      mapBreakdown,
      mapsPlayed: games.length,
    };
  }, [analyzedSeries]);

  return (
    <div className="space-y-6">
      {/* API Error Banner */}
      {seriesError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm text-amber-500 font-semibold">Data Loading Issue</p>
            <p className="text-xs text-slate-400">{seriesError}</p>
          </div>
        </div>
      )}

      {/* Series Selection Panel */}
      <div className="bg-surface border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Database size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Select Match to Analyze
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value as GameType)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-300"
            >
              <option value="valorant">VALORANT</option>
              <option value="lol">League of Legends</option>
              <option value="cs2">Counter-Strike 2</option>
              <option value="dota2">Dota 2</option>
            </select>
            <button
              onClick={() => loadSeries()}
              disabled={isLoadingSeries}
              className="p-2 bg-primary/10 hover:bg-primary/20 rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={`text-primary ${isLoadingSeries ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {isLoadingSeries ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={24} className="text-primary animate-spin" />
            <span className="ml-2 text-slate-400">Loading series...</span>
          </div>
        ) : filteredSeries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {filteredSeries.slice(0, 9).map((series) => (
              <button
                key={series.id}
                onClick={() => selectSeries(series)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selectedSeries?.id === series.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-slate-800/50 border-slate-700 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(series.startTimeScheduled).toLocaleDateString()}
                  </span>
                  {selectedSeries?.id === series.id && isAnalyzing && (
                    <RefreshCw size={10} className="text-primary animate-spin" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {series.teams?.[0]?.baseInfo?.name || 'TBD'} vs {series.teams?.[1]?.baseInfo?.name || 'TBD'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{series.tournament?.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Database size={32} className="mx-auto mb-2 opacity-50" />
            <p>No series available</p>
          </div>
        )}
      </div>

      {/* Selected Series Header */}
      {selectedSeries && (
        <div className="bg-surface border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="text-right">
                <h2 className="text-xl font-bold text-slate-100">{selectedSeries.teams[0]?.baseInfo.name || 'Team A'}</h2>
                <p className="text-xs text-slate-500">Home</p>
              </div>
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 p-2">
                {selectedSeries.teams[0]?.baseInfo.logoUrl ? (
                  <img src={selectedSeries.teams[0].baseInfo.logoUrl} alt="Team A" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-slate-600">A</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center px-8">
              <div className="text-3xl font-black text-white tracking-widest bg-slate-900/50 px-6 py-2 rounded-lg border border-slate-700">
                VS
              </div>
              <div className="mt-2 flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                  MATCH ANALYSIS
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(selectedSeries.startTimeScheduled).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-600 mt-1">{selectedSeries.tournament?.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-start">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 p-2">
                {selectedSeries.teams[1]?.baseInfo.logoUrl ? (
                  <img src={selectedSeries.teams[1].baseInfo.logoUrl} alt="Team B" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-slate-600">B</span>
                )}
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-slate-100">{selectedSeries.teams[1]?.baseInfo.name || 'Team B'}</h2>
                <p className="text-xs text-slate-500">Away</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {matchData ? (
        <>
          {/* Data Source Badge */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-green-400">100% GRID API Data</span>
            </div>
          </div>

          {/* Series Score */}
          <div className="bg-surface border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Award size={20} className="text-amber-400" />
              Series Result
            </h3>
            
            <div className="flex items-center justify-center gap-8">
              <div className={`text-center ${matchData.team1.won ? 'opacity-100' : 'opacity-60'}`}>
                <p className="text-sm text-slate-400 mb-2">{matchData.team1.name}</p>
                <p className={`text-5xl font-bold ${matchData.team1.won ? 'text-green-400' : 'text-slate-400'}`}>
                  {matchData.team1.score}
                </p>
                {matchData.team1.won && (
                  <span className="text-xs text-green-400 uppercase font-bold mt-2 inline-block">Winner</span>
                )}
              </div>
              
              <div className="text-2xl text-slate-600 font-bold">-</div>
              
              <div className={`text-center ${matchData.team2.won ? 'opacity-100' : 'opacity-60'}`}>
                <p className="text-sm text-slate-400 mb-2">{matchData.team2.name}</p>
                <p className={`text-5xl font-bold ${matchData.team2.won ? 'text-green-400' : 'text-slate-400'}`}>
                  {matchData.team2.score}
                </p>
                {matchData.team2.won && (
                  <span className="text-xs text-green-400 uppercase font-bold mt-2 inline-block">Winner</span>
                )}
              </div>
            </div>
          </div>

          {/* Key Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Crosshair className="text-green-400" />}
              label="Team 1 Kills"
              value={matchData.team1Kills.toString()}
              teamName={matchData.team1.name}
            />
            <StatCard
              icon={<Crosshair className="text-green-400" />}
              label="Team 2 Kills"
              value={matchData.team2Kills.toString()}
              teamName={matchData.team2.name}
            />
            <StatCard
              icon={<Target className="text-primary" />}
              label="Team 1 K/D"
              value={matchData.team1KD.toFixed(2)}
              teamName={matchData.team1.name}
              isPositive={matchData.team1KD >= 1}
            />
            <StatCard
              icon={<Target className="text-primary" />}
              label="Team 2 K/D"
              value={matchData.team2KD.toFixed(2)}
              teamName={matchData.team2.name}
              isPositive={matchData.team2KD >= 1}
            />
          </div>

          {/* Map Breakdown */}
          {matchData.mapBreakdown.length > 0 && (
            <div className="bg-surface border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Map size={20} className="text-primary" />
                Map Breakdown
              </h3>
              <div className="grid gap-3">
                {matchData.mapBreakdown.map((map, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-mono">MAP {idx + 1}</span>
                      <span className="font-medium text-white">{map.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-bold ${map.team1Won ? 'text-green-400' : 'text-slate-400'}`}>
                        {map.team1Score}
                      </span>
                      <span className="text-slate-600">-</span>
                      <span className={`text-lg font-bold ${!map.team1Won ? 'text-green-400' : 'text-slate-400'}`}>
                        {map.team2Score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player Performance Table */}
          <div className="bg-surface border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Player Performance
              </h3>
              <button 
                onClick={() => onNavigate('player-analysis')}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                Full Analysis <ChevronRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-3 pl-2">#</th>
                    <th className="pb-3">Player</th>
                    <th className="pb-3">Team</th>
                    <th className="pb-3 text-center">Kills</th>
                    <th className="pb-3 text-center">Deaths</th>
                    <th className="pb-3 text-center">K/D</th>
                    <th className="pb-3">Agents</th>
                  </tr>
                </thead>
                <tbody>
                  {matchData.players.slice(0, 10).map((player, idx) => (
                    <tr key={player.name + idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 pl-2 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3">
                        <span className="font-medium text-slate-200">{player.name}</span>
                      </td>
                      <td className="py-3 text-slate-400">{player.teamName}</td>
                      <td className="py-3 text-center text-green-400 font-medium">{player.kills}</td>
                      <td className="py-3 text-center text-red-400 font-medium">{player.deaths}</td>
                      <td className="py-3 text-center">
                        <span className={`font-bold ${
                          player.kd >= 1.5 ? 'text-green-400' : 
                          player.kd >= 1 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {player.kd.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1 flex-wrap">
                          {player.characters.map((char, cIdx) => (
                            <span 
                              key={cIdx}
                              className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded"
                            >
                              {char}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('player-analysis')}
              className="bg-surface border border-slate-800 rounded-xl p-6 text-left hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users size={24} className="text-primary" />
                <h3 className="text-lg font-bold text-slate-100">Player Analysis</h3>
                <ChevronRight size={16} className="text-slate-500 ml-auto group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-slate-400">
                Detailed per-player stats, per-map breakdowns, and agent performance.
              </p>
            </button>
            
            <button
              onClick={() => onNavigate('strategy-debt')}
              className="bg-surface border border-slate-800 rounded-xl p-6 text-left hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Brain size={24} className="text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100">Coach Insights</h3>
                <ChevronRight size={16} className="text-slate-500 ml-auto group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-slate-400">
                AI-generated insights based on K/D analysis and map performance.
              </p>
            </button>
          </div>

          {/* Data Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-300 font-medium">Data Source: GRID Esports API</p>
                <p className="text-xs text-slate-500 mt-1">
                  All statistics displayed are sourced directly from the GRID Series State API.
                  Available fields: kills, deaths, character/agent, map names, team scores, and win/loss status.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : selectedSeries && isAnalyzing ? (
        <div className="bg-surface border border-slate-800 rounded-xl p-12 text-center">
          <RefreshCw size={48} className="text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-100 mb-2">Analyzing Match Data</h3>
          <p className="text-slate-400">Fetching data from GRID API...</p>
        </div>
      ) : (
        <div className="bg-surface border border-slate-800 rounded-xl p-12 text-center">
          <Brain size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-100 mb-2">Select a Match to Analyze</h3>
          <p className="text-slate-400">Choose a series above to view match statistics</p>
        </div>
      )}

      {/* Analysis Error */}
      {analysisError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400" />
            <p className="text-red-400 font-medium">Analysis Error</p>
          </div>
          <p className="text-sm text-slate-400 mt-1">{analysisError}</p>
        </div>
      )}
    </div>
  );
};

// =====================================================
// HELPER COMPONENTS
// =====================================================

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  teamName: string;
  isPositive?: boolean;
}> = ({ icon, label, value, teamName, isPositive }) => (
  <div className="bg-surface border border-slate-800 rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 rounded-lg bg-slate-800">{icon}</div>
      {isPositive !== undefined && (
        isPositive 
          ? <TrendingUp size={16} className="text-green-400" />
          : <TrendingDown size={16} className="text-red-400" />
      )}
    </div>
    <p className={`text-2xl font-bold ${isPositive === undefined ? 'text-white' : isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {value}
    </p>
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-[10px] text-slate-500 mt-1">{teamName}</p>
  </div>
);

export default CoachDashboard;
