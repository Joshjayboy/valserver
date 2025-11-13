// app/api/ai/engagex/route.js
import { connectDB } from "@/lib/mongodb";
import UserStore from "@/models/UserStore";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper functions to fetch Shopify data
async function fetchShopifyProducts(shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2024-07/products.json`, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return data.products || [];
}

async function fetchShopifyOrders(shop, accessToken) {
  const res = await fetch(`https://${shop}/admin/api/2024-07/orders.json?status=any&limit=20`, {
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

    // 🧩 1️⃣ Find connected store (for now, take the first one)
    const store = await UserStore.findOne();
    if (!store) {
      return new Response(JSON.stringify({ error: "No connected Shopify store" }), { status: 404 });
    }

    const { shop, accessToken } = store;

    // 🧩 2️⃣ Fetch product + order data
    const products = await fetchShopifyProducts(shop, accessToken);
    const orders = await fetchShopifyOrders(shop, accessToken);

    const productSummary = products
      .slice(0, 5)
      .map((p) => `${p.title} ($${p.variants?.[0]?.price || "?"})`)
      .join(", ");
    const orderSummary = `Recent ${orders.length} orders fetched.`;

    // 🧠 3️⃣ Send to AI for campaign ideas
    const prompt = `
You are EngageX, an AI marketing strategist for an online Shopify store.

Store: ${shop}
Products: ${productSummary}
Orders: ${orderSummary}

Generate 3 short marketing campaign ideas (email or social media) that could increase sales,
each with a title and a one-line actionable suggestion.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const insight = completion.choices[0].message.content;

    return new Response(JSON.stringify({ insight }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ EngageX error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate campaigns" }), { status: 500 });
  }
}
