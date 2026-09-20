# Digikala Shop MCP

یک سرور MCP فقط‌خواندنی برای جست‌وجو و تحلیل محصولات دیجی‌کالا. این پروژه کلید API، حساب کاربری یا دادهٔ کاربر ذخیره نمی‌کند و همهٔ قیمت‌ها را به تومان نمایش می‌دهد.

## ابزارها

۱۳ ابزار فقط‌خواندنی: `search_digikala`، `browse_category`، `search_filters`، `product_details`، `product_specs`، `product_overview`، `product_reviews`، `product_questions`، `get_products_batch`، `compare_products`، `incredible_offers`، `best_selling` و `product_url`.

دسته‌ها با `category_slug` کار می‌کنند. مرتب‌سازی‌های معتبر `default`، `cheap`، `bestselling`، `discount`، `expensive` و `rating` هستند. برای جست‌وجوهای دارای بودجه، `min_price_toman` و `max_price_toman` را بدهید.

## اجرا

```bash
npm install
npm start
```

پیکربندی Claude Desktop / Cursor / Codex:

```json
{
  "mcpServers": {
    "digikala-shop": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/digikala-shop-mcp/src/index.js"]
    }
  }
}
```

## توسعه و آزمون

```bash
npm test
```

داده‌ها از API وب عمومی و مستندنشدهٔ دیجی‌کالا دریافت می‌شوند و ممکن است قرارداد آن بدون اطلاع قبلی تغییر کند. هر درخواست تا سه بار با backoff کوتاه تلاش می‌شود. پیش از خرید، قیمت و موجودی را در لینک محصول تأیید کنید. این پروژه مستقل است و وابستگی یا تأییدی از سوی دیجی‌کالا ندارد.
