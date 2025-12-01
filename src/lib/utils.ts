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
 * Check if current time is within the light schedule
 */
export function isWithinLightSchedule(startH: number, startM: number, endH: number, endM: number): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Schedule crosses midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}
