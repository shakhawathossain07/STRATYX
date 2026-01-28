import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { phase: 'Early', debt: 12 },
  { phase: 'Mid', debt: 45 },
  { phase: 'Late', debt: 30 },
];

export const StrategyDebtMeter: React.FC<{ debt?: number }> = ({ debt = 87.4 }) => {
  return (
    <div className="bg-surface border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Strategy Debt™</h3>
          <p className="text-xs text-slate-500">Accumulated disadvantage from micro-decisions</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-accent">{debt.toFixed(1)}</span>
          <p className="text-[10px] text-accent/70 uppercase font-bold">Total Index</p>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="phase" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: '#1e293b' }}
              contentStyle={{ backgroundColor: '#16161a', border: '1px solid #1e293b', borderRadius: '8px' }}
            />
            <Bar dataKey="debt" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
        <span className="text-slate-500 font-medium italic">"Suboptimal eco-management in Round 4 (+12 Debt)"</span>
      </div>
    </div>
  );
};
