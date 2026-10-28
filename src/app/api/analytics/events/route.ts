import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { getClientIp, getIpHash, rateLimit } from '@/lib/utils/rate-limit';

const eventSchema = z.object({
  events: z
    .array(
      z.object({
        event_type: z.string().min(1).max(50),
        anonymous_session_id: z.string().uuid().optional(),
        path: z.string().max(200).optional(),
        group_slug: z.string().max(60).optional(),
        category_slug: z.string().max(60).optional(),
        product_slug: z.string().max(120).optional(),
        search_query: z.string().max(100).optional(),
        duration_ms: z.number().int().min(0).max(300000).optional(),
        referrer: z.string().max(200).optional(),
        occurred_at: z.string().datetime().optional(),
      }),
    )
    .max(10),
});

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return new NextResponse(null, { status: 204 });
    }

    const ip = getClientIp(request);
    const ipHash = getIpHash(ip);
    const key = `analytics:${ipHash || 'unknown'}`;
    const rl = await rateLimit({ key, limit: 60, windowSeconds: 60 });
    if (!rl.allowed) {
      return new NextResponse(null, { status: 204 });
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return new NextResponse(null, { status: 204 });
    }

    const events = parsed.data.events.map((e) => ({
      event_type: e.event_type,
      anonymous_session_id: e.anonymous_session_id || null,
      path: e.path || null,
      group_slug: e.group_slug || null,
      category_slug: e.category_slug || null,
      product_slug: e.product_slug || null,
      search_query: e.search_query || null,
      duration_ms: typeof e.duration_ms === 'number' ? e.duration_ms : null,
      referrer: e.referrer || null,
      occurred_at: e.occurred_at || new Date().toISOString(),
    }));

    await supabase.from('analytics_events').insert(events);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
