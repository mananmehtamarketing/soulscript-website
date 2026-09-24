#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Append a content hash to every local CSS/JS link so asset changes actually reach browsers.

vercel.json caches /css/*, /js/* and /assets/* with `max-age=31536000, immutable`, which is right
for performance but means a returning visitor keeps the old stylesheet for a YEAR. Without this,
any CSS or JS fix ships to the server and is never seen. CLAUDE.md rule 73(a).

Run after every asset change, BEFORE deploying.
"""
import hashlib, io, os, re, glob

ROOT = os.path.dirname(os.path.abspath(__file__))

def digest(rel):
    p = os.path.normpath(os.path.join(ROOT, rel))
    return hashlib.sha1(io.open(p, 'rb').read()).hexdigest()[:8] if os.path.exists(p) else None

pages = glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, 'en', '*.html'))
# Images are under the same immutable rule, so replacing a picture at the same
# filename never reaches anyone who has already loaded the page. Version them too.
pat = re.compile(r'(?P<attr>href|src)="(?P<path>(?:\.\./)?(?:css|js|assets)/[^"?]+'
                 r'\.(?:css|js|jpg|jpeg|png|webp|svg|mp4|webm|ico))(?:\?v=[0-9a-f]+)?"')

changed = 0
for page in pages:
    s = io.open(page, encoding='utf-8').read(); orig = s
    def sub(m):
        rel = m.group('path')
        lookup = rel[3:] if rel.startswith('../') else rel
        d = digest(lookup)
        return m.group(0) if not d else '%s="%s?v=%s"' % (m.group('attr'), rel, d)
    s = pat.sub(sub, s)
    if s != orig:
        io.open(page, 'w', encoding='utf-8').write(s); changed += 1
print("cache-busted %d of %d pages" % (changed, len(pages)))
