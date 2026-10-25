# Plano para concluir o La Cabanne

> Documento vivo. Última actualização: 2026-10-25.
> Não contém segredos: chaves, `.env.local` e `keys.md` ficam apenas na máquina local.
> A especificação interna (`ESPECIFICACAO.md`) e o PRD não são versionados neste
> repositório público.

## 1. Onde estamos

### Concluído e verificado

| Área | Estado | Evidência |
|---|---|---|
| Fundação Next.js 16 + TypeScript strict + Tailwind 4 | concluído | `npm run build` verde |
| Design system “Editorial de Mesa” | concluído | tokens em `src/app/globals.css` |
| Menu público (grupos, categorias, lista, detalhe, pesquisa, info) | concluído | `/` com 3 grupos e 35 categorias |
| Estado vazio honesto (sem produtos) | concluído | `/` renderiza sem “preparando” |
| Supabase (projecto, schema, seed, bucket) | concluído | 0001–0004 aplicadas; `eu-west-1`; bucket `menu-images` |
| RLS pública e de staff | concluído | anon lê menu; escrita anon bloqueada |
| Login de administração | concluído | conta `admin` criada e login validado |
| CI (lint, typegen, tipos, build) | concluído | GitHub Actions verde |
| Repositório remoto | concluído | público, `main` sincronizado |
| Health check | concluído | `/api/health` → `supabaseConfigured: true` |

### Por concluir

- Deploy na Vercel e domínio final (ambiente ainda não configurado).
- Conteúdo real do menu: **0 produtos**, sem fotos, sem contactos/horário.
- Fase 3 — Administração: apenas shell e páginas placeholder.
- Fase 4 — Analytics: não iniciada.
- Fase 5 — Feedback público e inbox: não iniciada (foi adiada da Fase 2).
- Fase 6 — Testes, acessibilidade, performance e lançamento.
- Página `/privacidade`, sitemap com ela, JSON-LD e Speed Insights.
- Rotação da password inicial do administrador (actual tem 8 caracteres).

---

## 2. Bloqueios e decisões (dependem do cliente)

- [ ] **Menu transcrito e validado** (nomes, descrições, preços finais em Kz, IVA incluído, variantes).
- [ ] **Fotografias reais** com autorização de uso, uma por produto, nomes de ficheiro e texto alternativo.
- [ ] **Contactos**: telefone, WhatsApp, Instagram/redes, email.
- [ ] **Morada completa** e link de mapa.
- [ ] **Horário** por dia da semana (formato `{"mon":[["12:00","23:00"]], "tue":null}`).
- [ ] **Taxa de IVA** e confirmação de que os preços já a incluem.
- [ ] **Domínio** final (ex.: `menu.lacabanne.ao`) antes de imprimir QR.
- [ ] **Quem recebe e trata o feedback** (inbox interna; sem email na v1).
- [ ] **Actualizar password do admin** e definir política (mínimo 12 caracteres).
- [ ] **Logótipo vectorial** original e ícone com cantos transparentes.
- [ ] **Upstash Redis** (opcional, recomendado em produção para rate limiting).

Regra permanente: **nunca inventar produtos, preços, descrições ou fotografias**.
O que faltar fica visível como faltante e bloqueia a publicação desse item.

---

## 3. Fase 0 — Conteúdo e importação (P0, bloqueia o lançamento)

### 3.1 Dados a recolher

- CSV revisto do menu, uma linha por produto (ou por variante, ver abaixo).
- Fotografias originais + versões optimizadas (WebP/AVIF, lado maior ≈ 1200 px).
- Dados do restaurante para `restaurant_settings`.
- Confirmação escrita de preços e IVA.

### 3.2 Formato do CSV de importação

Colunas mínimas:

```text
grupo,categoria,produto,descricao,preco_kz,nota_preco,variantes,tags,alergenios,doses,imagem,imagem_alt
```

- `preco_kz`: inteiro em kwanzas, sem símbolo nem separador de milhares.
- `variantes`: `Grupo:Opção=Preço;Outra=Preço` (preços absolutos, não diferenças).
- `nota_preco`: usar quando não há preço único (ex.: “sob consulta”).
- Linha vazia num campo = dado em falta; **não preencher por estimativa**.
- Campos com vírgulas devem ser quoted segundo RFC 4180.

### 3.3 Pipeline de importação

