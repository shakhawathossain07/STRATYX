import { useState, useEffect, useMemo } from 'react';
import { GridEventStream } from '../services/eventStream';
import { CausalEngine } from '../services/causalEngine';
import { CausalInsight } from '../types/grid';

export const useStratyx = (seriesId: string) => {
  const [insights, setInsights] = useState<CausalInsight[]>([]);
  const [debt, setDebt] = useState(0);
  
  const engine = useMemo(() => new CausalEngine(), []);
  const stream = useMemo(() => new GridEventStream(seriesId), [seriesId]);

  useEffect(() => {
    stream.connect();
    
    const cleanup = stream.onEvent((event) => {
      const insight = engine.processEvent(event);
      if (insight) {
        setInsights(prev => [insight, ...prev].slice(0, 10));
      }
      setDebt(engine.getStrategyDebt());
    });

    return () => {
      stream.disconnect();
      cleanup();
    };
  }, [stream, engine]);

  return { insights, debt };
};
