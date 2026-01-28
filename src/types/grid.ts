/**
 * GRID API Type Definitions
 * 
 * Comprehensive types based on GRID Esports Data Platform API:
 * - Central Data API: Static data (schedules, teams, players, tournaments)
 * - Series State API: Post-series states (winners, kills, player stats)
 * - File Download API: Event-by-event data for detailed analysis
 * 
 * Cloud9 x JetBrains Hackathon
 */

// =====================================================
// SERIES STATE TYPES
// =====================================================

export interface SeriesState {
  id: string;
  sequenceNumber: number;
  game: string;
  state: {
    score: {
      home: number;
      away: number;
    };
    phase: string;
    isPaused: boolean;
  };
}

// =====================================================
// REAL-TIME EVENT TYPES
// =====================================================

export interface GridEvent {
  type: GridEventType;
  data: GridEventData;
  timestamp: string;
  sequenceNumber?: number;
  gameNumber?: number;
  roundNumber?: number;
}

export type GridEventType = 
  // Combat Events
  | 'kill'
  | 'death'
  | 'assist'
  | 'damage'
  | 'headshot'
  | 'wallbang'
  | 'collateral'
  // Round Events
  | 'round_start'
  | 'round_end'
  | 'round_freeze_end'
  | 'round_time_warning'
  // Objective Events  
  | 'bomb_plant'
  | 'bomb_defuse'
  | 'bomb_explode'
  | 'spike_plant'
  | 'spike_defuse'
  // Economy Events
  | 'buy_phase_end'
  | 'economy_update'
  // Game Events
  | 'game_start'
  | 'game_end'
  | 'series_start'
  | 'series_end'
  | 'match_pause'
  | 'match_resume'
  // Player Events
  | 'player_spawn'
  | 'player_death'
  | 'ability_use'
  | 'ultimate_charge'
  // LoL/Dota2 Events
  | 'dragon_kill'
  | 'baron_kill'
  | 'tower_destroy'
  | 'inhibitor_destroy'
  | 'roshan_kill'
  | 'first_blood'
  // Generic
  | 'score_update'
  | 'objective'
  | 'utility'
  | 'economy';

export interface GridEventData {
  // Kill Event Data
  attacker?: string;
  victim?: string;
  weapon?: string;
  isHeadshot?: boolean;
  isWallbang?: boolean;
  damage?: number;
  
  // Round Data
  roundNumber?: number;
  side?: 'attack' | 'defense' | 'ct' | 't';
  winCondition?: 'elimination' | 'objective' | 'time';
  
  // Economy Data
  teamEconomy?: number;
  playerEconomy?: { [playerId: string]: number };
  loadoutValue?: number;
  
  // Player Data
  playerId?: string;
  playerName?: string;
  health?: number;
  armor?: number;
  position?: { x: number; y: number; z?: number };
  
  // Score Data
  score?: { home: number; away: number };
  
  // Ability Data (Valorant)
  ability?: string;
  abilityName?: string;
  
  // Objective Data (LoL/Dota2)
  objectiveType?: string;
  objectiveName?: string;
  goldValue?: number;
  
  // Generic
  outcome?: 'positive' | 'negative' | 'neutral';
  impact?: number;
  
  // Additional context
  [key: string]: unknown;
}

// =====================================================
// CAUSAL ANALYSIS TYPES
// =====================================================

export interface CausalInsight {
  id: string;
  microAction: string;
  macroOutcome: string;
  causalWeight: number;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  confidence?: number;
  evidence?: string[];
  affectedPlayers?: string[];
  expectedImpact?: number;
  timeframe?: 'immediate' | 'short-term' | 'long-term';
}

// =====================================================
// PLAYER PERFORMANCE TYPES
// =====================================================

export interface PlayerStats {
  id: string;
  name: string;
  teamId: string;
  
  // Core Combat Stats
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  kdRatio: number;
  
  // Advanced Combat Stats
  headshots: number;
  headshotPercentage: number;
  damageDealt: number;
  damageTaken: number;
  damagePerRound: number;
  
  // First Engagement Stats
  firstKills: number;
  firstDeaths: number;
  firstKillRate?: number;
  firstDeathRate?: number;
  tradeDifferential: number;
  
  // Clutch Stats
  clutchWins: number;
  clutchAttempts: number;
  clutchWinRate: number;
  
  // Multi-Kill Stats
  multiKills: number;
  aces: number;
  
  // Objective Stats (Valorant)
  plants: number;
  defuses: number;
  
  // Economy Stats
  averageLoadoutValue: number;
  economyRating: number;
  
  // Role & Agent/Champion
  role: string;
  character?: string;
  agent?: string;
  champion?: string;
  hero?: string;
  
  // Computed Metrics
  impactScore: number;
  consistencyScore: number;
  performanceTrend: 'improving' | 'declining' | 'stable';
}

// =====================================================
// TEAM TYPES
// =====================================================

export interface TeamStats {
  id: string;
  name: string;
  logoUrl?: string;
  
  // Series Stats
  seriesScore: number;
  gamesWon: number;
  gamesLost: number;
  
  // Aggregate Combat Stats
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  avgKDA: number;
  
