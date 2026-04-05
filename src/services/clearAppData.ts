import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AchievementsState, ChallengesState, Profile } from '../types';
import { clearFocusTimer } from './focusTimerStorage';
import { writeJsonFile } from './jsonFileStorage';
import { cancelEveningCheckInReminder } from './reminders';

const emptyProfile: Profile = {
  projects: [],
  expenseCategories: [],
  taskTypes: [],
};

const emptyChallenges: ChallengesState = {
  challenges: [],
  completions: [],
  streaks: {},
};

const emptyAchievements: AchievementsState = {
  unlocked: [],
  globalStreak: { current: 0, best: 0 },
};

const THEME_KEY = '@project_tracker_theme_dark';

/** Повне очищення доменних даних і службових ключів (локально). */
export async function clearAllPersistedAppData(): Promise<void> {
  await Promise.all([
    writeJsonFile('profile', emptyProfile),
    writeJsonFile('events', []),
    writeJsonFile('tasks', []),
    writeJsonFile('transactions', []),
    writeJsonFile('challenges', emptyChallenges),
    writeJsonFile('dayOffs', []),
    writeJsonFile('notes', []),
    writeJsonFile('moodLogs', []),
    writeJsonFile('achievements', emptyAchievements),
    writeJsonFile('focusSessions', []),
  ]);
  await clearFocusTimer();
  await cancelEveningCheckInReminder();
  await AsyncStorage.removeItem(THEME_KEY);
}
