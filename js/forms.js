/* ============================================================
   SoulScript — form delivery
   Every form on this site once posted to formspree.io/f/PLACEHOLDER, which
   accepts the request and throws it away. A visitor saw a success state; Marine
   got nothing. That is the failure mode that cost HBP real leads (CLAUDE.md
   61/73b), and this file exists to make it impossible here.

   Submissions now POST to /api/contact, a server route that talks to Resend with
   a key that never leaves the Vercel environment (rule 77).

   THE ONE RULE: the visitor is never told "sent" unless the server said so.
   If the key is not yet configured, the endpoint answers 503 and we fall back to
   opening the visitor's mail client pre-filled, exactly as before. A lead can be
   missed by choice, never by silence.
   ============================================================ */
(function () {
  "use strict";

  var ENDPOINT = "/api/contact";
  var TO       = "marine@soulscript.fr";   // fallback mailto, public address (Marine, 3 Sep)

  var isEN = window.location.pathname.indexOf("/en/") !== -1;
  var T = isEN ? {
    sending: "Sending…",
    okMail:  "Your mail app is opening with your message ready to send.",
    fail:    "Something went wrong. Please write to us directly at ",
    ok:      "Thank you. Your message has reached Marine, she will reply personally."
  } : {
    sending: "Envoi…",
    okMail:  "Votre messagerie s'ouvre avec votre message prêt à envoyer.",
    fail:    "Une erreur est survenue. Écrivez-nous directement à ",
    ok:      "Merci. Votre message est bien arrivé, Marine vous répondra personnellement."
  };

  function note(form, text, addr) {
    var n = form.querySelector(".ss-form-note");
    if (!n) {
      n = document.createElement("p");
      n.className = "ss-form-note";
      n.setAttribute("role", "status");
      form.appendChild(n);
    }
    n.textContent = text;
    if (addr) {
      var a = document.createElement("a");
      a.href = "mailto:" + TO; a.textContent = TO;
      n.appendChild(a);
    }
    return n;
  }

  function collect(form) {
    var out = [], fd = new FormData(form);
    fd.forEach(function (v, k) { if (String(v).trim()) out.push(k + ": " + v); });
    return out;
  }

  function handle(e) {
    var form = e.target;
    if (!form.matches("form")) return;
    e.preventDefault();

    var btn = form.querySelector('button[type="submit"], button:not([type])');
    var label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = T.sending; }

    function done(msg, addr) {
      note(form, msg, addr);
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }

    var subject = form.getAttribute("data-subject") || (isEN ? "Enquiry" : "Demande");

    /* Hand the visitor a pre-filled email. Used when the server cannot send,
       so a message is never silently dropped. */
    function mailtoFallback() {
      window.location.href = "mailto:" + TO +
        "?subject=" + encodeURIComponent("SoulScript - " + subject) +
        "&body=" + encodeURIComponent(collect(form).join("\n"));
      done(T.okMail, true);
    }

    var fd = new FormData(form), payload = { sujet: subject, source: window.location.pathname };
    fd.forEach(function (v, k) { payload[k] = String(v); });

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; })
          .then(function (j) { return { status: r.status, ok: r.ok, body: j }; });
      })
      .then(function (r) {
        if (r.ok && r.body && r.body.ok) { form.reset(); done(T.ok); return; }
        // 503 = the Resend key is not wired yet. Not the visitor's problem:
        // give them a working way to reach Marine instead of an error.
        if (r.status === 503) { mailtoFallback(); return; }
        done(T.fail, true);
      })
      .catch(function () { done(T.fail, true); });
  }

  document.addEventListener("submit", handle);
})();
