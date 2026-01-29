/**
 * Coach Insights View
 * 
 * AI-powered coaching insights based on REAL GRID API data:
 * - Performance gaps based on actual K/D comparisons
 * - Map-specific recommendations
 * - Player matchup analysis
 * 
 * This replaces the old "Strategy Debt" view with actionable, 
 * data-backed insights.
 */

import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Brain, 
  Target, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Crosshair,
  Map,
  Activity,
  Lightbulb,
  Award,
  Info
} from 'lucide-react';
import { useCoachAnalytics } from '../contexts/CoachAnalyticsContext';

interface CoachInsightsViewProps {
  onNavigate?: (view: 'dashboard' | 'player-analysis' | 'strategy-debt') => void;
}

export const CoachInsightsView: React.FC<CoachInsightsViewProps> = ({ onNavigate }) => {
  const { analyzedSeries } = useCoachAnalytics();

  if (!analyzedSeries || !analyzedSeries.state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Brain size={48} className="text-slate-600 mb-2" />
        <h2 className="text-xl font-bold text-slate-300">No Match Data Available</h2>
        <p className="text-slate-500 max-w-md text-center">
          Please select a match from the dashboard to view coaching insights.
        </p>
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="px-4 py-2 bg-primary text-background font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const seriesState = analyzedSeries.state;
  const games = seriesState.games || [];
  const teams = seriesState.teams || [];
  
  const team1 = teams[0] || { id: '', name: 'Team 1', score: 0, won: false };
  const team2 = teams[1] || { id: '', name: 'Team 2', score: 0, won: false };
  
  // Our team (assume team1 is our team for analysis)
  const ourTeam = team1;
  const opponentTeam = team2;

  // Calculate player stats from real API data
  const playerStats = useMemo(() => {
    const stats: Record<string, { 
      name: string; 
      teamId: string;
      kills: number; 
      deaths: number; 
      kd: number;
    }> = {};

    games.forEach(game => {
      game.teams.forEach(gameTeam => {
        gameTeam.players.forEach(player => {
          if (!stats[player.id]) {
            stats[player.id] = {
              name: player.name,
              teamId: gameTeam.id,
              kills: 0,
              deaths: 0,
              kd: 0
            };
          }
          stats[player.id].kills += player.kills || 0;
          stats[player.id].deaths += player.deaths || 0;
        });
      });
    });

    Object.values(stats).forEach(player => {
      player.kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
    });

    return stats;
  }, [games]);

  // Team performance analysis
  const teamAnalysis = useMemo(() => {
    const ourPlayers = Object.values(playerStats).filter(p => p.teamId === ourTeam.id);
    const oppPlayers = Object.values(playerStats).filter(p => p.teamId === opponentTeam.id);
    
    const ourTotalKills = ourPlayers.reduce((sum, p) => sum + p.kills, 0);
    const ourTotalDeaths = ourPlayers.reduce((sum, p) => sum + p.deaths, 0);
    const oppTotalKills = oppPlayers.reduce((sum, p) => sum + p.kills, 0);
    const oppTotalDeaths = oppPlayers.reduce((sum, p) => sum + p.deaths, 0);
    
    const ourKD = ourTotalDeaths > 0 ? ourTotalKills / ourTotalDeaths : ourTotalKills;
    const oppKD = oppTotalDeaths > 0 ? oppTotalKills / oppTotalDeaths : oppTotalKills;
    
    // Find struggling players (K/D < 1)
    const strugglingPlayers = ourPlayers.filter(p => p.kd < 1).sort((a, b) => a.kd - b.kd);
    
    // Find top performers (K/D > 1.2)
    const topPerformers = ourPlayers.filter(p => p.kd >= 1.2).sort((a, b) => b.kd - a.kd);
    
    // Map performance
    const mapPerformance = games.map((game, idx) => {
      const ourGameTeam = game.teams.find(t => t.id === ourTeam.id);
      const oppGameTeam = game.teams.find(t => t.id === opponentTeam.id);
      const mapName = typeof game.map === 'object' ? game.map?.name : game.map;
      
      return {
        map: mapName || `Map ${idx + 1}`,
        ourScore: ourGameTeam?.score || 0,
        oppScore: oppGameTeam?.score || 0,
        won: ourGameTeam?.won || false,
        roundDiff: (ourGameTeam?.score || 0) - (oppGameTeam?.score || 0)
      };
    });
    
    return {
      ourKD,
      oppKD,
      kdAdvantage: ourKD - oppKD,
      strugglingPlayers,
      topPerformers,
      mapPerformance,
      ourTotalKills,
      ourTotalDeaths,
      oppTotalKills,
      oppTotalDeaths
    };
  }, [playerStats, ourTeam.id, opponentTeam.id, games]);

  // Generate real insights based on data
  const insights = useMemo(() => {
    const result: Array<{
      type: 'positive' | 'negative' | 'neutral';
      category: string;
      title: string;
      description: string;
      dataSource: string;
    }> = [];

    // K/D comparison insight
    if (teamAnalysis.kdAdvantage >= 0.2) {
      result.push({
        type: 'positive',
        category: 'Team Performance',
        title: 'Strong Fragging Performance',
        description: `Team K/D of ${teamAnalysis.ourKD.toFixed(2)} is ${teamAnalysis.kdAdvantage.toFixed(2)} higher than opponent. The team is winning more gunfights.`,
        dataSource: 'Calculated from total kills/deaths across all maps'
      });
    } else if (teamAnalysis.kdAdvantage <= -0.2) {
      result.push({
        type: 'negative',
        category: 'Team Performance',
        title: 'Fragging Disadvantage',
        description: `Team K/D of ${teamAnalysis.ourKD.toFixed(2)} is ${Math.abs(teamAnalysis.kdAdvantage).toFixed(2)} lower than opponent. Focus on trade fragging and crossfire setups.`,
        dataSource: 'Calculated from total kills/deaths across all maps'
      });
    }

    // Struggling players insight
    if (teamAnalysis.strugglingPlayers.length > 0) {
      const names = teamAnalysis.strugglingPlayers.slice(0, 2).map(p => p.name).join(', ');
      result.push({
        type: 'negative',
        category: 'Player Performance',
        title: 'Players Need Support',
        description: `${names} had K/D below 1.0. Consider adjusting roles or providing utility support.`,
        dataSource: 'Individual player kill/death ratios from match data'
      });
    }

    // Top performers insight
    if (teamAnalysis.topPerformers.length > 0) {
      const topPlayer = teamAnalysis.topPerformers[0];
      result.push({
        type: 'positive',
        category: 'Player Performance',
        title: 'Star Player Identified',
        description: `${topPlayer.name} had the highest K/D (${topPlayer.kd.toFixed(2)}). Consider building strategies around their playstyle.`,
        dataSource: 'Individual player kill/death ratios from match data'
      });
    }

    // Map-specific insights
    teamAnalysis.mapPerformance.forEach(map => {
      if (map.roundDiff <= -5) {
        result.push({
          type: 'negative',
          category: 'Map Analysis',
          title: `Weak Performance on ${map.map}`,
          description: `Lost ${map.map} with a ${Math.abs(map.roundDiff)} round deficit (${map.ourScore}-${map.oppScore}). Review strategies for this map.`,
          dataSource: 'Map scores from match data'
        });
      } else if (map.roundDiff >= 5) {
        result.push({
          type: 'positive',
          category: 'Map Analysis',
          title: `Strong Performance on ${map.map}`,
          description: `Won ${map.map} with a ${map.roundDiff} round advantage (${map.ourScore}-${map.oppScore}). This is a comfort pick.`,
          dataSource: 'Map scores from match data'
        });
      }
    });

    // Series result insight
    if (ourTeam.won) {
      result.push({
        type: 'positive',
        category: 'Series Result',
        title: 'Series Victory',
        description: `Won the series ${ourTeam.score}-${opponentTeam.score}. Total team kills: ${teamAnalysis.ourTotalKills}.`,
        dataSource: 'Series final score from GRID API'
      });
    } else if (opponentTeam.won) {
      result.push({
        type: 'negative',
        category: 'Series Result',
        title: 'Series Loss',
        description: `Lost the series ${ourTeam.score}-${opponentTeam.score}. Focus on the identified weaknesses for improvement.`,
        dataSource: 'Series final score from GRID API'
      });
    }

    return result;
  }, [teamAnalysis, ourTeam, opponentTeam]);

  // Player comparison data for chart
  const playerComparisonData = Object.values(playerStats)
    .filter(p => p.teamId === ourTeam.id)
    .map(p => ({
      name: p.name,
      kd: parseFloat(p.kd.toFixed(2)),
      kills: p.kills,
      deaths: p.deaths
    }))
    .sort((a, b) => b.kd - a.kd);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-game">Coach Insights</h2>
          <p className="text-sm text-slate-400 mt-1">
            AI-powered analysis for {ourTeam.name} vs {opponentTeam.name}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-green-400">Based on GRID API Data</span>
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Team K/D"
          value={teamAnalysis.ourKD.toFixed(2)}
          subValue={`vs ${teamAnalysis.oppKD.toFixed(2)} opponent`}
          isPositive={teamAnalysis.kdAdvantage >= 0}
          icon={<Crosshair size={20} />}
        />
        <StatCard
          label="Total Kills"
          value={teamAnalysis.ourTotalKills.toString()}
          subValue={`${teamAnalysis.oppTotalKills} opponent kills`}
          isPositive={teamAnalysis.ourTotalKills >= teamAnalysis.oppTotalKills}
          icon={<Target size={20} />}
        />
        <StatCard
          label="Series Score"
          value={`${ourTeam.score} - ${opponentTeam.score}`}
          subValue={ourTeam.won ? 'Victory' : opponentTeam.won ? 'Defeat' : 'Ongoing'}
          isPositive={ourTeam.won || false}
          icon={<Award size={20} />}
        />
      </div>

      {/* Player K/D Chart */}
      <div className="bg-surface border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Player K/D Breakdown
          <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            API Data
          </span>
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={playerComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#16161a', border: '1px solid #1e293b', borderRadius: '8px' }}
              />
              <Bar dataKey="kd" name="K/D Ratio" fill="#10b981" radius={[4, 4, 0, 0]}>
                {playerComparisonData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.kd >= 1 ? '#10b981' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-surface border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Lightbulb size={20} className="text-amber-400" />
          Coaching Insights
          <span className="text-xs text-slate-500 font-normal ml-2">
            ({insights.length} findings)
          </span>
        </h3>
        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <InsightCard key={idx} {...insight} />
          ))}
        </div>
      </div>

      {/* Map Performance */}
      {teamAnalysis.mapPerformance.length > 0 && (
        <div className="bg-surface border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Map size={20} className="text-primary" />
            Map Performance
          </h3>
          <div className="grid gap-3">
            {teamAnalysis.mapPerformance.map((map, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  map.won ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {map.won ? (
                    <CheckCircle size={20} className="text-green-400" />
                  ) : (
                    <AlertTriangle size={20} className="text-red-400" />
                  )}
                  <span className="font-medium text-white">{map.map}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold ${map.won ? 'text-green-400' : 'text-red-400'}`}>
                    {map.ourScore} - {map.oppScore}
                  </span>
                  <span className={`text-sm ${map.roundDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {map.roundDiff >= 0 ? '+' : ''}{map.roundDiff} rounds
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Transparency Notice */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-400 mb-1">Data Transparency</h4>
            <p className="text-xs text-slate-400">
              All insights are generated from verified GRID API data. The analysis includes:
              player kills/deaths, map scores, and series results. Each insight shows its data source.
              No simulated or estimated data is used.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: string;
  subValue: string;
  isPositive: boolean;
  icon: React.ReactNode;
}> = ({ label, value, subValue, isPositive, icon }) => (
  <div className="bg-surface border border-slate-800 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2 text-slate-400">
      {icon}
      <span className="text-xs uppercase font-medium">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {value}
    </p>
    <p className="text-xs text-slate-500 mt-1">{subValue}</p>
  </div>
);

// Insight Card Component
const InsightCard: React.FC<{
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  title: string;
  description: string;
  dataSource: string;
}> = ({ type, category, title, description, dataSource }) => {
  const colors = {
    positive: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: 'text-green-400' },
    negative: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: 'text-red-400' },
    neutral: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: 'text-slate-400' }
  };
  
  const Icon = type === 'positive' ? TrendingUp : type === 'negative' ? TrendingDown : Activity;
  
  return (
    <div className={`p-4 rounded-lg border ${colors[type].bg} ${colors[type].border}`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={colors[type].icon} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500 uppercase">{category}</span>
          </div>
          <h4 className="font-medium text-white mb-1">{title}</h4>
          <p className="text-sm text-slate-400">{description}</p>
          <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            {dataSource}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoachInsightsView;
