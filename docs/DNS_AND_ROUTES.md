# ArmsWay DNS + Cloudflare Worker Routes

Use this file as the single source of truth for production routing.

## Required DNS records (`armsway.com` zone)

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `@` | `armsway-com.<account>.workers.dev` (or Worker custom domain target) | Proxied |
| CNAME | `www` | `armsway.com` | Proxied |
| MX | `@` | `route1.mx.cloudflare.net` (Priority 10) | N/A |
| MX | `@` | `route2.mx.cloudflare.net` (Priority 20) | N/A |
| MX | `@` | `route3.mx.cloudflare.net` (Priority 30) | N/A |
| TXT | `@` | `v=spf1 include:_spf.mx.cloudflare.net ~all` | N/A |

## Required Worker routes (`armsway-com` script)

Configure in **Workers & Pages → armsway-com → Settings → Triggers**:

- `armsway.com/*`
- `www.armsway.com/*`

## Email Routing

Incoming mail to `*@armsway.com` should be routed to the `armsway-com` Worker in **Email → Email Routing → Routes**.

## Post-deploy checks

Run these checks after deployment:

```bash
curl -I https://armsway.com/
curl -I https://www.armsway.com/
curl -I https://armsway.com/assets/logo-armsway.svg
curl -I https://armsway.com/style.css
```

Expected result: HTTP 200 for all assets and homepage requests.
