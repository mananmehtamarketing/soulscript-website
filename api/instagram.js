/* ============================================================================
   SoulScript, live Instagram feed  ->  Meta Graph API

   WHY THIS EXISTS AND NOT A WIDGET
   Marine asked for the strip above the footer to always show her newest posts.
   Three ways to do that:

     1. An embed widget (Elfsight, SnapWidget, Curator). Rejected. They inject
        third-party JavaScript that sets cookies, and this site currently sets
        NO cookies at all, which is the entire reason it needs no CNIL consent
        banner. Adding a widget would mean adding a banner to a French site to
        show four photos. They also cost money forever and cap monthly views.
     2. A JSON service like Behold. Cleaner, cookieless, but still a monthly fee
        and a view cap, for something that is sixty lines of code.
     3. This. Our own serverless route on the Vercel project that is already
        hosting the site, calling Meta directly. No third party, no cookies, no
        fee, no view cap, and the token never reaches the browser (rule 77).

   HOW THE TOKEN WORKS, because this is the part that bites later
   Instagram long-lived tokens expire after 60 DAYS. They can be refreshed, but
   only while still valid, and only if the token is at least 24 hours old. If
   nobody refreshes it for two months the feed silently goes stale and then
   empty. `api/instagram-refresh.js` runs on a Vercel cron for exactly this
   reason. Do not delete it.

   ENV REQUIRED (Vercel, never committed):
     IG_TOKEN      long-lived Instagram access token
     IG_USER_ID    her Instagram user id (optional, "me" works with user tokens)
   ============================================================================ */

const LIMIT = 8;               // we display 4, fetch a few spare so a deleted post does not leave a hole
const CACHE_SECONDS = 1800;    // 30 min at the CDN. Her posting cadence is daily at most.

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const token = process.env.IG_TOKEN;
  if (!token) {
    /* Deliberate: 200 with an empty list, NOT an error.
       The strip renders her retreat photographs server-side and only replaces
       them if this returns posts. So before the account is connected the page
       looks finished rather than broken, and there is no error in her console. */
    return res
      .status(200)
      .setHeader("Cache-Control", "public, s-maxage=60")
      .json({ ok: true, configured: false, posts: [] });
  }

  const user = process.env.IG_USER_ID || "me";
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
  const url = `https://graph.instagram.com/${user}/media?fields=${fields}&limit=${LIMIT}&access_token=${token}`;

  try {
    const r = await fetch(url);
    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      // Most likely an expired token. Log it loudly, but never break her page.
      console.error("instagram_api_failed", r.status, data && data.error);
      return res
        .status(200)
        .setHeader("Cache-Control", "public, s-maxage=300")
        .json({ ok: true, configured: true, stale: true, posts: [] });
    }

    const posts = (data.data || [])
      // A VIDEO has no media_url usable as a still, it has a thumbnail_url.
      // CAROUSEL_ALBUM returns the first child image in media_url, which is what we want.
      .map((p) => ({
        id: p.id,
        img: p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url,
        link: p.permalink,
        alt: (p.caption || "").split("\n")[0].slice(0, 120) || "Publication SoulScript",
        type: p.media_type,
      }))
      .filter((p) => p.img);

    return res
      .status(200)
      .setHeader("Cache-Control", `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`)
      .json({ ok: true, configured: true, posts });
  } catch (e) {
    console.error("instagram_threw", e && e.message);
    return res.status(200).json({ ok: true, configured: true, stale: true, posts: [] });
  }
};
