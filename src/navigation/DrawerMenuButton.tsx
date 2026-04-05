import React from 'react';
import { Pressable } from 'react-native';
import {
  DrawerActions,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

function openDrawerFrom(navigation: NavigationProp<ParamListBase>) {
  let nav: NavigationProp<ParamListBase> | undefined = navigation;
  while (nav) {
    const d = nav as DrawerNavigationProp<ParamListBase>;
    if (typeof d.openDrawer === 'function') {
      d.openDrawer();
      return;
    }
    nav = nav.getParent();
  }
  navigation.dispatch(DrawerActions.openDrawer());
}

export function DrawerMenuButton({
  navigation,
  color,
}: {
  navigation: NavigationProp<ParamListBase>;
  color: string;
}) {
  return (
    <Pressable
      onPress={() => openDrawerFrom(navigation)}
      style={{ paddingHorizontal: 10, paddingVertical: 8, marginLeft: 4 }}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Меню"
    >
      <Ionicons name="menu-outline" size={26} color={color} />
    </Pressable>
  );
}
