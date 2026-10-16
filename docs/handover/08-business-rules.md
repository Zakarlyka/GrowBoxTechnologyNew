# 08 — Business rules (DO NOT BREAK)

| Rule | Why |
|---|---|
| Devices are archived (`lifecycle='archived'`), never hard-deleted unless `is_demo` or deleted from archive | Keeps telemetry history |
| `status` (online/offline) is DB-owned; `lifecycle` is UI-owned | Triggers overwrite status |
| Match devices by `id::text` OR `device_id` in SQL | Firmware may send either |
| Hardware device_id: alphanumeric, `-`, `_`, no dots | Firmware/URL parsing |
| Only one Master Plant per user (`is_main`) | It drives AI climate |
| First plant on a device becomes Master automatically | AI works immediately |
| AI mode ON → all control toggles shown checked + disabled | No manual override of AI |
| AI respects user's `light_start_h`, controls only duration | Night growers |
| Drying stage: 0 light hours, ~18°C, ~50% RH | Proper curing |
| VPD-derived humidity clamped 30–85% | Safety |
| Stage auto-rollover by age; overdue → harvested | Never show "Day 53/47" |
| Manual stage override recalculates start_date | Consistent timeline |
| Harvested plants leave active monitoring | No zombie updates |
| Remote reboot: true → wait 6 s → false | Avoid boot loops |
| Top sensor cards always show raw values (0% is valid) | Lock state belongs to Irrigation card only |
| Alerts debounced (15 min sensors, 30 min pump) | No spam |
| Numeric inputs allow 0, strip leading zeros | UX |
| Plant name empty → strain name | Naming |
| Auth state change → `window.location.replace` | Clear cache, avoid hang |
| Device context in URL `?device=ID` | Single source of truth |
| Timezone: store POSIX (hardware) + IANA (UI, DST-aware via Intl) | Correct clock |
| Polling must be silent (no loading states on refetch) | No scroll jumps |
| Roles only in `user_roles`, checked server-side | Security |
