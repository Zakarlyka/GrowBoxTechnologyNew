# AGENTS.md — architecture rules

- Start with HANDOVER.md and docs/handover/; keep them updated after changes — they are the handover source of truth.
- Device archiving uses `devices.lifecycle`, never `status` — status is overwritten by telemetry triggers.
- SQL device lookups match `id::text` OR `device_id` — firmware may send either identifier.
- `devices.settings` JSONB is the firmware contract — keys are never renamed without a firmware update.
- Telemetry polling is silent (no loading UI on refetch) — prevents scroll jumps.
- Selected device lives in the `?device=` URL param — single source of truth for dashboard context.
- Alerts are produced only by DB triggers inserting into `user_notifications` — bell and Telegram both consume that table.
- Timezone stored as POSIX (firmware) plus IANA (UI) — UI time must be DST-aware.
