# ArmsWay DNS + Cloudflare Worker Routes

Use this file as the single source of truth for production routing.

## Required DNS records (`armsway.com` zone)

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `@` | `armsway.<account>.workers.dev` (or Worker custom domain target) | Proxied |
| CNAME | `www` | `armsway.com` | Proxied |

## Required Worker routes (`armsway` script)

Configure in **Workers & Pages → armsway → Settings → Triggers**:

- `armsway.com/*`
- `www.armsway.com/*`

These routes are also declared in `wrangler.jsonc` so `npx wrangler deploy` keeps config in source control.

## Post-deploy checks

Run these checks after deployment:

```bash
curl -I https://armsway.com/
curl -I https://www.armsway.com/
curl -I https://armsway.com/assets/logo-armsway.svg
curl -I https://armsway.com/style.css
```

Expected result: HTTP 200 for all assets and homepage requests.

## If website appears unstyled

1. Confirm `style.css` exists in `dist/` and root.
2. Confirm SVG files exist in `dist/assets/`.
3. Purge Cloudflare cache for `armsway.com`.
4. Re-run `npx wrangler deploy`.
