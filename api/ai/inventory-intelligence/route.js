// app/api/ai/inventory-intelligence/route.js
import { connectDB } from "@/lib/mongodb";
import UserStore from "@/models/UserStore";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchInventory(shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2024-07/inventory_levels.json?limit=100`, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return data.inventory_levels || [];
}

async function fetchProducts(shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2024-07/products.json?limit=100`, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return data.products || [];
}

export async function GET() {
  try {
    await connectDB();

    // 1️⃣ Get connected store
    const store = await UserStore.findOne();
    if (!store) {
      return new Response(JSON.stringify({ error: "No connected Shopify store" }), { status: 404 });
    }

    const { shop, accessToken } = store;

    // 2️⃣ Fetch inventory + products
    const inventory = await fetchInventory(shop, accessToken);
    const products = await fetchProducts(shop, accessToken);

    // 3️⃣ Match inventory with product titles
    const productMap = {};
    products.forEach((p) => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          productMap[v.inventory_item_id] = {
            title: p.title,
            sku: v.sku,
          };
        });
      }
    });

    // 4️⃣ Build inventory summary
    const summary = inventory.map((item) => {
      const product = productMap[item.inventory_item_id];
      return {
        title: product?.title || "Unknown Product",
        sku: product?.sku || "N/A",
        quantity: item.available,
      };
    });

    const lowStock = summary.filter((p) => p.quantity > 0 && p.quantity < 5);
    const outOfStock = summary.filter((p) => p.quantity === 0);
    const overStock = summary.filter((p) => p.quantity > 200);

    // 5️⃣ AI insight
    const prompt = `
You are Inventory Intelligence AI for a Shopify store.
Here are the inventory stats:

Low-stock items: ${lowStock.map((p) => p.title).join(", ")}
Out-of-stock items: ${outOfStock.map((p) => p.title).join(", ")}
Overstocked items: ${overStock.map((p) => p.title).join(", ")}

Provide 3 short insights and 2 actions for restock optimization.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const insight = completion.choices[0].message.content;

    return new Response(
      JSON.stringify({
        summary,
        lowStock,
        outOfStock,
        overStock,
        insight,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Inventory Intelligence Error:", err);
    return new Response(JSON.stringify({ error: "Failed to analyze inventory" }), { status: 500 });
  }
}
