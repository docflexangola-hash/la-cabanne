/**
 * Script de importação validada do cardápio a partir de CSV.
 * Usa REST API direta (sem dependências npm).
 */

import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const filePath = args.find((a) => !a.startsWith('--'));

if (!filePath) {
  console.error('Uso: node --env-file=.env.local scripts/import-menu.mjs <caminho.csv> [--dry-run]');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const restUrl = `${url}/rest/v1`;
const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=representation'
};

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCSV(content) {
  const lines = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\r') {
      } else if (char === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.length > 0 && currentRow.some((c) => c !== '')) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    lines.push(currentRow);
  }

  return lines;
}

function parseVariantsString(str) {
  if (!str || !str.trim()) return [];
  const groups = [];
  const groupParts = str.split('|');
  for (const gp of groupParts) {
    const colonIdx = gp.indexOf(':');
    if (colonIdx === -1) continue;
    const groupName = gp.slice(0, colonIdx).trim();
    const optionsStr = gp.slice(colonIdx + 1).trim();
    const variants = [];
    const optionPairs = optionsStr.split(';');
    let ord = 1;
    for (const opt of optionPairs) {
      const eqIdx = opt.indexOf('=');
      if (eqIdx === -1) continue;
      const optName = opt.slice(0, eqIdx).trim();
      const optPrice = parseInt(opt.slice(eqIdx + 1).trim(), 10);
      if (optName && !isNaN(optPrice)) {
        variants.push({ name: optName, price: optPrice, display_order: ord++, is_active: true });
      }
    }
    if (groupName && variants.length > 0) {
      groups.push({ name: groupName, display_order: groups.length + 1, is_required: true, variants });
    }
  }
  return groups;
}

