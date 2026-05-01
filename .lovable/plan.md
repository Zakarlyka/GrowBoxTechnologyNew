## Goal

Restore strict separation of concerns:

- **Top info panel (SensorCardsGrid)** — raw telemetry only. Soil reading of `0` must render as `0%`, not "Offline".
- **Irrigation control card (DeviceControls)** — sole owner of the `PUMP_DRY_LOCK` visual state (blinking Lock icon in the title, forced-off / disabled toggle, unlock button). This is already implemented correctly there and will not be touched.

## Changes

### 1. `src/components/SensorCardsGrid.tsx` — remove the soil "Offline" branch

In the `case 'soil':` block (currently ~lines 132–175), delete the `isOffline` logic entirely and render the soil card identically to temperature/humidity:

- Drop the `hasReading` / `isOffline` computation.
- Drop the `offlineTooltip` string and the conditional inside `SmartHelp`.
- Drop the `Unplug` icon branch — always render the green `Sprout` icon on the standard `bg-green-500/10 border-green-500/30` background.
- Value formatting becomes:
  - `soilMoisture !== null && soilMoisture !== undefined ? `${soilMoisture.toFixed(0)}%` : '-- %'`
  - So a real `0` reading shows `0%`; only missing telemetry shows `-- %`.
- Remove the now-unused `Unplug` import from the `lucide-react` import line.

No other props, ordering, drag-and-drop behaviour, or storage keys change.

### 2. `src/components/DeviceControls.tsx` — no changes required

Already correct (verified):

- `isPumpDryLock = deviceError === 'PUMP_DRY_LOCK'` (line 80).
- Irrigation card title swaps `Droplets` for an animate-pulse `Lock` icon and shows `controls.pumpLocked` label when locked.
- Card border uses `border-destructive/50 animate-pulse`.
- Main pump `Switch` is forced off via `checked={... !isPumpDryLock && pumpMode === 1}`.
- "Water Now" button disabled while locked; an "Unlock Pump" button is rendered.

No edits needed here — the lock visuals are already scoped to this card only.

### 3. i18n

Leave the previously added `sensorTooltips.soilOffline` and `sensors.offline` keys in the locale files as inert; harmless and avoids a second migration. (Can be cleaned up in a later sweep.)

## Out of scope

- No changes to `useDeviceError`, watchdog, DB, or any other component.
- No change to temperature/humidity/light/VPD cards.
- No change to pump-lock behaviour in `DeviceControls.tsx`.

## Verification

- Soil card shows `0%` (green styling) when `last_soil_moisture = 0`.
- Soil card shows `-- %` only when telemetry is missing/null.
- With `device_logs.error = 'PUMP_DRY_LOCK'`, only the Irrigation card in DeviceControls shows the Lock icon, pulsing border, disabled toggle, and Unlock button. The top sensor grid is visually unchanged.
