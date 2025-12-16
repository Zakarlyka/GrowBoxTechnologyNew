/**
 * Налаштування пристрою (конфігурація).
 * Це те, що зберігається в колонці `settings` (jsonb) в таблиці `devices`.
 * 🔄 PROTOCOL v1.0 - Single Source of Truth
 */
export interface DeviceSettings {
  // 🌡️ Клімат (Climate)
  climate_mode: number;       // 0: OFF (Disabled), 1: ON (Active)
  target_temp: number;        // Цільова температура (Float)
  temp_hyst: number;          // Гістерезис температури (Float)
  target_hum: number;         // Цільова вологість (Int)
  hum_hyst: number;           // Гістерезис вологості (Int)
  seasonal_mode: number;      // 0: Зима/Обігрів, 1: Літо/Охолодження
  
  // 💡 Освітлення (Light)
  light_mode: number;         // 0: Manual OFF, 1: AUTO/Schedule, 2: Manual ON
  light_start_h: number;      // Година початку (0-23)
  light_start_m: number;      // Хвилини початку (0-59)
  light_end_h: number;        // Година кінця (0-23)
  light_end_m: number;        // Хвилини кінця (0-59)
  
  // 💧 Полив (Irrigation/Pump)
  pump_mode: number;          // 0: AUTO (Сенсор), 1: Manual ON, 2: Manual OFF
  pump_pulse?: number;        // 1: Trigger Manual Watering (10s), 0: Idle
  soil_min: number;           // Мінімальна вологість ґрунту (%)
  soil_max: number;           // Максимальна вологість ґрунту (%)
  
  // 🌬️ Вентиляція (Ventilation)
  vent_mode: number;          // 0: OFF, 1: AUTO (Клімат + Таймер)
  vent_duration_sec: number;  // Тривалість роботи (секунди)
  vent_interval_sec: number;  // Інтервал паузи (секунди)
  
  // 🤖 AI Features (Global AI Pilot)
  ai_mode?: number;           // 0: User Control, 1: AI Pilot (Premium)
  
  // Deprecated (для зворотної сумісності)
  is_ac_installed?: boolean;
  vent_work_minutes?: number;
  vent_pause_minutes?: number;
  min_soil_moisture?: number;
  max_soil_moisture?: number;
  irrigation_duration_sec?: number;
  irrigation_pause_min?: number;
  light_start_time?: string;
  light_end_time?: string;
}

/**
 * Стан ручного керування (реальний час).
 * Зберігається в таблиці `device_controls`.
 */
export interface DeviceControl {
  control_name: string;
  value: boolean;
  intensity: number;
}

// =============================================================================
// 🧬 LABORATORY PASSPORT - Strain Library Types
// =============================================================================

/**
 * Genetics percentage breakdown
 */
export interface GeneticMix {
  sativa: number;    // e.g. 60
  indica: number;    // e.g. 30
  ruderalis: number; // e.g. 10
}

/**
 * Lab data for strain passport
 */
export interface LabData {
  genetics_mix: GeneticMix;
  height: { indoor: string; outdoor: string }; // e.g. "60-100 cm"
  cbd: string;              // e.g. "< 1%"
  lifecycle_total: string;  // e.g. "60-75 days"
  risks: string[];          // e.g. ["Mold", "Odor"]
  training: string;         // e.g. "LST Only"
}

/**
 * Timeline phase for growth stages
 */
export interface TimelinePhase {
  phase: string;      // e.g. "Vegetation"
  duration: string;   // e.g. "Week 3-4"
  desc: string;       // Description
}

/**
 * Environment settings for each phase (legacy presets format)
 */
export interface EnvironmentPhase {
  temp_day: number;   // Day temperature °C
  temp_night: number; // Night temperature °C
  rh: number;         // Humidity %
  vpd: number;        // kPa target
  ppfd: number;       // µmol/m²/s
  ec: number;         // Electrical Conductivity
  light_h: number;    // Hours of light
}

