import type { Metadata } from 'next';
import {
  UsersManager,
  type UserRowData,
} from '@/components/admin/users-manager';
import { requireAdmin } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Utilizadores' };
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="font-display text-2xl text-deep">Supabase não configurado</p>
        <p className="mt-2 text-sm text-ink-2">
          Configure as variáveis de ambiente no ficheiro .env.local para aceder à base de dados.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [{ data: profiles }, { data: authUsers }] = await Promise.all([
    supabase
      .from('admin_profiles')
      .select('id, display_name, role, is_active, created_at')
      .order('created_at'),
    adminClient.auth.admin.listUsers(),
  ]);

  const emailMap = new Map<string, string>();
  for (const u of authUsers?.users || []) {
    if (u.email) {
      emailMap.set(u.id, u.email);
    }
  }

  const users: UserRowData[] = (profiles || []).map((p) => ({
    id: p.id,
    email: emailMap.get(p.id) || '',
    displayName: p.display_name,
    role: p.role,
    isActive: p.is_active,
    createdAt: p.created_at,
  }));

  const { getStaffMember } = await import('@/lib/auth/guard');
  const currentUser = await getStaffMember();
  if (!currentUser) {
    const { redirect } = await import('next/navigation');
    redirect('/admin/login');
  }
  return <UsersManager currentUser={currentUser as any} users={users} />;
}
