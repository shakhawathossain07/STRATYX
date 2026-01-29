import { useState } from 'react'
import { Layout } from './components/Layout'
import { CoachDashboard } from './views/CoachDashboard'
import { PlayerAnalysisView } from './views/PlayerAnalysisView'
import { CoachInsightsView } from './views/CoachInsightsView'
import { StratyxProvider } from './contexts/StratyxContext'
import { CoachAnalyticsProvider } from './contexts/CoachAnalyticsContext'

type View = 'dashboard' | 'player-analysis' | 'strategy-debt';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <CoachDashboard onNavigate={setCurrentView} />;
      case 'player-analysis':
        return <PlayerAnalysisView />;
      case 'strategy-debt':
        return <CoachInsightsView onNavigate={setCurrentView} />;
      default:
        return <CoachDashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <StratyxProvider>
      <CoachAnalyticsProvider>
        <Layout currentView={currentView} onViewChange={setCurrentView}>
          {renderView()}
        </Layout>
      </CoachAnalyticsProvider>
    </StratyxProvider>
  )
}

export default App
