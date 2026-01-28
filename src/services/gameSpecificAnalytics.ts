/**
 * Game-Specific Analytics Engine
 * 
 * Provides game-specific analytics for different esports titles:
 * - VALORANT: Agent-based analysis, site control, economy
 * - League of Legends: Lane phase, objectives, team fights
 * - CS2: Map control, economy, trades
 * - Dota 2: Net worth, objectives, hero matchups
 * 
 * All analytics are tailored to each game's unique mechanics
 */

import { GRIDPlayer, GRIDTeam, GRIDGame } from './gridDataService';
import { 
  PlayerStats, 
  TeamStats, 
  CausalInsight, 
  CoachingRecommendation,
  StrategyDebt,
  WinProbability
} from '../types/grid';

// =====================================================
// GAME CONFIGURATIONS
// =====================================================

export interface GameAnalyticsConfig {
  id: number;
  name: string;
  type: 'fps' | 'moba';
  
  // Game-specific parameters
  roundsToWin?: number;
  maxRounds?: number;
  overtimeRounds?: number;
  
  // Role definitions
  roles: string[];
  
  // Key metrics for this game
  keyMetrics: string[];
  
  // Phase definitions
  phases: {
    [key: string]: {
      identifier: number | number[];  // Round numbers or time in minutes
      name: string;
      weight: number;  // Importance weight for analysis
    };
  };
  
  // Economic thresholds (for FPS games)
  economyThresholds?: {
    eco: number;
    force: number;
    fullBuy: number;
  };
}

export const GAME_ANALYTICS_CONFIGS: Record<string, GameAnalyticsConfig> = {
  VALORANT: {
    id: 6,
    name: 'VALORANT',
    type: 'fps',
    roundsToWin: 13,
    maxRounds: 25,
    overtimeRounds: 2,
    roles: ['Duelist', 'Initiator', 'Controller', 'Sentinel'],
    keyMetrics: ['acs', 'kda', 'firstKills', 'clutches', 'plants', 'defuses', 'assists'],
    phases: {
      pistol: { identifier: [1, 13], name: 'Pistol Rounds', weight: 1.5 },
      early: { identifier: [2, 3, 14, 15], name: 'Eco/Force', weight: 0.8 },
      mid: { identifier: [4, 5, 6, 7, 8, 9, 10, 11, 16, 17, 18, 19, 20, 21, 22, 23], name: 'Full Buy', weight: 1.0 },
      matchPoint: { identifier: [12, 24], name: 'Match Point', weight: 1.3 },
    },
    economyThresholds: {
      eco: 2000,
      force: 4000,
      fullBuy: 4500,
    },
  },
  
  CS2: {
    id: 1,
    name: 'Counter-Strike 2',
    type: 'fps',
    roundsToWin: 13,
    maxRounds: 30,
    overtimeRounds: 6,
    roles: ['AWPer', 'Entry Fragger', 'Support', 'Lurker', 'In-Game Leader'],
    keyMetrics: ['adr', 'kast', 'impact', 'rating', 'hsPercent', 'flashAssists'],
    phases: {
      pistol: { identifier: [1, 16], name: 'Pistol Rounds', weight: 1.5 },
      early: { identifier: [2, 3, 17, 18], name: 'Eco/Force', weight: 0.8 },
      mid: { identifier: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], name: 'Full Buy', weight: 1.0 },
      matchPoint: { identifier: [15, 30], name: 'Match Point', weight: 1.3 },
    },
    economyThresholds: {
      eco: 2000,
      force: 3500,
      fullBuy: 4750,
    },
  },
  
  LOL: {
    id: 3,
    name: 'League of Legends',
    type: 'moba',
    roles: ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
    keyMetrics: ['kda', 'cs', 'csPerMin', 'goldDiff', 'visionScore', 'damageShare', 'killParticipation'],
    phases: {
      laning: { identifier: [0, 14], name: 'Laning Phase', weight: 1.0 },
      midGame: { identifier: [14, 28], name: 'Mid Game', weight: 1.2 },
      lateGame: { identifier: [28, 60], name: 'Late Game', weight: 1.5 },
    },
  },
  
  DOTA2: {
    id: 2,
    name: 'Dota 2',
    type: 'moba',
    roles: ['Carry', 'Mid', 'Offlane', 'Soft Support', 'Hard Support'],
    keyMetrics: ['kda', 'netWorth', 'gpm', 'xpm', 'heroDamage', 'towerDamage', 'healing'],
    phases: {
      laning: { identifier: [0, 15], name: 'Laning Phase', weight: 1.0 },
      midGame: { identifier: [15, 35], name: 'Mid Game', weight: 1.2 },
      lateGame: { identifier: [35, 90], name: 'Late Game', weight: 1.5 },
    },
  },
};

