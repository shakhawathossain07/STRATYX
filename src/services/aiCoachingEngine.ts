/**
 * AI Coaching Engine
 * 
 * Advanced AI-powered coaching system that provides:
 * - Real-time tactical recommendations
 * - Pattern recognition for recurring issues
 * - Predictive analytics for upcoming situations
 * - Personalized improvement plans
 * - Team coordination insights
 */

import { 
  PlayerStats, 
  TeamStats, 
  StrategyDebt,
  GridEvent,
} from '../types/grid';

// =====================================================
// COACHING TYPES
// =====================================================

export interface CoachingContext {
  game: string;
  phase: 'early' | 'mid' | 'late' | 'overtime';
  roundNumber: number;
  score: { home: number; away: number };
  economy: { home: number; away: number };
  isAttacking: boolean;
  recentEvents: GridEvent[];
  playerStates: Map<string, PlayerState>;
}

export interface PlayerState {
  id: string;
  name: string;
  isAlive: boolean;
  health: number;
  armor: number;
  weapon: string;
  position?: { x: number; y: number; z?: number };
  kills: number;
  deaths: number;
  assistsThisRound: number;
  lastAction?: string;
}

export interface RealTimeCoachingInsight {
  id: string;
  timestamp: string;
  type: 'warning' | 'recommendation' | 'alert' | 'positive';
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  affectedPlayers: string[];
  suggestedAction: string;
  confidence: number;
  expiresAt?: string; // Time-sensitive recommendations
}

export interface ImprovementPlan {
  playerId: string;
  playerName: string;
  overallAssessment: 'excellent' | 'good' | 'needs_work' | 'critical';
  strengths: ImprovementArea[];
  weaknesses: ImprovementArea[];
  prioritizedActions: ImprovementAction[];
  estimatedTimeToImprove: string;
  progressMetrics: ProgressMetric[];
}

export interface ImprovementArea {
  area: string;
  score: number;        // 0-100
  description: string;
  examples: string[];
}

export interface ImprovementAction {
  priority: number;     // 1-10
  action: string;
  description: string;
  drills: string[];
  expectedOutcome: string;
  timeEstimate: string;
}

export interface ProgressMetric {
  metric: string;
  current: number;
  target: number;
  unit: string;
  trend: 'improving' | 'declining' | 'stable';
}

export interface TeamCoachingPlan {
  teamId: string;
  teamName: string;
  overallHealth: 'strong' | 'stable' | 'concerning' | 'critical';
  teamStrengths: string[];
  teamWeaknesses: string[];
  priorityFocusAreas: FocusArea[];
  practiceRecommendations: PracticeRecommendation[];
  strategicAdjustments: StrategicAdjustment[];
}

export interface FocusArea {
  area: string;
  urgency: 'high' | 'medium' | 'low';
  description: string;
  involvedPlayers: string[];
  targetImprovement: number;
}

export interface PracticeRecommendation {
  type: 'warmup' | 'drill' | 'scrimmage' | 'vod_review';
  name: string;
  duration: string;
  description: string;
  focusAreas: string[];
  participants: string[];
}

export interface StrategicAdjustment {
  situation: string;
  currentApproach: string;
  recommendedChange: string;
  expectedBenefit: string;
  confidence: number;
}

// =====================================================
// AI COACHING ENGINE CLASS
// =====================================================

export class AICoachingEngine {
  private context: CoachingContext | null = null;
  private insightHistory: RealTimeCoachingInsight[] = [];
  private patternMemory: Map<string, number> = new Map();
  
  /**
   * Update coaching context with new game state
   */
  updateContext(context: Partial<CoachingContext>): void {
    this.context = { ...this.context, ...context } as CoachingContext;
  }
  
  /**
   * Process a real-time game event and generate coaching insights
   */
  processEvent(event: GridEvent): RealTimeCoachingInsight[] {
    const insights: RealTimeCoachingInsight[] = [];
    
    switch (event.type) {
      case 'kill':
        insights.push(...this.processKillEvent(event));
        break;
      case 'death':
      case 'player_death':
        insights.push(...this.processDeathEvent(event));
        break;
      case 'round_start':
        insights.push(...this.processRoundStart(event));
        break;
      case 'round_end':
        insights.push(...this.processRoundEnd(event));
        break;
      case 'bomb_plant':
      case 'spike_plant':
        insights.push(...this.processPlantEvent(event));
        break;
      case 'economy_update':
        insights.push(...this.processEconomyUpdate(event));
        break;
      default:
        break;
    }
    
    // Track patterns
    this.trackPattern(event);
    
    // Store insights
    this.insightHistory.push(...insights);
    
    // Prune old insights
    this.pruneOldInsights();
    
    return insights;
  }
  
