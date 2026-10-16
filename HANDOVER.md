# HANDOVER — Agro Hogwards (Grow Box) — READ ME FIRST

Smart grow-box platform: a React web app that monitors and controls ESP8266-based grow boxes (temperature, humidity, soil moisture, light, pump, ventilation), manages plants through their lifecycle, and sends alerts (in-app bell + Telegram).

## Quick start
1. `npm install` (or `bun install`), then `npm run dev` → http://localhost:8080
2. Backend is an **external Supabase project** `ychnmaaximnoxvwnzrgs` (URL and anon key in `src/integrations/supabase/client.ts`).
3. Edge functions live in `supabase/functions/*` (Deno).

## Reading order
1. `docs/handover/01-overview.md` — product
2. `docs/handover/02-architecture.md` — how pieces connect
3. `docs/handover/08-business-rules.md` — rules you MUST NOT break
4. `docs/handover/05-database.md` + `07-hardware-protocol.md`
5. `docs/handover/15-known-issues.md` + `16-roadmap.md` — what to do next
6. Give `docs/handover/18-ai-prompt.md` to any AI assistant as its first message.

## 10 most important rules
1. Never hard-delete real devices — archive via `devices.lifecycle = 'archived'`. Only `is_demo` devices are hard-deleted.
2. `devices.status` = online/offline (DB-managed). `devices.lifecycle` = active/archived (UI-managed). Never mix them.
3. Devices have two IDs: `id` (UUID row) and `device_id` (hardware token text). SQL must match both: `id::text = X OR device_id = X`.
4. Hardware `device_id`: only letters, digits, `-`, `_`. No dots.
5. `devices.settings` JSON keys are case-sensitive and shared with ESP8266 firmware.
6. Only one Master Plant (`is_main = true`) per user drives AI climate mode.
7. Drying stage = 0 light hours (total darkness).
8. Remote reboot: set `reboot_cmd: true`, wait 6 s, set back to `false`.
9. Never edit `src/integrations/supabase/types.ts` (auto-generated).
10. Never translate: Agro Hogwards, Online, Offline, Wi-Fi, Master Plant, VPD.

## Access to transfer separately (not in repo)
- Lovable project (Share → invite) — project ID `0d56a03e-3ecf-408a-95a7-d964bcb4549f`
- Supabase project owner access (ref `ychnmaaximnoxvwnzrgs`)
- Telegram bot (BotFather ownership) — token stored as secret `TELEGRAM_BOT_TOKEN`
- GitHub repo (if connected), domain, any payment accounts
- Published URL: https://local-github-magic.lovable.app
