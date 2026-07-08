# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/mobile` (`@workspace/mobile`)

Arabic-language Expo React Native app "Food Additives / مكتبة المفتش" for SFDA inspectors. Runs on web and mobile (Expo Router file-based routing, RTL layout throughout).

**Inspector Library categories (app/inspector-library.tsx):**
- اللوائح الفنية والمواصفات القياسية → `/regulations`
- الملوثات والسموم → `/toxins`
- مبيدات الآفات → `/pesticides` (sub-routes: sfda, fao, agriculture, dates, children, prohibited)
- **الأعلاف** → `/animal-feed` (added)
  - `/animal-feed-additives` — searchable table of permitted feed additives (document: الاضافات_العلفية); ~200+ entries, 4 categories (تكنولوجية/حسية/غذائية/زوتكنية), filterable by category, E-number badges
  - `/animal-feed-guide` — collapsible section list from دليل_المواد; 11 sections (minerals, vitamins, amino acids, flavours, colour, binders, antioxidants, antifungs, anticoccidial, antibiotics, enzymes), each row shows min/max/unit/animals/notes

- **المخدرات والمؤثرات العقلية** → `/narcotics`
  - Searchable list of 482 narcotics/controlled substances across 12 schedule categories
  - Each entry shows main name (scientific → common → Arabic → chemical fallback), category badge, and expandable notes with all available name fields
  - Category filter chips color-coded by schedule (الجدول الأول red, الثاني orange, controlled blue, plants/seeds green)

**Key constants:**
- `constants/animal-feed-additives.ts` — ~200 FeedAdditive entries from SFDA permitted additives document
- `constants/animal-feed-guide.ts` — ANIMAL_FEED_GUIDE sections from livestock/poultry guide document
- `constants/narcotics.ts` — 482 NarcoticEntry items from SFDA narcotics Excel (3 sheets)

### Android signing keystore — DO NOT lose this

The app is signed using a keystore managed remotely by EAS (Expo Application Services). The `eas.json` production build uses `credentialsSource: "remote"`, which means EAS holds the keystore on their servers. **If this keystore is ever lost and the app is already on the Play Store, Google cannot recover it — the package name (`com.sfda.maktabah`, per `artifacts/mobile/app.json`) would be permanently blocked from receiving updates.**

**Keystore facts:**
- EAS project: `@shadoworgarth/mulazim` (projectId `d003632f-e001-4d26-85ce-d36fadbe1141`)
- Android credentials bound to applicationIdentifier `com.sfda.maktabah`, build credential named "Google Play Store" (isDefault)
- Keystore type PKCS12, key alias `mulazim2-upload`, SHA1 `4B:5F:B5:D5:A1:E2:16:28:70:5F:54:68:A5:5A:52:E1:D3:ED:1A:B6`
- The keystore was generated with `keytool` and registered to EAS via the EAS GraphQL API (no production build had run yet, so EAS had no auto-generated keystore). The same key is used for production builds.

**Current backup state (both copies verified identical, same SHA1 as above):**
- Primary backup: EAS remote credentials storage (do not delete the EAS project or account)
- Secondary backup: **DONE** — the keystore is base64-encoded and stored as the Replit secret `ANDROID_KEYSTORE_BASE64`
- Passwords: stored as Replit secrets `ANDROID_KEYSTORE_PASSWORD` and `ANDROID_KEY_PASSWORD` (both currently identical, 31 chars)

**Restore the keystore from the secret backup (disaster recovery) — DRILL VERIFIED 2026-07-08:**

This full restore path has been exercised end-to-end and confirmed: the `ANDROID_KEYSTORE_BASE64` secret alone (plus the two password secrets) is sufficient to keep publishing updates under `com.sfda.maktabah` even if the Expo/EAS account is lost. Steps below are the exact commands that were run and passed.

```bash
# JDK / keytool is already available in this environment (graalvm ships keytool + jarsigner).
# If missing on a fresh machine, install the java-graalvm22.3 module (or any JDK 17+).

# 1. Decode the secondary backup into a usable keystore file
echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > release.keystore

# 2. Verify it opens with the stored password and reports the expected alias + SHA1
keytool -list -v -keystore release.keystore -storepass "$ANDROID_KEYSTORE_PASSWORD" -alias mulazim2-upload
#   -> Alias name: mulazim2-upload
#   -> SHA1: 4B:5F:B5:D5:A1:E2:16:28:70:5F:54:68:A5:5A:52:E1:D3:ED:1A:B6  (must match)

# 3. Prove the restored key can actually sign. Sign any APK/JAR and verify the
#    embedded signing certificate SHA1 equals the value Google/EAS expects.
jarsigner -keystore release.keystore -storepass "$ANDROID_KEYSTORE_PASSWORD" \
  -keypass "$ANDROID_KEY_PASSWORD" -sigalg SHA256withRSA -digestalg SHA-256 \
  some.apk mulazim2-upload
jarsigner -verify some.apk                 # -> "jar verified."
keytool -printcert -jarfile some.apk       # -> SHA1 must equal 4B:5F:B5:D5:...:1A:B6
```

Drill result (2026-07-08): keystore decoded cleanly, opened with the stored passwords, reported alias `mulazim2-upload` with the expected SHA1, and a sample APK signed with the restored key verified successfully — the signing certificate on the signed APK matched the expected SHA1 `4B:5F:B5:D5:A1:E2:16:28:70:5F:54:68:A5:5A:52:E1:D3:ED:1A:B6` exactly (SHA256 `7A:68:AC:03:4D:5C:D1:0E:C2:4A:5F:EE:97:0A:BF:AC:9C:12:C4:47:BE:D5:55:72:F2:17:39:FD:93:4F:8B:4B`).

To rebuild the real app with the restored key instead of EAS remote credentials, set `credentialsSource: "local"` in `artifacts/mobile/eas.json` and point a `credentials.json` at the restored `release.keystore` (keystore path + `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_PASSWORD` / alias `mulazim2-upload`), then run the EAS build.

**Re-create the secondary backup from EAS (if ever needed again):**
```bash
# 1. Export the keystore from EAS (requires eas-cli and login, or use EXPO_TOKEN + EAS GraphQL)
eas credentials --platform android
# Choose: Download credentials as a keystore file

# 2. Base64-encode it
base64 -w 0 release.keystore

# 3. Paste the output into Replit Secrets as ANDROID_KEYSTORE_BASE64
```

**Rules:**
- Never delete the keystore from EAS without first verifying you have a working local backup
- Never rotate the keystore password without updating all CI/CD secrets and the EAS credential store
- Never upload a different keystore for an app already live on the Play Store — Google rejects APKs signed with a different key

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
