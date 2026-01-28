/**
 * GRID Data Processor - Comprehensive Data Processing for AI Coach
 * 
 * This service processes raw GRID API data into coach-ready analytics:
 * - Normalizes data across different game titles
 * - Calculates derived metrics
 * - Generates coaching insights
 * - Handles real-time and historical data
 */

import { GRIDPlayer, GRIDTeam, GRIDGame, GRIDSeriesState, GRIDSeriesInfo } from './gridDataService';

// =====================================================
// GAME-SPECIFIC CONSTANTS
// =====================================================

export const GAME_CONFIGS = {
  // VALORANT Configuration
  VALORANT: {
    id: 6,
    name: 'VALORANT',
    roundsToWin: 13,
    maxRounds: 25,
    roles: ['Duelist', 'Initiator', 'Controller', 'Sentinel'],
    keyMetrics: ['acs', 'kda', 'firstKills', 'clutches', 'plants', 'defuses'],
    phases: {
      early: { rounds: [1, 3], description: 'Pistol/Eco' },
      mid: { rounds: [4, 10], description: 'Full Buy' },
      late: { rounds: [11, 13], description: 'Match Point' },
    },
  },
  
  // League of Legends Configuration
  LOL: {
    id: 3,
    name: 'League of Legends',
    roundsToWin: 1, // Best of 1 game
    maxRounds: 1,
    roles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
    keyMetrics: ['kda', 'cs', 'goldDiff', 'visionScore', 'damageShare'],
    phases: {
      early: { time: [0, 14], description: 'Laning Phase' },
      mid: { time: [14, 28], description: 'Mid Game' },
      late: { time: [28, 60], description: 'Late Game' },
    },
  },
  
  // CS2 Configuration
  CS2: {
    id: 1,
    name: 'Counter-Strike 2',
    roundsToWin: 13,
    maxRounds: 30,
    roles: ['AWPer', 'Entry', 'Support', 'Lurker', 'IGL'],
    keyMetrics: ['adr', 'kast', 'impact', 'rating', 'hsPercent'],
    phases: {
      early: { rounds: [1, 3], description: 'Pistol/Eco' },
      mid: { rounds: [4, 10], description: 'Full Buy' },
      late: { rounds: [11, 13], description: 'Match Point' },
    },
  },
  
  // Dota 2 Configuration
  DOTA2: {
    id: 2,
    name: 'Dota 2',
    roundsToWin: 1,
    maxRounds: 1,
    roles: ['Carry', 'Mid', 'Offlane', 'Soft Support', 'Hard Support'],
    keyMetrics: ['kda', 'netWorth', 'gpm', 'xpm', 'heroDamage'],
    phases: {
      early: { time: [0, 15], description: 'Laning Phase' },
      mid: { time: [15, 35], description: 'Mid Game' },
      late: { time: [35, 90], description: 'Late Game' },
    },
  },
} as const;

// =====================================================
// PROCESSED DATA TYPES
// =====================================================

export interface ProcessedPlayer {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  role: string;
  
  // Core Stats
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  kdRatio: number;
  
  // Advanced Metrics
  impactScore: number;        // 0-100 composite score
  firstKillRate: number;      // First kills / rounds
  firstDeathRate: number;     // First deaths / rounds
  tradeDifferential: number;  // FK - FD
  
  // Efficiency
  damageDealt: number;
  damageTaken: number;
  damageEfficiency: number;
  headshotPercentage: number;
  
  // Game-Specific
  characterAgent?: string;    // Valorant/LoL character
  averageEconomy?: number;    // CS2/Valorant
  clutchWinRate?: number;
  
  // Performance Trending
  performanceTrend: 'improving' | 'declining' | 'stable';
  consistencyScore: number;   // 0-1 how consistent across games
  
  // Issues & Strengths
  identifiedIssues: PlayerIssue[];
  identifiedStrengths: PlayerStrength[];
}

export interface PlayerIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  occurrences: number;
  impactOnWinRate: number;    // Negative percentage impact
  recommendation: string;
  priority: number;           // 1-10, higher = more urgent
}

export interface PlayerStrength {
  type: string;
  description: string;
  impactOnWinRate: number;    // Positive percentage impact
  consistency: number;        // 0-1
  leverageRecommendation: string;
}

export interface ProcessedTeam {
  id: string;
  name: string;
  logoUrl?: string;
  
  // Series Stats
  seriesScore: number;
  gamesWon: number;
  gamesLost: number;
  
  // Aggregate Stats
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  avgKDA: number;
  
