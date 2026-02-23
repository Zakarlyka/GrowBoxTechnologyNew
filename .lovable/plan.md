

## Device Reboot Functionality

### Overview
Add a "Reboot Device" button with confirmation dialog to the DeviceControls dashboard. The reboot uses a `reboot_cmd` flag in the device's `settings` JSON column (same pattern as `pump_pulse`).

### Changes

#### 1. `src/components/DeviceControls.tsx`

**Add state and handler:**
- Add `isRebooting` state (`useState(false)`)
- Add `rebootDialogOpen` state (`useState(false)`)
- Add `handleReboot` async function:
  1. Set `isRebooting = true`
  2. Call `saveSettings({ reboot_cmd: true })`
  3. Show toast: "Sending reboot signal..."
  4. `setTimeout` 6 seconds, then `saveSettings({ reboot_cmd: false })`, set `isRebooting = false`, show success toast: "Device is rebooting. Back online in ~15 seconds."

**Add UI elements (after the AI Mode card, before the 4-card grid):**
- Add a "Reboot Device" button in the device header area (red/destructive style, with `RotateCcw` or `Power` icon)
- Add an `AlertDialog` confirmation modal:
  - Title: "Reboot Device?"
  - Description: "Are you sure you want to reboot the controller? The device will be offline for approximately 15 seconds."
  - Cancel / Confirm buttons
  - Confirm triggers `handleReboot()`
- Button is disabled while `isRebooting` is true (shows spinner/loading state)

**Add import:**
- Import `RotateCcw` from `lucide-react`

#### 2. No Database Migration Needed
The `reboot_cmd` field lives inside the existing `devices.settings` JSONB column, just like `pump_pulse`. No schema changes required.

### Technical Details

```text
User clicks "Reboot" -> AlertDialog opens
  -> Confirms -> saveSettings({ reboot_cmd: true })
  -> Toast: "Sending reboot signal..."
  -> setTimeout(6000)
  -> saveSettings({ reboot_cmd: false })
  -> Toast: "Device is rebooting..."
  -> isRebooting = false
```

The ESP8266 polls `get_device_settings()` and will see `reboot_cmd: true` in the settings JSON, triggering `ESP.restart()`. The 6-second auto-reset prevents bootloop on reconnect.