// =====================================================
// GAME-SPECIFIC ANALYZER CLASS
// =====================================================

export class GameSpecificAnalyzer {
  private config: GameAnalyticsConfig;
  
  constructor(gameId: number) {
    const config = Object.values(GAME_ANALYTICS_CONFIGS).find(c => c.id === gameId);
    this.config = config || GAME_ANALYTICS_CONFIGS.VALORANT;
  }
  
  /**
   * Analyze a player with game-specific metrics
   */
  analyzePlayer(
    player: GRIDPlayer,
    team: GRIDTeam,
    game: GRIDGame,
    rounds: number
  ): PlayerStats {
    const baseStats = this.calculateBaseStats(player, rounds);
    const advancedStats = this.calculateAdvancedStats(player, team, game, rounds);
    const gameSpecificStats = this.calculateGameSpecificStats(player, team, game);
    
    return {
      id: player.id || `player-${Date.now()}`,
      name: player.name || 'Unknown',
      ...baseStats,
      ...advancedStats,
      ...gameSpecificStats,
      teamId: team.id,
    } as PlayerStats;
  }
  
  /**
   * Calculate base combat statistics
   */
  private calculateBaseStats(player: GRIDPlayer, rounds: number): Partial<PlayerStats> {
    const kills = player.kills || 0;
    const deaths = Math.max(player.deaths || 1, 1);
    const assists = player.assists || 0;
    
    return {
      id: player.id,
      name: player.name,
      kills,
      deaths,
      assists,
      kda: (kills + assists) / deaths,
      kdRatio: kills / deaths,
      headshotPercentage: kills > 0 ? (player.headshots || 0) / kills : 0,
      damageDealt: player.damageDealt || 0,
      damageTaken: player.damageTaken || 0,
      damagePerRound: rounds > 0 ? (player.damageDealt || 0) / rounds : 0,
    };
  }
  
  /**
   * Calculate advanced statistics
   */
  private calculateAdvancedStats(
    player: GRIDPlayer, 
    team: GRIDTeam,
    _game: GRIDGame,
    rounds: number
  ): Partial<PlayerStats> {
    const firstKills = player.firstKills || 0;
    const firstDeaths = player.firstDeaths || 0;
    const clutchWins = player.clutchWins || 0;
    const clutchAttempts = Math.max(player.clutchAttempts || 1, 1);
    
    // Calculate impact score using weighted factors
    const impactScore = this.calculateImpactScore(player, team, rounds);
    
    return {
      firstKills,
      firstDeaths,
      tradeDifferential: firstKills - firstDeaths,
      clutchWins,
      clutchAttempts,
      clutchWinRate: clutchWins / clutchAttempts,
      multiKills: player.multiKills || 0,
      aces: player.aces || 0,
      impactScore,
      consistencyScore: 0.7, // Default, calculated from historical data
      performanceTrend: 'stable',
    };
  }
  
  /**
   * Calculate game-specific statistics
   */
  private calculateGameSpecificStats(
    player: GRIDPlayer,
    _team: GRIDTeam,
    _game: GRIDGame
  ): Partial<PlayerStats> {
    const stats: Partial<PlayerStats> = {
      role: player.role || 'Unknown',
      character: player.character,
    };
    
    if (this.config.type === 'fps') {
      // FPS-specific stats
      stats.plants = player.plants || 0;
      stats.defuses = player.defuses || 0;
      stats.averageLoadoutValue = player.averageLoadoutValue || 0;
      stats.economyRating = player.economyRating || 0;
      
      // Valorant-specific
      if (this.config.id === 6) {
        stats.agent = player.character;
      }
      
    } else if (this.config.type === 'moba') {
      // MOBA-specific stats
      if (this.config.id === 3) {
        // League of Legends
        stats.champion = player.character;
      } else if (this.config.id === 2) {
        // Dota 2
        stats.hero = player.character;
      }
    }
    
    return stats;
  }
  
