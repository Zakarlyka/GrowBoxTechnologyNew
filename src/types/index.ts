/**
 * Налаштування пристрою (конфігурація).
 * Це те, що зберігається в колонці `settings` (jsonb) в таблиці `devices`.
 */
export interface DeviceSettings {
  target_temp: number;
  temp_hyst: number;
  target_hum: number;
  hum_hyst: number;
  is_ac_installed: boolean;
  vent_work_minutes: number;
  vent_pause_minutes: number;
  min_soil_moisture: number;
  max_soil_moisture: number;
  irrigation_duration_sec: number;
  irrigation_pause_min: number;
  light_start_time: string;
  light_end_time: string;
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
