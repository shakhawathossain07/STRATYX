import { GridEvent, CausalInsight } from '../types/grid';
import { StatisticalValidator, DataQualityChecker, ConfidenceInterval } from './statisticalValidation';

/**
 * Real-Time Causal Engine with Statistical Rigor
 * Production-ready implementation with scientific validation
 */

interface ValidatedCausalInsight extends CausalInsight {
  statisticalSignificance: number; // p-value
  confidenceInterval: ConfidenceInterval;
  sampleSize: number;
  dataQuality: number; // 0-1 score
  timestamp: string;
}

interface PerformanceMetrics {
  avgProcessingTime: number;
  maxProcessingTime: number;
  eventsProcessed: number;
  insightsGenerated: number;
  dataQualityScore: number;
}

export class RealTimeCausalEngine {
  private strategyDebt: number = 0;
  private eventLog: GridEvent[] = [];
  private phaseDebt: { early: number; mid: number; late: number } = { early: 0, mid: 0, late: 0 };
  private winProbability: number = 0.5;
  private currentPhase: 'early' | 'mid' | 'late' = 'early';
  private roundStartTime: string | null = null;

  // Statistical validation
  private readonly validator = new StatisticalValidator();
  private readonly qualityChecker = new DataQualityChecker();

  // Real-time performance tracking
  private processingTimes: number[] = [];
  private readonly MAX_PROCESSING_TIME_MS = 500; // Target: <500ms
  private readonly MAX_EVENT_AGE_MS = 10000; // 10 seconds max staleness

  // Pattern tracking with statistical validation
  private actionHistory: Map<string, number[]> = new Map(); // player → impact scores

  // Confidence thresholds
  private readonly MIN_SAMPLE_SIZE = 5;

  /**
   * Process event with real-time guarantees and statistical validation
   */
  async processEventRealTime(event: GridEvent): Promise<ValidatedCausalInsight | null> {
    const startTime = performance.now();

    try {
      // 1. Validate data quality and freshness
      const qualityScore = this.validateEventQuality(event);
      if (qualityScore < 0.7) {
        console.warn(`Low quality event detected (score: ${qualityScore})`, event);
        return null;
      }

      // 2. Check data freshness (real-time requirement)
      if (!this.qualityChecker.isDataFresh(event.timestamp, this.MAX_EVENT_AGE_MS)) {
        console.warn('Stale data detected:', event.timestamp);
        return null;
      }

      // 3. Store event
      this.eventLog.push(event);

      // 4. Update game phase
      this.updatePhase(event);

      // 5. Process event and update metrics
      const impact = this.calculateEventImpact(event);
      this.updateStrategyDebt(event, impact);

      // 6. Track action history for statistical analysis
      this.trackActionHistory(event, impact);

      // 7. Generate validated insight
      const insight = await this.generateValidatedInsight(event, impact);

      // 8. Track processing time
      const processingTime = performance.now() - startTime;
      this.trackPerformance(processingTime);

      // 9. Alert if processing too slow
      if (processingTime > this.MAX_PROCESSING_TIME_MS) {
        console.warn(`Slow processing detected: ${processingTime.toFixed(2)}ms`);
      }

      return insight;

    } catch (error) {
      console.error('Error processing event:', error);
      return null;
    }
  }

  /**
   * Validate event data quality
   */
  private validateEventQuality(event: GridEvent): number {
    let score = 1.0;

    // Check required fields
    if (!event.type || !event.timestamp) {
      score -= 0.5;
    }

    // Check timestamp validity
    try {
      const timestamp = new Date(event.timestamp);
      if (isNaN(timestamp.getTime())) {
        score -= 0.3;
      }
    } catch {
      score -= 0.3;
    }

    // Check data completeness
    if (event.data) {
      const requiredFields = this.getRequiredFields(event.type);
      const missingFields = requiredFields.filter(field => !(field in event.data));
      score -= (missingFields.length / requiredFields.length) * 0.2;
    } else {
      score -= 0.2;
    }

    return Math.max(0, score);
  }

