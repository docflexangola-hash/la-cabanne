export type StoredOrderItem = {
  id: string;
  productId: string;
  variantIds: string[];
  productName: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
};

export type StoredOrderStatus = 'draft' | 'saved' | 'sent';

export type StoredOrder = {
  id: string;
  sessionId: string;
  roundNumber: number;
  tableLabel: string | null;
  items: StoredOrderItem[];
  status: StoredOrderStatus;
  createdAt: string;
  sentAt: string | null;
  serverOrderId: string | null;
  serverTotal: number | null;
};

export type OrderToast = {
  id: string;
  name: string;
};

export const ORDER_STATUSES = ['new', 'preparing', 'served', 'cancelled'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderStore = {
  version: 1;
  deviceId: string;
  sessionId: string;
  sessionStartedAt: string;
  lastActivityAt: string;
  nextRoundNumber: number;
  tableLabel: string | null;
  draft: StoredOrder | null;
  history: StoredOrder[];
  /** Só em memória: o browser bloqueou o localStorage. */
  storageAvailable: boolean;
  /** Só em memória: confirmação visual do último item adicionado. */
  toast: OrderToast | null;
};

export type AddOrderItemInput = {
  productId: string;
  variantIds: string[];
  productName: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
};

export type SendOrderResult =
  | { ok: true; total: number; roundNumber: number }
  | { ok: false; error: 'empty' | 'network' | 'server'; message?: string };
