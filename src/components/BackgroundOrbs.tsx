import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * No-op background — pure black. No orbs, no ambient glow bleed.
 * Keeping this component so screen imports don't break.
 */
export default function BackgroundOrbs(_props: { variant?: string }) {
  return null;
}