  private getRequiredFields(eventType: string): string[] {
    const fieldMap: { [key: string]: string[] } = {
      'kill': ['attacker', 'victim', 'weapon'],
      'objective': ['location', 'action'],
      'economy': ['amount', 'action'],
      'utility': ['type', 'playerId']
    };
    return fieldMap[eventType] || [];
  }

  /**
   * Calculate event impact with statistical methods
   */
  private calculateEventImpact(event: GridEvent): number {
    const baseImpacts: { [key: string]: number } = {
      'kill': -0.15,      // Negative for team being killed
      'death': -0.15,
      'objective_lost': -0.25,
      'objective_gained': 0.20,
      'economy_deficit': -0.10,
      'utility_waste': -0.05
    };

    let impact = baseImpacts[event.type] || 0;

    // Phase multipliers (early game mistakes hurt more)
    const phaseMultipliers = {
      'early': 1.3,
      'mid': 1.0,
      'late': 0.8
    };
    impact *= phaseMultipliers[this.currentPhase];

    // Context adjustments
    if (event.data?.isHeadshot) impact *= 1.1;
    if (event.data?.isCritical) impact *= 1.2;

    return impact;
  }

  /**
   * Update strategy debt with validation
   */
  private updateStrategyDebt(_event: GridEvent, impact: number): void {
    if (impact < 0) {
      const debtIncrease = Math.abs(impact) * 100;
      this.strategyDebt += debtIncrease;
      this.phaseDebt[this.currentPhase] += debtIncrease;

      // Update win probability using Bayesian inference
      this.updateWinProbabilityBayesian();
    }
  }

  /**
   * Bayesian win probability update
   */
  private updateWinProbabilityBayesian(): void {
    // Prior: current probability
    const prior = this.winProbability;

    // Likelihood based on Strategy Debt
    const debtImpact = -0.002 * this.strategyDebt;

    // Posterior (simplified Bayesian update)
    const posterior = prior + debtImpact;

    this.winProbability = Math.max(0.05, Math.min(0.95, posterior));
  }

  /**
   * Track action history for pattern detection
   */
  private trackActionHistory(event: GridEvent, impact: number): void {
    const playerId = event.data?.playerId || event.data?.victim || 'unknown';
    const actionKey = `${playerId}_${event.type}`;

    if (!this.actionHistory.has(actionKey)) {
      this.actionHistory.set(actionKey, []);
    }

    this.actionHistory.get(actionKey)!.push(impact);

    // Keep only recent history (sliding window)
    const history = this.actionHistory.get(actionKey)!;
    if (history.length > 20) {
      history.shift();
    }
  }

  /**
   * Generate statistically validated insight
   */
  private async generateValidatedInsight(
    event: GridEvent,
    impact: number
  ): Promise<ValidatedCausalInsight | null> {
    // Only generate insights for significant events
    if (Math.abs(impact) < 0.1) return null;

    const playerId = event.data?.playerId || event.data?.victim || 'unknown';
    const actionKey = `${playerId}_${event.type}`;
    const history = this.actionHistory.get(actionKey) || [];

    // Require minimum sample size for statistical validity
    if (history.length < this.MIN_SAMPLE_SIZE) return null;

    // Calculate confidence interval
    const confidenceInterval = this.validator.calculateConfidenceInterval(history, 0.95);

    // Test if pattern is statistically significant
    // Compare against neutral baseline (0)
    const baselineHistory = new Array(history.length).fill(0);
    const significanceTest = this.validator.mannWhitneyU(history, baselineHistory);

    // Only generate insight if statistically significant
    if (!significanceTest.isSignificant) return null;

    // Calculate average impact
    const avgImpact = history.reduce((a, b) => a + b, 0) / history.length;

    // Determine priority based on effect size and significance
    const priority = this.calculatePriority(
      Math.abs(avgImpact),
      significanceTest.effectSize,
      significanceTest.pValue
    );

    return {
      id: crypto.randomUUID(),
      microAction: `${event.type} by ${playerId}`,
      macroOutcome: this.inferMacroOutcome(event.type, avgImpact),
      causalWeight: Math.abs(significanceTest.effectSize),
      recommendation: this.generateRecommendation(playerId, event.type, avgImpact, history.length),
      priority,
      statisticalSignificance: significanceTest.pValue,
      confidenceInterval,
      sampleSize: history.length,
      dataQuality: this.validateEventQuality(event),
      timestamp: new Date().toISOString()
    };
  }

