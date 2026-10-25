import type { ReactNode } from 'react';

import { AdminShell } from '@/components/admin/admin-shell';
import { requireStaff } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();

  return <AdminShell staff={staff}>{children}</AdminShell>;
}
