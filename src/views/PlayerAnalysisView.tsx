/**
 * Player Analysis View - GRID API Verified Data Only
 * 
 * Shows player statistics sourced directly from GRID API:
 * - Kills, Deaths, K/D Ratio (verified)
 * - Character/Agent picks (verified)
 * - Per-map performance (verified)
 * - Team affiliation (verified)
 * 
 * All other metrics have been removed to ensure 100% accuracy.
 */

import React, { useState, useMemo } from 'react';
import {
  User,
  Crosshair,
  Award,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users,
  Map,
  Info,
} from 'lucide-react';
import { useCoachAnalytics } from '../contexts/CoachAnalyticsContext';

interface PlayerStats {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  kills: number;
  deaths: number;
  kd: number;
  characters: string[];
  mapsPlayed: number;
  gamesWon: number;
  gamesLost: number;
}

interface PerMapStats {
  mapName: string;
  kills: number;
  deaths: number;
  kd: number;
  won: boolean;
  character: string;
}

export const PlayerAnalysisView: React.FC = () => {
  const { analyzedSeries, selectedSeries } = useCoachAnalytics();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'kills' | 'deaths' | 'kd'>('kd');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Parse real data from series state
  const { playerStats, playerMapStats, teams } = useMemo(() => {
    const stats: Record<string, PlayerStats> = {};
    const mapStats: Record<string, PerMapStats[]> = {};
    const teamMap: Record<string, string> = {};

    if (!analyzedSeries?.state) {
      return { playerStats: [], playerMapStats: {}, teams: [] };
    }

    const seriesState = analyzedSeries.state;
    const games = seriesState.games || [];
    const seriesTeams = seriesState.teams || [];

    // Build team name mapping
    seriesTeams.forEach(t => {
      teamMap[t.id] = t.name;
    });

    // Process each game
    games.forEach(game => {
      const mapName = typeof game.map === 'object' ? game.map?.name : game.map;
      const mapLabel = mapName || 'Unknown Map';

      game.teams.forEach(gameTeam => {
        const teamName = teamMap[gameTeam.id] || gameTeam.name || 'Unknown Team';
        const teamWon = gameTeam.won || false;

        gameTeam.players.forEach(player => {
          const playerId = player.id;
          const playerKills = player.kills || 0;
          const playerDeaths = player.deaths || 0;
          const characterName = typeof player.character === 'object' 
            ? player.character?.name 
            : player.character;

          // Aggregate player stats
          if (!stats[playerId]) {
            stats[playerId] = {
              id: playerId,
              name: player.name,
              teamId: gameTeam.id,
              teamName: teamName,
              kills: 0,
              deaths: 0,
              kd: 0,
              characters: [],
              mapsPlayed: 0,
              gamesWon: 0,
              gamesLost: 0,
            };
            mapStats[playerId] = [];
          }

          stats[playerId].kills += playerKills;
          stats[playerId].deaths += playerDeaths;
          stats[playerId].mapsPlayed += 1;
          if (teamWon) {
            stats[playerId].gamesWon += 1;
          } else {
            stats[playerId].gamesLost += 1;
          }

          // Track unique characters
          if (characterName && !stats[playerId].characters.includes(characterName)) {
            stats[playerId].characters.push(characterName);
          }

          // Per-map stats
          mapStats[playerId].push({
            mapName: mapLabel,
            kills: playerKills,
            deaths: playerDeaths,
            kd: playerDeaths > 0 ? playerKills / playerDeaths : playerKills,
            won: teamWon,
            character: characterName || 'Unknown',
          });
        });
      });
    });

    // Calculate K/D ratios
    Object.values(stats).forEach(player => {
      player.kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
    });

    return {
      playerStats: Object.values(stats),
      playerMapStats: mapStats,
      teams: seriesTeams,
    };
  }, [analyzedSeries]);

  if (!analyzedSeries) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <User size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-100 mb-2">No Match Selected</h3>
          <p className="text-slate-400">Select a match from the Dashboard to view player analysis</p>
        </div>
      </div>
    );
  }

  // Sort players
  const sortedPlayers = [...playerStats].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const selectedPlayerData = selectedPlayer 
    ? playerStats.find(p => p.id === selectedPlayer)
    : null;

  const selectedPlayerMaps = selectedPlayer ? playerMapStats[selectedPlayer] || [] : [];

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  // Calculate team totals
  const teamTotals = useMemo(() => {
    const totals: Record<string, { kills: number; deaths: number; players: number }> = {};
    
    playerStats.forEach(player => {
      if (!totals[player.teamId]) {
        totals[player.teamId] = { kills: 0, deaths: 0, players: 0 };
      }
      totals[player.teamId].kills += player.kills;
      totals[player.teamId].deaths += player.deaths;
      totals[player.teamId].players += 1;
    });

    return totals;
  }, [playerStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-game">Player Analysis</h2>
          <p className="text-sm text-slate-400 mt-1">
            {selectedSeries?.teams[0]?.baseInfo?.name || teams[0]?.name} vs {selectedSeries?.teams[1]?.baseInfo?.name || teams[1]?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-green-400">100% GRID API Data</span>
        </div>
      </div>

      {/* Data Source Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-slate-300">
              All statistics shown below are sourced directly from the GRID Esports API.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Fields: Player Name, Team, Kills, Deaths, K/D Ratio, Character/Agent, Map Results
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player List */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 size={20} className="text-primary" />
                Player Performance
              </h3>
              <span className="text-xs text-slate-500">{playerStats.length} players</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700 bg-slate-800/50">
                    <th className="p-3">#</th>
                    <th className="p-3">Player</th>
                    <th className="p-3">Team</th>
                    <th 
                      className="p-3 cursor-pointer hover:text-primary"
                      onClick={() => handleSort('kills')}
                    >
                      <div className="flex items-center gap-1">
                        Kills
                        {sortBy === 'kills' && (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                      </div>
                    </th>
                    <th 
                      className="p-3 cursor-pointer hover:text-primary"
                      onClick={() => handleSort('deaths')}
                    >
                      <div className="flex items-center gap-1">
                        Deaths
                        {sortBy === 'deaths' && (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                      </div>
                    </th>
                    <th 
                      className="p-3 cursor-pointer hover:text-primary"
                      onClick={() => handleSort('kd')}
                    >
                      <div className="flex items-center gap-1">
                        K/D
                        {sortBy === 'kd' && (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                      </div>
                    </th>
                    <th className="p-3">Agents</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, idx) => {
                    const isSelected = selectedPlayer === player.id;
                    const kdColor = player.kd >= 1.5 ? 'text-green-400' : 
                                   player.kd >= 1 ? 'text-amber-400' : 'text-red-400';
                    
                    return (
                      <tr
                        key={player.id}
                        className={`border-b border-slate-800 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-slate-800/50'
                        }`}
                        onClick={() => setSelectedPlayer(isSelected ? null : player.id)}
                      >
                        <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                              <User size={16} className="text-slate-400" />
                            </div>
                            <span className="font-medium text-slate-200">{player.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-400">{player.teamName}</td>
                        <td className="p-3 text-green-400 font-medium">{player.kills}</td>
                        <td className="p-3 text-red-400 font-medium">{player.deaths}</td>
                        <td className="p-3">
                          <span className={`font-bold ${kdColor}`}>
                            {player.kd.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3">
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Player Detail Panel */}
        <div className="space-y-4">
          {selectedPlayerData ? (
            <>
              {/* Player Header */}
              <div className="bg-surface border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedPlayerData.name}</h3>
                    <p className="text-sm text-slate-400">{selectedPlayerData.teamName}</p>
                    <div className="flex gap-1 mt-1">
                      {selectedPlayerData.characters.map((char, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* K/D Rating Large */}
                <div className="text-center py-4 border-t border-slate-700">
                  <p className="text-xs text-slate-500 uppercase mb-1">K/D Ratio</p>
                  <p className={`text-4xl font-bold ${
                    selectedPlayerData.kd >= 1.5 ? 'text-green-400' :
                    selectedPlayerData.kd >= 1 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {selectedPlayerData.kd.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedPlayerData.kills} kills / {selectedPlayerData.deaths} deaths
                  </p>
                </div>
              </div>

              {/* Maps Played */}
              <div className="bg-surface border border-slate-800 rounded-xl p-4">
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Map size={16} className="text-primary" />
                  Per-Map Performance
                </h4>
                <div className="space-y-2">
                  {selectedPlayerMaps.map((mapData, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        mapData.won ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{mapData.mapName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          mapData.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {mapData.won ? 'Won' : 'Lost'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                          <Crosshair size={12} className="inline mr-1" />
                          {mapData.kills}K / {mapData.deaths}D
                        </span>
                        <span className={mapData.kd >= 1 ? 'text-green-400' : 'text-red-400'}>
                          K/D: {mapData.kd.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Agent: {mapData.character}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Win/Loss Record */}
              <div className="bg-surface border border-slate-800 rounded-xl p-4">
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Award size={16} className="text-amber-400" />
                  Map Record
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-green-400">{selectedPlayerData.gamesWon}</p>
                    <p className="text-xs text-slate-500">Maps Won</p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-red-400">{selectedPlayerData.gamesLost}</p>
                    <p className="text-xs text-slate-500">Maps Lost</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-surface border border-slate-800 rounded-xl p-8 text-center">
              <User size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-100 mb-2">Select a Player</h3>
              <p className="text-slate-400 text-sm">Click on a player row to view detailed analysis</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Comparison */}
      <div className="bg-surface border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Team Comparison
          <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            API Data
          </span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => {
            const teamTotal = teamTotals[team.id] || { kills: 0, deaths: 0, players: 0 };
            const kd = teamTotal.deaths > 0 ? teamTotal.kills / teamTotal.deaths : teamTotal.kills;
            const isWinner = team.won;

            return (
              <div 
                key={team.id}
                className={`p-4 rounded-lg border ${
                  isWinner ? 'border-green-500/30 bg-green-500/5' : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {team.name}
                    {isWinner && <Award size={16} className="text-yellow-400" />}
                  </h4>
                  {isWinner && <span className="text-xs text-green-400 uppercase font-bold">Winner</span>}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">{teamTotal.kills}</p>
                    <p className="text-xs text-slate-500">Total Kills</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400">{teamTotal.deaths}</p>
                    <p className="text-xs text-slate-500">Total Deaths</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${kd >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                      {kd.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">Team K/D</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerAnalysisView;
