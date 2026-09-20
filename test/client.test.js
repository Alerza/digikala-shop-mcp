import test from "node:test";
import assert from "node:assert/strict";
import { DigikalaClient, digikalaUrl, productFrom, toman, unwrap } from "../src/client.js";

test("formats monetary values and unwraps v2 product responses", () => {
  assert.equal(toman(12349), 1234);
  assert.equal(digikalaUrl({ id: 123 }), "https://www.digikala.com/product/dkp-123/");
  assert.deepEqual(unwrap({ data: { ok: true } }), { ok: true });
  assert.deepEqual(productFrom({ data: { product: { id: 123 } } }), { id: 123 });
});

test("search uses Digikala's bracketed Rial price range", async () => {
  let received;
  const client = new DigikalaClient({ origin: "https://example.test", retries: 1, fetchImpl: async (url) => { received = url; return new Response(JSON.stringify({ data: {} }), { status: 200 }); } });
  await client.search({ query: "گوشی موبایل", page: 2, minPrice: 10_000_000, maxPrice: 20_000_000 });
  assert.equal(received.pathname, "/v1/search/");
  assert.equal(received.searchParams.get("q"), "گوشی موبایل");
  assert.equal(received.searchParams.get("price[min]"), "10000000");
  assert.equal(received.searchParams.get("price[max]"), "20000000");
});

test("category, comments and bestseller endpoints use the validated paths", async () => {
  const paths = [];
  const client = new DigikalaClient({ origin: "https://example.test", retries: 1, fetchImpl: async (url) => { paths.push(`${url.pathname}?${url.searchParams}`); return new Response(JSON.stringify({ data: {} }), { status: 200 }); } });
  await client.category({ slug: "sunscreen-cream", sort: 4 });
  await client.productReviews(99, { page: 2, rate: 4, buyersOnly: true });
  await client.bestSelling(3);
  assert.match(paths[0], /^\/v1\/categories\/sunscreen-cream\/search\/\?page=1&sort=4$/);
  assert.match(paths[1], /^\/v1\/product\/99\/comments\/\?page=2&rate=4&is_buyer=1$/);
  assert.equal(paths[2], "/v1/best-selling/?page=3");
});

test("retries transient server errors before succeeding", async () => {
  let calls = 0;
  const client = new DigikalaClient({ origin: "https://example.test", fetchImpl: async () => { calls += 1; return new Response("{}", { status: calls === 3 ? 200 : 503 }); } });
  await client.bestSelling();
  assert.equal(calls, 3);
});
