# STRATYX

STRATYX is a data-driven assistant coach for esports teams. It uses official GRID APIs to pull real match data and turn it into actionable coaching insights inside a single React dashboard.

## What this app does
- Pulls real series data from GRID Central Data and Series State APIs
- Lets coaches select matches by game (Valorant, LoL; CS2 and Dota2 currently fall back to Valorant series)
- Shows live scoreboards, map breakdowns, and player K/D stats
- Provides a player analysis view with sortable tables and per-map performance
- Generates coaching insights based on verified match stats
- Shows API health checks and settings in-app
- Includes a 3D assistant panel with optional background audio

## Views
- Live Dashboard
- Coach Insights
- Player Analysis

## Data sources
- Central Data GraphQL
- Series State GraphQL
- File Download API (optional, used for event and end-state downloads)

All displayed match stats (kills, deaths, maps, scores) come directly from GRID data. Derived metrics (K/D, win probability, strategy debt) are calculated locally and labeled as analysis.

## Tech stack
- React 18, TypeScript, Vite
- Tailwind CSS
- Apollo Client (GraphQL)
- Recharts
- three.js (3D assistant)

## Getting started
```bash
npm install
cp .env.example .env
```

Add your GRID API key to `.env`:
```env
VITE_GRID_API_KEY=your_key_here
```

Run the app:
```bash
npm run dev
```

App runs at `http://localhost:5173`.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Environment variables
The app reads configuration from Vite environment variables:
```env
VITE_GRID_API_KEY=your_key_here
VITE_GRID_CENTRAL_DATA_URL=https://api-op.grid.gg/central-data/graphql
VITE_GRID_SERIES_STATE_URL=https://api-op.grid.gg/live-data-feed/series-state/graphql
VITE_GRID_FILE_DOWNLOAD_URL=https://api-op.grid.gg/file-download
VITE_APP_NAME=STRATYX
VITE_APP_VERSION=0.1.0
VITE_ENABLE_LIVE_MODE=true
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_COUNTERFACTUAL_SIM=true
VITE_ENABLE_ANALYTICS=false
VITE_ANALYTICS_ENDPOINT=
VITE_DEBT_CRITICAL_THRESHOLD=75
VITE_DEBT_WARNING_THRESHOLD=50
VITE_WINPROB_UPDATE_INTERVAL=5000
VITE_WINPROB_CONFIDENCE_MIN=0.3
VITE_PATTERN_MIN_OCCURRENCES=3
VITE_PATTERN_MIN_CONFIDENCE=0.65
VITE_THEME=dark
VITE_ANIMATION_DURATION=300
```

If you do not set the endpoint variables, the app uses the default hackathon endpoints shown above.

## Security and API keys
- Keep your API key in `.env` only. This file is ignored by git.
- Do not paste keys into source files or commit them to the repository.
- The Settings modal can test a key for the current session, but changes are not persisted. Update `.env` for permanence.

## Project structure
```
src/
  components/          Core UI components
  config/              Environment-based configuration
  contexts/            Global analytics state and caching
  services/            GRID API clients and analytics engines
  views/               Dashboard, insights, and analysis screens
```

## License
See `LICENSE`.
