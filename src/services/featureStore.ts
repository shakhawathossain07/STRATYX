import { GridEvent } from '../types/grid';

export interface StoredFeature {
  id: string;
  timestamp: string;
  playerId: string;
  actionType: string;
  phase: 'early' | 'mid' | 'late';
  context: {
    position?: { x: number; y: number };
    weapon?: string;
    health?: number;
    armor?: number;
    economy?: number;
    [key: string]: any;
  };
  outcome?: 'positive' | 'negative' | 'neutral';
  impactScore: number;
}

export interface TimeSeriesQuery {
  playerId?: string;
  actionType?: string;
  phase?: 'early' | 'mid' | 'late';
  startTime?: string;
  endTime?: string;
  limit?: number;
}

export interface PlayerTimeSeries {
  playerId: string;
  features: StoredFeature[];
  aggregates: {
    totalActions: number;
    avgImpactScore: number;
    positiveActions: number;
    negativeActions: number;
    phaseBreakdown: {
      early: number;
      mid: number;
      late: number;
    };
  };
}

export class TemporalFeatureStore {
  private features: Map<string, StoredFeature> = new Map();
  private playerIndex: Map<string, Set<string>> = new Map();
  private phaseIndex: Map<string, Set<string>> = new Map();
  private timeIndex: StoredFeature[] = [];

  store(event: GridEvent, metadata: {
    playerId: string;
    actionType: string;
    phase: 'early' | 'mid' | 'late';
    outcome?: 'positive' | 'negative' | 'neutral';
    impactScore: number;
  }): StoredFeature {
    const feature: StoredFeature = {
      id: crypto.randomUUID(),
      timestamp: event.timestamp,
      playerId: metadata.playerId,
      actionType: metadata.actionType,
      phase: metadata.phase,
      context: event.data || {},
      outcome: metadata.outcome,
      impactScore: metadata.impactScore
    };

    // Store in main map
    this.features.set(feature.id, feature);

    // Index by player
    if (!this.playerIndex.has(metadata.playerId)) {
      this.playerIndex.set(metadata.playerId, new Set());
    }
    this.playerIndex.get(metadata.playerId)!.add(feature.id);

    // Index by phase
    if (!this.phaseIndex.has(metadata.phase)) {
      this.phaseIndex.set(metadata.phase, new Set());
    }
    this.phaseIndex.get(metadata.phase)!.add(feature.id);

    // Time-ordered index
    this.timeIndex.push(feature);
    this.timeIndex.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return feature;
  }

  query(params: TimeSeriesQuery): StoredFeature[] {
    let results = Array.from(this.features.values());

    // Filter by player
    if (params.playerId) {
      const playerFeatureIds = this.playerIndex.get(params.playerId);
      if (playerFeatureIds) {
        results = results.filter(f => playerFeatureIds.has(f.id));
      } else {
        return [];
      }
    }

    // Filter by action type
    if (params.actionType) {
      results = results.filter(f => f.actionType === params.actionType);
    }

    // Filter by phase
    if (params.phase) {
      results = results.filter(f => f.phase === params.phase);
    }

    // Filter by time range
    if (params.startTime) {
      const startMs = new Date(params.startTime).getTime();
      results = results.filter(f => new Date(f.timestamp).getTime() >= startMs);
    }

    if (params.endTime) {
      const endMs = new Date(params.endTime).getTime();
      results = results.filter(f => new Date(f.timestamp).getTime() <= endMs);
    }

    // Sort by timestamp
    results.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Apply limit
    if (params.limit) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  getPlayerTimeSeries(playerId: string): PlayerTimeSeries | null {
    const features = this.query({ playerId });

    if (features.length === 0) {
      return null;
    }

    const aggregates = {
      totalActions: features.length,
      avgImpactScore: features.reduce((sum, f) => sum + f.impactScore, 0) / features.length,
      positiveActions: features.filter(f => f.outcome === 'positive').length,
      negativeActions: features.filter(f => f.outcome === 'negative').length,
      phaseBreakdown: {
        early: features.filter(f => f.phase === 'early').length,
        mid: features.filter(f => f.phase === 'mid').length,
        late: features.filter(f => f.phase === 'late').length
      }
    };

    return {
      playerId,
      features,
      aggregates
    };
  }

  getRecentFeatures(limit: number = 50): StoredFeature[] {
    return this.timeIndex.slice(-limit);
  }

  getHighImpactFeatures(threshold: number = 0.7, limit: number = 20): StoredFeature[] {
    return Array.from(this.features.values())
      .filter(f => Math.abs(f.impactScore) >= threshold)
      .sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore))
      .slice(0, limit);
  }

  getPhaseStatistics(phase: 'early' | 'mid' | 'late'): {
    totalFeatures: number;
    avgImpactScore: number;
    topActions: Array<{ action: string; count: number }>;
  } {
    const phaseFeatures = this.query({ phase });

    const actionCounts = new Map<string, number>();
    phaseFeatures.forEach(f => {
      actionCounts.set(f.actionType, (actionCounts.get(f.actionType) || 0) + 1);
    });

    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalFeatures: phaseFeatures.length,
      avgImpactScore: phaseFeatures.reduce((sum, f) => sum + f.impactScore, 0) / (phaseFeatures.length || 1),
      topActions
    };
  }

  clear(): void {
    this.features.clear();
    this.playerIndex.clear();
    this.phaseIndex.clear();
    this.timeIndex = [];
  }

  size(): number {
    return this.features.size;
  }
}
