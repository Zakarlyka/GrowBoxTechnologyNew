# 16 — Roadmap

## Next (cleanup)
1. Drop duplicate triggers; drop/replace cascade-delete trigger.
2. Schedule offline check with pg_cron (every minute).
3. Wire RemoteControl widget to real telemetry.
4. Unify alert language (store i18n keys, translate in UI/Telegram).

## Tier 2 (from multi-persona audit)
- Plant status ribbon at top of cockpit (stage, day X/Y, next action).
- Per-device alert thresholds.
- Schedule conflict detection between plants on one device.
- VPD card on Dashboard.
- Stage names localized.

## Tier 3
- Multi-zone / fleet view for greenhouses, bulk actions.
- Data export (CSV), reports.
- Firmware OTA, calibration wizard.
- Billing enforcement by plan limits.
- Tests (unit for lifecycle/autopilot math, e2e for pairing & alerts).
