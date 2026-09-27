import React, { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export function StickyFooter({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.paper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    gap: 9,
    ...(Platform.OS === 'web' ? { boxShadow: '0 -12px 28px rgba(17, 19, 24, 0.06)' } : {
      shadowColor: colors.ink,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 12,
    }),
  },
});
