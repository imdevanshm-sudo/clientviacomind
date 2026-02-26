# Viacom India Replacement Site (Static + API-Later Ready)

This project is a full static replacement for the old Viacom India site with legacy route parity and future API-ready lead forms.

## Route Coverage

### Primary pages
- `/`
- `/services/`
- `/work/`
- `/quote/`

### Legacy parity pages
- `/about-us/`
- `/contactus/`
- `/creators/`
- `/vi-network/`
- `/privacy-policy/`
- `/terms-and-condition/brand-terms-and-conditions/`
- `/terms-and-condition/creator-term-conditions/`
- `/works/`

## Content/Data Contracts
- Shared content model: `assets/data/site-content.json`
- Legacy route map: `assets/data/legacy-routes.json`
- Shared content hydrator: `assets/js/site-content.js`

## Lead Form (API-later)
- Environment config: `assets/js/env.js`
- Transport interface and implementations: `assets/js/lead-transport.js`
- Form controller: `assets/js/lead-form.js`

Current mode is fallback transport (mailto + WhatsApp). To switch to API later:
1. Set `window.__VIACOM_ENV__.leadMode = "api"`.
2. Set `apiBaseUrl` and `leadEndpoint`.
3. Keep payload schema unchanged (`LeadPayload`).

## Local Development
```bash
npm run dev
```
Open `http://localhost:5173`.

## Build / Preview
```bash
npm run build
npm run preview
```
Deploy the generated `dist/` directory.

## QA Commands
```bash
npm run check:routes
npm run check:external
```

## Vercel Subdomain Routing
`vercel.json` includes host-based rewrites:
- `services.viacomindia.com` -> `/services/`
- `work.viacomindia.com` -> `/work/`
- `contact.viacomindia.com` -> `/contactus/`

Canonical URLs remain on `https://viacomindia.com`.

Detailed launch checklist: `DEPLOYMENT.md`.
