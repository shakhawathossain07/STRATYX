export const config = {
  // GRID API (Cloud9 x JetBrains Hackathon endpoints)
  grid: {
    apiKey: import.meta.env.VITE_GRID_API_KEY || '',
    centralDataUrl: import.meta.env.VITE_GRID_CENTRAL_DATA_URL || 'https://api-op.grid.gg/central-data/graphql',
    seriesStateUrl: import.meta.env.VITE_GRID_SERIES_STATE_URL || 'https://api-op.grid.gg/live-data-feed/series-state/graphql',
    fileDownloadUrl: import.meta.env.VITE_GRID_FILE_DOWNLOAD_URL || 'https://api-op.grid.gg/file-download',
  },

  // Application
  app: {
    name: import.meta.env.VITE_APP_NAME || 'STRATYX',
    version: import.meta.env.VITE_APP_VERSION || '0.1.0',
  },

  // Feature Flags
  features: {
    liveMode: import.meta.env.VITE_ENABLE_LIVE_MODE === 'true',
    demoMode: import.meta.env.VITE_ENABLE_DEMO_MODE === 'true',
    counterfactualSim: import.meta.env.VITE_ENABLE_COUNTERFACTUAL_SIM === 'true',
  },

  // Analytics
  analytics: {
    enabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    endpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT || '',
  },

  // Strategy Debt
  debt: {
    criticalThreshold: Number(import.meta.env.VITE_DEBT_CRITICAL_THRESHOLD) || 75,
    warningThreshold: Number(import.meta.env.VITE_DEBT_WARNING_THRESHOLD) || 50,
  },

  // Win Probability Model
  winProb: {
    updateInterval: Number(import.meta.env.VITE_WINPROB_UPDATE_INTERVAL) || 5000,
    confidenceMin: Number(import.meta.env.VITE_WINPROB_CONFIDENCE_MIN) || 0.3,
  },

  // Pattern Detection
  patterns: {
    minOccurrences: Number(import.meta.env.VITE_PATTERN_MIN_OCCURRENCES) || 3,
    minConfidence: Number(import.meta.env.VITE_PATTERN_MIN_CONFIDENCE) || 0.65,
  },

  // UI
  ui: {
    theme: import.meta.env.VITE_THEME || 'dark',
    animationDuration: Number(import.meta.env.VITE_ANIMATION_DURATION) || 300,
  },
} as const;

export default config;
