const MARKETS = {
  ae: { host: "www.amazon.ae", tag: "nestora073-21" },
  uk: { host: "www.amazon.co.uk", tag: "trivenico-21" },
  us: { host: "www.amazon.com", tag: "trivenico-20" }
};
const CATEGORIES = {
  cables: "desk cable management clips",
  trays: "under desk cable management tray",
  drawers: "under desk drawer organizer",
  door: "over door storage organizer",
  shelves: "narrow freestanding storage shelf",
  bins: "stackable storage bins with lids"
};
// Best-effort isolate-local caches reduce duplicate Amazon requests. They are not a global rate limiter.
let tokenCache = { key: "", accessToken: "", expiresAt: 0 };
const productCache = new Map();
const PRODUCT_CACHE_TTL_MS = 5 * 60 * 1000;
async function fingerprintSecret(secret) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
const IMAGE_HOSTS = new Set([
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
  "images-eu.ssl-images-amazon.com",
  "images-fe.ssl-images-amazon.com"
]);

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...extraHeaders }
});
async function getToken(env, version, credentialKey) {
  const cacheKey = credentialKey;
  if (tokenCache.key === cacheKey && tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }
  const form = new URLSearchParams({ grant_type: "client_credentials", client_id: env.CREATORS_API_CLIENT_ID, client_secret: env.CREATORS_API_CLIENT_SECRET });
  let endpoint, headers, body;
  if (version.startsWith("3.")) {
    endpoint = version === "3.1" ? "https://api.amazon.com/auth/o2/token" : version === "3.2" ? "https://api.amazon.co.uk/auth/o2/token" : "https://api.amazon.co.jp/auth/o2/token";
    headers = { "content-type": "application/json" };
    body = JSON.stringify({ grant_type: "client_credentials", client_id: env.CREATORS_API_CLIENT_ID, client_secret: env.CREATORS_API_CLIENT_SECRET, scope: "creatorsapi::default" });
  } else {
    endpoint = version === "2.1" ? "https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token" : version === "2.2" ? "https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token" : "https://creatorsapi.auth.us-west-2.amazoncognito.com/oauth2/token";
    headers = { "content-type": "application/x-www-form-urlencoded" };
    form.set("scope", "creatorsapi/default");
    body = form.toString();
  }
  const response = await fetch(endpoint, { method: "POST", headers, body, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Amazon token request failed with status " + response.status);
  const data = await response.json();
  if (!data.access_token) throw new Error("Amazon token response did not include an access token");
  const lifetimeSeconds = Number.isFinite(Number(data.expires_in)) ? Number(data.expires_in) : 3600;
  tokenCache = {
    key: cacheKey,
    accessToken: data.access_token,
    // Refresh two minutes early to avoid edge cases around token expiry.
    expiresAt: Date.now() + Math.max(60, lifetimeSeconds - 120) * 1000
  };
  return tokenCache.accessToken;
}
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const marketKey = url.searchParams.get("market") || "ae";
  const category = url.searchParams.get("category") || "cables";
  const market = MARKETS[marketKey];
  const keywords = CATEGORIES[category];
  if (!market || !keywords) return json({ error: "Unsupported marketplace or category." }, 400);
  if (!env.CREATORS_API_CLIENT_ID || !env.CREATORS_API_CLIENT_SECRET || !env.CREATORS_API_VERSION) {
    return json({
      configured: false,
      error: "Live Amazon product lookup requires approved Creators API credentials and the exact credential version configured as Cloudflare secrets."
    }, 503);
  }
  const version = String(env.CREATORS_API_VERSION).trim();
  if (!["3.1","3.2","3.3"].includes(version)) {
    return json({ error: "Unsupported Creators API credential version. Configure the exact version issued by Amazon." }, 500);
  }
  // Fingerprint the secret without storing or logging its raw value. Rotating a secret must invalidate both caches.
  const credentialKey = version + ":" + env.CREATORS_API_CLIENT_ID + ":" + await fingerprintSecret(env.CREATORS_API_CLIENT_SECRET);
  const cacheKey = credentialKey + ":" + marketKey + ":" + category;
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return json(cached.data);
  }
  if (cached) productCache.delete(cacheKey);

  try {
    const token = await getToken(env, version, credentialKey);
    const headers = {
      "content-type": "application/json",
      "x-marketplace": market.host,
      "authorization": "Bearer " + token
    };
    const response = await fetch("https://creatorsapi.amazon/catalog/v1/searchItems", {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        keywords,
        marketplace: market.host,
        partnerTag: market.tag,
        itemCount: 6,
        resources: ["images.primary.medium", "itemInfo.title"]
      })
    });
    if (!response.ok) {
      if (response.status === 429) {
        return json({ error: "Amazon product search is temporarily rate limited. Please wait briefly and retry." }, 503);
      }
      return json({ error: "Amazon Creators API returned status " + response.status + ". Check access, credential version, and marketplace approval." }, 502);
    }
    const data = await response.json();
    const items = (data.searchResult?.items || []).map(item => {
      const productUrl = item.detailPageURL || "";
      let safeUrl = "";
      try {
        const parsed = new URL(productUrl);
        // Amazon's Creators API vended links must not be altered. Validate the expected Partner tag,
        // then preserve the exact URL returned by Amazon to protect attribution and policy compliance.
        if (parsed.protocol === "https:" && parsed.hostname === market.host && !parsed.username && !parsed.password && !parsed.port && parsed.searchParams.get("tag") === market.tag) {
          safeUrl = productUrl;
        }
      } catch (_) {}
      return {
        asin: item.asin || "",
        title: item.itemInfo?.title?.displayValue || "",
        image: [item.images?.primary?.medium?.url, item.images?.primary?.large?.url].find(value => {
          try {
            const imageUrl = new URL(value);
            return imageUrl.protocol === "https:" && IMAGE_HOSTS.has(imageUrl.hostname) && !imageUrl.username && !imageUrl.password;
          } catch (_) { return false; }
        }) || "",
        url: safeUrl
      };
    }).filter(item => item.title && item.url && item.image);
    const result = { configured: true, market: marketKey, category, items };
    // Keep the isolate cache bounded even if more categories are added later.
    if (productCache.size >= 30) productCache.delete(productCache.keys().next().value);
    productCache.set(cacheKey, { data: result, expiresAt: Date.now() + PRODUCT_CACHE_TTL_MS });
    // Product-search responses contain no user-specific data; permit short edge caching.
    return json(result, 200, { "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=60" });
  } catch (error) {
    return json({ error: "Product lookup failed. Verify Creators API configuration in Cloudflare." }, 502);
  }
}
