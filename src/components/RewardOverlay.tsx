import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../store/ThemeContext';
import { useAppData } from '../store/AppDataContext';
import { achievementById } from '../constants/achievements';

export function RewardOverlay() {
  const t = useAppTheme();
  const { rewardQueue, consumeReward } = useAppData();
  const head = rewardQueue[0];
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!head) return;
    scale.setValue(0.85);
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [head, scale]);

  if (!head) return null;

  const title =
    head.type === 'level'
      ? `Рівень ${head.level}!`
      : achievementById(head.id)?.title ?? 'Досягнення!';
  const subtitle =
    head.type === 'level'
      ? 'Чудова робота — продовжуй у тому ж дусі.'
      : achievementById(head.id)?.description ?? '';

  return (
    <Modal transparent visible animationType="fade" onRequestClose={consumeReward}>
      <Pressable style={[styles.backdrop, { backgroundColor: t.colors.overlay }]} onPress={consumeReward}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.card,
              { backgroundColor: t.colors.card, borderColor: t.colors.border },
            ]}
          >
            <Text style={[styles.badge, { color: t.colors.accent }]}>
              {head.type === 'level' ? 'Рівень' : 'Трофей'}
            </Text>
            <Text style={[styles.title, { color: t.colors.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.sub, { color: t.colors.muted }]}>{subtitle}</Text>
            ) : null}
            <Pressable
              onPress={consumeReward}
              style={[styles.btn, { backgroundColor: t.colors.accent }]}
            >
              <Text style={[styles.btnTxt, { color: t.colors.onAccent }]}>Супер!</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  btnTxt: {
    fontWeight: '700',
    fontSize: 16,
  },
});
