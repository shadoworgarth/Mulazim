---
name: Circulars PDF Arabic garble on Android
description: Why circular PDFs show garbled Arabic on Android and the rasterize fix
---

# Circular PDFs: garbled Arabic on Android

The mobile "circulars" (تعاميم) viewer renders bundled PDFs. On Android it uses a
**bundled legacy pdf.js v3.11.174** (in a WebView) because Android's native WebView
can't display PDFs. iOS/web use native renderers and are unaffected.

**Symptom:** ~50% of circulars showed jumbled/unreadable Arabic *only on Android*.
The source PDFs are fine (poppler `pdftoppm` renders them perfectly) — it is purely a
pdf.js rendering bug with **embedded Arabic CID TrueType (Identity-H) fonts** that
Word 2016 exports (SakkalMajalla and others). Not limited to one font family.

**Fix (applied):** rasterize every circular PDF that has embedded fonts into an
image-only PDF, so pdf.js just draws bitmaps (no font shaping). Keep the `.pdf`
extension so `circular-viewer.tsx` / `circulars-files.ts` need no changes. Pipeline:
`pdftoppm -jpeg -r 150 <pdf>` per page → Pillow `save(..., "PDF", save_all=True,
append_images=..., quality=80)` → replace original.

**Why this over upgrading pdf.js:** the legacy v3.11 build was deliberately chosen for
old-Android WebView compatibility (see the "fake worker" comment in circular-viewer);
upgrading risks the blob/Worker hang and isn't verifiable headlessly here. Rasterizing
is surgical, verifiable, and guaranteed.

**How to apply to future/new circulars:** only PDFs *with embedded fonts* need it —
scanned/image-only PDFs (no fonts per `pdffonts`) and `.jpg` circulars already render
fine, so skip them to avoid needless bloat. After rasterizing, `pdffonts <pdf>` must
report zero fonts. Rasterizing at 150dpi JPEG q80 actually *shrank* the corpus
(113MB→92MB) vs the original font-embedded PDFs.

**Tradeoff accepted:** rasterized circulars lose in-document text selection/search,
but this is a read-only reference app where legibility matters most (user approved).