  /**
   * Process kill event for coaching insights
   */
  private processKillEvent(event: GridEvent): RealTimeCoachingInsight[] {
    const insights: RealTimeCoachingInsight[] = [];
    const { attacker, victim, isHeadshot, weapon } = event.data;
    
    // Check for positive feedback (headshot kills)
    if (isHeadshot) {
      insights.push({
        id: `kill-hs-${Date.now()}`,
        timestamp: event.timestamp,
        type: 'positive',
        urgency: 'low',
        title: 'Clean Headshot',
        message: `${attacker} secured a headshot kill on ${victim}`,
        affectedPlayers: [attacker as string],
        suggestedAction: 'Maintain crosshair placement',
        confidence: 0.95,
      });
    }
    
    // Check for multi-kill streak
    const recentKillsByAttacker = this.insightHistory
      .filter(i => i.type === 'positive' && i.affectedPlayers.includes(attacker as string))
      .filter(i => Date.now() - new Date(i.timestamp).getTime() < 15000)
      .length;
    
    if (recentKillsByAttacker >= 2) {
      insights.push({
        id: `multikill-${Date.now()}`,
        timestamp: event.timestamp,
        type: 'positive',
        urgency: 'medium',
        title: 'Multi-Kill Streak',
        message: `${attacker} is on a ${recentKillsByAttacker + 1} kill streak!`,
        affectedPlayers: [attacker as string],
        suggestedAction: 'Capitalize on momentum - consider aggressive play',
        confidence: 0.9,
      });
    }
    
    // AWP economy consideration
    if (weapon === 'awp' || weapon === 'operator') {
      insights.push({
        id: `awp-kill-${Date.now()}`,
        timestamp: event.timestamp,
        type: 'recommendation',
        urgency: 'medium',
        title: 'AWP Position Revealed',
        message: `${attacker}'s AWP position is now revealed`,
        affectedPlayers: [attacker as string],
        suggestedAction: 'Consider repositioning to maintain angle advantage',
        confidence: 0.85,
      });
    }
    
    return insights;
  }
  
  /**
   * Process death event for coaching insights
   */
  private processDeathEvent(event: GridEvent): RealTimeCoachingInsight[] {
    const insights: RealTimeCoachingInsight[] = [];
    const { victim } = event.data;
    
    // Check for early round death pattern
    const patternKey = `early_death_${victim}`;
    const earlyDeathCount = this.patternMemory.get(patternKey) || 0;
    
    if (this.context?.phase === 'early' && earlyDeathCount >= 2) {
      insights.push({
        id: `pattern-early-death-${Date.now()}`,
        timestamp: event.timestamp,
        type: 'warning',
        urgency: 'high',
        title: 'Recurring Early Death Pattern',
        message: `${victim} has died early ${earlyDeathCount + 1} times - pattern detected`,
        affectedPlayers: [victim as string],
        suggestedAction: 'Play more passive position early in rounds. Wait for team support.',
        confidence: 0.88,
      });
    }
    
    // Man disadvantage warning
    if (this.context) {
      insights.push({
        id: `man-disadvantage-${Date.now()}`,
        timestamp: event.timestamp,
        type: 'alert',
        urgency: 'immediate',
        title: 'Man Disadvantage',
        message: `Team now at player disadvantage after ${victim}'s death`,
        affectedPlayers: [],
        suggestedAction: 'Adjust strategy - consider fallback or trade positions',
        confidence: 0.95,
        expiresAt: new Date(Date.now() + 30000).toISOString(),
      });
    }
    
    return insights;
  }
  
