import type { Metadata } from 'next';

import { PhasePlaceholder } from '@/components/admin/phase-placeholder';

export const metadata: Metadata = { title: 'Histórico' };

export default function AuditPage() {
  return (
    <PhasePlaceholder
      title="Histórico de alterações"
      phase="Fase 3"
      description="Registo auditável de quem alterou o quê e quando."
      items={[
        'Autor, papel, entidade e acção',
        'Resumo da alteração por campo',
        'Filtro por entidade e por período',
      ]}
    />
  );
}
