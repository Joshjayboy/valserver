// app/api/ai/cart-insights/latest/route.js
import { connectDB } from "@/lib/mongodb";
import CartInsight from "@/models/CartInsight";

export async function GET() {
  try {
    await connectDB();

    const latest = await CartInsight.findOne().sort({ createdAt: -1 }).limit(1);
    if (!latest)
      return new Response(
        JSON.stringify({ message: "No AI insights found yet." }),
        { status: 404 }
      );

    return new Response(JSON.stringify(latest), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error fetching latest insight:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch latest AI insight" }),
      { status: 500 }
    );
  }
}
