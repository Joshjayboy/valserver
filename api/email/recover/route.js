// app/api/email/recover/route.js
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, products, total } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email address" }), {
        status: 400,
      });
    }

    // 🧩 1. Configure the mail transporter (using Gmail as an example)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 🧩 2. Create the email message
    const mailOptions = {
      from: `"Recover Card" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "We saved your cart for you! 🛒",
      html: `
        <h2>Hi there!</h2>
        <p>It looks like you left some great items in your cart.</p>
        <ul>
          ${(products || [])
            .map((p) => `<li>${p.title} — $${p.price}</li>`)
            .join("")}
        </ul>
        <p>Your total was <strong>$${total || "0.00"}</strong>.</p>
        <p>Come back now and enjoy <strong>10% off</strong> your order! 🎉</p>
        <a href="https://yourshop.myshopify.com/cart" style="display:inline-block;padding:10px 20px;background:#22c55e;color:#fff;border-radius:8px;text-decoration:none;">Recover My Cart</a>
        <p>❤️ From your friends at Recover Card</p>
      `,
    };

    // 🧩 3. Send the email
    await transporter.sendMail(mailOptions);

    console.log(`✅ Recovery email sent to ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return new Response(JSON.stringify({ error: "Email send failed" }), {
      status: 500,
    });
  }
}
