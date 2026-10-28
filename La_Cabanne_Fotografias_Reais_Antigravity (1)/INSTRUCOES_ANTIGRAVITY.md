# LA CABANNE — PLANO DE INTEGRAÇÃO DAS FOTOGRAFIAS REAIS

Documento para Google Antigravity — suporte ao PRD v1.2.

## Princípio UX obrigatório
Este produto é um MENU DIGITAL mobile-first e não um website institucional. As fotografias não devem criar uma landing page com hero gigante ou scroll infinito. Após abrir o QR code o utilizador deve encontrar rapidamente grupos, categorias, pesquisa, produtos e preços.

## Assets e destino

- `01-lounge-noturno.webp` (original `01-lounge-noturno.jpg`, 960x1440): Informações > Ambiente, secção Lounge, formato vertical; nunca como hero obrigatório.
- `02-piscina-noite.webp` (original `02-piscina-noite.jpg`, 1440x960): Informações > Galeria do espaço, segunda fotografia; ideal como cartão de ambiente.
- `03-fachada-piscina.webp` (original `03-fachada-piscina.jpg`, 987x762): Informações > fotografia principal; fachada do restaurante com letreiro.
- `04-piscina-fachada-panoramica.webp` (original `04-piscina-fachada-panoramica.jpg`, 987x762): Informações > fotografia panorâmica do estabelecimento; eventual OG com composição dedicada.
- `05-interior-restaurante.webp` (original `05-interior-restaurante.jpg`, 1440x960): Informações > interior; contextualização discreta de Refeições; fundo do login admin.
- `06-prato-experiencia.webp` (original `06-prato-experiencia.jpg`, 1080x1440): Contexto gastronómico opcional de Refeições; não atribuir a produto sem confirmação.

## Regras de utilização
- Guardar sob `/public/images/la-cabanne/`. Utilizar `next/image` para tamanhos responsivos, `sizes` correctos e lazy-loading abaixo do primeiro ecrã.
- Só imagem contextual nas vistas Informações / Ambiente e, opcionalmente, num pequeno destaque que não impeça a navegação do menu. NÃO apresentar todas as fotos numa página longa de menu.
- O login do admin pode usar `05-interior-restaurante.webp` em desktop, com overlay que preserve contraste. Em mobile preferir fundo simples.
- `03-fachada-piscina` é melhor candidata a imagem de estabelecimento; `04-piscina-fachada-panoramica` pode ser usada na composição de OG, mas gerar OG final 1200x630 com logo e título via código, não assumir que o JPEG tem essa proporção.
- `06-prato-experiencia.webp` mostra prato real, mas NÃO sabemos qual item do cardápio é. Nunca anexar a um produto específico sem aprovação do restaurante.
- As fotografias têm possível marca d'água/crédito de fotógrafo e de redes sociais: preservar atribuição e confirmar direitos de uso; não remover marca de água.
- Para um menu rápido, só pré-carregar imagens realmente visíveis no primeiro ecrã. As outras devem ser lazy-loaded.
- Definir texto alternativo descritivo e específico, sem atribuir características não comprovadas.

## Hierarquia recomendada
`/menu` → header pequeno com logo; grupos (Refeições, Sushi, Bebidas); categorias; lista de produtos; pesquisa.
`/informacoes` (ou bottom-sheet) → foto 03, bloco curto com contacto/horário, mini galeria opcional 01,02,04,05.
`/admin/login` → foto 05 em desktop se não prejudicar legibilidade; mobile minimalista.

## Verificações antes de produção
Confirmar permissão de utilização comercial e créditos; identidade da fotografia do prato; conteúdos exactos de contactos e horário; fotografia OG final.
