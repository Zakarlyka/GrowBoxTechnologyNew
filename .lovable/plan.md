
# Execution Plan — UI/UX Architecture Fixes

## Audit summary (what's already done vs. still broken)

After reading `src/components/DeviceControls.tsx`, `src/components/ClockTimezoneWidget.tsx`, `src/hooks/useDeviceControls.tsx`, `src/hooks/useDevices.tsx`, `src/hooks/useDeviceError.tsx` and `src/components/Dashboard.tsx`:

| # | Area | Status |
|---|------|--------|
| 1 | Silent polling | Mostly done (realtime + `silent` flag in `useDeviceControls`). One small hardening item left. |
| 2 | Timezone widget | Mostly done (Intl + IANA, no green bg, Check icon). Active item is keyed by POSIX, should be IANA. |
| 3 | Irrigation `pump_mode` / `pump_pulse` / new timing fields | Logic done. **Critical JSX nesting bug** breaks the Irrigation card layout. |
| 4 | `PUMP_DRY_LOCK` UI | Done (Lock icon, animate-pulse, red header, toggle forced OFF + disabled when locked, Unlock button present). |

The plan below addresses only the remaining real gaps.

---

## 1. Fix Irrigation card JSX nesting bug (critical)

In `src/components/DeviceControls.tsx` around lines 933–1026, the "Advanced (pump_time_sec / soak_time_sec)" block was inserted **inside** the `soilMax` input wrapper. The structure currently is:

```text
<div soilMax block>
  <SmartHelp>
    <div className="relative flex-1">
      <Input soilMax />
      <span>%</span>
      [Advanced toggle Button]      ← wrongly nested
      [Advanced grid w/ pump_time_sec, soak_time_sec]  ← wrongly nested
    </div>          ← closing tags out of order
  </SmartHelp>
</div>
```

Result: the advanced section renders inside the soilMax input's relative container, breaking responsiveness on mobile/desktop.

**Fix:** Restructure so the advanced toggle + grid are siblings of the soilMin/soilMax blocks, not children of the soilMax input wrapper:

```text
<div className="flex-1 space-y-3 ...">
  <div soilMin block />
  <div soilMax block />        ← properly closed
  <Button advanced toggle />   ← sibling
  {showAdvancedSoil && (
    <div grid pump_time_sec / soak_time_sec />
  )}
</div>
```

No new fields needed (`pumpTimeSec` / `soakTimeSec` state, load-from-DB, and save patch are already wired in `useEffect` and `handleSave`). This is purely a JSX cleanup edit.

## 2. Tighten silent polling (no remounts on telemetry refresh)

Current state is good: `useDeviceControls` uses Supabase realtime (no `setInterval` re-fetch) with a `silent` param that bypasses the global `loading` spinner. `Dashboard` only uses 1s `setInterval` to recompute the "Online/Offline" badge from `last_seen_at` (pure in-place state change, no remount).

Two small hardening tweaks:

- **Stabilize `useDeviceControls` identity:** the `isInitialLoad` ref is created via `useState({ current: true })[0]` which is fine, but `fetchData` depends on it as a dep — replace with a plain `useRef(true)` so `fetchData`'s identity doesn't depend on a stable-but-confusing object reference. This prevents the realtime subscription from being torn down and re-created if anything upstream changes.
- **Guard the realtime handler:** when realtime fires, call `fetchData(true)` (already silent). Confirm no `setLoading(true)` path is ever hit on realtime updates by removing the `if (!silent) setLoading(true)` branch entirely after initial mount — drive `loading` only off the first fetch via the ref.

Effect: scroll position and focus inside inputs stay intact when telemetry arrives.

## 3. Timezone widget — key active item by IANA

In `src/components/ClockTimezoneWidget.tsx`:

- The widget is already DST-correct (uses `Intl.DateTimeFormat` with IANA names like `Europe/Kyiv`).
- Selected highlight already uses subtle `bg-accent` + `Check` icon (no `bg-green-*`).
- However the **active-item check** is done by comparing `selectedPosix === tz.posix`. Since multiple cities share the same POSIX string (e.g., Kyiv, Helsinki, Bucharest, Athens all share `EET-2EEST,...`), **multiple rows highlight as selected**. This is the "stuck on multiple items" symptom.

**Fix:**
- Track `selectedIana` in state (in addition to `selectedPosix`, which is what gets persisted to the device for the ESP).
- On load from DB, resolve the IANA from the persisted POSIX by also reading a stored `timezone_iana` field if present, else fall back to the first match.
- Persist BOTH on selection: `settings.timezone = posix` (hardware) and `settings.timezone_iana = iana` (UI source of truth).
- Compare `selectedIana === tz.iana` for the highlight + Check icon, so exactly one row is ever active.

## 4. Irrigation logic & lock UI — already correct, verify only

No code changes needed; the plan will only re-verify after the JSX fix in step 1:

- Toggle ON → `setPumpMode(1)` and patched on save as `pump_mode: 1`. ✓
- Toggle OFF → `pump_mode: 0`. ✓
- "Water Now" → `saveSettings({ pump_pulse: 1 })`, then 2 s `setTimeout` → `saveSettings({ pump_pulse: 0 })`. ✓
- `error === 'PUMP_DRY_LOCK'` (from `useDeviceError`) → header shows `Lock` icon with `text-destructive animate-pulse`, title swaps to `t('controls.pumpLocked')` ("Lock 🔒"), Switch `checked` is forced false and the "Water Now" button is disabled. The Switch is currently NOT `disabled` when locked (only when `isAiActive`) — turning it ON is the intentional unlock path. We will add `aria-disabled` styling but keep it interactive so the unlock flow keeps working.

---

## Files to edit

- `src/components/DeviceControls.tsx` — fix JSX nesting in the Irrigation card (lines ~933–1026).
- `src/hooks/useDeviceControls.tsx` — switch `isInitialLoad` to `useRef`, remove the post-initial `setLoading(true)` path so realtime never triggers a spinner.
- `src/components/ClockTimezoneWidget.tsx` — add `selectedIana` state, persist `timezone_iana` alongside `timezone`, compare highlight by IANA.

## Out of scope

- No DB schema changes (all fields live in `devices.settings` JSONB).
- No edge function changes.
- No changes to `useDevices`, `Dashboard`, or `Header`.
