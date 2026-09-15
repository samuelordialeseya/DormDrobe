import React, { useRef, useEffect } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface FadeSlideInProps {
  children: React.ReactNode;
  /** Delay before the animation starts, in ms. Use for staggered lists. */
  delay?: number;
  /** How far to slide up from. Default 16 */
  fromY?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps children in a fade + slide-up entrance animation.
 * Use on screens, cards, or any section that should animate in on mount.
 */
export default function FadeSlideIn({
  children,
  delay = 0,
  fromY = 16,
  style,
}: FadeSlideInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(fromY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        tension: 240,
        friction: 26,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}
