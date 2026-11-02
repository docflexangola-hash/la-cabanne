import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { getSupabaseUrl, getSupabaseServiceRoleKey, isSupabaseConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

const BACKFILL_DAYS = 7;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const received = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret}`);

  return received.length === expected.length && timingSafeEqual(received, expected);
}

function luandaDay(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET não configurado.' },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  }

  const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false },
  });

  const days: Record<string, string> = {};

  for (let offset = BACKFILL_DAYS - 1; offset >= 0; offset -= 1) {
    const day = luandaDay(-offset);
    const { error } = await supabase.rpc('refresh_analytics_daily_summary', { p_day: day });
    days[day] = error ? error.message : 'ok';
  }

  const { data: purge, error: purgeError } = await supabase.rpc('purge_analytics_events');
  const failed = Object.values(days).some((status) => status !== 'ok') || Boolean(purgeError);

  return NextResponse.json(
    {
      ok: !failed,
      days,
      purge: purgeError ? purgeError.message : purge,
    },
    { status: failed ? 500 : 200 },
  );
}
