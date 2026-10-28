import type { Metadata } from 'next';

import { getSiteUrl } from '@/lib/env';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade e tratamento de dados do menu digital La Cabanne.',
  alternates: {
    canonical: `${siteUrl}/privacidade`,
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8 space-y-2">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
          Informação legal
        </p>
        <h1 className="font-display text-3xl text-deep">Política de Privacidade</h1>
        <p className="text-sm text-ink-2">Última actualização: 2026-10-25</p>
      </header>

      <div className="space-y-8 text-sm leading-relaxed text-ink">
        <section className="space-y-3">
          <h2 className="font-display text-xl text-deep">1. Âmbito</h2>
          <p>
            Esta política aplica-se ao menu digital do La Cabanne, acessível através do
            domínio indicado. O objetivo é explicar de forma clara que dados são tratados
            e com que finalidade.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl text-deep">2. Dados tratados</h2>
          <p>
            <strong>Menu público:</strong> não são solicitados dados pessoais para
            consultar o cardápio.
          </p>
          <p>
            <strong>Feedback:</strong> quando submete o formulário de feedback, apenas
            os campos que preencher são recolhidos (tipo, classificação, comentário;
            nome e contacto são opcionais). O envio é anónimo sempre que não
            fornecer dados identificativos.
          </p>
          <p>
            <strong>Analytics anónimos:</strong> podem ser registados eventos de
            utilização agregados, sem cookies, sem identificação direta, sem
            geolocalização e sem recolha de dados sensíveis.
          </p>
          <p>
            <strong>Administração:</strong> os acessos ao painel administrativo
            utilizam autenticação da plataforma Supabase, com perfis e registos
            auditáveis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl text-deep">3. Finalidades</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Apresentação do cardápio e informações do estabelecimento.</li>
            <li>Tratamento de feedback para melhoria do serviço.</li>
            <li>Monitorização agregada e anónima para melhoria da experiência.</li>
            <li>Gestão de conteúdos e segurança do painel administrativo.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl text-deep">4. Partilha e segurança</h2>
          <p>
            Os dados não são vendidos nem partilhados para fins publicitários. As
            comunicações são protegidas e o acesso ao painel é restrito a perfis
            autorizados com controlo de permissões.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl text-deep">5. Prazo de conservação</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Feedback: conservado pelo tempo necessário para tratamento, podendo ser arquivado.</li>
            <li>Registos de analytics agregados: anonimizados ou apagados conforme regras de retenção.</li>
            <li>Logs administrativos: mantidos para fins de auditoria e segurança.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl text-deep">6. Contacto</h2>
          <p>
            Para questões relacionadas com esta política ou com os seus dados, pode
            contactar a gerência do La Cabanne através dos contactos disponibilizados
            no próprio estabelecimento ou via os canais oficiais divulgados.
          </p>
        </section>
      </div>
    </main>
  );
}
