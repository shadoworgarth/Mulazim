#!/usr/bin/env node
/**
 * patch-from-excel.mjs
 * Regenerates / updates all fines constants from official SFDA Excel files.
 *
 * Files processed:
 *  feed_excel   → animal-feed-fines.ts   (fully regenerated, code reversed)
 *  food_excel   → food-fines-v2.ts       (fully regenerated)
 *  cosmetics_excel → cosmetics-fines.ts  (fully regenerated)
 *  drugs_excel  → pharma-fines.ts        (generated from scratch)
 *  vet_excel    → veterinary-fines.ts    (generated from scratch, unit/warning swapped)
 *  med_dev_excel → medical-devices-fines.ts (merge: keep amounts, update violation+legalBasis)
 *
 * Column layout (feed, food, cosmetics, drugs):
 *   0=code, 1=violation, 2=fineType, 3-6=large, 7-10=medium, 11-14=small,
 *   15=warning, 16=unit, 17=legalBasis
 *
 * Column layout (vet) — unit/warning swapped:
 *   0=code, 1=violation, 2=fineType, 3-6=large, 7-10=medium, 11-14=small,
 *   15=unit, 16=warning, 17=legalBasis
 *
 * Feed Excel article code format: section/chapter/violation
 *   → reverse to get constants format: violation/chapter/section
 * All others: violation/chapter/section (same as constants)
 *
 * Med-dev Excel: code/violation/legalBasis only (no fine amounts)
 */

import XLSX from 'xlsx';
import fs from 'fs';

const ASSETS = '/home/runner/workspace/attached_assets';
const CONSTANTS = '/home/runner/workspace/artifacts/mobile/constants';

// ── Arabic ordinal → number ────────────────────────────────────────────────
const ARABIC_ORDINALS = {
  'الأول': 1, 'الأولى': 1,
  'الثاني': 2, 'الثانى': 2, 'الثانية': 2,
  'الثالث': 3, 'الثالثة': 3,
  'الرابع': 4, 'الرابعة': 4,
  'الخامس': 5, 'الخامسة': 5,
  'السادس': 6, 'السادسة': 6,
  'السابع': 7, 'السابعة': 7,
  'الثامن': 8, 'الثامنة': 8,
  'التاسع': 9, 'التاسعة': 9,
  'العاشر': 10, 'العاشرة': 10,
  'الحادي عشر': 11, 'الحادى عشر': 11,
  'الثاني عشر': 12,
};

function extractChapterNum(label) {
  for (const [ar, num] of Object.entries(ARABIC_ORDINALS)) {
    if (label.includes(ar)) return num;
  }
  return 0;
}

// ── Number parsing ─────────────────────────────────────────────────────────
function parseNum(v) {
  if (typeof v === 'number' && !isNaN(v)) return v;
  const s = String(v || '').replace(/,/g, '').trim();
  const n = Number(s);
  return s && !isNaN(n) ? n : null;
}

function parseFineGrade(row, colStart) {
  const a = parseNum(row[colStart]);
  if (a === null) return null;
  const b = parseNum(row[colStart + 1]);
  const c = parseNum(row[colStart + 2]);
  const d = parseNum(row[colStart + 3]);
  return { a, b: b ?? a, c: c ?? a, d: d ?? a };
}

// ── Row classification ─────────────────────────────────────────────────────
function isCodeRow(row) {
  return /^\d+\/\d+\/\d+$/.test(String(row[0] || '').trim());
}

function isMinRow(row) {
  return String(row[2] || '').includes('الأدنى');
}

function clean(s) {
  return String(s || '').trim().replace(/[\u00A0\u200B]/g, ' ').replace(/\s+/g, ' ');
}

