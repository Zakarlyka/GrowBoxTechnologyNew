# 06 — Edge functions (`supabase/functions/`)

| Function | JWT | Purpose | Secrets |
|---|---|---|---|
| telegram-notify | off | Called by DB webhook on `user_notifications` INSERT; sends message to user's Telegram chat | TELEGRAM_BOT_TOKEN, SUPABASE_SERVICE_ROLE_KEY |
| telegram-webhook | off | Telegram bot webhook: /start linking, commands | TELEGRAM_BOT_TOKEN |
| parse-strain-text | off | AI: raw strain text → JSON passport (5 categories) | LOVABLE_API_KEY |
| generate-article | off | AI article generation for knowledge base | LOVABLE_API_KEY |
| confirm-device | on | Device pairing confirmation | service role |

Secrets present (names only): LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL, SUPABASE_JWKS, SUPABASE_PUBLISHABLE_KEYS, SUPABASE_SECRET_KEYS, TELEGRAM_BOT_TOKEN.

Folders `supabase/device-api`, `notification-system`, `generate-qr`, `setup` are outside `functions/` → **not deployed**; kept as reference.

Logs: https://supabase.com/dashboard/project/ychnmaaximnoxvwnzrgs/functions
