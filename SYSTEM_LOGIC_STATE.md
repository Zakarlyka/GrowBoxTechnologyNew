# 🧠 SYSTEM LOGIC & STATE JOURNAL
> **Last Updated:** 2026-01-21  
> **Purpose:** Single source of truth for AI assistants. Read this FIRST before making changes.

---

## 1. 🏗️ CORE ARCHITECTURE

### 1.1 AI Pilot Logic (`useAutoPilot.tsx`)

The AutoPilot system automates device climate control based on plant stage requirements.

**Flow:**
```
Master Plant (is_main: true) 
  → Strain's growing_params.stages[]
    → Extract stage-specific targets (temp, humidity, light_hours, vpd)
      → Apply to device settings
```

**Key Functions:**
- `extractStageTargets(growingParams, stageName)` - Fetches environment data for current stage
- `calculateAutoPilotTargets(stageTarget, currentSettings)` - Converts targets to device settings
- `applyTargets(targets)` - Writes settings to Supabase `devices.settings`

**Stage Normalization:**
```typescript
const stageMap = {
  'seedling', 'seed', 'germination' → 'seedling'
  'vegetation', 'veg', 'grow' → 'vegetation'
  'flowering', 'flower', 'bloom' → 'flowering'
  'flushing', 'flush', 'ripening' → 'flushing'
  'drying', 'dry', 'cure', 'curing' → 'drying'
  'harvested', 'harvest', 'done' → 'harvested'
}
```

**Humidity Calculation Priority:**
1. Explicit `rh` from strain data
2. Average of `humidity_min` and `humidity_max`
3. **VPD-calculated** (if `vpd_target` exists): `RH = 100 * (1 - VPD/SVP)`
4. Stage-based defaults (Seedling: 70%, Veg: 60%, Flower: 45%, Dry: 50%)

**Light Schedule Logic:**
- AI **respects** user-defined `light_start_h` from current settings
- AI **only controls duration** (`light_hours`) based on stage
- `lightEndH = (lightStartH + lightHours) % 24`

**Toast Spam Prevention:**
- Uses `lastAppliedStageRef` to track previous stage
- Only shows toast if stage changed OR first application

---

### 1.2 Plant Lifecycle Logic (`usePlantLifecycle.tsx`)

The lifecycle system is **time-aware** and calculates stages dynamically.

**Core Principle:**
```
Plant Age (days since start_date) → Maps to Stage Timeline → Current Stage
```

**Key Functions:**
- `buildStageDefinitions(growingParams)` - Creates cumulative day ranges per stage
- `calculateStageFromAge(startDate, growingParams)` - Determines current stage from plant age
- `useAutoStageTransition(plants)` - Auto-updates DB when stage should change
- `useStageOverride()` - Manual stage change with date recalculation

**Rollover Logic (CRITICAL):**
```
If totalAge >= stage.endDay → Move to NEXT stage
If totalAge >= lifecycle.totalDays → Mark as 'harvested' (overdue)
```

**Stage Display Info:**
```typescript
{
  stageName: "Flowering",
  dayLabel: "Day 23/47",
  progress: 49, // percentage
  isOverdue: false
}
```

**Manual Override Behavior:**
When user manually changes stage, the system **recalculates start_date** so that:
- Selected stage begins on current day
- All future calculations remain consistent

---

### 1.3 Hardware Protocol (ESP8266 ↔ Supabase)

**Device Settings JSON Schema:**
```typescript
{
  // Climate
  target_temp: number,      // Float, °C
  temp_hyst: number,        // Float, hysteresis
  target_hum: number,       // Int, %
  hum_hyst: number,         // Int
  seasonal_mode: 0|1,       // 0=Winter, 1=Summer
  climate_mode: 0|1,        // 0=OFF, 1=ON
  
  // Lighting
  light_mode: 0|1|2,        // 0=OFF, 1=AUTO, 2=ON
  light_start_h: number,    // Hour (0-23)
  light_start_m: number,    // Minute (0-59)
  light_end_h: number,
  light_end_m: number,
  
  // Irrigation
  pump_mode: 0|1|2,         // 0=AUTO, 1=Manual ON, 2=Manual OFF
  pump_pulse: 0|1,          // 1=Trigger watering
  soil_min: number,         // % threshold
  soil_max: number,
  
  // Ventilation
  vent_mode: 0|1,           // 0=OFF, 1=AUTO
  vent_duration_sec: number,
  vent_interval_sec: number
}
```