  /**
   * Calculate player impact score (0-100)
   */
  private calculateImpactScore(player: GRIDPlayer, team: GRIDTeam, rounds: number): number {
    const kills = player.kills || 0;
    const deaths = Math.max(player.deaths || 1, 1);
    const assists = player.assists || 0;
    const firstKills = player.firstKills || 0;
    const clutchWins = player.clutchWins || 0;
    const headshots = player.headshots || 0;
    const damageDealt = player.damageDealt || 0;
    
    // Different weightings based on game type
    if (this.config.type === 'fps') {
      // FPS impact calculation
      const kdaComponent = Math.min((kills + assists) / deaths / 3, 1) * 25;
      const fkComponent = rounds > 0 ? Math.min(firstKills / rounds / 0.15, 1) * 25 : 0;
      const clutchComponent = Math.min(clutchWins / 3, 1) * 15;
      const hsComponent = kills > 0 ? (headshots / kills) * 15 : 0;
      
      // Damage share
      const teamDamage = team.players.reduce((sum, p) => sum + (p.damageDealt || 0), 0);
      const damageShare = teamDamage > 0 ? damageDealt / teamDamage : 0.2;
      const damageComponent = damageShare * 100 * 0.2;
      
      return Math.min(kdaComponent + fkComponent + clutchComponent + hsComponent + damageComponent, 100);
      
    } else {
      // MOBA impact calculation
      const kdaComponent = Math.min((kills + assists) / deaths / 4, 1) * 30;
      const netWorthComponent = Math.min((player.netWorth || 0) / 20000, 1) * 25;
      const damageComponent = Math.min(damageDealt / 50000, 1) * 25;
      const objectiveComponent = 20; // Would calculate from objective participation
      
      return Math.min(kdaComponent + netWorthComponent + damageComponent + objectiveComponent, 100);
    }
  }
  
  /**
   * Analyze team performance
   */
  analyzeTeam(team: GRIDTeam, games: GRIDGame[]): TeamStats {
    const players = team.players.map(p => {
      const game = games[0]; // Use first game for context
      const rounds = game ? ((game.teams[0]?.roundsWon || 0) + (game.teams[0]?.roundsLost || 0)) : 20;
      return this.analyzePlayer(p, team, game, rounds);
    });
    
    // Calculate aggregates
    const totalKills = players.reduce((sum, p) => sum + p.kills, 0);
    const totalDeaths = players.reduce((sum, p) => sum + p.deaths, 0);
    const totalAssists = players.reduce((sum, p) => sum + (p.assists || 0), 0);
    
    // Round stats
    let roundsWon = 0;
    let roundsLost = 0;
    let attackRoundsWon = 0;
    let defenseRoundsWon = 0;
    
    for (const game of games) {
      const teamData = game.teams.find(t => t.id === team.id);
      if (teamData) {
        roundsWon += teamData.roundsWon || 0;
        roundsLost += teamData.roundsLost || 0;
        attackRoundsWon += teamData.attackRoundsWon || 0;
        defenseRoundsWon += teamData.defenseRoundsWon || 0;
      }
    }
    
    const totalRounds = roundsWon + roundsLost || 1;
    
    // Calculate team dynamics
    const kdaValues = players.map(p => p.kda);
    const coordination = 1 - this.calculateCoeffientOfVariation(kdaValues);
    
    return {
      id: team.id,
      name: team.name,
      seriesScore: team.score || 0,
      gamesWon: games.filter(g => g.teams.find(t => t.id === team.id)?.won).length,
      gamesLost: games.length - games.filter(g => g.teams.find(t => t.id === team.id)?.won).length,
      totalKills,
      totalDeaths,
      totalAssists,
      avgKDA: totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists,
      roundsWon,
      roundsLost,
      roundWinRate: roundsWon / totalRounds,
      attackRoundsWon,
      defenseRoundsWon,
      attackWinRate: attackRoundsWon / Math.max(totalRounds / 2, 1),
      defenseWinRate: defenseRoundsWon / Math.max(totalRounds / 2, 1),
      pistolRoundsWon: team.pistolRoundsWon || 0,
      econRoundsWon: team.econRoundsWon || 0,
      forceRoundsWon: team.forceRoundsWon || 0,
      fullBuyRoundsWon: team.fullBuyRoundsWon || 0,
      coordination,
      adaptability: 0.5,
      consistency: coordination * 0.8,
      players,
    };
  }
  
