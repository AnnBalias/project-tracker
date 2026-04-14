import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { CompositeScreenProps } from '@react-navigation/native';

export type CalendarStackParamList = {
  CalendarMonth: undefined;
  CalendarDay: { dateKey: string };
};

export type TasksStackParamList = {
  TasksMain: undefined;
  Focus: { projectId: string; taskId: string };
};

export type NotesStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProjectLevels: undefined;
  ArchivedProjects: undefined;
  TaskTypesSettings: { showArchived?: boolean } | undefined;
  ChallengesSettings: { showArchived?: boolean } | undefined;
  ExpenseCategoriesSettings: { showArchived?: boolean } | undefined;
};

export type DrawerParamList = {
  Calendar: undefined;
  Tasks: undefined;
  Finance: undefined;
  Analytics: undefined;
  Profile: undefined;
  Notes: undefined;
};

export type RootStackParamList = {
  Main: undefined;
};

export type CalendarScreenProps<T extends keyof CalendarStackParamList> =
  NativeStackScreenProps<CalendarStackParamList, T>;

export type TasksScreenProps<T extends keyof TasksStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<TasksStackParamList, T>,
  DrawerScreenProps<DrawerParamList>
>;

export type NotesScreenProps<T extends keyof NotesStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<NotesStackParamList, T>,
  DrawerScreenProps<DrawerParamList>
>;

export type ProfileNavProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  DrawerScreenProps<DrawerParamList>
>;
