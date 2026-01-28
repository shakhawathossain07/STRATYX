/**
 * Coach Analytics Context Provider
 * 
 * Central state management for the AI Coach system that:
 * - Fetches data from GRID APIs
 * - Uses game-specific analytics for accurate insights
 * - Provides coaching insights to components
 * - Manages real-time updates and caching
 * - Supports multiple esports titles (Valorant, LoL, CS2, Dota2)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  fetchLoLSeries,
  fetchValorantSeries,
  fetchSeriesState,
  GRIDSeriesInfo,
  GRIDSeriesState,
} from '../services/gridDataService';
import { createDataProcessor, ProcessedSeries } from '../services/gridDataProcessor';
import { createGameAnalyzer, GameSpecificAnalyzer } from '../services/gameSpecificAnalytics';
import {
  PlayerPerformanceMetrics,
  TeamPerformanceMetrics,
  MicroMistake,
  StrategyDebtItem,
  CoachingInsight,
  analyticsEngine,
} from '../services/scientificAnalytics';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface AnalyzedSeries {
  info: GRIDSeriesInfo;
  state: GRIDSeriesState | null;
  processed: ProcessedSeries | null;
  playerMetrics: PlayerPerformanceMetrics[];
  teamMetrics: { home: TeamPerformanceMetrics; away: TeamPerformanceMetrics } | null;
  mistakes: MicroMistake[];
  strategyDebt: { totalDebt: number; items: StrategyDebtItem[] };
  insights: CoachingInsight[];
  winProbability: { probability: number; confidence: number; factors: Array<{ name: string; contribution: number }> };
  analyzedAt: string;
  dataCompleteness: number;
}

export type GameType = 'valorant' | 'lol' | 'cs2' | 'dota2';

export interface CoachAnalyticsState {
  // Data Sources
  selectedGame: GameType;
  availableSeries: GRIDSeriesInfo[];
  isLoadingSeries: boolean;
  seriesError: string | null;
  
  // Selected Analysis
  selectedSeries: GRIDSeriesInfo | null;
  analyzedSeries: AnalyzedSeries | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  
  // Analytics Cache
  analysisCache: Map<string, AnalyzedSeries>;
  
  // Filter State
  tournamentFilter: string | null;
  dateRangeFilter: { start: string; end: string } | null;
  
  // Actions
  setSelectedGame: (game: GameType) => void;
  loadSeries: () => Promise<void>;
  selectSeries: (series: GRIDSeriesInfo) => void;
  analyzeSeries: (seriesId: string) => Promise<AnalyzedSeries | null>;
  refreshAnalysis: () => Promise<void>;
  setTournamentFilter: (tournament: string | null) => void;
  setDateRangeFilter: (range: { start: string; end: string } | null) => void;
  
  // Computed Values
  filteredSeries: GRIDSeriesInfo[];
  recentInsights: CoachingInsight[];
  
  // Game-specific analyzer
  gameAnalyzer: GameSpecificAnalyzer;
}

const CoachAnalyticsContext = createContext<CoachAnalyticsState | undefined>(undefined);

// Game ID mapping
const GAME_IDS: Record<GameType, number> = {
  valorant: 6,
  lol: 3,
  cs2: 1,
  dota2: 2,
};

// =====================================================
// PROVIDER COMPONENT
// =====================================================

export const CoachAnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [selectedGame, setSelectedGameState] = useState<GameType>('valorant');
  const [availableSeries, setAvailableSeries] = useState<GRIDSeriesInfo[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  
  const [selectedSeries, setSelectedSeries] = useState<GRIDSeriesInfo | null>(null);
  const [analyzedSeries, setAnalyzedSeries] = useState<AnalyzedSeries | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [analysisCache] = useState<Map<string, AnalyzedSeries>>(new Map());
  
  const [tournamentFilter, setTournamentFilter] = useState<string | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string } | null>(null);
  
  // Game-specific analyzer
  const [gameAnalyzer, setGameAnalyzer] = useState(() => createGameAnalyzer(GAME_IDS.valorant));
  
  // Set selected game and update analyzer
  const setSelectedGame = useCallback((game: GameType) => {
    setSelectedGameState(game);
    setGameAnalyzer(createGameAnalyzer(GAME_IDS[game]));
  }, []);
  
  // Load series from GRID API
  const loadSeries = useCallback(async () => {
    setIsLoadingSeries(true);
    setSeriesError(null);
    
    try {
      let series: GRIDSeriesInfo[];
      
      switch (selectedGame) {
        case 'lol':
          series = await fetchLoLSeries(50);
          break;
        case 'valorant':
        default:
          series = await fetchValorantSeries(50);
          break;
        // CS2 and Dota2 would use their respective fetch functions
        // Currently falling back to Valorant until those are implemented
      }
      
      if (series.length === 0) {
        setSeriesError('No series found. The GRID API returned no data for this game.');
      } else {
        console.log(`✅ Loaded ${series.length} real series from GRID API for ${selectedGame.toUpperCase()}`);
      }
      
      setAvailableSeries(series);
    } catch (error) {
      console.error('Error loading series:', error);
      setSeriesError(`Failed to load series: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAvailableSeries([]);
    } finally {
      setIsLoadingSeries(false);
    }
  }, [selectedGame]);
  
  // Analyze a series using the new data processor
  const analyzeSeries = useCallback(async (seriesId: string): Promise<AnalyzedSeries | null> => {
    // Check cache first
    const cached = analysisCache.get(seriesId);
    if (cached) {
      setAnalyzedSeries(cached);
      return cached;
    }
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const seriesInfo = availableSeries.find(s => s.id === seriesId);
      if (!seriesInfo) {
        throw new Error('Series not found');
      }
      
      // Fetch series state from GRID API
      let seriesState: GRIDSeriesState | null = null;
      
      seriesState = await fetchSeriesState(seriesId);
      
      if (!seriesState) {
        throw new Error('Failed to fetch series data from GRID API. The series may not have detailed statistics available.');
      }
      
      console.log('Fetched real series state from GRID API:', seriesState.id);
      
      // Run analytics
      const playerMetrics: PlayerPerformanceMetrics[] = [];
      const allMistakes: MicroMistake[] = [];
      
      // Calculate metrics for each game and player
      for (const game of seriesState.games) {
        const totalRounds = game.teams.reduce((sum, t) => sum + (t.roundsWon || 0), 0) || 20;
        
        for (const team of game.teams) {
          for (const player of team.players) {
            const metrics = analyticsEngine.calculatePlayerMetrics(
              player,
              team,
              game,
              totalRounds
            );
            playerMetrics.push(metrics);
            
            // Detect mistakes
            const mistakes = analyticsEngine.detectMistakes(player, metrics, game.number);
            allMistakes.push(...mistakes);
          }
        }
      }
      
      // Calculate team metrics
      const homeTeam = seriesState.teams[0];
      const awayTeam = seriesState.teams[1];
      
      const homeMetrics = analyticsEngine.calculateTeamMetrics(homeTeam, seriesState.games);
      const awayMetrics = analyticsEngine.calculateTeamMetrics(awayTeam, seriesState.games);
      
      // Calculate strategy debt
      const strategyDebt = analyticsEngine.calculateStrategyDebt(allMistakes, homeMetrics);
      
      // Generate insights (used internally by data processor)
      const homePlayerMetrics = playerMetrics.filter(p => 
        homeTeam.players?.some(hp => hp.id === p.playerId)
      );
      analyticsEngine.generateInsights(
        homePlayerMetrics,
        homeMetrics,
        allMistakes.filter(m => homeTeam.players?.some(p => p.id === m.playerId)),
        strategyDebt
      );
      
      // Calculate win probability
      const currentScore = {
        team: homeTeam.score || 0,
        opponent: awayTeam.score || 0,
      };

      let winningThreshold = 2; // Default BO3
      if (seriesState.format) {
         if (seriesState.format.includes('5')) winningThreshold = 3;
         if (seriesState.format.includes('3')) winningThreshold = 2;
         if (seriesState.format.includes('1')) winningThreshold = 1;
      }

      // Use the new data processor for comprehensive analysis
      const dataProcessor = createDataProcessor(GAME_IDS[selectedGame]);
      const processed = dataProcessor.processSeries(seriesInfo, seriesState);
      
      // Also run original analytics for compatibility (used for merged results)
      analyticsEngine.calculateWinProbability(
        homeMetrics,
        awayMetrics,
        currentScore,
        winningThreshold
      );
      
      // Helper to map category types
      const mapCategory = (cat: string): 'individual' | 'team' | 'tactical' => {
        if (cat === 'economic') return 'tactical';
        return cat as 'individual' | 'team' | 'tactical';
      };
      
      // Merge processed data with legacy analytics
      const analyzed: AnalyzedSeries = {
        info: seriesInfo,
        state: seriesState,
        processed, // New comprehensive processed data
        playerMetrics,
        teamMetrics: { home: homeMetrics, away: awayMetrics },
        mistakes: allMistakes,
        strategyDebt: {
          totalDebt: processed.strategyDebt.totalDebt,
          items: processed.strategyDebt.items.map(item => ({
            id: item.id,
            category: mapCategory(item.category),
            source: item.source,
            description: item.description,
            debtScore: item.debtScore,
            frequency: item.occurrences,
            lastOccurrence: new Date().toISOString(),
            trend: 'stable' as const,
            recommendation: item.recommendation,
          })),
        },
        insights: processed.coachingInsights.map(insight => ({
          id: insight.id,
          type: insight.type,
          priority: insight.priority,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          evidence: insight.evidence,
          affectedPlayers: insight.affectedPlayers,
          recommendedActions: insight.recommendedActions,
          expectedImprovement: insight.expectedImpact,
        })),
        winProbability: {
          probability: processed.winProbability.current,
          confidence: processed.winProbability.confidence,
          factors: processed.winProbability.factors,
        },
        analyzedAt: new Date().toISOString(),
        dataCompleteness: processed.dataCompleteness,
      };
      
      // Cache the result
      analysisCache.set(seriesId, analyzed);
      setAnalyzedSeries(analyzed);
      
      console.log(`✅ Analysis complete for ${seriesInfo.teams[0]?.baseInfo?.name} vs ${seriesInfo.teams[1]?.baseInfo?.name}`);
      console.log(`   Data Completeness: ${(processed.dataCompleteness * 100).toFixed(0)}%`);
      console.log(`   Win Probability: ${(processed.winProbability.current * 100).toFixed(1)}%`);
      console.log(`   Strategy Debt: ${processed.strategyDebt.totalDebt.toFixed(1)} (${processed.strategyDebt.level})`);
      console.log(`   Insights Generated: ${processed.coachingInsights.length}`);
      
      return analyzed;
    } catch (error) {
      console.error('Error analyzing series:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [availableSeries, analysisCache, selectedGame]);
  
  // Select a series and analyze it
  const selectSeries = useCallback((series: GRIDSeriesInfo) => {
    setSelectedSeries(series);
    analyzeSeries(series.id);
  }, [analyzeSeries]);
  
  // Refresh analysis for current series
  const refreshAnalysis = useCallback(async () => {
    if (selectedSeries) {
      // Clear cache for this series
      analysisCache.delete(selectedSeries.id);
      await analyzeSeries(selectedSeries.id);
    }
  }, [selectedSeries, analyzeSeries, analysisCache]);
  
  // Load series on mount and when game changes
  useEffect(() => {
    loadSeries();
  }, [loadSeries]);
  
  // Filter series based on current filters
  const filteredSeries = availableSeries.filter(series => {
    if (tournamentFilter && series.tournament?.name !== tournamentFilter) {
      return false;
    }
    if (dateRangeFilter) {
      const seriesDate = new Date(series.startTimeScheduled);
      const start = new Date(dateRangeFilter.start);
      const end = new Date(dateRangeFilter.end);
      if (seriesDate < start || seriesDate > end) {
        return false;
      }
    }
    return true;
  });
  
  // Get recent insights across all analyzed series
  const recentInsights = Array.from(analysisCache.values())
    .flatMap(a => a.insights)
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 10);
  
  const value: CoachAnalyticsState = {
    selectedGame,
    availableSeries,
    isLoadingSeries,
    seriesError,
    selectedSeries,
    analyzedSeries,
    isAnalyzing,
    analysisError,
    analysisCache,
    tournamentFilter,
    dateRangeFilter,
    setSelectedGame,
    loadSeries,
    selectSeries,
    analyzeSeries,
    refreshAnalysis,
    setTournamentFilter,
    setDateRangeFilter,
    filteredSeries,
    recentInsights,
    gameAnalyzer,
  };
  
  return (
    <CoachAnalyticsContext.Provider value={value}>
      {children}
    </CoachAnalyticsContext.Provider>
  );
};

export const useCoachAnalytics = () => {
  const context = useContext(CoachAnalyticsContext);
  if (context === undefined) {
    throw new Error('useCoachAnalytics must be used within a CoachAnalyticsProvider');
  }
  return context;
};
