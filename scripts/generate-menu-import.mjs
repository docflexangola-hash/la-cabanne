import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const inputCsv = join(process.cwd(), 'La_Cabanne_Cardapio_Extraido', 'la_cabanne_cardapio.csv');
const outputCsv = join(process.cwd(), 'La_Cabanne_Cardapio_Extraido', 'menu-import-lacabanne.csv');

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
        currentRow.push(currentVal);
        currentVal = '';
      } else if (char === '\r') {
        // ignore
      } else if (char === '\n') {
        currentRow.push(currentVal);
        if (currentRow.length > 0 && currentRow.some((c) => c.trim() !== '')) {
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
    currentRow.push(currentVal);
    lines.push(currentRow);
  }

  return lines;
}

function escapeCsvField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const content = readFileSync(inputCsv, 'utf-8');
const rows = parseCSV(content);
const header = rows[0];

const outHeader = [
  'grupo',
  'categoria',
  'produto',
  'descricao',
  'preco_kz',
  'nota_preco',
  'variantes',
  'tags',
  'alergenios',
  'doses',
  'imagem',
  'imagem_alt'
];

const outRows = [outHeader];

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length === 0) continue;
  if (row[0] && row[0].trim().startsWith('#')) continue;

  const get = (idx) => (row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : '');

  let grupo = get(0);
  let categoria = get(1);
  const produto = get(2);
  const precoKzRaw = get(3);
  const descricao = get(4);
  const precoDoseRaw = get(5);
  // status_revisao in index 6

  if (grupo === 'Bar & Lounge') {
    grupo = 'Bebidas';
  }

  // Map categories to match seed.sql
  if (categoria === 'Entradas/Aperitivos') categoria = 'Entradas e Aperitivos';
  if (categoria === 'Mariscos / Frutos do Mar') categoria = 'Mariscos e Frutos do Mar';
  if (categoria === 'Cafés & Chás') categoria = 'Cafés e Chás';
  if (categoria === 'Refrigerantes e Bebidas Energéticas') categoria = 'Refrigerantes e Energéticas';
  if (categoria === 'Massas – Yakissoba') categoria = 'Massas / Yakissoba';

  const precoKz = precoKzRaw === '' ? '' : precoKzRaw;
  const precoDose = precoDoseRaw === '' ? '' : precoDoseRaw;

  let variantes = '';
  // Create variants for spirits/wines by bottle with dose
  if (precoDose && precoKz) {
    // Only for categories where dose makes sense
    const doseCats = [
      'Whisky e Brandy',
      'Gin e Vodka',
      'Licores e Vermutes',
      'Aguardentes',
      'Brandes',
      'Runs',
      'Tequilas',
      'Conhaques'
    ];
    if (doseCats.includes(categoria)) {
      variantes = `Opções:Dose=${precoDose};Garrafa=${precoKz}`;
    }
  }

  const outRow = [
    grupo,
    categoria,
    produto,
    descricao,
    precoKz, // keep bottle price as base price
    '',
    variantes,
    '',
    '',
    '',
    '',
    ''
  ];

  // If variants exist, we still need to satisfy script: hasPrice OR hasPriceNote OR hasVariants
  // script checks: if (!hasPrice && !hasPriceNote && !hasVariants) error
  // so with variantes set it's fine
  outRows.push(outRow);
}

const csvOut = outRows.map(r => r.map(escapeCsvField).join(',')).join('\r\n') + '\r\n';
writeFileSync(outputCsv, csvOut, 'utf-8');
console.log('Gerado:', outputCsv);
console.log('Linhas:', outRows.length - 1);
