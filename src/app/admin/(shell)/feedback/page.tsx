import type { Metadata } from 'next';

import { PhasePlaceholder } from '@/components/admin/phase-placeholder';

export const metadata: Metadata = { title: 'Feedback' };

export default function FeedbackPage() {
  return (
    <PhasePlaceholder
      title="Feedback"
      phase="Fase 5"
      description="Caixa de entrada privada com elogios, sugestões e reclamações."
      items={[
        'Filtros por tipo, avaliação, estado e período',
        'Estados: novo, em análise, resolvido, arquivado',
        'Notas internas nunca visíveis ao cliente',
        'Indicadores de satisfação sem avaliações artificiais',
      ]}
    />
  );
}
