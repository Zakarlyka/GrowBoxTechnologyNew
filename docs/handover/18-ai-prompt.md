# 18 — Prompt for any AI assistant (copy everything below)

```
You are continuing development of "Agro Hogwards" (Grow Box): a React 18 + Vite + TypeScript + Tailwind + shadcn/ui SPA with an external Supabase backend (Postgres, RLS, realtime, Deno edge functions) controlling ESP8266 grow boxes.

Before any change, read: HANDOVER.md, docs/handover/08-business-rules.md, 05-database.md, 07-hardware-protocol.md, 15-known-issues.md, AGENTS.md.

Hard rules:
- Never hard-delete real devices; archive with devices.lifecycle='archived'. Only is_demo devices are hard-deleted.
- devices.status (online/offline) is owned by DB triggers; don't write it from UI.
- In SQL match devices by (id::text = X OR device_id = X).
- devices.settings keys are a contract with firmware: case-sensitive, don't rename.
- pump_mode: 1 = smart auto, 0 = off. Reboot: reboot_cmd true -> wait 6s -> false.
- One Master Plant (is_main) per user; drying stage = 0 light hours.
- Do not edit src/integrations/supabase/types.ts. Schema changes only via migrations with GRANTs + RLS.
- Roles only in user_roles; never trust client-side admin checks.
- Polling must be silent (no loading state on refetch).
- Use semantic Tailwind tokens, no hardcoded colors. Touch targets >= 44px.
- UI text via i18n (uk, en, ru). Never translate: Agro Hogwards, Online, Offline, Wi-Fi, Master Plant, VPD.
- Keep date-fns at 3.6.0. No external placeholder images. Secrets only in Supabase secrets.

Work style: small surgical changes, explain impact, update docs/handover/17-changelog.md and 15-known-issues.md after changes.
```
