// app/api/ai/product-intelligence/route.js
import { connectDB } from "@/lib/mongodb";
import UserStore from "@/models/UserStore";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchShopifyProducts(shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2024-07/products.json?limit=50`, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return data.products || [];
}

async function fetchShopifyOrders(shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2024-07/orders.json?status=any&limit=50`, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return data.orders || [];
}

export async function GET() {
  try {
    await connectDB();

    const store = await UserStore.findOne();
    if (!store) {
      return new Response(JSON.stringify({ error: "No connected Shopify store" }), { status: 404 });
    }

    const { shop, accessToken } = store;

    // 1️⃣ Fetch products and orders
    const products = await fetchShopifyProducts(shop, accessToken);
    const orders = await fetchShopifyOrders(shop, accessToken);

    // 2️⃣ Calculate sales per product
    const salesCount = {};
    orders.forEach((order) => {
      order.line_items.forEach((item) => {
        const title = item.title;
        salesCount[title] = (salesCount[title] || 0) + item.quantity;
      });
    });

    // 3️⃣ Sort top and bottom products
    const sorted = Object.entries(salesCount).sort((a, b) => b[1] - a[1]);
    const topProducts = sorted.slice(0, 5).map(([title, qty]) => `${title} (${qty} sold)`);
    const lowProducts = sorted.slice(-5).map(([title, qty]) => `${title} (${qty} sold)`);

    // 4️⃣ Send summary to AI for insights
    const prompt = `
You are Product Intelligence AI for Shopify.
Analyze this sales data and provide a brief insight.

Top-selling products:
${topProducts.join(", ")}

Low-selling or abandoned products:
${lowProducts.join(", ")}

Please return 3 short insights and 2 action recommendations to improve performance.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const aiResponse = completion.choices[0].message.content;

    return new Response(
      JSON.stringify({
        topProducts,
        lowProducts,
        insights: aiResponse,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Product Intelligence Error:", err);
    return new Response(JSON.stringify({ error: "Failed to analyze products" }), { status: 500 });
  }
}
