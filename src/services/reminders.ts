import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as stub from './reminders.stub';

type RemindersModule = typeof stub;

/**
 * У Expo Go модуль expo-notifications на Android дає ERROR у консоль і обмежений;
 * підвантажуємо реалізацію з нотифікаціями лише в dev build / standalone.
 */
/** Expo Go також має appOwnership === 'expo'; інакше все одно підвантажується native і сиплеться ERROR у консоль. */
const useNotificationsNative =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  Constants.appOwnership !== 'expo';

const impl: RemindersModule = useNotificationsNative
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./reminders.native') as RemindersModule)
  : stub;

export const requestReminderPermissions = impl.requestReminderPermissions;
export const syncEventReminder = impl.syncEventReminder;
export const cancelEventReminder = impl.cancelEventReminder;
export const scheduleEveningCheckInReminder = impl.scheduleEveningCheckInReminder;
export const cancelEveningCheckInReminder = impl.cancelEveningCheckInReminder;
