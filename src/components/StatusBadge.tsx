import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Status, STATUS_COLORS, STATUS_LABELS, formatStatusLabel } from '../types/wardrobe';
import { Radii } from '../theme/theme';
import { Drop } from './AppIcons';

interface Props {
  status: Status;
  /** Times worn since last wash. Shown as "Worn · 2x" when status is `worn`. */
  wearCount?: number;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

// Double-crested wave path across a 200px width for smooth, seamless sloshing
const WAVE_PATH_1 = 'M 0 12 Q 25 7, 50 12 T 100 12 T 150 12 T 200 12 L 200 36 L 0 36 Z';
const WAVE_PATH_2 = 'M 0 14 Q 25 18, 50 14 T 100 14 T 150 14 T 200 14 L 200 36 L 0 36 Z';

export default function StatusBadge({ status, wearCount, size = 'md', style }: Props) {
  const isLaundry = status === 'in_laundry' || status === 'drying';
  const color = STATUS_COLORS[status];
  const isSm = size === 'sm';

  // ── Animations for Laundry Wash Effect ─────────────────────────────
  // 1. Water slosh waves
  const waveTranslateX = useRef(new Animated.Value(0)).current;
  const waveTranslateY = useRef(new Animated.Value(0)).current;

  // 2. Soap bubbles (staggered vertical float + wobble)
  const b1Y = useRef(new Animated.Value(0)).current;
  const b1X = useRef(new Animated.Value(0)).current;
  const b1Scale = useRef(new Animated.Value(0.4)).current;
  const b1Opacity = useRef(new Animated.Value(0)).current;

  const b2Y = useRef(new Animated.Value(0)).current;
  const b2X = useRef(new Animated.Value(0)).current;
  const b2Scale = useRef(new Animated.Value(0.4)).current;
  const b2Opacity = useRef(new Animated.Value(0)).current;

  const b3Y = useRef(new Animated.Value(0)).current;
  const b3X = useRef(new Animated.Value(0)).current;
  const b3Scale = useRef(new Animated.Value(0.4)).current;
  const b3Opacity = useRef(new Animated.Value(0)).current;

  // 3. Leading water droplet bobbing & ripple pulse
  const dropBobY = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0.6)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  // 4. Subtle border wash breath
  const borderPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLaundry) return;

    // ── Water slosh loop ──
    const waveXAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(waveTranslateX, {
          toValue: -32,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveTranslateX, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const waveYAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(waveTranslateY, {
          toValue: 1.5,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveTranslateY, {
          toValue: -1.2,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // ── Soap bubble 1 loop ──
    const bubble1Anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(b1Y, {
            toValue: -22,
            duration: 2100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(b1X, {
              toValue: 2,
              duration: 1050,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(b1X, {
              toValue: -1.5,
              duration: 1050,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(b1Opacity, {
              toValue: 0.85,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(b1Opacity, {
              toValue: 0.75,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(b1Opacity, {
              toValue: 0,
              duration: 550,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(b1Scale, {
            toValue: 1.15,
            duration: 2100,
            useNativeDriver: true,
          }),
        ]),
        // Reset
        Animated.parallel([
          Animated.timing(b1Y, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(b1X, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(b1Scale, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          Animated.timing(b1Opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(200),
      ])
    );

    // ── Soap bubble 2 loop (staggered) ──
    const bubble2Anim = Animated.loop(
      Animated.sequence([
        Animated.delay(650),
        Animated.parallel([
          Animated.timing(b2Y, {
            toValue: -18,
            duration: 1750,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(b2X, {
              toValue: -2,
              duration: 875,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(b2X, {
              toValue: 1,
              duration: 875,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(b2Opacity, {
              toValue: 0.8,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(b2Opacity, {
              toValue: 0.7,
              duration: 950,
              useNativeDriver: true,
            }),
            Animated.timing(b2Opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(b2Scale, {
            toValue: 1.1,
            duration: 1750,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(b2Y, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(b2X, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(b2Scale, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          Animated.timing(b2Opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );

    // ── Soap bubble 3 loop (staggered) ──
    const bubble3Anim = Animated.loop(
      Animated.sequence([
        Animated.delay(1250),
        Animated.parallel([
          Animated.timing(b3Y, {
            toValue: -21,
            duration: 2300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(b3X, {
              toValue: 1.8,
              duration: 1150,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(b3X, {
              toValue: -1.2,
              duration: 1150,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(b3Opacity, {
              toValue: 0.85,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(b3Opacity, {
              toValue: 0.7,
              duration: 1350,
              useNativeDriver: true,
            }),
            Animated.timing(b3Opacity, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(b3Scale, {
            toValue: 1.2,
            duration: 2300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(b3Y, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(b3X, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(b3Scale, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          Animated.timing(b3Opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );

    // ── Buoyant water droplet bob loop ──
    const dropBobAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(dropBobY, {
          toValue: -1.2,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(dropBobY, {
          toValue: 1.2,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // ── Droplet ripple pulse loop ──
    const rippleAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1.7,
            duration: 1400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(rippleOpacity, {
              toValue: 0.6,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 0,
              duration: 1150,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(rippleScale, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          Animated.timing(rippleOpacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(400),
      ])
    );

    // ── Pill border pulse loop ──
    const borderPulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(borderPulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Start all wash animations
    waveXAnim.start();
    waveYAnim.start();
    bubble1Anim.start();
    bubble2Anim.start();
    bubble3Anim.start();
    dropBobAnim.start();
    rippleAnim.start();
    borderPulseAnim.start();

    return () => {
      waveXAnim.stop();
      waveYAnim.stop();
      bubble1Anim.stop();
      bubble2Anim.stop();
      bubble3Anim.stop();
      dropBobAnim.stop();
      rippleAnim.stop();
      borderPulseAnim.stop();
    };
  }, [isLaundry]);

  // Standard static badge styling for clean, worn, misplaced
  if (!isLaundry) {
    const bg = color + '14'; // Subtle 8% tint
    const border = color + '30'; // Delicate 19% micro-border

    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: bg,
            borderColor: border,
            paddingHorizontal: isSm ? 8 : 10,
            paddingVertical: isSm ? 3 : 5,
          },
          style,
        ]}
      >
        <View style={[styles.dot, { backgroundColor: color, width: isSm ? 5 : 6, height: isSm ? 5 : 6 }]} />
        <Text style={[styles.label, { color, fontSize: isSm ? 10 : 12 }]}>
          {formatStatusLabel(status, wearCount)}
        </Text>
      </View>
    );
  }

  // ── Active Washing Animation Pill for In Laundry ───────────────────
  const badgeHeight = isSm ? 22 : 26;
  const bubble1Size = isSm ? 4 : 5.2;
  const bubble2Size = isSm ? 3.2 : 4.2;
  const bubble3Size = isSm ? 4.2 : 5.4;

  return (
    <View
      style={[
        styles.badge,
        styles.laundryBadge,
        {
          paddingHorizontal: isSm ? 8 : 10,
          paddingVertical: isSm ? 2.5 : 4,
          height: badgeHeight,
        },
        style,
      ]}
    >
      {/* ── Background Water Wash Slosh ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.waveContainer,
          {
            transform: [
              { translateX: waveTranslateX },
              { translateY: waveTranslateY },
            ],
          },
        ]}
      >
        <Svg width={240} height={badgeHeight + 12} viewBox="0 0 240 36">
          {/* Secondary deeper water wave */}
          <Path d={WAVE_PATH_2} fill="rgba(56, 189, 248, 0.18)" />
          {/* Primary cresting water wave */}
          <Path d={WAVE_PATH_1} fill="rgba(2, 132, 199, 0.22)" />
        </Svg>
      </Animated.View>

      {/* ── Rising Soap Bubble 1 ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          {
            left: isSm ? 22 : 28,
            width: bubble1Size,
            height: bubble1Size,
            borderRadius: bubble1Size / 2,
            opacity: b1Opacity,
            transform: [
              { translateY: b1Y },
              { translateX: b1X },
              { scale: b1Scale },
            ],
          },
        ]}
      >
        <View style={styles.bubbleSpecular} />
      </Animated.View>

      {/* ── Rising Soap Bubble 2 ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          {
            left: isSm ? 46 : 58,
            width: bubble2Size,
            height: bubble2Size,
            borderRadius: bubble2Size / 2,
            opacity: b2Opacity,
            transform: [
              { translateY: b2Y },
              { translateX: b2X },
              { scale: b2Scale },
            ],
          },
        ]}
      >
        <View style={styles.bubbleSpecular} />
      </Animated.View>

      {/* ── Rising Soap Bubble 3 ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          {
            left: isSm ? 70 : 86,
            width: bubble3Size,
            height: bubble3Size,
            borderRadius: bubble3Size / 2,
            opacity: b3Opacity,
            transform: [
              { translateY: b3Y },
              { translateX: b3X },
              { scale: b3Scale },
            ],
          },
        ]}
      >
        <View style={styles.bubbleSpecular} />
      </Animated.View>

      {/* ── Leading Water Droplet with Ripple ── */}
      <View style={styles.iconWrap}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ripple,
            {
              width: isSm ? 12 : 14,
              height: isSm ? 12 : 14,
              borderRadius: 99,
              borderColor: color,
              opacity: rippleOpacity,
              transform: [{ scale: rippleScale }],
            },
          ]}
        />
        <Animated.View style={{ transform: [{ translateY: dropBobY }] }}>
          <Drop size={isSm ? 10 : 12} color={color} weight="bold" />
        </Animated.View>
      </View>

      {/* ── Crisp Pill Label ── */}
      <Text
        style={[
          styles.label,
          styles.laundryLabel,
          { color, fontSize: isSm ? 10 : 12 },
        ]}
      >
        {STATUS_LABELS[status]}
      </Text>

      {/* ── Soft Breathing Water Glow Border Overlay ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.borderGlowOverlay,
          {
            opacity: borderPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.35, 0.75],
            }),
            borderColor: color,
          },
        ]}
      />
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
    overflow: 'hidden',
    position: 'relative',
  },
  laundryBadge: {
    backgroundColor: '#E0F2FE', // Crisp refreshing water blue background tint
    borderColor: 'rgba(2, 132, 199, 0.38)',
  },
  dot: {
    borderRadius: 99,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
    zIndex: 5,
  },
  laundryLabel: {
    fontWeight: '700',
  },
  iconWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  waveContainer: {
    position: 'absolute',
    left: -20,
    top: -2,
    bottom: -2,
    right: -40,
    zIndex: 1,
  },
  bubble: {
    position: 'absolute',
    bottom: -2,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(2, 132, 199, 0.80)',
    borderWidth: 1,
    zIndex: 3,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  bubbleSpecular: {
    width: 1.2,
    height: 1.2,
    borderRadius: 99,
    backgroundColor: '#FFFFFF',
    marginTop: 0.5,
    marginLeft: 0.5,
  },
  borderGlowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radii.pill,
    borderWidth: 1.2,
    zIndex: 4,
  },
});
