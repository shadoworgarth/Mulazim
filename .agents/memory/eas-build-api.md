---
name: EAS build query API
description: How to resolve the latest APK download URL from EAS (GraphQL, not REST).
---

# Resolving the latest APK download URL from EAS

The `/download` page auto-resolves the newest production Android APK from EAS.

**Rule:** EAS has NO working `https://api.expo.dev/v2/builds?appId=...` REST endpoint — it returns 404 (plain "Not Found"). Use the GraphQL API at `https://api.expo.dev/graphql` instead.

- Auth: `Authorization: Bearer $EXPO_TOKEN` (personal access token from https://expo.dev/settings/access-tokens).
- Query: `app.byId(appId).builds(limit, offset, filter:{platform:ANDROID, status:FINISHED, distribution:STORE})`; the download link is `build.artifacts.applicationArchiveUrl`.
- The production profile in `eas.json` builds `buildType: apk` with no distribution set (defaults to STORE), so `applicationArchiveUrl` is the `.apk`.

**Why:** the task spec suggested the v2 REST endpoint, which does not exist; only GraphQL works. Discovering this required probing endpoints live.

**Gotcha:** as of 2026-07-08 the EAS project (`@shadoworgarth/mulazim`, appId `d003632f-e001-4d26-85ce-d36fadbe1141`) has ZERO builds, so the page correctly falls back to the dashboard URL until a production build exists. An empty `/download` APK link is expected, not a bug, until someone runs an EAS production build.
