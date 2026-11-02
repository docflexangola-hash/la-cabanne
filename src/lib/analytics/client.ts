'use client';

export type AnalyticsEvent = {
  event_type: string;
  anonymous_session_id?: string;
  path?: string;
  group_slug?: string;
  category_slug?: string;
  product_slug?: string;
  search_query?: string;
  duration_ms?: number;
  referrer?: string;
  occurred_at?: string;
  story_id?: string;
};

type TrackOptions = {
  /** Eventos como `feedback_submitted` nunca devem levar sessão anónima. */
  includeSession?: boolean;
};

const ENDPOINT = '/api/analytics/events';
const SESSION_KEY = 'lc_analytics_session';
const OPENED_KEY = 'lc_analytics_opened';
const SESSION_TTL_MS = 30 * 60 * 1000;
const FLUSH_DELAY_MS = 5000;
const MAX_BATCH = 10;
const MAX_ACTIVE_MS = 5 * 60 * 1000;
const IDLE_MS = 30 * 1000;
const STORY_SEEN_PREFIX = 'lc_story_seen:';

type StoredSession = { id: string; lastSeen: number };

let queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lifecycleBound = false;

let activeMs = 0;
let reportedMs = 0;
let lastActivity = 0;
let lastTick = 0;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readSession(): StoredSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredSession;

    if (typeof parsed?.id !== 'string' || typeof parsed?.lastSeen !== 'number') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Sessão anónima é opcional.
  }
}

function getSessionId(): string | null {
  try {
    if (!isBrowser()) {
      return null;
    }

    const now = Date.now();
    const current = readSession();

    if (current && now - current.lastSeen <= SESSION_TTL_MS) {
      if (now - current.lastSeen > 60_000) {
        writeSession({ ...current, lastSeen: now });
      }

      return current.id;
    }

    // Renova a sessão após 30 minutos de inactividade.
    const id = crypto.randomUUID();
    writeSession({ id, lastSeen: now });

    return id;
  } catch {
    return null;
  }
}

