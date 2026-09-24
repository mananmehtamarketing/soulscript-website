# SoulScript website: rules for any AI editing this repo

This is Marine Cornu's live website, soulscript.fr. Every commit to `main` publishes to the live site within about two minutes (Vercel). Built and maintained by MarketinCrew.

## How the site works
- Plain HTML, CSS and JavaScript. No build step, no framework. Do not add one.
- French is primary (root files). English lives in `/en/` with the same file names. Any text change must be made in BOTH languages unless Marine says otherwise.
- The header, footer and mobile menu are generated in `js/site.js`, not in each page.
- `api/contact.js` and `api/newsletter.js` are server routes. Never put an API key in any file. Keys live only in Vercel settings.

## Design rules (Marine's own)
- Minimal and editorial. No new animations.
- Brand colours: Terracotta #BF5F4C, Burnt Sienna #8F2A0D, Warm Brown #915F3A, Cream Beige #F7E7C9, Golden Ochre #D89C44, Olive #697040. Fonts: Blinka Serif for titles, Archivo for text.
- French copy addressed to the visitor uses inclusive form (Prêt·e, accompagné·e). When Marine writes about herself, keep it feminine.
- Never use em dashes.
- The only contact email is marine@soulscript.fr.

## Safe-editing rules
- Change only what was asked. Change words, never HTML tags or class names, unless asked.
- Links inside `/en/` pages must be absolute (`/en/contact`), never `../contact`.
- Images: when replacing an image, upload it under a NEW file name and update the reference. Files in `/assets`, `/css`, `/js` are cached by browsers for a year, so a new image at the same name will not show for returning visitors.
- After editing CSS or JS, update the `?v=` number after the file name in every page that links it (or ask MarketinCrew to run `_cachebust.py`).
- If unsure, stop and ask Marine or MarketinCrew. Every version is kept in GitHub history, so any change can be undone.

See `EDITING-GUIDE.md` and `SITE-MAP.md`.
