import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { Location } from '../types/wardrobe';
import { Colors, Radii } from '../theme/theme';
import { LocationIcon } from './AppIcons';

const TRACK_HEIGHT = 36;
const PADDING = 3;
const PILL_HEIGHT = TRACK_HEIGHT - PADDING * 2;
const DEFAULT_TOTAL_WIDTH = 166;

interface LiquidGlassLocationSwitchProps {
  currentLocation: Location;
  onChange: (location: Location) => void;
  style?: StyleProp<ViewStyle>;
}

export default function LiquidGlassLocationSwitch({
  currentLocation,
  onChange,
  style,
}: LiquidGlassLocationSwitchProps) {
  const isDorm = currentLocation === 'batangas_dorm';
  const isHome = currentLocation === 'calamba_home';
  const useNativeDriver = Platform.OS !== 'web';

  // Dynamic track measurement for pixel-perfect sliding alignment
  const [trackWidth, setTrackWidth] = useState(DEFAULT_TOTAL_WIDTH);
  const pillWidth = Math.max(0, (trackWidth - PADDING * 2) / 2);

  // ── Animations ────────────────────────────────────────────────────────
  // 0 = Dorm (left), 1 = Home (right)
  const slideAnim = useRef(new Animated.Value(isHome ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const dormAnim = useRef(new Animated.Value(isDorm ? 1 : 0)).current;
  const homeAnim = useRef(new Animated.Value(isHome ? 1 : 0)).current;

  useEffect(() => {
    const toValue = isHome ? 1 : 0;
    Animated.parallel([
      // Primary liquid slide with tuned organic spring physics
      Animated.spring(slideAnim, {
        toValue,
        tension: 300,
        friction: 24,
        useNativeDriver,
      }),
      // Dorm tab content animation (scale & opacity)
      Animated.spring(dormAnim, {
        toValue: isDorm ? 1 : 0,
        tension: 320,
        friction: 26,
        useNativeDriver,
      }),
      // Home tab content animation (scale & opacity)
      Animated.spring(homeAnim, {
        toValue: isHome ? 1 : 0,
        tension: 320,
        friction: 26,
        useNativeDriver,
      }),
    ]).start();
  }, [currentLocation]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - trackWidth) > 1) {
      setTrackWidth(w);
    }
  };

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      tension: 400,
      friction: 25,
      useNativeDriver,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 350,
      friction: 20,
      useNativeDriver,
    }).start();
  };

  // Interpolated sliding pill translation
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pillWidth],
  });

  // Liquid squash & stretch (elongates horizontally mid-flight)
  const stretchX = slideAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 1.07, 1.12, 1.07, 1],
  });

  // Vertical volume-conservation compression mid-flight
  const compressY = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.93, 1],
  });

  // Segment text & icon scale interpolations
  const dormScale = dormAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.93, 1],
  });
  const dormOpacity = dormAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  const homeScale = homeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.93, 1],
  });
  const homeOpacity = homeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        { transform: [{ scale: pressAnim }] },
        style,
      ]}
    >
      <View style={styles.glassTrack} onLayout={handleLayout}>
        {/* Top bevel specular edge for liquid glass refraction */}
        <View style={styles.trackSpecular} />

        {/* Sliding Liquid Glass Droplet Pill */}
        {pillWidth > 0 && (
          <Animated.View
            style={[
              styles.liquidPill,
              {
                width: pillWidth,
                transform: [
                  { translateX },
                  { scaleX: stretchX },
                  { scaleY: compressY },
                ],
              },
            ]}
          >
            {/* Pill top specular gleam */}
            <View style={styles.pillSpecular} />
          </Animated.View>
        )}

        {/* Dorm Option Button */}
        <TouchableOpacity
          onPress={() => onChange('batangas_dorm')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Switch location to Dorm"
          accessibilityState={{ selected: isDorm }}
          style={styles.segmentBtn}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Animated.View
            style={[
              styles.segmentContent,
              {
                opacity: dormOpacity,
                transform: [{ scale: dormScale }],
              },
            ]}
          >
            <LocationIcon
              location="batangas_dorm"
              size={13}
              color={isDorm ? Colors.locBatangas : Colors.textTertiary}
              weight={isDorm ? 'regular' : 'light'}
            />
            <Text
              style={[
                styles.segmentText,
                isDorm ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
              numberOfLines={1}
            >
              Dorm
            </Text>
            <Animated.View
              style={[
                styles.activeDot,
                {
                  backgroundColor: Colors.locBatangas,
                  opacity: dormAnim,
                  transform: [{ scale: dormAnim }],
                },
              ]}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Home Option Button */}
        <TouchableOpacity
          onPress={() => onChange('calamba_home')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Switch location to Home"
          accessibilityState={{ selected: isHome }}
          style={styles.segmentBtn}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Animated.View
            style={[
              styles.segmentContent,
              {
                opacity: homeOpacity,
                transform: [{ scale: homeScale }],
              },
            ]}
          >
            <LocationIcon
              location="calamba_home"
              size={13}
              color={isHome ? Colors.locCalamba : Colors.textTertiary}
              weight={isHome ? 'regular' : 'light'}
            />
            <Text
              style={[
                styles.segmentText,
                isHome ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
              numberOfLines={1}
            >
              Home
            </Text>
            <Animated.View
              style={[
                styles.activeDot,
                {
                  backgroundColor: Colors.locCalamba,
                  opacity: homeAnim,
                  transform: [{ scale: homeAnim }],
                },
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    minWidth: DEFAULT_TOTAL_WIDTH,
  },
  glassTrack: {
    width: '100%',
    height: TRACK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.08)',
    padding: PADDING,
    position: 'relative',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  trackSpecular: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 5,
  },
  liquidPill: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.06)',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.11,
    shadowRadius: 5,
    elevation: 3,
    overflow: 'hidden',
  },
  pillSpecular: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1,
  },
  segmentBtn: {
    flex: 1,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  segmentText: {
    fontSize: 11.5,
    letterSpacing: 0.15,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  segmentTextInactive: {
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: 1,
  },
});
