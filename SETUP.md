# STRATYX Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 18 or higher
- npm or yarn
- GRID API key

### 2. Installation

```bash
# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Set your GRID API key in `.env`:
```
VITE_GRID_API_KEY=YOUR_GRID_API_KEY
```

**⚠️ IMPORTANT:** The `.env` file is already in `.gitignore` to prevent accidentally committing your API key.

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

## GRID API Authentication

STRATYX uses the official GRID API with proper authentication:

### HTTP Requests (GraphQL)
- Uses `x-api-key` header
- Configured in `src/services/gridApi.ts`

Example:
```javascript
headers: {
  'x-api-key': 'YOUR_API_KEY'
}
```

### WebSocket Connections (Live Events)
- Uses URL parameter `?key=YOUR_API_KEY`
- Configured in `src/services/eventStream.ts`

Example:
```javascript
const url = `wss://api.grid.gg/series-events/v1/${seriesId}?key=${apiKey}`;
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
stratyx/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CausalGraph.tsx
│   │   ├── Layout.tsx
│   │   ├── PhaseAnalyzer.tsx
│   │   ├── PlayerImpactCard.tsx
│   │   ├── StrategyDebtMeter.tsx
│   │   └── WinProbabilityChart.tsx
│   ├── contexts/            # React Context providers
│   │   └── StratyxContext.tsx
│   ├── services/            # Core AI/ML engines
│   │   ├── causalEngine.ts
│   │   ├── eventStream.ts
│   │   ├── featureStore.ts
│   │   ├── gridApi.ts
│   │   ├── patternAnalyzer.ts
│   │   └── winProbability.ts
│   ├── views/               # Main application views
│   │   ├── Dashboard.tsx
│   │   ├── PlayerAnalysis.tsx
│   │   └── StrategyDebtDetail.tsx
│   ├── types/               # TypeScript definitions
│   │   └── grid.ts
│   ├── hooks/               # Custom React hooks
│   │   └── useStratyx.ts
│   ├── config/              # Configuration
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── .env                     # Environment variables (DO NOT COMMIT)
├── .env.example             # Environment template
└── package.json
```

## Features Overview

### 🎯 Core Capabilities

1. **Causal Strategy Graph**
   - Maps micro-level player actions to macro-level outcomes
   - Real-time causal inference
   - Confidence-weighted relationships

2. **Strategy Debt™**
   - Proprietary metric tracking accumulated disadvantage
   - Phase-aware breakdown (early/mid/late game)
   - Critical threshold alerts

3. **Win Probability Model**
   - Bayesian estimation
   - Monte Carlo simulation
   - Factor-based decomposition

4. **Pattern Detection**
   - Recurring mistakes
   - Success sequences
   - Phase-specific vulnerabilities
   - Player-specific patterns

### 📊 Views

1. **Live Dashboard**
   - Real-time match intelligence
   - Win probability tracking
   - Causal graph visualization
   - Strategy debt monitoring
   - Live recommendations

2. **Player Analysis**
   - Individual performance metrics
   - Risk scoring
   - Strength identification
   - Sortable and filterable

3. **Strategy Debt™ Detail**
   - Debt accumulation timeline
   - Top contributors
   - Phase breakdown
   - Priority recommendations

## Configuration Options

Edit `.env` to customize:

```env
# Feature Flags
VITE_ENABLE_LIVE_MODE=true
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_COUNTERFACTUAL_SIM=true

# Strategy Debt Thresholds
VITE_DEBT_CRITICAL_THRESHOLD=75
VITE_DEBT_WARNING_THRESHOLD=50

# Win Probability Settings
VITE_WINPROB_UPDATE_INTERVAL=5000
VITE_WINPROB_CONFIDENCE_MIN=0.3

# Pattern Detection
VITE_PATTERN_MIN_OCCURRENCES=3
VITE_PATTERN_MIN_CONFIDENCE=0.65
```

## Troubleshooting

### API Authentication Errors

If you see `401 Unauthorized`:
1. Check that `.env` file exists and contains `VITE_GRID_API_KEY`
2. Verify the API key is correct
3. Restart the dev server after changing `.env`

### WebSocket Connection Issues

If live events aren't working:
1. Check browser console for WebSocket errors
2. Verify the series ID is valid
3. Enable demo mode to test with simulated events

### Build Errors

If TypeScript errors occur:
```bash
npm run build
```

Check the error messages and ensure all dependencies are installed.

## Development Tips

### Testing with Demo Mode

Set `VITE_ENABLE_DEMO_MODE=true` to enable simulated event stream when GRID API key is unavailable.

### Debugging Causal Engine

The causal engine logs events to console. Open browser DevTools to see:
- Event processing
- Pattern detection
- Win probability updates

### Adding New Features

1. Services go in `src/services/`
2. UI components in `src/components/`
3. Views in `src/views/`
4. Update `StratyxContext.tsx` for global state

## Next Steps

1. ✅ Set your GRID API key in `.env`
2. ✅ Dependencies installed
3. 🎯 Run `npm run dev` to start
4. 🔍 Open browser to http://localhost:5173
5. 🎮 Navigate between views using sidebar
6. 📊 Explore live dashboard, player analysis, and strategy debt

## Support

For GRID API documentation:
- Developer Portal: https://developers.grid.gg
- GraphQL Playground: https://api.grid.gg/playground

For STRATYX issues:
- Check browser console for errors
- Review `.env` configuration
- Verify API key is valid

---

**Built with:**
- React 18
- TypeScript
- Tailwind CSS
- Apollo Client (GraphQL)
- Recharts
- GRID Official APIs
