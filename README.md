# GitSylva website

The public landing page for GitSylva. Exported from the design tool as two
self-contained pages:

- **`index.html`** — the landing page (self-contained: inline CSS/JS/assets).
- **`promo.html`** — the animated promo ("video"), embedded by `index.html`
  in an `<iframe>`. It loads React and web fonts from public CDNs (unpkg,
  Google Fonts) at runtime, so it needs an internet connection to animate.

Both files must live in the **same folder** — `index.html` references
`promo.html` by a relative path.

## Preview locally

Serve the folder (opening `index.html` via `file://` blocks the iframe):

```bash
npx serve site
```

## Deploy (GitHub Pages)

Published to **https://diogo1306.github.io/GitSylva/** from the `gh-pages`
branch (the contents of `site/` pushed to the branch root):

```bash
git subtree push --prefix=site origin gh-pages
```
