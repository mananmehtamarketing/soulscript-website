# Editing your website

Everything here assumes no coding background. If a step does not look like what you are
seeing, stop and message Manan rather than guessing.

---

## The one rule

You are editing **text between angle brackets**, never the brackets themselves.

```html
<h2>Prendre rendez-vous.</h2>
```

Change `Prendre rendez-vous.` Leave `<h2>` and `</h2>` exactly as they are. They are the
instruction telling the browser "this is a heading". Delete one and the page below it
will look broken.

---

## Changing a piece of text

1. Go to the repository (link in `DEPLOY-GUIDE.md`)
2. Click the file for the page you want. `SITE-MAP.md` tells you which is which
3. Click the **pencil icon** at the top right
4. Use **Ctrl+F** (Cmd+F on Mac) to find the sentence you want to change
5. Change only the words
6. Scroll to the bottom, write one line describing what you changed, click **Commit changes**

Your change is live in about two minutes.

---

## Changing a price

Prices live on `les-accompagnements.html` and appear **twice** each: once in the price
line, once sometimes in the description. Search for the number itself, for example `550`,
and check every result.

```html
<div class="price-meta">5 séances · 550 <span class="cur">€</span></div>
```

Change `550`. Leave `<span class="cur">€</span>` alone, that is what makes the euro sign
render properly in your brand font.

**The September offer** on the Signature package is written like this:

```html
<s class="price-was">1 330 <span class="cur">€</span></s> <span class="price-now">1 200 <span class="cur">€</span></span>
```

`price-was` is the struck-through old price, `price-now` is the live one. To end the
offer, delete everything from `<s class="price-was">` up to and including `</s>`, then
remove the `<span class="price-now">` wrapper from around the remaining price.

**Do the same edit on the English page**, `en/les-accompagnements.html`. The two pages
are separate files and neither updates the other.

---

## Changing a photo

1. Put your new image in `assets/img/` (drag and drop into the repo works)
2. Name it in lowercase with hyphens and no accents: `marine-atelier-lyon.jpg`
3. Find the old image in the page file and change the filename inside `src="..."`
4. Update the `alt="..."` text to describe the new photo in one short sentence

```html
<img src="assets/img/v4/retraite-sauge-560.webp?v=96593935" alt="Marine tenant un bouquet de sauge" />
```

Two things that matter:

- **Delete the `?v=96593935` part** when you change the file. That code makes browsers
  cache the image forever, so if you leave it people will keep seeing the old photo.
- **Always write the `alt` text.** It is what a blind visitor hears and what Google reads.

Photos should be **at least 1200px wide** and saved as `.jpg` or `.webp`. Anything smaller
looks soft on a modern screen.

---

## Adding a paragraph

Copy an existing paragraph line, paste it directly underneath, change the words.

```html
<p>Your existing sentence.</p>
<p>Your new sentence.</p>
```

To make part of it bold:

```html
<p>Regular words <strong>and these are bold</strong> and regular again.</p>
```

To force a line break in the middle of a sentence, use `<br />` where you want the break.

---

## French inclusive writing

The site uses the middle dot form throughout when it addresses the reader: `prêt·e`,
`accompagné·e`, `chacun·e`, `informé·e`. If you add copy that speaks to the visitor,
please match it.

Note the exception: when **you** write about **yourself**, the feminine is correct and
stays. `J'étais épuisée` is right and should not be changed.

---

## What NOT to touch

| Leave alone | Why |
|---|---|
| Anything starting with `<div class=` | Structure. Delete one and a section collapses |
| `site.js`, `forms.js`, `water-hero.js` | The menu, the contact form and the opening animation |
| `css/site.css` | Every visual rule on the site |
| The `.svg` files in `assets/img/picto/` and `assets/img/cert/` | Your pictograms |
| `<head>` at the top of any page | Google, social sharing, and the language links |
| Anything mentioning `api/contact` | Your contact form. Break it and enquiries vanish silently |

---

## Before you close the tab

- Open the page on your phone as well as your laptop
- If you changed a French page, check whether the English one needs the same change
- If something looks wrong, message Manan. Every version is kept and anything can be
  restored in a couple of minutes
