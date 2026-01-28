import React, { useState } from 'react';
import { PlayerImpactGrid, PlayerImpactData } from '../components/PlayerImpactCard';
import { ArrowLeft, Filter, TrendingDown, TrendingUp } from 'lucide-react';

// Mock player data
const mockPlayers: PlayerImpactData[] = [
  {
    playerId: 'p1',
    name: 'm0NESY',
    role: 'AWPer',
    impactScore: -24,
    positiveActions: 12,
    negativeActions: 18,
    riskScore: 72,
    strengthScore: 58,
    topMistake: 'Recurring early-round over-aggression (8 occurrences)',
    topStrength: 'Excellent mid-round adaptability'
  },
  {
    playerId: 'p2',
    name: 'NiKo',
    role: 'Rifler',
    impactScore: 42,
    positiveActions: 28,
    negativeActions: 9,
    riskScore: 28,
    strengthScore: 84,
    topStrength: 'Consistent clutch performance in late-game'
  },
  {
    playerId: 'p3',
    name: 'HooXi',
    role: 'IGL',
    impactScore: 8,
    positiveActions: 15,
    negativeActions: 14,
    riskScore: 45,
    strengthScore: 62,
    topMistake: 'Late-game tactical timeout delays',
    topStrength: 'Strong mid-round calling'
  },
  {
    playerId: 'p4',
    name: 'huNter-',
    role: 'Rifler',
    impactScore: 18,
    positiveActions: 22,
    negativeActions: 16,
    riskScore: 38,
    strengthScore: 71,
    topStrength: 'Effective utility usage in early-game'
  },
  {
    playerId: 'p5',
    name: 'jks',
    role: 'Support',
    impactScore: -12,
    positiveActions: 14,
    negativeActions: 19,
    riskScore: 58,
    strengthScore: 48,
    topMistake: 'Economy management in force-buy situations'
  }
];

type SortOption = 'impact' | 'risk' | 'strength';
type FilterOption = 'all' | 'high-risk' | 'top-performers';

export const PlayerAnalysis: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('impact');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const getSortedAndFilteredPlayers = () => {
    let filtered = [...mockPlayers];

    // Apply filters
    switch (filterBy) {
      case 'high-risk':
        filtered = filtered.filter(p => p.riskScore > 50);
        break;
      case 'top-performers':
        filtered = filtered.filter(p => p.impactScore > 20);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'impact':
          return b.impactScore - a.impactScore;
        case 'risk':
          return b.riskScore - a.riskScore;
        case 'strength':
          return b.strengthScore - a.strengthScore;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const players = getSortedAndFilteredPlayers();

  const teamStats = {
    avgImpact: (mockPlayers.reduce((sum, p) => sum + p.impactScore, 0) / mockPlayers.length).toFixed(1),
    avgRisk: (mockPlayers.reduce((sum, p) => sum + p.riskScore, 0) / mockPlayers.length).toFixed(1),
    avgStrength: (mockPlayers.reduce((sum, p) => sum + p.strengthScore, 0) / mockPlayers.length).toFixed(1),
    highRiskPlayers: mockPlayers.filter(p => p.riskScore > 60).length,
    topPerformers: mockPlayers.filter(p => p.impactScore > 30).length
  };

  if (selectedPlayer) {
    const player = mockPlayers.find(p => p.playerId === selectedPlayer);
    if (!player) return null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedPlayer(null)}
          className="flex items-center space-x-2 text-sm text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Team Overview</span>
        </button>

        <div className="bg-surface border border-slate-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">{player.name}</h2>
          <p className="text-sm text-slate-500 uppercase tracking-wider mb-6">{player.role}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard
              label="Impact Score"
              value={player.impactScore}
              suffix=""
              trend={player.impactScore > 0 ? 'up' : 'down'}
            />
            <StatCard
              label="Risk Level"
              value={player.riskScore}
              suffix=""
              trend={player.riskScore > 50 ? 'down' : 'up'}
              color="amber"
            />
            <StatCard
              label="Strength Score"
              value={player.strengthScore}
              suffix=""
              trend="up"
              color="green"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {player.topMistake && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-sm font-bold text-red-400 mb-2">Primary Issue</h4>
                <p className="text-sm text-slate-300">{player.topMistake}</p>
              </div>
            )}
            {player.topStrength && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <h4 className="text-sm font-bold text-green-400 mb-2">Key Strength</h4>
                <p className="text-sm text-slate-300">{player.topStrength}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Player Analysis</h2>
        <p className="text-sm text-slate-500">Individual performance metrics and causal impact</p>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard label="Avg Impact" value={teamStats.avgImpact} />
        <StatCard label="Avg Risk" value={teamStats.avgRisk} color="amber" />
        <StatCard label="Avg Strength" value={teamStats.avgStrength} color="green" />
        <StatCard label="High Risk" value={teamStats.highRiskPlayers} suffix=" players" color="red" />
        <StatCard label="Top Performers" value={teamStats.topPerformers} suffix=" players" color="primary" />
      </div>

      {/* Filters and Sorting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-slate-500" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-primary"
            >
              <option value="all">All Players</option>
              <option value="high-risk">High Risk Only</option>
              <option value="top-performers">Top Performers</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-primary"
            >
              <option value="impact">Impact Score</option>
              <option value="risk">Risk Level</option>
              <option value="strength">Strength Score</option>
            </select>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          Showing {players.length} of {mockPlayers.length} players
        </div>
      </div>

      {/* Player Cards */}
      <PlayerImpactGrid
        players={players}
        onPlayerClick={(playerId) => setSelectedPlayer(playerId)}
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: 'up' | 'down';
  color?: 'primary' | 'green' | 'red' | 'amber';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, suffix = '', trend, color = 'primary' }) => {
  const getColorClass = () => {
    switch (color) {
      case 'green': return 'text-green-500';
      case 'red': return 'text-red-500';
      case 'amber': return 'text-amber-500';
      default: return 'text-primary';
    }
  };

  return (
    <div className="bg-surface border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
        {trend && (
          trend === 'up' ? <TrendingUp size={14} className="text-green-500" /> :
          <TrendingDown size={14} className="text-red-500" />
        )}
      </div>
      <div className="flex items-baseline space-x-1">
        <span className={`text-2xl font-black ${getColorClass()}`}>{value}</span>
        {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
};
