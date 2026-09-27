import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = { title?: string; back?: boolean; onBack?: () => void; actionIcon?: keyof typeof Ionicons.glyphMap; onAction?: () => void };

export function TopBar({ title, back = false, onBack, actionIcon, onAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {back && (
          <Pressable accessibilityLabel="Go back" onPress={onBack ?? (() => router.back())} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={25} color={colors.ink} />
          </Pressable>
        )}
      </View>
      <Text numberOfLines={1} style={styles.title}>{title}</Text>
      <View style={[styles.side, styles.sideRight]}>
        {actionIcon && (
          <Pressable accessibilityLabel="More options" onPress={onAction} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name={actionIcon} size={23} color={colors.ink} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { width: 44, alignItems: 'flex-start' },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.ink },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.mist },
});
