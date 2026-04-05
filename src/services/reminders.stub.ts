import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarEvent } from '../types';

const EVENING_ID_KEY = '@project_tracker_evening_notif_id';

/** Expo Go: локальні нагадування не підвантажуємо (див. SDK 53+ обмеження). */
export async function requestReminderPermissions(): Promise<boolean> {
  return false;
}

export async function syncEventReminder(event: CalendarEvent): Promise<CalendarEvent> {
  return { ...event, reminderNotificationId: undefined };
}

export async function cancelEventReminder(event: CalendarEvent): Promise<CalendarEvent> {
  return { ...event, reminderNotificationId: undefined };
}

export async function scheduleEveningCheckInReminder(): Promise<void> {
  await AsyncStorage.removeItem(EVENING_ID_KEY);
}

export async function cancelEveningCheckInReminder(): Promise<void> {
  await AsyncStorage.removeItem(EVENING_ID_KEY);
}
