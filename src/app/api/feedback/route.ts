import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { feedbackSchema } from '@/lib/validations/feedback';
import { getClientIp, getIpHash, rateLimit } from '@/lib/utils/rate-limit';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const data = parsed.data;

    // Honeypot
    if (data.website && data.website.trim().length > 0) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    // Tempo mínimo (3 segundos)
    if (typeof data.elapsed === 'number' && data.elapsed < 3000) {
      return NextResponse.json({ error: 'Por favor, tente novamente' }, { status: 429 });
    }

    const ip = getClientIp(request);
    const ipHash = getIpHash(ip);
    const key = `feedback:${ipHash || 'unknown'}`;
    const rl = await rateLimit({ key, limit: 3, windowSeconds: 3600 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Limite de envio atingido. Tente mais tarde.' }, { status: 429 });
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 });
    }

    const { error } = await supabase.from('customer_feedback').insert({
      type: data.type,
      rating: data.rating,
      comment: data.comment.trim(),
      name: data.name && data.name.trim() ? data.name.trim() : null,
      contact: data.contact && data.contact.trim() ? data.contact.trim() : null,
      source_path: data.source_path || null,
      ip_hash: ipHash,
    });

    if (error) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 201 });
  }
}
