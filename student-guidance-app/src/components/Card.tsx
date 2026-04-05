import React from 'react';
import { StyleProp, View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii, shadows, spacing } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  blur?: boolean;
};

export const Card: React.FC<Props> = ({ children, style, blur = true }) => {
  if (blur) {
    return (
      <BlurView intensity={40} tint="dark" style={[styles.card, style]}>
        {children}
      </BlurView>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    ...shadows.card,
  },
});

