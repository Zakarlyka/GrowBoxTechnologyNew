# 05 — Database (Supabase Postgres)

All tables have RLS enabled; user data is scoped by `auth.uid() = user_id`.

## Tables
| Table | Purpose |
|---|---|
| profiles | user profile (user_id, email, full_name). Email/user_id changes blocked by trigger |
| user_roles | `app_role` enum: user / admin / developer / superadmin. Roles ONLY here |
| devices | grow boxes: `id` uuid, `device_id` hardware token, `name`, `status` online/offline, `lifecycle` active/archived, `is_demo`, `settings` jsonb, `ai_mode`, `last_temp/last_hum/last_soil_moisture`, `last_seen_at` |
| device_logs | raw telemetry from hardware (temp, hum, soil_moisture, error_code …) |
| sensor_data | normalized telemetry (validated device id) |
| device_controls, device_schedules, schedules | legacy/auxiliary control & schedule rows |
| device_groups, device_group_members | grouping |
| device_pairing_temp, pending_devices | pairing tokens (cleaned after 1h) |
| plants | user plants: strain_id, device_id, is_main (Master), status, stage, start_date |
| plant_journal_events | plant diary |
| library_strains | scientific strain passport with `growing_params.stages[]` |
| strains, custom_strains, nutrient_schedules | strain catalogs |
| articles | knowledge base |
| notifications (legacy), user_notifications (active bell feed) | alerts |
| notification_settings | per-user thresholds (temperature/humidity min/max, soil_min), Telegram flags |
| telegram_users | chat_id link to user |
| plans, subscriptions | billing; new users get `free` plan |

## Key functions
- `get_device_settings(device_uuid)` — SECURITY DEFINER, returns settings + ai_mode for firmware.
- `secure_register_device(...)` — inserts device for current user.
- `is_admin()`, `has_role(...)`, `get_my_role()`, `admin_get_all_users()`.
- `watchdog_sensor_alerts()` — thresholds from notification_settings → device settings → defaults (18–30°C, 40–80%, soil 20%); 15-min debounce per alert title.
- `watchdog_error_handler()` — pump error alert, 30-min debounce.
- `check_and_zero_offline_devices()` — marks devices offline after 45 s silence.
- `cascade_delete_device_data()` — BEFORE DELETE on devices (see known issues).

## Triggers (summary)
- auth.users INSERT → handle_new_user, handle_new_user_subscription, handle_new_user_notification (**installed twice → duplicate welcome**).
- device_logs INSERT → update_device_latest_state, update_device_on_new_log, watchdog_sensor_alerts, watchdog_error_handler (**error handler installed twice**).
- sensor_data INSERT → validate, update_device_latest_state, watchdog_sensor_alerts.
- devices UPDATE → notify_device_status_change (**installed twice**), updated_at (x2).
- user_notifications INSERT → HTTP webhook to `telegram-notify` (URL hardcoded).
- plants INSERT/UPDATE → reset_main_plant (single Master Plant).

Get the live state any time:
```sql
select event_object_table, trigger_name, action_statement from information_schema.triggers order by 1;
```
