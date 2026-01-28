export interface GameState {
  roundNumber: number;
  score: {
    home: number;
    away: number;
  };
  economyDiff: number;
  manAdvantage: number;
  objectivesControlled: number;
  phase: 'early' | 'mid' | 'late';
  strategyDebt: number;
}

export interface WinProbabilityFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
}

export interface WinProbabilityResult {
  probability: number;
  confidence: number;
  factors: WinProbabilityFactor[];
  trend: 'increasing' | 'decreasing' | 'stable';
  delta: number;
}

export class WinProbabilityModel {
  private previousProbability: number = 0.5;
  private probabilityHistory: Array<{ timestamp: string; probability: number }> = [];

  // Bayesian prior weights (these would be learned from historical data in production)
  private weights = {
    scoreAdvantage: 0.25,
    economyAdvantage: 0.20,
    manAdvantage: 0.30,
    objectiveControl: 0.15,
    strategyDebt: -0.10
  };

  calculate(state: GameState): WinProbabilityResult {
    const factors: WinProbabilityFactor[] = [];

    // 1. Score advantage
    const scoreAdv = (state.score.home - state.score.away) / 13; // Normalized to BO13
    const scoreContribution = this.weights.scoreAdvantage * scoreAdv;
    factors.push({
      name: 'Score Advantage',
      weight: this.weights.scoreAdvantage,
      value: scoreAdv,
      contribution: scoreContribution
    });

    // 2. Economy advantage
    const economyNorm = Math.tanh(state.economyDiff / 10000); // Normalize economy diff
    const economyContribution = this.weights.economyAdvantage * economyNorm;
    factors.push({
      name: 'Economy Advantage',
      weight: this.weights.economyAdvantage,
      value: economyNorm,
      contribution: economyContribution
    });

    // 3. Man advantage (current round)
    const manAdv = state.manAdvantage / 5; // Normalized to max 5 player advantage
    const manContribution = this.weights.manAdvantage * manAdv;
    factors.push({
      name: 'Man Advantage',
      weight: this.weights.manAdvantage,
      value: manAdv,
      contribution: manContribution
    });

    // 4. Objective control
    const objControl = (state.objectivesControlled - 0.5) * 2; // Normalize to [-1, 1]
    const objContribution = this.weights.objectiveControl * objControl;
    factors.push({
      name: 'Objective Control',
      weight: this.weights.objectiveControl,
      value: objControl,
      contribution: objContribution
    });

    // 5. Strategy Debt (negative impact)
    const debtNorm = Math.min(state.strategyDebt / 100, 1); // Normalize to [0, 1]
    const debtContribution = this.weights.strategyDebt * debtNorm;
    factors.push({
      name: 'Strategy Debt',
      weight: this.weights.strategyDebt,
      value: debtNorm,
      contribution: debtContribution
    });

    // Calculate total probability using logistic function (Bayesian approach)
    const logit = factors.reduce((sum, f) => sum + f.contribution, 0);
    const probability = this.sigmoid(logit);

    // Ensure probability is within reasonable bounds
    const boundedProbability = Math.max(0.05, Math.min(0.95, probability));

    // Calculate confidence based on consistency of factors
    const confidence = this.calculateConfidence(factors);

    // Determine trend
    const delta = boundedProbability - this.previousProbability;
    const trend = Math.abs(delta) < 0.02 ? 'stable' :
                  delta > 0 ? 'increasing' : 'decreasing';

    // Update history
    this.probabilityHistory.push({
      timestamp: new Date().toISOString(),
      probability: boundedProbability
    });

    // Keep only last 100 entries
    if (this.probabilityHistory.length > 100) {
      this.probabilityHistory.shift();
    }

    this.previousProbability = boundedProbability;

    return {
      probability: boundedProbability,
      confidence,
      factors,
      trend,
      delta
    };
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x * 4)); // Scaled sigmoid for sensitivity
  }

  private calculateConfidence(factors: WinProbabilityFactor[]): number {
    // Confidence is higher when factors are consistent (all pointing same direction)
    const contributions = factors.map(f => f.contribution);
    const mean = contributions.reduce((a, b) => a + b, 0) / contributions.length;
    const variance = contributions.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / contributions.length;

    // Low variance = high confidence
    const confidence = 1 - Math.min(variance * 2, 1);
    return Math.max(0.3, confidence); // Minimum confidence of 30%
  }

  getProbabilityHistory(): Array<{ timestamp: string; probability: number }> {
    return this.probabilityHistory;
  }

  getRecentTrend(windowSize: number = 10): 'increasing' | 'decreasing' | 'stable' {
    if (this.probabilityHistory.length < windowSize) {
      return 'stable';
    }

    const recent = this.probabilityHistory.slice(-windowSize);
    const firstHalf = recent.slice(0, Math.floor(windowSize / 2));
    const secondHalf = recent.slice(Math.floor(windowSize / 2));

    const firstAvg = firstHalf.reduce((sum, p) => sum + p.probability, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.probability, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (Math.abs(diff) < 0.03) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }

  simulateCounterfactual(state: GameState, modifications: Partial<GameState>): WinProbabilityResult {
    // Create modified state
    const modifiedState = { ...state, ...modifications };
    return this.calculate(modifiedState);
  }

  reset(): void {
    this.previousProbability = 0.5;
    this.probabilityHistory = [];
  }

  // Monte Carlo simulation for uncertainty quantification
  monteCarloSimulation(state: GameState, iterations: number = 1000): {
    mean: number;
    median: number;
    stdDev: number;
    percentiles: { p10: number; p25: number; p75: number; p90: number };
  } {
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Add noise to each factor
      const noisyState: GameState = {
        ...state,
        economyDiff: state.economyDiff + (Math.random() - 0.5) * 2000,
        manAdvantage: state.manAdvantage + (Math.random() - 0.5) * 0.5,
        objectivesControlled: Math.max(0, Math.min(1, state.objectivesControlled + (Math.random() - 0.5) * 0.1)),
        strategyDebt: state.strategyDebt + (Math.random() - 0.5) * 10
      };

      const result = this.calculate(noisyState);
      results.push(result.probability);
    }

    results.sort((a, b) => a - b);

    const mean = results.reduce((a, b) => a + b, 0) / results.length;
    const median = results[Math.floor(results.length / 2)];

    const variance = results.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median,
      stdDev,
      percentiles: {
        p10: results[Math.floor(results.length * 0.1)],
        p25: results[Math.floor(results.length * 0.25)],
        p75: results[Math.floor(results.length * 0.75)],
        p90: results[Math.floor(results.length * 0.9)]
      }
    };
  }
}
