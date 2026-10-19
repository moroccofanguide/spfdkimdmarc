#!/usr/bin/env python3
"""Static site generator for spfdkimdmarc.com.

Each file in pages/ starts with one line of JSON metadata, followed by the
page body (HTML). Run from anywhere: python3 _build/build.py
Output is written to the repository root (one folder per page).
"""
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = "https://spfdkimdmarc.com"
NAME = "spfdkimdmarc.com"

NAV = [("/", "Checker"), ("/spf/", "SPF"), ("/dkim/", "DKIM"), ("/dmarc/", "DMARC"), ("/guides/", "Guides")]

CTA = """<div class="cta">
  <p><strong>Check your domain now.</strong> See your current SPF, DKIM and DMARC records and get the exact entries to fix them. Rather not touch DNS? <a href="/setup-service/">We can do it for you</a>.</p>
  <form class="row" action="/" method="get">
    <input type="text" name="d" inputmode="url" autocomplete="off" spellcheck="false" placeholder="example.com" aria-label="Domain name">
    <button type="submit">Check</button>
  </form>
</div>"""


import hashlib
with open(os.path.join(ROOT, "assets", "style.css"), "rb") as _f:
    CSS_VER = hashlib.sha1(_f.read()).hexdigest()[:8]


def asset_ver(name):
    with open(os.path.join(ROOT, "assets", name), "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]


def bust(page):
    for name in ("logo.svg", "apple-touch-icon.png", "og.png"):
        page = page.replace("/assets/%s\"" % name, "/assets/%s?v=%s\"" % (name, asset_ver(name)))
    return page


def esc(s):
    return html.escape(s, quote=True)


def load_pages():
    pages = []
    for fn in sorted(os.listdir(os.path.join(HERE, "pages"))):
        if not fn.endswith(".html"):
            continue
        with open(os.path.join(HERE, "pages", fn), encoding="utf-8") as f:
            first, body = f.read().split("\n", 1)
        meta = json.loads(first)
        meta["body"] = body
        pages.append(meta)
    return pages


def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "</script>"


def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s)).strip()


MENU = [
    ("Tools", [("/#check", "Check a domain"), ("/#h-spf", "SPF record generator"), ("/#h-dkim", "DKIM checker"), ("/#h-dmarc", "DMARC record generator")]),
    ("Learn", [("/spf/", "SPF explained"), ("/dkim/", "DKIM explained"), ("/dmarc/", "DMARC explained")]),
    ("Provider guides", [("/guides/google-workspace/", "Google Workspace"), ("/guides/microsoft-365/", "Microsoft 365"),
                         ("/guides/zoho-mail/", "Zoho Mail"), ("/guides/ovhcloud/", "OVHcloud"), ("/guides/", "All guides")]),
    ("Need help?", [("/setup-service/", "Done-for-you setup, from 49 € / $49")]),
]

BURGER = ('<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path class="l1" d="M3 6h18"/><path class="l2" d="M3 12h18"/>'
          '<path class="l3" d="M3 18h18"/></svg>')


def header(path, nav):
    groups = "".join(
        '<div class="grp"><p>%s</p>%s</div>' % (g, "".join('<a href="%s"%s>%s</a>' % (h, ' aria-current="page"' if h == path else "", t) for h, t in items))
        for g, items in MENU)
    return ('<header class="site"><div class="wrap bar">'
            '<a class="brand" href="/" aria-label="%s home"><img src="/assets/logo.svg" width="32" height="32" alt="">'
            '<span class="wm"><span class="wm-a">spf</span><span class="wm-b">dkim</span><span class="wm-a">dmarc</span><span class="wm-c">.com</span></span></a>'
            '<nav class="desk" aria-label="Main"><ul>%s<li><a class="nav-cta" href="/setup-service/">Get it done</a></li></ul></nav>'
            '<details class="mnav"><summary aria-label="Menu">%s</summary><nav class="mpanel" aria-label="Mobile">%s</nav></details>'
            '</div></header>') % (NAME, nav, BURGER, groups)


