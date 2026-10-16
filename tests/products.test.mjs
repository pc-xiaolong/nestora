import test from "node:test";
import assert from "node:assert/strict";
import { onRequestGet } from "../functions/api/products.js";

const makeRequest = (query = "") => new Request("https://nestora.test/api/products" + query);

test("rejects unsupported marketplace and category before contacting Amazon", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error("fetch should not run"); };
  try {
    const response = await onRequestGet({ request: makeRequest("?market=xx&category=cables"), env: {} });
    assert.equal(response.status, 400);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("accepts all advertised technology gadget categories before credential checks", async () => {
  const categories = ["charging", "power", "audio", "smart-home", "desk-tech", "computer-accessories", "wearables", "streaming"];
  for (const category of categories) {
    const response = await onRequestGet({
      request: makeRequest("?market=uk&category=" + encodeURIComponent(category)),
      env: {}
    });
    assert.equal(response.status, 503, category + " should be recognized and reach the missing-credentials guard");
    assert.equal((await response.json()).configured, false);
  }
});

test("rate limits repeated requests from the same Cloudflare client IP", async () => {
  const ip = "198.51.100.42";
  for (let i = 0; i < 30; i++) {
    const request = new Request("https://nestora.test/api/products?market=uk&category=cables", {
      headers: { "cf-connecting-ip": ip }
    });
    const response = await onRequestGet({ request, env: {} });
    assert.equal(response.status, 503, "requests within the configured window should reach normal configuration handling");
  }
  const blocked = await onRequestGet({
    request: new Request("https://nestora.test/api/products?market=uk&category=cables", {
      headers: { "cf-connecting-ip": ip }
    }),
    env: {}
  });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("retry-after"), "60");
});

