import { StrategyDebtMeter } from '../components/StrategyDebtMeter';
import { CausalGraph } from '../components/CausalGraph';
import { WinProbabilityChart } from '../components/WinProbabilityChart';
import { PhaseAnalyzer } from '../components/PhaseAnalyzer';
import { AlertCircle, Zap, Shield, Target, RefreshCw, Database } from 'lucide-react';
import { useStratyxContext } from '../contexts/StratyxContext';
import { GAME_TITLE_IDS } from '../services/gridApi';

export const Dashboard: React.FC = () => {
  const { 
    insights, 
    strategyDebt, 
    phaseDebt,
    winProbability,
    availableSeries,
    currentSeries,
    isLoadingSeries,
    isLive,
    selectSeries,
    loadAvailableSeries,
    score,
    roundNumber,
    apiError
  } = useStratyxContext();

  return (
    <div className="space-y-6">
      {/* API Error Banner */}
      {apiError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm text-red-400 font-semibold">API Error</p>
            <p className="text-xs text-slate-400">{apiError}</p>
          </div>
        </div>
      )}

      {/* Series Selector */}
      <div className="bg-surface border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Database size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              GRID API Series
            </h3>
            {isLoadingSeries && <RefreshCw size={14} className="text-primary animate-spin" />}
          </div>
          <div className="flex items-center gap-2">
            <select 
              onChange={(e) => loadAvailableSeries(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
            >
              <option value={GAME_TITLE_IDS.VALORANT}>VALORANT</option>
              <option value={GAME_TITLE_IDS.CSGO}>CS2</option>
              <option value={GAME_TITLE_IDS.LOL}>League of Legends</option>
              <option value={GAME_TITLE_IDS.DOTA2}>DOTA 2</option>
            </select>
            <button 
              onClick={() => loadAvailableSeries()}
              className="p-1.5 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
              disabled={isLoadingSeries}
            >
              <RefreshCw size={14} className={`text-primary ${isLoadingSeries ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {availableSeries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {availableSeries.slice(0, 9).map((series) => (
              <button
                key={series.id}
                onClick={() => selectSeries(series)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  currentSeries?.id === series.id 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(series.startTimeScheduled).toLocaleDateString()}
                  </span>
                  {currentSeries?.id === series.id && isLive && (
                    <span className="text-[10px] text-success font-bold">● LIVE</span>
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
          <div className="text-center py-6">
            {isLoadingSeries ? (
              <div className="text-primary">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading series from GRID API...</p>
              </div>
            ) : (
              <div className="text-slate-500">
                <Database size={24} className="mx-auto mb-2" />
                <p className="text-sm">No series available</p>
                <p className="text-xs mt-1">Try selecting a different game or refresh</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Match Details Header */}
      {currentSeries && (
        <div className="bg-surface border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Team A */}
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="text-right">
                <h2 className="text-xl font-bold text-slate-100">{currentSeries.teams?.[0]?.baseInfo?.name || 'Team A'}</h2>
                <p className="text-xs text-slate-500">Home</p>
              </div>
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 p-2">
                {currentSeries.teams?.[0]?.baseInfo?.logoUrl ? (
                  <img src={currentSeries.teams[0].baseInfo.logoUrl} alt="Team A" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-slate-600">A</span>
                )}
              </div>
            </div>

            {/* VS / Score */}
            <div className="flex flex-col items-center justify-center px-8">
              <div className="text-3xl font-black text-white tracking-widest bg-slate-900/50 px-6 py-2 rounded-lg border border-slate-700">
                {score.home} - {score.away}
              </div>
              <div className="mt-2 flex flex-col items-center">
                 <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                    {isLive ? 'LIVE DATA STREAM' : 'MATCH SCHEDULED'}
                 </span>
                 <span className="text-[10px] text-slate-500">
                   {new Date(currentSeries.startTimeScheduled).toLocaleString()}
                 </span>
                 <span className="text-[10px] text-slate-600 mt-1">{currentSeries.tournament?.name}</span>
              </div>
            </div>

            {/* Team B */}
            <div className="flex items-center gap-4 flex-1 justify-start">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-700 p-2">
                {currentSeries.teams?.[1]?.baseInfo?.logoUrl ? (
                  <img src={currentSeries.teams[1].baseInfo.logoUrl} alt="Team B" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-slate-600">B</span>
                )}
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-slate-100">{currentSeries.teams?.[1]?.baseInfo?.name || 'Team B'}</h2>
                <p className="text-xs text-slate-500">Away</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Row: Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Zap className="text-amber-500" size={18} />}
          label="Round"
          value={roundNumber > 0 ? `#${roundNumber}` : '--'}
          subValue={isLive ? 'In Progress' : 'Waiting'}
        />
        <MetricCard
          icon={<AlertCircle className="text-red-500" size={18} />}
          label="Score"
          value={`${score.home} - ${score.away}`}
          subValue={currentSeries ? 'Live Score' : 'No Match'}
        />
        <MetricCard
          icon={<Shield className="text-blue-500" size={18} />}
          label="Strategy Debt"
          value={strategyDebt > 0 ? strategyDebt.toFixed(1) : '--'}
          subValue={strategyDebt > 70 ? 'Critical' : strategyDebt > 40 ? 'Warning' : 'Stable'}
        />
        <MetricCard
          icon={<Target className="text-green-500" size={18} />}
          label="Win Probability"
          value={`${(winProbability * 100).toFixed(1)}%`}
          subValue={winProbability > 0.5 ? 'Favorable' : 'Unfavorable'}
        />
      </div>

      {/* Win Probability Chart */}
      <WinProbabilityChart
        currentProbability={winProbability}
        trend={winProbability > 0.5 ? "increasing" : "decreasing"}
        delta={Math.abs(winProbability - 0.5)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Causal Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <CausalGraph />

          <div className="bg-surface border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Live Recommendation Panel</h3>
            <div className="space-y-3">
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <RecommendationItem
                    key={insight.id}
                    priority={insight.priority as 'high' | 'medium'}
                    action={insight.recommendation.split('.')[0]}
                    reason={insight.recommendation}
                  />
                ))
              ) : currentSeries ? (
                <div className="text-center py-4 text-slate-500">
                  <p className="text-sm">Analyzing match data...</p>
                  <p className="text-xs mt-1">Recommendations will appear during live play</p>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <p className="text-sm">Select a match to analyze</p>
                  <p className="text-xs mt-1">AI recommendations will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Phase Analyzer */}
          <PhaseAnalyzer
            phaseDebt={phaseDebt}
            currentPhase="mid"
          />
        </div>

        {/* Right Column: Strategy Debt & Alerts */}
        <div className="space-y-6">
          <StrategyDebtMeter debt={strategyDebt > 0 ? strategyDebt : undefined} />

          <div className="bg-surface border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Real-time Alerts</h3>
            <div className="space-y-4">
              {currentSeries ? (
                isLive ? (
                  <>
                    <AlertItem type="info" message="Connected to GRID API - Monitoring match events" />
                    <AlertItem type="info" message={`Analyzing: ${currentSeries.teams?.[0]?.baseInfo?.name} vs ${currentSeries.teams?.[1]?.baseInfo?.name}`} />
                  </>
                ) : (
                  <AlertItem type="info" message="Waiting for match to begin..." />
                )
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  <p>Select a match to see alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; subValue: string }> = ({ icon, label, value, subValue }) => (
  <div className="bg-surface border border-slate-800 rounded-xl p-4">
    <div className="flex items-center space-x-2 mb-2">
      {icon}
      <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
    </div>
    <div className="flex items-baseline space-x-2">
      <span className="text-xl font-black text-slate-100">{value}</span>
      <span className="text-[10px] text-slate-500 font-medium">{subValue}</span>
    </div>
  </div>
);

const RecommendationItem: React.FC<{ priority: 'high' | 'medium'; action: string; reason: string }> = ({ priority, action, reason }) => (
  <div className={`p-4 rounded-lg border ${
    priority === 'high' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
  }`}>
    <div className="flex items-center justify-between mb-1">
      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
        priority === 'high' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
      }`}>
        {priority} Priority
      </span>
      <span className="text-xs font-bold text-slate-100">{action}</span>
    </div>
    <p className="text-xs text-slate-400">{reason}</p>
  </div>
);

const AlertItem: React.FC<{ type: 'danger' | 'warning' | 'info'; message: string }> = ({ type, message }) => (
  <div className="flex items-start space-x-3">
    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${
      type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
    }`} />
    <p className="text-xs text-slate-300">{message}</p>
  </div>
);