  /**
   * Process round start for coaching insights
   */
  private processRoundStart(event: GridEvent): RealTimeCoachingInsight[] {
    const insights: RealTimeCoachingInsight[] = [];
    
    // Economy-based recommendations
    if (this.context) {
      const teamEconomy = this.context.economy.home;
      const opponentEconomy = this.context.economy.away;
      
      if (teamEconomy < 2000 && opponentEconomy > 4000) {
        insights.push({
          id: `eco-save-${Date.now()}`,
          timestamp: event.timestamp,
          type: 'recommendation',
          urgency: 'high',
          title: 'Economy Reset Recommended',
          message: 'Low economy vs opponent full buy - consider eco round',
          affectedPlayers: [],
          suggestedAction: 'Save for full buy next round. Play for information without dying.',
          confidence: 0.82,
          expiresAt: new Date(Date.now() + 20000).toISOString(),
        });
      } else if (teamEconomy > 4000) {
        insights.push({
          id: `full-buy-${Date.now()}`,
          timestamp: event.timestamp,
          type: 'recommendation',
          urgency: 'medium',
          title: 'Full Buy Available',
          message: 'Economy supports full utility and armor',
          affectedPlayers: [],
          suggestedAction: 'Ensure all players have full utility. Consider team upgrades.',
          confidence: 0.9,
          expiresAt: new Date(Date.now() + 15000).toISOString(),
        });
      }
    }
    
    return insights;
  }
  
  /**
   * Process round end for coaching insights
   */
  private processRoundEnd(event: GridEvent): RealTimeCoachingInsight[] {
    const insights: RealTimeCoachingInsight[] = [];
    // Event data available: event.data for future enhancements
    
    // Match point awareness
    if (this.context) {
      const homeScore = this.context.score.home;
      const awayScore = this.context.score.away;
      
      if (homeScore === 12 || awayScore === 12) {
        insights.push({
          id: `match-point-${Date.now()}`,
          timestamp: event.timestamp,
          type: 'alert',
          urgency: 'high',
          title: 'Match Point Round',
          message: homeScore === 12 ? 'We are at match point!' : 'Opponent at match point!',
          affectedPlayers: [],
          suggestedAction: homeScore === 12 
            ? 'Stay focused, execute default strategy confidently'
            : 'Play aggressive but smart. Take calculated risks.',
          confidence: 0.95,
        });
      }
    }
    
    return insights;
  }
  
  /**
   * Process plant event for coaching insights
   */
  private processPlantEvent(event: GridEvent): RealTimeCoachingInsight[] {
    const insights: RealTimeCoachingInsight[] = [];
    
    insights.push({
      id: `post-plant-${Date.now()}`,
      timestamp: event.timestamp,
      type: 'recommendation',
      urgency: 'immediate',
      title: 'Post-Plant Setup',
      message: 'Bomb planted - set up crossfires',
      affectedPlayers: [],
      suggestedAction: 'Take defensive positions with crossfire angles. Play time, not kills.',
      confidence: 0.92,
      expiresAt: new Date(Date.now() + 45000).toISOString(),
    });
    
    return insights;
  }
  
  /**
   * Process economy update for coaching insights
   */
  private processEconomyUpdate(event: GridEvent): RealTimeCoachingInsight[] {
    const insights: RealTimeCoachingInsight[] = [];
    const { playerEconomy } = event.data;
    
    // Check for economy imbalances within team
    if (playerEconomy) {
      const values = Object.values(playerEconomy as Record<string, number>);
      const maxEcon = Math.max(...values);
      const minEcon = Math.min(...values);
      
      if (maxEcon - minEcon > 3000) {
        insights.push({
          id: `econ-imbalance-${Date.now()}`,
          timestamp: event.timestamp,
          type: 'recommendation',
          urgency: 'medium',
          title: 'Economy Imbalance',
          message: 'Significant economy difference between teammates',
          affectedPlayers: [],
          suggestedAction: 'Consider weapon drops to balance team buying power',
          confidence: 0.78,
        });
      }
    }
    
    return insights;
  }
  
  /**
   * Track patterns in game events
   */
  private trackPattern(event: GridEvent): void {
    if (event.type === 'kill' || event.type === 'death') {
      const victim = event.data.victim as string;
      if (this.context?.phase === 'early') {
        const key = `early_death_${victim}`;
        this.patternMemory.set(key, (this.patternMemory.get(key) || 0) + 1);
      }
    }
  }
  
