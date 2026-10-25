import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Shirt, Sparkles, Settings } from './AppIcons';
import { Colors, Radii } from '../theme/theme';

type TabDef = {
  name: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number; weight?: any }>;
  label: string;
};

const TABS: TabDef[] = [
  { name: 'Home', Icon: Home, label: 'Home' },
  { name: 'Closet', Icon: Shirt, label: 'Closet' },
  { name: 'FitGen', Icon: Sparkles, label: 'Outfits' },
  { name: 'Settings', Icon: Settings, label: 'Settings' },
];

const PILL_H = 46;
const BAR_H = 66;
const H_PAD = 18;       // outerContainer paddingHorizontal
const BAR_PAD = 6;      // glassBar paddingHorizontal
const PILL_TOP = (BAR_H - PILL_H) / 2;

interface TabButtonProps {
  route: any;
  index: number;
  isFocused: boolean;
  tabWidth: number;
  onPress: () => void;
}

function TabButton({ route, isFocused, tabWidth, onPress }: TabButtonProps) {
  const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
  const IconComponent = tab.Icon;

  const scaleAnim = useRef(new Animated.Value(isFocused ? 1.02 : 0.90)).current;
  const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0.52)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.02 : 0.90,
        useNativeDriver: true,
        tension: 340,
        friction: 26,
      }),
      Animated.timing(opacityAnim, {
        toValue: isFocused ? 1 : 0.52,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const iconColor = isFocused ? Colors.textPrimary : Colors.textTertiary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      style={[styles.tabItem, { width: tabWidth }]}
    >
      <Animated.View
        style={[
          styles.tabContent,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <IconComponent size={20} color={iconColor} weight={isFocused ? 'regular' : 'light'} />
        <Text
          style={[
            styles.tabLabel,
            isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function LiquidGlassTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Filter only declared tabs for the liquid glass bar
  const visibleRoutes = state.routes.filter((route) =>
    TABS.some((t) => t.name === route.name)
  );

  const activeVisibleIndex = visibleRoutes.findIndex(
    (r) => r.name === state.routes[state.index]?.name
  );

  // Constrain navbar to iPhone 13 width (390px) on desktop, or natural width on phone
  const screenWidth = Math.min(windowWidth, 390);
  const barWidth = screenWidth - H_PAD * 2;
  const tabWidth = (barWidth - BAR_PAD * 2) / visibleRoutes.length;
  const pillWidth = tabWidth * 0.86;

  const getPillX = (idx: number): number => {
    const safeIdx = Math.max(0, idx);
    return BAR_PAD + safeIdx * tabWidth + (tabWidth - pillWidth) / 2;
  };

  // ── Sliding liquid pill spring physics ───────────────────────────
  const pillAnim = useRef(
    new Animated.Value(getPillX(activeVisibleIndex >= 0 ? activeVisibleIndex : 0))
  ).current;

  useEffect(() => {
    if (activeVisibleIndex >= 0) {
      Animated.spring(pillAnim, {
        toValue: getPillX(activeVisibleIndex),
        useNativeDriver: true,
        tension: 320,
        friction: 26,
      }).start();
    }
  }, [activeVisibleIndex, tabWidth, pillWidth]);

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingBottom: Math.max(insets.bottom, 12) + 6 },
      ]}
      pointerEvents="box-none"
    >
      {/* Outer ambient & contact shadow wrapper (unclipped so drop shadows render smoothly) */}
      <View style={[styles.glassShadowWrapper, { width: barWidth }]}>
        {/* Rounded glass container with optical clipping */}
        <View style={styles.glassContainer}>
          {/* 1. Backdrop Frosted Blur (Native + Web) */}
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 85}
            tint="systemUltraThinMaterialLight"
            blurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />

          {/* 2. Frosted Milk / Linen Translucent Diffusion Layer */}
          <View style={styles.frostedDiffusion} pointerEvents="none" />

          {/* 3. Multi-Stop Specular Glass Curvature Sheen */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.78)',  // Top specular ambient light
              'rgba(255, 255, 255, 0.32)',  // Upper mid translucent glass
              'rgba(255, 255, 255, 0.08)',  // Central clear optical transmission
              'rgba(246, 245, 240, 0.32)',  // Bottom warm linen ambient reflection
            ]}
            locations={[0, 0.28, 0.72, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* 4. Beveled Razor Top Highlight (Physical Glass Lip Reflection) */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.1)',
              'rgba(255, 255, 255, 0.95)',
              'rgba(255, 255, 255, 0.95)',
              'rgba(255, 255, 255, 0.1)',
            ]}
            locations={[0, 0.18, 0.82, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.specularTopRim}
            pointerEvents="none"
          />

          {/* 5. Inner Micro-Glow Rim (Optical Refraction Boundary) */}
          <View style={styles.innerRefractionRim} pointerEvents="none" />

          {/* 6. Sliding Liquid Lens Active Pill */}
          {activeVisibleIndex >= 0 && (
            <Animated.View
              style={[
                styles.activePill,
                { width: pillWidth, transform: [{ translateX: pillAnim }] },
              ]}
              pointerEvents="none"
            >
              {/* Pill frosted gradient */}
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.92)',
                  'rgba(255, 255, 255, 0.65)',
                  'rgba(235, 233, 225, 0.55)',
                ]}
                locations={[0, 0.5, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Pill top specular sheen */}
              <View style={styles.pillSpecularRim} />
            </Animated.View>
          )}

          {/* 7. Tab interactive buttons */}
          <View style={styles.tabsRow}>
            {visibleRoutes.map((route, index) => {
              const isFocused = activeVisibleIndex === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <TabButton
                  key={route.key}
                  route={route}
                  index={index}
                  isFocused={isFocused}
                  tabWidth={tabWidth}
                  onPress={onPress}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    zIndex: 100,
  },
  glassShadowWrapper: {
    height: BAR_H,
    borderRadius: Radii.pill,
    // Multi-stage tactile ambient drop shadow
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.11,
    shadowRadius: 28,
    elevation: 12,
    backgroundColor: 'transparent',
  },
  glassContainer: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(190%) contrast(102%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%) contrast(102%)',
      } as any,
      default: {},
    }),
  },
  frostedDiffusion: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
  },
  specularTopRim: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    borderRadius: Radii.pill,
  },
  innerRefractionRim: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.05)',
  },
  activePill: {
    position: 'absolute',
    top: PILL_TOP,
    left: 0,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  pillSpecularRim: {
    position: 'absolute',
    top: 1,
    left: 8,
    right: 8,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: Radii.pill,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BAR_PAD,
  },
  tabItem: {
    height: BAR_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.25,
  },
  tabLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});
