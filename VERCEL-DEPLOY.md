# Como usar o token Vercel para deploy

## Estado atual
- Token Vercel disponível em `k.md`: `vcp_3iOb54RRfTYQGtcZIAbjXyKGARL17LbiARktww5cWuWhYTjTRR1HgFSL`
- Projeto já linkado: `docflexangola-5133s-projects/la-cabanne` (via `vercel link`)
- CLI Vercel instalado (v54.9.1)

## Opções para deploy

### Opção 1: Deploy direto com token (recomendado)
```bash
npx vercel --token vcp_3iOb54RRfTYQGtcZIAbjXyKGARL17LbiARktww5cWuWhYTjTRR1HgFSL --prod
```

### Opção 2: Definir variável de ambiente
```bash
# Windows PowerShell
$env:VERCEL_TOKEN="vcp_3iOb54RRfTYQGtcZIAbjXyKGARL17LbiARktww5cWuWhYTjTRR1HgFSL"
npx vercel --prod

# Windows CMD
set VERCEL_TOKEN=vcp_3iOb54RRfTYQGtcZIAbjXyKGARL17LbiARktww5cWuWhYTjTRR1HgFSL
npx vercel --prod
```

### Opção 3: Usar .vercel/project.json (já existe)
O projeto já está linkado, então `vercel --prod` deve funcionar se autenticado.

## Passos necessários antes do deploy

1. **Configurar variáveis de ambiente no Vercel**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (URL final do domínio)
   - `ANALYTICS_IP_SALT`
   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (opcionais)

2. **Configurar domínio**
   - Adicionar domínio no Vercel
   - Configurar DNS
   - Atualizar `NEXT_PUBLIC_SITE_URL`

3. **Configurar Supabase**
   - Authentication → URL Configuration: Site URL e Redirect URLs
   - Adicionar domínio do Vercel às URLs permitidas

## Comando para deploy agora
Como o projeto já está linkado, podemos fazer:
```bash
npx vercel --token vcp_3iOb54RRfTYQGtcZIAbjXyKGARL17LbiARktww5cWuWhYTjTRR1HgFSL --prod --yes
```

## Notas de segurança
- O token está em `k.md` - não commitar
- Usar sempre com `--token` ou variável de ambiente
- Remover token de ficheiros após uso se desejado
