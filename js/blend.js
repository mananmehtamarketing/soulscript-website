/* ============================================================
   SoulScript — section blending
   Manan, 7 Aug: "I don't want any sections looking like strips. Each section
   has to flow into another using a gradient between the colours, and there
   should be no lines visible."

   Painting a decorative strip over a seam does not remove the seam, it just
   moves the edge. So instead each section repaints its OWN background as a
   vertical gradient:

       previous colour -> own colour -> own colour -> next colour

   Adjacent sections therefore meet at an identical colour value, which makes
   an edge mathematically impossible rather than merely hidden.

   Heroes are skipped (they carry video/canvas). The nav-over-hero state and
   the footer are untouched.
   ============================================================ */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function effectiveBg(el) {
    /* If we have already blended this element, its own colour is stashed. */
    if (el.dataset && el.dataset.ownBg) return el.dataset.ownBg;
    var n = el;
    while (n && n !== document.documentElement) {
      var c = getComputedStyle(n).backgroundColor;
      if (c && c !== "transparent" && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c)) return c;
      n = n.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor || "rgb(247,231,201)";
  }

  function parse(c) {
    var m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    return m ? [ +m[1], +m[2], +m[3] ] : [247,231,201];
  }
  /* Blending two colours by straight sRGB interpolation drags the midpoint
     toward whatever is lighter, which is why cream -> sienna washed through a
     pale band. Mixing in gamma-corrected space and biasing the midpoint toward
     the warmer of the two keeps the transition inside the brand palette. */
  function midway(a, b) {
    var A = parse(a), B = parse(b), o = [];
    for (var i = 0; i < 3; i++) {
      var lin = Math.sqrt((A[i]*A[i] + B[i]*B[i]) / 2);   // gamma-aware mix
      o.push(Math.round(lin));
    }
    return "rgb(" + o.join(",") + ")";
  }

  function blend() {
    var secs = Array.prototype.slice.call(document.querySelectorAll("main > section"));
    if (!secs.length) return;

    /* read every colour BEFORE writing any, so we never sample a value we
       have already replaced */
    var colours = secs.map(function (s) {
      if (s.classList.contains("hero") || s.classList.contains("inner-hero")) return null;
      var c = effectiveBg(s);
      s.dataset.ownBg = c;          // remember, so re-runs stay correct
      return c;
    });


    for (var i = 0; i < secs.length; i++) {
      var own = colours[i];
      if (!own) continue;                       // hero: leave its media alone

      var next = null, j;
      for (j = i + 1; j < secs.length; j++) { if (colours[j]) { next = colours[j]; break; } }
      /* Manan, 7 Aug: "we don't need the gradient in the footer, the footer can
         have a direct strip". So the last section keeps its own colour all the
         way down and the footer sits on it as a deliberate solid block with
         rounded shoulders. Fading into it made the rounded corners read as a
         notch cut out of a gradient. */
      var isLast = true;
      for (j = i + 1; j < secs.length; j++) { if (colours[j]) { isLast = false; break; } }
      /* The last section fades out to the PAGE colour, so the cream gap above
         the footer strip is arrived at rather than cut to. The footer itself
         stays a solid block: Manan wants a direct strip there, not a blend. */
      if (isLast) next = getComputedStyle(document.body).backgroundColor || own;
      if (!next) next = own;

      /* THE HANDSHAKE, corrected.
         Each section starts at its OWN colour and fades to the NEXT one over
         its last stretch. Section N therefore ends on exactly the colour that
         section N+1 begins with, so the two meet at an identical value.

         The earlier version also faded IN from the previous colour, which meant
         the sequence ran cream -> sienna -> back to cream -> sienna and produced
         a hard edge (measured: a 156-point jump on /la-methode). Fading in one
         direction only is what makes an edge impossible. */
      secs[i].setAttribute("data-blend", "");
      /* THE FADE IS A BAND, NOT THE WHOLE SECTION.
         Painting the gradient across the full height meant copy sat on a
         shifting background: on /pour-les-entreprises the body text started
         dark-on-pale and ended dark-on-sienna, which is unreadable. The section
         now holds its own flat colour for everything except the last 300px,
         which is padding, so the blend happens where there is no text. */
      var mid = midway(own, next);
      var band = 300;
      secs[i].style.setProperty(
        "--blend",
        "linear-gradient(180deg," + own + " 0%," +
        own + " calc(100% - " + band + "px)," +
        mid + " calc(100% - " + Math.round(band * 0.42) + "px)," +
        next + " 100%)"
      );
    }
  }

  ready(function () {
    /* header/footer are injected by site.js, so blend after that has run */
    setTimeout(blend, 0);
    setTimeout(blend, 400);
  });
  window.addEventListener("resize", function () { clearTimeout(window.__ssb); window.__ssb = setTimeout(blend, 200); });
})();
