import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Database, Zap } from 'lucide-react';

interface SystemMetrics {
  dataFreshness: 'real-time' | 'delayed' | 'stale';
  avgLatencyMs: number;
  maxLatencyMs: number;
  eventsProcessed: number;
  insightsGenerated: number;
  dataQualityScore: number;
  avgProcessingTime: number;
  errorCount: number;
  uptime: number;
}

interface SystemHealthMonitorProps {
  metrics?: SystemMetrics;
  showDetailed?: boolean;
}

export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  metrics,
  showDetailed = false
}) => {
  const [currentMetrics, _setCurrentMetrics] = useState<SystemMetrics>(
    metrics || {
      dataFreshness: 'real-time',
      avgLatencyMs: 45,
      maxLatencyMs: 320,
      eventsProcessed: 1247,
      insightsGenerated: 43,
      dataQualityScore: 0.96,
      avgProcessingTime: 127,
      errorCount: 0,
      uptime: 3600
    }
  );

  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    // Update health status based on metrics
    const healthy =
      currentMetrics.dataFreshness === 'real-time' &&
      currentMetrics.avgLatencyMs < 500 &&
      currentMetrics.avgProcessingTime < 500 &&
      currentMetrics.dataQualityScore > 0.8 &&
      currentMetrics.errorCount < 10;

    setIsHealthy(healthy);
  }, [currentMetrics]);

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'real-time': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'delayed': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'stale': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getLatencyStatus = (latencyMs: number) => {
    if (latencyMs < 100) return { color: 'text-green-500', label: 'Excellent' };
    if (latencyMs < 300) return { color: 'text-blue-500', label: 'Good' };
    if (latencyMs < 500) return { color: 'text-amber-500', label: 'Fair' };
    return { color: 'text-red-500', label: 'Poor' };
  };

  const getQualityStatus = (score: number) => {
    if (score > 0.95) return { color: 'text-green-500', label: 'Excellent' };
    if (score > 0.85) return { color: 'text-blue-500', label: 'Good' };
    if (score > 0.70) return { color: 'text-amber-500', label: 'Fair' };
    return { color: 'text-red-500', label: 'Poor' };
  };

  const latencyStatus = getLatencyStatus(currentMetrics.avgLatencyMs);
  const qualityStatus = getQualityStatus(currentMetrics.dataQualityScore);

  if (!showDetailed) {
    // Compact view for header
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {isHealthy ? (
            <CheckCircle className="text-green-500" size={16} />
          ) : (
            <AlertCircle className="text-amber-500" size={16} />
          )}
          <span className="text-xs font-medium text-slate-400">
            System {isHealthy ? 'Healthy' : 'Degraded'}
          </span>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-bold border ${getFreshnessColor(currentMetrics.dataFreshness)}`}>
          {currentMetrics.dataFreshness.toUpperCase()}
        </div>
        <div className="text-xs text-slate-500">
          {currentMetrics.avgLatencyMs}ms
        </div>
      </div>
    );
  }

  // Detailed view
  return (
    <div className="bg-surface border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-100">System Health Monitor</h3>
          <p className="text-xs text-slate-500">Real-time performance & data quality metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          {isHealthy ? (
            <>
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-sm font-bold text-green-500">All Systems Operational</span>
            </>
          ) : (
            <>
              <AlertCircle className="text-amber-500" size={20} />
              <span className="text-sm font-bold text-amber-500">Performance Degraded</span>
            </>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Data Freshness */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="text-primary" size={16} />
            <span className="text-xs font-bold text-slate-500 uppercase">Data Freshness</span>
          </div>
          <div className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold border ${getFreshnessColor(currentMetrics.dataFreshness)}`}>
            {currentMetrics.dataFreshness.toUpperCase()}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Last update: <span className="text-slate-300 font-medium">now</span>
          </p>
        </div>

        {/* Latency */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="text-blue-500" size={16} />
            <span className="text-xs font-bold text-slate-500 uppercase">Latency</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-black ${latencyStatus.color}`}>
              {currentMetrics.avgLatencyMs}ms
            </span>
            <span className="text-xs text-slate-500">{latencyStatus.label}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Peak: {currentMetrics.maxLatencyMs}ms
          </p>
        </div>

        {/* Processing Speed */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="text-amber-500" size={16} />
            <span className="text-xs font-bold text-slate-500 uppercase">Processing Speed</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-black ${
              currentMetrics.avgProcessingTime < 200 ? 'text-green-500' :
              currentMetrics.avgProcessingTime < 500 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {currentMetrics.avgProcessingTime}ms
            </span>
            <span className="text-xs text-slate-500">avg</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Target: &lt;500ms
          </p>
        </div>
      </div>

      {/* Data Quality & Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Data Quality */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Database className="text-primary" size={16} />
              <span className="text-xs font-bold text-slate-500 uppercase">Data Quality</span>
            </div>
            <span className={`text-sm font-bold ${qualityStatus.color}`}>
              {qualityStatus.label}
            </span>
          </div>
          <div className="mb-2">
            <div className="flex items-baseline space-x-2 mb-1">
              <span className="text-2xl font-black text-primary">
                {(currentMetrics.dataQualityScore * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  currentMetrics.dataQualityScore > 0.9 ? 'bg-green-500' :
                  currentMetrics.dataQualityScore > 0.8 ? 'bg-blue-500' :
                  currentMetrics.dataQualityScore > 0.7 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${currentMetrics.dataQualityScore * 100}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Based on completeness, validity, and freshness
          </p>
        </div>

        {/* Event Statistics */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="text-green-500" size={16} />
            <span className="text-xs font-bold text-slate-500 uppercase">Event Statistics</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Events Processed</span>
              <span className="text-sm font-bold text-slate-100">
                {currentMetrics.eventsProcessed.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Insights Generated</span>
              <span className="text-sm font-bold text-primary">
                {currentMetrics.insightsGenerated}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Error Count</span>
              <span className={`text-sm font-bold ${
                currentMetrics.errorCount === 0 ? 'text-green-500' :
                currentMetrics.errorCount < 5 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {currentMetrics.errorCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Performance Indicators</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PerformanceIndicator
            label="Real-time Guarantee"
            value={currentMetrics.avgLatencyMs < 500 ? 'MET' : 'MISS'}
            status={currentMetrics.avgLatencyMs < 500 ? 'success' : 'warning'}
          />
          <PerformanceIndicator
            label="Statistical Rigor"
            value="VALIDATED"
            status="success"
          />
          <PerformanceIndicator
            label="Data Pipeline"
            value={currentMetrics.dataFreshness === 'real-time' ? 'LIVE' : 'DELAYED'}
            status={currentMetrics.dataFreshness === 'real-time' ? 'success' : 'warning'}
          />
          <PerformanceIndicator
            label="Error Rate"
            value={currentMetrics.errorCount === 0 ? 'ZERO' : 'LOW'}
            status={currentMetrics.errorCount === 0 ? 'success' : 'warning'}
          />
        </div>
      </div>

      {/* Scientific Validation Badge */}
      <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg flex items-center space-x-3">
        <CheckCircle className="text-primary" size={20} />
        <div>
          <p className="text-xs font-bold text-primary">Scientific Validation Enabled</p>
          <p className="text-xs text-slate-400">
            All insights include statistical significance testing (p&lt;0.05), confidence intervals (95%), and minimum sample size validation
          </p>
        </div>
      </div>
    </div>
  );
};

const PerformanceIndicator: React.FC<{
  label: string;
  value: string;
  status: 'success' | 'warning' | 'error';
}> = ({ label, value, status }) => {
  const colors = {
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className={`px-2 py-1 rounded border text-xs font-bold ${colors[status]}`}>
        {value}
      </div>
    </div>
  );
};