**ESP8266 Fetches Settings Via:**
```
Edge Function: get_device_settings(device_uuid) → Returns JSONB
```

---

## 2. ⚡ CRITICAL RULES (DO NOT BREAK)

| Rule | Why |
|------|-----|
| **Drying stage → light_hours: 0** | Total darkness required for proper drying/curing |
| **Master Plant (is_main: true) defines climate** | Only ONE plant controls device automation |
| **First plant on device → auto-set as Master** | Ensures AI mode works immediately |
| **VPD humidity clamped 30%-85%** | Prevents dangerous extremes |
| **AI respects user's light_start_h** | Only controls duration, not wake time |
| **Stage rollover is automatic** | "Day 53/47" must never occur |
| **Harvested plants skip auto-transition** | Prevents zombie updates |
| **Settings keys are CASE-SENSITIVE** | Must match exactly between React and ESP8266 |

---

## 3. 📅 CHANGELOG & DECISIONS (Project History)

### Complete Project Timeline

| Date | Type | Change | Details |
|------|------|--------|---------|
| **2026-01-21** | UX | Clickable Device Cards | Made entire card interactive for better usability |
| **2026-01-21** | Feature | Plant Archive System | Created GrowHistoryPage and "Move to Archive" flow to manage harvested plants |
| **2026-01-21** | Logic | Smart Lifecycle (Time-Aware) | Implemented `usePlantLifecycle` to auto-transition stages based on age (fixed "Day 53/47" overflow) |
| **2026-01-21** | Fix | DeviceControls Logic | Fixed infinite loop in AI Toggle and enabled manual inputs when AI is OFF |
| **2026-01-21** | Logic | VPD-based Humidity Calculation | Dynamic humidity from `vpd_target` when explicit RH is missing |
| **2026-01-21** | Logic | First Plant Auto-Master | New plants auto-set as `is_main: true` if first on device |
| **2026-01-21** | Safety | Drying Stage Defaults | Added `light_hours: 0` and safe temp/humidity for drying |
| **2026-01-21** | UX | Light Schedule Respect | AI only controls duration, respects user's `light_start_h` |
| **2026-01-21** | UX | Toast Spam Prevention | Uses `lastAppliedStageRef` to prevent duplicate notifications |
| **2026-01-20** | Feature | Smart AI Pilot | Created `useAutoPilot` to sync Device Settings with Master Plant Strain Data |
| **2026-01-19** | Feature | AI Strain Import | Implemented Edge Function `parse-strain-text` to convert raw text into JSON Passport |
| **2026-01-15** | Architecture | Digital Twin Setup | Established `devices` table with JSONB settings for ESP8266 sync |
| **2026-01-10** | Database | Scientific Passport | Designed `library_strains` with stage-based environment targets (`optimal_environments`) |
| **2026-01-01** | Init | Project Setup | Initialized React + Supabase Auth + Row Level Security (RLS) |

### Architecture Decisions

| Decision | Alternative Considered | Why Chosen |
|----------|----------------------|------------|
| Stage calculated from start_date | Stored stage + manual increment | Prevents desync, survives app restart |
| Manual override shifts start_date | Only update current_stage | Keeps all calculations consistent |
| VPD calc as fallback, not primary | Always calculate from VPD | Respects explicit breeder recommendations |
| Normalize stages in code | Enum in database | More flexible, handles legacy data |
| Entire device card clickable | Button-only interaction | Better mobile UX, faster navigation |