  /**
   * Prune old insights to prevent memory growth
   */
  private pruneOldInsights(): void {
    const cutoff = Date.now() - 5 * 60 * 1000; // 5 minutes
    this.insightHistory = this.insightHistory.filter(
      i => new Date(i.timestamp).getTime() > cutoff
    );
  }
  
  /**
   * Generate a personalized improvement plan for a player
   */
  generatePlayerImprovementPlan(
    player: PlayerStats,
    mistakes: Array<{ type: string; severity: string; description: string; recommendation: string }>,
    _teamContext: TeamStats
  ): ImprovementPlan {
    const strengths: ImprovementArea[] = [];
    const weaknesses: ImprovementArea[] = [];
    const actions: ImprovementAction[] = [];
    
    // Analyze strengths
    if (player.kda >= 1.5) {
      strengths.push({
        area: 'Combat Efficiency',
        score: Math.min(player.kda * 40, 100),
        description: 'Strong kill/death/assist ratio indicates good combat decision-making',
        examples: [`${player.kda.toFixed(2)} KDA across analyzed games`],
      });
    }
    
    if ((player.firstKillRate || 0) > 0.15) {
      strengths.push({
        area: 'Entry Fragging',
        score: Math.min((player.firstKillRate || 0) * 400, 100),
        description: 'Excellent at creating opening picks',
        examples: [`${((player.firstKillRate || 0) * 100).toFixed(1)}% first kill rate`],
      });
    }
    
    if ((player.headshotPercentage || 0) > 0.4) {
      strengths.push({
        area: 'Mechanical Skill',
        score: (player.headshotPercentage || 0) * 100,
        description: 'High headshot percentage indicates excellent aim',
        examples: [`${((player.headshotPercentage || 0) * 100).toFixed(1)}% headshot rate`],
      });
    }
    
    if ((player.clutchWinRate || 0) > 0.3) {
      strengths.push({
        area: 'Clutch Ability',
        score: (player.clutchWinRate || 0) * 100,
        description: 'Reliable in high-pressure situations',
        examples: [`${((player.clutchWinRate || 0) * 100).toFixed(1)}% clutch success rate`],
      });
    }
    
    // Analyze weaknesses
    if ((player.firstDeathRate || 0) > 0.15) {
      weaknesses.push({
        area: 'Positioning',
        score: Math.max(0, 100 - (player.firstDeathRate || 0) * 300),
        description: 'Dying first too often, creating team disadvantages',
        examples: [`${((player.firstDeathRate || 0) * 100).toFixed(1)}% first death rate`],
      });
      
      actions.push({
        priority: 9,
        action: 'Improve Early Round Positioning',
        description: 'Focus on safer positions in opening seconds of rounds',
        drills: [
          'Position holding drills in custom games',
          'Review professional VODs for position inspiration',
          'Practice information gathering without exposing yourself',
        ],
        expectedOutcome: 'Reduce first death rate by 30-40%',
        timeEstimate: '2-3 weeks of focused practice',
      });
    }
    
    if (player.kda < 1.0) {
      weaknesses.push({
        area: 'Combat Performance',
        score: Math.max(0, player.kda * 100),
        description: 'Below average combat effectiveness',
        examples: [`${player.kda.toFixed(2)} KDA needs improvement`],
      });
      
      actions.push({
        priority: 8,
        action: 'Combat Fundamentals Training',
        description: 'Focus on crosshair placement and angle holding',
        drills: [
          '15 minutes daily aim training',
          'Crosshair placement practice in deathmatch',
          'Angle isolation exercises',
        ],
        expectedOutcome: 'Improve KDA to 1.2+',
        timeEstimate: '3-4 weeks',
      });
    }
    
    if ((player.tradeDifferential || 0) < -2) {
      weaknesses.push({
        area: 'Trade Awareness',
        score: Math.max(0, 50 + (player.tradeDifferential || 0) * 10),
        description: 'Not creating tradeable situations for team',
        examples: [`Trade differential: ${player.tradeDifferential || 0}`],
      });
      
      actions.push({
        priority: 7,
        action: 'Trade Position Training',
        description: 'Learn to position for team trades',
        drills: [
          'Practice with teammate in 2v2 scenarios',
          'Communication drills for callouts',
          'Trade refrag timing exercises',
        ],
        expectedOutcome: 'Neutral or positive trade differential',
        timeEstimate: '2 weeks',
      });
    }
    
    // Add weakness-specific actions from detected mistakes
    for (const mistake of mistakes.slice(0, 3)) {
      if (mistake.severity === 'critical' || mistake.severity === 'high') {
        actions.push({
          priority: 8,
          action: `Address: ${mistake.type}`,
          description: mistake.description,
          drills: [mistake.recommendation],
          expectedOutcome: 'Eliminate recurring mistake pattern',
          timeEstimate: '1-2 weeks',
        });
      }
    }
    
    // Determine overall assessment
    let overallAssessment: ImprovementPlan['overallAssessment'];
    const impactScore = player.impactScore || 50;
    
    if (impactScore >= 70 && weaknesses.length <= 1) {
      overallAssessment = 'excellent';
    } else if (impactScore >= 50 && weaknesses.length <= 2) {
      overallAssessment = 'good';
    } else if (impactScore >= 30) {
      overallAssessment = 'needs_work';
    } else {
      overallAssessment = 'critical';
    }
    
    // Create progress metrics
    const progressMetrics: ProgressMetric[] = [
      {
        metric: 'KDA',
        current: player.kda,
        target: Math.max(player.kda, 1.5),
        unit: 'ratio',
        trend: player.kda >= 1.2 ? 'stable' : 'declining',
      },
      {
        metric: 'Impact Rating',
        current: impactScore,
        target: 70,
        unit: 'score',
        trend: impactScore >= 50 ? 'stable' : 'declining',
      },
      {
        metric: 'First Death Rate',
        current: (player.firstDeathRate || 0) * 100,
        target: 10,
        unit: '%',
        trend: (player.firstDeathRate || 0) < 0.15 ? 'improving' : 'declining',
      },
    ];
    
    return {
      playerId: player.id,
      playerName: player.name,
      overallAssessment,
      strengths,
      weaknesses,
      prioritizedActions: actions.sort((a, b) => b.priority - a.priority),
      estimatedTimeToImprove: this.calculateTimeToImprove(actions),
      progressMetrics,
    };
  }
  