// Escape a value for embedding inside a TypeScript double-quoted string literal
function esc(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// ── Standard sheet parser ──────────────────────────────────────────────────
// codeReversed=true: feed Excel (section/chapter/violation) → flip to violation/chapter/section
// warningCol, unitCol: column indices (15,16 for most; 16,15 for vet)
function parseStandardSheet(rows, { sectionNum, sectionLabel, codeReversed, warningCol, unitCol }) {
  const entries = [];
  let chapter = 0;
  let chapterLabel = '';
  let i = 0;

  while (i < rows.length) {
    const row = rows[i];

    if (isMinRow(row)) { i++; continue; }

    if (!isCodeRow(row)) {
      // Scan all cells for chapter header
      for (const cell of row) {
        const s = clean(String(cell || ''));
        if (s.includes('الفصل') && s.length > 10) {
          const num = extractChapterNum(s);
          if (num > 0) { chapter = num; chapterLabel = s; }
          break;
        }
      }
      i++;
      continue;
    }

    const rawCode = String(row[0]).trim();
    const parts = rawCode.split('/');
    const constantsCode = codeReversed
      ? [parts[2], parts[1], parts[0]].join('/')
      : rawCode;

    // Use chapter from code (middle part is always chapter)
    const codeChapter = parseInt(parts[1], 10);
    if (chapter !== codeChapter) chapter = codeChapter;

    const fineTypeCell = clean(row[2]);
    const isMax = fineTypeCell.includes('الأعلى');
    const fineType = isMax ? 'range' : 'fixed';

    const maxLarge = parseFineGrade(row, 3);
    const maxMedium = parseFineGrade(row, 7);
    const maxSmall = parseFineGrade(row, 11);

    if (!maxLarge) { i++; continue; }

    let minLarge = maxLarge, minMedium = maxMedium, minSmall = maxSmall;

    if (isMax && i + 1 < rows.length && isMinRow(rows[i + 1])) {
      const minRow = rows[i + 1];
      minLarge  = parseFineGrade(minRow, 3)  ?? maxLarge;
      minMedium = parseFineGrade(minRow, 7)  ?? maxMedium;
      minSmall  = parseFineGrade(minRow, 11) ?? maxSmall;
      i++;
    }

    const warningStr = clean(row[warningCol]);
    // "ينطبق" = applicable, "لا ينطبق" = not applicable
    const warningApplicable = warningStr.startsWith('ينطبق') || warningStr === 'ينطبق';

    const legalBasis = clean(row[17]);

    entries.push({
      articleCode: constantsCode,
      section: sectionNum,
      sectionLabel,
      chapter,
      chapterLabel,
      violation: clean(row[1]),
      unit: clean(row[unitCol]),
      warningApplicable,
      fineType,
      finesMax: { large: maxLarge, medium: maxMedium, small: maxSmall },
      finesMin: { large: minLarge, medium: minMedium, small: minSmall },
      legalBasis,
    });

    i++;
  }

  return entries;
}

// ── Med-dev sheet parser (violation + legalBasis only) ─────────────────────
function parseMedDevSheet(rows, sectionNum, sectionLabel) {
  const entries = [];
  let headerPassed = false;

  for (const row of rows) {
    if (!headerPassed) {
      if (String(row[0] || '').trim() === 'كود') { headerPassed = true; }
      continue;
    }
    if (!isCodeRow(row)) continue;
    entries.push({
      articleCode: String(row[0]).trim(),
      sectionNum,
      sectionLabel,
      violation: clean(row[1]),
      legalBasis: clean(row[2]),
    });
  }

  return entries;
}

// ── JSON helpers ───────────────────────────────────────────────────────────
function fmtGrade(g) {
  return `{"a":${g.a},"b":${g.b},"c":${g.c},"d":${g.d}}`;
}
function fmtFines(f) {
  return `{"large":${fmtGrade(f.large)},"medium":${fmtGrade(f.medium)},"small":${fmtGrade(f.small)}}`;
}

// ── Generate full TypeScript file ──────────────────────────────────────────
function generateTS(header, exportConst, typeAnnotation, entries) {
  const lines = entries.map(e => {
    const base = `  { articleCode: "${esc(e.articleCode)}", section: ${e.section}, sectionLabel: "${esc(e.sectionLabel)}", chapter: ${e.chapter}, chapterLabel: "${esc(e.chapterLabel)}", violation: "${esc(e.violation)}", unit: "${esc(e.unit)}", warningApplicable: ${e.warningApplicable}, fineType: "${e.fineType}", finesMax: ${fmtFines(e.finesMax)}, finesMin: ${fmtFines(e.finesMin)}, legalBasis: "${esc(e.legalBasis)}" }`;
    return base;
  });
  return `${header}\n\nexport const ${exportConst}${typeAnnotation} = [\n${lines.join(',\n')}\n];\n`;
}

// ── Process standard Excel (feed/food/cosmetics/drugs/vet) ─────────────────
function processStandardExcel(xlsxPath, opts) {
  const wb = XLSX.readFile(xlsxPath);
  const allEntries = [];

  wb.SheetNames.forEach((sheetName, idx) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const entries = parseStandardSheet(rows, {
      sectionNum: idx + 1,
      sectionLabel: sheetName.trim(),
      codeReversed: opts.codeReversed ?? false,
      warningCol: opts.warningCol ?? 15,
      unitCol: opts.unitCol ?? 16,
    });
    allEntries.push(...entries);
  });

  return allEntries;
}

