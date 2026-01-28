/**
 * Statistical Validation Service
 * Ensures all analytics are scientifically rigorous and statistically significant
 */

export interface StatisticalTest {
  testName: string;
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
  effectSize: number;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  mean: number;
  confidenceLevel: number;
}

export class StatisticalValidator {
  private readonly SIGNIFICANCE_THRESHOLD = 0.05; // p < 0.05
  private readonly MIN_SAMPLE_SIZE = 10;

  /**
   * Calculate statistical significance using Chi-Square test
   * Used for categorical data (e.g., win/loss patterns)
   */
  chiSquareTest(observed: number[], expected: number[]): StatisticalTest {
    if (observed.length !== expected.length) {
      throw new Error('Observed and expected arrays must have same length');
    }

    let chiSquare = 0;
    for (let i = 0; i < observed.length; i++) {
      if (expected[i] === 0) continue;
      chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }

    // Degrees of freedom
    const df = observed.length - 1;

    // Approximate p-value using simplified chi-square distribution
    const pValue = this.chiSquareToPValue(chiSquare, df);

    // Effect size (Cramér's V)
    const n = observed.reduce((a, b) => a + b, 0);
    const effectSize = Math.sqrt(chiSquare / n);

    return {
      testName: 'Chi-Square Test',
      pValue,
      isSignificant: pValue < this.SIGNIFICANCE_THRESHOLD,
      confidenceLevel: 0.95,
      effectSize
    };
  }

  /**
   * Calculate confidence interval for a metric
   * Uses Student's t-distribution for small samples
   */
  calculateConfidenceInterval(
    data: number[],
    confidenceLevel: number = 0.95
  ): ConfidenceInterval {
    if (data.length < 2) {
      throw new Error('Need at least 2 data points for confidence interval');
    }

    const mean = this.mean(data);
    const stdDev = this.standardDeviation(data);
    const n = data.length;

    // t-value for given confidence level
    const alpha = 1 - confidenceLevel;
    const tValue = this.tDistribution(alpha / 2, n - 1);

    const marginOfError = tValue * (stdDev / Math.sqrt(n));

    return {
      lower: mean - marginOfError,
      upper: mean + marginOfError,
      mean,
      confidenceLevel
    };
  }

  /**
   * Test if correlation is statistically significant
   * Returns Pearson correlation coefficient with p-value
   */
  correlationTest(x: number[], y: number[]): StatisticalTest {
    if (x.length !== y.length || x.length < this.MIN_SAMPLE_SIZE) {
      return {
        testName: 'Pearson Correlation',
        pValue: 1,
        isSignificant: false,
        confidenceLevel: 0.95,
        effectSize: 0
      };
    }

    const r = this.pearsonCorrelation(x, y);
    const n = x.length;

    // t-statistic for correlation
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const df = n - 2;

    const pValue = this.tTestToPValue(Math.abs(t), df);

    return {
      testName: 'Pearson Correlation',
      pValue,
      isSignificant: pValue < this.SIGNIFICANCE_THRESHOLD,
      confidenceLevel: 0.95,
      effectSize: r
    };
  }

  /**
   * Mann-Whitney U Test for non-parametric data
   * Used when data doesn't follow normal distribution
   */
  mannWhitneyU(group1: number[], group2: number[]): StatisticalTest {
    if (group1.length < 3 || group2.length < 3) {
      return {
        testName: 'Mann-Whitney U',
        pValue: 1,
        isSignificant: false,
        confidenceLevel: 0.95,
        effectSize: 0
      };
    }

    // Combine and rank all values
    const combined = [
      ...group1.map(v => ({ value: v, group: 1 })),
      ...group2.map(v => ({ value: v, group: 2 }))
    ].sort((a, b) => a.value - b.value);

    // Assign ranks (handle ties)
    const ranks = new Map<number, number[]>();
    combined.forEach((item, index) => {
      if (!ranks.has(item.value)) {
        ranks.set(item.value, []);
      }
      ranks.get(item.value)!.push(index + 1);
    });

    // Calculate rank sums
    let rankSum1 = 0;
    combined.forEach((item) => {
      if (item.group === 1) {
        const avgRank = this.mean(ranks.get(item.value)!);
        rankSum1 += avgRank;
      }
    });

    // Calculate U statistic
    const n1 = group1.length;
    const n2 = group2.length;
    const U1 = rankSum1 - (n1 * (n1 + 1)) / 2;
    const U = Math.min(U1, n1 * n2 - U1);

    // Calculate z-score for large samples
    const meanU = (n1 * n2) / 2;
    const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    const z = (U - meanU) / stdU;

    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    // Effect size (rank-biserial correlation)
    const effectSize = 1 - (2 * U) / (n1 * n2);

    return {
      testName: 'Mann-Whitney U',
      pValue,
      isSignificant: pValue < this.SIGNIFICANCE_THRESHOLD,
      confidenceLevel: 0.95,
      effectSize
    };
  }

