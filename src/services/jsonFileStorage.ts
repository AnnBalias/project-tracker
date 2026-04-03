import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export type StorageFileKey = 'profile' | 'events' | 'tasks' | 'transactions';

const STORAGE_PREFIX = '@project_tracker_json:';

const FILE_NAMES: Record<StorageFileKey, string> = {
  profile: 'profile.json',
  events: 'events.json',
  tasks: 'tasks.json',
  transactions: 'transactions.json',
};

function filePath(name: string): string | null {
  const root = FileSystem.documentDirectory;
  return root ? `${root}${name}` : null;
}

export async function readJsonFile<T>(key: StorageFileKey, fallback: T): Promise<T> {
  const filename = FILE_NAMES[key];
  const storageKey = STORAGE_PREFIX + key;
  try {
    const path = filePath(filename);
    if (path) {
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        const raw = await FileSystem.readAsStringAsync(path);
        return JSON.parse(raw) as T;
      }
    }
    const fromStore = await AsyncStorage.getItem(storageKey);
    if (fromStore) return JSON.parse(fromStore) as T;
  } catch {
    /* use fallback */
  }
  return fallback;
}

export async function writeJsonFile<T>(key: StorageFileKey, data: T): Promise<void> {
  const filename = FILE_NAMES[key];
  const storageKey = STORAGE_PREFIX + key;
  const raw = JSON.stringify(data, null, 2);
  try {
    const path = filePath(filename);
    if (path) {
      await FileSystem.writeAsStringAsync(path, raw);
    }
  } catch {
    /* still persist to AsyncStorage */
  }
  await AsyncStorage.setItem(storageKey, raw);
}
