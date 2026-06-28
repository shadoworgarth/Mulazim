/**
 * Parses Mistral-OCR extracted markdown fines tables into FoodFineV2 TypeScript arrays.
 * Usage: node scripts/src/parse-fines-tables.mjs
 */
import fs from 'fs';

// ── helpers ──────────────────────────────────────────────────────────────────

function parseNum(s) {
  if (!s) return null;
  const n = parseInt(s.replace(/,/g, '').trim(), 10);
  return isNaN(n) ? null : n;
}

function parseCells(line) {
  // Split pipe-separated cells
  const parts = line.split('|').map(c => c.trim());
  // Remove first and last empty strings from leading/trailing |
  return parts.slice(1, parts.length - 1);
}

const ARTICLE_RE = /^\d+\/\d+\/\d+$/;

function isSeparatorRow(line) {
  return /^\|[-| :]+\|$/.test(line.replace(/\s/g, ''));
}

function isChapterRow(cells) {
  // Chapter rows: first cell contains "الفصل" and spans everything
  return cells[0] && cells[0].includes('الفصل') && cells.slice(1).every(c => c === '');
}

function isSectionHeader(line) {
  return line.startsWith('## ') || line.startsWith('# ');
}

const SECTION_NAMES = {
  'أولاً': 1, 'ثانياً': 2, 'ثالثاً': 3, 'رابعاً': 4,
  'خامساً': 5, 'سادساً': 6, 'سابعاً': 7, 'ثامناً': 8,
};

function detectSection(line) {
  for (const [k, v] of Object.entries(SECTION_NAMES)) {
    if (line.includes(k)) return v;
  }
  return null;
}

/**
 * Parse a fines table from extracted OCR text.
 * @param {string} text - The full OCR output text
 * @param {Object} sectionLabels - Map of section number -> Arabic label
 * @returns {Array} - Array of FoodFineV2-compatible objects
 */
