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
  seasonal_mode: number; // 0: Зима/Обігрів, 1: Літо/Кондиціонер
  vent_mode: number; // 0: Вимкнено, 1: Увімкнено
  vent_work_minutes: number;
  vent_pause_minutes: number;
  vent_interval_sec: number; // Інтервал провітрювання (секунди)
  vent_duration_sec: number; // Тривалість провітрювання (секунди)
  min_soil_moisture: number;
  max_soil_moisture: number;
  irrigation_duration_sec: number;
  irrigation_pause_min: number;
  light_start_h: number; // Година початку освітлення
  light_start_m: number; // Хвилини початку освітлення
  light_end_h: number; // Година кінця освітлення
  light_end_m: number; // Хвилини кінця освітлення
  // Deprecated (залишено для сумісності):
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