  // Round Stats (FPS Games)
  roundsWon: number;
  roundsLost: number;
  roundWinRate: number;
  attackRoundsWon: number;
  defenseRoundsWon: number;
  attackWinRate: number;
  defenseWinRate: number;
  
  // Economic Stats (FPS Games)
  pistolRoundsWon: number;
  econRoundsWon: number;
  forceRoundsWon: number;
  fullBuyRoundsWon: number;
  ecoRoundWinRate?: number;
  forceRoundWinRate?: number;
  pistolRoundWinRate?: number;
  
  // Team Dynamics
  coordination: number;
  adaptability: number;
  consistency: number;
  
  // Players
  players: PlayerStats[];
}

// =====================================================
// GAME TYPES
// =====================================================

export interface GameStats {
  id: string;
  number: number;
  map?: string;
  
  // Timing
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  durationMinutes?: number;
  
  // Result
  winnerId?: string;
  winnerName?: string;
  finalScore: { home: number; away: number };
  
  // Round-Based Stats (FPS)
  totalRounds?: number;
  overtimeRounds?: number;
  
  // Time-Based Stats (MOBA)
  gameTime?: number;
  firstBloodTime?: number;
  
  // Teams
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  
  // Key Events
  keyMoments: GameMoment[];
}

export interface GameMoment {
  id: string;
  timestamp: string;
  type: 'first_blood' | 'ace' | 'clutch' | 'objective' | 'comeback' | 'throw' | 'team_wipe';
  description: string;
  impactScore: number;
  involvedPlayers: string[];
  roundNumber?: number;
  gameTime?: number;
}

// =====================================================
// COACHING TYPES
// =====================================================

export interface CoachingRecommendation {
  id: string;
  type: 'immediate' | 'tactical' | 'strategic' | 'practice';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'individual' | 'team' | 'economic' | 'positional' | 'communication';
  
  title: string;
  description: string;
  rationale: string;
  
  // Target
  targetPlayers?: string[];
  targetTeam?: string;
  targetPhase?: 'early' | 'mid' | 'late' | 'all';
  
  // Impact Analysis
  expectedImpact: number;
  confidence: number;
  evidence: string[];
  
  // Action Items
  actionItems: string[];
  timeframe: 'now' | 'this_half' | 'next_game' | 'practice';
}

export interface StrategyDebt {
  totalScore: number;
  level: 'healthy' | 'warning' | 'critical';
  trend: 'improving' | 'worsening' | 'stable';
  
  items: StrategyDebtItem[];
  
  breakdown: {
    individual: number;
    team: number;
    tactical: number;
    economic: number;
  };
}

export interface StrategyDebtItem {
  id: string;
  category: 'individual' | 'team' | 'tactical' | 'economic';
  source: string;
  description: string;
  debtScore: number;
  occurrences: number;
  frequency?: number; // Alias for occurrences from processor
  lastOccurrence?: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
  priority: number;
}

// =====================================================
// WIN PROBABILITY TYPES
// =====================================================

export interface WinProbability {
  current: number;
  confidence: number;
  trend: 'improving' | 'declining' | 'stable';
  
  history: WinProbabilityPoint[];
  factors: WinProbabilityFactor[];
  
  projectedOutcome: {
    win: number;
    lose: number;
    overtime?: number;
  };
}

export interface WinProbabilityPoint {
  timestamp: string;
  probability: number;
  roundNumber?: number;
  gameTime?: number;
  event?: string;
}

export interface WinProbabilityFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
  description?: string;
}

// =====================================================
// SERIES/MATCH TYPES
// =====================================================

export interface MatchInfo {
  id: string;
  game: GameTitle;
  tournament: TournamentInfo;
  
  // Schedule
  scheduledTime: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  
  // Teams
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  
  // Format
  format: 'bo1' | 'bo3' | 'bo5' | 'bo7';
  
  // Result (if finished)
  winner?: TeamInfo;
  seriesScore?: { home: number; away: number };
}

export interface TournamentInfo {
  id: string;
  name: string;
  region?: string;
  tier?: 'S' | 'A' | 'B' | 'C';
  startDate?: string;
  endDate?: string;
  logoUrl?: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  region?: string;
}

export type GameTitle = 'VALORANT' | 'League of Legends' | 'Counter-Strike 2' | 'Dota 2' | 'Rainbow Six' | 'Rocket League';

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface APISeriesResponse {
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
  series: SeriesNode[];
}

export interface SeriesNode {
  id: string;
  type: string;
  startTimeScheduled: string;
  title: {
    id: number;
    name: string;
  };
  tournament: {
    id: string;
    name: string;
  };
  teams: Array<{
    baseInfo: {
      id: string;
      name: string;
      logoUrl?: string;
    };
  }>;
  format?: {
    type?: string;
  };
}

// =====================================================
// PROCESSED DATA TYPES (for UI consumption)
// =====================================================

export interface ProcessedMatchData {
  info: MatchInfo;
  
  // Live State
  isLive: boolean;
  currentScore: { home: number; away: number };
  currentGame?: GameStats;
  
  // Analytics
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  games: GameStats[];
  
  // Coaching
  winProbability: WinProbability;
  strategyDebt: StrategyDebt;
  recommendations: CoachingRecommendation[];
  insights: CausalInsight[];
  
  // Metadata
  dataCompleteness: number;
  lastUpdated: string;
}
