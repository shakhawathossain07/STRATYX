# STRATYX: GRID-Powered Causal AI Assistant Coach for Esports

> **A next-generation AI coaching platform that transforms esports data into causal, actionable strategy intelligence.**

STRATYX uses official GRID APIs to analyze live and historical match data, explaining **why** teams lose or win, not merely **what** happened. It introduces causal reasoning to esports coaching, connecting micro-level player decisions directly to macro-level strategic outcomes.

![Status](https://img.shields.io/badge/status-production%20ready-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![GRID API](https://img.shields.io/badge/GRID%20API-Official-purple)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy env template and add your GRID API key
cp .env.example .env

# Start development server
npm run dev
```

**The application will be available at:** `http://localhost:5173`

📖 **For detailed setup instructions, see [SETUP.md](./SETUP.md)**

---

## 🎯 Core Innovations

### 1. Causal Strategy Graph (CSG)
Unlike traditional analytics that show *what* happened, CSG explains *why*:
- Maps micro-player decisions to macro outcomes
- Estimates causal influence between actions
- Time-aware directed graph per match phase
- Answers: *"Which exact player behavior caused this strategic collapse?"*

### 2. Strategy Debt™ (Original Metric)
Quantifies accumulated strategic disadvantage from repeated suboptimal micro-decisions:
- Tracked per player, phase, and series
- Critical threshold alerts (>75 = macro collapse risk)
- Phase breakdown (early/mid/late game)
- Enables coaches to **prioritize what to fix first**

### 3. Bayesian Win Probability
Real-time win probability estimation with:
- Multi-factor decomposition (economy, man advantage, objectives, debt)
- Confidence scoring
- Monte Carlo simulation for uncertainty quantification
- Counterfactual "what-if" scenarios

### 4. Pattern Detection
AI-powered identification of:
- Recurring mistakes (with occurrence tracking)
- Success sequences
- Phase-specific vulnerabilities
- Player-specific behavioral patterns

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────┐
│           GRID Official APIs            │
│  ┌─────────────────────────────────┐   │
│  │ Central Data Feed (GraphQL)     │   │
│  │ Series State API (GraphQL)      │   │
│  │ Series Events API (WebSocket)   │   │
│  └─────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Event Ingestion    │
        │  & Normalization    │
        └──────────┬──────────┘
                   │
    ┌──────────────▼──────────────┐
    │   Temporal Feature Store    │
    └──────────────┬──────────────┘
                   │
    ┌──────────────▼──────────────────────┐
    │   AI & Data Science Layer           │
    │  ┌────────────────────────────────┐ │
    │  │ Causal Strategy Graph Engine   │ │
    │  │ Win Probability Model          │ │
    │  │ Pattern Analyzer               │ │
    │  │ Counterfactual Simulator       │ │
    │  └────────────────────────────────┘ │
    └──────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   Insights API      │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  React Frontend     │
        │   (STRATYX UI)      │
        └─────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **Data Source** | Official GRID APIs (GraphQL, WebSocket) |
| **State Management** | React Context API |
| **Visualization** | Recharts, Lucide React |
| **AI/ML** | Causal Inference, Bayesian Models, Pattern Detection |
| **Build** | Vite |

---

## 📊 Features

### Live Match Intelligence Dashboard
- Real-time win probability tracking
- Causal graph visualization
- Strategy debt monitoring
- Impact-ranked recommendations
- Macro collapse alerts

### Player Analysis View
- Individual performance metrics
- Risk scoring (0-100)
- Recurring mistake detection
- Strength identification
- Sortable and filterable

### Strategy Debt™ Detail View
- Debt accumulation timeline
- Top contributors breakdown
- Phase-specific analysis
- Priority recommendations
- Counterfactual scenarios

---

## 📁 Project Structure

```
stratyx/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CausalGraph.tsx
│   │   ├── PhaseAnalyzer.tsx
│   │   ├── PlayerImpactCard.tsx
│   │   ├── StrategyDebtMeter.tsx
│   │   └── WinProbabilityChart.tsx
│   ├── services/            # Core AI/ML engines
│   │   ├── causalEngine.ts       # Causal reasoning
│   │   ├── featureStore.ts       # Temporal data storage
│   │   ├── patternAnalyzer.ts    # Pattern detection
│   │   ├── winProbability.ts     # Bayesian model
│   │   ├── eventStream.ts        # WebSocket handler
│   │   └── gridApi.ts            # GRID API client
│   ├── views/               # Main application views
│   │   ├── Dashboard.tsx
│   │   ├── PlayerAnalysis.tsx
│   │   └── StrategyDebtDetail.tsx
│   ├── contexts/            # React Context
│   │   └── StratyxContext.tsx
│   └── config/              # Configuration
│       └── index.ts
├── .env                     # Environment variables (local, do not commit)
├── .env.example             # Template
└── SETUP.md                 # Detailed setup guide
```

---

## 🔑 GRID API Integration

### Authentication
- **HTTP (GraphQL):** Uses `x-api-key` header
- **WebSocket (Live Events):** Uses URL parameter `?key=YOUR_KEY`
- Set your API key in `.env`

### Endpoints Used
```typescript
// Central Data Feed
https://api.grid.gg/central-data/graphql

// Series State
https://api.grid.gg/series-state/graphql

// Live Events (WebSocket)
wss://api.grid.gg/series-events/v1/{seriesId}?key={apiKey}
```

---

## 🎮 Available Views

| View | Route | Description |
|------|-------|-------------|
| Live Dashboard | `/` | Real-time match intelligence |
| Strategy Debt™ | `/strategy-debt` | Deep dive into debt metrics |
| Player Analysis | `/player-analysis` | Individual player breakdowns |
| Causal Engine | `/causal-engine` | Interactive graph exploration |

Navigation is handled via sidebar.

---

## ⚙️ Configuration

All settings in `.env`:

```env
# GRID API
VITE_GRID_API_KEY=YOUR_GRID_API_KEY

# Feature Flags
VITE_ENABLE_LIVE_MODE=true
VITE_ENABLE_DEMO_MODE=true

# Thresholds
VITE_DEBT_CRITICAL_THRESHOLD=75
VITE_PATTERN_MIN_OCCURRENCES=3
```

---

## 🧪 Development

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run build

# Linting
npm run lint

# Production build
npm run build && npm run preview
```

---

## 🌟 Competitive Advantage

STRATYX stands apart globally because it:

1. ✅ Uses **official GRID live data** (real-time esports events)
2. ✅ Introduces **causal intelligence** to esports (not just correlation)
3. ✅ Produces **prioritized, coach-ready insights** (impact-ranked)
4. ✅ Supports **live strategic intervention** (mid-match recommendations)
5. ✅ Is both **research-grade and commercially viable**

This combination is rare even in traditional sports analytics.

---

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed installation and configuration
- [GRID API Docs](https://developers.grid.gg) - Official GRID documentation
- [Architecture Design](./ARCHITECTURE.md) - System design (TODO)

---

## 🚧 Roadmap

- [ ] Multi-series comparison
- [ ] Historical trend analysis
- [ ] Coach annotation system
- [ ] Export reports (PDF/JSON)
- [ ] Team collaboration features
- [ ] Mobile-responsive design
- [ ] Advanced counterfactual simulations

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 🙏 Acknowledgments

Built with official **GRID APIs** for esports data.

GRID provides live and historical data for CS:GO, Dota 2, League of Legends, and more.

---

**STRATYX** - *Transforming esports data into strategic intelligence.*
