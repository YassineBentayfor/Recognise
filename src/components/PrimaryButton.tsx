import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radii } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  tone?: 'dark' | 'light' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, tone = 'dark', icon, loading, disabled, style }: Props) {
  const isLight = tone === 'light';
  const backgroundColor = tone === 'danger' ? colors.coral : isLight ? colors.mist : colors.ink;
  const foreground = tone === 'danger' ? '#FFFFFF' : isLight ? colors.ink : colors.paper;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor, opacity: disabled ? 0.45 : pressed ? 0.82 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={foreground} /> : (
        <>
          {icon && <Ionicons name={icon} color={foreground} size={19} />}
          <Text style={[styles.label, { color: foreground }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { height: 56, paddingHorizontal: 20, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  label: { fontSize: 16, fontWeight: '700' },
});
