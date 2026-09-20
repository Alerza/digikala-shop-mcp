# Digikala Shop MCP

یک سرور MCP فقط‌خواندنی برای جست‌وجو و تحلیل محصولات دیجی‌کالا. این پروژه کلید API، حساب کاربری یا دادهٔ کاربر ذخیره نمی‌کند و همهٔ قیمت‌ها را به تومان نمایش می‌دهد.

## ابزارها

`search_digikala`، `product_details`، `get_products_batch`، `compare_products`، `product_reviews`، `product_questions`، `incredible_offers`، `best_selling` و `product_url`.

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

داده‌ها از API وب عمومی و مستندنشدهٔ دیجی‌کالا دریافت می‌شوند و ممکن است قرارداد آن بدون اطلاع قبلی تغییر کند. پیش از خرید، قیمت و موجودی را در لینک محصول تأیید کنید. این پروژه مستقل است و وابستگی یا تأییدی از سوی دیجی‌کالا ندارد.
