import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import type { CalendarStackParamList, MainTabParamList } from './types';
import { CalendarMonthScreen } from '../screens/CalendarMonthScreen';
import { CalendarDayScreen } from '../screens/CalendarDayScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.card,
    text: theme.colors.text,
    primary: theme.colors.accent,
    border: theme.colors.border,
  },
};

function CalendarFlow() {
  return (
    <CalendarStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.accent,
        headerTitleStyle: { color: theme.colors.text },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <CalendarStack.Screen
        name="CalendarMonth"
        component={CalendarMonthScreen}
        options={{ headerShown: false }}
      />
      <CalendarStack.Screen
        name="CalendarDay"
        component={CalendarDayScreen}
        options={{ headerShown: false }}
      />
    </CalendarStack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.accent,
          headerTitleStyle: { color: theme.colors.text },
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
          },
          tabBarIcon: ({ color, size }) => {
            const map: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> =
              {
                CalendarTab: 'calendar-outline',
                Tasks: 'checkbox-outline',
                Finance: 'wallet-outline',
                Analytics: 'pie-chart-outline',
                Profile: 'person-outline',
              };
            const name = map[route.name as keyof MainTabParamList];
            return <Ionicons name={name} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="CalendarTab"
          component={CalendarFlow}
          options={{ title: 'Календар', headerShown: false }}
        />
        <Tab.Screen name="Tasks" component={TasksScreen} options={{ title: 'Задачі' }} />
        <Tab.Screen name="Finance" component={FinanceScreen} options={{ title: 'Фінанси' }} />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{ title: 'Аналітика' }}
        />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профіль' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
