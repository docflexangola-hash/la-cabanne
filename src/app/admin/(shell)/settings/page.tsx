import type { Metadata } from 'next';

import { PhasePlaceholder } from '@/components/admin/phase-placeholder';

export const metadata: Metadata = { title: 'Configurações' };

export default function SettingsPage() {
  return (
    <PhasePlaceholder
      title="Configurações"
      phase="Fase 3"
      description="Identidade, contactos, horário e estado de funcionamento do restaurante."
      items={[
        'Nome, logótipo e mensagem informativa',
        'Contactos, morada e redes sociais',
        'Horário semanal e estado aberto/fechado',
        'Nada é pré-preenchido com dados não confirmados',
      ]}
    />
  );
}
