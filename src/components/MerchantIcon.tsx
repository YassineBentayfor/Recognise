import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const tones = {
  blue: '#244BC7', black: '#F3F3F4', orange: '#F29932', green: '#0C7A58', purple: '#6346B9', red: '#EF4961',
};
const iconColors = {
  blue: '#FFFFFF', black: '#111111', orange: '#FFFFFF', green: '#FFFFFF', purple: '#FFFFFF', red: '#FFFFFF',
};

type Props = { icon: string; tone: keyof typeof tones; size?: number };

export function MerchantIcon({ icon, tone, size = 48 }: Props) {
  return (
    <View style={[styles.icon, { width: size, height: size, borderRadius: size / 2, backgroundColor: tones[tone] }]}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={Math.round(size * 0.44)} color={iconColors[tone]} />
    </View>
  );
}

const styles = StyleSheet.create({ icon: { alignItems: 'center', justifyContent: 'center' } });
