#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DigikalaClient, digikalaUrl, toman, unwrap } from "./client.js";

const client = new DigikalaClient();
const server = new McpServer({ name: "digikala-shop-mcp", version: "0.1.0" });
const paging = { page: z.number().int().min(1).default(1) };

function json(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}
function fail(error) {
  return { content: [{ type: "text", text: `Digikala request failed: ${error.message}` }], isError: true };
}
function card(product) {
  const price = product?.default_variant?.price || product?.price || {};
  const selling = price.selling_price ?? price.rrp_price ?? product?.selling_price;
  return {
    id: product?.id, title: product?.title_fa || product?.title_en || product?.title,
    price_toman: toman(selling), discount_percent: price.discount_percent ?? product?.discount_percent ?? 0,
    rating: product?.rating?.rate ?? product?.rating, availability: product?.default_variant?.status ?? product?.status,
    url: digikalaUrl(product), image: product?.images?.main?.url?.[0] ?? product?.image,
  };
}
function products(response) {
  const data = unwrap(response);
  const list = data?.products ?? data?.items ?? data?.data?.products ?? [];
  return { products: Array.isArray(list) ? list.map(card) : [], total: data?.pager?.total_items ?? data?.total ?? null };
}

server.registerTool("search_digikala", {
  description: "Search Digikala products. All monetary input and output is in Toman.",
  inputSchema: { query: z.string().min(1).describe("Persian or English search query"), limit: z.number().int().min(1).max(30).default(10), sort: z.string().optional(), category_id: z.number().int().optional(), brand_id: z.number().int().optional(), min_price_toman: z.number().int().positive().optional(), max_price_toman: z.number().int().positive().optional(), ...paging }, annotations: { readOnlyHint: true },
}, async ({ query, limit, sort, category_id, brand_id, min_price_toman, max_price_toman, page }) => {
  try { return json(products(await client.search({ query, limit, sort, categoryId: category_id, brandId: brand_id, minPrice: min_price_toman && min_price_toman * 10, maxPrice: max_price_toman && max_price_toman * 10, page }))); } catch (e) { return fail(e); }
});

server.registerTool("product_details", {
  description: "Get a product's price, seller, warranty, specifications and rating by Digikala product ID.",
  inputSchema: { product_id: z.number().int().positive() }, annotations: { readOnlyHint: true },
}, async ({ product_id }) => { try { const data = unwrap(await client.product(product_id)); return json({ ...card(data?.product ?? data), details: data?.product ?? data }); } catch (e) { return fail(e); } });

server.registerTool("get_products_batch", {
  description: "Get compact product cards for up to 10 IDs; useful before comparison.",
  inputSchema: { product_ids: z.array(z.number().int().positive()).min(1).max(10) }, annotations: { readOnlyHint: true },
}, async ({ product_ids }) => { try { const settled = await Promise.allSettled(product_ids.map((id) => client.product(id))); return json(settled.map((result, i) => result.status === "fulfilled" ? card(unwrap(result.value)?.product ?? unwrap(result.value)) : { id: product_ids[i], error: result.reason.message })); } catch (e) { return fail(e); } });

server.registerTool("compare_products", {
  description: "Compare prices, ratings and attributes of 2 to 5 products. The output includes only attributes with differing values.",
  inputSchema: { product_ids: z.array(z.number().int().positive()).min(2).max(5) }, annotations: { readOnlyHint: true },
}, async ({ product_ids }) => {
  try {
    const data = await Promise.all(product_ids.map(async (id) => unwrap(await client.product(id))));
    const items = data.map((x) => x?.product ?? x);
    const attrs = new Map();
    for (const item of items) for (const group of item?.review?.attributes ?? item?.specifications ?? []) for (const attr of group?.attributes ?? [group]) {
      const key = attr.title || attr.key; if (key) { if (!attrs.has(key)) attrs.set(key, {}); attrs.get(key)[item.id] = attr.values?.map((v) => v.value || v).join(", ") ?? attr.value; }
    }
    const differing = Object.fromEntries([...attrs].filter(([, values]) => new Set(Object.values(values)).size > 1));
    return json({ products: items.map(card), differing_attributes: differing });
  } catch (e) { return fail(e); }
});

server.registerTool("product_reviews", {
  description: "Read buyer reviews for a product.", inputSchema: { product_id: z.number().int().positive(), ...paging }, annotations: { readOnlyHint: true },
}, async ({ product_id, page }) => { try { return json(unwrap(await client.productReviews(product_id, page))); } catch (e) { return fail(e); } });

server.registerTool("product_questions", {
  description: "Read buyer questions and answers for a product.", inputSchema: { product_id: z.number().int().positive(), ...paging }, annotations: { readOnlyHint: true },
}, async ({ product_id, page }) => { try { return json(unwrap(await client.productQuestions(product_id, page))); } catch (e) { return fail(e); } });

server.registerTool("incredible_offers", {
  description: "List current Digikala promotional offers.", inputSchema: paging, annotations: { readOnlyHint: true },
}, async ({ page }) => { try { return json(products(await client.incredibleOffers(page))); } catch (e) { return fail(e); } });

server.registerTool("best_selling", {
  description: "List best-selling Digikala products, optionally scoped to a category.", inputSchema: { category_id: z.number().int().optional(), ...paging }, annotations: { readOnlyHint: true },
}, async ({ category_id, page }) => { try { return json(products(await client.bestSelling(page, category_id))); } catch (e) { return fail(e); } });

server.registerTool("product_url", {
  description: "Resolve a Digikala product ID to its title and shareable URL.", inputSchema: { product_id: z.number().int().positive() }, annotations: { readOnlyHint: true },
}, async ({ product_id }) => { try { const data = unwrap(await client.product(product_id)); return json(card(data?.product ?? data)); } catch (e) { return fail(e); } });

await server.connect(new StdioServerTransport());
