import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WinProbabilityChartProps {
  data?: Array<{ timestamp: string; probability: number }>;
  currentProbability: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  delta?: number;
}

export const WinProbabilityChart: React.FC<WinProbabilityChartProps> = ({
  data = generateMockData(),
  currentProbability,
  trend = 'stable',
  delta = 0
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="text-green-500" size={18} />;
      case 'decreasing':
        return <TrendingDown className="text-red-500" size={18} />;
      default:
        return <Minus className="text-slate-500" size={18} />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'increasing':
        return 'text-green-500';
      case 'decreasing':
        return 'text-red-500';
      default:
        return 'text-slate-500';
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="bg-surface border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Win Probability</h3>
          <p className="text-xs text-slate-500">Real-time Bayesian estimation</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2">
            <span className="text-3xl font-black text-primary">
              {formatPercentage(currentProbability)}
            </span>
            {getTrendIcon()}
          </div>
          <p className={`text-xs font-bold ${getTrendColor()}`}>
            {delta > 0 ? '+' : ''}{formatPercentage(delta)} vs previous
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="timestamp"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#16161a] border border-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">
                        {new Date(payload[0].payload.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {formatPercentage(payload[0].value as number)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0.5} stroke="#64748b" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="probability"
              stroke="#7c3aed"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#7c3aed' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-slate-500 font-medium">Confidence</p>
          <p className="text-sm font-bold text-slate-100">82.4%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Peak</p>
          <p className="text-sm font-bold text-green-500">
            {formatPercentage(Math.max(...data.map(d => d.probability)))}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Low</p>
          <p className="text-sm font-bold text-red-500">
            {formatPercentage(Math.min(...data.map(d => d.probability)))}
          </p>
        </div>
      </div>
    </div>
  );
};

function generateMockData(): Array<{ timestamp: string; probability: number }> {
  const data: Array<{ timestamp: string; probability: number }> = [];
  const now = Date.now();
  const points = 30;

  let prob = 0.5;
  for (let i = 0; i < points; i++) {
    // Random walk with slight upward bias
    prob += (Math.random() - 0.45) * 0.05;
    prob = Math.max(0.2, Math.min(0.8, prob));

    data.push({
      timestamp: new Date(now - (points - i) * 60000).toISOString(),
      probability: prob
    });
  }

  return data;
}
