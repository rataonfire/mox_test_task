import { useState, useEffect, useRef } from 'react';
import type { SignalEvent, Params } from '../engine/types';
import { SEED_DATA, DEFAULT_PARAMS } from '../engine/defaults';

const SIGNALS_KEY = 'mox_signals';
const PARAMS_KEY = 'mox_params';

export function useFarmState() {
  const [signals, setSignals] = useState<SignalEvent[]>(SEED_DATA);
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSignals = localStorage.getItem(SIGNALS_KEY);
      const savedParams = localStorage.getItem(PARAMS_KEY);

      if (savedSignals) {
        const parsed = JSON.parse(savedSignals);
        if (Array.isArray(parsed)) {
          setSignals(parsed);
        }
      }

      if (savedParams) {
        const parsed = JSON.parse(savedParams);
        if (typeof parsed === 'object' && parsed !== null) {
          setParams(parsed);
        }
      }
    } catch {
      // Silent fallback to defaults
    }
  }, []);

  // Debounced save to localStorage
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(SIGNALS_KEY, JSON.stringify(signals));
        localStorage.setItem(PARAMS_KEY, JSON.stringify(params));
      } catch {
        // Silent failure on localStorage quota exceeded or disabled
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [signals, params]);

  const resetToSeed = () => {
    setSignals(SEED_DATA);
    setParams(DEFAULT_PARAMS);
  };

  const setSignalsAndParams = (newSignals: SignalEvent[], newParams: Params) => {
    setSignals(newSignals);
    setParams(newParams);
  };

  return {
    signals,
    setSignals,
    params,
    setParams,
    resetToSeed,
    setSignalsAndParams,
  };
}
