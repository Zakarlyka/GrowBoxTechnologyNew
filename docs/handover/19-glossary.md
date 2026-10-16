# 19 — Glossary

- **Grow box / device** — physical ESP8266 controller with sensors & relays.
- **device_id (token)** — hardware identifier text; **id** — DB UUID.
- **Digital twin** — `devices.settings` JSON mirroring desired hardware state.
- **Master Plant** — the plant whose strain drives AI mode on a device.
- **AI mode / AutoPilot** — automatic targets from strain stage data.
- **Stage** — seedling, vegetation, flowering, flushing, drying, harvested.
- **VPD** — vapour pressure deficit (kPa); used to derive target humidity.
- **Hysteresis** — dead-band around a target to avoid relay chatter.
- **Pump time / soak time** — pump work seconds / pause for water to soak in.
- **PUMP_DRY_LOCK** — firmware safety lock when reservoir empty.
- **Lifecycle** — device active/archived (UI); **status** — online/offline (hardware).
- **Watchdog** — DB trigger generating alerts from telemetry.
- **POSIX TZ / IANA TZ** — timezone formats for firmware / browser.
- **Demo device** — simulated device (`is_demo`) for testing.
