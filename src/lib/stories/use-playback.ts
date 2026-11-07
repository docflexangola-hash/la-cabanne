'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type PlaybackOptions = {
  length: number;
  intervalSeconds: number;
  active: boolean;
  /** Pausa momentânea (long-press) sem perder o tempo decorrido. */
  paused?: boolean;
};

/**
 * Auto-avanço em loop. Pausa quando o widget está minimizado,
 * o separador está oculto ou o utilizador mantém o dedo no story.
 */
export function useStoryPlayback({
  length,
  intervalSeconds,
  active,
  paused = false,
}: PlaybackOptions) {
  const [index, setIndex] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const [runId, setRunId] = useState(0);

  const intervalMs = Math.max(1, intervalSeconds) * 1000;
  const remainingRef = useRef(intervalMs);
  const startedAtRef = useRef<number | null>(null);
  const lastIndexRef = useRef(index);
  const lastIntervalRef = useRef(intervalMs);

  useEffect(() => {
    const update = (restart: boolean) => {
      const visible = document.visibilityState === 'visible';
      setPageVisible(visible);

      if (visible && restart) {
        // Ao regressar ao separador, reinicia o slide atual para a barra
        // e o temporizador voltarem a ficar sincronizados.
        remainingRef.current = intervalMs;
        startedAtRef.current = null;
        setRunId((value) => value + 1);
      }
    };

    update(false);

    const handleVisibility = () => update(true);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [intervalMs]);

  const next = useCallback(() => {
    setIndex((current) => (length > 0 ? (current + 1) % length : 0));
  }, [length]);

  const previous = useCallback(() => {
    setIndex((current) => (length > 0 ? (current - 1 + length) % length : 0));
  }, [length]);

  const safeIndex = length > 0 ? Math.min(index, length - 1) : 0;
  const running = active && pageVisible && length > 1;

  useEffect(() => {
    if (lastIndexRef.current !== safeIndex || lastIntervalRef.current !== intervalMs) {
      lastIndexRef.current = safeIndex;
      lastIntervalRef.current = intervalMs;
      remainingRef.current = intervalMs;
      startedAtRef.current = null;
    }

    if (!running) {
      // Pausa "dura" (minimizado, fora do menu ou separador oculto):
      // o próximo play recomeça do zero.
      remainingRef.current = intervalMs;
      startedAtRef.current = null;
      return;
    }

    if (paused) {
      // Pausa "suave" (long-press): guarda o tempo que falta.
      if (startedAtRef.current !== null) {
        remainingRef.current = Math.max(
          0,
          remainingRef.current - (Date.now() - startedAtRef.current),
        );
        startedAtRef.current = null;
      }

      return;
    }

    startedAtRef.current = Date.now();

    const timer = window.setTimeout(() => {
      startedAtRef.current = null;
      remainingRef.current = intervalMs;
      next();
    }, remainingRef.current);

    return () => window.clearTimeout(timer);
  }, [running, paused, safeIndex, intervalMs, next]);

  return {
    index: safeIndex,
    setIndex,
    next,
    previous,
    progressKey: safeIndex + runId,
  };
}
