# armsway.com — Cloudflare Worker Static Site

Production site for ArmsWay™ (medical BP cuff sleeve), deployed on Cloudflare Workers with static assets.

## What this repository now includes

- Responsive landing page (`index.html` + `style.css`).
- Shared SVG brand assets and UI icons in `assets/`.
- `dist/` build-ready static bundle for Cloudflare asset delivery.
- Worker config (`wrangler.jsonc`) routing both `armsway.com/*` and `www.armsway.com/*`.

## Local preview

```bash
python3 -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html`
- `http://localhost:8000/dist/index.html`

## Cloudflare deployment

1. Authenticate wrangler:

```bash
npx wrangler login
```

2. Deploy worker assets:

```bash
npx wrangler deploy
```

3. In Cloudflare dashboard, confirm Worker routes:
   - `armsway.com/*`
   - `www.armsway.com/*`

4. Ensure DNS in `armsway.com` zone:
   - `@` proxied record for Worker/custom domain
   - `www` proxied CNAME to `armsway.com`

## Inquiry form target

The quote form submits to:

`https://armsway.com-private.goldshore.workers.dev/inquiry`

If you change intake infrastructure, update the `<form action="...">` in both `index.html` and `dist/index.html`.