  /**
   * Generate game-specific coaching insights
   */
  generateInsights(
    homeTeam: TeamStats,
    awayTeam: TeamStats,
    games: GRIDGame[]
  ): CausalInsight[] {
    const insights: CausalInsight[] = [];
    
    if (this.config.type === 'fps') {
      insights.push(...this.generateFPSInsights(homeTeam, awayTeam, games));
    } else {
      insights.push(...this.generateMOBAInsights(homeTeam, awayTeam, games));
    }
    
    return insights;
  }
  
  /**
   * Generate FPS-specific insights
   */
  private generateFPSInsights(
    homeTeam: TeamStats,
    awayTeam: TeamStats,
    _games: GRIDGame[]
  ): CausalInsight[] {
    const insights: CausalInsight[] = [];
    
    // First kill analysis
    const homeFirstKills = homeTeam.players.reduce((sum, p) => sum + (p.firstKills || 0), 0);
    const awayFirstKills = awayTeam.players.reduce((sum, p) => sum + (p.firstKills || 0), 0);
    
    if (homeFirstKills < awayFirstKills * 0.7) {
      insights.push({
        id: 'fk-disadvantage',
        microAction: 'Losing first engagement battles',
        macroOutcome: 'Starting rounds at man disadvantage, reducing win probability',
        causalWeight: 0.85,
        recommendation: 'Focus on information gathering before first engagement. Use utility to create safe space for entries.',
        priority: 'high',
        confidence: 0.82,
        affectedPlayers: homeTeam.players.filter(p => (p.firstDeaths || 0) > (p.firstKills || 0)).map(p => p.name),
      });
    }
    
    // Side imbalance
    const sideImbalance = Math.abs(homeTeam.attackWinRate - homeTeam.defenseWinRate);
    if (sideImbalance > 0.2) {
      const weakSide = homeTeam.attackWinRate < homeTeam.defenseWinRate ? 'attack' : 'defense';
      insights.push({
        id: 'side-imbalance',
        microAction: `Weak ${weakSide} side performance`,
        macroOutcome: `Losing ${(sideImbalance * 100).toFixed(0)}% more rounds on ${weakSide}`,
        causalWeight: 0.78,
        recommendation: `Review ${weakSide} side setups and strategies. Consider new executes or holds.`,
        priority: 'medium',
        confidence: 0.75,
      });
    }
    
    // Clutch analysis
    const clutchPlayers = homeTeam.players.filter(p => (p.clutchWinRate || 0) > 0.4);
    const strugglePlayers = homeTeam.players.filter(p => 
      (p.clutchAttempts || 0) > 2 && (p.clutchWinRate || 0) < 0.2
    );
    
    if (clutchPlayers.length > 0) {
      insights.push({
        id: 'clutch-strength',
        microAction: 'Strong clutch performers identified',
        macroOutcome: 'Reliable round closers available',
        causalWeight: 0.72,
        recommendation: `Trust ${clutchPlayers.map(p => p.name).join(', ')} in late-round situations. Give them economy priority.`,
        priority: 'low',
        confidence: 0.8,
        affectedPlayers: clutchPlayers.map(p => p.name),
      });
    }
    
    if (strugglePlayers.length > 0) {
      insights.push({
        id: 'clutch-weakness',
        microAction: 'Low clutch success rate',
        macroOutcome: 'Missing round conversion opportunities',
        causalWeight: 0.75,
        recommendation: `Practice 1vX scenarios with ${strugglePlayers.map(p => p.name).join(', ')}. Focus on time management.`,
        priority: 'medium',
        confidence: 0.78,
        affectedPlayers: strugglePlayers.map(p => p.name),
      });
    }
    
    // Economy analysis (for FPS games with economy)
    if (this.config.economyThresholds) {
      if (homeTeam.econRoundsWon / Math.max(homeTeam.roundsWon, 1) < 0.15) {
        insights.push({
          id: 'eco-rounds',
          microAction: 'Low eco round win rate',
          macroOutcome: 'Missing bonus rounds, economy snowball difficulty',
          causalWeight: 0.68,
          recommendation: 'Develop coordinated eco round strategies. Practice stack plays and anti-force setups.',
          priority: 'low',
          confidence: 0.7,
        });
      }
    }
    
    return insights;
  }
  
