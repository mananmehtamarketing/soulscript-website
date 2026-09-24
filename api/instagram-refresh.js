/* ============================================================================
   Keeps the Instagram token alive.

   Instagram long-lived tokens expire after 60 days. They refresh for another 60,
   but ONLY while the current one is still valid and at least 24 hours old. Miss
   the window and there is no recovery except redoing the whole OAuth flow with
   Marine present, which is exactly the sort of thing that gets discovered on a
   Friday when she is on a retreat.

   Same lesson as the ArboWild Supabase outage (CLAUDE.md rule 72): a free tier
   that quietly expires will be reported to us by the CLIENT unless something
   watches it. So this runs on a cron every 14 days, which gives four attempts
   before the token could ever lapse.

   IMPORTANT: refreshing returns a NEW token string. A cron cannot write back to
   a Vercel environment variable, so this endpoint refreshes and then reports the
   new value in the response and in the logs for a human to paste in. It also
   warns while there is still plenty of time, rather than at the last minute.

   Wired in vercel.json under "crons", path /api/instagram-refresh, running at
   04:00 every fourteenth day. (Deliberately not writing the cron expression in
   this comment: it contains a star-slash, which ends a block comment early and
   breaks the file. That is exactly how this file failed its first syntax check.)
   ============================================================================ */

module.exports = async function handler(req, res) {
  const token = process.env.IG_TOKEN;
  if (!token) {
    return res.status(200).json({ ok: true, configured: false, note: "IG_TOKEN not set yet" });
  }

  try {
    const r = await fetch(
      "https://graph.instagram.com/refresh_access_token" +
        "?grant_type=ig_refresh_token&access_token=" + token
    );
    const d = await r.json().catch(() => ({}));

    if (!r.ok || !d.access_token) {
      console.error("IG TOKEN REFRESH FAILED", r.status, d && d.error);
      return res.status(200).json({ ok: false, refreshed: false, detail: d && d.error });
    }

    const days = Math.round((d.expires_in || 0) / 86400);
    // The new token is only useful if a human pastes it into Vercel, so make it
    // impossible to miss in the log rather than burying it in a JSON blob.
    console.log(
      "IG TOKEN REFRESHED. Valid " + days + " more days.\n" +
      "PASTE THIS INTO VERCEL as IG_TOKEN:\n" + d.access_token
    );

    return res.status(200).json({
      ok: true,
      refreshed: true,
      expiresInDays: days,
      action: days < 25
        ? "UPDATE IG_TOKEN IN VERCEL NOW, the value is in the runtime log"
        : "no action needed, but the value is in the runtime log if you want it current",
    });
  } catch (e) {
    console.error("IG TOKEN REFRESH THREW", e && e.message);
    return res.status(200).json({ ok: false, refreshed: false, error: e && e.message });
  }
};