async function fetchAll(table, select) {
  const res = await fetch(`${restUrl}/${table}?select=${encodeURIComponent(select)}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
  if (!res.ok) throw new Error(`Erro ao ler ${table}: ${res.status}`);
  return res.json();
}

async function upsertProduct(prod) {
  const res = await fetch(`${restUrl}/products?on_conflict=category_id,slug`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(prod)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }
  const data = await res.json();
  return data[0];
}

async function deleteVariants(groupIds) {
  if (groupIds.length === 0) return;
  // delete groups cascades variants
  const res = await fetch(`${restUrl}/variant_groups?id=in.(${groupIds.map(g => `"${g}"`).join(',')})`, {
    method: 'DELETE',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });
  return res.ok;
}

async function insertGroup(group) {
  const res = await fetch(`${restUrl}/variant_groups`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(group)
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data[0];
}

async function insertVariants(vars) {
  if (vars.length === 0) return;
  const res = await fetch(`${restUrl}/product_variants`, {
    method: 'POST',
    headers: { ...headers },
    body: JSON.stringify(vars)
  });
  if (!res.ok) throw new Error(await res.text());
}

async function run() {
  console.log(`\n=== Importação de Cardápio: La Cabanne ===`);
  console.log(`Ficheiro: ${filePath}`);
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (Simulação - sem escrita)' : 'PRODUÇÃO (Gravar na BD)'}\n`);

  let fileContent;
  try {
    fileContent = readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Erro ao ler o ficheiro: ${err.message}`);
    process.exit(1);
  }

  const rawRows = parseCSV(fileContent);
  if (rawRows.length < 2) {
    console.error('O ficheiro CSV está vazio ou contém apenas o cabeçalho.');
    process.exit(1);
  }

  const header = rawRows[0].map((h) => h.toLowerCase());
  const dataRows = rawRows.slice(1).filter((r) => r[0] && !r[0].startsWith('#'));

  const dbGroups = await fetchAll('menu_groups', 'id,slug,name');
  const dbCategories = await fetchAll('categories', 'id,slug,name,group_id');

  const groupMap = new Map((dbGroups || []).map((g) => [g.slug, g]));
  const catMap = new Map((dbCategories || []).map((c) => [`${c.group_id}:${c.slug}`, c]));

  let totalLines = 0;
  let validProducts = 0;
  let errorsCount = 0;
  const errors = [];
  const parsedItems = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const lineNum = i + 2;
    totalLines++;

    const rowObj = {};
    header.forEach((key, idx) => {
      rowObj[key] = row[idx] !== undefined ? row[idx] : '';
    });

    const grupo = rowObj.grupo || '';
    const categoria = rowObj.categoria || '';
    const produto = rowObj.produto || '';
    if (!grupo || !categoria || !produto) {
      errorsCount++;
      errors.push(`Linha ${lineNum}: Grupo/Categoria/Produto obrigatórios`);
      continue;
    }
    if (produto.length > 120) {
      errorsCount++;
      errors.push(`Linha ${lineNum}: Nome do produto demasiado longo`);
      continue;
    }

    const groupSlug = slugify(grupo);
    const catSlug = slugify(categoria);
    const prodSlug = slugify(produto);

    const group = groupMap.get(groupSlug);
    if (!group) {
      errorsCount++;
      errors.push(`Linha ${lineNum}: Grupo "${grupo}" (slug: ${groupSlug}) não existe na BD.`);
      continue;
    }

    const category = catMap.get(`${group.id}:${catSlug}`);
    if (!category) {
      errorsCount++;
      errors.push(`Linha ${lineNum}: Categoria "${categoria}" (slug: ${catSlug}) não existe no grupo "${grupo}".`);
      continue;
    }

    const precoKz = rowObj.preco_kz ? parseInt(rowObj.preco_kz, 10) : null;
    const notaPreco = rowObj.nota_preco || null;
    const variantesStr = rowObj.variantes || '';
    const variantGroups = parseVariantsString(variantesStr);
    const hasPrice = precoKz !== null && !isNaN(precoKz);
    const hasPriceNote = Boolean(notaPreco && String(notaPreco).trim().length > 0);
    const hasVariants = variantGroups.length > 0;

    if (!hasPrice && !hasPriceNote && !hasVariants) {
      errorsCount++;
      errors.push(`Linha ${lineNum}: Produto "${produto}" não tem preço, nota de preço nem variantes.`);
      continue;
    }
    if (rowObj.imagem && !rowObj.imagem_alt) {
      errorsCount++;
      errors.push(`Linha ${lineNum}: Produto "${produto}" tem imagem mas não tem imagem_alt.`);
      continue;
    }

    const tags = (rowObj.tags || '').split(';').map((t) => t.trim()).filter(Boolean);
    const allergens = (rowObj.alergenios || '').split(';').map((a) => a.trim()).filter(Boolean);

    parsedItems.push({
      categoryId: category.id,
      name: produto,
      slug: prodSlug,
      description: rowObj.descricao || null,
      basePrice: hasPrice ? precoKz : null,
      priceNote: hasPriceNote ? String(notaPreco).trim() : null,
      imagePath: rowObj.imagem || null,
      imageAlt: rowObj.imagem_alt || null,
      tags,
      allergens,
      serves: rowObj.doses || null,
      status: 'draft',
      variantGroups
    });

    validProducts++;
  }

  console.log(`Relatório de Validação:`);
  console.log(`- Linhas lidas: ${totalLines}`);
  console.log(`- Produtos válidos: ${validProducts}`);
  console.log(`- Erros encontrados: ${errorsCount}\n`);

  if (errors.length > 0) {
    console.log(`Erros detalhados:`);
    errors.forEach((err) => console.log(`  ✗ ${err}`));
    console.log('');
  }

  if (isDryRun) {
    console.log(`[DRY RUN COMPLETO] Nenhuma gravação efetuada na base de dados.`);
    return;
  }

  if (errorsCount > 0) {
    console.log(`Aviso: existem ${errorsCount} linhas com erros que não serão importadas.`);
  }

  console.log(`A gravar ${parsedItems.length} produtos como "draft" na base de dados...`);

  let importedCount = 0;
  for (const item of parsedItems) {
    try {
      const prod = await upsertProduct({
        category_id: item.categoryId,
        name: item.name,
        slug: item.slug,
        description: item.description,
        base_price: item.basePrice,
        price_note: item.priceNote,
        image_path: item.imagePath,
        image_alt: item.imageAlt,
        tags: item.tags,
        allergens: item.allergens,
        serves: item.serves,
        status: 'published',
        published_at: new Date().toISOString()
      });

      if (item.variantGroups.length > 0 && prod?.id) {
        // get existing groups
        const existing = await fetchAll('variant_groups', 'id').then(async () => {
          const res = await fetch(`${restUrl}/variant_groups?product_id=eq.${prod.id}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } });
          return res.ok ? res.json() : [];
        });
        if (existing.length > 0) {
          await deleteVariants(existing.map(e => e.id));
        }
        for (const vg of item.variantGroups) {
          const insertedGroup = await insertGroup({
            product_id: prod.id,
            name: vg.name,
            display_order: vg.display_order,
            is_required: vg.is_required
          });
          if (insertedGroup?.id) {
            const variantsToInsert = vg.variants.map((v) => ({
              group_id: insertedGroup.id,
              name: v.name,
              price: v.price,
              display_order: v.display_order,
              is_active: v.is_active
            }));
            await insertVariants(variantsToInsert);
          }
        }
      }
      importedCount++;
    } catch (e) {
      console.error(`Erro ao gravar "${item.name}":`, e.message);
    }
  }

  console.log(`\nImportação concluída com sucesso: ${importedCount} produtos inseridos como rascunho.`);
}

run().catch((err) => {
  console.error('Falha crítica na importação:', err);
  process.exit(1);
});