  // Round Analysis (for round-based games)
  roundsWon: number;
  roundsLost: number;
  roundWinRate: number;
  
  // Side Performance (Valorant/CS2)
  attackWinRate: number;
  defenseWinRate: number;
  
  // Economic Analysis
  pistolRoundWinRate: number;
  ecoRoundWinRate: number;
  forceRoundWinRate: number;
  fullBuyWinRate: number;
  
  // Team Dynamics
  coordination: number;       // 0-1
  adaptability: number;       // 0-1
  consistency: number;        // 0-1
  
  // Processed Players
  players: ProcessedPlayer[];
}

export interface ProcessedGame {
  id: string;
  number: number;
  map?: string;
  duration: number;           // Minutes
  
  // Result
  winner?: ProcessedTeam;
  finalScore: { home: number; away: number };
  
  // Game-Specific Stats
  totalRounds?: number;       // For Valorant/CS2
  gameTime?: number;          // For LoL/Dota2 in minutes
  
  // Key Moments
  keyMoments: GameMoment[];
  
  // Teams
  homeTeam: ProcessedTeam;
  awayTeam: ProcessedTeam;
}

export interface GameMoment {
  timestamp: string;
  type: 'first_blood' | 'ace' | 'clutch' | 'objective' | 'comeback' | 'throw';
  description: string;
  impactScore: number;
  involvedPlayers: string[];
}

export interface ProcessedSeries {
  id: string;
  game: string;
  tournament: string;
  scheduledTime: string;
  
  // Status
  status: 'scheduled' | 'live' | 'finished';
  isLive: boolean;
  
  // Teams
  homeTeam: ProcessedTeam;
  awayTeam: ProcessedTeam;
  
  // Games
  games: ProcessedGame[];
  
  // Series Result
  winner?: ProcessedTeam;
  seriesScore: { home: number; away: number };
  
  // Analytics
  winProbability: WinProbabilityData;
  strategyDebt: StrategyDebtData;
  coachingInsights: CoachingInsightData[];
  
  // Processing Metadata
  processedAt: string;
  dataCompleteness: number;   // 0-1, how complete is the data
}

export interface WinProbabilityData {
  current: number;
  confidence: number;
  trend: 'improving' | 'declining' | 'stable';
  history: Array<{ timestamp: string; probability: number }>;
  factors: Array<{ name: string; weight: number; contribution: number }>;
}

export interface StrategyDebtData {
  totalDebt: number;          // 0-100
  level: 'healthy' | 'warning' | 'critical';
  items: StrategyDebtItem[];
  trend: 'improving' | 'worsening' | 'stable';
}

export interface StrategyDebtItem {
  id: string;
  category: 'individual' | 'team' | 'tactical' | 'economic';
  source: string;
  description: string;
  debtScore: number;
  occurrences: number;
  recommendation: string;
  priority: number;
}

export interface CoachingInsightData {
  id: string;
  type: 'recommendation' | 'warning' | 'pattern' | 'opportunity';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
  affectedPlayers: string[];
  recommendedActions: string[];
  expectedImpact: number;
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

// =====================================================
// DATA PROCESSOR CLASS
// =====================================================

export class GRIDDataProcessor {
  private gameConfig: typeof GAME_CONFIGS[keyof typeof GAME_CONFIGS];
  
  constructor(gameId: number) {
    // Find the matching game config
    const config = Object.values(GAME_CONFIGS).find(c => c.id === gameId);
    this.gameConfig = config || GAME_CONFIGS.VALORANT;
  }
  
