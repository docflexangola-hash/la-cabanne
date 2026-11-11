import type { StoredOrder, StoredOrderItem, OrderStore } from './types';

export const ORDER_STORAGE_KEY = 'lacabanne:orders:v1';

/** Uma visita termina ao fim de 6 h sem actividade. */
export const SESSION_TTL_MS = 6 * 60 * 60 * 1000;

/** Limite de pedidos guardados/enviados no telemóvel. */
export const MAX_HISTORY = 20;

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function createEmptyStore(): OrderStore {
  const timestamp = nowIso();

  return {
    version: 1,
    deviceId: createId(),
    sessionId: createId(),
    sessionStartedAt: timestamp,
    lastActivityAt: timestamp,
    nextRoundNumber: 1,
    tableLabel: null,
    draft: null,
    history: [],
    storageAvailable: true,
    toast: null,
  };
}

function normalizeItem(value: unknown): StoredOrderItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (typeof item.productId !== 'string' || typeof item.productName !== 'string') {
    return null;
  }

  const unitPrice = Number(item.unitPrice);
  const quantity = Number(item.quantity);

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return null;
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return null;
  }

  const variantIds = Array.isArray(item.variantIds)
    ? item.variantIds.filter((id): id is string => typeof id === 'string')
    : [];

  return {
    id: typeof item.id === 'string' ? item.id : createId(),
    productId: item.productId,
    variantIds,
    productName: item.productName,
    variantLabel:
      typeof item.variantLabel === 'string' && item.variantLabel.trim()
        ? item.variantLabel
        : null,
    unitPrice,
    quantity: Math.min(99, quantity),
  };
}

function normalizeOrder(value: unknown): StoredOrder | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const order = value as Record<string, unknown>;
  const items = Array.isArray(order.items)
    ? order.items.map(normalizeItem).filter((item): item is StoredOrderItem => item !== null)
    : [];

  if (items.length === 0) {
    return null;
  }

  const status: StoredOrder['status'] =
    order.status === 'sent' ? 'sent' : order.status === 'saved' ? 'saved' : 'draft';

  return {
    id: typeof order.id === 'string' ? order.id : createId(),
    sessionId: typeof order.sessionId === 'string' ? order.sessionId : createId(),
    roundNumber:
      Number.isInteger(order.roundNumber) && Number(order.roundNumber) >= 1
        ? Number(order.roundNumber)
        : 1,
    tableLabel:
      typeof order.tableLabel === 'string' && order.tableLabel.trim()
        ? order.tableLabel.trim().slice(0, 20)
        : null,
    items,
    status,
    createdAt: typeof order.createdAt === 'string' ? order.createdAt : nowIso(),
    sentAt: typeof order.sentAt === 'string' ? order.sentAt : null,
    serverOrderId: typeof order.serverOrderId === 'string' ? order.serverOrderId : null,
    serverTotal: Number.isFinite(Number(order.serverTotal))
      ? Number(order.serverTotal)
      : null,
  };
}

function normalizeStore(value: unknown): OrderStore {
  const base = createEmptyStore();

  if (!value || typeof value !== 'object') {
    return base;
  }

  const store = value as Record<string, unknown>;
  const history = Array.isArray(store.history)
    ? store.history
        .map(normalizeOrder)
        .filter((order): order is StoredOrder => order !== null)
        .slice(0, MAX_HISTORY)
    : [];

  const draft = normalizeOrder(store.draft);
  const nextRoundNumber =
    Number.isInteger(store.nextRoundNumber) && Number(store.nextRoundNumber) >= 1
      ? Number(store.nextRoundNumber)
      : 1;

  return {
    version: 1,
    deviceId: typeof store.deviceId === 'string' ? store.deviceId : base.deviceId,
    sessionId: typeof store.sessionId === 'string' ? store.sessionId : base.sessionId,
    sessionStartedAt:
      typeof store.sessionStartedAt === 'string' ? store.sessionStartedAt : base.sessionStartedAt,
    lastActivityAt:
      typeof store.lastActivityAt === 'string' ? store.lastActivityAt : base.lastActivityAt,
    nextRoundNumber,
    tableLabel:
      typeof store.tableLabel === 'string' && store.tableLabel.trim()
        ? store.tableLabel.trim().slice(0, 20)
        : null,
    draft: draft ? { ...draft, status: 'draft' } : null,
    history: history.filter((order) => order.status !== 'draft'),
    storageAvailable: true,
    toast: null,
  };
}

/** Se a última actividade for antiga, começa uma visita nova. */
export function applySessionExpiry(store: OrderStore): OrderStore {
  const lastActivity = Date.parse(store.lastActivityAt);

  if (Number.isFinite(lastActivity) && Date.now() - lastActivity < SESSION_TTL_MS) {
    return store;
  }

  const draftToSave =
    store.draft && store.draft.items.length > 0
      ? [{ ...store.draft, status: 'saved' as const }]
      : [];

  return {
    ...store,
    sessionId: createId(),
    sessionStartedAt: nowIso(),
    lastActivityAt: nowIso(),
    nextRoundNumber: 1,
    tableLabel: null,
    draft: null,
    history: [...draftToSave, ...store.history].slice(0, MAX_HISTORY),
  };
}

/** Mesa vinda do QR code (`?m=12`). */
function readTableFromUrl(): string | null {
  try {
    const value = new URLSearchParams(window.location.search).get('m');
    const table = value?.trim().slice(0, 20);

    return table ? table : null;
  } catch {
    return null;
  }
}

function applyTableFromUrl(store: OrderStore): OrderStore {
  const tableLabel = readTableFromUrl();

  if (!tableLabel) {
    return store;
  }

  return {
    ...store,
    tableLabel,
    draft: store.draft ? { ...store.draft, tableLabel } : null,
  };
}

export function loadStore(): OrderStore {
  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
    const store = raw
      ? applySessionExpiry(normalizeStore(JSON.parse(raw)))
      : createEmptyStore();

    return applyTableFromUrl(store);
  } catch {
    return applyTableFromUrl({ ...createEmptyStore(), storageAvailable: false });
  }
}

export function saveStore(store: OrderStore): boolean {
  try {
    window.localStorage.setItem(
      ORDER_STORAGE_KEY,
      JSON.stringify({ ...store, storageAvailable: true, toast: null }),
    );
    return true;
  } catch {
    return false;
  }
}
