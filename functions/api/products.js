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
// Best-effort isolate-local token reuse prevents requesting a new OAuth token on every search.
let tokenCache = { key: "", accessToken: "", expiresAt: 0 };

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }
});
async function getToken(env, version) {
  const cacheKey = version + ":" + env.CREATORS_API_CLIENT_ID;
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
  const response = await fetch(endpoint, { method: "POST", headers, body });
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
  if (!env.CREATORS_API_CLIENT_ID || !env.CREATORS_API_CLIENT_SECRET) {
    return json({ configured: false, error: "Live Amazon product images require approved Creators API credentials configured as Cloudflare secrets." }, 503);
  }
  const version = env.CREATORS_API_VERSION || "3.2";
  if (!["2.1","2.2","2.3","3.1","3.2","3.3"].includes(version)) return json({ error: "Invalid Creators API credential version." }, 500);
  try {
    const token = await getToken(env, version);
    const headers = {
      "content-type": "application/json",
      "x-marketplace": market.host,
      "authorization": version.startsWith("2.") ? "Bearer " + token + ", Version " + version : "Bearer " + token
    };
    const response = await fetch("https://creatorsapi.amazon/catalog/v1/searchItems", {
      method: "POST",
      headers,
      body: JSON.stringify({
        keywords,
        marketplace: market.host,
        partnerTag: market.tag,
        itemCount: 6,
        resources: ["images.primary.medium", "itemInfo.title"]
      })
    });
    if (!response.ok) return json({ error: "Amazon Creators API returned status " + response.status + ". Check access, credential version, and marketplace approval." }, 502);
    const data = await response.json();
    const items = (data.searchResult?.items || []).map(item => {
      const productUrl = item.detailPageURL || "";
      let safeUrl = "";
      try {
        const parsed = new URL(productUrl);
        if (parsed.protocol === "https:" && parsed.hostname === market.host) {
          parsed.searchParams.set("tag", market.tag);
          safeUrl = parsed.href;
        }
      } catch (_) {}
      return {
        asin: item.asin || "",
        title: item.itemInfo?.title?.displayValue || "",
        image: [item.images?.primary?.medium?.url, item.images?.primary?.large?.url].find(value => {
          try { return new URL(value).protocol === "https:"; } catch (_) { return false; }
        }) || "",
        url: safeUrl
      };
    }).filter(item => item.title && item.url && item.image);
    return json({ configured: true, market: marketKey, category, items });
  } catch (error) {
    return json({ error: "Product lookup failed. Verify Creators API configuration in Cloudflare." }, 502);
  }
}
