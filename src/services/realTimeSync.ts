/**
 * Real-Time Data Synchronization Service
 * Ensures continuous, low-latency updates from GRID API
 */

import { fetchSeriesState } from './gridApi';
import { GridEventStream } from './eventStream';

export interface SyncStatus {
  isConnected: boolean;
  lastUpdate: string;
  latencyMs: number;
  dataFreshness: 'real-time' | 'delayed' | 'stale';
  eventQueueSize: number;
  errorCount: number;
}

export interface RealTimeConfig {
  seriesId: string;
  pollIntervalMs?: number;     // For GraphQL polling (default: 5000ms)
  reconnectIntervalMs?: number; // WebSocket reconnect (default: 3000ms)
  maxLatencyMs?: number;        // Alert threshold (default: 2000ms)
  enableHeartbeat?: boolean;    // Health check (default: true)
}

export class RealTimeSyncService {
  private eventStream: GridEventStream | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private lastUpdateTime: number = Date.now();
  private latencyMs: number = 0;
  private errorCount: number = 0;
  private eventQueue: any[] = [];

  private readonly config: Required<RealTimeConfig>;
  private eventHandlers: Set<(event: any) => void> = new Set();
  private stateUpdateHandlers: Set<(state: any) => void> = new Set();

  constructor(config: RealTimeConfig) {
    this.config = {
      seriesId: config.seriesId,
      pollIntervalMs: config.pollIntervalMs || 5000,
      reconnectIntervalMs: config.reconnectIntervalMs || 3000,
      maxLatencyMs: config.maxLatencyMs || 2000,
      enableHeartbeat: config.enableHeartbeat !== false
    };
  }

  /**
   * Start real-time synchronization
   */
  async start(): Promise<void> {
    console.log('[RealTimeSync] Starting real-time sync for series:', this.config.seriesId);

    // 1. Connect to WebSocket event stream
    this.connectEventStream();

    // 2. Start periodic state polling (fallback/validation)
    this.startStatePolling();

    // 3. Start heartbeat monitor
    if (this.config.enableHeartbeat) {
      this.startHeartbeat();
    }
  }

