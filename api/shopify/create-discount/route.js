// app/api/shopify/create-discount/route.js
import { connectDB } from "@/lib/mongodb";
import UserStore from "@/models/UserStore";

export async function POST(req) {
  try {
    await connectDB();

    const store = await UserStore.findOne();
    if (!store) {
      return new Response(JSON.stringify({ error: "No connected store" }), { status: 404 });
    }

    const { shop, accessToken } = store;
    const { title, percentage, startDate, endDate } = await req.json();

    // 1️⃣ Create a price rule
    const ruleRes = await fetch(`https://${shop}/admin/api/2024-07/price_rules.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_rule: {
          title: title || "AI Campaign Discount",
          target_type: "line_item",
          target_selection: "all",
          allocation_method: "across",
          value_type: "percentage",
          value: `-${percentage || 10}`,
          starts_at: startDate || new Date().toISOString(),
          ends_at: endDate || null,
        },
      }),
    });

    const ruleData = await ruleRes.json();
    if (!ruleRes.ok) {
      console.error(ruleData);
      return new Response(JSON.stringify({ error: "Failed to create rule", ruleData }), { status: 500 });
    }

    const ruleId = ruleData.price_rule.id;

    // 2️⃣ Create an associated discount code
    const code = `${title?.replace(/\s+/g, "_") || "AI10"}_${Math.floor(Math.random() * 1000)}`;
    const codeRes = await fetch(
      `https://${shop}/admin/api/2024-07/price_rules/${ruleId}/discount_codes.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ discount_code: { code } }),
      }
    );

    const codeData = await codeRes.json();
    if (!codeRes.ok) {
      console.error(codeData);
      return new Response(JSON.stringify({ error: "Failed to create code", codeData }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, code }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Create-discount error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
