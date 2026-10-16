# 17 — Changelog (key decisions)

| When | Change |
|---|---|
| 2026-01 | Project init, Supabase auth + RLS, digital twin `devices.settings`, strain passport, AI strain import, AutoPilot, lifecycle automation, plant archive |
| 2026 | Silent polling (no scroll jumps); header clock widget with IANA+POSIX timezone (DST fix) |
| 2026 | Pump toggle: 1 = smart auto, 0 = off; PUMP_DRY_LOCK UI in Irrigation card only; pump_time_sec / soak_time_sec |
| 2026 | Tier 1: timezone-aware light schedule, QR dialog split (Setup QR / Device ID), RemoteControlPage on real devices |
| 2026 | `lifecycle` column (active/archived) separated from `status`; smart delete; archive merged into My Devices (standalone /archive removed) |
| 2026 | Security fixes: telegram_users insert, nutrient_schedules read, user_roles realtime |
| 2026 | Notification system rebuilt: triggers installed, watchdog with thresholds + 15-min debounce, robust id/token matching, real test notification insert |
| 2026-10 | Handover documentation package |

More detail: `SYSTEM_LOGIC_STATE.md`.