  /**
   * Process a complete series from GRID API data
   */
  processSeries(info: GRIDSeriesInfo, state: GRIDSeriesState | null): ProcessedSeries {
    // Process teams from info
    const homeTeamInfo = info.teams[0]?.baseInfo;
    const awayTeamInfo = info.teams[1]?.baseInfo;
    
    // Initialize processed teams
    let homeTeam: ProcessedTeam = this.createEmptyTeam(homeTeamInfo?.id || 'home', homeTeamInfo?.name || 'Team A', homeTeamInfo?.logoUrl);
    let awayTeam: ProcessedTeam = this.createEmptyTeam(awayTeamInfo?.id || 'away', awayTeamInfo?.name || 'Team B', awayTeamInfo?.logoUrl);
    
    // Process games if state is available
    const games: ProcessedGame[] = [];
    
    if (state && state.games) {
      for (const game of state.games) {
        const processedGame = this.processGame(game, homeTeam.id, awayTeam.id);
        games.push(processedGame);
        
        // Update team aggregates
        this.updateTeamFromGame(homeTeam, processedGame.homeTeam);
        this.updateTeamFromGame(awayTeam, processedGame.awayTeam);
      }
    }
    
    // Also process from series state teams
    if (state && state.teams) {
      const homeStateTeam = state.teams.find(t => t.id === homeTeam.id) || state.teams[0];
      const awayStateTeam = state.teams.find(t => t.id === awayTeam.id) || state.teams[1];
      
      if (homeStateTeam) {
        homeTeam = this.processTeam(homeStateTeam, games.filter(g => g.homeTeam.id === homeTeam.id));
      }
      if (awayStateTeam) {
        awayTeam = this.processTeam(awayStateTeam, games.filter(g => g.awayTeam.id === awayTeam.id));
      }
    }
    
    // Calculate series score
    const seriesScore = {
      home: games.filter(g => g.winner?.id === homeTeam.id).length,
      away: games.filter(g => g.winner?.id === awayTeam.id).length,
    };
    
    // Determine winner
    const winner = state?.finished 
      ? (seriesScore.home > seriesScore.away ? homeTeam : awayTeam)
      : undefined;
    
    // Calculate analytics
    const winProbability = this.calculateWinProbability(homeTeam, awayTeam, seriesScore);
    const strategyDebt = this.calculateStrategyDebt(homeTeam, games);
    const coachingInsights = this.generateCoachingInsights(homeTeam, awayTeam, games, strategyDebt);
    
    // Determine data completeness
    const dataCompleteness = this.calculateDataCompleteness(state, games);
    
    return {
      id: info.id,
      game: this.gameConfig.name,
      tournament: info.tournament?.name || 'Unknown Tournament',
      scheduledTime: info.startTimeScheduled,
      status: state?.finished ? 'finished' : state?.started ? 'live' : 'scheduled',
      isLive: Boolean(state?.started && !state?.finished),
      homeTeam,
      awayTeam,
      games,
      winner,
      seriesScore,
      winProbability,
      strategyDebt,
      coachingInsights,
      processedAt: new Date().toISOString(),
      dataCompleteness,
    };
  }
  
  /**
   * Process a single game
   */
  private processGame(game: GRIDGame, homeTeamId: string, awayTeamId: string): ProcessedGame {
    const homeTeamData = game.teams.find(t => t.id === homeTeamId) || game.teams[0];
    const awayTeamData = game.teams.find(t => t.id === awayTeamId) || game.teams[1];
    
    const homeTeam = this.processTeam(homeTeamData, []);
    const awayTeam = this.processTeam(awayTeamData, []);
    
    // Determine winner
    const winner = homeTeamData.won ? homeTeam : awayTeamData.won ? awayTeam : undefined;
    
    // Calculate duration
    const duration = game.durationMs ? game.durationMs / 1000 / 60 : 0;
    
    // Detect key moments
    const keyMoments = this.detectKeyMoments(game, homeTeam, awayTeam);
    
    return {
      id: game.id,
      number: game.number,
      map: game.map,
      duration,
      winner,
      finalScore: {
        home: homeTeamData.score || 0,
        away: awayTeamData.score || 0,
      },
      totalRounds: (homeTeamData.roundsWon || 0) + (awayTeamData.roundsWon || 0),
      keyMoments,
      homeTeam,
      awayTeam,
    };
  }
  
