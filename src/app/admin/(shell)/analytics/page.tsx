import type { Metadata } from 'next';

import { PhasePlaceholder } from '@/components/admin/phase-placeholder';

export const metadata: Metadata = { title: 'Analytics' };

export default function AnalyticsPage() {
  return (
    <PhasePlaceholder
      title="Analytics"
      phase="Fase 4"
      description="Estatísticas agregadas e anónimas de utilização do menu."
      items={[
        'Aberturas, sessões e tempo activo com Page Visibility API',
        'Top 10 produtos por abertura e por tempo de consulta',
        'Categorias mais visitadas e evolução temporal',
        'Aviso de amostra insuficiente em todos os rankings',
      ]}
    />
  );
}
