import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format time to HH:mm format (2-digit hours and minutes)
 */
export function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Calculate photoperiod (day/night hours) from light schedule
 */
export function calculatePhotoperiod(startH: number, endH: number): { dayHours: number; nightHours: number } {
  let dayHours = endH - startH;
  if (dayHours < 0) dayHours += 24;
  const nightHours = 24 - dayHours;
  return { dayHours, nightHours };
}

/**
 * Get current hours/minutes for a given IANA timezone (e.g. "Europe/Kyiv").
 * Falls back to browser-local time if the timezone is invalid or missing.
 */
function getCurrentTimeInTimezone(timezone?: string | null): { hours: number; minutes: number } {
  if (!timezone) {
    const now = new Date();
    return { hours: now.getHours(), minutes: now.getMinutes() };
  }
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const hours = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
    const minutes = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
    return { hours, minutes };
  } catch {
    const now = new Date();
    return { hours: now.getHours(), minutes: now.getMinutes() };
  }
}

/**
 * Check if current time is within the light schedule.
 * Pass the device's IANA timezone (e.g. settings.timezone_iana) so the schedule
 * is evaluated against the GROW SITE's local clock — not the viewer's browser.
 */
export function isWithinLightSchedule(
  startH: number,
  startM: number,
  endH: number,
  endM: number,
  timezone?: string | null
): boolean {
  const { hours, minutes } = getCurrentTimeInTimezone(timezone);
  const currentMinutes = hours * 60 + minutes;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Schedule crosses midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}
