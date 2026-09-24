/* ============================================================
   SoulScript - site.js  (REBUILD 2026-08-06)
   Vanilla JS. Partial injection (header/footer/mobile nav),
   scroll-frost on the pill nav, entrance reveal (ONCE), home
   hero word sequence, read-more clamps, images-menu circular nav.
   MOTION CONTRACT (LEDGER.md CONFLICT): one entrance treatment,
   fired once per element, never replayed on scroll-back.
   No hover transforms on images, no parallax, no scroll-scrub,
   no autoplay carousels. --motion:0 or prefers-reduced-motion kills all.
   ============================================================ */
(function () {
  "use strict";

  /* Vercel serves /en/index.html at the path "/en" with NO trailing slash, so
     an indexOf("/en/") test returned false there and the English home page was
     handed the entire French navigation. Match the segment, not the slashes.
     Links are absolute for the same reason: relative "../" resolves differently
     on "/en" than on "/en/", and that ambiguity is what broke the switcher. */
  /* V4 row 5. Marine's Instagram handle, WITHOUT the @ and without the domain.
     Example: "soulscript.coaching". Leave it empty and the footer link is not
     rendered at all. This is the single place to change it. */
  /* Marine, 31 Aug 07:29: "You removed the Instagram. I don't know why... I asked
     you to put the link and then it disappeared."
     RESOLVED 31 Aug: Manan supplied the handle, so the search fallback below is now
     dead code that never fires. Left in place on purpose: if the handle is ever
     blanked the link degrades to a search rather than vanishing again, which is the
     failure she actually reported. */
  var IG_HANDLE = "marine_soulscript";
  /* Marine, 31 Aug 17:19, sent the canonical URL and asked that the link "arrive to
     the right Instagram page". The old form redirected there rather than landing on
     it, so use exactly what she sent: www, and the trailing slash. */
  var IG_URL = IG_HANDLE ? "https://www.instagram.com/" + IG_HANDLE + "/"
                         : "https://www.instagram.com/explore/search/keyword/?q=soulscript";

  var isEN = /(^|\/)en(\/|$)/.test(window.location.pathname);
  var enRoot = "/en";
  var pageRoot = isEN ? "/en" : "";
  var logoRoot = "/assets/logo";

  /* ---- Language switch: stay on the SAME page ----------------------------
     Marine, 28 Aug 2026: "When clicking on the english version while navigating
     the website, can we avoid to go back to the landing page? Can we just stay on
     the actual page and display the other language?"

     Both links used to be hardcoded to "/" and "/en/", so switching language from
     anywhere deeper than the home page threw the reader back to the top of the
     site. Now each link points at its own counterpart.

     Every FR page has an EN twin and vice versa (10 and 10, checked), so the
     mapping is a straight prefix swap. `trailingSlash: false` in vercel.json means
     "/a-propos" and never "/a-propos/", and the home page is the one case that
     keeps its slash. If a page is ever added on one side only, the fallback sends
     that language home rather than to a 404. */
  var KNOWN = ["a-propos", "la-methode", "les-accompagnements", "experiences-retraites",
               "contact", "communaute", "pour-les-entreprises", "mentions-legales",
               "confidentialite"];

  function counterpart(toEN) {
    var p = window.location.pathname.replace(/\/+$/, "");   // "/en/contact" -> "/en/contact"
    var slug = p.replace(/^\/en(?=\/|$)/, "").replace(/^\//, "");
    if (!slug) return toEN ? "/en/" : "/";                  // home either way
    if (KNOWN.indexOf(slug) === -1) return toEN ? "/en/" : "/";  // unknown page, go home not 404
    return toEN ? "/en/" + slug : "/" + slug;
  }

  var frHref = counterpart(false);
  var enHref = counterpart(true);

  /* ---- Header partial: floating pill nav, REAL logo placed from file ---- */
  var headerHTML =
    '<header class="site-header" id="siteHeader">' +
    '  <div class="nav-bar">' +
    /* V4 row 23: "Can we have the 3 bars menu on the left? I find it way more
       intuitive and easy to navigate." The button now lives as a direct child of
       .nav-bar ahead of the brand, rather than inside .nav-right, so the mobile
       order is genuinely burger / logo / utilities instead of a CSS illusion
       that would leave the tab order saying something different. Hidden above
       1099 where the full link row is showing. */
    '    <button class="menu-toggle" id="menuToggle" aria-label="Menu" aria-expanded="false">' +
    "      <span></span><span></span><span></span>" +
    "    </button>" +
    /* Rows 6 + 7, 31 Aug. Manan: "it should be in one line because it's too small"
       and "the three words we cannot read at all... I will make it white these three
       lines rather than keeping it black". The stacked nav lockup crushes the
       REWRITE / REALIGN / RISE wordmark to about 5px on a phone. The inline cream
       lockup is the same artwork on one line and reads at nav height. CSS picks the
       stacked one back up above 680 where there is room for it. */
    '    <a class="nav-brand" href="' + pageRoot + '/' + '" aria-label="SoulScript">' +
    '      <img class="brand-stack" src="' + logoRoot + '/lockup-light-nav.png" alt="SoulScript" />' +
    /* Marine, 3 Sep, row 18: "Rework the baseline realign - rewrite - rise in the right
       of the logo => can you put it under the logo ?" New mobile lockup built from the
       same brand artwork (logo-03): wordmark on one line, the three words centred
       underneath. The two connecting rules are dropped in this size only, which is what
       lets the words be ~1.8x taller for the same lockup width and actually legible in a
       50px bar. Nothing is stretched.
       ALSO FIXES A LIVE BUG: the file it replaced had WHITE ink, and .hero-top forces
       white with a filter anyway, so once you scrolled past the hero and the bar turned
       cream the mobile logo was white on cream, i.e. invisible. Sienna source, filtered
       to white over the hero, visible in both states. */
    '      <img class="brand-inline" src="' + logoRoot + '/lockup-stacked-sienna.png" alt="SoulScript" />' +
    "    </a>" +
    /* V3 row 1: "by clicking on the logo we are back to the Home page, but it is
       not obvious, do you think people will understand?" Answer: not everyone. An
       explicit Accueil link removes the doubt and costs one nav slot, which we now
       have spare since Communauté and Entreprises came out (row 70). */
    '    <nav class="nav-links" aria-label="Principal">' +
    '      <a href="' + pageRoot + '/' + '">' + (isEN ? "Home" : "Accueil") + "</a>" +
    '      <a href="' + pageRoot + "/a-propos" + '">' + (isEN ? "About" : "À propos") + "</a>" +
    '      <a href="' + pageRoot + "/la-methode" + '">' + (isEN ? "The Method" : "La méthode") + "</a>" +
    '      <a href="' + pageRoot + "/les-accompagnements" + '">' + (isEN ? "Programs" : "Accompagnements") + "</a>" +
    '      <a href="' + pageRoot + "/experiences-retraites" + '">' + (isEN ? "Retreats" : "Retraites") + "</a>" +
    /* V3 row 70: Communauté and Entreprises unpublished until mid-September. */
    "    </nav>" +
    '    <div class="nav-right">' +
    '      <div class="lang-switch">' +
    '        <a href="' + frHref + '" class="' + (isEN ? "" : "is-active") + '">FR</a>' +
    '        <span class="sep">|</span>' +
    '        <a href="' + enHref + '" class="' + (isEN ? "is-active" : "") + '">EN</a>' +
    "      </div>" +
    '      <a class="btn btn--pill nav-cta-pill" href="' + pageRoot + "/contact" + '">' +
    (isEN ? "Book a call" : "Réserver") + "</a>" +
    "    </div>" +
    "  </div>" +
    "</header>";

  /* ---- Mobile nav overlay: large serif links, logo from file ---- */
  var mobileNavHTML =
    '<div class="mobile-nav" id="mobileNav" role="dialog" aria-modal="true" aria-label="Menu">' +
    '  <div class="mobile-top">' +
    '    <a href="' + pageRoot + '/' + '"><img src="' + logoRoot + '/lockup-light-nav.png" alt="SoulScript" style="height:44px" /></a>' +
    '    <button class="mobile-close" id="mobileClose" aria-label="' + (isEN ? "Close" : "Fermer") + '">&times;</button>' +
    "  </div>" +
    '  <div class="m-lang-top" role="group" aria-label="' + (isEN ? "Language" : "Langue") + '">' +
    '    <a href="' + frHref + '" class="' + (isEN ? "" : "is-active") + '">Français</a>' +
    '    <a href="' + enHref + '" class="' + (isEN ? "is-active" : "") + '">English</a>' +
    "  </div>" +
'  <nav class="m-links">' +
    '    <a class="m-link" href="' + pageRoot + '/' + '">' + (isEN ? "Home" : "Accueil") + "</a>" +
    '    <a class="m-link" href="' + pageRoot + "/a-propos" + '">' + (isEN ? "About" : "À propos") + "</a>" +
    '    <a class="m-link" href="' + pageRoot + "/la-methode" + '">' + (isEN ? "The Method" : "La méthode") + "</a>" +
    '    <a class="m-link" href="' + pageRoot + "/les-accompagnements" + '">' + (isEN ? "Programs" : "Les accompagnements") + "</a>" +
    '    <a class="m-link" href="' + pageRoot + "/experiences-retraites" + '">' + (isEN ? "Retreats" : "Expériences et Retraites") + "</a>" +
    "  </nav>" +
        '  <div class="mobile-cta">' +
    '    <a class="btn btn--primary" href="' + pageRoot + "/contact" + '" style="width:100%;text-align:center">' +
    (isEN ? "Book a call" : "Réserver un appel") + "</a>" +
    /* Row 11, second placement: "inside the menu, like again under book a call" */
    '    <a class="m-ig" href="' + IG_URL + '" target="_blank" rel="noopener">' +
    (isEN ? "Join the community" : "Rejoindre la communauté") + "</a>" +
    "  </div>" +
    "</div>";

  /* ---- Footer partial: REAL logo placed from file ---- */
  var footerHTML =
    '<footer class="site-footer">' +
    '  <div class="container">' +
    '    <div class="footer-grid">' +
    /* Row 24: the SoulScript logo on ONE line in the footer. The nav lockup
       stacks Soul / Script; this inline lockup is composed from the same
       brand artwork (logo-03) so it is the real mark, not a retype. */
    '      <div class="footer-brand">' +
        '        <div class="footer-logo"><img src="' + logoRoot + '/lockup-inline-cream.png" alt="SoulScript" /></div>' +
    "        <p>" +
    (isEN
      ? "Online coaching, circles, in-person retreats and ceremonies, with a method combining neuroscience, somatic movement, rituals, breathwork, meditation and creativity."
      : "Coaching en ligne, cercles, retraites en présentiel et cérémonies, avec une méthode alliant neurosciences, mouvement somatique, rituels, respiration, méditation et créativité.") +
    "        </p>" +
    /* Marine 3 Sep, row 8: "add instagram line BELOW the paragraph". It sat above
       the description; it now follows it. */
    '        <a class="footer-ig" href="' + IG_URL + '" target="_blank" rel="noopener">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/>' +
    '<circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/></svg>' +
    (isEN ? "Join the community" : "Rejoindre la communauté") + "</a>" +
    "      </div>" +
    '      <div class="footer-col">' +
    "        <h4>" +
    (isEN ? "Join SoulScript" : "Rejoindre SoulScript") +
    "</h4>" +
    "        <ul>" +
    /* V3 row 70: Communauté links removed from both footer columns while the page
       is unpublished. Restore in mid-September along with the nav entries. */
    '          <li><a href="' + pageRoot + "/la-methode" + '">' + (isEN ? "The Method" : "La méthode") + "</a></li>" +
    '          <li><a href="' + pageRoot + "/les-accompagnements" + '">' + (isEN ? "Programs" : "Les accompagnements") + "</a></li>" +
    '          <li><a href="' + pageRoot + "/experiences-retraites" + '">' + (isEN ? "Retreats" : "Les retraites") + "</a></li>" +
    "        </ul>" +
    "      </div>" +
    '      <div class="footer-col">' +
    "        <h4>" + (isEN ? "Explore" : "Explore") + "</h4>" +
    "        <ul>" +
    '          <li><a href="' + pageRoot + '/' + '">' + (isEN ? "Home" : "Accueil") + "</a></li>" +
    '          <li><a href="' + pageRoot + "/a-propos" + '">' + (isEN ? "About" : "À propos") + "</a></li>" +
    '          <li><a href="' + pageRoot + "/contact" + '">' + (isEN ? "Contact" : "Contact") + "</a></li>" +
    "        </ul>" +
    "      </div>" +
    /* Rows 25 + 27: the sign-up is labelled as the newsletter and sits under
       the two link columns, not buried under the brand paragraph. */
    '      <div class="footer-news">' +
    "        <h4>" + (isEN ? "Newsletter" : "Newsletter") + "</h4>" +
    /* V3 row 12: "Remove the 'Une fois par mois' I can't commit right now."
       Cadence promise dropped, the description of what she sends stays. */
    '        <p class="news-note">' +
    (isEN
      ? "A short letter on inner narratives, the method, and the next retreats and circles."
      : "Une lettre courte sur les récits intérieurs, la méthode, et les prochaines retraites et cercles.") +
    "</p>" +
    '        <div class="newsletter">' +
    "          <form>" +
    '            <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px" />' +
    '            <input type="email" placeholder="' +
    (isEN ? "Your email" : "Votre email") +
    '" aria-label="' +
    (isEN ? "Newsletter email" : "Email newsletter") + '" required />' +
    "            <button type=\"submit\">" +
    (isEN ? "Subscribe" : "S'inscrire") +
    "</button>" +
    "          </form>" +
    "        </div>" +
    "      </div>" +
    "    </div>" +
    '    <div class="footer-bottom">' +
    '      <div class="fb-links">' +
    '        <a href="' + frHref + '">FR</a>' +
    '        <a href="' + enHref + '">EN</a>' +
    /* V4 row 5: "Link to the Instagram Account SoulScript."
       The link already existed but pointed at the bare https://instagram.com, which
       is a placeholder, not her account, and a visitor tapping it lands on a logged
       out feed. We have never been given the handle: the only string anywhere in the
       project is "@soulscript_official" inside an old image-generation prompt, which
       is invented text and not evidence of a real account.
       So it is set from ONE constant below. While that constant is empty the link is
       simply not rendered, because a dead link is worse than no link. The moment
       Marine sends the handle it is a one word change here and nothing else. */
    '        <a href="' + IG_URL + '" target="_blank" rel="noopener">Instagram</a>' +
    '        <a href="' + pageRoot + "/mentions-legales" + '">' + (isEN ? "Legal" : "Mentions légales") + "</a>" +
    '        <a href="' + pageRoot + "/confidentialite" + '">' + (isEN ? "Privacy" : "Confidentialité") + "</a>" +
    "      </div>" +
    "    </div>" +
    "  </div>" +
    "</footer>";

  /* ---- Inject partials ---- */
  function inject(id, html) {
    var slot = document.getElementById(id);
    if (slot) slot.innerHTML = html;
  }

  /* ---- Motion gate: disabled under reduced motion or if --motion:0 ---- */
  function motionEnabled() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    var v = getComputedStyle(document.documentElement).getPropertyValue("--motion").trim();
    return v !== "0";
  }

  /* ---- Nav scroll-frost ---- */
  function initNavFrost() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Rows 12 + 13: the strip's links carry INSTA_URL as a placeholder in the HTML so
     the markup stays static and cacheable, and the single IG_URL constant above
     remains the only place the handle is ever written. */
  function initInstaLinks() {
    var links = document.querySelectorAll('a[href="INSTA_URL"]');
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute("href", IG_URL);
      links[i].setAttribute("target", "_blank");
      links[i].setAttribute("rel", "noopener");
    }
  }

  /* Live Instagram feed, progressive enhancement.
     The strip already renders four of Marine's retreat photographs from the HTML,
     so the section is complete before any JavaScript runs and complete for anyone
     with JS disabled. This ONLY replaces them if /api/instagram returns real posts.
     If the account is not connected, or the token has expired, or the request
     fails, the page keeps the photographs and nobody sees a broken grid. */

  /* ---- Booking: load the Google Calendar iframe ONLY on click ---------------
     The whole site sets no cookies, which is why it needs no CNIL banner. A Google
     Calendar iframe rendered on page load would set Google cookies for every
     visitor and cost us that. So the iframe is injected on click, which is a
     deliberate act by the visitor, and the default state stays cookie free. */
  function initBooking() {
    var boxes = document.querySelectorAll(".ss-booking");
    for (var i = 0; i < boxes.length; i++) {
      (function (box) {
        var btn = box.querySelector(".ss-booking-load");
        var src = box.getAttribute("data-booking-src");
        if (!btn || !src) return;
        btn.addEventListener("click", function () {
          var f = document.createElement("iframe");
          f.src = src;
          f.title = /(^|\/)en(\/|$)/.test(window.location.pathname)
            ? "Book a discovery call" : "Réserver un appel découverte";
          f.loading = "lazy";
          f.setAttribute("frameborder", "0");
          box.innerHTML = "";
          box.appendChild(f);
          box.classList.add("is-loaded");
          /* Measured at 1440: inside the two-column split the iframe is only 526px
             wide and Google's scheduler clips its own date grid at that width. So
             the split collapses to one column once the calendar is open and the
             calendar gets the full container. The form moves below it, which is the
             right order anyway once someone has chosen to book. */
          var split = box.closest && box.closest(".split");
          if (split) split.classList.add("booking-open");
          f.focus();
        });
      })(boxes[i]);
    }
  }

  function initInstaFeed() {
    var grid = document.querySelector(".ig-grid");
    if (!grid || !window.fetch) return;

    fetch("/api/instagram", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.posts || d.posts.length < 4) return;   // fewer than a full row, keep the fallback
        var slots = grid.querySelectorAll("a");
        for (var i = 0; i < slots.length && i < d.posts.length; i++) {
          var p = d.posts[i], a = slots[i], img = a.querySelector("img");
          a.setAttribute("href", p.link);
          a.setAttribute("aria-label", p.alt);
          img.setAttribute("alt", p.alt);
          img.removeAttribute("srcset");
          img.setAttribute("src", p.img);
          if (p.type === "VIDEO") a.classList.add("is-video");
        }
        grid.classList.add("is-live");
      })
      .catch(function () { /* keep the fallback photographs, silently */ });
  }

  /* ---- Mobile menu ---- */
  function initMobileMenu() {
    var toggle = document.getElementById("menuToggle");
    var nav = document.getElementById("mobileNav");
    var closeBtn = document.getElementById("mobileClose");
    if (!toggle || !nav) return;
    function open() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
    toggle.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ---- Entrance reveal: 24px rise + fade, ONCE, never replayed (row 16) ----
     Uses IntersectionObserver. Once an element gets .is-in it is unobserved,
     so scrolling back up and down never re-fires. */
  /* Auto-tag content blocks so the reveal covers the whole site rather than the
     handful of elements that happened to be marked up. Manan 00:35: "when we
     scroll to the website text slowly fades and opens". Skips the hero (it has
     its own sequence) and anything already tagged. */
  function autoTagReveal() {
    var sections = document.querySelectorAll("main section");
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      if (sec.classList.contains("hero")) continue;
      var kids = sec.querySelectorAll(
        ":scope > .container > *, :scope > .wrap > *, :scope > *:not(.container):not(.wrap)"
      );
      for (var j = 0; j < kids.length; j++) {
        var el = kids[j];
        if (el.classList.contains("reveal") || el.classList.contains("reveal-seq")) continue;
        if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
        /* a grid or card row staggers its children; everything else fades whole */
        var many = el.children.length >= 2 && el.children.length <= 6 &&
                   /grid|cards|row|rail|three|four|stack/i.test(el.className || "");
        el.classList.add(many ? "reveal-seq" : "reveal");
      }
    }
  }

  /* FAILSAFE. Every revealable element starts at opacity 0 and is only shown by
     IntersectionObserver. If that observer never fires - print styles, an odd
     browser, a full-page screenshot tool, an extension, a deep link into a
     collapsed view - the page renders as blank cream with no content at all.
     Caught during final QA: a full-page capture at 1440 returned empty.
     Content invisibility is never an acceptable failure, so anything still
     hidden after 2.5s is simply shown. */
  function revealFailsafe() {
    setTimeout(function () {
      var stuck = document.querySelectorAll(".reveal:not(.is-in), .reveal-seq:not(.is-in)");
      for (var i = 0; i < stuck.length; i++) stuck[i].classList.add("is-in");
    }, 2500);
  }

  /* A right-floated image only sits BESIDE the copy if it precedes it in source
     order. The markup puts .p6-media last, so it floated below everything.
     Moving it to the front of its .p6-body at runtime is safer than another
     pass of regex surgery on the HTML, which is what broke the nesting twice. */
  function liftStepMedia() {
    var steps = document.querySelectorAll(".p6-step");
    for (var i = 0; i < steps.length; i++) {
      var body = steps[i].querySelector(".p6-body");
      var media = steps[i].querySelector(".p6-media");
      if (!body || !media) continue;
      /* The media is now its own stretched grid column, so it must be a direct
         child of the step, not nested in the body. Some pages still carry it
         inside the body from an earlier insertion pass. */
      if (media.parentNode !== steps[i]) {
        steps[i].appendChild(media);
      } else if (steps[i].lastElementChild !== media) {
        steps[i].appendChild(media);
      }
    }
  }

  /* The nav is transparent over the hero and solid past it. */
  function initHeroNavState() {
    var hero = document.querySelector(".hero, .inner-hero");
    var root = document.documentElement;
    if (!hero) { root.classList.add("is-scrolled"); return; }
    function update() {
      var past = window.scrollY > (hero.offsetHeight - 90);
      root.classList.toggle("is-scrolled", past);
      root.classList.toggle("hero-top", !past);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function initReveal() {
    initHeroNavState();
    liftStepMedia();
    autoTagReveal();
    revealFailsafe();
    var nodes = document.querySelectorAll(".reveal, .reveal-seq");
    if (!nodes.length) return;
    if (!motionEnabled()) {
      /* disabled: show everything immediately, no transform */
      nodes.forEach(function (n) {
        n.classList.add("is-in");
        n.style.opacity = "1";
        n.style.transform = "none";
      });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target); /* fire ONCE */
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---- Home hero word sequence: REMOVED 31 Aug 2026 --------------------------
     Manan, on a screen recording of switching FR -> EN on the home page: "there is
     still a rewrite/realign/rise frame that comes... I want the same loader that is
     there in French to happen again in English, or not happen at all."

     Checked before touching anything: `#heroSequence` existed in `en/index.html` and
     NOWHERE else. grep across all 20 pages returned exactly one hit. So this was
     never a shared intro that leaked into English, it was a panel English had and
     French never did, which is why the French home shows nothing and the English one
     flashes a cream REWRITE / REALIGN / RISE screen.

     Since parity with French is what he asked for and French has no loader, the right
     answer is none at all rather than adding one to French. The markup is archived at
     _Archive/en-heroSequence.REMOVED-2026-08-31.html if it is ever wanted back.

     Note this is a DIFFERENT mechanism from the water hero intro in water-hero.js,
     which uses `ss_seen_hero`. That one is symmetric and stays. Two separate keys,
     `ss_hero_seq_seen` and `ss_seen_hero`, is exactly why the 31 Aug fix to the water
     hero did not stop this: I fixed the wrong one of the two. ---- */

  /* ---- Read-more clamps ------------------------------------------------------
     V3 row 21: "If the paragraph is short enough, we probably don't need the
     'Read more' button. In the current version it doesn't really make sense
     because when you click it there's no extra text to reveal. But maybe it's
     still useful for the mobile version?"

     So the toggle is now conditional on real overflow rather than always drawn.
     Marine shortened every chapter in V3, so on desktop most no longer overflow
     and the button disappears; on mobile the same copy is much taller than the
     clamp, so it stays. That answers both halves of her question with one rule.
     Re-measured on resize because the answer changes with viewport width. ---- */
  function initReadMore() {
    var els = [].slice.call(document.querySelectorAll(".readmore"));

    function measure(rm) {
      var btn = rm.querySelector(".rm-btn");
      var body = rm.querySelector(".rm-collapsed");
      if (!btn || !body) return;
      // Never hide the control while the block is open, or the reader is trapped.
      if (rm.classList.contains("is-open")) return;
      // The clamp MUST be active while we measure. Removing it first and then
      // asking whether it overflows always answers "no", which silently disabled
      // the clamp on every page. Restore, measure, then decide.
      rm.classList.remove("rm-fits");
      body.style.removeProperty("--rm-h");
      var overflows = body.scrollHeight - body.clientHeight > 8;

      /* A clamp that lands in the MIDDLE of a bordered block (the employer list
         on À propos chapter 1, or a highlight block) slices that block's left
         rule in half and fades a sentence mid-word. It reads as a rendering
         fault even though the clamp is working. So if the cut line would bisect
         one of those blocks, pull the clamp UP to just above it. Pulling up is
         always safe: it can only make the text column shorter, never taller
         than the photograph beside it. */
      if (overflows) {
        var blocks = body.querySelectorAll(".work-list, .hl-block, blockquote");
        var bodyTop = body.getBoundingClientRect().top;
        var cut = body.getBoundingClientRect().bottom;
        for (var bi = 0; bi < blocks.length; bi++) {
          var r = blocks[bi].getBoundingClientRect();
          if (cut > r.top + 4 && cut < r.bottom - 4) {
            var safe = Math.max(80, Math.round(r.top - bodyTop - 14));
            body.style.setProperty("--rm-h", safe + "px");
            break;
          }
        }
      }

      rm.classList.toggle("rm-fits", !overflows);
      btn.hidden = !overflows;
    }

    els.forEach(function (rm) {
      var btn = rm.querySelector(".rm-btn");
      if (!btn) return;
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", function () {
        var open = rm.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open
          ? (document.documentElement.lang === "en" ? "Read less" : "Lire moins")
          : (document.documentElement.lang === "en" ? "Read more" : "Lire la suite");
      });
      measure(rm);
    });

    var t;
    window.addEventListener("resize", function () {
      window.clearTimeout(t);
      t = window.setTimeout(function () { els.forEach(measure); }, 150);
    });
    // Fonts land after first paint and change the height, so measure again.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { els.forEach(measure); });
    }
  }

  /* ---- Images menu circular nav (P4): swipe native, arrows for desktop (row 11) ---- */
  function initMenuRail() {
    var rail = document.querySelector("[data-menu-rail]");
    if (!rail) return;
    var prev = document.querySelector("[data-menu-prev]");
    var next = document.querySelector("[data-menu-next]");

    function scrollByItem(dir) {
      var card = rail.querySelector(".p4-circle");
      var gap = parseFloat(window.getComputedStyle(rail).gap) || 20;
      var step = card ? card.offsetWidth + gap : 200;
      rail.scrollLeft += step * dir;
    }
    function updateArrows() {
      var maxScroll = rail.scrollWidth - rail.clientWidth;
      var atStart = rail.scrollLeft <= 1;
      var atEnd = rail.scrollLeft >= maxScroll - 1;
      if (prev) { prev.disabled = atStart; prev.setAttribute("aria-disabled", atStart ? "true" : "false"); }
      if (next) { next.disabled = atEnd; next.setAttribute("aria-disabled", atEnd ? "true" : "false"); }
    }
    if (prev) prev.addEventListener("click", function () { scrollByItem(-1); });
    if (next) next.addEventListener("click", function () { scrollByItem(1); });
    rail.addEventListener("scroll", updateArrows, { passive: true });
    rail.setAttribute("tabindex", "0");
    rail.setAttribute("role", "group");
    rail.setAttribute("aria-label", isEN ? "Site sections" : "Menu des pages");
    rail.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); scrollByItem(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); scrollByItem(-1); }
    });
    updateArrows();
    window.addEventListener("resize", updateArrows);
  }

  /* ---- Accordion (ledger rows 3, 46, 47, 55) ----
     Marine: "can we do a kind of FAQ with the title and a 'lire la suite' so
     we can put all the information?" One item open at a time inside a group,
     so the section can never unroll into the wall of text she is trying to
     avoid. max-height is set from the real scrollHeight rather than a guessed
     constant, otherwise a long answer clips at the CSS ceiling. */
  function initAccordions() {
    var groups = document.querySelectorAll("[data-acc]");
    for (var g = 0; g < groups.length; g++) {
      (function (group) {
        var items = group.querySelectorAll(".acc-item");
        function setOpen(item, open) {
          var ans = item.querySelector(".acc-a");
          var btn = item.querySelector(".acc-q");
          var more = item.querySelector(".acc-more");
          item.classList.toggle("is-open", open);
          if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
          if (ans) ans.style.maxHeight = open ? ans.scrollHeight + "px" : "0px";
          if (more) {
            more.textContent = open
              ? (document.documentElement.lang === "en" ? "Read less" : "Lire moins")
              : (document.documentElement.lang === "en" ? "Read more" : "Lire la suite");
          }
        }
        for (var i = 0; i < items.length; i++) {
          (function (item, idx) {
            var btn = item.querySelector(".acc-q");
            var ans = item.querySelector(".acc-a");
            if (!btn || !ans) return;
            var id = (group.getAttribute("data-acc") || "acc") + "-" + idx;
            ans.id = id;
            btn.setAttribute("aria-controls", id);
            /* V3 row 38: "Make sure the 3 tabs are closed when we arrive on the
               page, currently the first tab is opened by default." All closed. */
            setOpen(item, false);
            btn.addEventListener("click", function () {
              var willOpen = !item.classList.contains("is-open");
              for (var k = 0; k < items.length; k++) setOpen(items[k], false);
              setOpen(item, willOpen);
            });
          })(items[i], i);
        }
        /* fonts land after boot and change the answer height */
        window.addEventListener("load", function () {
          var open = group.querySelector(".acc-item.is-open .acc-a");
          if (open) open.style.maxHeight = open.scrollHeight + "px";
        });
      })(groups[g]);
    }
  }

  /* ---- Newsletter (24 Sep 2026): real sign-up via /api/newsletter ----
     Was a stub that cleared itself and stored nothing. The visitor is only told
     "subscribed" when the server confirms the contact was saved. */
  function initNewsletter() {
    var isEN = /(^|\/)en(\/|$)/.test(window.location.pathname);
    var T = isEN
      ? { busy: "One moment…", ok: "Thank you, you're subscribed. A confirmation is on its way to your inbox.", bad: "Please check your email address.", fail: "Something went wrong. Please try again, or write to marine@soulscript.fr." }
      : { busy: "Un instant…", ok: "Merci, votre inscription est confirmée. Un email de bienvenue arrive dans votre boîte.", bad: "Merci de vérifier votre adresse email.", fail: "Une erreur est survenue. Réessayez, ou écrivez à marine@soulscript.fr." };
    document.querySelectorAll(".newsletter form").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var btn = form.querySelector("button");
        var note = form.parentNode.querySelector(".news-status");
        if (!note) {
          note = document.createElement("p");
          note.className = "news-status news-note";
          note.setAttribute("role", "status");
          form.parentNode.appendChild(note);
        }
        var hp = form.querySelector('input[name="_gotcha"]');
        btn.disabled = true; note.textContent = T.busy;
        fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: input.value, lang: isEN ? "en" : "fr", _gotcha: hp ? hp.value : "" })
        }).then(function (r) { return r.json().then(function (d) { return { status: r.status, d: d }; }); })
          .then(function (x) {
            if (x.d && x.d.ok) { note.textContent = T.ok; form.reset(); }
            else { note.textContent = x.status === 400 ? T.bad : T.fail; }
          })
          .catch(function () { note.textContent = T.fail; })
          .then(function () { btn.disabled = false; });
      });
    });
  }

  /* ---- Boot ---- */
  function boot() {
    inject("ss-header", headerHTML);
    inject("ss-mobile-nav", mobileNavHTML);

    /* Marine, 3 Sep, row 16: "Rework the FR/EN button... I want it to be present in
       the menu or just behind. At the moment it is at the bottom left and it's not
       visible enough." The floating bottom-left control is removed entirely. FR|EN is
       back in the header bar at every width, and repeated as a full-width pair at the
       top of the mobile drawer, so it is now in BOTH places she named. */
    inject("ss-footer", footerHTML);
    initNavFrost();
    initMobileMenu();
    initReveal();
    initReadMore();
    initMenuRail();
    initAccordions();
    initNewsletter();
    initInstaLinks();
    initInstaFeed();
    initBooking();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
