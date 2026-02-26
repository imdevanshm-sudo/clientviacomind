# Deployment Checklist (Vercel + Registrar DNS)

## 1. Project setup
- Import this repo into Vercel.
- Framework preset: `Other`.
- Build command: `npm run build`.
- Output directory: `dist`.

## 2. Domains to attach in Vercel
- `viacomindia.com`
- `www.viacomindia.com`
- `services.viacomindia.com`
- `work.viacomindia.com`
- `contact.viacomindia.com`

## 3. DNS records at registrar
- Apex (`@`) -> Vercel target (A/ALIAS as shown by Vercel)
- `www` -> CNAME to Vercel target
- `services` -> CNAME to Vercel target
- `work` -> CNAME to Vercel target
- `contact` -> CNAME to Vercel target

## 4. Routing behavior
- `services.viacomindia.com/*` rewrites to `/services/`
- `work.viacomindia.com/*` rewrites to `/work/`
- `contact.viacomindia.com/*` rewrites to `/contactus/`

Configured in `vercel.json`.

## 5. Canonical behavior
All pages point canonical URLs to `https://viacomindia.com/...`.

## 6. Launch checks
- `npm run check:routes`
- `npm run build`
- verify core routes return expected page
- verify contact form fallback opens mail/WhatsApp
