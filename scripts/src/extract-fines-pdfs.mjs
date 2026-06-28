import fs from 'fs';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
if (!MISTRAL_API_KEY) { console.error('No MISTRAL_API_KEY'); process.exit(1); }

async function extractPdf(filePath, outPath, label) {
  console.log(`[${label}] Reading PDF...`);
  const buf = fs.readFileSync(filePath);
  const b64 = buf.toString('base64');
  console.log(`[${label}] Sending to Mistral OCR (${Math.round(b64.length/1024)}KB base64)...`);

  const res = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: `data:application/pdf;base64,${b64}`,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[${label}] HTTP ${res.status}:`, err.slice(0, 800));
    return false;
  }

  const data = await res.json();
  const pages = data.pages || [];
  const text = pages.map((p, i) => `=== PAGE ${i+1} ===\n${p.markdown}`).join('\n\n');
  fs.writeFileSync(outPath, text, 'utf8');
  console.log(`[${label}] Done — ${pages.length} pages, ${text.length} chars → ${outPath}`);
  return true;
}

const MEDICAL_PDF = "attached_assets/\u062C\u062F\u0648\u0644_\u062A\u0635\u0646\u064A\u0641_\u0627\u0644\u0645\u062E\u0627\u0644\u0641\u0627\u062A_\u0648\u0627\u0644\u0639\u0642\u0648\u0628\u0627\u062A_\u0627\u0644\u0645\u0642\u0631\u0631\u0629_\u0644\u0647\u0627_\u0648\u0641\u0642\u0627\u064B_\u0644\u0646\u0638\u0627\u0645_\u0627\u0644\u0623\u062C\u0647\u0632\u0629_1782625701619.pdf";
const FEED_PDF   = "attached_assets/\u062C\u062F\u0648\u0644_\u062A\u0635\u0646\u064A\u0641_\u0627\u0644\u0645\u062E\u0627\u0644\u0641\u0627\u062A_\u0648\u0627\u0644\u0639\u0642\u0648\u0628\u0627\u062A_\u0627\u0644\u0645\u0642\u0631\u0631\u0629_\u0644\u0647\u0627_\u0648\u0641\u0642\u0627\u064B_\u0644\u0646\u0638\u0627\u0645_\u0627\u0644\u0623\u0639\u0644\u0627\u0641_1782625701619.pdf";

await Promise.all([
  extractPdf(MEDICAL_PDF, '/tmp/medical_devices_fines.txt', 'MEDICAL'),
  extractPdf(FEED_PDF,    '/tmp/feed_fines.txt',            'FEED'),
]);
console.log('All done.');
