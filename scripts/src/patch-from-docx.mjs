#!/usr/bin/env node
/**
 * patch-from-docx.mjs
 * Extracts violation texts from the official SFDA Word documents (DOCX) and
 * patches ONLY the `violation` field in the two constants files.
 * Fine amounts, warningApplicable, fineType, chapter/section labels are untouched.
 *
 * Key insight: DOCX uses vertical cell merging (w:vMerge). Long violation texts
 * are split across multiple <w:p> paragraphs within the same cell, all appearing
 * BEFORE the article-code paragraph in the flattened paragraph list. We must
 * collect ALL consecutive Arabic paragraphs before each code (not just the last).
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const FEED_DOCX  = path.join(ROOT, 'attached_assets/feed_1782709407741.docx');
const MED_DOCX   = path.join(ROOT, 'attached_assets/med_1782709407741.docx');
const FEED_CONST = path.join(ROOT, 'artifacts/mobile/constants/animal-feed-fines.ts');
const MED_CONST  = path.join(ROOT, 'artifacts/mobile/constants/medical-devices-fines.ts');

// ─── DOCX paragraph extractor ─────────────────────────────────────────────────

/** Returns all non-empty paragraph texts from a DOCX file (in document order). */
function extractParagraphs(docxPath) {
  const xml = execSync(`unzip -p "${docxPath}" word/document.xml`, {
    maxBuffer: 60 * 1024 * 1024,
  }).toString('utf8');

  const paras = [];
  // We use a simple state-machine over the XML string for speed.
  let pos = 0;
  while (true) {
    // Find next <w:p opening
    const ps = xml.indexOf('<w:p', pos);
    if (ps === -1) break;
    // Find its closing </w:p>
    const pe = xml.indexOf('</w:p>', ps);
    if (pe === -1) break;
    const pXml = xml.slice(ps, pe + 6);
    pos = pe + 6;

    // Collect all <w:t> run text within this paragraph
    const runs = [];
    let rp = 0;
    while (true) {
      const ts = pXml.indexOf('<w:t', rp);
      if (ts === -1) break;
      const gt = pXml.indexOf('>', ts);
      if (gt === -1) break;
      const te = pXml.indexOf('</w:t>', gt);
      if (te === -1) break;
      runs.push(pXml.slice(gt + 1, te));
      rp = te + 6;
    }
    const text = runs.join('').trim();
    if (text) paras.push(text);
  }
  return paras;
}

// ─── Violation map builder ─────────────────────────────────────────────────────

const CODE_RE   = /^\d+\/\d+\/\d+$/;
const ARABIC_RE = /[\u0600-\u06FF]/;

// Paragraphs that are never part of a violation description:
const SKIP_SET = new Set([
  'قيمة ثابتة', 'الحد الأعلى', 'الحد الأدنى', 'الوحدة', 'الإنذار', 'الانذار',
  'المخالفة', 'المادة', 'م', 'ينطبق', 'لا ينطبق',
]);

function isNonViolation(s) {
  if (!s || s.length === 0) return true;
  if (/^[\d,.\s\/٠-٩،]+$/.test(s)) return true;   // pure numbers
  if (SKIP_SET.has(s)) return true;
  if (/^(فئة[ (]|الفصل |ثانياً|ثالثاً|رابعاً|خامساً|سادساً|أولاً|للمنشأة|للمنتج|لكل )/.test(s)) return true;
  // Non-standard fine-amount descriptions (e.g. "نفس تكلفة الاختبار", "بما لا يزيد")
  if (/^(نفس |بما لا يزيد|عن كل |لكل منتج|لكل عينة|لكل حالة)/.test(s)) return true;
  return false;
}

/**
 * Builds Map<"N/C/S", violation_text>.
 *
 * For each article code in the paragraph list, we walk BACKWARDS collecting ALL
 * consecutive Arabic-containing paragraphs until we hit another code or a
 * clear non-Arabic break.  All collected parts are joined (in document order) to
 * reconstruct violation texts that span multiple paragraphs.
 */
function buildViolationMap(paras) {
  const map = new Map();

  for (let i = 1; i < paras.length; i++) {
    if (!CODE_RE.test(paras[i])) continue;
    const code = paras[i];

    // Walk backwards collecting violation-text paragraphs.
    // Stop at the first non-violation paragraph (numbers, headers, unit labels, etc.)
    // because those act as natural separators between table rows.
    const parts = [];  // collected in reverse order; reversed at the end
    for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
      const p = paras[j].trim();
      if (CODE_RE.test(p)) break;                         // another code → new entry
      if (ARABIC_RE.test(p) && !isNonViolation(p)) {
        parts.push(p);                                    // part of violation text
      } else {
        break;                                            // separator → stop
      }
    }

    if (parts.length === 0) continue;
    // Reverse to restore document order, join with a space so paragraph-split
    // words don't get concatenated without a separator.
    const violation = parts.reverse().join(' ').replace(/\s+/g, ' ').trim();
    if (violation.length >= 8 && !map.has(code)) {
      map.set(code, violation);
    }
  }

  return map;
}

