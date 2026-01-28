/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRID_API_KEY: string;
  readonly VITE_GRID_CENTRAL_DATA_URL: string;
  readonly VITE_GRID_SERIES_STATE_URL: string;
  readonly VITE_GRID_FILE_DOWNLOAD_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_LIVE_MODE: string;
  readonly VITE_ENABLE_DEMO_MODE: string;
  readonly VITE_ENABLE_COUNTERFACTUAL_SIM: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ANALYTICS_ENDPOINT: string;
  readonly VITE_DEBT_CRITICAL_THRESHOLD: string;
  readonly VITE_DEBT_WARNING_THRESHOLD: string;
  readonly VITE_WINPROB_UPDATE_INTERVAL: string;
  readonly VITE_WINPROB_CONFIDENCE_MIN: string;
  readonly VITE_PATTERN_MIN_OCCURRENCES: string;
  readonly VITE_PATTERN_MIN_CONFIDENCE: string;
  readonly VITE_THEME: string;
  readonly VITE_ANIMATION_DURATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
