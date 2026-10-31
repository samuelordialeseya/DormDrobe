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
import { useWardrobe } from '../context/WardrobeContext';

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
  const { getLocationLabel } = useWardrobe();

  const dormFull = getLocationLabel('batangas_dorm');
  const homeFull = getLocationLabel('calamba_home');
  const dormText = dormFull === 'Batangas Dorm' ? 'Dorm' : dormFull;
  const homeText = homeFull === 'Calamba Home' ? 'Home' : homeFull;

  // Dynamic track measurement for pixel-perfect sliding alignment
  const [trackWidth, setTrackWidth] = useState(DEFAULT_TOTAL_WIDTH);
  const pillWidth = Math.max(0, (trackWidth - PADDING * 2) / 2);

  // ── Animations ────────────────────────────────────────────────────────
  // Single source of truth: 0 = Dorm (left), 1 = Home (right)
  const slideAnim = useRef(new Animated.Value(isHome ? 1 : 0)).current;

  // Smooth, responsive spring physics for instant, buttery sliding
  const springTo = (toValue: number) => {
    Animated.spring(slideAnim, {
      toValue,
      tension: 340,
      friction: 26,
      useNativeDriver,
    }).start();
  };

  useEffect(() => {
    const toValue = isHome ? 1 : 0;
    springTo(toValue);
  }, [isHome, useNativeDriver]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - trackWidth) > 1) {
      setTrackWidth(w);
    }
  };

  const handleSelect = (loc: Location) => {
    if (loc === currentLocation) return;
    // Optimistic instant spring on tap — zero latency, ultra-fluid response
    springTo(loc === 'calamba_home' ? 1 : 0);
    onChange(loc);
  };

  // Interpolated sliding pill translation
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pillWidth],
  });

  // Segment text, icon & indicator interpolations driven directly by slideAnim
  const dormScale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });
  const dormOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.55],
    extrapolate: 'clamp',
  });
  const dormActiveOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const dormInactiveOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const dormDotScale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const homeScale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
    extrapolate: 'clamp',
  });
  const homeOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
    extrapolate: 'clamp',
  });
  const homeActiveOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const homeInactiveOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const homeDotScale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.outerContainer, style]}>
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
                transform: [{ translateX }],
              },
            ]}
          >
            {/* Pill top specular gleam */}
            <View style={styles.pillSpecular} />
          </Animated.View>
        )}

        {/* Dorm Option Button */}
        <TouchableOpacity
          onPress={() => handleSelect('batangas_dorm')}
          delayPressIn={0}
          activeOpacity={0.82}
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
            <View style={styles.iconStack}>
              <Animated.View style={[styles.iconLayer, { opacity: dormInactiveOpacity }]}>
                <LocationIcon
                  location="batangas_dorm"
                  size={13}
                  color={Colors.textSecondary}
                  weight="light"
                />
              </Animated.View>
              <Animated.View style={[styles.iconLayer, { opacity: dormActiveOpacity }]}>
                <LocationIcon
                  location="batangas_dorm"
                  size={13}
                  color={Colors.locBatangas}
                  weight="regular"
                />
              </Animated.View>
            </View>
            <Text style={styles.segmentText} numberOfLines={1}>
              {dormText}
            </Text>
            <Animated.View
              style={[
                styles.activeDot,
                {
                  backgroundColor: Colors.locBatangas,
                  opacity: dormActiveOpacity,
                  transform: [{ scale: dormDotScale }],
                },
              ]}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Home Option Button */}
        <TouchableOpacity
          onPress={() => handleSelect('calamba_home')}
          delayPressIn={0}
          activeOpacity={0.82}
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
            <View style={styles.iconStack}>
              <Animated.View style={[styles.iconLayer, { opacity: homeInactiveOpacity }]}>
                <LocationIcon
                  location="calamba_home"
                  size={13}
                  color={Colors.textSecondary}
                  weight="light"
                />
              </Animated.View>
              <Animated.View style={[styles.iconLayer, { opacity: homeActiveOpacity }]}>
                <LocationIcon
                  location="calamba_home"
                  size={13}
                  color={Colors.locCalamba}
                  weight="regular"
                />
              </Animated.View>
            </View>
            <Text style={styles.segmentText} numberOfLines={1}>
              {homeText}
            </Text>
            <Animated.View
              style={[
                styles.activeDot,
                {
                  backgroundColor: Colors.locCalamba,
                  opacity: homeActiveOpacity,
                  transform: [{ scale: homeDotScale }],
                },
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
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
  iconStack: {
    width: 13,
    height: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 11.5,
    letterSpacing: 0.15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: 1,
  },
});