  /**
   * Generate a team coaching plan
   */
  generateTeamCoachingPlan(
    team: TeamStats,
    strategyDebt: StrategyDebt
  ): TeamCoachingPlan {
    const teamStrengths: string[] = [];
    const teamWeaknesses: string[] = [];
    const focusAreas: FocusArea[] = [];
    const practiceRecommendations: PracticeRecommendation[] = [];
    const strategicAdjustments: StrategicAdjustment[] = [];
    
    // Analyze team strengths
    if (team.roundWinRate > 0.55) {
      teamStrengths.push('Strong overall round conversion');
    }
    if (team.attackWinRate > 0.6 && team.defenseWinRate > 0.5) {
      teamStrengths.push('Balanced performance on both sides');
    }
    if (team.coordination > 0.7) {
      teamStrengths.push('Excellent team coordination');
    }
    
    // Find star players
    const topPlayers = team.players
      .filter(p => (p.impactScore || 0) > 65)
      .map(p => p.name);
    if (topPlayers.length > 0) {
      teamStrengths.push(`High-impact players: ${topPlayers.join(', ')}`);
    }
    
    // Analyze team weaknesses
    if (team.roundWinRate < 0.45) {
      teamWeaknesses.push('Low round conversion rate');
      focusAreas.push({
        area: 'Round Conversion',
        urgency: 'high',
        description: 'Team is losing more rounds than winning',
        involvedPlayers: [],
        targetImprovement: 15,
      });
    }
    
    const sideImbalance = Math.abs(team.attackWinRate - team.defenseWinRate);
    if (sideImbalance > 0.2) {
      const weakSide = team.attackWinRate < team.defenseWinRate ? 'Attack' : 'Defense';
      teamWeaknesses.push(`Weak ${weakSide} side performance`);
      focusAreas.push({
        area: `${weakSide} Side Play`,
        urgency: 'high',
        description: `${(sideImbalance * 100).toFixed(0)}% lower win rate on ${weakSide}`,
        involvedPlayers: [],
        targetImprovement: sideImbalance * 50,
      });
      
      strategicAdjustments.push({
        situation: `${weakSide} side rounds`,
        currentApproach: 'Default strategies',
        recommendedChange: `Develop 2-3 new ${weakSide.toLowerCase()} side executes`,
        expectedBenefit: `Improve ${weakSide.toLowerCase()} win rate by 10-15%`,
        confidence: 0.78,
      });
    }
    
    if (team.coordination < 0.5) {
      teamWeaknesses.push('Poor team coordination');
      focusAreas.push({
        area: 'Team Coordination',
        urgency: 'high',
        description: 'Inconsistent performance across roles',
        involvedPlayers: team.players.map(p => p.name),
        targetImprovement: 25,
      });
      
      practiceRecommendations.push({
        type: 'drill',
        name: 'Trade Drill Sessions',
        duration: '30 minutes',
        description: 'Practice buddy system and trade positioning',
        focusAreas: ['Trading', 'Communication', 'Positioning'],
        participants: team.players.slice(0, 2).map(p => p.name),
      });
    }
    
    // Add strategy debt-based focus areas
    for (const item of strategyDebt.items.slice(0, 3)) {
      if (item.debtScore > 10) {
        focusAreas.push({
          area: item.description,
          urgency: item.debtScore > 20 ? 'high' : 'medium',
          description: item.recommendation,
          involvedPlayers: item.category === 'individual' ? [item.source] : [],
          targetImprovement: item.debtScore,
        });
      }
    }
    
    // Generate practice recommendations
    practiceRecommendations.push({
      type: 'warmup',
      name: 'Pre-Match Warmup Routine',
      duration: '20 minutes',
      description: 'Standardized team warmup before matches',
      focusAreas: ['Aim', 'Communication', 'Coordination'],
      participants: team.players.map(p => p.name),
    });
    
    practiceRecommendations.push({
      type: 'vod_review',
      name: 'Weekly VOD Review',
      duration: '1 hour',
      description: 'Review recent matches focusing on identified issues',
      focusAreas: focusAreas.map(f => f.area),
      participants: team.players.map(p => p.name),
    });
    
    if (focusAreas.length > 0) {
      practiceRecommendations.push({
        type: 'drill',
        name: 'Focus Area Practice',
        duration: '45 minutes',
        description: `Targeted practice on: ${focusAreas[0].area}`,
        focusAreas: [focusAreas[0].area],
        participants: focusAreas[0].involvedPlayers.length > 0 
          ? focusAreas[0].involvedPlayers 
          : team.players.map(p => p.name),
      });
    }
    
    // Determine overall health
    let overallHealth: TeamCoachingPlan['overallHealth'];
    if (strategyDebt.level === 'critical' || teamWeaknesses.length >= 3) {
      overallHealth = 'critical';
    } else if (strategyDebt.level === 'warning' || teamWeaknesses.length >= 2) {
      overallHealth = 'concerning';
    } else if (teamStrengths.length >= 3) {
      overallHealth = 'strong';
    } else {
      overallHealth = 'stable';
    }
    
    return {
      teamId: team.id,
      teamName: team.name,
      overallHealth,
      teamStrengths,
      teamWeaknesses,
      priorityFocusAreas: focusAreas.sort((a, b) => 
        (b.urgency === 'high' ? 3 : b.urgency === 'medium' ? 2 : 1) -
        (a.urgency === 'high' ? 3 : a.urgency === 'medium' ? 2 : 1)
      ),
      practiceRecommendations,
      strategicAdjustments,
    };
  }
  
  /**
   * Calculate estimated time to improve based on actions
   */
  private calculateTimeToImprove(actions: ImprovementAction[]): string {
    if (actions.length === 0) return 'Maintenance mode';
    
    const highPriorityCount = actions.filter(a => a.priority >= 8).length;
    
    if (highPriorityCount >= 3) {
      return '4-6 weeks of focused practice';
    } else if (highPriorityCount >= 1) {
      return '2-4 weeks of focused practice';
    } else {
      return '1-2 weeks of refinement';
    }
  }
  
  /**
   * Get recent insights from history
   */
  getRecentInsights(limit: number = 10): RealTimeCoachingInsight[] {
    return this.insightHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
  
  /**
   * Clear pattern memory (call between matches)
   */
  clearPatterns(): void {
    this.patternMemory.clear();
    this.insightHistory = [];
    this.context = null;
  }
}

// Export singleton instance
export const aiCoach = new AICoachingEngine();