  /**
   * Process a team's data
   */
  private processTeam(team: GRIDTeam, games: ProcessedGame[]): ProcessedTeam {
    const players = team.players.map(p => this.processPlayer(p, team));
    
    // Calculate aggregates
    const totalKills = players.reduce((sum, p) => sum + p.kills, 0);
    const totalDeaths = players.reduce((sum, p) => sum + p.deaths, 0);
    const totalAssists = players.reduce((sum, p) => sum + p.assists, 0);
    const avgKDA = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists;
    
    // Round analysis
    const roundsWon = team.roundsWon || 0;
    const roundsLost = team.roundsLost || 0;
    const totalRounds = roundsWon + roundsLost;
    const roundWinRate = totalRounds > 0 ? roundsWon / totalRounds : 0.5;
    
    // Side performance
    const attackRoundsWon = team.attackRoundsWon || 0;
    const defenseRoundsWon = team.defenseRoundsWon || 0;
    
    // Economic performance
    const pistolRoundsWon = team.pistolRoundsWon || 0;
    const econRoundsWon = team.econRoundsWon || 0;
    const forceRoundsWon = team.forceRoundsWon || 0;
    const fullBuyRoundsWon = team.fullBuyRoundsWon || 0;
    
    // Calculate coordination based on player consistency
    const kdaVariance = this.calculateVariance(players.map(p => p.kda));
    const coordination = 1 - Math.min(kdaVariance / 2, 1);
    
    return {
      id: team.id,
      name: team.name,
      seriesScore: team.score || 0,
      gamesWon: games.filter(g => g.winner?.id === team.id).length,
      gamesLost: games.filter(g => g.winner?.id !== team.id && g.winner).length,
      totalKills,
      totalDeaths,
      totalAssists,
      avgKDA,
      roundsWon,
      roundsLost,
      roundWinRate,
      attackWinRate: attackRoundsWon / Math.max(totalRounds / 2, 1),
      defenseWinRate: defenseRoundsWon / Math.max(totalRounds / 2, 1),
      pistolRoundWinRate: pistolRoundsWon / Math.max(games.length * 2, 1),
      ecoRoundWinRate: econRoundsWon / Math.max(totalRounds * 0.2, 1),
      forceRoundWinRate: forceRoundsWon / Math.max(totalRounds * 0.2, 1),
      fullBuyWinRate: fullBuyRoundsWon / Math.max(totalRounds * 0.6, 1),
      coordination,
      adaptability: 0.5, // Would need more game context
      consistency: 1 - kdaVariance / 4,
      players,
    };
  }
  
  /**
   * Process a player's data
   */
  private processPlayer(player: GRIDPlayer, team: GRIDTeam): ProcessedPlayer {
    const kills = player.kills || 0;
    const deaths = Math.max(player.deaths || 1, 1);
    const assists = player.assists || 0;
    
    const kda = (kills + assists) / deaths;
    const kdRatio = kills / deaths;
    
    // Calculate impact score
    const impactScore = this.calculatePlayerImpact(player, team);
    
    // Calculate efficiency metrics
    const damageDealt = player.damageDealt || 0;
    const damageTaken = player.damageTaken || 1;
    const damageEfficiency = damageDealt / damageTaken;
    
    // Calculate first kill/death rates
    const rounds = (team.roundsWon || 0) + (team.roundsLost || 0) || 20;
    const firstKillRate = (player.firstKills || 0) / rounds;
    const firstDeathRate = (player.firstDeaths || 0) / rounds;
    const tradeDifferential = (player.firstKills || 0) - (player.firstDeaths || 0);
    
    // Headshot percentage
    const headshotPercentage = kills > 0 ? (player.headshots || 0) / kills : 0;
    
    // Clutch win rate
    const clutchWinRate = player.clutchAttempts && player.clutchAttempts > 0
      ? (player.clutchWins || 0) / player.clutchAttempts
      : 0;
    
    // Identify issues and strengths
    const identifiedIssues = this.identifyPlayerIssues(player, { kda, firstKillRate, firstDeathRate, damageEfficiency, clutchWinRate });
    const identifiedStrengths = this.identifyPlayerStrengths(player, { kda, firstKillRate, headshotPercentage, impactScore });
    
    return {
      id: player.id,
      name: player.name,
      teamId: team.id,
      teamName: team.name,
      role: player.role || 'Unknown',
      kills,
      deaths,
      assists,
      kda,
      kdRatio,
      impactScore,
      firstKillRate,
      firstDeathRate,
      tradeDifferential,
      damageDealt,
      damageTaken,
      damageEfficiency,
      headshotPercentage,
      characterAgent: player.character,
      averageEconomy: player.averageLoadoutValue,
      clutchWinRate,
      performanceTrend: 'stable', // Would need historical data
      consistencyScore: 0.7, // Default, would calculate from multiple games
      identifiedIssues,
      identifiedStrengths,
    };
  }
  
  /**
   * Calculate player impact score (0-100)
   */
  private calculatePlayerImpact(player: GRIDPlayer, team: GRIDTeam): number {
    const kills = player.kills || 0;
    const deaths = Math.max(player.deaths || 1, 1);
    const assists = player.assists || 0;
    const firstKills = player.firstKills || 0;
    const clutchWins = player.clutchWins || 0;
    const headshots = player.headshots || 0;
    const damageDealt = player.damageDealt || 0;
    
    // Normalize each component
    const kdaComponent = Math.min((kills + assists) / deaths / 3, 1) * 25;
    const fkComponent = Math.min(firstKills / 5, 1) * 20;
    const clutchComponent = Math.min(clutchWins / 3, 1) * 15;
    const hsComponent = kills > 0 ? (headshots / kills) * 20 : 0;
    
    // Calculate team's total damage for damage share
    const teamDamage = team.players.reduce((sum, p) => sum + (p.damageDealt || 0), 0);
    const damageShare = teamDamage > 0 ? (damageDealt / teamDamage) : 0.2;
    const damageComponent = damageShare * 100 * 0.2;
    
    return Math.min(kdaComponent + fkComponent + clutchComponent + hsComponent + damageComponent, 100);
  }
  
