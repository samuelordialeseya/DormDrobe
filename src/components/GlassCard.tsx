import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Radii } from '../theme/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Brightness variant */
  variant?: 'dim' | 'normal' | 'bright';
  radius?: number;
  noShadow?: boolean;
}

/**
 * Liquid glass card — Apple-style frosted/glassmorphism surface.
 * Uses layered backgrounds + border to simulate specular highlight.
 */
export default function GlassCard({
  children,
  style,
  variant = 'normal',
  radius = Radii.xl,
  noShadow = false,
}: GlassCardProps) {
  const bg =
    variant === 'dim'
      ? Colors.glassLight
      : variant === 'bright'
      ? Colors.glassBright
      : Colors.glassMid;

  const border =
    variant === 'bright' ? Colors.borderGlassBright : Colors.borderGlass;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderRadius: radius,
          borderColor: border,
        },
        !noShadow && styles.shadow,
        style,
      ]}
    >
      {/* Top specular highlight */}
      <View
        style={[
          styles.specular,
          {
            borderRadius: radius,
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    zIndex: 10,
  },
});
