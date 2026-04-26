# Sofa Configurator Tool

A responsive sofa showroom app with a richer 3D viewer, customer proof workflow, PDF export, and static-site friendly storage.

## What changed

- Modernized the UI shell with a more polished responsive layout.
- Upgraded the 3D viewer with extra camera views, auto orbit, measurement toggles, and a more staged showroom scene.
- Replaced the runtime dependency on local MySQL with a static-friendly Google Apps Script flow.
- Added a browser-storage fallback so the app still works even before the sheet endpoint is configured.

## Run locally

```bash
npm install
npm run dev
```

Default frontend URL:

```text
http://127.0.0.1:5173/
```

## Static storage modes

The app now supports two modes:

1. Browser-only static mode
   No setup required. Saved demos stay in the current browser.
2. Google Sheets sync mode
   Configure `VITE_GOOGLE_SCRIPT_URL` and deploy the included Apps Script as a web app.

## Static deployment

Build output is generated in `dist/`, so this is ready for free static hosts such as:

- Netlify
- Vercel
- Cloudflare Pages
- GitHub Pages

Build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

This repo includes `netlify.toml`, `vercel.json`, and `public/_redirects`, so Netlify and Vercel can detect the static build automatically.

## Google Sheets setup

Use two Google Sheets:

1. Web app DB Sheet
   Stores saved customer/demo designs.
2. Catalog Details Sheet
   Stores products with these columns:

```text
product ID, Model Name, color name, material, technical specs, price, web category, SEO keywords2
```

### Catalog Details Sheet

1. Create a Google Sheet named `catalog_details`.
2. Open `Extensions -> Apps Script`.
3. Paste [google-apps-script/catalog_details_db.gs](google-apps-script/catalog_details_db.gs).
4. Save and run `setupCatalogDetailsSheet` once.
5. Copy this spreadsheet ID from its URL. You will paste it into the web app DB script.

### Web App DB Sheet

1. Create another Google Sheet for saved designs.
2. Open `Extensions -> Apps Script`.
3. Paste [google-apps-script/web_app_db.gs](google-apps-script/web_app_db.gs).
4. Confirm the IDs at the top of the script:

```text
DEMO_SPREADSHEET_ID = 12gsY2kPAVvCvWva0Zu0jo9aXtjMfULCblszilpSqVOY
CATALOG_SPREADSHEET_ID = 1Zelr5BRHPDN8SxzvJV-heZEsDwt6pl3o2SPKACaMwrU
```

5. Save the project.
6. Deploy it as a web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
7. Copy the deployed `/exec` URL.
8. Create a `.env` file in the project root:

```bash
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbw7s3zE_d0khw5uPSegjMo2Mh09Yyleudzus8JU-d8reG17o_sEyTZDkDpRy6BDAH4H/exec
```

9. Restart `npm run dev`.

If you want a starter template, copy [.env.example](.env.example).

## Product catalog columns

The fabric/product catalog sheet must use these headers in row 1:

```text
product ID, Model Name, color name, material, technical specs, price, web category, SEO keywords2
```

To prepare rows from product URLs, add one URL per line to `urls.txt`, then run:

```bash
npm run catalog:template
npm run catalog:scrape
```

`catalog:template` creates a blank CSV with the right columns. `catalog:scrape` tries to read product metadata from the URLs and creates `product-catalog-scraped.csv`.

## Stack

- React with Vite
- Tailwind CSS
- Three.js through React Three Fiber and Drei
- jsPDF
- Optional Google Apps Script + Google Sheets backend

## Main structure

```text
src/
  components/
    ControlPanel.jsx
    SofaViewer.jsx
    HistoryPanel.jsx
    DemoForm.jsx
    DemoLogPanel.jsx
  utils/
    api.js
    sofaEngine.js
  App.jsx
  main.jsx

google-apps-script/
  sofa_demo_web_app.gs
```