---

## 4. 🐛 KNOWN ISSUES & TODO

### ✅ Recently Fixed
- [x] Hardcoded Light Schedule (6 AM start) → Now respects user setting
- [x] Missing Drying safety defaults → Added with `light_hours: 0`
- [x] First plant not auto-set as Main → Checks existing plants on add
- [x] VPD not applied to humidity → Dynamic calculation with priority system
- [x] Device cards not clickable → Entire card now navigates to dashboard

### 🔴 Open Issues (Priority Order)

| Priority | Issue | Impact | Suggested Fix |
|----------|-------|--------|---------------|
| **HIGH** | Hardcoded Light Schedule (starts at 6 AM) | Night growers can't set custom wake times | Add `light_start_h` input to DeviceControls |
| **HIGH** | Missing safety defaults for Drying stage | Undefined behavior when entering drying | Enforce `light_hours: 0`, temp: 18°C, RH: 50% |
| HIGH | No validation for conflicting schedules | Multiple plants on same device can fight | Add schedule conflict detection |
| MEDIUM | Archive doesn't preserve journal events | History loses context | Join plant_journal_events in archive query |
| MEDIUM | VPD display missing in Dashboard | User can't see calculated value | Add VPD sensor card |
| LOW | Stage names not i18n | Only English displayed | Add to translation files |
| LOW | No offline indicator for ESP8266 | User unaware of connection loss | Add last_seen check + UI badge |

### 🟡 Technical Debt

- `useAutoPilot.tsx` is 500+ lines → Consider splitting into:
  - `lib/autopilot/calculations.ts` (pure functions)
  - `lib/autopilot/stages.ts` (stage normalization)
  - `hooks/useAutoPilot.tsx` (React hook only)

- `usePlantLifecycle.tsx` is 440 lines → Already flagged for refactor

- Multiple console.log statements → Replace with proper debug flag:
  ```typescript
  const DEBUG_AUTOPILOT = import.meta.env.DEV;
  if (DEBUG_AUTOPILOT) console.log(...)
  ```

---

## 5. 🔗 KEY FILE REFERENCES

| Component | File | Purpose |
|-----------|------|---------|
| AutoPilot Hook | `src/hooks/useAutoPilot.tsx` | AI climate control |
| Lifecycle Hook | `src/hooks/usePlantLifecycle.tsx` | Stage calculations |
| Device Controls | `src/components/DeviceControls.tsx` | Manual control UI |
| Add Plant | `src/components/AddPlantDialog.tsx` | Plant creation + auto-main |
| Strain Types | `src/types/index.ts` | GrowingParams, GrowingStage |
| Supabase Types | `src/integrations/supabase/types.ts` | Database schema (READ-ONLY) |
| Edge Functions | `supabase/functions/` | Device API, confirmations |

---

## 6. 📊 DATA MODEL QUICK REFERENCE

### Master Plant Query
```sql
SELECT p.*, ls.growing_params 
FROM plants p
LEFT JOIN library_strains ls ON p.strain_id = ls.id
WHERE p.device_id = ? AND p.is_main = true
```

### Growing Params Structure (Universal Plant Schema)
```typescript
growing_params: {
  stages: [{
    name: string,           // "Seedling", "Vegetation", etc.
    weeks?: string,         // "2-3" or "4"
    days_duration?: number, // Preferred over weeks
    temp_day?: number,
    temp_night?: number,
    rh?: number,
    humidity_min?: number,
    humidity_max?: number,
    vpd_target?: number,
    vpd_range?: string,     // "0.8-1.1"
    light_hours?: number,
    ppfd?: number,
    ec?: number
  }],
  difficulty_level?: string,
  phenotype?: {...},
  morphology?: {...},
  recommendations?: {...}
}
```

---

> **For AI Assistants:** When making changes, update this file's CHANGELOG section and mark resolved issues as ✅. Keep entries concise but specific.
