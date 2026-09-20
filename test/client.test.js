import test from "node:test";
import assert from "node:assert/strict";
import { DigikalaClient, digikalaUrl, toman, unwrap } from "../src/client.js";

test("formats monetary and URL values", () => {
  assert.equal(toman(12349), 1234);
  assert.equal(digikalaUrl({ url: { uri: "/product/dkp-1/" } }), "https://www.digikala.com/product/dkp-1/");
  assert.deepEqual(unwrap({ data: { ok: true } }), { ok: true });
});

test("search encodes query and omits undefined filters", async () => {
  let received;
  const client = new DigikalaClient({ origin: "https://example.test", fetchImpl: async (url) => { received = url; return new Response(JSON.stringify({ data: {} }), { status: 200 }); } });
  await client.search({ query: "گوشی موبایل", page: 2, limit: 10 });
  assert.equal(received.pathname, "/v1/search/");
  assert.equal(received.searchParams.get("q"), "گوشی موبایل");
  assert.equal(received.searchParams.get("page"), "2");
  assert.equal(received.searchParams.has("brand"), false);
});
