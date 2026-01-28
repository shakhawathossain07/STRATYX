import React from 'react';
import { User, TrendingUp, AlertTriangle } from 'lucide-react';

export interface PlayerImpactData {
  playerId: string;
  name: string;
  role: string;
  impactScore: number; // -100 to 100
  positiveActions: number;
  negativeActions: number;
  riskScore: number; // 0-100
  strengthScore: number; // 0-100
  topMistake?: string;
  topStrength?: string;
}

interface PlayerImpactCardProps {
  player: PlayerImpactData;
  onClick?: () => void;
}

export const PlayerImpactCard: React.FC<PlayerImpactCardProps> = ({ player, onClick }) => {
  const getImpactColor = (score: number) => {
    if (score > 30) return 'text-green-500';
    if (score < -30) return 'text-red-500';
    return 'text-slate-400';
  };

  const getImpactBgColor = (score: number) => {
    if (score > 30) return 'bg-green-500/10 border-green-500/20';
    if (score < -30) return 'bg-red-500/10 border-red-500/20';
    return 'bg-slate-800/50 border-slate-700';
  };

  const getRiskColor = (risk: number) => {
    if (risk > 70) return 'text-red-500 bg-red-500';
    if (risk > 40) return 'text-amber-500 bg-amber-500';
    return 'text-green-500 bg-green-500';
  };

  return (
    <div
      className={`${getImpactBgColor(player.impactScore)} border rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
            <User className="text-slate-400" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">{player.name}</h4>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{player.role}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black ${getImpactColor(player.impactScore)}`}>
            {player.impactScore > 0 ? '+' : ''}{player.impactScore.toFixed(0)}
          </p>
          <p className="text-[10px] text-slate-500 uppercase font-bold">Impact</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-slate-900/50 rounded">
          <p className="text-xs text-green-500 font-bold">{player.positiveActions}</p>
          <p className="text-[9px] text-slate-500 uppercase">Positive</p>
        </div>
        <div className="text-center p-2 bg-slate-900/50 rounded">
          <p className="text-xs text-red-500 font-bold">{player.negativeActions}</p>
          <p className="text-[9px] text-slate-500 uppercase">Negative</p>
        </div>
        <div className="text-center p-2 bg-slate-900/50 rounded">
          <p className={`text-xs font-bold ${getImpactColor(player.impactScore)}`}>
            {(player.positiveActions / Math.max(1, player.positiveActions + player.negativeActions) * 100).toFixed(0)}%
          </p>
          <p className="text-[9px] text-slate-500 uppercase">Success</p>
        </div>
      </div>

      {/* Risk Indicator */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500 font-medium">Risk Level</span>
          <span className={`text-xs font-bold ${getRiskColor(player.riskScore).replace('bg-', 'text-')}`}>
            {player.riskScore.toFixed(0)}
          </span>
        </div>
        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full ${getRiskColor(player.riskScore)} transition-all`}
            style={{ width: `${player.riskScore}%` }}
          />
        </div>
      </div>

      {/* Key Insights */}
      {player.topMistake && player.riskScore > 40 && (
        <div className="p-2 bg-red-500/5 border border-red-500/20 rounded text-xs mb-2">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={12} />
            <div>
              <p className="text-red-400 font-medium">Top Issue</p>
              <p className="text-slate-400">{player.topMistake}</p>
            </div>
          </div>
        </div>
      )}

      {player.topStrength && player.strengthScore > 50 && (
        <div className="p-2 bg-green-500/5 border border-green-500/20 rounded text-xs">
          <div className="flex items-start space-x-2">
            <TrendingUp className="text-green-500 mt-0.5 flex-shrink-0" size={12} />
            <div>
              <p className="text-green-400 font-medium">Top Strength</p>
              <p className="text-slate-400">{player.topStrength}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component to display grid of player cards
interface PlayerImpactGridProps {
  players: PlayerImpactData[];
  onPlayerClick?: (playerId: string) => void;
}

export const PlayerImpactGrid: React.FC<PlayerImpactGridProps> = ({ players, onPlayerClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {players.map(player => (
        <PlayerImpactCard
          key={player.playerId}
          player={player}
          onClick={() => onPlayerClick?.(player.playerId)}
        />
      ))}
    </div>
  );
};
