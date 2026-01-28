import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CausalEngine } from '../services/causalEngine';
import { WinProbabilityModel } from '../services/winProbability';
import { TemporalFeatureStore } from '../services/featureStore';
import { PatternAnalyzer, DetectedPattern } from '../services/patternAnalyzer';
import { GridEventStream } from '../services/eventStream';
import { CausalInsight } from '../types/grid';
import { fetchRecentSeries, GAME_TITLE_IDS, SeriesNode } from '../services/gridApi';

interface StratyxState {
  // Core engines
  causalEngine: CausalEngine;
  winProbModel: WinProbabilityModel;
  featureStore: TemporalFeatureStore;
  patternAnalyzer: PatternAnalyzer;

  // Live data
  seriesId: string | null;
  isLive: boolean;
  insights: CausalInsight[];
  strategyDebt: number;
  phaseDebt: { early: number; mid: number; late: number };
  winProbability: number;
  patterns: DetectedPattern[];

  // Game state
  currentPhase: 'early' | 'mid' | 'late';
  score: { home: number; away: number };
  roundNumber: number;

  // GRID API data
  availableSeries: SeriesNode[];
  currentSeries: SeriesNode | null;
  isLoadingSeries: boolean;
  apiError: string | null;

  // Actions
  connectToSeries: (seriesId: string) => void;
  disconnectFromSeries: () => void;
  reset: () => void;
  loadAvailableSeries: (titleId?: number) => Promise<void>;
  selectSeries: (series: SeriesNode) => void;
}

const StratyxContext = createContext<StratyxState | undefined>(undefined);

export const StratyxProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize engines
  const [causalEngine] = useState(() => new CausalEngine());
  const [winProbModel] = useState(() => new WinProbabilityModel());
  const [featureStore] = useState(() => new TemporalFeatureStore());
  const [patternAnalyzer] = useState(() => new PatternAnalyzer());

  // State
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [insights, setInsights] = useState<CausalInsight[]>([]);
  const [strategyDebt, setStrategyDebt] = useState(0);
  const [phaseDebt, setPhaseDebt] = useState({ early: 0, mid: 0, late: 0 });
  const [winProbability, setWinProbability] = useState(0.5);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'early' | 'mid' | 'late'>('early');
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [roundNumber, setRoundNumber] = useState(0);

  const [eventStream, setEventStream] = useState<GridEventStream | null>(null);

  // GRID API state
  const [availableSeries, setAvailableSeries] = useState<SeriesNode[]>([]);
  const [currentSeries, setCurrentSeries] = useState<SeriesNode | null>(null);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load available series from GRID API
  const loadAvailableSeries = async (titleId: number = GAME_TITLE_IDS.VALORANT) => {
    setIsLoadingSeries(true);
    setApiError(null);
    try {
      console.log(`Fetching series for titleId: ${titleId}...`);
      const result = await fetchRecentSeries(titleId, 50);
      
      if (result.series.length > 0) {
        setAvailableSeries(result.series);
        setApiError(null); // Clear any previous error
        console.log(`✅ Loaded ${result.series.length} series from GRID API (Total: ${result.totalCount})`);
      } else {
        // API returned no data - show error, no demo data
        console.warn('GRID API returned no series data');
        setAvailableSeries([]);
        setApiError('No series data available from GRID API');
      }
    } catch (error) {
      console.error('Failed to load series from GRID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Show the actual error, no demo fallback
      setAvailableSeries([]);
      setApiError(`API Error: ${errorMessage}`);
    } finally {
      setIsLoadingSeries(false);
    }
  };

  // Select a series and connect
  const selectSeries = (series: SeriesNode) => {
    setCurrentSeries(series);
    connectToSeries(series.id);
  };

  // Load series on mount
  useEffect(() => {
    loadAvailableSeries();
  }, []);

  const connectToSeries = (newSeriesId: string) => {
    // Disconnect from existing stream if any
    if (eventStream) {
      eventStream.disconnect();
    }

    // Create new stream
    const stream = new GridEventStream(newSeriesId);
    stream.connect();

    // Handle events
    stream.onEvent((event) => {
      // Process through causal engine
      const insight = causalEngine.processEvent(event);
      if (insight) {
        setInsights(prev => [insight, ...prev].slice(0, 20));
      }

      // Update strategy debt
      setStrategyDebt(causalEngine.getStrategyDebt());
      setPhaseDebt(causalEngine.getPhaseDebt());

      // Update win probability
      setWinProbability(causalEngine.getWinProbability());

      // Store features
      if (event.data?.playerId) {
        featureStore.store(event, {
          playerId: event.data.playerId,
          actionType: event.type,
          phase: currentPhase,
          outcome: event.data.outcome,
          impactScore: event.data.impact || 0
        });
      }

      // Analyze patterns periodically
      if (featureStore.size() % 10 === 0) {
        const features = featureStore.getRecentFeatures(50);
        const detectedPatterns = patternAnalyzer.analyzeFeatures(features);
        setPatterns(detectedPatterns);
      }

      // Update game state
      if (event.type === 'round_start') {
        setRoundNumber(prev => prev + 1);
      }

      if (event.type === 'score_update') {
        setScore(event.data.score);
      }
    });

    setEventStream(stream);
    setSeriesId(newSeriesId);
    setIsLive(true);
  };

  const disconnectFromSeries = () => {
    if (eventStream) {
      eventStream.disconnect();
      setEventStream(null);
    }
    setIsLive(false);
  };

  const reset = () => {
    causalEngine.reset();
    winProbModel.reset();
    featureStore.clear();
    patternAnalyzer.clear();
    setInsights([]);
    setStrategyDebt(0);
    setPhaseDebt({ early: 0, mid: 0, late: 0 });
    setWinProbability(0.5);
    setPatterns([]);
    setCurrentPhase('early');
    setScore({ home: 0, away: 0 });
    setRoundNumber(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventStream) {
        eventStream.disconnect();
      }
    };
  }, [eventStream]);

  const value: StratyxState = {
    causalEngine,
    winProbModel,
    featureStore,
    patternAnalyzer,
    seriesId,
    isLive,
    insights,
    strategyDebt,
    phaseDebt,
    winProbability,
    patterns,
    currentPhase,
    score,
    roundNumber,
    availableSeries,
    currentSeries,
    isLoadingSeries,
    apiError,
    connectToSeries,
    disconnectFromSeries,
    reset,
    loadAvailableSeries,
    selectSeries
  };

  return (
    <StratyxContext.Provider value={value}>
      {children}
    </StratyxContext.Provider>
  );
};

export const useStratyxContext = () => {
  const context = useContext(StratyxContext);
  if (context === undefined) {
    throw new Error('useStratyxContext must be used within a StratyxProvider');
  }
  return context;
};
