# 10 — Notifications

## Sensor alert flow (e.g. dry soil)
1. ESP8266 inserts into `device_logs` / `sensor_data`.
2. `watchdog_sensor_alerts` finds device (id or token), reads thresholds (`notification_settings` → `devices.settings` → defaults), checks 15-min debounce, inserts into `user_notifications`.
3. Bell (`NotificationCenter.tsx`) reads `user_notifications` (realtime/poll).
4. DB webhook trigger `send_telegram_alert` → edge function `telegram-notify` → Telegram chat from `telegram_users`.

## Other sources
- Pump error_code → `watchdog_error_handler` (30-min debounce).
- online→offline → `notify_device_status_change`.
- Signup → welcome notification.

## Test button
`NotificationSettings.tsx` inserts a real row into `user_notifications` — goes through the same bell + Telegram path.

## Telegram linking
User opens bot → `/start` → `telegram-webhook` stores chat in `telegram_users`.

## Known problems
Duplicate triggers cause double notifications; see 15-known-issues.md.
