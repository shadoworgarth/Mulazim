import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REFERER = 'https://www.fao.org/fao-who-codexalimentarius/codex-texts/dbs/pestres/pesticides/en/';
const INDEX_URL = 'https://www.fao.org/jsoncodexpest/jsonrequest/pesticides/index.html';
const DETAIL_URL = (id) => `https://www.fao.org/jsoncodexpest/jsonrequest/pesticides/details.html?id=${id}&lang=en`;
const OUT = path.resolve(__dirname, '..', 'assets', 'fao-codex-pesticides.json');
const CONCURRENCY = 3;

function sanitizeJsonText(t) {
  let out = '';
  let inStr = false;
  let esc = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    const code = t.charCodeAt(i);
    if (inStr) {
      if (esc) { out += c; esc = false; continue; }
      if (c === '\\') { out += c; esc = true; continue; }
      if (c === '"') {
        let j = i + 1;
        while (j < t.length && (t.charCodeAt(j) <= 0x20)) j++;
        const nxt = t[j];
        if (nxt === ',' || nxt === '}' || nxt === ']' || nxt === ':' || j >= t.length) {
          out += c; inStr = false; continue;
        }
        out += '\\"'; continue;
      }
      if (code === 0x0a) { out += '\\n'; continue; }
      if (code === 0x0d) { out += '\\r'; continue; }
      if (code === 0x09) { out += '\\t'; continue; }
      if (code < 0x20) { out += ' '; continue; }
      out += c;
    } else {
      if (c === '"') { inStr = true; out += c; continue; }
      out += c;
    }
  }
  return out;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Referer: REFERER, 'User-Agent': 'Mozilla/5.0' } });
  if (res.status === 429) { const e = new Error('429'); e.is429 = true; throw e; }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return JSON.parse(sanitizeJsonText(text)); }
}

async function fetchDetail(id, name, attempt = 1) {
  try {
    const data = await getJson(DETAIL_URL(id));
    await new Promise((r) => setTimeout(r, 150));
    const mrls = data?.mrls?.mrl;
    const arr = Array.isArray(mrls) ? mrls : mrls ? [mrls] : [];
    return {
      id,
      name: data.pesticide || name,
      functionalClass: data.name || '',
      adi: data.adi || '',
      adiUnit: data.adiUnit || '',
      adiNote: data.adiNote || '',
      residue: data.residue || '',
      mrls: arr.map((m) => ({
        mrl: m.mrlFormatted || m.mrl || '',
        cacYear: m.cacYear || '',
        jmpr: m.jmpr || '',
        commodity: m?.commodity?.name || '',
        commodityId: m?.commodity?.id || '',
        commodityCode: m?.commodity?.commCode || '',
        footnote: m.footnote || '',
        step: m?.step?.stepCode || '',
      })),
    };
  } catch (e) {
    const max = e.is429 ? 8 : 4;
    if (attempt < max) {
      const wait = e.is429 ? 3000 * attempt : 1000 * attempt;
      await new Promise((r) => setTimeout(r, wait));
      return fetchDetail(id, name, attempt + 1);
    }
    console.error(`FAILED ${id} ${name}:`, e.message);
    return { id, name, functionalClass: '', adi: '', adiUnit: '', adiNote: '', residue: '', mrls: [], error: e.message };
  }
}

async function main() {
  console.log('Fetching index...');
  const idx = await getJson(INDEX_URL);
  const list = idx.pesticides.pesticide
    .map((p) => ({ id: p.id, name: p.name?.en || '' }))
    .filter((p) => p.id && p.name);
  console.log(`Found ${list.length} pesticides`);

  const results = [];
  let done = 0;
  let cursor = 0;
  async function worker() {
    while (cursor < list.length) {
      const i = cursor++;
      const p = list[i];
      const r = await fetchDetail(p.id, p.name);
      results[i] = r;
      done++;
      if (done % 10 === 0) console.log(`  ${done}/${list.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const totalMrls = results.reduce((a, b) => a + b.mrls.length, 0);
  console.log(`Done. ${results.length} pesticides, ${totalMrls} MRLs total`);

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify({ pesticides: results }, null, 0));
  const stat = await fs.stat(OUT);
  console.log(`Wrote ${OUT} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
