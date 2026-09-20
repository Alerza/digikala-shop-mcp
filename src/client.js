const API_ORIGIN = "https://api.digikala.com";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class DigikalaClient {
  constructor({ fetchImpl = fetch, origin = API_ORIGIN, retries = 3 } = {}) {
    this.fetchImpl = fetchImpl;
    this.origin = origin.replace(/\/$/, "");
    this.retries = retries;
  }

  async get(path, params = {}) {
    const url = new URL(`${this.origin}${path}`);
    for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    let lastError;
    for (let attempt = 0; attempt < this.retries; attempt += 1) {
      try {
        const response = await this.fetchImpl(url, { headers: { accept: "application/json", "user-agent": "digikala-shop-mcp/0.2 (read-only)" }, signal: AbortSignal.timeout(20_000) });
        if (response.ok) return response.json();
        lastError = new Error(`Digikala API returned ${response.status} for ${path}`);
        if (response.status < 429 || response.status >= 500) throw lastError;
      } catch (error) { lastError = error; }
      if (attempt < this.retries - 1) await delay(250 * (2 ** attempt));
    }
    throw new Error(`Digikala API unreachable after ${this.retries} attempts: ${lastError?.message ?? "unknown error"}`);
  }

  search({ query, page = 1, minPrice, maxPrice }) { return this.get("/v1/search/", { q: query, page, "price[min]": minPrice, "price[max]": maxPrice }); }
  category({ slug, page = 1, sort, minPrice, maxPrice }) { return this.get(`/v1/categories/${encodeURIComponent(slug)}/search/`, { page, sort, "price[min]": minPrice, "price[max]": maxPrice }); }
  product(id) { return this.get(`/v2/product/${id}/`); }
  productReviews(id, { page = 1, rate, buyersOnly = true } = {}) { return this.get(`/v1/product/${id}/comments/`, { page, rate, is_buyer: buyersOnly ? 1 : undefined }); }
  productQuestions(id, page = 1) { return this.get(`/v1/product/${id}/questions/`, { page }); }
  incredibleOffers(page = 1) { return this.get("/v1/incredible-offers/", { page }); }
  bestSelling(page = 1) { return this.get("/v1/best-selling/", { page }); }
}

export function toman(rial) { return typeof rial === "number" ? Math.floor(rial / 10) : null; }
export function unwrap(data) { return data?.data ?? data; }
export function productFrom(response) { const data = unwrap(response); return data?.product ?? data; }
export function digikalaUrl(product) { return product?.id ? `https://www.digikala.com/product/dkp-${product.id}/` : null; }
