import { logger } from "./logger";

const EAS_APP_ID = "d003632f-e001-4d26-85ce-d36fadbe1141";
const EAS_GRAPHQL_ENDPOINT = "https://api.expo.dev/graphql";
const EAS_DASHBOARD_FALLBACK =
  "https://expo.dev/accounts/shadoworgarth/projects/mulazim/builds";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface ResolvedApk {
  url: string;
  appVersion: string | null;
}

interface CacheEntry {
  resolvedAt: number;
  value: ResolvedApk;
}

let cache: CacheEntry | null = null;

const LATEST_BUILD_QUERY = `
  query LatestProductionApk($appId: String!) {
    app {
      byId(appId: $appId) {
        builds(
          limit: 1
          offset: 0
          filter: { platform: ANDROID, status: FINISHED, distribution: STORE }
        ) {
          id
          appVersion
          artifacts {
            applicationArchiveUrl
          }
        }
      }
    }
  }
`;

interface GraphQLBuild {
  id: string;
  appVersion: string | null;
  artifacts: {
    applicationArchiveUrl: string | null;
  } | null;
}

interface GraphQLResponse {
  data?: {
    app?: {
      byId?: {
        builds?: GraphQLBuild[];
      };
    };
  };
  errors?: Array<{ message: string }>;
}

async function fetchLatestApkFromEas(
  token: string,
): Promise<ResolvedApk | null> {
  const res = await fetch(EAS_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: LATEST_BUILD_QUERY,
      variables: { appId: EAS_APP_ID },
    }),
  });

  if (!res.ok) {
    logger.warn(
      { status: res.status },
      "EAS GraphQL request failed with non-OK status",
    );
    return null;
  }

  const json = (await res.json()) as GraphQLResponse;

  if (json.errors?.length) {
    logger.warn(
      { errors: json.errors.map((e) => e.message) },
      "EAS GraphQL returned errors",
    );
    return null;
  }

  const build = json.data?.app?.byId?.builds?.[0];
  const url = build?.artifacts?.applicationArchiveUrl;

  if (!build || !url) {
    logger.warn("EAS GraphQL returned no finished production Android build");
    return null;
  }

  return { url, appVersion: build.appVersion ?? null };
}

/**
 * Resolves the APK download URL and app version for the download page.
 *
 * Resolution order:
 *   1. APK_URL env var (explicit override — used verbatim)
 *   2. EAS GraphQL API (latest finished production Android build) when
 *      EXPO_TOKEN is set. Results are cached for 5 minutes.
 *   3. EAS dashboard URL as a last-resort fallback.
 */
export async function resolveApkUrl(): Promise<ResolvedApk> {
  const override = process.env.APK_URL;
  if (override) {
    return { url: override, appVersion: process.env.APP_VERSION ?? null };
  }

  const token = process.env.EXPO_TOKEN;
  if (token) {
    if (cache && Date.now() - cache.resolvedAt < CACHE_TTL_MS) {
      return cache.value;
    }

    try {
      const resolved = await fetchLatestApkFromEas(token);
      if (resolved) {
        cache = { resolvedAt: Date.now(), value: resolved };
        return resolved;
      }
    } catch (err) {
      logger.error({ err }, "Failed to resolve APK URL from EAS");
    }

    // Serve a stale cached value rather than the dashboard if we have one.
    if (cache) {
      return cache.value;
    }
  }

  return {
    url: EAS_DASHBOARD_FALLBACK,
    appVersion: process.env.APP_VERSION ?? null,
  };
}
