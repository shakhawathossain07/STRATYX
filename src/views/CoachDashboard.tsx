/**
 * Coach Dashboard View
 * 
 * Main dashboard for the AI Assistant Coach showing:
 * - Series selection from GRID API
 * - Real-time analytics and win probability
 * - Player performance metrics
 * - Coaching insights and recommendations
 * - Strategy Debt visualization
 */

import React from 'react';
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
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useCoachAnalytics, GameType } from '../contexts/CoachAnalyticsContext';
import { PlayerPerformanceMetrics, CoachingInsight, MicroMistake } from '../services/scientificAnalytics';

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

      {/* Selected Series Header (Always Visible When Selected) */}
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
      {analyzedSeries ? (
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Target className="text-primary" />}
              label="Win Probability"
              value={`${(analyzedSeries.winProbability.probability * 100).toFixed(1)}%`}
              subValue={`±${((1 - analyzedSeries.winProbability.confidence) * 10).toFixed(1)}% margin`}
              trend={analyzedSeries.winProbability.probability > 0.5 ? 'up' : 'down'}
            />
            <MetricCard
              icon={<Shield className="text-amber-500" />}
              label="Strategy Debt"
              value={analyzedSeries.strategyDebt.totalDebt.toFixed(1)}
              subValue={analyzedSeries.strategyDebt.totalDebt > 70 ? 'Critical' : analyzedSeries.strategyDebt.totalDebt > 40 ? 'Warning' : 'Healthy'}
              trend={analyzedSeries.strategyDebt.totalDebt > 50 ? 'down' : 'up'}
            />
            <MetricCard
              icon={<AlertTriangle className="text-red-500" />}
              label="Issues Detected"
              value={analyzedSeries.mistakes.length.toString()}
              subValue={`${analyzedSeries.mistakes.filter(m => m.severity === 'critical').length} critical`}
            />
            <MetricCard
              icon={<Brain className="text-green-500" />}
              label="Insights"
              value={analyzedSeries.insights.length.toString()}
              subValue={`${analyzedSeries.insights.filter(i => i.priority === 'high' || i.priority === 'critical').length} priority`}
            />
          </div>

          {/* Win Probability Breakdown */}
          <div className="bg-surface border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                Win Probability Analysis
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Confidence:</span>
                <span className="text-sm font-bold text-primary">
                  {(analyzedSeries.winProbability.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="mb-6">
              {/* Win Probability Bar */}
              <div className="relative h-8 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
                  style={{ width: `${analyzedSeries.winProbability.probability * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white drop-shadow-md">
                    {analyzedSeries.state?.teams[0]?.name}: {(analyzedSeries.winProbability.probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{analyzedSeries.state?.teams[0]?.name}</span>
                <span>{analyzedSeries.state?.teams[1]?.name}</span>
              </div>
            </div>

            {/* Contributing Factors */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analyzedSeries.winProbability.factors.map((factor, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    factor.contribution > 0
                      ? 'bg-green-500/10 border-green-500/30'
                      : factor.contribution < 0
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <p className="text-xs text-slate-400 mb-1">{factor.name}</p>
                  <p className={`text-sm font-bold ${
                    factor.contribution > 0 ? 'text-green-400' : factor.contribution < 0 ? 'text-red-400' : 'text-slate-300'
                  }`}>
                    {factor.contribution > 0 ? '+' : ''}{(factor.contribution * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coaching Insights */}
            <div className="bg-surface border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Brain size={20} className="text-primary" />
                AI Coaching Insights
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {analyzedSeries.insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
                {analyzedSeries.insights.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">
                    No critical insights detected
                  </p>
                )}
              </div>
            </div>

            {/* Strategy Debt Breakdown */}
            <div className="bg-surface border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Shield size={20} className="text-amber-500" />
                  Strategy Debt™ Analysis
                </h3>
                <button 
                  onClick={() => onNavigate('strategy-debt')}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  Deep Dive <ChevronRight size={12} />
                </button>
              </div>
              
              {/* Debt Meter */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-slate-400">Accumulated Debt</span>
                  <span className={`text-sm font-bold ${
                    analyzedSeries.strategyDebt.totalDebt > 70 ? 'text-red-400' :
                    analyzedSeries.strategyDebt.totalDebt > 40 ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {analyzedSeries.strategyDebt.totalDebt.toFixed(1)} / 100
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      analyzedSeries.strategyDebt.totalDebt > 70 ? 'bg-red-500' :
                      analyzedSeries.strategyDebt.totalDebt > 40 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${analyzedSeries.strategyDebt.totalDebt}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {analyzedSeries.strategyDebt.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-200">{item.source}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.category === 'individual' ? 'bg-blue-500/20 text-blue-400' :
                        item.category === 'team' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Debt: <span className="text-amber-400 font-medium">{item.debtScore.toFixed(1)}</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        Freq: {item.frequency}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Player Performance Table */}
          <div className="bg-surface border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Player Performance Metrics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-3 pl-2">Player</th>
                    <th className="pb-3 text-center">Team</th>
                    <th className="pb-3 text-center">K/D/A</th>
                    <th className="pb-3 text-center">KDA Ratio</th>
                    <th className="pb-3 text-center">Impact</th>
                    <th className="pb-3 text-center">FK Rate</th>
                    <th className="pb-3 text-center">HS%</th>
                    <th className="pb-3 text-center">ADR</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzedSeries.playerMetrics
                    .sort((a, b) => b.impactRating - a.impactRating)
                    .map((player) => (
                      <PlayerRow key={player.playerId} player={player} />
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detected Mistakes */}
          <div className="bg-surface border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              Detected Issues & Mistakes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analyzedSeries.mistakes
                .sort((a, b) => {
                  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                  return severityOrder[a.severity] - severityOrder[b.severity];
                })
                .slice(0, 6)
                .map((mistake) => (
                  <MistakeCard key={mistake.id} mistake={mistake} />
                ))}
            </div>
          </div>
        </>
      ) : selectedSeries && isAnalyzing ? (
        <div className="bg-surface border border-slate-800 rounded-xl p-12 text-center">
          <RefreshCw size={48} className="text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-100 mb-2">Analyzing Match Data</h3>
          <p className="text-slate-400">Running scientific analytics on player and team performance...</p>
        </div>
      ) : (
        <div className="bg-surface border border-slate-800 rounded-xl p-12 text-center">
          <Brain size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-100 mb-2">Select a Match to Analyze</h3>
          <p className="text-slate-400">Choose a series above to view comprehensive AI-powered coaching insights</p>
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

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  trend?: 'up' | 'down';
}> = ({ icon, label, value, subValue, trend }) => (
  <div className="bg-surface border border-slate-800 rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 rounded-lg bg-slate-800">{icon}</div>
      {trend && (
        trend === 'up' 
          ? <TrendingUp size={16} className="text-green-400" />
          : <TrendingDown size={16} className="text-red-400" />
      )}
    </div>
    <p className="text-2xl font-bold text-white mb-1">{value}</p>
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-[10px] text-slate-500 mt-1">{subValue}</p>
  </div>
);

const InsightCard: React.FC<{ insight: CoachingInsight }> = ({ insight }) => {
  const priorityStyles = {
    critical: 'border-red-500/50 bg-red-500/10',
    high: 'border-amber-500/50 bg-amber-500/10',
    medium: 'border-blue-500/50 bg-blue-500/10',
    low: 'border-slate-600 bg-slate-800/50',
  };

  const priorityIcons = {
    critical: <AlertCircle size={16} className="text-red-400" />,
    high: <AlertTriangle size={16} className="text-amber-400" />,
    medium: <Info size={16} className="text-blue-400" />,
    low: <CheckCircle size={16} className="text-slate-400" />,
  };

  return (
    <div className={`p-3 rounded-lg border ${priorityStyles[insight.priority]}`}>
      <div className="flex items-start gap-2 mb-2">
        {priorityIcons[insight.priority]}
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-200">{insight.title}</p>
          <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
          {(insight.confidence * 100).toFixed(0)}%
        </span>
      </div>
      {insight.recommendedActions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <p className="text-xs text-slate-500 mb-1">Recommended Actions:</p>
          <ul className="text-xs text-slate-400 space-y-1">
            {insight.recommendedActions.slice(0, 2).map((action, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <ChevronRight size={12} className="mt-0.5 shrink-0" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const PlayerRow: React.FC<{ player: PlayerPerformanceMetrics }> = ({ player }) => {
  const impactColor = player.impactRating > 70 
    ? 'text-green-400' 
    : player.impactRating > 50 
    ? 'text-amber-400' 
    : 'text-red-400';

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/50">
      <td className="py-3 pl-2">
        <span className="font-medium text-slate-200">{player.playerName}</span>
      </td>
      <td className="py-3 text-center text-slate-400">{player.team}</td>
      <td className="py-3 text-center">
        <span className="text-green-400">{Math.round(player.kda * player.deathsPerRound * 20)}</span>
        <span className="text-slate-600">/</span>
        <span className="text-red-400">{Math.round(player.deathsPerRound * 20)}</span>
        <span className="text-slate-600">/</span>
        <span className="text-blue-400">{Math.round((player.kda - player.kdRatio) * player.deathsPerRound * 20)}</span>
      </td>
      <td className="py-3 text-center">
        <span className={player.kda >= 1.5 ? 'text-green-400' : player.kda >= 1 ? 'text-amber-400' : 'text-red-400'}>
          {player.kda.toFixed(2)}
        </span>
      </td>
      <td className="py-3 text-center">
        <span className={`font-bold ${impactColor}`}>
          {player.impactRating.toFixed(1)}
        </span>
      </td>
      <td className="py-3 text-center">
        <span className={player.firstKillRate > 0.15 ? 'text-green-400' : 'text-slate-400'}>
          {(player.firstKillRate * 100).toFixed(1)}%
        </span>
      </td>
      <td className="py-3 text-center">
        <span className={player.headshotPercentage > 0.3 ? 'text-green-400' : 'text-slate-400'}>
          {(player.headshotPercentage * 100).toFixed(1)}%
        </span>
      </td>
      <td className="py-3 text-center">
        <span className={player.damagePerRound > 150 ? 'text-green-400' : 'text-slate-400'}>
          {player.damagePerRound.toFixed(1)}
        </span>
      </td>
    </tr>
  );
};

const MistakeCard: React.FC<{ mistake: MicroMistake }> = ({ mistake }) => {
  const severityStyles = {
    critical: 'border-red-500/50 bg-red-500/10',
    high: 'border-amber-500/50 bg-amber-500/10',
    medium: 'border-blue-500/50 bg-blue-500/10',
    low: 'border-slate-600 bg-slate-800/50',
  };

  return (
    <div className={`p-3 rounded-lg border ${severityStyles[mistake.severity]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-200">{mistake.playerName}</span>
        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
          mistake.severity === 'critical' ? 'bg-red-500/30 text-red-400' :
          mistake.severity === 'high' ? 'bg-amber-500/30 text-amber-400' :
          'bg-blue-500/30 text-blue-400'
        }`}>
          {mistake.severity}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-2">{mistake.description}</p>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-slate-500">
          Impact: <span className="text-red-400">{(mistake.probabilityImpact * 100).toFixed(1)}%</span>
        </span>
        <span className="text-slate-500">
          Occurrences: <span className="text-amber-400">{mistake.occurrences}</span>
        </span>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-700">
        <p className="text-xs text-slate-500">{mistake.macroImpact.description}</p>
      </div>
    </div>
  );
};

export default CoachDashboard;
