import { StoredFeature } from './featureStore';

export interface DetectedPattern {
  id: string;
  type: 'recurring_mistake' | 'success_sequence' | 'vulnerability' | 'strength';
  description: string;
  occurrences: number;
  confidence: number;
  playersInvolved: string[];
  phases: ('early' | 'mid' | 'late')[];
  impactScore: number;
  firstSeen: string;
  lastSeen: string;
  recommendation: string;
}

export interface PlayerBehaviorPattern {
  playerId: string;
  patterns: DetectedPattern[];
  riskScore: number; // 0-100, higher = more problematic patterns
  strengthScore: number; // 0-100, higher = more positive patterns
  consistency: number; // 0-1, higher = more predictable behavior
}

export interface SequencePattern {
  sequence: string[]; // e.g., ["early_death", "eco_loss", "site_collapse"]
  frequency: number;
  avgImpact: number;
  isProblematic: boolean;
}

export class PatternAnalyzer {
  private minOccurrences: number = 3;
  private minConfidence: number = 0.65;
  private detectedPatterns: Map<string, DetectedPattern> = new Map();

  analyzeFeatures(features: StoredFeature[]): DetectedPattern[] {
    if (features.length < this.minOccurrences) {
      return [];
    }

    const patterns: DetectedPattern[] = [];

    // 1. Analyze recurring mistakes (same negative action by same player)
    patterns.push(...this.detectRecurringMistakes(features));

    // 2. Analyze success sequences (patterns that lead to positive outcomes)
    patterns.push(...this.detectSuccessSequences(features));

    // 3. Analyze vulnerabilities (phase-specific weaknesses)
    patterns.push(...this.detectVulnerabilities(features));

    // 4. Analyze strengths (consistent positive behaviors)
    patterns.push(...this.detectStrengths(features));

    // Cache patterns
    patterns.forEach(p => this.detectedPatterns.set(p.id, p));

    return patterns.filter(p => p.confidence >= this.minConfidence);
  }

  private detectRecurringMistakes(features: StoredFeature[]): DetectedPattern[] {
    const mistakes = features.filter(f => f.outcome === 'negative');
    const playerActionMap = new Map<string, StoredFeature[]>();

    // Group by player + action type
    mistakes.forEach(f => {
      const key = `${f.playerId}_${f.actionType}`;
      if (!playerActionMap.has(key)) {
        playerActionMap.set(key, []);
      }
      playerActionMap.get(key)!.push(f);
    });

    const patterns: DetectedPattern[] = [];

    playerActionMap.forEach((occurrences, key) => {
      if (occurrences.length >= this.minOccurrences) {
        const [playerId, actionType] = key.split('_');
        const phases = Array.from(new Set(occurrences.map(o => o.phase)));
        const avgImpact = occurrences.reduce((sum, o) => sum + Math.abs(o.impactScore), 0) / occurrences.length;

        patterns.push({
          id: crypto.randomUUID(),
          type: 'recurring_mistake',
          description: `${playerId} repeatedly ${actionType}`,
          occurrences: occurrences.length,
          confidence: Math.min(0.95, 0.5 + (occurrences.length * 0.1)),
          playersInvolved: [playerId],
          phases,
          impactScore: -avgImpact,
          firstSeen: occurrences[0].timestamp,
          lastSeen: occurrences[occurrences.length - 1].timestamp,
          recommendation: `Coach ${playerId} to avoid ${actionType} during ${phases.join(', ')} phases. Pattern detected ${occurrences.length} times with avg impact of ${avgImpact.toFixed(2)}.`
        });
      }
    });

    return patterns;
  }

  private detectSuccessSequences(features: StoredFeature[]): DetectedPattern[] {
    const successFeatures = features.filter(f => f.outcome === 'positive');
    const patterns: DetectedPattern[] = [];

    // Look for sequences of successful actions within 60 seconds
    for (let i = 0; i < successFeatures.length - 2; i++) {
      const current = successFeatures[i];
      const next = successFeatures[i + 1];
      const afterNext = successFeatures[i + 2];

      const timeDiff1 = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
      const timeDiff2 = new Date(afterNext.timestamp).getTime() - new Date(next.timestamp).getTime();

      if (timeDiff1 < 60000 && timeDiff2 < 60000) {
        const sequence = [current.actionType, next.actionType, afterNext.actionType];
        const players = Array.from(new Set([current.playerId, next.playerId, afterNext.playerId]));
        const avgImpact = (current.impactScore + next.impactScore + afterNext.impactScore) / 3;

        patterns.push({
          id: crypto.randomUUID(),
          type: 'success_sequence',
          description: `Successful sequence: ${sequence.join(' → ')}`,
          occurrences: 1, // Would aggregate in real implementation
          confidence: 0.72,
          playersInvolved: players,
          phases: [current.phase],
          impactScore: avgImpact,
          firstSeen: current.timestamp,
          lastSeen: afterNext.timestamp,
          recommendation: `Reinforce this successful pattern: ${sequence.join(' → ')}. Involves ${players.join(', ')}.`
        });
      }
    }

    return patterns;
  }

