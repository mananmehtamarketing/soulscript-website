/* ============================================================================
   SoulScript contact endpoint  ->  Resend

   WHY A SERVER ROUTE AT ALL.
   The site is static, so the obvious shortcut is to call Resend straight from
   the browser. That would put the API key in the public bundle, which is
   exactly how the Gemini key leaked on the Prefusion build and got that Google
   project suspended (CLAUDE.md rule 77). The key lives ONLY in the Vercel
   environment and is read here, server side. It is never sent to the client.

   ENV REQUIRED (set in Vercel, never committed):
     RESEND_API_KEY   the key from Marine's Resend account
     LEAD_TO          optional, defaults to her address below
   ============================================================================ */

/* Marine 24 Sep: marine@soulscript.fr is the ONLY address, everywhere. It is a
   Google Workspace mailbox (soulscript.fr MX = smtp.google.com). hello@ never existed
   and hard-bounced her own 14 Sep test, so it is gone. */
const TO_DEFAULT = ["marine@soulscript.fr"];
// The verified Resend domain is soulscript.fr itself. `send.soulscript.fr` is
// only the custom MAIL FROM subdomain (the SPF/MX pair), NOT a sending domain,
// so a From on it is rejected. Replies are steered by reply_to (the visitor),
// so this address never needs a real mailbox, and Marine's IONOS MX is untouched.
const FROM = "SoulScript <contact@soulscript.fr>";

// Treat this as a public endpoint, because it is one.
const ALLOWED_ORIGINS = ["https://soulscript.fr", "https://www.soulscript.fr"];
const MAX_BYTES = 12 * 1024;
const hits = new Map();                     // best-effort, per warm instance

function rateLimited(ip) {
  const now = Date.now();
  const win = 60 * 60 * 1000;               // 1 hour
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) hits.clear();        // never grow unbounded
  return list.length > 6;
}

const esc = s => String(s || "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// CommonJS on purpose: there is no package.json in this project, so the Vercel
// Node runtime treats a bare .js function as CJS. `export default` would throw
// at cold start, which is a 500 on every submission.
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
  if (!key) {
    // Fail LOUD. A form that reports success while sending nothing is the whole
    // problem this file exists to prevent.
    console.error("RESEND_API_KEY missing");
    return res.status(503).json({ ok: false, error: "not_configured" });
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: "rate_limited" });

  let body = req.body;
  if (typeof body === "string") {
    if (body.length > MAX_BYTES) return res.status(413).json({ ok: false, error: "too_large" });
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: bots fill every field, humans never see this one.
  if (body._gotcha) return res.status(200).json({ ok: true });

  const nom     = esc(body.nom || body.name).slice(0, 120);
  const email   = esc(body.email).slice(0, 160);
  const sujet   = esc(body.sujet || body.subject || "Demande").slice(0, 120);
  const message = esc(body.message).slice(0, 5000);
  const source  = esc(body.source || body._source || "site").slice(0, 200);

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "bad_email" });
  }
  if (!message && !nom) return res.status(400).json({ ok: false, error: "empty" });

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222">
      <p style="margin:0 0 14px"><b>Nouveau message depuis soulscript.fr</b></p>
      <p style="margin:0 0 6px"><b>Nom&nbsp;:</b> ${nom || "(non renseigné)"}</p>
      <p style="margin:0 0 6px"><b>Email&nbsp;:</b> ${email}</p>
      <p style="margin:0 0 6px"><b>Sujet&nbsp;:</b> ${sujet}</p>
      <p style="margin:0 0 6px"><b>Page&nbsp;:</b> ${source}</p>
      <hr style="border:none;border-top:1px solid #e3e3e3;margin:16px 0">
      <p style="white-space:pre-wrap;margin:0">${message}</p>
    </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: process.env.LEAD_TO ? [process.env.LEAD_TO] : TO_DEFAULT,
        reply_to: email,
        subject: `SoulScript · ${sujet} · ${nom || email}`,
        html
      })
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("resend_failed", r.status, data);
      return res.status(502).json({ ok: false, error: "send_failed" });
    }
    // Return the id so delivery can be confirmed provider-side afterwards.
    // A 200 from a mail API is NOT proof of delivery (rule 73b).
    return res.status(200).json({ ok: true, id: data.id || null });
  } catch (e) {
    console.error("resend_threw", e && e.message);
    return res.status(502).json({ ok: false, error: "send_failed" });
  }
}
