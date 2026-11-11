import {
  MAX_HISTORY,
  createId,
  loadStore,
  nowIso,
  saveStore,
} from './storage';
import { getOrderItemCount, getOrderTotal } from './totals';
import type {
  AddOrderItemInput,
  OrderStore,
  SendOrderResult,
  StoredOrder,
  StoredOrderItem,
} from './types';

const SERVER_STORE: OrderStore = {
  version: 1,
  deviceId: '',
  sessionId: '',
  sessionStartedAt: '',
  lastActivityAt: '',
  nextRoundNumber: 1,
  tableLabel: null,
  draft: null,
  history: [],
  storageAvailable: true,
  toast: null,
};

let state: OrderStore =
  typeof window === 'undefined' ? SERVER_STORE : loadStore();

const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): OrderStore {
  return state;
}

export function getServerSnapshot(): OrderStore {
  return SERVER_STORE;
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function commit(next: OrderStore) {
  state = { ...next, lastActivityAt: nowIso(), toast: next.toast ?? null };
  const saved = saveStore(state);

  if (!saved && state.storageAvailable) {
    state = { ...state, storageAvailable: false };
  }

  emit();
}

function itemKey(item: Pick<StoredOrderItem, 'productId' | 'variantIds'>): string {
  return `${item.productId}|${[...item.variantIds].sort().join(',')}`;
}

export function addItem(input: AddOrderItemInput) {
  const quantity = Math.max(1, Math.min(99, Math.round(input.quantity)));
  const toast = { id: createId(), name: input.productName };
  const draft = state.draft;

  if (!draft) {
    const roundNumber = state.nextRoundNumber;

    commit({
      ...state,
      nextRoundNumber: roundNumber + 1,
      toast,
      draft: {
        id: createId(),
        sessionId: state.sessionId,
        roundNumber,
        tableLabel: state.tableLabel,
        items: [{ ...input, quantity, id: createId() }],
        status: 'draft',
        createdAt: nowIso(),
        sentAt: null,
        serverOrderId: null,
        serverTotal: null,
      },
    });
    return;
  }

  const key = itemKey(input);
  const existing = draft.items.find((item) => itemKey(item) === key);
  const items = existing
    ? draft.items.map((item) =>
        item.id === existing.id
          ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
          : item,
      )
    : [...draft.items, { ...input, quantity, id: createId() }];

  commit({ ...state, toast, draft: { ...draft, items } });
}

export function setQuantity(itemId: string, quantity: number) {
  const draft = state.draft;

  if (!draft) {
    return;
  }

  const nextQuantity = Math.max(1, Math.min(99, Math.round(quantity)));

  commit({
    ...state,
    draft: {
      ...draft,
      items: draft.items.map((item) =>
        item.id === itemId ? { ...item, quantity: nextQuantity } : item,
      ),
    },
  });
}

export function removeItem(itemId: string) {
  const draft = state.draft;

  if (!draft) {
    return;
  }

  const items = draft.items.filter((item) => item.id !== itemId);

  commit({
    ...state,
    draft: items.length > 0 ? { ...draft, items } : null,
  });
}

export function setTableLabel(value: string) {
  const tableLabel = value.trim().slice(0, 20) || null;

  commit({
    ...state,
    tableLabel,
    draft: state.draft ? { ...state.draft, tableLabel } : null,
  });
}

export function clearToast() {
  if (!state.toast) {
    return;
  }

  state = { ...state, toast: null };
  emit();
}

/** Move a rodada em curso para "guardados". */
export function saveDraft(): boolean {
  const draft = state.draft;

  if (!draft || draft.items.length === 0) {
    return false;
  }

  const saved: StoredOrder = { ...draft, status: 'saved' };

  commit({
    ...state,
    draft: null,
    history: [saved, ...state.history.filter((order) => order.id !== saved.id)].slice(
      0,
      MAX_HISTORY,
    ),
  });

  return true;
}

/** Devolve um pedido guardado ao carrinho para continuar a editar. */
export function reopenSaved(orderId: string): boolean {
  const entry = state.history.find((order) => order.id === orderId);

  if (!entry || entry.status !== 'saved') {
    return false;
  }

  if (state.draft && state.draft.items.length > 0) {
    return false;
  }

  commit({
    ...state,
    draft: { ...entry, status: 'draft', sentAt: null, serverOrderId: null, serverTotal: null },
    history: state.history.filter((order) => order.id !== orderId),
  });

  return true;
}

export function deleteSaved(orderId: string) {
  commit({
    ...state,
    history: state.history.filter((order) => order.id !== orderId),
  });
}

/** Fecha a visita: guarda a rodada em curso e começa do zero. */
export function startNewSession() {
  const draftToSave =
    state.draft && state.draft.items.length > 0
      ? [{ ...state.draft, status: 'saved' as const }]
      : [];

  commit({
    ...state,
    sessionId: createId(),
    sessionStartedAt: nowIso(),
    nextRoundNumber: 1,
    tableLabel: null,
    draft: null,
    history: [...draftToSave, ...state.history].slice(0, MAX_HISTORY),
  });
}

export async function sendOrder(): Promise<SendOrderResult> {
  const draft = state.draft;

  if (!draft || draft.items.length === 0) {
    return { ok: false, error: 'empty' };
  }

  const payload = {
    clientOrderId: draft.id,
    deviceId: state.deviceId,
    sessionId: draft.sessionId,
    roundNumber: draft.roundNumber,
    tableLabel: draft.tableLabel,
    sourcePath:
      typeof window !== 'undefined' ? window.location.pathname : undefined,
    items: draft.items.map((item) => ({
      productId: item.productId,
      variantIds: item.variantIds,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      productName: item.productName,
      variantLabel: item.variantLabel,
    })),
    website: '',
  };

  let response: Response;

  try {
    response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, error: 'network' };
  }

  const body = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        error?: string;
        orderId?: string;
        total?: number;
        roundNumber?: number;
      }
    | null;

  if (!response.ok || !body?.ok) {
    return {
      ok: false,
      error: 'server',
      message: body?.error,
    };
  }

  const sent: StoredOrder = {
    ...draft,
    status: 'sent',
    sentAt: nowIso(),
    serverOrderId: typeof body.orderId === 'string' ? body.orderId : null,
    serverTotal: typeof body.total === 'number' ? body.total : null,
  };

  commit({
    ...state,
    draft: null,
    history: [sent, ...state.history.filter((order) => order.id !== sent.id)].slice(
      0,
      MAX_HISTORY,
    ),
  });

  return {
    ok: true,
    total: typeof body.total === 'number' ? body.total : getOrderTotal(draft.items),
    roundNumber:
      typeof body.roundNumber === 'number' ? body.roundNumber : draft.roundNumber,
  };
}

export function getDraftCount(): number {
  return state.draft ? getOrderItemCount(state.draft.items) : 0;
}