function flush(useBeacon = false): void {
  if (!isBrowser() || queue.length === 0) {
    return;
  }

  const events = queue;
  queue = [];

  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const payload = JSON.stringify({ events });

  try {
    if (useBeacon && typeof navigator.sendBeacon === 'function') {
      const sent = navigator.sendBeacon(
        ENDPOINT,
        new Blob([payload], { type: 'application/json' }),
      );

      if (sent) {
        return;
      }
    }
  } catch {
    // Cai para fetch.
  }

  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

function enqueue(event: AnalyticsEvent): void {
  if (!isBrowser()) {
    return;
  }

  queue.push(event);

  if (queue.length >= MAX_BATCH) {
    flush();
    return;
  }

  if (flushTimer === null) {
    flushTimer = setTimeout(() => flush(), FLUSH_DELAY_MS);
  }
}

/**
 * Regista um evento anónimo. Nunca lança nem interfere com a experiência.
 */
export function trackEvent(event: AnalyticsEvent, options: TrackOptions = {}): void {
  try {
    if (!isBrowser()) {
      return;
    }

    const sessionId = options.includeSession === false ? null : getSessionId();

    enqueue({
      ...event,
      path: event.path ?? window.location.pathname,
      occurred_at: event.occurred_at ?? new Date().toISOString(),
      ...(sessionId ? { anonymous_session_id: sessionId } : {}),
    });
  } catch {
    // Analytics é opcional: falha em silêncio.
  }
}

function currentPath(): string | undefined {
  return isBrowser() ? window.location.pathname : undefined;
}

export function trackMenuOpened(): void {
  try {
    if (!isBrowser()) {
      return;
    }

    bindLifecycle();

    const sessionId = getSessionId();

    if (!sessionId) {
      return;
    }

    if (window.sessionStorage.getItem(OPENED_KEY) === sessionId) {
      return;
    }

    window.sessionStorage.setItem(OPENED_KEY, sessionId);
    trackEvent({
      event_type: 'menu_opened',
      referrer: document.referrer ? document.referrer.slice(0, 200) : undefined,
    });
  } catch {
    // Analytics é opcional: falha em silêncio.
  }
}

export function trackGroupViewed(groupSlug: string): void {
  trackEvent({ event_type: 'group_viewed', group_slug: groupSlug, path: currentPath() });
}

export function trackCategoryViewed(groupSlug: string, categorySlug: string): void {
  trackEvent({
    event_type: 'category_viewed',
    group_slug: groupSlug,
    category_slug: categorySlug,
    path: currentPath(),
  });
}

export function trackProductOpened(input: {
  groupSlug: string;
  categorySlug: string;
  productSlug: string;
}): void {
  trackEvent({
    event_type: 'product_opened',
    group_slug: input.groupSlug,
    category_slug: input.categorySlug,
    product_slug: input.productSlug,
    path: currentPath(),
  });
}

export function trackProductEngagement(input: {
  groupSlug: string;
  categorySlug: string;
  productSlug: string;
  durationMs: number;
}): void {
  const duration = Math.round(Math.min(Math.max(input.durationMs, 0), MAX_ACTIVE_MS));

  if (duration < 1000) {
    return;
  }

  trackEvent({
    event_type: 'product_engagement',
    group_slug: input.groupSlug,
    category_slug: input.categorySlug,
    product_slug: input.productSlug,
    duration_ms: duration,
    path: currentPath(),
  });
}

export function trackFeedbackOpened(): void {
  trackEvent({ event_type: 'feedback_opened', path: currentPath() });
}

/**
 * O feedback é privado: este evento nunca leva `anonymous_session_id`.
 */
export function trackFeedbackSubmitted(sourcePath?: string): void {
  trackEvent(
    { event_type: 'feedback_submitted', path: sourcePath ?? currentPath() },
    { includeSession: false },
  );
}

type StoryEventInput = {
  storyKey: string;
  groupSlug?: string | null;
  categorySlug?: string | null;
  productSlug?: string | null;
};

/**
 * Regista a primeira impressão de cada story por sessão.
 * O loop de 5 segundos não deve inflacionar as métricas.
 */
export function trackStoryViewed(input: StoryEventInput): void {
  try {
    if (!isBrowser()) {
      return;
    }

    const sessionId = getSessionId();
    const storageKey = `${STORY_SEEN_PREFIX}${sessionId ?? 'anon'}`;
    const raw = window.sessionStorage.getItem(storageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const seen = Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];

    if (seen.includes(input.storyKey)) {
      return;
    }

    seen.push(input.storyKey);
    window.sessionStorage.setItem(storageKey, JSON.stringify(seen.slice(-200)));

    trackEvent({
      event_type: 'story_viewed',
      story_id: input.storyKey,
      group_slug: input.groupSlug ?? undefined,
      category_slug: input.categorySlug ?? undefined,
      product_slug: input.productSlug ?? undefined,
      path: currentPath(),
    });
  } catch {
    // Analytics é opcional: falha em silêncio.
  }
}

export function trackStoryClicked(input: StoryEventInput): void {
  trackEvent({
    event_type: 'story_clicked',
    story_id: input.storyKey,
    group_slug: input.groupSlug ?? undefined,
    category_slug: input.categorySlug ?? undefined,
    product_slug: input.productSlug ?? undefined,
    path: currentPath(),
  });
}

export function trackStoryMinimized(input: { storyKey: string }): void {
  trackEvent({
    event_type: 'story_minimized',
    story_id: input.storyKey,
    path: currentPath(),
  });
}

function tick(): void {
  if (!isBrowser()) {
    return;
  }

  const now = Date.now();
  const visible = document.visibilityState === 'visible';

  if (visible && lastTick > 0 && now - lastActivity <= IDLE_MS) {
    activeMs = Math.min(MAX_ACTIVE_MS, activeMs + Math.max(0, now - lastTick));
  }

  lastTick = now;
}

function reportActiveTime(useBeacon: boolean): void {
  if (!isBrowser()) {
    return;
  }

  const delta = Math.round(activeMs - reportedMs);

  if (delta < 1000) {
    return;
  }

  reportedMs += delta;

  const sessionId = getSessionId();

  enqueue({
    event_type: 'active_time',
    duration_ms: delta,
    path: currentPath(),
    occurred_at: new Date().toISOString(),
    ...(sessionId ? { anonymous_session_id: sessionId } : {}),
  });

  if (useBeacon) {
    flush(true);
  }
}

function markActivity(): void {
  lastActivity = Date.now();
}

function bindLifecycle(): void {
  if (!isBrowser() || lifecycleBound) {
    return;
  }

  lifecycleBound = true;
  lastActivity = Date.now();
  lastTick = Date.now();

  for (const eventName of ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const) {
    window.addEventListener(eventName, markActivity, { passive: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      tick();
      reportActiveTime(true);
    } else {
      markActivity();
      lastTick = Date.now();
    }
  });

  window.addEventListener('pagehide', () => {
    tick();
    reportActiveTime(true);
    flush(true);
  });

  window.setInterval(() => {
    tick();
    reportActiveTime(false);
  }, 15_000);
}
