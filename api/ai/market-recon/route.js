// app/api/ai/market-recon/route.js
import { connectDB } from "@/lib/mongodb";
import Competitor from "@/models/Competitor";
import UserStore from "@/models/UserStore";
import { fetchMyShopProducts } from "@/lib/fetchShopifyData";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to get website text
async function fetchText(url) {
  const res = await fetch(url);
  const html = await res.text();
  return html.replace(/<[^>]*>/g, " "); // strip HTML tags
}

export async function POST(req) {
  try {
    await connectDB();

    const { competitors, shop } = await req.json();

    if (!Array.isArray(competitors) || competitors.length === 0) {
      return new Response(JSON.stringify({ error: "No competitors provided" }), {
        status: 400,
      });
    }

    // 🧩 1️⃣ Find connected user store
    const user = await UserStore.findOne({ shop });
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User store not connected or not found." }),
        { status: 401 }
      );
    }

    // 🧩 2️⃣ Fetch their Shopify products
    const myProducts = await fetchMyShopProducts(user.shop, user.accessToken);
    const productTitles = myProducts.map((p) => p.title).slice(0, 10);

    const results = [];

    for (const comp of competitors) {
      const text = await fetchText(comp.url);

      // find last snapshot
      const existing = await Competitor.findOne({ url: comp.url, userId: user._id });
      const oldText = existing?.lastSnapshot || "";

      const hasChanged = text.slice(0, 4000) !== oldText.slice(0, 4000);

      // save new snapshot
      await Competitor.findOneAndUpdate(
        { url: comp.url, userId: user._id },
        { name: comp.name, url: comp.url, lastSnapshot: text },
        { upsert: true }
      );

      let insight = "No major changes detected.";

      if (hasChanged) {
        const prompt = `
You are monitoring ${user.shop}, which sells: ${productTitles.join(", ")}.
Compare their offerings with competitor ${comp.name} at ${comp.url}.
Summarize any new marketing campaigns or product overlaps detected from these site changes.

Old version:
${oldText.slice(0, 2000)}

New version:
${text.slice(0, 2000)}
        `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        });

        insight = completion.choices[0].message.content;
      }

      results.push({
        name: comp.name,
        url: comp.url,
        insight,
      });
    }

    return new Response(JSON.stringify({ reports: results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Market Recon error:", error);
    return new Response(JSON.stringify({ error: "Recon failed" }), {
      status: 500,
    });
  }
}
