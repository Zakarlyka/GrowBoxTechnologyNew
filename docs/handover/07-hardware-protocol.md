# 07 — Hardware protocol (ESP8266 ↔ Supabase)

## Telemetry (device → DB)
Inserted into `device_logs` / `sensor_data` with `device_id` = hardware token (or row UUID):
```json
{ "device_id": "growbox_001", "temp": 24.5, "hum": 61, "soil_moisture": 42, "light_level": 80, "error_code": "" }
```
Error codes: `PUMP_DRY_LOCK`, `NO_WATER`.

## Settings (DB → device) — `devices.settings` JSONB, keys case-sensitive
| Key | Values |
|---|---|
| target_temp, temp_hyst | °C float |
| target_hum, hum_hyst | % int |
| seasonal_mode | 0 winter (heater), 1 summer (exhaust) |
| climate_mode | 0 off, 1 on |
| light_mode | 0 off, 1 auto, 2 on |
| light_start_h/m, light_end_h/m | schedule in device local time |
| pump_mode | **0 = pump disabled, 1 = smart auto** (UI toggle ON/OFF) |
| pump_pulse | 1 = one-shot watering |
| pump_time_sec, soak_time_sec | work / soak durations |
| soil_min, soil_max | % thresholds |
| vent_mode, vent_duration_sec, vent_interval_sec | ventilation |
| timezone | POSIX TZ string for firmware, e.g. `EET-2EEST,M3.5.0/3,M10.5.0/4` |
| timezone_iana | IANA name for UI, e.g. `Europe/Kyiv` |
| reboot_cmd | true → reboot (reset to false after 6 s) |
| ai_mode | merged in by `get_device_settings` |

Firmware reads via RPC `get_device_settings(device_uuid)`.

## Pump dry lock
Hardware sets `PUMP_DRY_LOCK` when reservoir is empty. UI (Irrigation card only) shows blinking lock and forces toggle OFF. User toggles ON → writes `pump_mode: 1` → firmware clears lock.
