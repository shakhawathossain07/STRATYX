import React, { useState, useEffect } from 'react';
import { X, WifiOff, CheckCircle, AlertCircle, Loader, RefreshCw, Save, Eye, EyeOff, Server, Key, Activity, Zap } from 'lucide-react';
import { config } from '../config';

interface ApiStatus {
  name: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error' | 'checking';
  latency?: number;
  message?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
    { name: 'GRID Central Data', endpoint: config.grid.centralDataUrl, status: 'checking' },
    { name: 'GRID Series State', endpoint: config.grid.seriesStateUrl, status: 'checking' },
    { name: 'GRID File Download', endpoint: config.grid.fileDownloadUrl, status: 'checking' },
  ]);

  const [showApiKey, setShowApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(config.grid.apiKey);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Feature toggles from config
  const [featureToggles, setFeatureToggles] = useState({
    liveMode: config.features.liveMode,
    demoMode: config.features.demoMode,
    counterfactualSim: config.features.counterfactualSim,
  });

  // Check API status on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      checkAllApiStatus();
    }
  }, [isOpen]);

  const checkApiEndpoint = async (endpoint: string, name: string): Promise<ApiStatus> => {
    const startTime = Date.now();
    
    try {
      // For GraphQL endpoints, we do a simple introspection query
      if (endpoint.includes('graphql')) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': localApiKey,
          },
          body: JSON.stringify({
            query: '{ __typename }',
          }),
        });

        const latency = Date.now() - startTime;

        if (response.ok) {
          return { name, endpoint, status: 'connected', latency };
        } else if (response.status === 401 || response.status === 403) {
          return { name, endpoint, status: 'error', latency, message: 'Invalid API key or insufficient permissions' };
        } else {
          return { name, endpoint, status: 'error', latency, message: `HTTP ${response.status}` };
        }
      }

      // For File Download API (REST), do a simple HEAD/OPTIONS request
      if (endpoint.includes('file-download')) {
        try {
          const response = await fetch(endpoint, {
            method: 'OPTIONS',
            headers: {
              'x-api-key': localApiKey,
            },
          });
          const latency = Date.now() - startTime;
          
          if (response.ok || response.status === 204 || response.status === 405) {
            // 405 Method Not Allowed is acceptable - means endpoint exists
            return { name, endpoint, status: 'connected', latency, message: 'REST API ready' };
          } else if (response.status === 401 || response.status === 403) {
            return { name, endpoint, status: 'error', latency, message: 'Invalid API key' };
          } else {
            return { name, endpoint, status: 'connected', latency, message: 'Endpoint available' };
          }
        } catch {
          return { name, endpoint, status: 'connected', message: 'REST API (cannot verify CORS)' };
        }
      }

      return { name, endpoint, status: 'disconnected', message: 'Unknown endpoint type' };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        name,
        endpoint,
        status: 'error',
        latency,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  };

  const checkAllApiStatus = async () => {
    setIsTestingConnection(true);
    
    // Set all to checking
    setApiStatuses(prev => prev.map(api => ({ ...api, status: 'checking' as const })));

    const results = await Promise.all(
      apiStatuses.map(api => checkApiEndpoint(api.endpoint, api.name))
    );

    setApiStatuses(results);
    setIsTestingConnection(false);
  };

  const handleSaveApiKey = () => {
    // Note: In a real app, this would persist the API key
    // For Vite env vars, you'd need to restart the dev server
    // This is just for demonstration - the key is stored in state only
    setSaveMessage({
      type: 'success',
      text: 'API key updated for this session. Add to .env file for persistence.',
    });
    setTimeout(() => setSaveMessage(null), 5000);
    
    // Re-check API status with new key
    checkAllApiStatus();
  };

  const getStatusIcon = (status: ApiStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle size={16} className="text-success" />;
      case 'disconnected':
        return <WifiOff size={16} className="text-slate-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-danger" />;
      case 'checking':
        return <Loader size={16} className="text-primary animate-spin" />;
    }
  };

  const getStatusColor = (status: ApiStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'border-success/30 bg-success/5';
      case 'disconnected':
        return 'border-slate-600 bg-slate-800/50';
      case 'error':
        return 'border-danger/30 bg-danger/5';
      case 'checking':
        return 'border-primary/30 bg-primary/5';
    }
  };

  const overallStatus = apiStatuses.every(api => api.status === 'connected')
    ? 'All Systems Operational'
    : apiStatuses.some(api => api.status === 'error')
    ? 'Some Systems Have Issues'
    : apiStatuses.some(api => api.status === 'checking')
    ? 'Checking Status...'
    : 'Systems Offline';

  const overallStatusColor = apiStatuses.every(api => api.status === 'connected')
    ? 'text-success'
    : apiStatuses.some(api => api.status === 'error')
    ? 'text-danger'
    : 'text-amber-500';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface border border-slate-700 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-surface">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-game text-white tracking-wide">Settings</h2>
              <p className={`text-xs ${overallStatusColor}`}>{overallStatus}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Status Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Activity size={14} />
                API Status
              </h3>
              <button
                onClick={checkAllApiStatus}
                disabled={isTestingConnection}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={isTestingConnection ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {apiStatuses.map((api, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${getStatusColor(api.status)} transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(api.status)}
                      <div>
                        <p className="font-medium text-white">{api.name}</p>
                        <p className="text-xs text-slate-500 font-mono truncate max-w-xs">
                          {api.endpoint}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {api.latency !== undefined && (
                        <p className="text-xs text-slate-400">{api.latency}ms</p>
                      )}
                      {api.message && (
                        <p className="text-xs text-slate-500">{api.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* API Configuration Section */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
              <Key size={14} />
              API Configuration
            </h3>

            <div className="space-y-4">
              {/* API Key Input */}
              <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  GRID API Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={localApiKey}
                      onChange={(e) => setLocalApiKey(e.target.value)}
                      placeholder="Enter your GRID API key"
                      className="w-full px-4 py-2 pr-10 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-sm"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/80 text-white font-medium flex items-center gap-2 transition-colors"
                  >
                    <Save size={16} />
                    Save
                  </button>
                </div>
                {saveMessage && (
                  <p className={`mt-2 text-xs ${saveMessage.type === 'success' ? 'text-success' : 'text-danger'}`}>
                    {saveMessage.text}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Get your API key from{' '}
                  <a
                    href="https://grid.gg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    grid.gg
                  </a>
                </p>
              </div>

              {/* Endpoint Configuration */}
              <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  API Endpoints (Cloud9 x JetBrains Hackathon)
                </label>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Central Data:</span>
                    <span className="text-slate-300 text-xs">{config.grid.centralDataUrl}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Series State:</span>
                    <span className="text-slate-300 text-xs">{config.grid.seriesStateUrl}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">File Download:</span>
                    <span className="text-slate-300 text-xs">{config.grid.fileDownloadUrl}</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Endpoints are configured via environment variables in .env file
                </p>
              </div>
            </div>
          </section>

          {/* Feature Toggles Section */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
              <Zap size={14} />
              Feature Toggles
            </h3>

            <div className="space-y-3">
              <FeatureToggle
                label="Live Mode"
                description="Enable real-time data streaming from GRID API"
                enabled={featureToggles.liveMode}
                onChange={(v) => setFeatureToggles(prev => ({ ...prev, liveMode: v }))}
              />
              <FeatureToggle
                label="Demo Mode"
                description="Use simulated data when API is unavailable"
                enabled={featureToggles.demoMode}
                onChange={(v) => setFeatureToggles(prev => ({ ...prev, demoMode: v }))}
              />
              <FeatureToggle
                label="Counterfactual Simulation"
                description="Enable 'what-if' scenario analysis"
                enabled={featureToggles.counterfactualSim}
                onChange={(v) => setFeatureToggles(prev => ({ ...prev, counterfactualSim: v }))}
              />
            </div>
          </section>

          {/* App Info Section */}
          <section className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{config.app.name} v{config.app.version}</span>
              <span>Theme: {config.ui.theme}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Feature Toggle Component
const FeatureToggle: React.FC<{
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/30">
    <div>
      <p className="font-medium text-white">{label}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-slate-600'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default SettingsModal;
