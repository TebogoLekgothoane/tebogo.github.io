# Personal Website

Static, fast portfolio site built with **HTML + CSS + a tiny bit of JS**.

## Run locally

- **Option A (quickest)**: double-click `index.html` to open in your browser.
- **Option B (recommended)**: use a local server (avoids caching issues):
  - VS Code: install “Live Server”, then “Open with Live Server”
  - Or run:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Customize

- **Name/title**: edit `index.html` (`<title>`, hero, footer)
- **Email**: replace `your.email@example.com` in:
  - `index.html`
  - `script.js` (`mailto` variable)
- **Links**: add your real GitHub/LinkedIn URLs in `index.html`
- **Projects**: update the cards in the `#projects` section (`index.html`)
- **Theme**: colors live in `styles.css` under `:root` (dark) and `html[data-theme="light"]` (light)

## Deploy

This works great on GitHub Pages / Netlify / Vercel (as a static site). Just deploy the repo root.

