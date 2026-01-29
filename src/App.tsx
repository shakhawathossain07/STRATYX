import { useState } from 'react'
import { Layout } from './components/Layout'
import { CoachDashboard } from './views/CoachDashboard'
import { PlayerAnalysisView } from './views/PlayerAnalysisView'
import { CoachInsightsView } from './views/CoachInsightsView'
import { StratyxProvider } from './contexts/StratyxContext'
import { CoachAnalyticsProvider } from './contexts/CoachAnalyticsContext'
import { FloatingAICoach } from './components/FloatingAICoach'

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
        {/* Floating AI Coach - accessible from any view */}
        <FloatingAICoach />
      </CoachAnalyticsProvider>
    </StratyxProvider>
  )
}

export default App
