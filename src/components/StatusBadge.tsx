import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Status, STATUS_COLORS, STATUS_LABELS } from '../types/wardrobe';

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const bg = STATUS_COLORS[status] + '22'; // 13% opacity tint
  const fg = STATUS_COLORS[status];
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSm && styles.sm]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.label, { color: fg }, isSm && styles.smLabel]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  smLabel: {
    fontSize: 10,
  },
});