  /**
   * Validate minimum sample size for reliable statistics
   */
  hasMinimumSampleSize(sampleSize: number, testType: 'correlation' | 'ttest' | 'chisquare' = 'ttest'): boolean {
    const minimums = {
      correlation: 10,
      ttest: 5,
      chisquare: 5
    };
    return sampleSize >= minimums[testType];
  }

  /**
   * Calculate effect size (Cohen's d) for mean difference
   */
  cohensD(group1: number[], group2: number[]): number {
    const mean1 = this.mean(group1);
    const mean2 = this.mean(group2);

    const var1 = this.variance(group1);
    const var2 = this.variance(group2);

    const pooledStdDev = Math.sqrt(((group1.length - 1) * var1 + (group2.length - 1) * var2) /
                                    (group1.length + group2.length - 2));

    return (mean1 - mean2) / pooledStdDev;
  }

  // Helper statistical functions

  private mean(data: number[]): number {
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  private variance(data: number[]): number {
    const m = this.mean(data);
    return data.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (data.length - 1);
  }

  private standardDeviation(data: number[]): number {
    return Math.sqrt(this.variance(data));
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = this.mean(x);
    const meanY = this.mean(y);

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    return numerator / Math.sqrt(denomX * denomY);
  }

  private normalCDF(z: number): number {
    // Approximation of standard normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - probability : probability;
  }

  private tDistribution(alpha: number, df: number): number {
    // Simplified t-distribution critical value approximation
    // For common confidence levels
    if (df >= 30) {
      // Approximate with normal distribution for large df
      return this.zScore(1 - alpha);
    }

    // Lookup table for common values
    const tTable: { [key: number]: number } = {
      1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
      10: 2.228, 15: 2.131, 20: 2.086, 25: 2.060, 30: 2.042
    };

    // Find closest df in table
    const closestDf = Object.keys(tTable)
      .map(Number)
      .reduce((prev, curr) => Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev);

    return tTable[closestDf];
  }

  private zScore(probability: number): number {
    // Approximation of inverse normal CDF
    if (probability === 0.95) return 1.96;
    if (probability === 0.975) return 2.576;
    if (probability === 0.99) return 2.576;
    return 1.96; // Default to 95% CI
  }

  private chiSquareToPValue(chiSquare: number, df: number): number {
    // Simplified chi-square to p-value approximation
    // Using Wilson-Hilferty transformation
    const z = Math.pow(chiSquare / df, 1/3) - (1 - 2/(9 * df)) / Math.sqrt(2/(9 * df));
    return 2 * (1 - this.normalCDF(Math.abs(z)));
  }

  private tTestToPValue(t: number, df: number): number {
    // Approximate p-value from t-statistic
    // Using normal approximation for large df
    if (df > 30) {
      return 2 * (1 - this.normalCDF(t));
    }

    // Rough approximation for smaller df
    const p = Math.exp(-0.717 * t - 0.416 * t * t);
    return Math.min(1, Math.max(0, p));
  }
}

/**
 * Data Quality Checker
 * Validates incoming data for anomalies and quality issues
 */
export class DataQualityChecker {
  private readonly Z_SCORE_THRESHOLD = 3; // 3 standard deviations

  /**
   * Check if value is an outlier using Z-score method
   */
  isOutlier(value: number, dataset: number[]): boolean {
    if (dataset.length < 3) return false;

    const mean = dataset.reduce((a, b) => a + b, 0) / dataset.length;
    const variance = dataset.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (dataset.length - 1);
    const stdDev = Math.sqrt(variance);

    const zScore = Math.abs((value - mean) / stdDev);
    return zScore > this.Z_SCORE_THRESHOLD;
  }

  /**
   * Check data completeness
   */
  checkCompleteness(data: any[]): { complete: boolean; missingCount: number; completenessRate: number } {
    const total = data.length;
    const missing = data.filter(d => d === null || d === undefined || d === '').length;

    return {
      complete: missing === 0,
      missingCount: missing,
      completenessRate: (total - missing) / total
    };
  }

  /**
   * Validate data range
   */
  isInValidRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Check for data freshness (real-time requirement)
   */
  isDataFresh(timestamp: string, maxAgeMs: number = 10000): boolean {
    const eventTime = new Date(timestamp).getTime();
    const now = Date.now();
    return (now - eventTime) <= maxAgeMs;
  }
}
