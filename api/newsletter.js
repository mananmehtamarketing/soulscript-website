/* ============================================================================
   SoulScript newsletter sign-up  ->  Resend Contacts + confirmation email

   Added 24 Sep 2026. Before this the footer form was a stub that cleared itself
   and stored nothing. Every sign-up now lands in the "General" audience of
   Marine's OWN Resend account, where she can see and export the full list
   (Resend dashboard > Audience). No third-party database, nothing to pay for.

   ENV (Vercel): RESEND_API_KEY (same key as /api/contact, full access).
   Optional NEWSLETTER_AUDIENCE_ID to point at a different audience.
   CommonJS on purpose, same reason as contact.js (no package.json).
   ============================================================================ */

const AUDIENCE = process.env.NEWSLETTER_AUDIENCE_ID || "898d4215-412c-4feb-9782-d03933613126";
const FROM = "Marine · SoulScript <marine@soulscript.fr>";
const REPLY_TO = "marine@soulscript.fr";
const ALLOWED_ORIGINS = ["https://soulscript.fr", "https://www.soulscript.fr"];
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now(), win = 60 * 60 * 1000;
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 500) hits.clear();
  return list.length > 5;
}

const COPY = {
  fr: {
    subject: "Bienvenue dans la lettre SoulScript",
    html: `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.7;color:#3a2a20;max-width:520px">
      <p>Bonjour,</p>
      <p>Merci pour votre inscription à la lettre SoulScript.</p>
      <p>Vous recevrez une lettre courte sur les récits intérieurs, la méthode, et les prochaines retraites et cercles.</p>
      <p>À très vite,<br>Marine</p>
      <p style="font-size:12px;color:#8a7a6a;margin-top:28px">Vous recevez ce message car vous vous êtes inscrit·e sur soulscript.fr. Pour vous désinscrire, répondez simplement à cet email.</p>
    </div>`
  },
  en: {
    subject: "Welcome to the SoulScript letter",
    html: `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.7;color:#3a2a20;max-width:520px">
      <p>Hello,</p>
      <p>Thank you for signing up to the SoulScript letter.</p>
      <p>You'll receive a short letter on inner narratives, the method, and the next retreats and circles.</p>
      <p>Speak soon,<br>Marine</p>
      <p style="font-size:12px;color:#8a7a6a;margin-top:28px">You are receiving this because you signed up on soulscript.fr. To unsubscribe, simply reply to this email.</p>
    </div>`
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  const origin = req.headers.origin || "";
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ ok: false, error: "bad_origin" });
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error("RESEND_API_KEY missing"); return res.status(503).json({ ok: false, error: "not_configured" }); }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: "rate_limited" });

  let body = req.body;
  if (typeof body === "string") { if (body.length > 4096) return res.status(413).end(); try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  if (body._gotcha) return res.status(200).json({ ok: true });   // honeypot

  const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
  if (!/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(email)) return res.status(400).json({ ok: false, error: "bad_email" });
  const lang = body.lang === "en" ? "en" : "fr";
  const H = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  try {
    // 1. Store the contact. This is the part that must never fail silently.
    const c = await fetch(`https://api.resend.com/audiences/${AUDIENCE}/contacts`, {
      method: "POST", headers: H,
      body: JSON.stringify({ email, unsubscribed: false })
    });
    const cData = await c.json().catch(() => ({}));
    if (!c.ok) {
      console.error("contact_failed", c.status, cData);
      return res.status(502).json({ ok: false, error: "store_failed" });
    }
    // 2. Confirmation email. A failure here is logged but the sign-up is already saved.
    const m = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: H,
      body: JSON.stringify({ from: FROM, to: [email], reply_to: REPLY_TO, subject: COPY[lang].subject, html: COPY[lang].html })
    });
    const mData = await m.json().catch(() => ({}));
    if (!m.ok) console.error("confirm_failed", m.status, mData);
    return res.status(200).json({ ok: true, contact: cData.id || null, confirmation: mData.id || null });
  } catch (e) {
    console.error("newsletter_threw", e && e.message);
    return res.status(502).json({ ok: false, error: "store_failed" });
  }
};
