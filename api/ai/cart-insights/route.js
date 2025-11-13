// app/api/ai/cart-insights/route.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// app/api/ai/cart-insights/route.js
export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Use POST with { carts: [...] } to analyze abandoned carts."
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}


export async function POST(req) {
  try {
    const body = await req.json();
    const { carts } = body;

    if (!Array.isArray(carts) || carts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No carts to analyze" }),
        { status: 400 }
      );
    }

    // Build a short summary of the data to feed the AI
    const total = carts.reduce((sum, c) => sum + Number(c.total_price || 0), 0);
    const prompt = `
      Analyze these abandoned cart details from a Shopify store:

      - Number of carts: ${carts.length}
      - Total potential revenue: $${total.toFixed(2)}
      - Example carts:
      ${carts
        .slice(0, 3)
        .map(
          (c) =>
            `• Customer: ${c.email || "guest"} | Items: ${
              c.line_items?.length || 0
            } | Total: $${c.total_price}`
        )
        .join("\n")}

      Give a short, friendly insight (2-3 sentences) and one concrete recovery suggestion.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // small, fast model for insights
      messages: [{ role: "user", content: prompt }],
    });

    const insight = completion.choices[0].message.content;
    return new Response(JSON.stringify({ insight }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI insight error:", err);
    return new Response(JSON.stringify({ error: "AI analysis failed" }), {
      status: 500,
    });
  }
}
