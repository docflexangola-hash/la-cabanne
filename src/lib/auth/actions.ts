'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const SAFE_NEXT_PATH = /^\/(?!\/)[a-zA-Z0-9\-_/?=&%]*$/;

export async function signIn(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect('/admin/login?erro=configuracao');
  }

  const parsed = credentialsSchema.safeParse({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  });

  if (!parsed.success) {
    redirect('/admin/login?erro=credenciais');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect('/admin/login?erro=credenciais');
  }

  const next = String(formData.get('next') ?? '');
  const destination = SAFE_NEXT_PATH.test(next) && next.startsWith('/admin') ? next : '/admin/dashboard';

  redirect(destination);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect('/admin/login');
}
