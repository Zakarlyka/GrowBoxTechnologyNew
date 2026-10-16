# 04 — Project structure

```text
src/
  App.tsx                 routes (see 09-features.md)
  pages/                  one file per route
  components/             feature components; ui/ = shadcn primitives
    Dashboard.tsx         cockpit for one device
    DeviceControls.tsx    light/climate/pump/vent control cards + global save bar (largest file)
    SensorCardsGrid.tsx   top telemetry cards (always raw values, e.g. "0%")
    ClockTimezoneWidget.tsx header clock + device timezone picker (IANA + POSIX)
    NotificationSettings.tsx thresholds + Telegram + test button
    notifications/NotificationCenter.tsx bell
    laboratory/           plants, calculators (VPD, nutrients, water, electricity), timeline
    admin/                strain/article/user management
    billing/              plans & payments UI
  hooks/
    useDevices.tsx        list, smart delete (demo=hard, else archive), restore
    useDeviceControls.tsx settings read/write with silent polling
    useAutoPilot.tsx      AI mode: strain stage -> device targets
    usePlantLifecycle.tsx stage from plant age, auto transitions
    useDeviceError.tsx    PUMP_DRY_LOCK / NO_WATER detection
    useAuth.tsx, useUserRole.tsx, usePremiumStatus.tsx, useSensorData.tsx, useDeviceLogs.tsx
  lib/                    utils (timezone-aware light schedule), vpd.ts, validations.ts, imageUtils.ts
  i18n/locales/           uk.json en.json ru.json
  integrations/supabase/  client.ts + types.ts (AUTO-GENERATED, do not edit)
  types/                  shared domain types
supabase/
  functions/              deployed edge functions
  device-api/, notification-system/, generate-qr/, setup/  legacy, NOT deployed (outside functions/)
  migrations/             managed by tooling only
SYSTEM_LOGIC_STATE.md     deep logic notes (AutoPilot, lifecycle)
ESP8266_INTEGRATION.md    firmware integration notes
```
