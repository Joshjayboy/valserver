// app/api/shopify/checkouts/route.js
import { connectDB } from "@/lib/mongodb";
import UserStore from "@/models/UserStore";

export async function GET() {
  try {
    await connectDB();

    // 🧩 1. Find a connected store (for now, just grab the first one)
    const store = await UserStore.findOne();
    if (!store) {
      return new Response(JSON.stringify({ message: "No connected store yet" }), {
        status: 404,
      });
    }

    const { shop, accessToken } = store;

    // 🧠 2. Call Shopify API to get abandoned checkouts
    const response = await fetch(`https://${shop}/admin/api/2024-07/checkouts.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shopify API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Shopify API failed", details: errorText }),
        { status: 500 }
      );
    }

    const data = await response.json();

    // 🛒 3. Return checkout data
    return new Response(JSON.stringify({ checkouts: data.checkouts }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error fetching abandoned carts:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch carts" }), {
      status: 500,
    });
  }
}
