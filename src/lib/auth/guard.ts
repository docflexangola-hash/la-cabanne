import { cache } from 'react';
import { redirect } from 'next/navigation';

import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import type { AdminRole, StaffMember } from '@/types/auth';

type ProfileRow = {
  id: string;
  role: AdminRole;
  display_name: string;
  is_active: boolean;
};

export const getStaffMember = cache(async (): Promise<StaffMember | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('id, role, display_name, is_active')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

  if (!profile?.is_active) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    role: profile.role,
    displayName: profile.display_name,
  };
});

export async function requireStaff(): Promise<StaffMember> {
  const staff = await getStaffMember();

  if (!staff) {
    redirect('/admin/login');
  }

  return staff;
}

export async function requireAdmin(): Promise<StaffMember> {
  const staff = await requireStaff();

  if (staff.role !== 'admin') {
    redirect('/admin/dashboard');
  }

  return staff;
}