  /**
   * Generate MOBA-specific insights
   */
  private generateMOBAInsights(
    homeTeam: TeamStats,
    awayTeam: TeamStats,
    _games: GRIDGame[]
  ): CausalInsight[] {
    const insights: CausalInsight[] = [];
    
    // Lane phase analysis
    const avgKDA = homeTeam.avgKDA;
    const opponentKDA = awayTeam.avgKDA;
    
    if (avgKDA < opponentKDA * 0.8) {
      insights.push({
        id: 'kda-deficit',
        microAction: 'Losing early game engagements',
        macroOutcome: 'Falling behind in gold and experience',
        causalWeight: 0.82,
        recommendation: 'Focus on safe laning and farm. Avoid unnecessary fights until power spikes.',
        priority: 'high',
        confidence: 0.85,
      });
    }
    
    // Team coordination
    if (homeTeam.coordination < 0.4) {
      insights.push({
        id: 'coordination-issue',
        microAction: 'Inconsistent performance across roles',
        macroOutcome: 'Difficulty executing team fights effectively',
        causalWeight: 0.78,
        recommendation: 'Practice team fight coordination and target priority. Work on engage/disengage timing.',
        priority: 'medium',
        confidence: 0.75,
      });
    }
    
    // Role-specific analysis for LoL
    if (this.config.id === 3) {
      const adc = homeTeam.players.find(p => p.role === 'ADC');
      const support = homeTeam.players.find(p => p.role === 'Support');
      
      if (adc && adc.kda < 2) {
        insights.push({
          id: 'adc-struggle',
          microAction: `${adc.name} underperforming in bot lane`,
          macroOutcome: 'Lack of late game carry threat',
          causalWeight: 0.75,
          recommendation: `Support ${adc.name} with additional jungle attention. Consider champion pool adjustments.`,
          priority: 'high',
          confidence: 0.78,
          affectedPlayers: [adc.name, support?.name].filter(Boolean) as string[],
        });
      }
    }
    
    return insights;
  }
  
