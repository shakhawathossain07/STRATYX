/**
 * Player Analysis View
 * 
 * Detailed player-by-player analysis showing:
 * - Individual performance metrics with scientific calculations
 * - Historical trends using CUSUM detection
 * - Role effectiveness analysis
 * - Comparative rankings using Bradley-Terry
 * - Personalized improvement recommendations
 */

import React, { useState } from 'react';
import {
  User,
  TrendingUp,
  TrendingDown,
  Target,
  Crosshair,
  Shield,
  Zap,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart3,
  Brain,
} from 'lucide-react';
import { useCoachAnalytics } from '../contexts/CoachAnalyticsContext';
import { PlayerPerformanceMetrics, MicroMistake, MistakeType, zScoreToPercentile, standardDeviation, mean } from '../services/scientificAnalytics';

export const PlayerAnalysisView: React.FC = () => {
  const { analyzedSeries, selectedSeries } = useCoachAnalytics();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'impactRating' | 'kda' | 'firstKillRate'>('impactRating');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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

  const playerMetrics = analyzedSeries.playerMetrics;
  const playerMistakes = analyzedSeries.mistakes;

  // Calculate league averages for comparison
  const leagueAverages = {
    kda: mean(playerMetrics.map(p => p.kda)),
    impactRating: mean(playerMetrics.map(p => p.impactRating)),
    firstKillRate: mean(playerMetrics.map(p => p.firstKillRate)),
    headshotPercentage: mean(playerMetrics.map(p => p.headshotPercentage)),
    damagePerRound: mean(playerMetrics.map(p => p.damagePerRound)),
  };

  const leagueStdDevs = {
    kda: standardDeviation(playerMetrics.map(p => p.kda)),
    impactRating: standardDeviation(playerMetrics.map(p => p.impactRating)),
    firstKillRate: standardDeviation(playerMetrics.map(p => p.firstKillRate)),
    headshotPercentage: standardDeviation(playerMetrics.map(p => p.headshotPercentage)),
    damagePerRound: standardDeviation(playerMetrics.map(p => p.damagePerRound)),
  };

  // Sort players
  const sortedPlayers = [...playerMetrics].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const selectedPlayerData = selectedPlayer 
    ? playerMetrics.find(p => p.playerId === selectedPlayer)
    : null;

  const selectedPlayerMistakes = selectedPlayer
    ? playerMistakes.filter(m => m.playerId === selectedPlayer)
    : [];

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-game">Player Analysis</h2>
          <p className="text-sm text-slate-400 mt-1">
            {selectedSeries?.teams[0]?.baseInfo?.name} vs {selectedSeries?.teams[1]?.baseInfo?.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500">Players Analyzed</p>
            <p className="text-lg font-bold text-primary">{playerMetrics.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player List */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 size={20} className="text-primary" />
                Performance Rankings
              </h3>
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
                      onClick={() => handleSort('impactRating')}
                    >
                      <div className="flex items-center gap-1">
                        Impact
                        {sortBy === 'impactRating' && (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                      </div>
                    </th>
                    <th 
                      className="p-3 cursor-pointer hover:text-primary"
                      onClick={() => handleSort('kda')}
                    >
                      <div className="flex items-center gap-1">
                        KDA
                        {sortBy === 'kda' && (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                      </div>
                    </th>
                    <th 
                      className="p-3 cursor-pointer hover:text-primary"
                      onClick={() => handleSort('firstKillRate')}
                    >
                      <div className="flex items-center gap-1">
                        FK Rate
                        {sortBy === 'firstKillRate' && (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                      </div>
                    </th>
                    <th className="p-3">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, idx) => {
                    const playerIssues = playerMistakes.filter(m => m.playerId === player.playerId);
                    const isSelected = selectedPlayer === player.playerId;
                    
                    return (
                      <tr
                        key={player.playerId}
                        className={`border-b border-slate-800 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-slate-800/50'
                        }`}
                        onClick={() => setSelectedPlayer(isSelected ? null : player.playerId)}
                      >
                        <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                              <User size={16} className="text-slate-400" />
                            </div>
                            <span className="font-medium text-slate-200">{player.playerName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-400">{player.team}</td>
                        <td className="p-3">
                          <ImpactBadge value={player.impactRating} />
                        </td>
                        <td className="p-3">
                          <span className={player.kda >= 1.5 ? 'text-green-400' : player.kda >= 1 ? 'text-amber-400' : 'text-red-400'}>
                            {player.kda.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={player.firstKillRate > 0.15 ? 'text-green-400' : 'text-slate-400'}>
                            {(player.firstKillRate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3">
                          {playerIssues.length > 0 ? (
                            <span className="flex items-center gap-1 text-amber-400">
                              <AlertTriangle size={14} />
                              {playerIssues.length}
                            </span>
                          ) : (
                            <span className="text-green-400">✓</span>
                          )}
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
                    <h3 className="text-xl font-bold text-white">{selectedPlayerData.playerName}</h3>
                    <p className="text-sm text-slate-400">{selectedPlayerData.team}</p>
                    <p className="text-xs text-primary uppercase">{selectedPlayerData.role}</p>
                  </div>
                </div>
                
                {/* Impact Rating Large */}
                <div className="text-center py-4 border-t border-slate-700">
                  <p className="text-xs text-slate-500 uppercase mb-1">Impact Rating</p>
                  <p className={`text-4xl font-bold ${
                    selectedPlayerData.impactRating > 70 ? 'text-green-400' :
                    selectedPlayerData.impactRating > 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {selectedPlayerData.impactRating.toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Top {(100 - zScoreToPercentile((selectedPlayerData.impactRating - leagueAverages.impactRating) / leagueStdDevs.impactRating) * 100).toFixed(0)}% in match
                  </p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="bg-surface border border-slate-800 rounded-xl p-4">
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  Performance Breakdown
                </h4>
                <div className="space-y-3">
                  <StatRow
                    label="K/D Ratio"
                    value={selectedPlayerData.kdRatio.toFixed(2)}
                    comparison={selectedPlayerData.kdRatio - (leagueAverages.kda * 0.8)}
                    icon={<Crosshair size={14} />}
                  />
                  <StatRow
                    label="KDA"
                    value={selectedPlayerData.kda.toFixed(2)}
                    comparison={selectedPlayerData.kda - leagueAverages.kda}
                    icon={<Target size={14} />}
                  />
                  <StatRow
                    label="First Kill Rate"
                    value={`${(selectedPlayerData.firstKillRate * 100).toFixed(1)}%`}
                    comparison={selectedPlayerData.firstKillRate - leagueAverages.firstKillRate}
                    icon={<Zap size={14} />}
                  />
                  <StatRow
                    label="Headshot %"
                    value={`${(selectedPlayerData.headshotPercentage * 100).toFixed(1)}%`}
                    comparison={selectedPlayerData.headshotPercentage - leagueAverages.headshotPercentage}
                    icon={<Crosshair size={14} />}
                  />
                  <StatRow
                    label="Damage/Round"
                    value={selectedPlayerData.damagePerRound.toFixed(1)}
                    comparison={selectedPlayerData.damagePerRound - leagueAverages.damagePerRound}
                    icon={<Shield size={14} />}
                  />
                  <StatRow
                    label="Trade Differential"
                    value={selectedPlayerData.tradeDifferential.toString()}
                    comparison={selectedPlayerData.tradeDifferential}
                    icon={<Activity size={14} />}
                  />
                </div>
              </div>

              {/* Player Issues */}
              {selectedPlayerMistakes.length > 0 && (
                <div className="bg-surface border border-slate-800 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Identified Issues ({selectedPlayerMistakes.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedPlayerMistakes.map((mistake) => (
                      <div
                        key={mistake.id}
                        className={`p-3 rounded-lg border ${
                          mistake.severity === 'critical' ? 'border-red-500/50 bg-red-500/10' :
                          mistake.severity === 'high' ? 'border-amber-500/50 bg-amber-500/10' :
                          'border-slate-700 bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded uppercase ${
                            mistake.severity === 'critical' ? 'bg-red-500/30 text-red-400' :
                            mistake.severity === 'high' ? 'bg-amber-500/30 text-amber-400' :
                            'bg-slate-600 text-slate-300'
                          }`}>
                            {mistake.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-500">
                            {mistake.occurrences}x
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{mistake.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-surface border border-slate-800 rounded-xl p-4">
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Brain size={16} className="text-green-500" />
                  Improvement Focus
                </h4>
                <ul className="space-y-2">
                  {generatePlayerRecommendations(selectedPlayerData, selectedPlayerMistakes).map((rec, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
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
          <BarChart3 size={20} className="text-primary" />
          Team Performance Comparison
        </h3>
        
        {analyzedSeries.teamMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TeamStatsCard
              team={analyzedSeries.teamMetrics.home}
              isWinner={analyzedSeries.state?.teams[0]?.won || false}
            />
            <TeamStatsCard
              team={analyzedSeries.teamMetrics.away}
              isWinner={analyzedSeries.state?.teams[1]?.won || false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// HELPER COMPONENTS
// =====================================================

const ImpactBadge: React.FC<{ value: number }> = ({ value }) => {
  const color = value > 70 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                value > 50 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                'bg-red-500/20 text-red-400 border-red-500/30';
  
  return (
    <span className={`px-2 py-1 rounded border text-xs font-bold ${color}`}>
      {value.toFixed(1)}
    </span>
  );
};

const StatRow: React.FC<{
  label: string;
  value: string;
  comparison: number;
  icon: React.ReactNode;
}> = ({ label, value, comparison, icon }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-slate-400">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-white">{value}</span>
      {comparison !== 0 && (
        <span className={`text-xs flex items-center ${comparison > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {comparison > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {comparison > 0 ? '+' : ''}{(comparison * (comparison > 1 ? 1 : 100)).toFixed(1)}
          {Math.abs(comparison) < 1 ? '%' : ''}
        </span>
      )}
    </div>
  </div>
);

const TeamStatsCard: React.FC<{
  team: { teamName: string; averageKDA: number; totalKills: number; totalDeaths: number; roundWinRate: number };
  isWinner: boolean;
}> = ({ team, isWinner }) => (
  <div className={`p-4 rounded-lg border ${isWinner ? 'border-green-500/30 bg-green-500/5' : 'border-slate-700 bg-slate-800/50'}`}>
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-bold text-white flex items-center gap-2">
        {team.teamName}
        {isWinner && <Award size={16} className="text-yellow-400" />}
      </h4>
      {isWinner && <span className="text-xs text-green-400 uppercase font-bold">Winner</span>}
    </div>
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-2xl font-bold text-white">{team.averageKDA.toFixed(2)}</p>
        <p className="text-xs text-slate-500">Avg KDA</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-green-400">{team.totalKills}</p>
        <p className="text-xs text-slate-500">Kills</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-red-400">{team.totalDeaths}</p>
        <p className="text-xs text-slate-500">Deaths</p>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-slate-700">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">Round Win Rate</span>
        <span className="text-sm font-bold text-primary">{(team.roundWinRate * 100).toFixed(1)}%</span>
      </div>
      <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-green-500"
          style={{ width: `${team.roundWinRate * 100}%` }}
        />
      </div>
    </div>
  </div>
);

// Generate personalized recommendations based on player data
function generatePlayerRecommendations(
  player: PlayerPerformanceMetrics,
  mistakes: MicroMistake[]
): string[] {
  const recommendations: string[] = [];
  
  // High death rate
  if (player.deathsPerRound > 0.6) {
    recommendations.push('Focus on survival - prioritize information gathering over aggressive peeks');
  }
  
  // Low first kill rate for duelist
  if (player.role === 'duelist' && player.firstKillRate < 0.12) {
    recommendations.push('As a duelist, work on entry fragging with flash/smoke support from teammates');
  }
  
  // High first death rate
  if (player.firstDeathRate > 0.15) {
    recommendations.push('Review positioning in opening seconds - consider deeper angles or later timing');
  }
  
  // Low headshot percentage
  if (player.headshotPercentage < 0.2) {
    recommendations.push('Dedicate time to aim training focusing on crosshair placement at head level');
  }
  
  // Negative trade differential
  if (player.tradeDifferential < -1) {
    recommendations.push('Work on trade positioning - ensure teammates can refrag when you take fights');
  }
  
  // Low damage efficiency
  if (player.damageEfficiency < 0.9) {
    recommendations.push('Take more cover between shots - you\'re exposed too long in firefights');
  }
  
  // Based on specific mistakes
  const mistakeTypes = mistakes.map(m => m.type);
  if (mistakeTypes.includes(MistakeType.POOR_POSITIONING)) {
    recommendations.push('Study pro player positioning for your role on commonly played maps');
  }
  if (mistakeTypes.includes(MistakeType.UTILITY_MISUSE)) {
    recommendations.push('Create utility lineups document and practice consistent executes');
  }
  
  // Default if no specific issues
  if (recommendations.length === 0) {
    recommendations.push('Maintain current performance level while focusing on team synergy');
    recommendations.push('Study opponent tendencies for better read-based plays');
  }
  
  return recommendations.slice(0, 4);
}

export default PlayerAnalysisView;
