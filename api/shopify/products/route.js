// app/api/shopify/products/route.js
import { connectDB } from "@/lib/mongodb";
import UserStore from "@/models/UserStore";

export async function GET() {
  try {
    await connectDB();

    // Find the first connected store
    const store = await UserStore.findOne();
    if (!store) {
      return new Response(JSON.stringify({ message: "No connected store yet" }), {
        status: 404,
      });
    }

    const { shop, accessToken } = store;

    // 1️⃣ Fetch real products from Shopify
    const response = await fetch(`https://${shop}/admin/api/2024-07/products.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shopify API error:", errorText);
      return new Response(JSON.stringify({ error: "Shopify API failed" }), {
        status: 500,
      });
    }

    const data = await response.json();

    // 2️⃣ Return product data
    return new Response(JSON.stringify({ products: data.products }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error fetching Shopify data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}
