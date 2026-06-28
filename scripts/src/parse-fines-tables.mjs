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
  const parts = line.split('|').map(c => c.trim());
  return parts.slice(1, parts.length - 1);
}

const ARTICLE_RE = /^\d+\/\d+\/\d+$/;

function isSeparatorRow(line) {
  return /^\|[-| :]+\|$/.test(line.replace(/\s/g, ''));
}

function isChapterRow(cells) {
  return cells[0] && cells[0].includes('الفصل') && cells.slice(1).every(c => c === '');
}

// Arabic ordinals → section number (includes up to 11)
const ORDINAL_TO_NUM = {
  'أولاً': 1, 'ثانياً': 2, 'ثالثاً': 3, 'رابعاً': 4, 'خامساً': 5,
  'سادساً': 6, 'سابعاً': 7, 'ثامناً': 8, 'تاسعاً': 9, 'عاشراً': 10,
  'الحادي عشر': 11, 'الثاني عشر': 12,
};

function detectSectionNum(line) {
  // Check multi-word ordinals first (الحادي عشر before الحادي)
  for (const [k, v] of Object.entries(ORDINAL_TO_NUM).sort((a, b) => b[0].length - a[0].length)) {
    if (line.includes(k)) return v;
  }
  return null;
}

function extractSectionLabel(line) {
  // Strip markdown heading markers and bold markers
  return line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
}

/**
 * Parse a fines table from extracted OCR text.
 * Section labels are derived directly from the headings in the text.
 */
function parseFinesText(text) {
  const lines = text.split('\n');
  const entries = [];

  let currentSection = 1;
  let currentSectionLabel = '';
  let currentChapter = 1;
  let currentChapterLabel = '';

  let pendingEntry = null;

  // We keep a map of section number -> label as we discover them
  const discoveredSections = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('=== PAGE')) continue;

    // Section heading: # or ## followed by ordinal word
    if (line.startsWith('#')) {
      const secNum = detectSectionNum(line);
      if (secNum !== null) {
        currentSection = secNum;
        // Strip the ordinal prefix (e.g. "أولاً: ") to get the entity name
        let label = extractSectionLabel(line);
        // Remove the ordinal prefix pattern like "أولاً: " or "ثانياً : "
        label = label.replace(/^(الحادي عشر|الثاني عشر|أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|ثامناً|تاسعاً|عاشراً)\s*[:\-]\s*/u, '').trim();
        discoveredSections[secNum] = label;
        currentSectionLabel = label;
        currentChapter = 1;
        currentChapterLabel = '';
        pendingEntry = null;
      }
      continue;
    }

    if (!line.startsWith('|')) continue;
    if (isSeparatorRow(line)) continue;

    const cells = parseCells(line);
    if (cells.length < 5) continue;

    // Chapter header rows within table
    if (isChapterRow(cells)) {
      const chapterText = cells[0].replace(/\*\*/g, '').trim();
      const chNum = parseInt(chapterText.match(/\d+/)?.[0] ?? '1', 10);
      currentChapter = isNaN(chNum) ? currentChapter : chNum;
      currentChapterLabel = chapterText;
      pendingEntry = null;
      continue;
    }

    const boldChapter = cells[0].replace(/\*\*/g, '').trim();
    if (boldChapter.startsWith('الفصل') && cells.slice(1).every(c => !c || c === '')) {
      const chNum = parseInt(boldChapter.match(/\d+/)?.[0] ?? '1', 10);
      currentChapter = isNaN(chNum) ? currentChapter : chNum;
      currentChapterLabel = boldChapter;
      pendingEntry = null;
      continue;
    }

    // Header rows or continuation rows with no article code
    const articleCode = cells[0].trim();
    if (!ARTICLE_RE.test(articleCode)) {
      // Min row continuation (الحد الأدنى without an article code)
      if (pendingEntry && (cells[2] === 'الحد الأدنى' || cells[2] === 'الحد الأدنى ')) {
        pendingEntry.finesMin = parseSizesFines(cells);
        entries.push(pendingEntry);
        pendingEntry = null;
      }
      continue;
    }

    // Use last segment of article code to determine section
    const codeParts = articleCode.split('/');
    if (codeParts.length === 3) {
      const codeSection = parseInt(codeParts[2], 10);
      if (!isNaN(codeSection) && discoveredSections[codeSection]) {
        currentSection = codeSection;
        currentSectionLabel = discoveredSections[codeSection];
      }
      const codeChapter = parseInt(codeParts[1], 10);
      if (!isNaN(codeChapter) && codeChapter !== currentChapter) {
        currentChapter = codeChapter;
        if (!currentChapterLabel.includes(`${codeChapter}`)) {
          currentChapterLabel = `الفصل ${codeChapter}`;
        }
      }
    }

    const violation = cells[1].replace(/\*\*/g, '').trim();
    const limitType = cells[2].trim();
    const warningCell = cells[15] || cells[14] || '';
    const warningApplicable = warningCell.includes('ينطبق') && !warningCell.includes('لا ينطبق');
    const unit = (cells[16] || cells[15] || '').replace(/\*\*/g, '').trim();

    if (limitType === 'قيمة ثابتة') {
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
      if (pendingEntry) {
        pendingEntry.finesMin = parseSizesFines(cells);
        entries.push(pendingEntry);
        pendingEntry = null;
      }
    }
  }

  if (pendingEntry) {
    pendingEntry.finesMin = pendingEntry.finesMax;
    entries.push(pendingEntry);
  }

  return { entries, discoveredSections };
}

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
const { entries: medEntries, discoveredSections: medSections } = parseFinesText(medText);
console.log(`Medical devices: ${medEntries.length} violations parsed`);
console.log('Discovered sections:', medSections);

const medTs = `import { FoodFineV2 } from "./food-fines-v2";

${toTsArray(medEntries, 'MEDICAL_DEVICES_FINES')}
`;
fs.writeFileSync('artifacts/mobile/constants/medical-devices-fines.ts', medTs, 'utf8');
console.log('Written: artifacts/mobile/constants/medical-devices-fines.ts');

// ── ANIMAL FEED ───────────────────────────────────────────────────────────────

const feedText = fs.readFileSync('/tmp/feed_fines.txt', 'utf8');
const { entries: feedEntries, discoveredSections: feedSections } = parseFinesText(feedText);
console.log(`Animal feed: ${feedEntries.length} violations parsed`);
console.log('Discovered sections:', feedSections);

const feedTs = `import { FoodFineV2 } from "./food-fines-v2";

${toTsArray(feedEntries, 'ANIMAL_FEED_FINES')}
`;
fs.writeFileSync('artifacts/mobile/constants/animal-feed-fines.ts', feedTs, 'utf8');
console.log('Written: artifacts/mobile/constants/animal-feed-fines.ts');

// ── SUMMARY ───────────────────────────────────────────────────────────────────
console.log('\n=== Medical devices by section ===');
const medBySec = {};
for (const e of medEntries) { medBySec[e.sectionLabel] = (medBySec[e.sectionLabel] || 0) + 1; }
console.log(medBySec);

console.log('\n=== Animal feed by section ===');
const feedBySec = {};
for (const e of feedEntries) { feedBySec[e.sectionLabel] = (feedBySec[e.sectionLabel] || 0) + 1; }
console.log(feedBySec);