  /**
   * Identify player issues
   */
  private identifyPlayerIssues(
    player: GRIDPlayer,
    metrics: { kda: number; firstKillRate: number; firstDeathRate: number; damageEfficiency: number; clutchWinRate: number }
  ): PlayerIssue[] {
    const issues: PlayerIssue[] = [];
    
    // High first death rate
    if (metrics.firstDeathRate > 0.15) {
      issues.push({
        type: 'positioning',
        severity: metrics.firstDeathRate > 0.25 ? 'critical' : metrics.firstDeathRate > 0.20 ? 'high' : 'medium',
        description: `High first death rate (${(metrics.firstDeathRate * 100).toFixed(1)}%) - frequently dying first in rounds`,
        occurrences: Math.round(metrics.firstDeathRate * 20),
        impactOnWinRate: -metrics.firstDeathRate * 15,
        recommendation: `${player.name} should work on positioning and information gathering. Avoid early aggressive peeks without team support.`,
        priority: Math.round(metrics.firstDeathRate * 40),
      });
    }
    
    // Poor damage efficiency
    if (metrics.damageEfficiency < 0.8) {
      issues.push({
        type: 'trading',
        severity: metrics.damageEfficiency < 0.5 ? 'high' : 'medium',
        description: `Poor damage efficiency (${metrics.damageEfficiency.toFixed(2)}) - taking more damage than dealing`,
        occurrences: 1,
        impactOnWinRate: -(1 - metrics.damageEfficiency) * 10,
        recommendation: `${player.name} should focus on crosshair placement and cover usage. Consider utility support before engagements.`,
        priority: Math.round((1 - metrics.damageEfficiency) * 20),
      });
    }
    
    // Low KDA
    if (metrics.kda < 0.8) {
      issues.push({
        type: 'combat',
        severity: metrics.kda < 0.5 ? 'critical' : metrics.kda < 0.65 ? 'high' : 'medium',
        description: `Low KDA (${metrics.kda.toFixed(2)}) - consistently underperforming in combat`,
        occurrences: 1,
        impactOnWinRate: -(1 - metrics.kda) * 12,
        recommendation: `${player.name} needs fundamental improvement. Focus on aim training and decision-making drills.`,
        priority: Math.round((1 - Math.min(metrics.kda, 1)) * 30),
      });
    }
    
    // Low clutch rate for anchor/support roles
    if (metrics.clutchWinRate < 0.2 && (player.role === 'Sentinel' || player.role === 'Support' || player.role === 'anchor')) {
      issues.push({
        type: 'clutch',
        severity: 'medium',
        description: `Low clutch success rate (${(metrics.clutchWinRate * 100).toFixed(1)}%) for ${player.role} role`,
        occurrences: Math.round((1 - metrics.clutchWinRate) * 5),
        impactOnWinRate: -(0.2 - metrics.clutchWinRate) * 8,
        recommendation: `${player.name} should practice 1vX scenarios. Focus on time management and utility usage in clutch situations.`,
        priority: Math.round((0.2 - metrics.clutchWinRate) * 20),
      });
    }
    
    return issues.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Identify player strengths
   */
  private identifyPlayerStrengths(
    player: GRIDPlayer,
    metrics: { kda: number; firstKillRate: number; headshotPercentage: number; impactScore: number }
  ): PlayerStrength[] {
    const strengths: PlayerStrength[] = [];
    
    // High first kill rate
    if (metrics.firstKillRate > 0.15) {
      strengths.push({
        type: 'entry',
        description: `Excellent entry fragger (${(metrics.firstKillRate * 100).toFixed(1)}% first kill rate)`,
        impactOnWinRate: metrics.firstKillRate * 12,
        consistency: Math.min(metrics.firstKillRate * 4, 1),
        leverageRecommendation: `Use ${player.name} as primary entry. Build executes around their aggression.`,
      });
    }
    
    // High headshot percentage
    if (metrics.headshotPercentage > 0.4) {
      strengths.push({
        type: 'mechanical',
        description: `High mechanical skill (${(metrics.headshotPercentage * 100).toFixed(1)}% headshot rate)`,
        impactOnWinRate: metrics.headshotPercentage * 8,
        consistency: 0.8,
        leverageRecommendation: `${player.name} excels in aim duels. Prioritize them in rifle rounds and 1v1 situations.`,
      });
    }
    
    // High impact score
    if (metrics.impactScore > 70) {
      strengths.push({
        type: 'impact',
        description: `High-impact player (${metrics.impactScore.toFixed(1)} impact rating)`,
        impactOnWinRate: (metrics.impactScore - 50) * 0.2,
        consistency: 0.75,
        leverageRecommendation: `${player.name} should be focal point of strategies. Invest team resources to enable their success.`,
      });
    }
    
    // High KDA
    if (metrics.kda > 1.5) {
      strengths.push({
        type: 'consistency',
        description: `Consistently high KDA (${metrics.kda.toFixed(2)}) - reliable performer`,
        impactOnWinRate: (metrics.kda - 1) * 6,
        consistency: 0.85,
        leverageRecommendation: `${player.name} is a consistent performer. Can be relied on in high-pressure situations.`,
      });
    }
    
    return strengths;
  }
  
  /**
   * Detect key moments in a game
   */
  private detectKeyMoments(game: GRIDGame, homeTeam: ProcessedTeam, awayTeam: ProcessedTeam): GameMoment[] {
    const moments: GameMoment[] = [];
    
    // Find players with aces
    for (const player of [...homeTeam.players, ...awayTeam.players]) {
      const gridPlayer = game.teams.flatMap(t => t.players).find(p => p.id === player.id);
      if (gridPlayer?.aces && gridPlayer.aces > 0) {
        moments.push({
          timestamp: game.startedAt || new Date().toISOString(),
          type: 'ace',
          description: `${player.name} secured an ace (5K)`,
          impactScore: 95,
          involvedPlayers: [player.name],
        });
      }
      
      // Clutch moments
      if (gridPlayer?.clutchWins && gridPlayer.clutchWins > 0) {
        moments.push({
          timestamp: game.startedAt || new Date().toISOString(),
          type: 'clutch',
          description: `${player.name} won ${gridPlayer.clutchWins} clutch(es)`,
          impactScore: 85,
          involvedPlayers: [player.name],
        });
      }
    }
    
    return moments;
  }
  
  /**
   * Calculate win probability
   */
  private calculateWinProbability(
    homeTeam: ProcessedTeam,
    awayTeam: ProcessedTeam,
    seriesScore: { home: number; away: number }
  ): WinProbabilityData {
    // Score-based factor
    const scoreDiff = seriesScore.home - seriesScore.away;
    const scoreContribution = scoreDiff * 0.15;
    
    // KDA comparison
    const kdaAdvantage = homeTeam.avgKDA - awayTeam.avgKDA;
    const kdaContribution = Math.tanh(kdaAdvantage / 2) * 0.2;
    
    // Round win rate comparison
    const rwrAdvantage = homeTeam.roundWinRate - awayTeam.roundWinRate;
    const rwrContribution = rwrAdvantage * 0.25;
    
    // Coordination factor
    const coordAdvantage = homeTeam.coordination - awayTeam.coordination;
    const coordContribution = coordAdvantage * 0.1;
    
    // Calculate total
    const logit = scoreContribution + kdaContribution + rwrContribution + coordContribution;
    const probability = 1 / (1 + Math.exp(-logit * 3));
    
    // Bound probability
    const boundedProbability = Math.max(0.05, Math.min(0.95, probability));
    
    return {
      current: boundedProbability,
      confidence: Math.min(0.9, 0.5 + (homeTeam.roundsWon + awayTeam.roundsWon) / 100),
      trend: 'stable',
      history: [{ timestamp: new Date().toISOString(), probability: boundedProbability }],
      factors: [
        { name: 'Series Score', weight: 0.15, contribution: scoreContribution },
        { name: 'KDA Advantage', weight: 0.20, contribution: kdaContribution },
        { name: 'Round Win Rate', weight: 0.25, contribution: rwrContribution },
        { name: 'Team Coordination', weight: 0.10, contribution: coordContribution },
      ],
    };
  }
  
  /**
   * Calculate strategy debt
   */
  private calculateStrategyDebt(team: ProcessedTeam, games: ProcessedGame[]): StrategyDebtData {
    const items: StrategyDebtItem[] = [];
    let totalDebt = 0;
    
    // Check for recurring player issues
    for (const player of team.players) {
      for (const issue of player.identifiedIssues) {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          const debtScore = issue.priority * 2;
          items.push({
            id: `${player.id}-${issue.type}`,
            category: 'individual',
            source: player.name,
            description: issue.description,
            debtScore,
            occurrences: issue.occurrences,
            recommendation: issue.recommendation,
            priority: issue.priority,
          });
          totalDebt += debtScore;
        }
      }
    }
    
    // Check team coordination
    if (team.coordination < 0.4) {
      const coordDebt = (0.4 - team.coordination) * 50;
      items.push({
        id: 'team-coordination',
        category: 'team',
        source: 'Team',
        description: `Low team coordination score (${(team.coordination * 100).toFixed(1)}%)`,
        debtScore: coordDebt,
        occurrences: games.length,
        recommendation: 'Focus on team communication and trade drills in practice',
        priority: 8,
      });
      totalDebt += coordDebt;
    }
    
    // Check attack/defense balance
    const sideImbalance = Math.abs(team.attackWinRate - team.defenseWinRate);
    if (sideImbalance > 0.3) {
      const weakSide = team.attackWinRate < team.defenseWinRate ? 'attack' : 'defense';
      const sideDebt = sideImbalance * 40;
      items.push({
        id: 'side-imbalance',
        category: 'tactical',
        source: 'Team',
        description: `Significant ${weakSide} side weakness (${sideImbalance * 100}% imbalance)`,
        debtScore: sideDebt,
        occurrences: games.length,
        recommendation: `Review and improve ${weakSide} strategies. Consider new set plays.`,
        priority: 7,
      });
      totalDebt += sideDebt;
    }
    
    // Cap total debt at 100
    totalDebt = Math.min(totalDebt, 100);
    
    return {
      totalDebt,
      level: totalDebt > 70 ? 'critical' : totalDebt > 40 ? 'warning' : 'healthy',
      items: items.sort((a, b) => b.priority - a.priority),
      trend: 'stable',
    };
  }
  
