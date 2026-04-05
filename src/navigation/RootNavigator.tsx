import React from 'react';
import { Pressable } from 'react-native';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  NavigationContainer,
  DefaultTheme as NavDefaultTheme,
  DarkTheme as NavDarkTheme,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../store/ThemeContext';
import { parseDateKey } from '../utils/dateTime';
import { DrawerMenuButton } from './DrawerMenuButton';
import type {
  CalendarStackParamList,
  DrawerParamList,
  NotesStackParamList,
  ProfileStackParamList,
  TasksStackParamList,
} from './types';
import { CalendarMonthScreen } from '../screens/CalendarMonthScreen';
import { CalendarDayScreen } from '../screens/CalendarDayScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { FocusScreen } from '../screens/FocusScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProjectLevelsScreen } from '../screens/ProjectLevelsScreen';
import { NotesListScreen } from '../screens/NotesListScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';
import { ArchivedProjectsScreen } from '../screens/ArchivedProjectsScreen';
import { TaskTypesSettingsScreen } from '../screens/TaskTypesSettingsScreen';
import { ChallengesSettingsScreen } from '../screens/ChallengesSettingsScreen';
import { ExpenseCategoriesSettingsScreen } from '../screens/ExpenseCategoriesSettingsScreen';

const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
const TasksStack = createNativeStackNavigator<TasksStackParamList>();
const NotesStack = createNativeStackNavigator<NotesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const FinanceStack = createNativeStackNavigator<{ FinanceMain: undefined }>();
const AnalyticsStack = createNativeStackNavigator<{ AnalyticsMain: undefined }>();
const Drawer = createDrawerNavigator<DrawerParamList>();

function calendarDayTitle(dateKey: string) {
  try {
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    return cap(format(parseDateKey(dateKey), 'EEEE, d MMM', { locale: uk }));
  } catch {
    return 'День';
  }
}

/** Без глобального headerLeft — інакше DrawerToggleButton підміняє «Назад» і ламає нативний хедер вкладених екранів. */
function stackHeaderBase(t: ReturnType<typeof useAppTheme>) {
  return {
    headerStyle: { backgroundColor: t.colors.card },
    headerTintColor: t.colors.accent,
    headerTitleStyle: { color: t.colors.text },
    // Відступ під статусбар: SafeAreaView у App; drawer не додає другий insets.top (див. DrawerContentWrapper).
    statusBarStyle: (t.dark ? 'light' : 'dark') as 'light' | 'dark',
  };
}

/** DrawerToggleButton у native-stack не бачить drawer (useNavigation = stack) — лише DrawerMenuButton. */
function stackDrawerMenuButton(
  t: ReturnType<typeof useAppTheme>,
  navigation: NavigationProp<ParamListBase>,
) {
  return {
    headerLeft: () => (
      <DrawerMenuButton navigation={navigation} color={t.colors.text} />
    ),
  };
}