def render(p, by_path):
    url = SITE + p["path"]
    seo_title = p.get("seo_title") or p["title"]
    ld = []
    if p["type"] == "home":
        ld.append({"@context": "https://schema.org", "@type": "WebApplication", "name": "SPF, DKIM & DMARC Checker and Record Generator",
                   "url": url, "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any",
                   "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}, "description": p["description"]})
    else:
        crumbs = [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}]
        if p["path"].startswith("/guides/") and p["path"] != "/guides/":
            crumbs.append({"@type": "ListItem", "position": 2, "name": "Guides", "item": SITE + "/guides/"})
        crumbs.append({"@type": "ListItem", "position": len(crumbs) + 1, "name": p.get("crumb", p["title"]), "item": url})
        ld.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": crumbs})
        if p["type"] == "article":
            ld.append({"@context": "https://schema.org", "@type": "TechArticle", "headline": p["title"], "description": p["description"],
                       "url": url, "datePublished": p["published"], "dateModified": p["updated"], "inLanguage": "en",
                       "author": {"@type": "Organization", "name": NAME, "url": SITE + "/about/"},
                       "publisher": {"@type": "Organization", "name": NAME, "url": SITE + "/", "logo": {"@type": "ImageObject", "url": SITE + "/assets/apple-touch-icon.png"}}})
    if p.get("service"):
        ld.append({"@context": "https://schema.org", "@type": "Service", "name": p["title"], "serviceType": "Email authentication setup",
                   "description": p["description"], "url": url, "areaServed": "Worldwide",
                   "provider": {"@type": "Organization", "name": NAME, "url": SITE + "/", "email": "help@spfdkimdmarc.com"},
                   "offers": [{"@type": "Offer", "name": "Fix", "price": "49", "priceCurrency": "EUR"},
                              {"@type": "Offer", "name": "Fix", "price": "49", "priceCurrency": "USD"},
                              {"@type": "Offer", "name": "Complete", "price": "99", "priceCurrency": "EUR"},
                              {"@type": "Offer", "name": "Complete", "price": "99", "priceCurrency": "USD"}]})
    faq = p.get("faq") or []
    if faq:
        ld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": strip_tags(a)}} for q, a in faq]})

    nav = "".join('<li><a href="%s"%s>%s</a></li>' % (h, ' aria-current="page"' if (h == p["path"] or (h != "/" and p["path"].startswith(h))) else "", t)
                  for h, t in NAV)

    body = p["body"].replace("{{cta}}", CTA)
    out = []
    out.append("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">")
    out.append("<title>%s</title>" % esc(seo_title))
    out.append('<meta name="description" content="%s">' % esc(p["description"]))
    out.append('<link rel="canonical" href="%s">' % url)
    if p.get("noindex"):
        out.append('<meta name="robots" content="noindex">')
    out.append('<meta property="og:type" content="%s">' % ("website" if p["type"] == "home" else "article"))
    out.append('<meta property="og:title" content="%s">' % esc(seo_title))
    out.append('<meta property="og:description" content="%s">' % esc(p["description"]))
    out.append('<meta property="og:url" content="%s">' % url)
    out.append('<meta property="og:site_name" content="%s">' % NAME)
    out.append('<meta name="theme-color" content="#0f172a">')
    out.append('<link rel="icon" type="image/svg+xml" href="/assets/logo.svg">')
    out.append('<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">')
    out.append('<meta property="og:image" content="%s/assets/og.png">' % SITE)
    out.append('<meta property="og:image:width" content="1200">')
    out.append('<meta property="og:image:height" content="630">')
    out.append('<meta name="twitter:card" content="summary_large_image">')
    out.append('<link rel="stylesheet" href="/assets/style.css?v=%s">' % CSS_VER)
    out.extend(jsonld(o) for o in ld)
    out.append("</head>\n<body>")
    out.append(header(p["path"], nav))
    out.append('<div class="wrap">')

    if p["type"] == "home":
        out.append(body)
        if faq:
            out.append('<section class="panel faq" aria-labelledby="h-faq"><h2 id="h-faq">Questions</h2>')
            for q, a in faq:
                out.append("<h3>%s</h3><p>%s</p>" % (esc(q), a))
            out.append("</section>")
    else:
        crumb_html = '<a href="/">Home</a>'
        if p["path"].startswith("/guides/") and p["path"] != "/guides/":
            crumb_html += ' / <a href="/guides/">Guides</a>'
        crumb_html += " / " + esc(p.get("crumb", p["title"]))
        out.append('<p class="crumbs">%s</p>' % crumb_html)
        out.append("<article>")
        out.append("<h1>%s</h1>" % esc(p["title"]))
        if p["type"] == "article":
            out.append('<p class="meta">Updated %s</p>' % p["updated"])
        out.append(body)
        if faq:
            out.append('<section class="faq"><h2>Questions</h2>')
            for q, a in faq:
                out.append("<h3>%s</h3><p>%s</p>" % (esc(q), a))
            out.append("</section>")
        rel = [by_path[r] for r in p.get("related", []) if r in by_path]
        if rel:
            out.append('<section class="related"><h2>Related</h2><div class="cards">')
            for r in rel:
                out.append('<a class="card" href="%s"><strong>%s</strong><span>%s</span></a>' % (r["path"], esc(r["title"]), esc(r.get("short", r["description"]))))
            out.append("</div></section>")
        out.append("</article>")

    out.append('<footer><div class="links"><a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/guides/">Setup guides</a><a href="/setup-service/">Setup service</a><a href="mailto:help@spfdkimdmarc.com">Contact</a></div>'
               '<p>Free SPF, DKIM and DMARC checker and record generator. Lookups run in your browser through public DNS-over-HTTPS resolvers; nothing is stored.</p></footer>')
    out.append("</div>")
    out.append("<script>document.querySelectorAll('.mnav').forEach(function(d){d.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){d.open=false;});});document.addEventListener('click',function(e){if(d.open&&!d.contains(e.target))d.open=false;});});</script>")
    if p["type"] == "home":
        with open(os.path.join(HERE, "tool.js"), encoding="utf-8") as f:
            out.append("<script>\n" + f.read() + "</script>")
    out.append("</body>\n</html>\n")
    return "\n".join(out)


def main():
    pages = load_pages()
    by_path = {p["path"]: p for p in pages}
    for p in pages:
        if p["path"] == "/404.html":
            dest = os.path.join(ROOT, "404.html")
        else:
            d = os.path.join(ROOT, p["path"].strip("/"))
            os.makedirs(d, exist_ok=True)
            dest = os.path.join(d, "index.html")
        with open(dest, "w", encoding="utf-8") as f:
            f.write(bust(render(p, by_path)))
    urls = sorted((p for p in pages if not p.get("noindex")), key=lambda p: (p["path"] != "/", p["path"]))
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for p in urls:
            f.write("  <url>\n    <loc>%s%s</loc>\n    <lastmod>%s</lastmod>\n  </url>\n" % (SITE, p["path"], p["updated"]))
        f.write("</urlset>\n")
    print("built %d pages" % len(pages))


if __name__ == "__main__":
    main()
