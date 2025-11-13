// app/api/cron/cart-insights/route.js
import { connectDB } from "@/lib/mongodb";
import UserStore from "@/models/UserStore";
import CartInsight from "@/models/CartInsight";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🛍️ helper to get abandoned carts from Shopify
async function fetchAbandonedCarts(shop, accessToken) {
  const res = await fetch(
    `https://${shop}/admin/api/2024-07/checkouts.json?status=abandoned`,
    {
      headers: { "X-Shopify-Access-Token": accessToken },
    }
  );
  const data = await res.json();
  return data.checkouts || [];
}

export async function GET() {
  try {
    await connectDB();

    const stores = await UserStore.find();
    if (!stores.length)
      return new Response("❌ No connected stores yet", { status: 404 });

    for (const store of stores) {
      const { shop, accessToken } = store;

      console.log(`🔍 Fetching carts for ${shop}...`);
      const carts = await fetchAbandonedCarts(shop, accessToken);
      if (!carts.length) {
        console.log(`No abandoned carts for ${shop}`);
        continue;
      }

      const total = carts.reduce(
        (sum, c) => sum + Number(c.total_price || 0),
        0
      );

      const prompt = `
Analyze abandoned carts for store: ${shop}

- Number of carts: ${carts.length}
- Total potential revenue: $${total.toFixed(2)}

Sample carts:
${carts
  .slice(0, 3)
  .map(
    (c) =>
      `• Customer: ${c.email || "guest"} | Items: ${
        c.line_items?.length || 0
      } | Total: $${c.total_price}`
  )
  .join("\n")}

Give a friendly 2-3 sentence insight and one concrete recovery strategy.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const insight = completion.choices[0].message.content;
      await CartInsight.create({
        shop,
        totalCarts: carts.length,
        totalValue: total,
        insight,
        createdAt: new Date(),
      });

      console.log(`✅ Saved AI insight for ${shop}`);
    }

    return new Response("✅ Cart insights cron finished successfully!");
  } catch (err) {
    console.error("❌ Cron failed:", err);
    return new Response("❌ Cart cron failed", { status: 500 });
  }
}
