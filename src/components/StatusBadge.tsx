import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Status, STATUS_COLORS, STATUS_LABELS } from '../types/wardrobe';
import { Radii } from '../theme/theme';

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}


export default function StatusBadge({ status, size = 'md' }: Props) {
  const color = STATUS_COLORS[status];
  const bg = color + '20'; // 12% opacity tint
  const border = color + '50'; // 31% opacity border
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingHorizontal: isSm ? 7 : 10,
          paddingVertical: isSm ? 3 : 5,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color, width: isSm ? 5 : 6, height: isSm ? 5 : 6 }]} />
      <Text
        style={[
          styles.label,
          { color, fontSize: isSm ? 10 : 12 },
        ]}
      >
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: {
    borderRadius: 99,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