function parseFinesText(text, sectionLabels) {
  const lines = text.split('\n');
  const entries = [];

  let currentSection = 1;
  let currentSectionLabel = sectionLabels[1] || '';
  let currentChapter = 1;
  let currentChapterLabel = '';

  let pendingEntry = null; // waiting for الحد الأدنى row

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Page marker — skip
    if (line.startsWith('=== PAGE')) continue;

    // Section headers (## أولاً: ...)
    if (isSectionHeader(line)) {
      const secNum = detectSection(line);
      if (secNum !== null) {
        currentSection = secNum;
        currentSectionLabel = sectionLabels[secNum] || line.replace(/^#+\s*/, '').trim();
        currentChapter = 1;
        currentChapterLabel = '';
      }
      pendingEntry = null;
      continue;
    }

    // Skip non-table lines and separators
    if (!line.startsWith('|')) continue;
    if (isSeparatorRow(line)) continue;

    const cells = parseCells(line);
    if (cells.length < 5) continue;

    // Chapter header row (cell[0] contains الفصل and rest empty)
    if (isChapterRow(cells)) {
      const chapterText = cells[0].replace(/\*\*/g, '').trim();
      const chNum = parseInt(chapterText.match(/\d+/)?.[0] ?? '1', 10);
      currentChapter = isNaN(chNum) ? currentChapter : chNum;
      currentChapterLabel = chapterText;
      pendingEntry = null;
      continue;
    }

    // Also catch chapter labels inside bold-marked cells like "**الفصل الأول...**"
    const boldChapter = cells[0].replace(/\*\*/g, '').trim();
    if (boldChapter.startsWith('الفصل') && cells.slice(1).every(c => !c || c === '')) {
      const chNum = parseInt(boldChapter.match(/\d+/)?.[0] ?? '1', 10);
      currentChapter = isNaN(chNum) ? currentChapter : chNum;
      currentChapterLabel = boldChapter;
      pendingEntry = null;
      continue;
    }

    // Header rows (no article code in cell[0])
    const articleCode = cells[0].trim();
    if (!ARTICLE_RE.test(articleCode)) {
      // But check if cell[2] is الحد الأدنى (min row continuation)
      if (pendingEntry && (cells[2] === 'الحد الأدنى' || cells[2] === 'الحد الأدنى ')) {
        // Parse min row: large a,b,c,d | medium a,b,c,d | small a,b,c,d
        pendingEntry.finesMin = parseSizesFines(cells);
        entries.push(pendingEntry);
        pendingEntry = null;
      }
      continue;
    }

    // Violation row
    const violation = cells[1].replace(/\*\*/g, '').trim();
    const limitType = cells[2].trim();
    const warningCell = cells[15] || cells[14] || '';
    const warningApplicable = warningCell.includes('ينطبق') && !warningCell.includes('لا ينطبق');
    const unit = (cells[16] || cells[15] || '').replace(/\*\*/g, '').trim();

    // Determine chapter from article code if possible
    // Article code: violation/chapter/section
    const codeParts = articleCode.split('/');
    if (codeParts.length === 3) {
      const codeChapter = parseInt(codeParts[1], 10);
      if (!isNaN(codeChapter) && codeChapter !== currentChapter) {
        // Try to find chapter label in recent context - just use what we have
        currentChapter = codeChapter;
        if (!currentChapterLabel.includes(`${codeChapter}`)) {
          currentChapterLabel = `الفصل ${codeChapter}`;
        }
      }
      const codeSection = parseInt(codeParts[2], 10);
      if (!isNaN(codeSection) && sectionLabels[codeSection]) {
        currentSection = codeSection;
        currentSectionLabel = sectionLabels[codeSection];
      }
    }

    if (limitType === 'قيمة ثابتة') {
      // Fixed fine - single row
      const fines = parseFixedFines(cells);
      entries.push({
        articleCode,
        section: currentSection,
        sectionLabel: currentSectionLabel,
        chapter: currentChapter,
        chapterLabel: currentChapterLabel,
        violation,
        unit,
        warningApplicable: false,
        fineType: 'fixed',
        finesMax: fines,
        finesMin: fines,
      });
      pendingEntry = null;
    } else if (limitType.includes('الأعلى') || limitType.includes('أعلى')) {
      // Range fine, max row — wait for min
      const finesMax = parseSizesFines(cells);
      pendingEntry = {
        articleCode,
        section: currentSection,
        sectionLabel: currentSectionLabel,
        chapter: currentChapter,
        chapterLabel: currentChapterLabel,
        violation,
        unit,
        warningApplicable,
        fineType: 'range',
        finesMax,
        finesMin: null,
      };
    } else if (limitType.includes('الأدنى') || limitType.includes('أدنى')) {
      // Sometimes الحد الأدنى appears in main code row (edge case)
      if (pendingEntry) {
        pendingEntry.finesMin = parseSizesFines(cells);
        entries.push(pendingEntry);
        pendingEntry = null;
      }
    }
  }

  // Flush any pending
  if (pendingEntry) {
    pendingEntry.finesMin = pendingEntry.finesMax;
    entries.push(pendingEntry);
  }

  return entries;
}

/** Parse fixed fine: large=col[3], medium=col[7], small=col[11] */
function parseFixedFines(cells) {
  const largeVal = parseNum(cells[3]) ?? parseNum(cells[4]) ?? parseNum(cells[5]) ?? parseNum(cells[6]);
  const medVal   = parseNum(cells[7]) ?? parseNum(cells[8]) ?? parseNum(cells[9]) ?? parseNum(cells[10]);
  const smVal    = parseNum(cells[11]) ?? parseNum(cells[12]) ?? parseNum(cells[13]) ?? parseNum(cells[14]);
  return {
    large:  { a: largeVal, b: largeVal, c: largeVal, d: largeVal },
    medium: { a: medVal,   b: medVal,   c: medVal,   d: medVal   },
    small:  { a: smVal,    b: smVal,    c: smVal,    d: smVal    },
  };
}

