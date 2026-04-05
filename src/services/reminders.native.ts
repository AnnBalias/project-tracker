import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import type { CalendarEvent } from '../types';

const EVENING_ID_KEY = '@project_tracker_evening_notif_id';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestReminderPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function syncEventReminder(event: CalendarEvent): Promise<CalendarEvent> {
  let next = { ...event };
  if (event.reminderNotificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(event.reminderNotificationId);
    } catch {
      /* ignore */
    }
    next = { ...next, reminderNotificationId: undefined };
  }
  const at = new Date(event.startTime);
  at.setMinutes(at.getMinutes() - 10);
  if (at.getTime() <= Date.now()) {
    return next;
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Нагадування: подія',
      body: event.title,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
    },
  });
  return { ...next, reminderNotificationId: id };
}

export async function cancelEventReminder(event: CalendarEvent): Promise<CalendarEvent> {
  if (!event.reminderNotificationId) return event;
  try {
    await Notifications.cancelScheduledNotificationAsync(event.reminderNotificationId);
  } catch {
    /* ignore */
  }
  return { ...event, reminderNotificationId: undefined };
}

export async function scheduleEveningCheckInReminder(): Promise<void> {
  const prev = await AsyncStorage.getItem(EVENING_ID_KEY);
  if (prev) {
    try {
      await Notifications.cancelScheduledNotificationAsync(prev);
    } catch {
      /* ignore */
    }
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Вечірній чек-ін',
      body: 'Опиши день і настрій у календарі.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
  await AsyncStorage.setItem(EVENING_ID_KEY, id);
}

/** Скасувати вечірнє нагадування та прибрати збережений id */
export async function cancelEveningCheckInReminder(): Promise<void> {
  const prev = await AsyncStorage.getItem(EVENING_ID_KEY);
  if (prev) {
    try {
      await Notifications.cancelScheduledNotificationAsync(prev);
    } catch {
      /* ignore */
    }
  }
  await AsyncStorage.removeItem(EVENING_ID_KEY);
}
