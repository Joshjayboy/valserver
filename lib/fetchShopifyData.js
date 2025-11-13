// lib/fetchShopifyData.js
export async function fetchMyShopProducts(shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2024-07/products.json?limit=50`, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
    },
  });

  if (!res.ok) {
    console.error("❌ Failed to fetch Shopify products:", await res.text());
    return [];
  }

  const data = await res.json();
  return data.products || [];
}