function stackBackHeader(t: ReturnType<typeof useAppTheme>, navigation: { goBack: () => void }) {
  return {
    headerLeft: () => (
      <Pressable
        onPress={() => navigation.goBack()}
        style={{ marginLeft: 8, padding: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Назад"
      >
        <Ionicons name="chevron-back" size={28} color={t.colors.accent} />
      </Pressable>
    ),
  };
}

function CalendarFlow() {
  const t = useAppTheme();
  const h = stackHeaderBase(t);
  return (
    <CalendarStack.Navigator
      screenOptions={{
        ...h,
        contentStyle: { backgroundColor: t.colors.background },
      }}
    >
      <CalendarStack.Screen
        name="CalendarMonth"
        component={CalendarMonthScreen}
        options={({ navigation }) => ({
          title: 'Календар',
          ...stackDrawerMenuButton(t, navigation),
        })}
      />
      <CalendarStack.Screen
        name="CalendarDay"
        component={CalendarDayScreen}
        options={({ navigation, route }) => ({
          title: calendarDayTitle(route.params.dateKey),
          headerBackTitleVisible: false,
          ...stackBackHeader(t, navigation),
          headerRight: () => (
            <DrawerMenuButton navigation={navigation} color={t.colors.text} />
          ),
        })}
      />
    </CalendarStack.Navigator>
  );
}

function TasksFlow() {
  const t = useAppTheme();
  const h = stackHeaderBase(t);
  return (
    <TasksStack.Navigator
      screenOptions={{
        ...h,
        contentStyle: { backgroundColor: t.colors.background },
      }}
    >
      <TasksStack.Screen
        name="TasksMain"
        component={TasksScreen}
        options={({ navigation }) => ({
          title: 'Задачі',
          ...stackDrawerMenuButton(t, navigation),
        })}
      />
      <TasksStack.Screen
        name="Focus"
        component={FocusScreen}
        options={({ navigation }) => ({
          title: 'Фокус',
          headerBackTitleVisible: false,
          ...stackBackHeader(t, navigation),
          headerRight: () => (
            <DrawerMenuButton navigation={navigation} color={t.colors.text} />
          ),
        })}
      />
    </TasksStack.Navigator>
  );
}

function FinanceFlow() {
  const t = useAppTheme();
  const h = stackHeaderBase(t);
  return (
    <FinanceStack.Navigator
      screenOptions={{
        ...h,
        contentStyle: { backgroundColor: t.colors.background },
      }}
    >
      <FinanceStack.Screen
        name="FinanceMain"
        component={FinanceScreen}
        options={({ navigation }) => ({
          title: 'Фінанси',
          ...stackDrawerMenuButton(t, navigation),
        })}
      />
    </FinanceStack.Navigator>
  );
}

function AnalyticsFlow() {
  const t = useAppTheme();
  const h = stackHeaderBase(t);
  return (
    <AnalyticsStack.Navigator
      screenOptions={{
        ...h,
        contentStyle: { backgroundColor: t.colors.background },
      }}
    >
      <AnalyticsStack.Screen
        name="AnalyticsMain"
        component={AnalyticsScreen}
        options={({ navigation }) => ({
          title: 'Аналітика',
          ...stackDrawerMenuButton(t, navigation),
        })}
      />
    </AnalyticsStack.Navigator>
  );
}

function NotesFlow() {
  const t = useAppTheme();
  const h = stackHeaderBase(t);
  return (
    <NotesStack.Navigator
      screenOptions={{
        ...h,
        contentStyle: { backgroundColor: t.colors.background },
      }}
    >
      <NotesStack.Screen
        name="NotesList"
        component={NotesListScreen}
        options={({ navigation }) => ({
          title: 'Нотатки',
          ...stackDrawerMenuButton(t, navigation),
        })}
      />
      <NotesStack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={({ navigation }) => ({
          title: 'Нотатка',
          headerBackTitleVisible: false,
          ...stackBackHeader(t, navigation),
          headerRight: () => (
            <DrawerMenuButton navigation={navigation} color={t.colors.text} />
          ),
        })}
      />
    </NotesStack.Navigator>
  );
}

function ProfileFlow() {
  const t = useAppTheme();
  const h = stackHeaderBase(t);
  return (
    <ProfileStack.Navigator
      screenOptions={{
        ...h,
        contentStyle: { backgroundColor: t.colors.background },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'Профіль',
          ...stackDrawerMenuButton(t, navigation),
        })}
      />
      <ProfileStack.Screen
        name="ProjectLevels"
        component={ProjectLevelsScreen}
        options={({ navigation }) => ({
          title: 'Рівні за проєктами',
          headerBackTitleVisible: false,
          ...stackBackHeader(t, navigation),
          headerRight: () => (
            <DrawerMenuButton navigation={navigation} color={t.colors.text} />
          ),
        })}
      />
      <ProfileStack.Screen
        name="ArchivedProjects"
        component={ArchivedProjectsScreen}
        options={({ navigation }) => ({
          title: 'Архів проєктів',
          headerBackTitleVisible: false,
          ...stackBackHeader(t, navigation),
          headerRight: () => (
            <DrawerMenuButton navigation={navigation} color={t.colors.text} />
          ),
        })}
      />
      <ProfileStack.Screen
        name="TaskTypesSettings"
        component={TaskTypesSettingsScreen}
        options={({ navigation }) => ({
          title: 'Типи задач',
          headerBackTitleVisible: false,
          ...stackBackHeader(t, navigation),
          headerRight: () => (
            <DrawerMenuButton navigation={navigation} color={t.colors.text} />
          ),
        })}
      />
      <ProfileStack.Screen
        name="ChallengesSettings"
        component={ChallengesSettingsScreen}
        options={({ navigation }) => ({
          title: 'Челенджі',
          headerBackTitleVisible: false,
          ...stackBackHeader(t, navigation),
          headerRight: () => (
            <DrawerMenuButton navigation={navigation} color={t.colors.text} />
          ),
        })}
      />
      <ProfileStack.Screen
        name="ExpenseCategoriesSettings"
        component={ExpenseCategoriesSettingsScreen}
        options={({ navigation }) => ({
          title: 'Категорії витрат',
          headerBackTitleVisible: false,
          ...stackBackHeader(t, navigation),
          headerRight: () => (
            <DrawerMenuButton navigation={navigation} color={t.colors.text} />
          ),
        })}
      />
    </ProfileStack.Navigator>
  );
}

/** Без повторного insets.top: батьківський SafeAreaView уже відсуває весь навігатор. */
function DrawerContentWrapper(props: DrawerContentComponentProps) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: t.colors.card }}
      contentContainerStyle={{
        paddingTop: 12,
        paddingBottom: 12 + insets.bottom,
      }}
    >
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function ThemedNavigation() {
  const t = useAppTheme();
  const navTheme = {
    ...(t.dark ? NavDarkTheme : NavDefaultTheme),
    colors: {
      ...(t.dark ? NavDarkTheme.colors : NavDefaultTheme.colors),
      background: t.colors.background,
      card: t.colors.card,
      text: t.colors.text,
      primary: t.colors.accent,
      border: t.colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Drawer.Navigator
        detachInactiveScreens={false}
        drawerContent={(props) => <DrawerContentWrapper {...props} />}
        screenOptions={{
          drawerActiveTintColor: t.colors.accent,
          drawerInactiveTintColor: t.colors.muted,
          drawerStyle: { backgroundColor: t.colors.card },
          headerShown: false,
        }}
      >
        <Drawer.Screen
          name="Calendar"
          component={CalendarFlow}
          options={{
            title: 'Календар',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Tasks"
          component={TasksFlow}
          options={{
            title: 'Задачі',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="checkbox-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Finance"
          component={FinanceFlow}
          options={{
            title: 'Фінанси',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Analytics"
          component={AnalyticsFlow}
          options={{
            title: 'Аналітика',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Profile"
          component={ProfileFlow}
          options={{
            title: 'Профіль',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Notes"
          component={NotesFlow}
          options={{
            title: 'Нотатки',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export function RootNavigator() {
  return <ThemedNavigation />;
}
