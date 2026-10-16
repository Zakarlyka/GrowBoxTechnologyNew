# 02 — Architecture

```text
 ESP8266 controller ──(HTTPS JSON telemetry)──> Supabase (device_logs / sensor_data)
        ^                                            │ triggers
        │ polls settings (RPC get_device_settings)   ├─> devices.last_* cache, status=online
        │                                            ├─> watchdog_sensor_alerts -> user_notifications
        │                                            │        └─ DB webhook -> edge fn telegram-notify -> Telegram
 React SPA (Vite) <──(supabase-js, realtime, polling)┘
        │ writes devices.settings (JSONB) — the "digital twin"
        └─> Edge functions: parse-strain-text (AI), generate-article (AI), confirm-device, telegram-webhook
```

## Key ideas
- **Digital twin:** UI writes desired state into `devices.settings`; the device reads it and acts autonomously.
- **Silent polling:** telemetry refetches must never show loading spinners or reset scroll (React Query `placeholderData`/stable keys).
- **Context via URL:** the selected device is `?device=<uuid>` — single source of truth.
- **Offline detection:** UI compares `last_seen_at` to now every second; DB function `check_and_zero_offline_devices` marks stale devices offline.
- **AI:** Lovable AI Gateway (`LOVABLE_API_KEY`) used by edge functions for strain parsing and article generation.