  /**
   * Stop synchronization
   */
  stop(): void {
    console.log('[RealTimeSync] Stopping real-time sync');

    if (this.eventStream) {
      this.eventStream.disconnect();
      this.eventStream = null;
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Subscribe to real-time events
   */
  onEvent(handler: (event: any) => void): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Subscribe to state updates
   */
  onStateUpdate(handler: (state: any) => void): () => void {
    this.stateUpdateHandlers.add(handler);
    return () => this.stateUpdateHandlers.delete(handler);
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    const timeSinceUpdate = Date.now() - this.lastUpdateTime;
    let dataFreshness: 'real-time' | 'delayed' | 'stale';

    if (timeSinceUpdate < 2000) {
      dataFreshness = 'real-time';
    } else if (timeSinceUpdate < 10000) {
      dataFreshness = 'delayed';
    } else {
      dataFreshness = 'stale';
    }

    return {
      isConnected: this.eventStream !== null,
      lastUpdate: new Date(this.lastUpdateTime).toISOString(),
      latencyMs: this.latencyMs,
      dataFreshness,
      eventQueueSize: this.eventQueue.length,
      errorCount: this.errorCount
    };
  }

  /**
   * Connect to WebSocket event stream
   */
  private connectEventStream(): void {
    this.eventStream = new GridEventStream(this.config.seriesId);

    this.eventStream.onEvent((event) => {
      const receiveTime = Date.now();
      const eventTime = new Date(event.timestamp).getTime();
      this.latencyMs = receiveTime - eventTime;

      // Alert if latency too high
      if (this.latencyMs > this.config.maxLatencyMs) {
        console.warn(`[RealTimeSync] High latency detected: ${this.latencyMs}ms`);
      }

      // Update last update time
      this.lastUpdateTime = receiveTime;

      // Process event immediately (priority queue)
      this.processEvent(event);
    });

    this.eventStream.connect();
  }

  /**
   * Process incoming event
   */
  private processEvent(event: any): void {
    try {
      // Add to queue for processing guarantee
      this.eventQueue.push(event);

      // Notify all handlers immediately
      this.eventHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('[RealTimeSync] Error in event handler:', error);
          this.errorCount++;
        }
      });

      // Remove from queue after successful processing
      this.eventQueue.shift();

    } catch (error) {
      console.error('[RealTimeSync] Error processing event:', error);
      this.errorCount++;
    }
  }

  /**
   * Poll series state periodically (validation/fallback)
   */
  private startStatePolling(): void {
    this.pollInterval = setInterval(async () => {
      try {
        const startTime = Date.now();
        const state = await fetchSeriesState(this.config.seriesId);

        if (state) {
          const pollLatency = Date.now() - startTime;
          console.log(`[RealTimeSync] State poll completed in ${pollLatency}ms`);

          this.lastUpdateTime = Date.now();

          // Notify state update handlers
          this.stateUpdateHandlers.forEach(handler => {
            try {
              handler(state);
            } catch (error) {
              console.error('[RealTimeSync] Error in state handler:', error);
              this.errorCount++;
            }
          });
        }
      } catch (error) {
        console.error('[RealTimeSync] Error polling state:', error);
        this.errorCount++;
      }
    }, this.config.pollIntervalMs);
  }

  /**
   * Heartbeat monitor for connection health
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const status = this.getStatus();

      if (status.dataFreshness === 'stale') {
        console.warn('[RealTimeSync] STALE DATA DETECTED - attempting reconnect');
        this.reconnect();
      }

      if (status.eventQueueSize > 100) {
        console.warn('[RealTimeSync] Event queue backlog:', status.eventQueueSize);
      }

      // Log health metrics
      console.log('[RealTimeSync] Health check:', {
        connected: status.isConnected,
        freshness: status.dataFreshness,
        latency: `${status.latencyMs}ms`,
        errors: status.errorCount,
        queueSize: status.eventQueueSize
      });

    }, 10000); // Every 10 seconds
  }

  /**
   * Reconnect to stream
   */
  private reconnect(): void {
    console.log('[RealTimeSync] Reconnecting...');

    if (this.eventStream) {
      this.eventStream.disconnect();
    }

    setTimeout(() => {
      this.connectEventStream();
    }, this.config.reconnectIntervalMs);
  }

  /**
   * Clear error count (for monitoring)
   */
  resetErrorCount(): void {
    this.errorCount = 0;
  }

  /**
   * Get event queue size (for monitoring backpressure)
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Force sync (manual trigger)
   */
  async forceSync(): Promise<void> {
    console.log('[RealTimeSync] Force sync triggered');
    const state = await fetchSeriesState(this.config.seriesId);
    if (state) {
      this.stateUpdateHandlers.forEach(handler => handler(state));
    }
  }
}

/**
 * Real-Time Performance Monitor
 * Tracks system performance metrics in real-time
 */
export class PerformanceMonitor {
  private metrics: Array<{
    timestamp: string;
    operation: string;
    durationMs: number;
  }> = [];

  private readonly MAX_METRICS = 1000;

  /**
   * Track operation performance
   */
  track(operation: string, durationMs: number): void {
    this.metrics.push({
      timestamp: new Date().toISOString(),
      operation,
      durationMs
    });

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Alert on slow operations
    if (durationMs > 500) {
      console.warn(`[PerformanceMonitor] Slow operation detected: ${operation} took ${durationMs}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(operation?: string): {
    avg: number;
    min: number;
    max: number;
    p95: number;
    count: number;
  } {
    let data = this.metrics;
    if (operation) {
      data = this.metrics.filter(m => m.operation === operation);
    }

    if (data.length === 0) {
      return { avg: 0, min: 0, max: 0, p95: 0, count: 0 };
    }

    const durations = data.map(m => m.durationMs).sort((a, b) => a - b);

    return {
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p95: durations[Math.floor(durations.length * 0.95)],
      count: durations.length
    };
  }

  /**
   * Check if performance is degraded
   */
  isDegraded(thresholdMs: number = 500): boolean {
    const recentMetrics = this.metrics.slice(-20); // Last 20 operations
    if (recentMetrics.length < 10) return false;

    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.durationMs, 0) / recentMetrics.length;
    return avgDuration > thresholdMs;
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }
}
