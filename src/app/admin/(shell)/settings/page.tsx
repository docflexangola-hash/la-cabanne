import type { Metadata } from 'next';
import { SettingsForm } from '@/components/admin/settings-form';
import { requireStaff } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import type { RestaurantSettingsInput } from '@/lib/validations/settings';

export const metadata: Metadata = { title: 'Configurações' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireStaff();

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

  const { data: row } = await supabase
    .from('restaurant_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const initialSettings: RestaurantSettingsInput = {
    name: row?.name || 'La Cabanne',
    phone: row?.phone || '',
    whatsapp: row?.whatsapp || '',
    email: row?.email || '',
    address: row?.address || '',
    hours: (row?.hours as RestaurantSettingsInput['hours']) || {},
    instagram:
      row?.socials && typeof row.socials === 'object' && 'instagram' in row.socials
        ? String((row.socials as { instagram: string }).instagram || '')
        : '',
    infoMessage: row?.info_message || '',
    isOpenOverride: row?.is_open_override ?? null,
  };

  return <SettingsForm initialSettings={initialSettings} />;
}
