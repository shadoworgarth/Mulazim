/**
 * Re-extracts violation texts from Mistral-OCR output and patches
 * only the `violation` field in the constants files.
 * Handles:
 *  - Eastern Arabic numerals (١/١ → 1/1)
 *  - Both LTR (code|violation|fines) and RTL (fines|violation|code) table layouts
 *  - 2-part OCR codes matched to 3-part constants codes by prefix
 *
 * Usage: node scripts/src/fix-fines-violations.mjs
 */
import fs from 'fs';
import path from 'path';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
if (!MISTRAL_API_KEY) { console.error('MISTRAL_API_KEY not set'); process.exit(1); }

const ROOT = path.resolve(import.meta.dirname, '../..');

const MEDICAL_PDF = path.join(ROOT, 'attached_assets/medical_dev_1777531009813.pdf');
const FEED_PDF    = path.join(ROOT, 'attached_assets/feed_fine_1777531009813.pdf');
const MEDICAL_OCR_CACHE = '/tmp/medical_ocr_fresh.txt';
const FEED_OCR_CACHE    = '/tmp/feed_ocr_fresh.txt';

// ── Step 1: OCR ───────────────────────────────────────────────────────────────

async function runOcr(pdfPath, cachePath, label) {
  if (fs.existsSync(cachePath)) {
    console.log(`[${label}] Using cached OCR: ${cachePath}`);
    return fs.readFileSync(cachePath, 'utf8');
  }
  const sizeMB = (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(1);
  console.log(`[${label}] Reading PDF (${sizeMB}MB)...`);
  const b64 = fs.readFileSync(pdfPath).toString('base64');
  console.log(`[${label}] Sending to Mistral OCR...`);
  const res = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: { type: 'document_url', document_url: `data:application/pdf;base64,${b64}` },
    }),
  });
  if (!res.ok) throw new Error(`[${label}] OCR HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  const pages = data.pages || [];
  const text = pages.map((p, i) => `=== PAGE ${i+1} ===\n${p.markdown}`).join('\n\n');
  fs.writeFileSync(cachePath, text, 'utf8');
  console.log(`[${label}] OCR done — ${pages.length} pages, ${text.length} chars`);
  return text;
}

// ── Step 2: Extract violation map ─────────────────────────────────────────────

// Convert Eastern Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) to Western
function toWestern(s) {
  return s.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

// Split a markdown table row into cells
function parseCells(line) {
  return line.split('|').map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
}

function isSeparator(line) {
  return /^\|[-| :]+\|$/.test(line.replace(/\s/g, ''));
}

// Is this cell a valid 2-part article code? e.g. "3/2" or "١٧/٢"
function parseCode(raw) {
  const s = toWestern(raw).replace(/\*\*/g, '').trim();
  return /^\d+\/\d+$/.test(s) ? s : null;
}

// Is a cell likely to be a violation description (Arabic text, not a number/header)?
function isViolationText(s) {
  if (!s || s.length < 6) return false;
  if (/^[\d,.\s\/٠-٩]+$/.test(s)) return false; // pure numbers
  if (s.includes('الغرامة') || s.includes('العقوبات') || s.includes('البند') || s.includes('المادة')) return false;
  // "يجوز" only appears in non-monetary penalty preambles, never in violation descriptions
  if (s.includes('يجوز')) return false;
  // Only filter "منع المخالف" as a full phrase (not just any sentence mentioning closure)
  if (s.includes('منع المخالف من ممارسة')) return false;
  return /[\u0600-\u06FF]/.test(s); // must contain Arabic
}

/**
 * Extracts Map<"article/chapter", violation_text> from OCR markdown.
 * Handles both orientations of table rows.
 */
function extractViolationMap(ocrText) {
  const map = new Map();
  const lines = ocrText.split('\n');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('|') || isSeparator(line)) continue;
    const cells = parseCells(line);
    if (cells.length < 2) continue;

    // Skip pure header rows
    if (cells.every(c => !parseCode(c) && !isViolationText(c))) continue;

    // Orientation A: code in first cell, violation in second
    const codeA = parseCode(cells[0]);
    if (codeA) {
      const viol = cells.find((c, i) => i > 0 && isViolationText(c));
      if (viol && !map.has(codeA)) {
        map.set(codeA, viol.replace(/\*\*/g, '').trim());
      }
      continue;
    }

    // Orientation B (RTL render): code in last cell, violation in second-to-last
    const codeB = parseCode(cells[cells.length - 1]);
    if (codeB) {
      // Find the rightmost Arabic-text cell that isn't the code
      for (let i = cells.length - 2; i >= 0; i--) {
        if (isViolationText(cells[i])) {
          if (!map.has(codeB)) {
            map.set(codeB, cells[i].replace(/\*\*/g, '').trim());
          }
          break;
        }
      }
    }
  }

  return map;
}

// ── Step 3: Patch constants file ──────────────────────────────────────────────

function patchConstantsFile(filePath, ocrMap, label) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let patchCount = 0;
  const diffs = [];

  const patched = lines.map(line => {
    // Match 3-part article codes: "A/B/C"
    const codeMatch = line.match(/articleCode: "(\d+)\/(\d+)\/(\d+)"/);
    if (!codeMatch) return line;

    // Build the 2-part prefix to look up in OCR map
    const twoPartKey = `${codeMatch[1]}/${codeMatch[2]}`;
    const ocrViolation = ocrMap.get(twoPartKey);
    if (!ocrViolation) return line;

    const violMatch = line.match(/violation: "([^"]*)"/);
    if (!violMatch || violMatch[1] === ocrViolation) return line;

    diffs.push(`  ${codeMatch[0].match(/"([^"]+)"/)[1]}:\n    WAS: ${violMatch[1]}\n    NOW: ${ocrViolation}`);
    patchCount++;
    return line.replace(`violation: "${violMatch[1]}"`, `violation: "${ocrViolation}"`);
  });

  fs.writeFileSync(filePath, patched.join('\n'), 'utf8');
  console.log(`\n[${label}] Patched ${patchCount} violations in ${path.basename(filePath)}`);
  if (diffs.length > 0) diffs.forEach(d => console.log(d));
  else console.log('  (no differences found)');
  return patchCount;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('=== Fines Violation Patcher ===\n');

const [medOcr, feedOcr] = await Promise.all([
  runOcr(MEDICAL_PDF, MEDICAL_OCR_CACHE, 'MEDICAL'),
  runOcr(FEED_PDF,    FEED_OCR_CACHE,    'FEED'),
]);

console.log('\n--- Extracting violation maps ---');
const medMap  = extractViolationMap(medOcr);
const feedMap = extractViolationMap(feedOcr);
console.log(`Medical devices: ${medMap.size} unique violations found in OCR`);
console.log(`Animal feed:     ${feedMap.size} unique violations found in OCR`);

// Sample a few to verify
console.log('\nMedical sample:');
[...medMap.entries()].slice(0, 5).forEach(([k,v]) => console.log(`  ${k}: ${v.slice(0,60)}...`));
console.log('\nFeed sample:');
[...feedMap.entries()].slice(0, 5).forEach(([k,v]) => console.log(`  ${k}: ${v.slice(0,60)}...`));

console.log('\n--- Patching constants files ---');
patchConstantsFile(path.join(ROOT, 'artifacts/mobile/constants/medical-devices-fines.ts'), medMap, 'MEDICAL');
patchConstantsFile(path.join(ROOT, 'artifacts/mobile/constants/animal-feed-fines.ts'),     feedMap, 'FEED');

console.log('\n=== Done ===');
