# GitSylva website

The public landing page for GitSylva — a single, self-contained `index.html`
(inline CSS/JS, Google Fonts via CDN) plus the images in `assets/`.

## Preview locally

Just open `index.html` in a browser, or serve the folder:

```bash
npx serve site
```

## Deploy (GitHub Pages)

The page uses only relative paths, so it can be served from any subpath.
Two common options:

- **Project subfolder:** in *Settings → Pages*, deploy from a branch and set
  the folder to `/site` (or copy `site/` to `/docs`).
- **`gh-pages` branch:** push the contents of `site/` to the root of a
  `gh-pages` branch.

Assets:

- `assets/screenshot.png` — app screenshot shown in the hero.
- `assets/icon.png` — the clean **S** app icon (256×256), for social/favicon.
