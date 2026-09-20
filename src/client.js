const API_ORIGIN = "https://api.digikala.com";

export class DigikalaClient {
  constructor({ fetchImpl = fetch, origin = API_ORIGIN } = {}) {
    this.fetchImpl = fetchImpl;
    this.origin = origin.replace(/\/$/, "");
  }

  async get(path, params = {}) {
    const url = new URL(`${this.origin}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }

    const response = await this.fetchImpl(url, {
      headers: {
        accept: "application/json",
        "user-agent": "digikala-shop-mcp/0.1 (read-only)",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Digikala API returned ${response.status} for ${path}`);
    return response.json();
  }

  search({ query, page = 1, limit = 10, sort, categoryId, brandId, minPrice, maxPrice }) {
    return this.get(categoryId ? `/v1/categories/${categoryId}/search/` : "/v1/search/", {
      q: query, page, sort, brand: brandId, price: minPrice && maxPrice ? `${minPrice}-${maxPrice}` : undefined,
      page_size: limit,
    });
  }

  product(id) { return this.get(`/v2/product/${id}/`); }
  productReviews(id, page = 1) { return this.get(`/v1/product/${id}/reviews/`, { page }); }
  productQuestions(id, page = 1) { return this.get(`/v1/product/${id}/questions/`, { page }); }
  incredibleOffers(page = 1) { return this.get("/v1/incredible-offers/", { page }); }
  bestSelling(page = 1, categoryId) { return this.get(categoryId ? `/v1/categories/${categoryId}/best-selling/` : "/v1/best-selling/", { page }); }
}

export function toman(rial) {
  return typeof rial === "number" ? Math.floor(rial / 10) : null;
}

export function digikalaUrl(product) {
  const slug = product?.url?.uri || product?.url?.url || product?.slug;
  return slug ? `https://www.digikala.com${slug.startsWith("/") ? slug : `/product/${slug}/`}` : null;
}

export function unwrap(data) {
  return data?.data ?? data;
}
