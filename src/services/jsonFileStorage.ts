import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Локальне сховище без мережі:
 * 1) AsyncStorage (`@project_tracker_json:<key>`) — основне джерело, працює на iOS/Android/Web.
 * 2) Файли в `documentDirectory` (`*.json`) — дзеркало для експорту/резерву.
 *
 * Жодних HTTP / серверів — усе лише на пристрої.
 */
export type StorageFileKey =
  | 'profile'
  | 'events'
  | 'tasks'
  | 'transactions'
  | 'challenges'
  | 'dayOffs'
  | 'notes'
  | 'moodLogs'
  | 'achievements'
  | 'focusSessions';

export const STORAGE_PREFIX = '@project_tracker_json:';

const FILE_NAMES: Record<StorageFileKey, string> = {
  profile: 'profile.json',
  events: 'events.json',
  tasks: 'tasks.json',
  transactions: 'transactions.json',
  challenges: 'challenges.json',
  dayOffs: 'dayOffs.json',
  notes: 'notes.json',
  moodLogs: 'moodLogs.json',
  achievements: 'achievements.json',
  focusSessions: 'focusSessions.json',
};

/** Для дебагу / документації — усі ключі доменних JSON у AsyncStorage */
export const LOCAL_JSON_DATA_KEYS: StorageFileKey[] = [
  'profile',
  'events',
  'tasks',
  'transactions',
  'challenges',
  'dayOffs',
  'notes',
  'moodLogs',
  'achievements',
  'focusSessions',
];

function filePath(name: string): string | null {
  const root = FileSystem.documentDirectory;
  return root ? `${root}${name}` : null;
}

/** Відновити файл зі вмісту AsyncStorage, якщо файл ще не створений */
async function ensureFileMirror(key: StorageFileKey, raw: string): Promise<void> {
  const filename = FILE_NAMES[key];
  const path = filePath(filename);
  if (!path) return;
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      await FileSystem.writeAsStringAsync(path, raw);
    }
  } catch {
    /* файлове дзеркало необов’язкове */
  }
}

export async function readJsonFile<T>(key: StorageFileKey, fallback: T): Promise<T> {
  const filename = FILE_NAMES[key];
  const storageKey = STORAGE_PREFIX + key;

  try {
    const fromStore = await AsyncStorage.getItem(storageKey);
    if (fromStore) {
      try {
        const parsed = JSON.parse(fromStore) as T;
        void ensureFileMirror(key, fromStore);
        return parsed;
      } catch {
        /* пошкоджений рядок у AS — пробуємо файл */
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const path = filePath(filename);
    if (path) {
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        const raw = await FileSystem.readAsStringAsync(path);
        const parsed = JSON.parse(raw) as T;
        try {
          await AsyncStorage.setItem(storageKey, raw);
        } catch {
          /* залишаємо хоча б парсинг з файлу */
        }
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }

  return fallback;
}

export async function writeJsonFile<T>(key: StorageFileKey, data: T): Promise<void> {
  const filename = FILE_NAMES[key];
  const storageKey = STORAGE_PREFIX + key;
  const raw = JSON.stringify(data, null, 2);
  await AsyncStorage.setItem(storageKey, raw);
  try {
    const path = filePath(filename);
    if (path) {
      await FileSystem.writeAsStringAsync(path, raw);
    }
  } catch {
    /* дані вже в AsyncStorage */
  }
}