test("returns a controlled configuration response when credentials are absent", async () => {
  const response = await onRequestGet({ request: makeRequest("?market=uk&category=cables"), env: {} });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).configured, false);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("returns only valid product URLs and allowlisted image hosts", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes("/auth/o2/token")) {
      return new Response(JSON.stringify({ access_token: "unit-test-token", expires_in: 3600 }), {
        status: 200, headers: { "content-type": "application/json" }
      });
    }
    assert.equal(url, "https://creatorsapi.amazon/catalog/v1/searchItems");
    assert.equal(init.headers["x-marketplace"], "www.amazon.co.uk");
    assert.equal(init.headers.authorization, "Bearer unit-test-token");
    const payload = {
      searchResult: { items: [
        {
          asin: "B012345678",
          detailPageURL: "https://www.amazon.co.uk/dp/B012345678?tag=trivenico-21",
          itemInfo: { title: { displayValue: "Cable organiser" } },
          images: { primary: { medium: { url: "https://m.media-amazon.com/images/I/test.jpg" } } }
        },
        {
          asin: "B012345679",
          detailPageURL: "https://evil.example/dp/B012345679",
          itemInfo: { title: { displayValue: "Untrusted link" } },
          images: { primary: { medium: { url: "https://m.media-amazon.com/images/I/test2.jpg" } } }
        },
        {
          asin: "B012345680",
          detailPageURL: "https://www.amazon.co.uk/dp/B012345680",
          itemInfo: { title: { displayValue: "Untrusted image" } },
          images: { primary: { medium: { url: "https://evil.example/image.jpg" } } }
        }
      ] }
    };
    return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const clientId = "unit-test-client-filtering";
    const response = await onRequestGet({
      request: makeRequest("?market=uk&category=cables"),
      env: { CREATORS_API_CLIENT_ID: clientId, CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /s-maxage=300/);
    const data = await response.json();
    assert.equal(data.items.length, 1);
    assert.equal(data.items[0].title, "Cable organiser");
    assert.equal(data.items[0].url, "https://www.amazon.co.uk/dp/B012345678?tag=trivenico-21", "preserve the exact Amazon-vended URL");
    assert.equal(new URL(data.items[0].image).hostname, "m.media-amazon.com");
    assert.equal(calls.length, 2, "one token request and one catalog request");
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("credential rotation invalidates cached OAuth tokens and product results", async () => {
  const originalFetch = globalThis.fetch;
  let tokenCalls = 0;
  let catalogCalls = 0;
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.includes("/auth/o2/token")) {
      tokenCalls++;
      return new Response(JSON.stringify({ access_token: "rotation-token-" + tokenCalls, expires_in: 3600 }), { status: 200 });
    }
    catalogCalls++;
    const token = "rotation-token-" + tokenCalls;
    return new Response(JSON.stringify({
      searchResult: { items: [{
        asin: "B012345681",
        detailPageURL: "https://www.amazon.co.uk/dp/B012345681?tag=trivenico-21",
        itemInfo: { title: { displayValue: "Rotated credential product " + token } },
        images: { primary: { medium: { url: "https://m.media-amazon.com/images/I/rotation.jpg" } } }
      }] }
    }), { status: 200 });
  };
  try {
    const base = { CREATORS_API_CLIENT_ID: "unit-test-rotation-client", CREATORS_API_VERSION: "3.1" };
    const first = await onRequestGet({
      request: makeRequest("?market=uk&category=drawers"),
      env: { ...base, CREATORS_API_CLIENT_SECRET: "test-secret-before-rotation" }
    });
    const second = await onRequestGet({
      request: makeRequest("?market=uk&category=drawers"),
      env: { ...base, CREATORS_API_CLIENT_SECRET: "test-secret-after-rotation" }
    });
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(tokenCalls, 2, "a rotated secret must obtain a fresh token");
    assert.equal(catalogCalls, 2, "a rotated secret must not reuse cached product results");
    assert.match((await second.json()).items[0].title, /rotation-token-2/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects vended links with a mismatched Partner tag instead of rewriting them", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    if (String(input).includes("/auth/o2/token")) {
      return new Response(JSON.stringify({ access_token: "tag-validation-token", expires_in: 3600 }), { status: 200 });
    }
    return new Response(JSON.stringify({
      searchResult: { items: [{
        asin: "B012345682",
        detailPageURL: "https://www.amazon.co.uk/dp/B012345682?tag=wrong-21",
        itemInfo: { title: { displayValue: "Wrong tag must not be rewritten" } },
        images: { primary: { medium: { url: "https://m.media-amazon.com/images/I/tag.jpg" } } }
      }] }
    }), { status: 200 });
  };
  try {
    const response = await onRequestGet({
      request: makeRequest("?market=uk&category=door"),
      env: { CREATORS_API_CLIENT_ID: "unit-test-wrong-tag", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).items, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("handles Amazon upstream rate limits with a controlled retryable response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    if (String(input).includes("/auth/o2/token")) {
      return new Response(JSON.stringify({ access_token: "rate-test-token", expires_in: 3600 }), { status: 200 });
    }
    return new Response(JSON.stringify({ message: "rate limited" }), { status: 429 });
  };
  try {
    const response = await onRequestGet({
      request: makeRequest("?market=us&category=trays"),
      env: { CREATORS_API_CLIENT_ID: "unit-test-client-rate", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /rate limited/i);
    assert.equal(response.headers.get("retry-after"), "30");
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("handles Amazon OAuth rate limits with a controlled retryable response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "too_many_requests" }), { status: 429 });
  try {
    const response = await onRequestGet({
      request: makeRequest("?market=uk&category=audio"),
      env: { CREATORS_API_CLIENT_ID: "unit-test-oauth-rate-limit", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "30");
    assert.match((await response.json()).error, /authentication.*rate limited/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("maps Amazon catalog 5xx responses to retryable service-unavailable responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    if (String(input).includes("/auth/o2/token")) {
      return new Response(JSON.stringify({ access_token: "outage-test-token", expires_in: 3600 }), { status: 200 });
    }
    return new Response(JSON.stringify({ message: "temporarily unavailable" }), { status: 503 });
  };
  try {
    const response = await onRequestGet({
      request: makeRequest("?market=uk&category=audio"),
      env: { CREATORS_API_CLIENT_ID: "unit-test-catalog-outage", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "30");
    assert.match((await response.json()).error, /temporarily unavailable/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("maps Amazon OAuth 5xx responses to retryable service-unavailable responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "service_unavailable" }), { status: 503 });
  try {
    const response = await onRequestGet({
      request: makeRequest("?market=us&category=audio"),
      env: { CREATORS_API_CLIENT_ID: "unit-test-oauth-outage", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "30");
    assert.match((await response.json()).error, /authentication.*temporarily unavailable/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("maps upstream network failures to retryable service-unavailable responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    if (String(input).includes("/auth/o2/token")) {
      return new Response(JSON.stringify({ access_token: "network-test-token", expires_in: 3600 }), { status: 200 });
    }
    throw new TypeError("simulated upstream network failure");
  };
  try {
    const response = await onRequestGet({
      request: makeRequest("?market=uk&category=audio"),
      env: { CREATORS_API_CLIENT_ID: "unit-test-network-failure", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "30");
    assert.match((await response.json()).error, /could not reach the upstream service/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("maps Amazon OAuth timeouts to retryable service-unavailable responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new DOMException("simulated OAuth timeout", "TimeoutError"); };
  try {
    const response = await onRequestGet({
      request: makeRequest("?market=uk&category=audio"),
      env: { CREATORS_API_CLIENT_ID: "unit-test-oauth-timeout", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "30");
    assert.match((await response.json()).error, /could not reach the upstream service/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("maps Amazon catalog timeouts to retryable service-unavailable responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    if (String(input).includes("/auth/o2/token")) {
      return new Response(JSON.stringify({ access_token: "timeout-test-token", expires_in: 3600 }), { status: 200 });
    }
    throw new DOMException("simulated catalog timeout", "TimeoutError");
  };
  try {
    const response = await onRequestGet({
      request: makeRequest("?market=us&category=audio"),
      env: { CREATORS_API_CLIENT_ID: "unit-test-catalog-timeout", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "30");
    assert.match((await response.json()).error, /could not reach the upstream service/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("invalidates a cached Amazon token after catalog authorization is rejected", async () => {
  const originalFetch = globalThis.fetch;
  let tokenCalls = 0;
  let catalogCalls = 0;
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.includes("/auth/o2/token")) {
      tokenCalls++;
      return new Response(JSON.stringify({ access_token: "auth-rejected-token-" + tokenCalls, expires_in: 3600 }), { status: 200 });
    }
    catalogCalls++;
    if (catalogCalls === 1) return new Response(JSON.stringify({ message: "expired token" }), { status: 401 });
    return new Response(JSON.stringify({ searchResult: { items: [] } }), { status: 200 });
  };
  try {
    const env = {
      CREATORS_API_CLIENT_ID: "unit-test-auth-rejected",
      CREATORS_API_CLIENT_SECRET: "test-only-secret",
      CREATORS_API_VERSION: "3.1"
    };
    const first = await onRequestGet({ request: makeRequest("?market=uk&category=audio"), env });
    assert.equal(first.status, 200, "a single rejected token should be refreshed and retried transparently");
    assert.equal(catalogCalls, 2, "catalogue request should be retried exactly once");
    assert.equal(tokenCalls, 2, "retry must fetch a new token");
    const second = await onRequestGet({ request: makeRequest("?market=uk&category=audio"), env });
    assert.equal(second.status, 200);
    assert.equal(tokenCalls, 2, "successful retry should leave the refreshed token cached");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("bounds Amazon catalog authorization recovery to one retry", async () => {
  const originalFetch = globalThis.fetch;
  let tokenCalls = 0;
  let catalogCalls = 0;
  globalThis.fetch = async input => {
    if (String(input).includes("/auth/o2/token")) {
      tokenCalls++;
      return new Response(JSON.stringify({ access_token: "persistently-rejected-" + tokenCalls, expires_in: 3600 }), { status: 200 });
    }
    catalogCalls++;
    return new Response(JSON.stringify({ message: "unauthorized" }), { status: 401 });
  };
  try {
    const response = await onRequestGet({
      request: makeRequest("?market=us&category=audio"),
      env: { CREATORS_API_CLIENT_ID: "unit-test-persistent-401", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /Amazon rejected the product request/i);
    assert.equal(tokenCalls, 2, "only one fresh-token request is permitted");
    assert.equal(catalogCalls, 2, "catalogue request must not retry indefinitely");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not retry Amazon catalog 403 permission failures", async () => {
  const originalFetch = globalThis.fetch;
  let tokenCalls = 0;
  let catalogCalls = 0;
  globalThis.fetch = async input => {
    if (String(input).includes("/auth/o2/token")) {
      tokenCalls++;
      return new Response(JSON.stringify({ access_token: "permission-test-token", expires_in: 3600 }), { status: 200 });
    }
    catalogCalls++;
    return new Response(JSON.stringify({ message: "marketplace access denied" }), { status: 403 });
  };
  try {
    const response = await onRequestGet({
      request: makeRequest("?market=uk&category=audio"),
      env: { CREATORS_API_CLIENT_ID: "unit-test-catalog-403", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" }
    });
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /Amazon rejected the product request/i);
    assert.equal(tokenCalls, 1, "403 is treated as an access/permission issue, not an expired token");
    assert.equal(catalogCalls, 1, "permission failures should not cause duplicate upstream calls");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns consistent public cache headers for repeated successful product lookups", async () => {
  const originalFetch = globalThis.fetch;
  let tokenCalls = 0;
  let catalogCalls = 0;
  globalThis.fetch = async input => {
    if (String(input).includes("/auth/o2/token")) {
      tokenCalls++;
      return new Response(JSON.stringify({ access_token: "cache-header-token", expires_in: 3600 }), { status: 200 });
    }
    catalogCalls++;
    return new Response(JSON.stringify({ searchResult: { items: [{
      asin: "B012345682",
      detailPageURL: "https://www.amazon.co.uk/dp/B012345682?tag=trivenico-21",
      itemInfo: { title: { displayValue: "Cache header test product" } },
      images: { primary: { medium: { url: "https://m.media-amazon.com/images/I/cache-header.jpg" } } }
    }] } }), { status: 200 });
  };
  try {
    const env = { CREATORS_API_CLIENT_ID: "unit-test-cache-headers", CREATORS_API_CLIENT_SECRET: "test-only-secret", CREATORS_API_VERSION: "3.1" };
    const first = await onRequestGet({ request: makeRequest("?market=uk&category=computer-accessories"), env });
    const firstBody = await first.json();
    assert.equal(first.status, 200);
    assert.match(first.headers.get("cache-control"), /s-maxage=300/);
    const second = await onRequestGet({ request: makeRequest("?market=uk&category=computer-accessories"), env });
    assert.equal(second.status, 200);
    assert.equal(second.headers.get("cache-control"), first.headers.get("cache-control"));
    assert.deepEqual(await second.json(), firstBody);
    assert.equal(tokenCalls, 1);
    assert.equal(catalogCalls, 1, "cache hit should not call Amazon again");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
