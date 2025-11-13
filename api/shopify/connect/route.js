import { NextResponse } from "next/server";

export async function GET() {
  const shop = "yourshopname.myshopify.com"; // later, users can type their shop name

  const redirectUri = process.env.SHOPIFY_REDIRECT_URI;
  const clientId = process.env.SHOPIFY_API_KEY;

  const scopes = [
    "read_orders",
    "read_products",
    "read_checkouts",
    "read_inventory",
    "read_customers"
  ].join(",");

  const shopifyAuthUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;

  // 🟢 Redirect the user to Shopify login page
  return NextResponse.redirect(shopifyAuthUrl);
}