  private detectVulnerabilities(features: StoredFeature[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const phaseGroups: { [key: string]: StoredFeature[] } = {
      early: [],
      mid: [],
      late: []
    };

    features.filter(f => f.outcome === 'negative').forEach(f => {
      phaseGroups[f.phase].push(f);
    });

    // Analyze each phase
    Object.entries(phaseGroups).forEach(([phase, phaseFeatures]) => {
      if (phaseFeatures.length >= this.minOccurrences) {
        const actionCounts = new Map<string, number>();
        phaseFeatures.forEach(f => {
          actionCounts.set(f.actionType, (actionCounts.get(f.actionType) || 0) + 1);
        });

        const mostCommonAction = Array.from(actionCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];

        if (mostCommonAction[1] >= this.minOccurrences) {
          const relevantFeatures = phaseFeatures.filter(f => f.actionType === mostCommonAction[0]);
          const players = Array.from(new Set(relevantFeatures.map(f => f.playerId)));
          const avgImpact = relevantFeatures.reduce((sum, f) => sum + Math.abs(f.impactScore), 0) / relevantFeatures.length;

          patterns.push({
            id: crypto.randomUUID(),
            type: 'vulnerability',
            description: `${phase.charAt(0).toUpperCase() + phase.slice(1)}-game vulnerability: ${mostCommonAction[0]}`,
            occurrences: mostCommonAction[1],
            confidence: Math.min(0.9, 0.6 + (mostCommonAction[1] * 0.08)),
            playersInvolved: players,
            phases: [phase as 'early' | 'mid' | 'late'],
            impactScore: -avgImpact,
            firstSeen: relevantFeatures[0].timestamp,
            lastSeen: relevantFeatures[relevantFeatures.length - 1].timestamp,
            recommendation: `VULNERABILITY ALERT: Team consistently struggles with ${mostCommonAction[0]} in ${phase} game. Tactical adjustment needed.`
          });
        }
      }
    });

    return patterns;
  }

  private detectStrengths(features: StoredFeature[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const positiveFeatures = features.filter(f => f.outcome === 'positive' && f.impactScore > 0.6);

    // Group by action type
    const actionGroups = new Map<string, StoredFeature[]>();
    positiveFeatures.forEach(f => {
      if (!actionGroups.has(f.actionType)) {
        actionGroups.set(f.actionType, []);
      }
      actionGroups.get(f.actionType)!.push(f);
    });

    actionGroups.forEach((group, actionType) => {
      if (group.length >= this.minOccurrences) {
        const players = Array.from(new Set(group.map(f => f.playerId)));
        const phases = Array.from(new Set(group.map(f => f.phase)));
        const avgImpact = group.reduce((sum, f) => sum + f.impactScore, 0) / group.length;

        patterns.push({
          id: crypto.randomUUID(),
          type: 'strength',
          description: `Consistent strength: ${actionType}`,
          occurrences: group.length,
          confidence: Math.min(0.95, 0.65 + (group.length * 0.07)),
          playersInvolved: players,
          phases: phases as ('early' | 'mid' | 'late')[],
          impactScore: avgImpact,
          firstSeen: group[0].timestamp,
          lastSeen: group[group.length - 1].timestamp,
          recommendation: `STRENGTH IDENTIFIED: ${actionType} is consistently successful (${group.length} occurrences). Leverage this in strategy.`
        });
      }
    });

    return patterns;
  }

  analyzePlayerBehavior(playerId: string, features: StoredFeature[]): PlayerBehaviorPattern {
    const playerFeatures = features.filter(f => f.playerId === playerId);
    const patterns = this.analyzeFeatures(playerFeatures);

    const negativePatterns = patterns.filter(p => p.type === 'recurring_mistake' || p.type === 'vulnerability');
    const positivePatterns = patterns.filter(p => p.type === 'success_sequence' || p.type === 'strength');

    const riskScore = Math.min(100, negativePatterns.reduce((sum, p) => sum + Math.abs(p.impactScore) * 10, 0));
    const strengthScore = Math.min(100, positivePatterns.reduce((sum, p) => sum + p.impactScore * 10, 0));

    // Consistency: low variance in action types
    const actionTypes = playerFeatures.map(f => f.actionType);
    const uniqueActions = new Set(actionTypes).size;
    const consistency = 1 - Math.min(1, uniqueActions / 20); // Normalized

    return {
      playerId,
      patterns,
      riskScore,
      strengthScore,
      consistency
    };
  }

  detectSequencePatterns(features: StoredFeature[], windowSize: number = 3): SequencePattern[] {
    const sequences: Map<string, SequencePattern> = new Map();

    for (let i = 0; i <= features.length - windowSize; i++) {
      const window = features.slice(i, i + windowSize);
      const sequenceKey = window.map(f => f.actionType).join('→');
      const avgImpact = window.reduce((sum, f) => sum + f.impactScore, 0) / windowSize;
      const isProblematic = avgImpact < -0.3;

      if (sequences.has(sequenceKey)) {
        const existing = sequences.get(sequenceKey)!;
        existing.frequency++;
        existing.avgImpact = (existing.avgImpact * (existing.frequency - 1) + avgImpact) / existing.frequency;
      } else {
        sequences.set(sequenceKey, {
          sequence: window.map(f => f.actionType),
          frequency: 1,
          avgImpact,
          isProblematic
        });
      }
    }

    return Array.from(sequences.values())
      .filter(s => s.frequency >= 2)
      .sort((a, b) => Math.abs(b.avgImpact) - Math.abs(a.avgImpact));
  }

  getTopPatterns(limit: number = 10): DetectedPattern[] {
    return Array.from(this.detectedPatterns.values())
      .sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore))
      .slice(0, limit);
  }

  clear(): void {
    this.detectedPatterns.clear();
  }
}
