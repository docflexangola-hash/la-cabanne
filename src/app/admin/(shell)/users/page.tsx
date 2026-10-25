import type { Metadata } from 'next';

import { PhasePlaceholder } from '@/components/admin/phase-placeholder';

export const metadata: Metadata = { title: 'Utilizadores' };

export default function UsersPage() {
  return (
    <PhasePlaceholder
      title="Utilizadores"
      phase="Fase 3"
      description="Gestão de contas administrativas. Apenas administradores têm acesso."
      items={[
        'Convite por email, sem registo público',
        'Perfis: administrador e gerente',
        'Activação e desactivação de contas',
        'Registo de todas as alterações em audit_logs',
      ]}
    />
  );
}