- [ ] Criar `supabase/import-template.csv` (só cabeçalhos e uma linha de exemplo comentada).
- [ ] Script `scripts/import-menu.mjs` com validação Zod e relatório de erros por linha.
- [ ] Modo `--dry-run` que não escreve nada.
- [ ] Importação sempre como `draft`; publicação manual no admin.
- [ ] Resolver grupos/categorias por `slug`; criar apenas o que estiver no CSV.
- [ ] Upload de imagens para `menu-images` com nomes estáveis (`produto-slug.webp`).
- [ ] Relatório final: criados, ignorados, erros, campos em falta.

### 3.4 Critérios de aceitação

- [ ] Nenhum preço no menu sem origem no CSV aprovado.
- [ ] Produto sem preço nem `price_note` é rejeitado pela base (constraint existente).
- [ ] Produto ilegível no original fica marcado como pendente, não inventado.
- [ ] Menu público mostra apenas `published`; `unavailable` aparece como “Esgotado”.
- [ ] Revisão humana de 100% dos itens antes de publicar.

---

## 4. Deploy e domínio (P0)

- [ ] Importar o repositório na Vercel (Project → Add New).
- [ ] Definir variáveis em Production **e** Preview:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL` (URL final, sem barra)
  - `ANALYTICS_IP_SALT` (Fase 4)
  - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (opcional)
- [ ] Confirmar que nenhum segredo tem prefixo `NEXT_PUBLIC_`.
- [ ] Configurar domínio/DNS e redirect `www` (se aplicável).
- [ ] Supabase → Authentication → URL Configuration: *Site URL* e *Redirect URLs*.
- [ ] Actualizar `NEXT_PUBLIC_SITE_URL` e fazer redeploy.
- [ ] Validar `/api/health`, `/robots.txt`, `/sitemap.xml`, login e menu.
- [ ] Gerar QR para o domínio final; imprimir só depois do teste em telemóvel real.
- [ ] Activar Vercel Speed Insights.

---

## 5. Fase 3 — Administração (P0)

O shell protegido existe; as páginas são placeholders. Ordem sugerida:

### 3.1 Base do admin

- [ ] Camada de validação Zod partilhada (`src/lib/validations/`).
- [ ] Server actions por entidade, com erros de campo e mensagens PT-PT.
- [ ] `revalidatePath('/')` após cada mutação publicada.
- [ ] Componentes reutilizáveis: tabela, filtros, paginação 25, confirmação destrutiva, toasts.
- [ ] Estados: carregamento, vazio, erro, sem permissão.

### 3.2 Categorias

- [ ] Criar, editar, activar/desactivar, reordenar (drag ou setas acessíveis).
- [ ] Slug automático com verificação de unicidade por grupo.
- [ ] Impedir apagar categoria com produtos (o schema já restringe).
- [ ] Contagem de produtos por categoria.

### 3.3 Produtos

- [ ] Lista com pesquisa, filtro por grupo/categoria/estado e paginação.
- [ ] Editor: nome, descrição, preço base, nota de preço, doses, tags, alergénios.
- [ ] Estado: `draft` → `published` → `unavailable` → `archived`.
- [ ] Preenchimento automático de `published_at` ao publicar.
- [ ] Pré-visualização do item como aparece no menu.
- [ ] Duplicar produto e acções em massa (publicar, esgotar, arquivar).
- [ ] Registo de `created_by` / `updated_by`.

### 3.4 Variantes

- [ ] CRUD de grupos de variantes (nome, obrigatório, ordem).
- [ ] CRUD de opções com preço absoluto e estado activo.
- [ ] Validação: grupo obrigatório precisa de ≥ 1 opção activa.
- [ ] Pré-visualização dos preços no detalhe público.

### 3.5 Imagens

- [ ] Upload para `menu-images` (JPEG/PNG/WebP, ≤ 5 MB).
- [ ] Redimensionar/comprimir no browser antes do upload; gerar nome estável.
- [ ] Campo `image_alt` obrigatório quando existe imagem.
- [ ] Substituir/remover imagem; limpeza de ficheiros órfãos.
- [ ] Usar `next/image` com `sizes` correctos no público.

### 3.6 Importação e exportação CSV

- [ ] Exportar produtos com os filtros activos.
- [ ] Importar com `--dry-run`, relatório de erros e entrada em `draft`.
- [ ] Exportar feedback e analytics nas respectivas fases.

### 3.7 Configurações

- [ ] Nome, logo, contactos, morada, redes sociais, mensagem informativa.
- [ ] Horário semanal e override “aberto/fechado”.
- [ ] Validação do JSON de horário e pré-visualização do estado no público.

### 3.8 Utilizadores e autenticação

- [ ] Listar utilizadores (apenas `admin`).
- [ ] Convidar por email, definir papel (`admin`/`manager`), desactivar.
- [ ] Recuperação de password por email com expiração de 1 h.
- [ ] Página de alteração de password para o utilizador autenticado.
- [ ] Rate limit no login (5 tentativas/15 min por email).
- [ ] `manager` não acede a Utilizadores nem a Auditoria.

### 3.9 Auditoria

- [ ] Migration `0005_audit.sql` com `audit_logs` e triggers nas tabelas editáveis.
- [ ] Página de auditoria com filtros por entidade, autor e acção.
- [ ] Resumo da alteração sem expor dados sensíveis.

### Critérios de aceitação da Fase 3

- [ ] Publicar no admin reflecte-se no público em ≤ 1 s após invalidação.
- [ ] `manager` não consegue abrir `/admin/users` nem `/admin/audit`.
- [ ] Toda a escrita passa pela sessão do utilizador (RLS), nunca pela service role.
- [ ] Nenhuma acção destrutiva sem confirmação.
- [ ] Teclado e leitor de ecrã funcionam em todos os formulários.

---

## 6. Fase 4 — Analytics anónimos (P1)

### 4.1 Dados e privacidade

- [ ] Migration `0006_analytics.sql`: `analytics_events`, `analytics_daily_summary`.
- [ ] Sessão `crypto.randomUUID()` em `sessionStorage`; renovar após 30 min inactivos.
- [ ] Sem cookies, sem `localStorage`, sem fingerprint, sem geolocalização.
- [ ] `feedback_submitted` nunca leva `anonymous_session_id`.
- [ ] Hash de IP apenas em memória/Redis com TTL 1 h; nunca na base.

### 4.2 Cliente de eventos

- [ ] `menu_opened` uma vez por sessão; grupo/categoria/produto/pesquisa conforme especificação.
- [ ] Tempo activo com pausa após 30 s e cap de 5 min.
- [ ] Lote de ≤ 10 eventos ou 5 s; `sendBeacon` no `pagehide`.
- [ ] Falha de rede descarta em silêncio; nunca afecta o menu.

### 4.3 Endpoint

- [ ] `POST /api/analytics/events` com Zod, service role e `on conflict do nothing`.
- [ ] Rate limit 60/min e 600/h por hash de IP.
- [ ] Resposta 204 mesmo em erro de validação.

### 4.4 Agregação e dashboard

- [ ] `pg_cron` diário às 02:00 `Africa/Luanda` para o resumo.
- [ ] KPIs sem dados suficientes mostram “—”, nunca números inventados.
- [ ] Rankings, séries, filtros de período e comparativos.
- [ ] Exportação CSV.

### 4.5 Retenção

- [ ] 30 dias: anular `anonymous_session_id`.
- [ ] 90 dias: apagar eventos.
- [ ] Job documentado e testado.

---

## 7. Fase 5 — Feedback privado (P1)

- [ ] Migration `0007_feedback.sql`: `customer_feedback`, `feedback_internal_notes`.
- [ ] Formulário público: tipo, **estrelas 1–5 e comentário obrigatórios** (10–2000 caracteres).
- [ ] Nome (≤ 80) e contacto (≤ 120) opcionais.
- [ ] Honeypot, tempo mínimo de 3 s e rate limit 3/hora.
- [ ] `POST /api/feedback` com service role; resposta 201 sem devolver ID.
- [ ] Aviso de privacidade junto ao formulário.
- [ ] Inbox no admin: filtros por estado/tipo/nota, notas internas, contadores.
- [ ] Estados `new` → `in_review` → `resolved` → `archived`, com `resolved_at`.
- [ ] Exportação CSV.
- [ ] Página `/privacidade` com contacto da gerência e prazos de retenção.
- [ ] Feedback nunca visível ao público; sem email na v1.

---

## 8. Fase 6 — Qualidade, segurança e lançamento (P0)

### 8.1 Testes

- [ ] Unitários: formatação de preços, horário, normalização de pesquisa.
- [ ] Integração: queries públicas, server actions, importação CSV.
- [ ] RLS: `anon`, `manager`, `admin` em todas as tabelas (incluindo tentativas de escrita anon).
- [ ] E2E: abrir menu, pesquisar, abrir detalhe, enviar feedback, login, editar e publicar produto.
- [ ] CI a correr testes além de lint/tipos/build.

### 8.2 Segurança

- [ ] CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS.
- [ ] Service role apenas no servidor; varrer o bundle por fugas.
- [ ] Validação de uploads (tipo real, tamanho, nome).
- [ ] Rate limiting no login, analytics e feedback.
- [ ] Revisão de dependências e cabeçalhos.

### 8.3 Acessibilidade e performance

- [ ] WCAG AA: foco visível, contraste, teclado, rótulos, `aria-live`.
- [ ] Respeitar `prefers-reduced-motion`.
- [ ] Lighthouse mobile ≥ 90 no público e no dashboard.
- [ ] p75: LCP ≤ 2,5 s · INP ≤ 200 ms · CLS ≤ 0,1.
- [ ] JS inicial ≤ 180 KB, CSS ≤ 30 KB, payload do menu ≤ 80 KB (gzip).
- [ ] Teste em Android modesto e 4G simulada.

### 8.4 Operação

- [ ] Backups do Supabase e teste de restauro.
- [ ] Monitorização de erros e uptime.
- [ ] Runbook: deploy, rollback, recuperação de admin, actualização de menu.
- [ ] Formação breve da gerência + guia de uma página.

### Checklist de lançamento

- [ ] Conteúdo aprovado e 20 itens verificados por amostragem.
- [ ] Preços, IVA e disponibilidade confirmados.
- [ ] Contactos, morada e horário publicados.
- [ ] QR testado em iOS e Android na rede do restaurante.
- [ ] Login e recuperação de password testados.
- [ ] Feedback recebido na inbox e notificação interna definida.
- [ ] `/privacidade` publicada.
- [ ] Monitorização nas primeiras 48 h e plano de rollback.

---

## 9. Ordem recomendada e marcos

| Marco | Conteúdo | Depende de |
|---|---|---|
| M0 | Deploy Vercel + domínio + QR | variáveis e domínio |
| M1 | Fase 0 concluída e menu publicado | CSV, fotos e dados do restaurante |
| M2 | Fase 3 (admin) | M0 + schema actual |
| M3 | Fase 4 (analytics) | M2 + Upstash (opcional) |
| M4 | Fase 5 (feedback) | M2 + textos de privacidade |
| M5 | Fase 6 e lançamento | M1–M4 |

A Fase 3 pode começar já, em paralelo com a recolha de conteúdo. As Fases 4 e 5
podem avançar sem conteúdo real, mas só fazem sentido depois do admin estável.

---

## 10. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Menu sem dados revistos | lançamento bloqueado | importação CSV + publicação faseada |
| Fotos sem autorização | risco legal | confirmar direitos por escrito |
| Password inicial fraca | acesso indevido ao admin | rodar password e limitar tentativas |
| Migrations só remotas | ambientes divergentes | manter migrations versionadas; nunca editar SQL aplicado |
| RLS mal configurada | fuga de feedback/analytics | matriz de testes antes do lançamento |
| ISR desactualizado | preços errados no público | `revalidatePath('/')` em cada publicação |
| Conta Vercel/GitHub errada | deploy no sítio errado | confirmar contas antes de publicar domínio |
| Região `eu-west-1` vs. `eu-central-1` | latência ligeira | aceite; documentado |
| Logótipo SVG ser PNG embutido | impressão/qualidade | pedir vector original |

---

## 11. Como continuar noutra máquina

```bash
git clone https://github.com/docflexangola-hash/la-cabanne.git
cd la-cabanne
npm install
copy .env.example .env.local   # preencher com as chaves do Supabase
npm run dev
```

- As migrations 0001–0004 e o seed **já foram aplicados** ao projecto remoto.
- Para novas migrations: criar `supabase/migrations/000N_*.sql` e aplicar com
  `supabase db push --db-url <connection-string>`.
- O primeiro administrador já existe; para criar outro:
  `node --env-file=.env.local scripts/create-admin.mjs` com `ADMIN_*` definidos.
- Nunca fazer `supabase db reset` contra o projecto remoto.
- Chaves locais: `keys.md` e `.env.local` estão no `.gitignore`; não versionar.

Variáveis necessárias: ver secção 4. Nenhum valor secreto pertence ao repositório.

---

## 12. Decisões já tomadas

- Repositório público; PRD, especificação e briefs de imagem ficam fora do Git.
- Supabase em `eu-west-1` (a especificação previa `eu-central-1`).
- Chaves legacy JWT (anon/service) por compatibilidade com Auth Admin.
- Menu público com ISR de 300 s e invalidação explícita após publicações.
- `unavailable` visível como “Esgotado” (já reflectido na RLS).
- Formulário de feedback adiado para a Fase 5.
- Imagem de ambiente gerada por IA removida de `public/`.
- PT-PT apenas; sem pagamentos, encomendas, contas de cliente, chat ou PWA.