// ── Process med-dev Excel ──────────────────────────────────────────────────
function processMedDevExcel(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath);
  const allEntries = [];

  wb.SheetNames.forEach((sheetName, idx) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    allEntries.push(...parseMedDevSheet(rows, idx + 1, sheetName.trim()));
  });

  return allEntries;
}

// ── Med-dev merge: keep existing fine amounts, update violation + legalBasis ─
// Each entry in the TypeScript file is a single line. We process line by line so
// we never accidentally match inside nested grade objects (e.g. finesMax.large).
function mergeMedDev(existingContent, excelEntries) {
  const excelMap = new Map(excelEntries.map(e => [e.articleCode, e]));
  let updated = 0, notFound = 0;

  const newLines = existingContent.split('\n').map(line => {
    const codeMatch = line.match(/articleCode: "([^"]+)"/);
    if (!codeMatch) return line;

    const code = codeMatch[1];
    const ex = excelMap.get(code);
    if (!ex) { notFound++; return line; }
    updated++;

    const newViolation = esc(ex.violation);
    const newLegalBasis = esc(ex.legalBasis);

    // 1. Update violation text (match between violation: " ... ")
    let out = line.replace(/violation: "(?:[^"\\]|\\.)*"/, `violation: "${newViolation}"`);

    // 2. Remove any existing legalBasis field
    out = out.replace(/,\s*legalBasis: "(?:[^"\\]|\\.)*"/, '');

    // 3. Append legalBasis before the trailing }, or }
    out = out.replace(/(\s*\},?\s*)$/, `, legalBasis: "${newLegalBasis}" },`);

    return out;
  });

  console.log(`  med-dev: updated ${updated}, not found in Excel: ${notFound}`);
  return newLines.join('\n');
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════

// 1. Animal Feed  ─────────────────────────────────────────────────────────
console.log('\n=== 1. Animal Feed ===');
{
  const entries = processStandardExcel(`${ASSETS}/feed_excel_1782728688967.xlsx`, {
    codeReversed: true, // feed: section/chapter/violation → flip
    warningCol: 15,
    unitCol: 16,
  });
  console.log(`  Parsed ${entries.length} entries across ${new Set(entries.map(e => e.section)).size} sections`);

  const header = `import { FoodFineV2 } from "./food-fines-v2";\n\nexport type AnimalFeedFine = FoodFineV2;`;
  const ts = generateTS(header, 'ANIMAL_FEED_FINES', ': FoodFineV2[]', entries);
  fs.writeFileSync(`${CONSTANTS}/animal-feed-fines.ts`, ts, 'utf8');
  console.log('  Written: animal-feed-fines.ts');
}

// 2. Food  ────────────────────────────────────────────────────────────────
console.log('\n=== 2. Food ===');
{
  const entries = processStandardExcel(`${ASSETS}/food_excel_1782728688967.xlsx`, {
    codeReversed: false,
    warningCol: 15,
    unitCol: 16,
  });
  console.log(`  Parsed ${entries.length} entries across ${new Set(entries.map(e => e.section)).size} sections`);

  // Re-generate just the array part; preserve the interface/type definitions
  const existingHeader = `export interface CategoryFines {
  a: number | null;
  b: number | null;
  c: number | null;
  d: number | null;
}

export interface EstablishmentFines {
  small: CategoryFines;
  medium: CategoryFines;
  large: CategoryFines;
}

export interface FoodFineV2 {
  articleCode: string;
  section: number;
  sectionLabel: string;
  chapter: number;
  chapterLabel: string;
  violation: string;
  unit: string;
  warningApplicable: boolean;
  fineType: 'fixed' | 'range';
  finesMax: EstablishmentFines;
  finesMin: EstablishmentFines;
  legalBasis?: string;
}`;

  const lines = entries.map(e => {
    return `  { articleCode: "${esc(e.articleCode)}", section: ${e.section}, sectionLabel: "${esc(e.sectionLabel)}", chapter: ${e.chapter}, chapterLabel: "${esc(e.chapterLabel)}", violation: "${esc(e.violation)}", unit: "${esc(e.unit)}", warningApplicable: ${e.warningApplicable}, fineType: "${e.fineType}", finesMax: ${fmtFines(e.finesMax)}, finesMin: ${fmtFines(e.finesMin)}, legalBasis: "${esc(e.legalBasis)}" }`;
  });
  const ts = `${existingHeader}\n\nexport const FOOD_FINES_V2: FoodFineV2[] = [\n${lines.join(',\n')}\n];\n`;
  fs.writeFileSync(`${CONSTANTS}/food-fines-v2.ts`, ts, 'utf8');
  console.log('  Written: food-fines-v2.ts');
}

