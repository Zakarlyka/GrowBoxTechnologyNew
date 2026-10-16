# 15 — Known issues & tech debt

## High
- **Duplicate triggers** → double rows/alerts: `on_auth_user_created_notification` + `on_auth_user_created_notify`; `error_alert_trigger` + `trg_watchdog_error_handler`; `on_device_status_change` + `trg_notify_device_status_change`; three updated_at triggers on devices; two latest-state triggers on device_logs.
- **`cleanup_device_data_trigger` (cascade delete)** still on `devices` — conflicts with archive model when an archived/demo device is hard-deleted (removes sensor history).
- `send_telegram_alert` trigger has hardcoded project URL.
- `check_and_zero_offline_devices` / `mark_devices_offline` need a scheduler (pg_cron) — verify it exists.
- Watchdog uses notification_settings for all devices of a user (no per-device thresholds).

## Medium
- `RemoteControl.tsx` widget shows placeholder numbers.
- Mixed language in DB alert texts.
- Legacy tables `notifications`, `device_controls`, `schedules` overlap newer ones.
- Archive of plants doesn't include journal events.
- Supabase linter warnings: mutable search_path on some functions, leaked-password protection off, public bucket listing on `grow-images`.

## Tech debt
- `DeviceControls.tsx` (~50 KB), `useAutoPilot.tsx`, `usePlantLifecycle.tsx` are too big — split into pure lib functions + hooks.
- Many `console.log`; gate behind `import.meta.env.DEV`.
- No automated tests.
- Outdated docs (DEPLOYMENT_GUIDE.md, MIGRATION_GUIDE.md, MASTER_PROMPT_FULL.md, etc.) — marked deprecated.
