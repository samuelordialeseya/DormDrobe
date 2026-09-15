import React, { useRef, useCallback } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  activeOpacity?: number;
  /** Scale to shrink to on press-in. Default 0.96 */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/**
 * Pressable that smoothly scales down on press-in and springs back on release.
 * Gives every interactive element a tactile, "glass" feel.
 */
export default function PressableScale({
  children,
  onPress,
  scaleTo = 0.96,
  style,
  disabled = false,
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      tension: 400,
      friction: 20,
    }).start();
  }, [scaleTo]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 18,
    }).start();
  }, []);

  return (
    <TouchableWithoutFeedback
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
