// app/api/ai/commandedge/route.js
import { connectDB } from "@/lib/mongodb";
import UserStore from "@/models/UserStore";
import ProductReport from "@/models/ProductReport"; // From Product Intelligence
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET() {
  try {
    await connectDB();

    const store = await UserStore.findOne();
    if (!store)
      return new Response(JSON.stringify({ error: "No connected Shopify store" }), { status: 404 });

    const { shop } = store;

    // 1️⃣ Get latest Product Intelligence report
    const latestReport = await ProductReport.findOne({ shop }).sort({ createdAt: -1 });

    // 2️⃣ Fetch latest EngageX campaign suggestions
    const engageRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai/engagex`);
    const engageData = await engageRes.json();

    // 3️⃣ Fetch latest Inventory report
    const inventoryRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai/inventory-intelligence`);
    const inventoryData = await inventoryRes.json();

    // 4️⃣ Combine all insights into one prompt
    const prompt = `
You are CommandEdge — the central AI decision engine for the Recover Card system.
You have access to all modules:

🧠 Product Intelligence:
${latestReport?.insights || "No product insights available."}

💬 EngageX Campaign Ideas:
${engageData?.insight || "No campaign data."}

📦 Inventory Intelligence:
${inventoryData?.insight || "No inventory data."}

Task:
1. Summarize the current business status.
2. Identify 3 key opportunities or risks.
3. Recommend 3 next actions (like restock, launch discount, or new campaign).
Output format:
Status:
Opportunities:
Actions:
`;

    // 5️⃣ Ask AI for master decision
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const decision = completion.choices[0].message.content;

    return new Response(JSON.stringify({ shop, decision }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ CommandEdge Error:", err);
    return new Response(JSON.stringify({ error: "Failed to run CommandEdge" }), { status: 500 });
  }
}