// ─── Constants patcher ────────────────────────────────────────────────────────

function patchConstantsFile(filePath, docxMap) {
  let src = fs.readFileSync(filePath, 'utf8');
  let patched = 0;
  let skipped = 0;
  const changes = [];

  src = src.replace(
    /articleCode:\s*"(\d+\/\d+\/\d+)"([\s\S]*?)violation:\s*"([^"]*)"/g,
    (full, code, middle, oldViolation) => {
      const newViolation = docxMap.get(code);
      if (!newViolation) { skipped++; return full; }
      if (newViolation === oldViolation) { skipped++; return full; }
      changes.push({ code, old: oldViolation, now: newViolation });
      patched++;
      return `articleCode: "${code}"${middle}violation: "${newViolation}"`;
    }
  );

  if (patched > 0) fs.writeFileSync(filePath, src, 'utf8');
  return { patched, skipped, changes };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('=== DOCX Violation Patcher ===\n');

process.stdout.write('Extracting paragraphs from feed DOCX... ');
const feedParas = extractParagraphs(FEED_DOCX);
console.log(`${feedParas.length} paragraphs`);

process.stdout.write('Extracting paragraphs from medical DOCX... ');
const medParas = extractParagraphs(MED_DOCX);
console.log(`${medParas.length} paragraphs\n`);

const feedMap = buildViolationMap(feedParas);
const medMap  = buildViolationMap(medParas);
console.log(`Feed violations extracted:    ${feedMap.size}`);
console.log(`Medical violations extracted: ${medMap.size}\n`);

// Sanity-check: flag any suspiciously short violations
const feedShort = [...feedMap.entries()].filter(([, v]) => v.length < 12);
const medShort  = [...medMap.entries()].filter(([, v]) => v.length < 12);
if (feedShort.length)   { console.log('FEED short (possible fragments):');   feedShort.forEach(([k,v]) => console.log(`  ${k}: "${v}"`)); }
if (medShort.length)    { console.log('MEDICAL short (possible fragments):'); medShort.forEach(([k,v]) =>  console.log(`  ${k}: "${v}"`)); }

console.log('Feed sample (first 8):');
let n = 0;
for (const [k, v] of feedMap) { console.log(`  ${k}: ${v}`); if (++n >= 8) break; }
console.log('\nMedical sample (first 8):');
n = 0;
for (const [k, v] of medMap) { console.log(`  ${k}: ${v}`); if (++n >= 8) break; }

console.log('\n--- Patching constants ---\n');

const feedResult = patchConstantsFile(FEED_CONST, feedMap);
console.log(`[FEED] Patched ${feedResult.patched} violations, ${feedResult.skipped} unchanged`);
for (const { code, old, now } of feedResult.changes) {
  console.log(`  ${code}:\n    WAS: ${old}\n    NOW: ${now}`);
}

console.log('');

const medResult = patchConstantsFile(MED_CONST, medMap);
console.log(`[MEDICAL] Patched ${medResult.patched} violations, ${medResult.skipped} unchanged`);
for (const { code, old, now } of medResult.changes) {
  console.log(`  ${code}:\n    WAS: ${old}\n    NOW: ${now}`);
}

console.log('\n=== Done ===');
