// app/api/shopify/callback/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import UserStore from "@/models/UserStore";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");

  if (!shop || !code) {
    return NextResponse.json({ error: "Missing shop or code" }, { status: 400 });
  }

  try {
    // 1️⃣ Exchange code for an access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "No access token received" }, { status: 500 });
    }

    const accessToken = tokenData.access_token;

    // 2️⃣ Save the token and shop to MongoDB
    await connectDB();
    await UserStore.findOneAndUpdate(
      { shop },
      { shop, accessToken },
      { upsert: true, new: true }
    );

    console.log(`✅ Saved Shopify token for ${shop}`);

    // 3️⃣ Redirect back to dashboard
    return NextResponse.redirect("http://localhost:3000/dashboard");
  } catch (error) {
    console.error("❌ Error in callback:", error);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}
