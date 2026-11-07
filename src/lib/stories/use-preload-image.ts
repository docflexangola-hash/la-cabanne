'use client';

import { useEffect } from 'react';

/**
 * Aquece a cache para a imagem seguinte dos stories, evitando
 * o flash branco ao avançar ou ao entrar em fullscreen.
 */
export function usePreloadImage(url: string | null | undefined) {
  useEffect(() => {
    if (!url) {
      return;
    }

    const image = new window.Image();
    image.decoding = 'async';
    image.src = url;
  }, [url]);
}
