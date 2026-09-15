import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';

interface BackgroundOrbsProps {
  variant?: 'purple' | 'blue' | 'mixed';
}

/**
 * Decorative ambient background orbs — creates the blurred gradient glow
 * seen in Apple visionOS / iOS 26 liquid glass designs.
 */
export default function BackgroundOrbs({ variant = 'mixed' }: BackgroundOrbsProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top-left purple orb */}
      <View
        style={[
          styles.orb,
          {
            width: 280,
            height: 280,
            top: -60,
            left: -80,
            backgroundColor:
              variant === 'blue' ? 'rgba(96,165,250,0.18)' : 'rgba(124,58,237,0.22)',
            borderRadius: 140,
          },
        ]}
      />

      {/* Top-right blue orb */}
      <View
        style={[
          styles.orb,
          {
            width: 220,
            height: 220,
            top: 80,
            right: -60,
            backgroundColor:
              variant === 'purple' ? 'rgba(124,58,237,0.15)' : 'rgba(59,130,246,0.16)',
            borderRadius: 110,
          },
        ]}
      />

      {/* Bottom center faint orb */}
      <View
        style={[
          styles.orb,
          {
            width: 300,
            height: 300,
            bottom: 60,
            alignSelf: 'center',
            left: '10%',
            backgroundColor: 'rgba(139,92,246,0.10)',
            borderRadius: 150,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    // Simulate blur with nested semi-transparent layers via large border radius
    shadowColor: Colors.purple500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 80,
  },
});
