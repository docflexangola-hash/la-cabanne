'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` no servidor e na primeira hidratação, `true` depois de montar.
 * Evita diferenças de HTML quando o valor depende do relógio ou do browser.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