/**
 * Complete strain presets structure (legacy format)
 */
export interface StrainPresets {
  lab_data?: LabData;
  timeline?: TimelinePhase[];
  environment_schedule?: Record<'seedling' | 'veg' | 'bloom' | 'flush', EnvironmentPhase>;
  nutrient_schedule?: NutrientWeek[];
}

/**
 * Nutrient schedule week entry
 */
export interface NutrientWeek {
  week: number;
  grow: number;
  bloom: number;
  micro?: number;
  cal_mag?: number;
}

// =============================================================================
// 🧬 NEW GROWING_PARAMS JSONB Structure (v3.0 - Dynamic Stages)
// =============================================================================

/**
 * Stage entry for growing_params - dynamic, not hardcoded
 */
export interface GrowingStage {
  name: string;           // "Seedling", "Vegetation", "Pre-flowering", "Flowering", "Drying"
  weeks?: string;         // e.g. "1-2" - optional duration
  temp: [number, number]; // [night, day] or [min, max] temperature
  humidity: number;       // RH %
  vpd: string;            // e.g. "0.6-0.8" kPa
  ppfd: string;           // e.g. "150-300" µmol/m²/s
  ec: string;             // e.g. "0.6-0.8" mS/cm
  light_hours?: number;   // Optional light cycle hours
}

/**
 * Phenotype characteristics
 */
export interface GrowingPhenotype {
  height_indoor?: string;   // e.g. "60-100 cm"
  height_outdoor?: string;  // e.g. "100-150 cm"
  aroma?: string;           // e.g. "Spicy", "Fruity"
  structure?: string;       // e.g. "Bushy", "Tall"
  color?: string;           // e.g. "Green with purple"
}

/**
 * Growing recommendations
 */
export interface GrowingRecommendations {
  ph_soil?: string;       // e.g. "6.0-7.0"
  ph_hydro?: string;      // e.g. "5.5-6.5"
  training?: string;      // e.g. "LST, SCROG"
  notes?: string;         // Additional tips
}

/**
 * Post-harvest instructions (drying/curing)
 */
export interface PostHarvest {
  drying_temp?: number;   // °C
  drying_humidity?: number; // RH %
  drying_days?: string;   // e.g. "7-14"
  curing_notes?: string;
}

/**
 * Complete growing_params JSONB structure (v3.0)
 */
export interface GrowingParams {
  stages: GrowingStage[];
  risks?: string[];                     // e.g. ["Mold", "Odor", "Heat Stress"]
  phenotype?: GrowingPhenotype;
  recommendations?: GrowingRecommendations;
  post_harvest?: PostHarvest;
}

// Legacy types for backward compatibility
export interface ClimateScheduleEntry {
  stage: string;
  weeks: string;
  temp_day: number;
  temp_night: number;
  humidity: number;
  vpd: string;
}

export interface GrowingLighting {
  seedling_ppfd: string;
  veg_ppfd: string;
  bloom_ppfd: string;
}

export interface GrowingNutrition {
  veg_ec: string;
  bloom_ec: string;
}

export interface GrowingGeneralInfo {
  height_indoor: string;
  smell_level: string;
}

/**
 * Full library strain record
 */
export interface LibraryStrainFull {
  id: number;
  name: string;
  breeder: string | null;
  type: string | null;
  genotype: string | null;           // NEW: e.g. "Indica-dominant Hybrid"
  thc_percent: number | null;        // NEW: numeric THC %
  flowering_days: number | null;
  photo_url: string | null;
  description: string | null;
  thc_content: string | null;        // Legacy string THC
  genetics: string | null;
  difficulty: string | null;
  yield_indoor: string | null;
  presets: StrainPresets | null;     // Legacy presets
  growing_params: GrowingParams | null; // NEW: structured growing data
  is_public: boolean | null;
  user_id: string;
}
