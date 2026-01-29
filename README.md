<div align="center">

# 🎮 STRATYX

### **AI-Powered Assistant Coach for Esports Teams**
<img width="959" height="412" alt="x" src="https://github.com/user-attachments/assets/2d29eec0-4da7-4fc3-ac90-5078e91f3713" />

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*Transform real match data into actionable coaching insights with the power of data science and AI*

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation) • [Contributing](#-contributing)

---

</div>

## 📖 Overview

**STRATYX** is a comprehensive data-driven assistant coach designed for esports teams. It leverages official GRID APIs to pull real match data and transforms it into actionable coaching insights—all within a sleek, modern React dashboard.

Whether you're coaching **Valorant**, **League of Legends**, **CS2**, or **Dota 2** teams, STRATYX provides the analytical edge you need to optimize strategies and elevate player performance.

## ✨ Features

### 🔴 Real-Time Match Data
- **Live Series Tracking** — Pull real-time data from GRID Central Data and Series State APIs
- **Multi-Game Support** — Valorant, LoL, CS2, and Dota 2 compatibility
- **Live Scoreboards** — Real-time map breakdowns and player statistics

### 📊 Advanced Analytics
- **Win Probability Engine** — Real-time win probability calculations with confidence intervals
- **Strategy Debt Meter** — Track and visualize strategic inefficiencies
- **Causal Analysis** — Understand cause-and-effect relationships in gameplay
- **Pattern Recognition** — Identify recurring patterns and tendencies

### 🤖 AI-Powered Coaching
- **AI Coach Chat** — Interactive AI assistant for strategic advice
- **Automated Insights** — Generate coaching insights based on verified match stats
- **Player Impact Analysis** — Evaluate individual player contributions

### 🎯 Intuitive Dashboard Views

| View | Description |
|------|-------------|
| **Live Dashboard** | Real-time match monitoring with live stats and scoreboards |
| **Coach Insights** | AI-generated strategic recommendations and analysis |
| **Player Analysis** | Sortable tables, per-map performance, and player metrics |

### 🎨 Modern UI/UX
- **3D Assistant Panel** — Interactive three.js powered assistant with optional audio
- **Dark Theme** — Easy on the eyes during long coaching sessions
- **Responsive Design** — Works seamlessly across devices

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
<br>React 18
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=typescript" width="48" height="48" alt="TypeScript" />
<br>TypeScript
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=vite" width="48" height="48" alt="Vite" />
<br>Vite
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br>Tailwind CSS
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=threejs" width="48" height="48" alt="Three.js" />
<br>Three.js
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=graphql" width="48" height="48" alt="GraphQL" />
<br>Apollo Client
</td>
</tr>
</table>

**Additional Libraries:**
- **Recharts** — Beautiful, composable charting library
- **Apollo Client** — GraphQL state management

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- GRID API Key ([Get one here](https://grid.gg))

### Quick Start

```bash
# Clone the repository
git clone https://github.com/shakhawathossain07/STRATYX.git
cd STRATYX

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Add your GRID API key to `.env`:

```env
VITE_GRID_API_KEY=your_api_key_here
```

Start the development server:

```bash
npm run dev
```

🚀 The app will be running at **http://localhost:5173**

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required
VITE_GRID_API_KEY=your_api_key_here

# API Endpoints (defaults provided)
VITE_GRID_CENTRAL_DATA_URL=https://api-op.grid.gg/central-data/graphql
VITE_GRID_SERIES_STATE_URL=https://api-op.grid.gg/live-data-feed/series-state/graphql
VITE_GRID_FILE_DOWNLOAD_URL=https://api-op.grid.gg/file-download

# App Configuration
VITE_APP_NAME=STRATYX
VITE_APP_VERSION=0.1.0
VITE_THEME=dark

# Feature Flags
VITE_ENABLE_LIVE_MODE=true
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_COUNTERFACTUAL_SIM=true
VITE_ENABLE_ANALYTICS=false

# Analytics Thresholds
VITE_DEBT_CRITICAL_THRESHOLD=75
VITE_DEBT_WARNING_THRESHOLD=50
VITE_WINPROB_UPDATE_INTERVAL=5000
VITE_WINPROB_CONFIDENCE_MIN=0.3
VITE_PATTERN_MIN_OCCURRENCES=3
VITE_PATTERN_MIN_CONFIDENCE=0.65

# UI Settings
VITE_ANIMATION_DURATION=300
```

> **Note:** If endpoint variables are not set, the app uses default GRID hackathon endpoints.

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── AICoachChat.tsx         # AI coaching interface
│   ├── CausalGraph.tsx         # Causal analysis visualization
│   ├── FloatingAICoach.tsx     # Floating AI assistant
│   ├── PlayerImpactCard.tsx    # Player statistics cards
│   ├── StrategyDebtMeter.tsx   # Strategy debt visualization
│   ├── WinProbabilityChart.tsx # Win probability display
│   └── ...
├── config/             # Environment-based configuration
├── contexts/           # React contexts for global state
│   ├── CoachAnalyticsContext.tsx
│   └── StratyxContext.tsx
├── hooks/              # Custom React hooks
├── services/           # API clients & analytics engines
│   ├── aiCoachingEngine.ts     # AI coaching logic
│   ├── causalEngine.ts         # Causal analysis
│   ├── geminiAIService.ts      # AI integration
│   ├── gridApi.ts              # GRID API client
│   ├── winProbability.ts       # Win probability calculations
│   └── ...
├── types/              # TypeScript type definitions
├── utils/              # Helper utilities
└── views/              # Page components
    ├── CoachDashboard.tsx
    ├── CoachInsightsView.tsx
    ├── Dashboard.tsx
    ├── MatchAnalysisView.tsx
    └── PlayerAnalysisView.tsx
```

## 📊 Data Sources

STRATYX integrates with official GRID APIs:

| API | Purpose |
|-----|---------|
| **Central Data GraphQL** | Historical match data and statistics |
| **Series State GraphQL** | Live match state and real-time updates |
| **File Download API** | Event logs and end-state data (optional) |

> **Data Transparency:** All displayed match stats (kills, deaths, maps, scores) come directly from GRID data. Derived metrics (K/D ratios, win probability, strategy debt) are calculated locally and clearly labeled as analysis.

## 🔒 Security

- ✅ Keep your API key in `.env` only — this file is git-ignored
- ✅ Never paste keys into source files or commit them
- ✅ The Settings modal only shows if an API key is configured
- ✅ To change your key, edit `.env` and restart the dev server

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the esports community**

[⬆ Back to Top](#-stratyx)

</div>

