import { z } from 'zod';

// Device validation schemas
export const deviceSchema = z.object({
  device_id: z.string()
    .min(1, 'Device ID is required')
    .max(50, 'Device ID must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Device ID can only contain letters, numbers, dashes and underscores'),
  name: z.string()
    .min(1, 'Device name is required')
    .max(100, 'Device name must be less than 100 characters')
    .trim(),
  type: z.enum(['grow_box', 'greenhouse', 'sensor', 'actuator'], {
    errorMap: () => ({ message: 'Invalid device type' }),
  }),
  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .trim()
    .optional(),
});

// Sensor data validation
export const sensorDataSchema = z.object({
  temperature: z.number()
    .min(-50, 'Temperature must be above -50°C')
    .max(100, 'Temperature must be below 100°C')
    .optional(),
  humidity: z.number()
    .min(0, 'Humidity must be at least 0%')
    .max(100, 'Humidity must be at most 100%')
    .optional(),
  soil_moisture: z.number()
    .min(0, 'Soil moisture must be at least 0%')
    .max(100, 'Soil moisture must be at most 100%')
    .optional(),
  ph_level: z.number()
    .min(0, 'pH must be at least 0')
    .max(14, 'pH must be at most 14')
    .optional(),
  ec_level: z.number()
    .min(0, 'EC level must be positive')
    .max(10000, 'EC level too high')
    .optional(),
  light_level: z.number()
    .min(0, 'Light level must be positive')
    .max(100000, 'Light level too high')
    .optional(),
  water_level: z.number()
    .min(0, 'Water level must be positive')
    .max(100, 'Water level must be at most 100%')
    .optional(),
});

// Device control validation
export const deviceControlSchema = z.object({
  control_name: z.string()
    .min(1, 'Control name is required')
    .max(50, 'Control name too long'),
  value: z.boolean().optional(),
  intensity: z.number()
    .min(0, 'Intensity must be at least 0')
    .max(100, 'Intensity must be at most 100')
    .optional(),
});

// Device settings validation
export const deviceSettingsSchema = z.object({
  temperature_min: z.number()
    .min(-50)
    .max(100)
    .optional(),
  temperature_max: z.number()
    .min(-50)
    .max(100)
    .optional(),
  humidity_min: z.number()
    .min(0)
    .max(100)
    .optional(),
  humidity_max: z.number()
    .min(0)
    .max(100)
    .optional(),
  light_schedule: z.object({
    enabled: z.boolean(),
    start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  }).optional(),
  watering_schedule: z.object({
    enabled: z.boolean(),
    interval_hours: z.number().min(1).max(168),
    duration_minutes: z.number().min(1).max(60),
  }).optional(),
}).refine(
  (data) => {
    if (data.temperature_min !== undefined && data.temperature_max !== undefined) {
      return data.temperature_min < data.temperature_max;
    }
    return true;
  },
  { message: 'Temperature min must be less than max', path: ['temperature_max'] }
).refine(
  (data) => {
    if (data.humidity_min !== undefined && data.humidity_max !== undefined) {
      return data.humidity_min < data.humidity_max;
    }
    return true;
  },
  { message: 'Humidity min must be less than max', path: ['humidity_max'] }
);

// Profile validation
export const profileSchema = z.object({
  full_name: z.string()
    .max(100, 'Full name must be less than 100 characters')
    .trim()
    .optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
});

// Notification settings validation
export const notificationSettingsSchema = z.object({
  email_enabled: z.boolean(),
  push_enabled: z.boolean(),
  temperature_min: z.number().min(-50).max(100).optional(),
  temperature_max: z.number().min(-50).max(100).optional(),
  humidity_min: z.number().min(0).max(100).optional(),
  humidity_max: z.number().min(0).max(100).optional(),
});