  /**
   * Generate game-specific coaching recommendations
   */
  generateRecommendations(
    homeTeam: TeamStats,
    strategyDebt: StrategyDebt,
    insights: CausalInsight[]
  ): CoachingRecommendation[] {
    const recommendations: CoachingRecommendation[] = [];
    
    // Generate recommendations based on insights
    for (const insight of insights) {
      if (insight.priority === 'high' || insight.priority === 'medium') {
        recommendations.push({
          id: `rec-${insight.id}`,
          type: insight.priority === 'high' ? 'immediate' : 'tactical',
          priority: insight.priority === 'high' ? 'high' : 'medium',
          category: 'team',
          title: insight.microAction,
          description: insight.recommendation,
          rationale: insight.macroOutcome,
          targetPlayers: insight.affectedPlayers,
          expectedImpact: insight.causalWeight * 15,
          confidence: insight.confidence || 0.75,
          evidence: insight.evidence || [],
          actionItems: [insight.recommendation],
          timeframe: insight.priority === 'high' ? 'now' : 'this_half',
        });
      }
    }
    
    // Add strategy debt recommendations
    for (const item of strategyDebt.items.slice(0, 3)) {
      recommendations.push({
        id: `rec-debt-${item.id}`,
        type: 'strategic',
        priority: item.debtScore > 15 ? 'high' : 'medium',
        category: item.category === 'individual' ? 'individual' : 'team',
        title: `Address: ${item.description}`,
        description: item.recommendation,
        rationale: `Contributing ${item.debtScore.toFixed(1)} to strategy debt`,
        targetPlayers: item.category === 'individual' ? [item.source] : undefined,
        expectedImpact: item.debtScore * 0.5,
        confidence: 0.8,
        evidence: [`Occurred ${item.occurrences} times`],
        actionItems: [item.recommendation],
        timeframe: 'next_game',
      });
    }
    
    // Game-specific recommendations
    if (this.config.type === 'fps') {
      // FPS-specific recommendations
      if (homeTeam.pistolRoundsWon < 2) {
        recommendations.push({
          id: 'rec-pistol',
          type: 'practice',
          priority: 'medium',
          category: 'team',
          title: 'Improve Pistol Round Performance',
          description: 'Develop and practice coordinated pistol round strategies',
          rationale: 'Pistol rounds set the economic foundation for multiple rounds',
          expectedImpact: 12,
          confidence: 0.75,
          evidence: [`Current pistol round record: ${homeTeam.pistolRoundsWon} wins`],
          actionItems: [
            'Create 2-3 default pistol setups per side',
            'Practice pistol aim duels',
            'Review successful pistol round setups from professional play',
          ],
          timeframe: 'practice',
        });
      }
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  /**
   * Calculate win probability with game-specific factors
   */
  calculateWinProbability(
    homeTeam: TeamStats,
    awayTeam: TeamStats,
    currentScore: { home: number; away: number }
  ): WinProbability {
    const factors: { name: string; weight: number; value: number; contribution: number }[] = [];
    
    // Score factor
    const scoreDiff = currentScore.home - currentScore.away;
    const scoreContribution = scoreDiff * 0.15;
    factors.push({
      name: 'Series Score',
      weight: 0.15,
      value: scoreDiff,
      contribution: scoreContribution,
    });
    
    // KDA advantage
    const kdaAdvantage = homeTeam.avgKDA - awayTeam.avgKDA;
    const kdaContribution = Math.tanh(kdaAdvantage / 2) * 0.2;
    factors.push({
      name: 'KDA Advantage',
      weight: 0.2,
      value: kdaAdvantage,
      contribution: kdaContribution,
    });
    
    // Game-type specific factors
    if (this.config.type === 'fps') {
      // Round win rate
      const rwrAdvantage = homeTeam.roundWinRate - awayTeam.roundWinRate;
      const rwrContribution = rwrAdvantage * 0.25;
      factors.push({
        name: 'Round Win Rate',
        weight: 0.25,
        value: rwrAdvantage,
        contribution: rwrContribution,
      });
      
      // Side balance
      const sideBalance = (homeTeam.attackWinRate + homeTeam.defenseWinRate) / 2 - 0.5;
      const sideContribution = sideBalance * 0.15;
      factors.push({
        name: 'Side Balance',
        weight: 0.15,
        value: sideBalance,
        contribution: sideContribution,
      });
      
    } else {
      // MOBA-specific factors
      factors.push({
        name: 'Team Coordination',
        weight: 0.25,
        value: homeTeam.coordination - awayTeam.coordination,
        contribution: (homeTeam.coordination - awayTeam.coordination) * 0.25,
      });
    }
    
    // Calculate total
    const totalContribution = factors.reduce((sum, f) => sum + f.contribution, 0);
    const baseProbability = 1 / (1 + Math.exp(-totalContribution * 3));
    const probability = Math.max(0.05, Math.min(0.95, baseProbability));
    
    // Determine trend
    const trend = probability > 0.55 ? 'improving' : probability < 0.45 ? 'declining' : 'stable';
    
    return {
      current: probability,
      confidence: 0.75,
      trend,
      history: [{ timestamp: new Date().toISOString(), probability }],
      factors,
      projectedOutcome: {
        win: probability,
        lose: 1 - probability,
      },
    };
  }
  
  /**
   * Calculate strategy debt with game-specific considerations
   */
  calculateStrategyDebt(
    team: TeamStats,
    insights: CausalInsight[]
  ): StrategyDebt {
    const items: import('../types/grid').StrategyDebtItem[] = [];
    let totalScore = 0;
    const breakdown = { individual: 0, team: 0, tactical: 0, economic: 0 };
    
    // Player-level debt
    for (const player of team.players) {
      // High first death rate
      if (player.firstDeaths && player.firstKills) {
        const tradeDiff = player.firstKills - player.firstDeaths;
        if (tradeDiff < -2) {
          const debtScore = Math.abs(tradeDiff) * 3;
          items.push({
            id: `${player.id}-trade`,
            category: 'individual',
            source: player.name,
            description: `Negative trade differential (${tradeDiff})`,
            debtScore,
            occurrences: Math.abs(tradeDiff),
            trend: 'stable',
            recommendation: `${player.name} should focus on trading positions and information gathering`,
            priority: debtScore > 10 ? 9 : 6,
          });
          totalScore += debtScore;
          breakdown.individual += debtScore;
        }
      }
      
      // Low impact score
      if ((player.impactScore || 0) < 30) {
        const debtScore = (30 - (player.impactScore || 0)) * 0.5;
        items.push({
          id: `${player.id}-impact`,
          category: 'individual',
          source: player.name,
          description: `Low impact rating (${(player.impactScore || 0).toFixed(1)})`,
          debtScore,
          occurrences: 1,
          trend: 'stable',
          recommendation: `Review ${player.name}'s role and positioning to increase impact`,
          priority: 5,
        });
        totalScore += debtScore;
        breakdown.individual += debtScore;
      }
    }
    
    // Team-level debt from insights
    for (const insight of insights.filter(i => i.priority === 'high')) {
      const debtScore = insight.causalWeight * 15;
      items.push({
        id: `insight-${insight.id}`,
        category: 'team',
        source: 'Team',
        description: insight.microAction,
        debtScore,
        occurrences: 1,
        trend: 'stable',
        recommendation: insight.recommendation,
        priority: 8,
      });
      totalScore += debtScore;
      breakdown.team += debtScore;
    }
    
    // Game-specific debt
    if (this.config.type === 'fps') {
      // Side imbalance
      const sideImbalance = Math.abs(team.attackWinRate - team.defenseWinRate);
      if (sideImbalance > 0.25) {
        const debtScore = sideImbalance * 30;
        items.push({
          id: 'side-imbalance',
          category: 'tactical',
          source: 'Team',
          description: `Significant side imbalance (${(sideImbalance * 100).toFixed(0)}%)`,
          debtScore,
          occurrences: 1,
          trend: 'stable',
          recommendation: 'Develop new strategies for weaker side',
          priority: 7,
        });
        totalScore += debtScore;
        breakdown.tactical += debtScore;
      }
      
      // Economy management
      if ((team.ecoRoundWinRate ?? 0.2) < 0.15 && (team.forceRoundWinRate ?? 0.3) < 0.25) {
        const debtScore = 10;
        items.push({
          id: 'economy-management',
          category: 'economic',
          source: 'Team',
          description: 'Poor eco/force round conversion',
          debtScore,
          occurrences: 1,
          trend: 'stable',
          recommendation: 'Improve economy management and force buy strategies',
          priority: 5,
        });
        totalScore += debtScore;
        breakdown.economic += debtScore;
      }
    }
    
    totalScore = Math.min(totalScore, 100);
    
    return {
      totalScore,
      level: totalScore > 70 ? 'critical' : totalScore > 40 ? 'warning' : 'healthy',
      trend: 'stable',
      items: items.sort((a, b) => b.priority - a.priority),
      breakdown,
    };
  }
  
  /**
   * Helper: Calculate coefficient of variation
   */
  private calculateCoeffientOfVariation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg === 0) return 0;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    return Math.sqrt(variance) / avg;
  }
  
  /**
   * Get game configuration
   */
  getConfig(): GameAnalyticsConfig {
    return this.config;
  }
}

// Export factory function
export function createGameAnalyzer(gameId: number): GameSpecificAnalyzer {
  return new GameSpecificAnalyzer(gameId);
}

// Export default instance for Valorant
export const defaultAnalyzer = new GameSpecificAnalyzer(6);
