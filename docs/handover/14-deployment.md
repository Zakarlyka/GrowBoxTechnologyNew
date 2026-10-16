# 14 — Deployment

- Frontend: Lovable → Publish (https://local-github-magic.lovable.app). Edge functions deploy automatically from `supabase/functions/`.
- Backend: external Supabase `ychnmaaximnoxvwnzrgs`. Schema changes only through migrations.
- Env: `.env` has VITE_SUPABASE_URL / PUBLISHABLE_KEY / PROJECT_ID (public values). Private secrets live in Supabase Edge Function secrets, never in code.
- Telegram: bot webhook must point to `https://ychnmaaximnoxvwnzrgs.supabase.co/functions/v1/telegram-webhook`.
- Moving to a new Supabase project: export schema + data, recreate secrets, update the hardcoded URL in the `send_telegram_alert` trigger, update client.ts, re-set Telegram webhook, reflash firmware with new URL.
- Legacy configs (Dockerfile, netlify.toml, vercel.json, nginx) are not used by Lovable hosting.
