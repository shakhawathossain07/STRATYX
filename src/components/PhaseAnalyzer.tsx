import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, AlertCircle } from 'lucide-react';

interface PhaseData {
  phase: 'Early' | 'Mid' | 'Late';
  debt: number;
  actions: number;
  efficiency: number; // 0-100
}

interface PhaseAnalyzerProps {
  phaseDebt?: { early: number; mid: number; late: number };
  currentPhase?: 'early' | 'mid' | 'late';
}

export const PhaseAnalyzer: React.FC<PhaseAnalyzerProps> = ({
  phaseDebt = { early: 12, mid: 45, late: 30 },
  currentPhase = 'mid'
}) => {
  const data: PhaseData[] = [
    {
      phase: 'Early',
      debt: phaseDebt.early,
      actions: 34,
      efficiency: 72
    },
    {
      phase: 'Mid',
      debt: phaseDebt.mid,
      actions: 58,
      efficiency: 45
    },
    {
      phase: 'Late',
      debt: phaseDebt.late,
      actions: 42,
      efficiency: 61
    }
  ];

  const getPhaseColor = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'early':
        return '#3b82f6'; // blue
      case 'mid':
        return '#f59e0b'; // amber
      case 'late':
        return '#ef4444'; // red
      default:
        return '#64748b';
    }
  };

  const getCurrentPhaseLabel = () => {
    return currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1);
  };

  const getWorstPhase = () => {
    const maxDebt = Math.max(phaseDebt.early, phaseDebt.mid, phaseDebt.late);
    if (maxDebt === phaseDebt.early) return 'Early';
    if (maxDebt === phaseDebt.mid) return 'Mid';
    return 'Late';
  };

  const worstPhase = getWorstPhase();
  const maxDebt = Math.max(phaseDebt.early, phaseDebt.mid, phaseDebt.late);

  return (
    <div className="bg-surface border border-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Phase Analysis</h3>
          <p className="text-xs text-slate-500">Strategy Debt by game phase</p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-primary/10 rounded-full">
          <Clock className="text-primary" size={14} />
          <span className="text-xs font-bold text-primary uppercase">{getCurrentPhaseLabel()} Game</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="phase"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              label={{ value: 'Strategy Debt', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: '#1e293b' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as PhaseData;
                  return (
                    <div className="bg-[#16161a] border border-slate-800 rounded-lg p-3">
                      <p className="text-xs font-bold text-slate-100 mb-2">{data.phase} Game</p>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">
                          Debt: <span className="text-amber-500 font-bold">{data.debt}</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Actions: <span className="text-slate-100 font-bold">{data.actions}</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Efficiency: <span className="text-primary font-bold">{data.efficiency}%</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="debt" radius={[4, 4, 0, 0]} barSize={50}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPhaseColor(entry.phase)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Critical Phase Alert */}
      {maxDebt > 40 && (
        <div className="mb-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="text-sm font-bold text-red-400 mb-1">Critical Phase Identified</p>
              <p className="text-xs text-slate-400">
                {worstPhase} game shows highest Strategy Debt ({maxDebt.toFixed(0)}).
                Focus tactical adjustments on this phase for maximum impact.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phase Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {data.map((phaseData) => (
          <div
            key={phaseData.phase}
            className={`p-3 rounded-lg border ${
              phaseData.phase.toLowerCase() === currentPhase
                ? 'bg-primary/5 border-primary/20'
                : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">{phaseData.phase}</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getPhaseColor(phaseData.phase) }}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500">Debt</span>
                <span className="text-xs font-bold text-amber-500">{phaseData.debt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500">Efficiency</span>
                <span className={`text-xs font-bold ${
                  phaseData.efficiency > 70 ? 'text-green-500' :
                  phaseData.efficiency > 50 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {phaseData.efficiency}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
