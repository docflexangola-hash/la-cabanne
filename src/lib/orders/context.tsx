'use client';

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  addItem,
  clearToast,
  deleteSaved,
  getServerSnapshot,
  getSnapshot,
  removeItem,
  reopenSaved,
  saveDraft,
  sendOrder,
  setQuantity,
  setTableLabel,
  startNewSession,
  subscribe,
} from './store';
import type { OrderStore } from './types';

type OrderContextValue = {
  store: OrderStore;
  addItem: typeof addItem;
  setQuantity: typeof setQuantity;
  removeItem: typeof removeItem;
  setTableLabel: typeof setTableLabel;
  clearToast: typeof clearToast;
  saveDraft: typeof saveDraft;
  reopenSaved: typeof reopenSaved;
  deleteSaved: typeof deleteSaved;
  startNewSession: typeof startNewSession;
  sendOrder: typeof sendOrder;
};

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<OrderContextValue>(
    () => ({
      store,
      addItem,
      setQuantity,
      removeItem,
      setTableLabel,
      clearToast,
      saveDraft,
      reopenSaved,
      deleteSaved,
      startNewSession,
      sendOrder,
    }),
    [store],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderContextValue {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }

  return context;
}
