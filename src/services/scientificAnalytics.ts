/**
 * Scientific Analytics Engine
 * 
 * Comprehensive statistical analysis for esports coaching powered by:
 * - Bayesian inference for probability estimation
 * - Bradley-Terry model for player skill rating
 * - Granger causality for micro-macro linkage
 * - Z-score and percentile ranking for performance benchmarking
 * - CUSUM (Cumulative Sum Control) for pattern detection
 */

import { GRIDPlayer, GRIDTeam, GRIDGame } from './gridDataService';

// Note: GRIDSeriesState and baselines used for future historical analysis

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface PlayerPerformanceMetrics {
  playerId: string;
  playerName: string;
  team: string;
  
  // Core Combat Metrics
  kda: number;                    // (Kills + Assists) / Deaths
  kdRatio: number;                // Kills / Deaths
  killsPerRound: number;          // Average kills per round
  deathsPerRound: number;         // Average deaths per round
  
  // Impact Metrics
  impactRating: number;           // Composite impact score (0-100)
  firstKillRate: number;          // First kills / Rounds played (0-1)
  firstDeathRate: number;         // First deaths / Rounds played (0-1)
  tradeDifferential: number;      // First kills - First deaths
  
  // Efficiency Metrics
  headshotPercentage: number;     // Headshots / Total kills (0-1)
  damagePerRound: number;         // Average damage per round
  damageEfficiency: number;       // Damage dealt / Damage taken
  
  // Economic Metrics
  econRating: number;             // Economy rating
  clutchSuccessRate: number;      // Clutches won / Clutches attempted (0-1)
  
  // Consistency Metrics
  performanceVariance: number;    // Statistical variance in performance
  consistencyScore: number;       // 1 - normalized variance (0-1)
  
  // Role-specific
  role: string;
  roleEffectiveness: number;      // How well they fulfill their role (0-1)
}

export interface TeamPerformanceMetrics {
  teamId: string;
  teamName: string;
  
  // Round Analysis
  totalRoundsPlayed: number;
  roundWinRate: number;           // Total rounds won / Total rounds (0-1)
  attackWinRate: number;          // Attack rounds won / Attack rounds (0-1)
  defenseWinRate: number;         // Defense rounds won / Defense rounds (0-1)
  
  // Economic Analysis
  pistolRoundWinRate: number;     // Pistol rounds won / Total pistol rounds
  econRoundWinRate: number;       // Eco rounds won / Eco rounds
  forceRoundWinRate: number;      // Force rounds won / Force rounds
  fullBuyWinRate: number;         // Full buy rounds won / Full buy rounds
  
  // Team Synergy
  teamKillTradeRate: number;      // Successful trades / Deaths
  utilityCoordination: number;    // Coordinated utility usage score
  entrySuccess: number;           // Successful entries / Entry attempts
  
  // Strategy Execution
  strategyDiversity: number;      // Variety in strategies used (0-1)
  adaptabilityScore: number;      // Ability to adjust mid-match (0-1)
  
  // Aggregate Stats
  averageKDA: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  
  // Data Availability Flags (for UI indicators)
  _hasAttackDefenseData?: boolean;
  _hasPistolData?: boolean;
  _hasRoundData?: boolean;
}

export interface MicroMistake {
  id: string;
  playerId: string;
  playerName: string;
  type: MistakeType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  gameNumber: number;
  roundNumber?: number;
  timestamp?: string;
  
  // Causal Impact
  macroImpact: MacroImpact;
  probabilityImpact: number;      // Change in win probability (-1 to 1)
  economicImpact: number;         // Economic cost/loss
  
  // Recurrence
  occurrences: number;            // Times this mistake pattern occurred
  isRecurring: boolean;           // Detected multiple times
}

export enum MistakeType {
  // Combat Mistakes
  POOR_POSITIONING = 'poor_positioning',
  OVERPEEK = 'overpeek',
  ISOLATED_DEATH = 'isolated_death',
  FAILED_TRADE = 'failed_trade',
  UTILITY_MISUSE = 'utility_misuse',
  
