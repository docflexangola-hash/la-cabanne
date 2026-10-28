import { createClient } from '@supabase/supabase-js';

type RateLimitConfig = {
  key: string;
  limit: number;
  windowSeconds: number;
};

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function rateLimit({ key, limit, windowSeconds }: RateLimitConfig) {
  const now = Date.now();
  const expiresAt = now + windowSeconds * 1000;

  // Prefer memory in dev; in prod can be extended with Upstash/Redis
  const mem = memoryStore.get(key);
  if (mem && mem.expiresAt > now) {
    if (mem.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: mem.expiresAt };
    }
    mem.count += 1;
    return { allowed: true, remaining: limit - mem.count, resetAt: mem.expiresAt };
  }

  memoryStore.set(key, { count: 1, expiresAt });
  return { allowed: true, remaining: limit - 1, resetAt: expiresAt };
}

export function getIpHash(ip: string | null) {
  const salt = process.env.ANALYTICS_IP_SALT || 'la-cabanne-dev-salt';
  if (!ip) return null;
  // Simple hash for demo; production should use crypto
  let hash = 0;
  const input = ip + salt;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return null;
}