/** Parse range row: cols 3-6=large a,b,c,d | 7-10=medium | 11-14=small */
function parseSizesFines(cells) {
  return {
    large:  { a: parseNum(cells[3]),  b: parseNum(cells[4]),  c: parseNum(cells[5]),  d: parseNum(cells[6])  },
    medium: { a: parseNum(cells[7]),  b: parseNum(cells[8]),  c: parseNum(cells[9]),  d: parseNum(cells[10]) },
    small:  { a: parseNum(cells[11]), b: parseNum(cells[12]), c: parseNum(cells[13]), d: parseNum(cells[14]) },
  };
}

function toTsArray(entries, varName) {
  const lines = [`export const ${varName}: FoodFineV2[] = [`];
  for (const e of entries) {
    const min = e.finesMin ?? e.finesMax;
    lines.push(
      `  { articleCode: ${JSON.stringify(e.articleCode)}, section: ${e.section}, sectionLabel: ${JSON.stringify(e.sectionLabel)}, chapter: ${e.chapter}, chapterLabel: ${JSON.stringify(e.chapterLabel)}, violation: ${JSON.stringify(e.violation)}, unit: ${JSON.stringify(e.unit)}, warningApplicable: ${e.warningApplicable}, fineType: ${JSON.stringify(e.fineType)}, finesMax: ${JSON.stringify(e.finesMax)}, finesMin: ${JSON.stringify(min)} },`
    );
  }
  lines.push('];');
  return lines.join('\n');
}

// ── MEDICAL DEVICES ──────────────────────────────────────────────────────────

const medText = fs.readFileSync('/tmp/medical_devices_fines.txt', 'utf8');
const medSections = {
  1: 'مصانع الأجهزة والمستلزمات الطبية',
  2: 'مستودعات الأجهزة والمستلزمات الطبية',
  3: 'موزعي الأجهزة والمستلزمات الطبية',
  4: 'مراكز الصيانة والمعالجة',
  5: 'المستشفيات والمنشآت الصحية',
  6: 'الصيدليات',
};

const medEntries = parseFinesText(medText, medSections);
console.log(`Medical devices: ${medEntries.length} violations parsed`);

const medTs = `import { FoodFineV2 } from "./food-fines-v2";

${toTsArray(medEntries, 'MEDICAL_DEVICES_FINES')}
`;
fs.writeFileSync('artifacts/mobile/constants/medical-devices-fines.ts', medTs, 'utf8');
console.log('Written: artifacts/mobile/constants/medical-devices-fines.ts');

// ── ANIMAL FEED ───────────────────────────────────────────────────────────────

const feedText = fs.readFileSync('/tmp/feed_fines.txt', 'utf8');
const feedSections = {
  1: 'مصانع الأعلاف',
  2: 'مستودعات الأعلاف',
  3: 'موزعي الأعلاف',
  4: 'تجار الجملة والتجزئة',
  5: 'المزارع',
};

const feedEntries = parseFinesText(feedText, feedSections);
console.log(`Animal feed: ${feedEntries.length} violations parsed`);

const feedTs = `import { FoodFineV2 } from "./food-fines-v2";

${toTsArray(feedEntries, 'ANIMAL_FEED_FINES')}
`;
fs.writeFileSync('artifacts/mobile/constants/animal-feed-fines.ts', feedTs, 'utf8');
console.log('Written: artifacts/mobile/constants/animal-feed-fines.ts');

// ── SUMMARY ───────────────────────────────────────────────────────────────────
console.log('\n=== Summary ===');
const medSec = {};
for (const e of medEntries) { medSec[e.sectionLabel] = (medSec[e.sectionLabel] || 0) + 1; }
console.log('Medical devices by section:', medSec);
const feedSec = {};
for (const e of feedEntries) { feedSec[e.sectionLabel] = (feedSec[e.sectionLabel] || 0) + 1; }
console.log('Animal feed by section:', feedSec);
