---
name: SFDA circulars page scraping quirks
description: How to reliably parse https://www.sfda.gov.sa/ar/circulars listing and get real PDF links per circular
---

The circulars list page (`/ar/circulars?page=N`, 9 items/page) must be parsed by first
splitting HTML on `<article class="warning-item">` and extracting fields independently
per chunk (category, status badge, date, title, node link) with optional/fallback
regexes for each field.

**Why:** A single continuous global regex spanning "category → status badge → date →
title → link" silently skips whole articles whenever one field is structurally
different (e.g. some circulars have `<span></span>` instead of a
`badge badge-success/danger cir-status` element because they have no status set).
The non-greedy `[\s\S]*?` then jumps past several subsequent articles looking for the
next full match, causing large silent under-counts (e.g. only 253 of 311 found).

**How to apply:** Split-then-per-chunk-regex whenever scraping this listing again.
Status values seen: `"فعال"` (active), `"غير فعال"` (inactive), `""` (unset — treat as
not active). The list page's "download-doc-link" href is just the node detail page
(`/ar/node/{id}`), not a PDF. To get the real PDF, fetch each node detail page and
look for `<span href="{path}.pdf" class="m-c-title">` (or an `<a class="download-doc-link">`
pointing at a `.pdf` under `/sites/default/files/...`). About 5-6% of active circulars
have no attached PDF at all — fall back to the node page URL for those.