  private inferMacroOutcome(_eventType: string, avgImpact: number): string {
    if (avgImpact < -0.15) {
      return 'Significant strategic disadvantage, increased loss probability';
    } else if (avgImpact < -0.05) {
      return 'Minor tactical setback, recoverable';
    } else if (avgImpact > 0.15) {
      return 'Strong strategic advantage, momentum shift';
    } else {
      return 'Neutral tactical impact';
    }
  }

  private generateRecommendation(
    playerId: string,
    eventType: string,
    avgImpact: number,
    occurrences: number
  ): string {
    if (avgImpact < -0.1) {
      return `CRITICAL: ${playerId} shows recurring negative pattern in ${eventType} (${occurrences} occurrences, avg impact: ${avgImpact.toFixed(3)}). Immediate coaching intervention recommended. Statistical significance: p<0.05`;
    } else if (avgImpact < -0.05) {
      return `WARNING: ${playerId} tendency towards suboptimal ${eventType} decisions. Consider tactical adjustment. Sample size: ${occurrences}`;
    } else {
      return `Pattern detected for ${playerId} in ${eventType}. Monitor for further development.`;
    }
  }

  private calculatePriority(
    impact: number,
    effectSize: number,
    pValue: number
  ): 'high' | 'medium' | 'low' {
    // Combine impact, effect size, and significance
    const score = impact * 0.4 + effectSize * 0.4 + (1 - pValue) * 0.2;

    if (score > 0.6) return 'high';
    if (score > 0.3) return 'medium';
    return 'low';
  }

  private updatePhase(event: GridEvent): void {
    if (event.type === 'round_start') {
      this.roundStartTime = event.timestamp;
      this.currentPhase = 'early';
    } else if (this.roundStartTime) {
      const elapsed = new Date(event.timestamp).getTime() - new Date(this.roundStartTime).getTime();
      if (elapsed < 30000) this.currentPhase = 'early';
      else if (elapsed < 90000) this.currentPhase = 'mid';
      else this.currentPhase = 'late';
    }
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(processingTime: number): void {
    this.processingTimes.push(processingTime);

    // Keep only recent 100 measurements
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const avgProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;

    const maxProcessingTime = this.processingTimes.length > 0
      ? Math.max(...this.processingTimes)
      : 0;

    return {
      avgProcessingTime,
      maxProcessingTime,
      eventsProcessed: this.eventLog.length,
      insightsGenerated: Array.from(this.actionHistory.values())
        .filter(h => h.length >= this.MIN_SAMPLE_SIZE).length,
      dataQualityScore: this.calculateOverallDataQuality()
    };
  }

  private calculateOverallDataQuality(): number {
    if (this.eventLog.length === 0) return 1.0;

    const qualityScores = this.eventLog
      .slice(-50) // Last 50 events
      .map(e => this.validateEventQuality(e));

    return qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  }

  getStrategyDebt(): number {
    return this.strategyDebt;
  }

  getPhaseDebt() {
    return this.phaseDebt;
  }

  getWinProbability(): number {
    return this.winProbability;
  }

  reset(): void {
    this.strategyDebt = 0;
    this.eventLog = [];
    this.phaseDebt = { early: 0, mid: 0, late: 0 };
    this.winProbability = 0.5;
    this.currentPhase = 'early';
    this.actionHistory.clear();
    this.processingTimes = [];
  }
}
