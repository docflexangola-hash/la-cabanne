import type { Metadata } from 'next';

import { PhasePlaceholder } from '@/components/admin/phase-placeholder';

export const metadata: Metadata = { title: 'Produtos' };

export default function ProductsPage() {
  return (
    <PhasePlaceholder
      title="Produtos"
      phase="Fase 3"
      description="Criação, edição, preços, variantes, fotografias e disponibilidade do cardápio."
      items={[
        'CRUD com pré-visualização do cartão público',
        'Grupos de variantes com preço absoluto',
        'Upload de fotografia com texto alternativo',
        'Acções em massa: publicar, esgotar, arquivar',
        'Exportação CSV respeitando filtros',
      ]}
    />
  );
}