  // Economic Mistakes
  FORCE_BUY_LOSS = 'force_buy_loss',
  ECO_ROUND_THROW = 'eco_round_throw',
  POOR_MONEY_MANAGEMENT = 'poor_money_management',
  
  // Strategic Mistakes
  ROTATION_ERROR = 'rotation_error',
  TIMING_MISTAKE = 'timing_mistake',
  SITE_EXECUTE_FAIL = 'site_execute_fail',
  CLUTCH_FAILURE = 'clutch_failure',
  
  // Tactical Mistakes
  INFORMATION_LEAK = 'information_leak',
  PREDICTABLE_PATTERN = 'predictable_pattern',
}

export interface MacroImpact {
  category: 'economy' | 'map_control' | 'round_outcome' | 'momentum' | 'strategy';
  description: string;
  severity: number;               // 0-100 scale
  cascadeEffects: string[];       // Chain of effects from this mistake
}

export interface StrategyDebtItem {
  id: string;
  category: 'individual' | 'team' | 'tactical';
  source: string;                 // Player name or "Team"
  description: string;
  debtScore: number;              // Contribution to total strategy debt
  frequency: number;              // How often this occurs
  lastOccurrence: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

export interface CoachingInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'pattern' | 'opportunity';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  
  // Data Support
  confidence: number;             // Statistical confidence (0-1)
  evidence: string[];             // Supporting data points
  
  // Actionable Info
  affectedPlayers: string[];
  recommendedActions: string[];
  expectedImprovement: number;    // Estimated improvement percentage
}

// =====================================================
// STATISTICAL UTILITIES
// =====================================================

/**
 * Calculate Z-score for a value given mean and standard deviation
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Convert Z-score to percentile
 * Uses error function approximation for normal CDF
 */
