'use client';

import { useCallback, useEffect, useState } from 'react';

type PlaybackOptions = {
  length: number;
  intervalSeconds: number;
  active: boolean;
};

/**
 * Auto-avanço em loop. Pausa quando o widget está minimizado
 * ou o separador está oculto.
 */
export function useStoryPlayback({ length, intervalSeconds, active }: PlaybackOptions) {
  const [index, setIndex] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === 'visible');

    update();
    document.addEventListener('visibilitychange', update);

    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (length === 0) {
      setIndex(0);
      return;
    }

    setIndex((current) => (current >= length ? 0 : current));
  }, [length]);

  const next = useCallback(() => {
    setIndex((current) => (length > 0 ? (current + 1) % length : 0));
  }, [length]);

  const running = active && pageVisible && length > 1;

  useEffect(() => {
    if (!running) {
      return;
    }

    // Reinicia a animação da barra sempre que o ciclo recomeça.
    setRunId((value) => value + 1);

    const timer = window.setTimeout(next, Math.max(1, intervalSeconds) * 1000);

    return () => window.clearTimeout(timer);
  }, [running, index, intervalSeconds, next]);

  return { index, setIndex, progressKey: runId };
}
