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
          detailPageURL: "https://www.amazon.co.uk/dp/B012345678?tag=wrong-21",
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
    assert.equal(new URL(data.items[0].url).searchParams.get("tag"), "trivenico-21");
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
        detailPageURL: "https://www.amazon.co.uk/dp/B012345681",
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
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