// 3. Cosmetics  ───────────────────────────────────────────────────────────
console.log('\n=== 3. Cosmetics ===');
{
  const entries = processStandardExcel(`${ASSETS}/cosmetics_excel_1782728688967.xlsx`, {
    codeReversed: false,
    warningCol: 15,
    unitCol: 16,
  });
  console.log(`  Parsed ${entries.length} entries across ${new Set(entries.map(e => e.section)).size} sections`);

  const header = `import { FoodFineV2 } from "./food-fines-v2";\n\nexport type CosmeticsFine = FoodFineV2;`;
  const ts = generateTS(header, 'COSMETICS_FINES', ': FoodFineV2[]', entries);
  fs.writeFileSync(`${CONSTANTS}/cosmetics-fines.ts`, ts, 'utf8');
  console.log('  Written: cosmetics-fines.ts');
}

// 4. Pharma / Drugs  ──────────────────────────────────────────────────────
console.log('\n=== 4. Pharma/Drugs ===');
{
  const entries = processStandardExcel(`${ASSETS}/drugs_excel_1782728688967.xlsx`, {
    codeReversed: false,
    warningCol: 15,
    unitCol: 16,
  });
  console.log(`  Parsed ${entries.length} entries across ${new Set(entries.map(e => e.section)).size} sections`);

  const header = `import { FoodFineV2 } from "./food-fines-v2";\n\nexport type PharmaFine = FoodFineV2;`;
  const ts = generateTS(header, 'PHARMA_FINES', ': FoodFineV2[]', entries);
  fs.writeFileSync(`${CONSTANTS}/pharma-fines.ts`, ts, 'utf8');
  console.log('  Written: pharma-fines.ts');
}

// 5. Veterinary  ──────────────────────────────────────────────────────────
console.log('\n=== 5. Veterinary ===');
{
  const entries = processStandardExcel(`${ASSETS}/vet_excel_1782728688967.xlsx`, {
    codeReversed: false,
    warningCol: 16, // swapped: unit=15, warning=16
    unitCol: 15,
  });
  console.log(`  Parsed ${entries.length} entries across ${new Set(entries.map(e => e.section)).size} sections`);

  const header = `import { FoodFineV2 } from "./food-fines-v2";\n\nexport type VeterinaryFine = FoodFineV2;`;
  const ts = generateTS(header, 'VETERINARY_FINES', ': FoodFineV2[]', entries);
  fs.writeFileSync(`${CONSTANTS}/veterinary-fines.ts`, ts, 'utf8');
  console.log('  Written: veterinary-fines.ts');
}

// 6. Medical Devices (merge)  ─────────────────────────────────────────────
console.log('\n=== 6. Medical Devices (merge) ===');
{
  const excelEntries = processMedDevExcel(`${ASSETS}/med_dev_excel_1782728688967.xlsx`);
  console.log(`  Parsed ${excelEntries.length} entries from Excel`);

  const existingPath = `${CONSTANTS}/medical-devices-fines.ts`;
  const existing = fs.readFileSync(existingPath, 'utf8');
  const updated = mergeMedDev(existing, excelEntries);
  fs.writeFileSync(existingPath, updated, 'utf8');
  console.log('  Written: medical-devices-fines.ts');
}

console.log('\n✓ Done');