  /**
   * Generate coaching insights
   */
  private generateCoachingInsights(
    homeTeam: ProcessedTeam,
    _awayTeam: ProcessedTeam,
    _games: ProcessedGame[],
    strategyDebt: StrategyDebtData
  ): CoachingInsightData[] {
    const insights: CoachingInsightData[] = [];
    
    // Critical strategy debt warning
    if (strategyDebt.level === 'critical') {
      insights.push({
        id: 'critical-debt',
        type: 'warning',
        priority: 'critical',
        title: 'Critical Strategy Debt Level',
        description: `Strategy debt at ${strategyDebt.totalDebt.toFixed(1)}% - immediate intervention required`,
        confidence: 0.9,
        evidence: strategyDebt.items.slice(0, 3).map(i => `${i.source}: ${i.description}`),
        affectedPlayers: strategyDebt.items.filter(i => i.category === 'individual').map(i => i.source),
        recommendedActions: [
          'Hold emergency team meeting to address issues',
          'Prioritize fixing top 2-3 recurring problems',
          'Consider tactical adjustments for struggling players',
        ],
        expectedImpact: 15,
        timeframe: 'immediate',
      });
    }
    
    // Top performer recognition
    const topPerformers = homeTeam.players.filter(p => p.impactScore > 70);
    if (topPerformers.length > 0) {
      insights.push({
        id: 'top-performers',
        type: 'pattern',
        priority: 'medium',
        title: 'High-Impact Players Identified',
        description: `${topPerformers.length} player(s) showing exceptional performance`,
        confidence: 0.85,
        evidence: topPerformers.map(p => `${p.name}: ${p.impactScore.toFixed(1)} impact rating`),
        affectedPlayers: topPerformers.map(p => p.name),
        recommendedActions: [
          'Build strategies around top performers',
          'Analyze their successful patterns for team adoption',
          'Ensure proper support utility is provided to them',
        ],
        expectedImpact: 8,
        timeframe: 'short-term',
      });
    }
    
    // Underperforming players
    const underperformers = homeTeam.players.filter(p => p.impactScore < 30);
    if (underperformers.length > 0) {
      insights.push({
        id: 'underperformers',
        type: 'recommendation',
        priority: 'high',
        title: 'Players Requiring Support',
        description: `${underperformers.length} player(s) struggling with performance`,
        confidence: 0.8,
        evidence: underperformers.map(p => `${p.name}: ${p.impactScore.toFixed(1)} impact rating, ${p.kda.toFixed(2)} KDA`),
        affectedPlayers: underperformers.map(p => p.name),
        recommendedActions: [
          'Review individual gameplay with affected players',
          'Adjust roles or positions to better suit their strengths',
          'Provide additional practice time on weak areas',
        ],
        expectedImpact: 12,
        timeframe: 'short-term',
      });
    }
    
    // Side imbalance opportunity
    const sideImbalance = Math.abs(homeTeam.attackWinRate - homeTeam.defenseWinRate);
    if (sideImbalance > 0.2) {
      const strongSide = homeTeam.attackWinRate > homeTeam.defenseWinRate ? 'attack' : 'defense';
      const weakSide = strongSide === 'attack' ? 'defense' : 'attack';
      
      insights.push({
        id: 'side-opportunity',
        type: 'opportunity',
        priority: 'medium',
        title: `${weakSide.charAt(0).toUpperCase() + weakSide.slice(1)} Side Improvement Opportunity`,
        description: `Team is ${(sideImbalance * 100).toFixed(1)}% weaker on ${weakSide} compared to ${strongSide}`,
        confidence: 0.75,
        evidence: [
          `Attack win rate: ${(homeTeam.attackWinRate * 100).toFixed(1)}%`,
          `Defense win rate: ${(homeTeam.defenseWinRate * 100).toFixed(1)}%`,
        ],
        affectedPlayers: [],
        recommendedActions: [
          `Review ${weakSide} strategies and setups`,
          `Study opponent's successful ${strongSide} patterns`,
          `Practice ${weakSide} specific scenarios`,
        ],
        expectedImpact: 10,
        timeframe: 'long-term',
      });
    }
    
    // Economy insights
    if (homeTeam.ecoRoundWinRate < 0.2) {
      insights.push({
        id: 'economy-opportunity',
        type: 'opportunity',
        priority: 'low',
        title: 'Eco Round Strategy Improvement',
        description: `Low eco round win rate (${(homeTeam.ecoRoundWinRate * 100).toFixed(1)}%) - opportunity to improve`,
        confidence: 0.7,
        evidence: [
          `Current eco win rate: ${(homeTeam.ecoRoundWinRate * 100).toFixed(1)}%`,
          `Average professional eco win rate: 20-25%`,
        ],
        affectedPlayers: [],
        recommendedActions: [
          'Develop coordinated eco round strategies',
          'Practice stack plays and anti-eco setups',
          'Review successful eco round examples from pro play',
        ],
        expectedImpact: 5,
        timeframe: 'long-term',
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  /**
   * Calculate data completeness score
   */
  private calculateDataCompleteness(state: GRIDSeriesState | null, _games: ProcessedGame[]): number {
    if (!state) return 0;
    
    let score = 0;
    const maxScore = 100;
    
    // Has basic series info
    if (state.id) score += 10;
    if (state.teams.length >= 2) score += 10;
    
    // Has game data
    if (state.games.length > 0) score += 20;
    
    // Has player data
    const hasPlayerStats = state.games.some(g => 
      g.teams.some(t => t.players.some(p => p.kills !== undefined))
    );
    if (hasPlayerStats) score += 30;
    
    // Has advanced stats
    const hasAdvancedStats = state.games.some(g =>
      g.teams.some(t => t.players.some(p => 
        p.damageDealt !== undefined || p.firstKills !== undefined
      ))
    );
    if (hasAdvancedStats) score += 30;
    
    return score / maxScore;
  }
  
  /**
   * Helper: Create empty team structure
   */
  private createEmptyTeam(id: string, name: string, logoUrl?: string): ProcessedTeam {
    return {
      id,
      name,
      logoUrl,
      seriesScore: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
      avgKDA: 1,
      roundsWon: 0,
      roundsLost: 0,
      roundWinRate: 0.5,
      attackWinRate: 0.5,
      defenseWinRate: 0.5,
      pistolRoundWinRate: 0.5,
      ecoRoundWinRate: 0.2,
      forceRoundWinRate: 0.3,
      fullBuyWinRate: 0.5,
      coordination: 0.5,
      adaptability: 0.5,
      consistency: 0.5,
      players: [],
    };
  }
  
  /**
   * Helper: Update team aggregates from a game
   */
  private updateTeamFromGame(team: ProcessedTeam, gameTeam: ProcessedTeam): void {
    team.totalKills += gameTeam.totalKills;
    team.totalDeaths += gameTeam.totalDeaths;
    team.totalAssists += gameTeam.totalAssists;
    team.roundsWon += gameTeam.roundsWon;
    team.roundsLost += gameTeam.roundsLost;
  }
  
  /**
   * Helper: Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  }
}

// Export singleton factory
export function createDataProcessor(gameId: number): GRIDDataProcessor {
  return new GRIDDataProcessor(gameId);
}
