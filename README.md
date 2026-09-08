Armsway production uses Worker armsway-com in Gold Shore Labs, serving armsway.com and www.armsway.com.

The canonical static bundle is public/; src/index.ts serves assets and APIs. Run npm ci, node --test tests/worker.test.mjs and npx wrangler deploy --dry-run before deployment. Python browser tests serve public/ on port 8000.

CACHE_KV and AUDIT_DB already exist. The inquiry queue and sending integration are not provisioned. Contact submissions return 503 with a direct-email fallback until configured. No email test or database migration was performed.

On 2026-09-08 the existing redirect rule was restricted to HTTP to stop HTTPS self-redirects, and the www custom domain was restored. Previous Worker rollback version: 0935b31c-cf39-42e4-81bc-d1463c151905 (health placeholder).
