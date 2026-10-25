# La Cabanne — Menu Digital

Menu público por QR code e painel de administração para o La Cabanne (Benguela).
Construído com Next.js 16 (App Router), TypeScript, Tailwind CSS 4 e Supabase.

O menu público funciona sem autenticação. O painel fica em `/admin` e exige conta
de equipa. Preços são sempre apresentados em kwanzas (Kz), com IVA incluído.

---

## Requisitos

- Node.js 20.9 ou superior
- npm 10 ou superior
- Um projecto Supabase (Postgres, Auth, Storage)

## Instalação

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

Abre <http://localhost:3000>. Sem variáveis do Supabase o menu público continua a
funcionar (estado vazio honesto) e `/admin/login` avisa que falta configuração.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | URL do projecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | Chave anónima (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | sim (server) | Apenas para scripts; nunca expor no browser |
| `NEXT_PUBLIC_SITE_URL` | sim | URL canónica, sem barra final |
| `ANALYTICS_IP_SALT` | produção | Sal do hash efémero de IP (Fase 3) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | opcional | Rate limiting distribuído |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | script | Usadas só por `npm run admin:create` |

Nunca prefixar segredos com `NEXT_PUBLIC_`.

## Base de dados

As migrations estão em `supabase/migrations` e correm por ordem:

1. `0001_enums.sql` — tipos enumerados
2. `0002_menu_schema.sql` — grupos, categorias, produtos, variantes
3. `0003_access_control.sql` — perfis de equipa, RLS, funções auxiliares, definições
4. `0004_storage.sql` — bucket público `menu-images` e políticas de upload

`supabase/seed.sql` cria apenas a estrutura real: 3 grupos e 35 categorias, sem
produtos. Nenhum preço ou produto é inventado.

Com a CLI do Supabase instalada e Docker a correr:

```bash
supabase start
supabase db reset      # aplica migrations + seed
```

Num projecto remoto, aplica os ficheiros SQL pela consola do Supabase, por ordem.
A região prevista é `eu-central-1`.

## Criar o primeiro administrador

Com `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME`
preenchidos em `.env.local`:

```bash
npm run admin:create
```

O script cria o utilizador no Supabase Auth e o perfil correspondente com o papel
`admin`. Só depois disso é possível entrar em `/admin/login`.

## Scripts

| Comando | Efeito |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run start` | serve o build |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run admin:create` | cria conta de administrador |

## Deploy (Vercel)

1. Importa o repositório na Vercel (framework Next.js, sem configuração extra).
2. Define as variáveis de `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` e `ANALYTICS_IP_SALT`.
3. Aplica as migrations no projecto Supabase antes do primeiro deploy.
4. O menu público usa ISR de 300 s; alterações no painel devem chamar
   `revalidatePath('/')` para aparecerem de imediato.

## Estrutura

```
src/
  app/
    page.tsx              menu público (ISR + estado vazio honesto)
    menu/page.tsx         alias permanente para /
    admin/                login + painel protegido
    api/health            verificação de configuração
  components/
    menu/                 cabeçalho, grupos, estado vazio
    admin/                shell e placeholders de fase
  lib/
    supabase/             clientes browser, servidor e admin
    auth/                 guard e server actions
  proxy.ts                refresh de sessão + protecção de /admin
supabase/
  migrations/             0001–0004
  seed.sql                grupos e categorias reais
public/
  brand/                  logótipo, ícones, textura
  images/                 imagens OG e ilustração de estado vazio
```

## Assets

O pacote original de assets não é versionado; as cópias de produção estão em
`public/`. Notas de produção:

- `01-logo-cor.svg` é um PNG embutido, não um vector; pedir o original vectorial.
- `03-icone-app.png` não tem transparência nos cantos; reexportar antes da loja.

## Privacidade

A análise será anónima e limitada à sessão (Fase 3): identificador efémero, sem IP
completo, sem fingerprinting e sem acompanhamento entre visitas. O feedback é
privado da gerência.

## Estado

- **Fase 1 — Fundação:** concluída (scaffold, tokens, layout público, autenticação,
  migrations, CI).
- **Fase 2 — Menu público:** implementada a estrutura completa (grupos, categorias,
  lista, detalhe, pesquisa, informação). Mostra um estado vazio honesto até existir
  conteúdo revisto no Supabase.
- **Fase 3 — Administração:** por iniciar (CRUD de produtos, categorias, upload).
- **Fase 4 — Analytics e feedback:** por iniciar.

### Menu público

- `getPublicMenu()` lê grupos, categorias, produtos e variantes em três consultas
  indexadas e monta o payload no servidor; a página usa ISR de 300 s.
- O cliente guarda o payload em memória: troca de grupo/categoria é instantânea.
- Pesquisa local sobre nome e descrição, sem diacríticos, máximo 40 resultados.
- Estado partilhável `/?g=grupo&c=categoria` (actualizado com `replaceState`).
- Detalhe em `<dialog>` nativo: bottom sheet em mobile, modal de 880 px em desktop.
- Sem carrinho, encomendas ou pagamentos.

Os documentos internos de produto (`prd.md`, `ESPECIFICACAO.md` e `IMAGENS.md`)
ficam fora deste repositório público.
