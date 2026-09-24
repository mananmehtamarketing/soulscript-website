# Where everything lives

## Your pages

Each page is one file. The French version sits at the top level, the English twin sits
inside the `en/` folder with the **same filename**.

| Page on the site | French file | English file |
|---|---|---|
| Accueil / Home | `index.html` | `en/index.html` |
| À propos / About | `a-propos.html` | `en/a-propos.html` |
| La méthode / The method | `la-methode.html` | `en/la-methode.html` |
| Les accompagnements / Programs | `les-accompagnements.html` | `en/les-accompagnements.html` |
| Expériences et Retraites / Retreats | `experiences-retraites.html` | `en/experiences-retraites.html` |
| Contact | `contact.html` | `en/contact.html` |
| Mentions légales / Legal notice | `mentions-legales.html` | `en/mentions-legales.html` |
| Confidentialité / Privacy | `confidentialite.html` | `en/confidentialite.html` |

**Two pages exist but are hidden from Google on purpose**, because you asked to keep them
unpublished until you are ready: `communaute.html` and `pour-les-entreprises.html`. They
are complete and can be switched on whenever you say.

**The French and English files are completely separate.** Changing one never changes the
other. Every text change needs doing twice.

---

## Where things are kept

| Folder | What is in it |
|---|---|
| `assets/img/` | All photographs |
| `assets/img/v4/` | Your retreat photos and the picture of you with a client |
| `assets/img/picto/` | The four circle pictograms on the home page |
| `assets/img/cert/` | The six certification pictograms on the About page |
| `assets/video/` | The header videos. Each has three files: `.mp4`, `.webm` and a `-poster.jpg` still |
| `assets/logo/` | Every version of your logo |
| `assets/fonts/` | Blinka Serif and Archivo |
| `css/site.css` | Every visual rule. Do not edit |
| `js/` | The menu, the contact form, the opening animation. Do not edit |
| `api/contact.js` | What makes the contact form actually send. Do not edit |

---

## Things that live in more than one place

These bite people. If you change one, change all of them.

| Thing | Everywhere it appears |
|---|---|
| Prices | `les-accompagnements.html` **and** `en/les-accompagnements.html` |
| The menu and footer | Not in the page files at all. They are built by `js/site.js`, which is why they are identical everywhere. Ask us to change them |
| Your Instagram link | One line in `js/site.js`. One place, both languages, all pages |
| Your email address | `contact.html`, `en/contact.html`, both legal pages, and `api/contact.js` |
| The header videos | The page file, and each references three files in `assets/video/` |

---

## What runs the site

- **Hosting:** Vercel. Free tier, no monthly cost at your traffic
- **Domain:** IONOS, in your name
- **Contact form:** Resend, on your own account. Messages arrive at your Gmail
- **Analytics:** Vercel Speed Insights. Cookieless, which is why the site needs no cookie
  banner. Please keep it that way, adding Google Analytics would mean adding a banner
- **Booking calendar:** Google appointment schedule, to be connected to your Workspace

---

## A note on the two languages

The site tells Google that each French page has an English twin, and the language switch
keeps you on the same page rather than throwing you back to the home page.

That only holds while the filenames stay matched. If you ever add a French page, it needs
an English twin **with the same filename**, or the switch will send visitors home instead.
That is a good moment to ask us rather than do it alone.
