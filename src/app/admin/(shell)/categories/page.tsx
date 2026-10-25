import type { Metadata } from 'next';

import { PhasePlaceholder } from '@/components/admin/phase-placeholder';

export const metadata: Metadata = { title: 'Categorias' };

export default function CategoriesPage() {
  return (
    <PhasePlaceholder
      title="Categorias"
      phase="Fase 3"
      description="Organização do cardápio por grupos e categorias, com ordem configurável."
      items={[
        'Criar, renomear e reordenar categorias',
        'Activar e desactivar sem perder produtos',
        'Reatribuição segura antes de remover uma categoria',
        'Imagem opcional por categoria',
      ]}
    />
  );
}