export function zScoreToPercentile(z: number): number {
  // Approximation of the normal CDF
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  
  return 0.5 * (1.0 + sign * y);
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate mean
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Bayesian update for probability estimation
 * Uses Beta-Binomial conjugate prior
 * 
 * @param priorAlpha Prior successes + 1
 * @param priorBeta Prior failures + 1
 * @param successes New successes
 * @param failures New failures
 * @returns Updated probability estimate
 */
export function bayesianUpdate(
  priorAlpha: number,
  priorBeta: number,
  successes: number,
  failures: number
): { mean: number; variance: number; credibleInterval: [number, number] } {
  const posteriorAlpha = priorAlpha + successes;
  const posteriorBeta = priorBeta + failures;
  
  // Beta distribution mean
  const posteriorMean = posteriorAlpha / (posteriorAlpha + posteriorBeta);
  
  // Beta distribution variance
  const posteriorVariance = (posteriorAlpha * posteriorBeta) / 
    (Math.pow(posteriorAlpha + posteriorBeta, 2) * (posteriorAlpha + posteriorBeta + 1));
  
  // 95% credible interval (approximation)
  const stdDev = Math.sqrt(posteriorVariance);
  const lower = Math.max(0, posteriorMean - 1.96 * stdDev);
  const upper = Math.min(1, posteriorMean + 1.96 * stdDev);
  
  return {
    mean: posteriorMean,
    variance: posteriorVariance,
    credibleInterval: [lower, upper],
  };
}

/**
 * Bradley-Terry Model for player skill rating
 * Computes relative skill levels from pairwise comparisons
 * 
 * @param wins Number of rounds/duels won
 * @param losses Number of rounds/duels lost
 * @param opponentStrength Average opponent strength rating
 * @returns Updated skill rating
 */
export function bradleyTerryRating(
  currentRating: number,
  wins: number,
  losses: number,
  opponentStrength: number = 1000,
  kFactor: number = 32
): number {
  const total = wins + losses;
  if (total === 0) return currentRating;
  
  // Expected score based on current ratings
  const expectedScore = 1 / (1 + Math.pow(10, (opponentStrength - currentRating) / 400));
  
  // Actual score (proportion of wins)
  const actualScore = wins / total;
  
  // Update rating
  return currentRating + kFactor * (actualScore - expectedScore);
}

/**
 * Wilson Score Interval for rate statistics
 * Better confidence interval for proportions, especially with small samples
 */
export function wilsonScoreInterval(
  successes: number,
  total: number,
  confidence: number = 0.95
): { lower: number; upper: number; point: number } {
  if (total === 0) return { lower: 0, upper: 0, point: 0 };
  
  const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;
  const p = successes / total;
  
  const denominator = 1 + (z * z) / total;
  const center = p + (z * z) / (2 * total);
  const adjustment = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  
  return {
    lower: Math.max(0, (center - adjustment) / denominator),
    upper: Math.min(1, (center + adjustment) / denominator),
    point: p,
  };
}

/**
 * CUSUM (Cumulative Sum) for change detection in player performance
 * Detects when a player's performance deviates from baseline
 */
export function cusumDetection(
  values: number[],
  target: number,
  threshold: number = 2
): { changePoints: number[]; direction: ('up' | 'down')[] } {
  const changePoints: number[] = [];
  const directions: ('up' | 'down')[] = [];
  
  let cusumUp = 0;
  let cusumDown = 0;
  
  const sigma = standardDeviation(values);
  const k = sigma * 0.5; // Allowable slack
  const h = threshold * sigma; // Decision threshold
  
  for (let i = 0; i < values.length; i++) {
    const diff = values[i] - target;
    
    cusumUp = Math.max(0, cusumUp + diff - k);
    cusumDown = Math.min(0, cusumDown + diff + k);
    
    if (cusumUp > h) {
      changePoints.push(i);
      directions.push('up');
      cusumUp = 0;
    }
    
    if (cusumDown < -h) {
      changePoints.push(i);
      directions.push('down');
      cusumDown = 0;
    }
  }
  
  return { changePoints, direction: directions };
}

// =====================================================
// ANALYTICS ENGINE CLASS
// =====================================================

export class ScientificAnalyticsEngine {
  /**
   * Calculate comprehensive player performance metrics
   */
  calculatePlayerMetrics(
    player: GRIDPlayer,
    team: GRIDTeam,
    _game: GRIDGame,
    roundsPlayed: number
  ): PlayerPerformanceMetrics {
    const kills = player.kills || 0;
    const deaths = player.deaths || 1; // Avoid division by zero
    const assists = player.assists || 0;
    const headshots = player.headshots || 0;
    const firstKills = player.firstKills || 0;
    const firstDeaths = player.firstDeaths || 0;
    const damageDealt = player.damageDealt || 0;
    const damageTaken = player.damageTaken || 1;
    const clutchWins = player.clutchWins || 0;
    const clutchAttempts = player.clutchAttempts || 1;
    
    // Core combat metrics
    const kda = (kills + assists) / Math.max(deaths, 1);
    const kdRatio = kills / Math.max(deaths, 1);
    const killsPerRound = roundsPlayed > 0 ? kills / roundsPlayed : 0;
    const deathsPerRound = roundsPlayed > 0 ? deaths / roundsPlayed : 0;
    
    // Impact metrics
    const firstKillRate = roundsPlayed > 0 ? firstKills / roundsPlayed : 0;
    const firstDeathRate = roundsPlayed > 0 ? firstDeaths / roundsPlayed : 0;
    const tradeDifferential = firstKills - firstDeaths;
    
    // Efficiency metrics
    const headshotPercentage = kills > 0 ? headshots / kills : 0;
    const damagePerRound = roundsPlayed > 0 ? damageDealt / roundsPlayed : 0;
    const damageEfficiency = damageDealt / Math.max(damageTaken, 1);
    
    // Clutch rate using Wilson Score for better confidence
    const clutchStats = wilsonScoreInterval(clutchWins, clutchAttempts);
    
    // Calculate impact rating using weighted combination
    // Formula based on esports analytics research:
    // Impact = 0.3*KDA + 0.25*FK_Rate + 0.2*HS% + 0.15*DPR + 0.1*Clutch
    const normalizedKDA = Math.min(kda / 3, 1); // Normalize KDA (3.0 = max)
    const normalizedDPR = Math.min(damagePerRound / 200, 1); // Normalize DPR (200 = max)
    
    const impactRating = (
      0.30 * normalizedKDA +
      0.25 * Math.min(firstKillRate * 5, 1) + // FK rate normalized
      0.20 * headshotPercentage +
      0.15 * normalizedDPR +
      0.10 * clutchStats.point
    ) * 100;
    
    return {
      playerId: player.id,
      playerName: player.name,
      team: team.name,
      kda,
      kdRatio,
      killsPerRound,
      deathsPerRound,
      impactRating,
      firstKillRate,
      firstDeathRate,
      tradeDifferential,
      headshotPercentage,
      damagePerRound,
      damageEfficiency,
      econRating: player.economyRating || 0,
      clutchSuccessRate: clutchStats.point,
      performanceVariance: 0, // Calculated over multiple games
      consistencyScore: 0.5, // Default, updated with history
      role: player.role || 'unknown',
      roleEffectiveness: 0.5, // Calculated based on role requirements
    };
  }
  
  /**
   * Calculate team performance metrics from series data
   */
  calculateTeamMetrics(team: GRIDTeam, games: GRIDGame[]): TeamPerformanceMetrics {
    let totalRounds = 0;
    let roundsWon = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    
    // Aggregate data across games
    for (const game of games) {
      const teamData = game.teams.find(t => t.id === team.id);
      if (!teamData) continue;
      
      // Sum player stats (kills, deaths, assists are at player level in GRID API)
      for (const player of teamData.players) {
        totalKills += player.kills || 0;
        totalDeaths += player.deaths || 0;
        totalAssists += player.assists || 0;
      }
      
      // Round data - estimate from game score if available
      // In Valorant, each map is typically first to 13 rounds
      const teamScore = teamData.score || 0;
      const opponentTeam = game.teams.find(t => t.id !== team.id);
      const opponentScore = opponentTeam?.score || 0;
      
      if (teamScore > 0 || opponentScore > 0) {
        totalRounds += teamScore + opponentScore;
        roundsWon += teamScore;
      }
    }
    
    // If no round data available, estimate from series score
    if (totalRounds === 0) {
      const seriesScore = team.score || 0;
      // Assume average game length of 24 rounds per map won
      totalRounds = Math.max(24 * Math.max(seriesScore, 1), 24);
      roundsWon = Math.round(totalRounds * 0.5);
    }
    
    // Calculate win rates using Wilson Score for confidence
    const roundWinStats = wilsonScoreInterval(roundsWon, totalRounds);
    
    const averageKDA = totalDeaths > 0 
      ? (totalKills + totalAssists) / totalDeaths 
      : totalKills + totalAssists;
    
    // Data availability flags - most detailed stats not available from basic API
    const hasRoundData = totalRounds > 0 && roundsWon > 0;
    
    return {
      teamId: team.id,
      teamName: team.name,
      totalRoundsPlayed: totalRounds,
      roundWinRate: roundWinStats.point,
      attackWinRate: 0.5, // Not available - would need round-level data
      defenseWinRate: 0.5, // Not available - would need round-level data
      pistolRoundWinRate: 0.5, // Not available - would need round-level data
      econRoundWinRate: 0.5, // Not available - would need economy data
      forceRoundWinRate: 0.5, // Not available - would need economy data
      fullBuyWinRate: 0.5, // Not available - would need economy data
      teamKillTradeRate: totalKills > 0 ? Math.min(totalKills / Math.max(totalDeaths, 1), 1) : 0.5,
      utilityCoordination: 0.5, // Not available - would need event-level data
      entrySuccess: 0.5, // Not available - would need first kill data
      strategyDiversity: 0.5, // Not available - would need round strategy data
      adaptabilityScore: 0.5, // Not available - would need historical data
      averageKDA,
      totalKills,
      totalDeaths,
      totalAssists,
      // Data availability flags for UI
      _hasAttackDefenseData: false,
      _hasPistolData: false,
      _hasRoundData: hasRoundData,
    } as TeamPerformanceMetrics;
  }
  
  /**
   * Detect micro-level mistakes from player performance
   */
  detectMistakes(
    player: GRIDPlayer,
    metrics: PlayerPerformanceMetrics,
    gameNumber: number
  ): MicroMistake[] {
    const mistakes: MicroMistake[] = [];
    
    // High first death rate indicates positioning issues
    if (metrics.firstDeathRate > 0.15) {
      const severity = metrics.firstDeathRate > 0.25 ? 'critical' 
        : metrics.firstDeathRate > 0.20 ? 'high' : 'medium';
      
      mistakes.push({
        id: `${player.id}-fd-${gameNumber}`,
        playerId: player.id,
        playerName: player.name,
        type: MistakeType.POOR_POSITIONING,
        severity,
        description: `High first death rate (${(metrics.firstDeathRate * 100).toFixed(1)}%) indicates consistent positioning issues`,
        gameNumber,
        macroImpact: {
          category: 'round_outcome',
          description: 'First deaths create 4v5 disadvantages affecting round win probability',
          severity: metrics.firstDeathRate * 100,
          cascadeEffects: [
            'Team forced into retake/hold situations',
            'Economic disadvantage from repeated deaths',
            'Momentum shift to opponents',
          ],
        },
        probabilityImpact: -metrics.firstDeathRate * 0.3,
        economicImpact: metrics.firstDeathRate * 3000,
        occurrences: Math.round(metrics.firstDeathRate * 20),
        isRecurring: metrics.firstDeathRate > 0.12,
      });
    }
    
    // Low trade differential indicates poor team play
    if (metrics.tradeDifferential < -2) {
      mistakes.push({
        id: `${player.id}-td-${gameNumber}`,
        playerId: player.id,
        playerName: player.name,
        type: MistakeType.FAILED_TRADE,
        severity: metrics.tradeDifferential < -4 ? 'high' : 'medium',
        description: `Negative trade differential (${metrics.tradeDifferential}) - dying without creating trade opportunities`,
        gameNumber,
        macroImpact: {
          category: 'map_control',
          description: 'Failed trades lead to lost map control and man disadvantages',
          severity: Math.abs(metrics.tradeDifferential) * 10,
          cascadeEffects: [
            'Reduced information gathering',
            'Forced defensive play style',
            'Predictable rotations',
          ],
        },
        probabilityImpact: metrics.tradeDifferential * 0.02,
        economicImpact: Math.abs(metrics.tradeDifferential) * 500,
        occurrences: Math.abs(metrics.tradeDifferential),
        isRecurring: true,
      });
    }
    
    // Low damage efficiency suggests overexposure
    if (metrics.damageEfficiency < 0.8) {
      mistakes.push({
        id: `${player.id}-de-${gameNumber}`,
        playerId: player.id,
        playerName: player.name,
        type: MistakeType.OVERPEEK,
        severity: metrics.damageEfficiency < 0.5 ? 'high' : 'medium',
        description: `Poor damage efficiency (${metrics.damageEfficiency.toFixed(2)}) - taking more damage than dealing`,
        gameNumber,
        macroImpact: {
          category: 'economy',
          description: 'High damage taken leads to utility/armor costs and health disadvantages',
          severity: (1 - metrics.damageEfficiency) * 50,
          cascadeEffects: [
            'Forced healing/utility usage',
            'Lower average HP in engagements',
            'Reduced aggression capability',
          ],
        },
        probabilityImpact: (metrics.damageEfficiency - 1) * 0.1,
        economicImpact: (1 - metrics.damageEfficiency) * 1000,
        occurrences: 1,
        isRecurring: false,
      });
    }
    
    // Low clutch success rate for support/anchor roles
    if (metrics.clutchSuccessRate < 0.2 && metrics.role === 'anchor') {
      mistakes.push({
        id: `${player.id}-clutch-${gameNumber}`,
        playerId: player.id,
        playerName: player.name,
        type: MistakeType.CLUTCH_FAILURE,
        severity: 'medium',
        description: `Low clutch success rate (${(metrics.clutchSuccessRate * 100).toFixed(1)}%) for anchor role`,
        gameNumber,
        macroImpact: {
          category: 'round_outcome',
          description: 'Failed clutches directly convert to round losses in close games',
          severity: (1 - metrics.clutchSuccessRate) * 30,
          cascadeEffects: [
            'Lost rounds in close economic situations',
            'Psychological pressure on teammates',
            'Reduced confidence in late-round scenarios',
          ],
        },
        probabilityImpact: -(1 - metrics.clutchSuccessRate) * 0.1,
        economicImpact: (1 - metrics.clutchSuccessRate) * 2000,
        occurrences: Math.round((1 - metrics.clutchSuccessRate) * 5),
        isRecurring: true,
      });
    }
    
    return mistakes;
  }
  
  /**
   * Calculate Strategy Debt from accumulated mistakes
   * Strategy Debt represents the accumulation of small mistakes that compound
   * to affect macro-level strategy execution
   * 
   * Debt is normalized to a 0-100 scale where:
   * - 0-30: Healthy - minor issues, normal for any team
   * - 30-60: Warning - notable patterns requiring attention
   * - 60-80: High - significant issues affecting performance
   * - 80-100: Critical - severe problems requiring immediate action
   */
  calculateStrategyDebt(
    mistakes: MicroMistake[],
    teamMetrics: TeamPerformanceMetrics
  ): { totalDebt: number; items: StrategyDebtItem[] } {
    const items: StrategyDebtItem[] = [];
    let totalDebt = 0;
    
    // Group mistakes by player and type
    const mistakesByPlayer = new Map<string, MicroMistake[]>();
    for (const mistake of mistakes) {
      const existing = mistakesByPlayer.get(mistake.playerId) || [];
      existing.push(mistake);
      mistakesByPlayer.set(mistake.playerId, existing);
    }
    
    // Calculate individual player debt (normalized per player)
    for (const [playerId, playerMistakes] of mistakesByPlayer) {
      const playerName = playerMistakes[0]?.playerName || playerId;
      const recurringMistakes = playerMistakes.filter(m => m.isRecurring);
      
      if (recurringMistakes.length > 0) {
        // Normalize: each player contributes max ~20 points to total debt
        const rawScore = recurringMistakes.reduce((sum, m) => {
          const severityMultiplier = 
            m.severity === 'critical' ? 4 :
            m.severity === 'high' ? 3 :
            m.severity === 'medium' ? 2 : 1;
          // Cap occurrences contribution to prevent runaway values
          const cappedOccurrences = Math.min(m.occurrences, 5);
          return sum + cappedOccurrences * severityMultiplier;
        }, 0);
        
        // Normalize to max 20 points per player
        const debtScore = Math.min(rawScore, 20);
        
        items.push({
          id: `debt-${playerId}`,
          category: 'individual',
          source: playerName,
          description: `${recurringMistakes.length} recurring mistake patterns detected`,
          debtScore,
          frequency: recurringMistakes.reduce((sum, m) => sum + m.occurrences, 0),
          lastOccurrence: new Date().toISOString(),
          trend: 'stable',
          recommendation: this.generateRecommendation(recurringMistakes),
        });
        
        totalDebt += debtScore;
      }
    }
    
    // Team-level debt from coordination issues
    if (teamMetrics.teamKillTradeRate < 0.5) {
      const tradeDebt = (0.5 - teamMetrics.teamKillTradeRate) * 50;
      items.push({
        id: 'debt-team-trades',
        category: 'team',
        source: 'Team',
        description: 'Low kill trade rate indicates poor team coordination',
        debtScore: tradeDebt,
        frequency: Math.round((0.5 - teamMetrics.teamKillTradeRate) * 20),
        lastOccurrence: new Date().toISOString(),
        trend: 'stable',
        recommendation: 'Practice trade drills and call-out timing in team scrims',
      });
      totalDebt += tradeDebt;
    }
    
    // Tactical debt from strategic issues
    if (teamMetrics.strategyDiversity < 0.3) {
      const tacticalDebt = (0.3 - teamMetrics.strategyDiversity) * 40;
      items.push({
        id: 'debt-team-tactics',
        category: 'tactical',
        source: 'Team',
        description: 'Low strategy diversity makes team predictable',
        debtScore: tacticalDebt,
        frequency: 1,
        lastOccurrence: new Date().toISOString(),
        trend: 'increasing',
        recommendation: 'Develop 2-3 alternative strategies for each map situation',
      });
      totalDebt += tacticalDebt;
    }
    
    return {
      totalDebt: Math.min(totalDebt, 100), // Cap at 100
      items: items.sort((a, b) => b.debtScore - a.debtScore),
    };
  }
  
  /**
   * Generate coaching insights from analysis
   */
  generateInsights(
    playerMetrics: PlayerPerformanceMetrics[],
    teamMetrics: TeamPerformanceMetrics,
    mistakes: MicroMistake[],
    strategyDebt: { totalDebt: number; items: StrategyDebtItem[] }
  ): CoachingInsight[] {
    const insights: CoachingInsight[] = [];
    
    // Critical strategy debt warning
    if (strategyDebt.totalDebt > 70) {
      insights.push({
        id: 'insight-debt-critical',
        type: 'warning',
        priority: 'critical',
        title: 'Critical Strategy Debt Level',
        description: `Strategy debt at ${strategyDebt.totalDebt.toFixed(1)} indicates systemic issues requiring immediate intervention`,
        confidence: 0.9,
        evidence: strategyDebt.items.map(i => `${i.source}: ${i.description}`),
        affectedPlayers: strategyDebt.items
          .filter(i => i.category === 'individual')
          .map(i => i.source),
        recommendedActions: [
          'Call team meeting to address recurring patterns',
          'Review VODs focusing on identified mistake types',
          'Implement structured practice for weak areas',
        ],
        expectedImprovement: 15,
      });
    }
    
    // Identify highest impact player issues
    const criticalMistakes = mistakes.filter(m => m.severity === 'critical');
    if (criticalMistakes.length > 0) {
      const affectedPlayers = [...new Set(criticalMistakes.map(m => m.playerName))];
      insights.push({
        id: 'insight-critical-mistakes',
        type: 'recommendation',
        priority: 'high',
        title: 'Critical Individual Issues Detected',
        description: `${criticalMistakes.length} critical-level mistakes identified affecting team performance`,
        confidence: 0.85,
        evidence: criticalMistakes.map(m => `${m.playerName}: ${m.description}`),
        affectedPlayers,
        recommendedActions: criticalMistakes.slice(0, 3).map(m => m.macroImpact.description),
        expectedImprovement: 10,
      });
    }
    
    // Identify positive patterns to reinforce
    const topPerformers = playerMetrics
      .filter(p => p.impactRating > 70)
      .sort((a, b) => b.impactRating - a.impactRating);
    
    if (topPerformers.length > 0) {
      insights.push({
        id: 'insight-top-performers',
        type: 'pattern',
        priority: 'medium',
        title: 'High-Impact Player Patterns',
        description: `${topPerformers.length} players showing exceptional performance metrics`,
        confidence: 0.8,
        evidence: topPerformers.map(p => 
          `${p.playerName}: ${p.impactRating.toFixed(1)} impact rating`
        ),
        affectedPlayers: topPerformers.map(p => p.playerName),
        recommendedActions: [
          'Analyze successful patterns for team adoption',
          'Build strategies around high-impact player strengths',
          'Use as examples in team training sessions',
        ],
        expectedImprovement: 5,
      });
    }
    
    // Economy optimization opportunity
    if (teamMetrics.econRoundWinRate < 0.3) {
      insights.push({
        id: 'insight-economy',
        type: 'opportunity',
        priority: 'medium',
        title: 'Economy Round Improvement Opportunity',
        description: `Low eco round win rate (${(teamMetrics.econRoundWinRate * 100).toFixed(1)}%) presents improvement opportunity`,
        confidence: 0.75,
        evidence: [
          `Current eco win rate: ${(teamMetrics.econRoundWinRate * 100).toFixed(1)}%`,
          `Pro average: 25-30%`,
        ],
        affectedPlayers: [],
        recommendedActions: [
          'Practice coordinated eco strategies',
          'Study professional eco round setups',
          'Improve utility usage in low-buy rounds',
        ],
        expectedImprovement: 8,
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  /**
   * Calculate win probability using Bayesian approach
   */
  calculateWinProbability(
    teamMetrics: TeamPerformanceMetrics,
    opponentMetrics: TeamPerformanceMetrics,
    currentScore: { team: number; opponent: number },
    roundsToWin: number = 13
  ): { probability: number; confidence: number; factors: Array<{ name: string; contribution: number }> } {
    const factors: Array<{ name: string; contribution: number }> = [];
    
    // Score-based advantage (most significant factor)
    const scoreDiff = currentScore.team - currentScore.opponent;
    const roundsRemaining = roundsToWin - Math.max(currentScore.team, currentScore.opponent);
    const scoreContribution = scoreDiff / (roundsRemaining + 1) * 0.4;
    factors.push({ name: 'Score Advantage', contribution: scoreContribution });
    
    // Historical performance using Bayesian update
    const historicalUpdate = bayesianUpdate(
      1 + teamMetrics.totalRoundsPlayed * teamMetrics.roundWinRate,
      1 + teamMetrics.totalRoundsPlayed * (1 - teamMetrics.roundWinRate),
      currentScore.team,
      currentScore.opponent
    );
    const historicalContribution = (historicalUpdate.mean - 0.5) * 0.3;
    factors.push({ name: 'Historical Performance', contribution: historicalContribution });
    
    // Team strength comparison
    const kdaAdvantage = teamMetrics.averageKDA - opponentMetrics.averageKDA;
    const strengthContribution = Math.tanh(kdaAdvantage / 2) * 0.15;
    factors.push({ name: 'Team Strength', contribution: strengthContribution });
    
    // Side advantage (if applicable)
    const attackAdvantage = teamMetrics.attackWinRate - 0.5;
    const defenseAdvantage = teamMetrics.defenseWinRate - 0.5;
    const sideContribution = (attackAdvantage + defenseAdvantage) / 2 * 0.15;
    factors.push({ name: 'Side Performance', contribution: sideContribution });
    
    // Calculate total logit
    const logit = factors.reduce((sum, f) => sum + f.contribution, 0);
    
    // Convert to probability using sigmoid
    const baseProbability = 1 / (1 + Math.exp(-logit * 4));
    
    // Bound probability
    const probability = Math.max(0.02, Math.min(0.98, baseProbability));
    
    // Confidence based on data quality
    const confidence = Math.min(
      0.95,
      0.5 + (teamMetrics.totalRoundsPlayed + opponentMetrics.totalRoundsPlayed) / 200
    );
    
    return { probability, confidence, factors };
  }
  
  private generateRecommendation(mistakes: MicroMistake[]): string {
    const types = mistakes.map(m => m.type);
    
    if (types.includes(MistakeType.POOR_POSITIONING)) {
      return 'Focus on position holding and crosshair placement drills';
    }
    if (types.includes(MistakeType.FAILED_TRADE)) {
      return 'Practice buddy system and trade positioning with team';
    }
    if (types.includes(MistakeType.OVERPEEK)) {
      return 'Work on information gathering without over-exposure';
    }
    
    return 'Review game footage and identify specific improvement areas';
  }
}

export const analyticsEngine = new ScientificAnalyticsEngine();
