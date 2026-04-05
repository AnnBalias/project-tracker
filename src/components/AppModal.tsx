import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../store/ThemeContext';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function AppModal({ visible, title, onClose, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  const t = useAppTheme();

  const sheetShadow =
    Platform.OS === 'ios' && !t.dark
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        }
      : null;
  const sheetElevation = Platform.OS === 'android' && !t.dark ? { elevation: 8 } : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      hardwareAccelerated
    >
      <View style={styles.root} collapsable={false}>
        <TouchableWithoutFeedback
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Закрити"
        >
          <View
            style={[styles.backdrop, { backgroundColor: t.colors.overlay }]}
            collapsable={false}
          />
        </TouchableWithoutFeedback>

        <View pointerEvents="box-none" style={styles.sheetSlot}>
          <View pointerEvents="box-none" style={styles.sheetSlotInner}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.kav}
            >
              <View
                style={[
                  styles.sheet,
                  sheetShadow,
                  sheetElevation,
                  {
                    paddingBottom: Math.max(insets.bottom, t.spacing.md),
                    maxHeight: '88%',
                    backgroundColor: t.colors.card,
                    borderTopLeftRadius: t.radius.lg,
                    borderTopRightRadius: t.radius.lg,
                    paddingHorizontal: t.spacing.md,
                    paddingTop: t.spacing.sm,
                    borderColor: t.colors.border,
                  },
                ]}
              >
                <View style={[styles.grabberWrap, { marginBottom: t.spacing.sm }]}>
                  <View style={[styles.grabber, { backgroundColor: t.colors.border }]} />
                </View>
                <View
                  style={[
                    styles.header,
                    {
                      marginBottom: t.spacing.sm,
                      paddingBottom: t.spacing.sm,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: t.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.title, { color: t.colors.text, paddingRight: t.spacing.sm }]}
                  >
                    {title}
                  </Text>
                  <Pressable
                    onPress={onClose}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Закрити вікно"
                    style={({ pressed }) => [
                      styles.closeBtn,
                      { opacity: pressed ? 0.65 : 1 },
                    ]}
                  >
                    <Text style={[styles.close, { color: t.colors.muted }]}>✕</Text>
                  </Pressable>
                </View>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: t.spacing.md }}
                  nestedScrollEnabled
                  bounces
                >
                  {children}
                </ScrollView>
                {footer ? (
                  <View
                    style={[
                      styles.footer,
                      {
                        paddingTop: t.spacing.md,
                        borderTopColor: t.colors.border,
                        gap: t.spacing.sm,
                      },
                    ]}
                  >
                    {footer}
                  </View>
                ) : null}
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  /** Проміжок над шитом — тапи проходять крізь box-none до backdrop */
  sheetSlot: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetSlotInner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  kav: {
    width: '100%',
  },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === 'android' ? { overflow: 'hidden' as const } : null),
  },
  grabberWrap: {
    alignItems: 'center',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 6,
    marginRight: -6,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: { fontSize: 20, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
