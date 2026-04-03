import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type CalendarStackParamList = {
  CalendarMonth: undefined;
  CalendarDay: { dateKey: string };
};

export type MainTabParamList = {
  CalendarTab: undefined;
  Tasks: undefined;
  Finance: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: undefined;
};

export type CalendarScreenProps<T extends keyof CalendarStackParamList> =
  NativeStackScreenProps<CalendarStackParamList, T>;

export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
