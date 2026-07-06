---
name: Metro asset bundling fails on JPEGs with huge ICC/Photoshop metadata
description: Diagnosing "Invalid JPG, no size found" from Metro's image-size asset transform when bundling downloaded/scanned JPEGs as static assets
---

Metro's `Assets.js` (`getAssetData`) calls `image-size` by passing the **file path string**
directly (not a pre-read Buffer) for non-zip assets. Some real, valid JPEGs — especially
scanned documents with large embedded ICC profiles / Photoshop metadata (many `APP2`/`0xE2`
segments before the `SOF0` marker) — fail `image-size`'s parser via this path-string call
even though the exact same file parses fine when you `fs.readFileSync` it into a Buffer and
call `imageSize(buffer)` directly in a standalone Node script.

**Why:** This mismatch makes the bug very hard to reproduce with an "obvious" standalone
test — testing all files with `imageSize(buffer)` can show zero failures while Metro's
bundler (which uses `imageSize(pathString)`) still throws `Invalid JPG, no size found` with
no filename in the error. The error also doesn't identify which asset failed, so a full
directory scan reproducing Metro's exact call pattern (path string, not buffer) is required
to isolate the offending file(s).

**How to apply:** When bundling a large batch of downloaded/scanned images as static Expo/RN
assets and Metro's web bundle fails with a generic "Invalid JPG, no size found" (or similar
image-size error) with no filename: iterate every asset file calling `imageSize(filePath)`
(string, not buffer) to find the exact culprit(s). Fix by re-encoding with
`magick <file> -strip -quality 90 <out>.jpg` to strip bloated ICC/Photoshop metadata — this
also shrinks file size. Also worth checking downloaded files' magic bytes (e.g. PDFs should
start with `%PDF`) since scraped documents can silently save an HTML error page with a
`.pdf` extension and a misleading `application/pdf`-labeled response.
