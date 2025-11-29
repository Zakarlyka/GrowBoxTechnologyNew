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
