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
import { useWardrobe } from '../context/WardrobeContext';

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
  const { isWearWizardSession } = useWardrobe();

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
  const morphAnim = useRef(new Animated.Value(0)).current;
  const prevIndexRef = useRef(activeVisibleIndex);

  useEffect(() => {
    if (activeVisibleIndex >= 0) {
      const changed = prevIndexRef.current !== activeVisibleIndex;
      prevIndexRef.current = activeVisibleIndex;

      Animated.spring(pillAnim, {
        toValue: getPillX(activeVisibleIndex),
        useNativeDriver: true,
        tension: 320,
        friction: 26,
      }).start();

      if (changed) {
        morphAnim.setValue(0);
        Animated.sequence([
          Animated.timing(morphAnim, {
            toValue: 1,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.spring(morphAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 280,
            friction: 18,
          }),
        ]).start();
      }
    }
  }, [activeVisibleIndex, tabWidth, pillWidth]);

  const pillScaleX = morphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const pillScaleY = morphAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.94],
  });

  if (isWearWizardSession) {
    return null;
  }

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingBottom: Math.max(insets.bottom, 12) + 6 },
      ]}
      pointerEvents="box-none"
    >
      {/* Outer ambient & contact shadow wrapper + dark refractive hairline edge */}
      <View style={[styles.glassShadowWrapper, { width: barWidth }]}>
        {/* Rounded glass container with optical clipping */}
        <View style={styles.glassContainer}>
          {/* 1. Native Backdrop Frosted Blur (Skipped on web to avoid expo-blur's opaque white fill) */}
          {Platform.OS !== 'web' && (
            <BlurView
              intensity={Platform.OS === 'ios' ? 48 : 60}
              tint="systemUltraThinMaterial"
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* 2. Smoked-Quartz / Mineral Optical Base (Ultra-sheer so background colors bleed through) */}
          <View style={styles.frostedDiffusion} pointerEvents="none" />

          {/* 3. Cylindrical Lens Vertical Refraction (Crisp top catch, clear core, shadowed floor) */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.50)',  // Top specular surface catch
              'rgba(255, 255, 255, 0.05)',  // Upper clear lens transition
              'rgba(198, 195, 186, 0.08)',  // Central crystal-clear smoky optical transmission
              'rgba(20, 20, 19, 0.065)',    // Lower cylinder refraction depth shadow
              'rgba(255, 255, 255, 0.26)',  // Bottom glass floor caustic bounce
            ]}
            locations={[0, 0.18, 0.54, 0.86, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* 4. Diagonal Prismatic Dispersion Sheen (Subtle cold-forged crystal shimmer) */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.22)',
              'rgba(210, 225, 255, 0.08)',
              'rgba(255, 255, 255, 0.00)',
              'rgba(255, 244, 228, 0.14)',
            ]}
            locations={[0, 0.32, 0.68, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* 5. Beveled Razor Top Highlight (Physical Glass Lip Reflection) */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.08)',
              'rgba(255, 255, 255, 0.92)',
              'rgba(255, 255, 255, 0.92)',
              'rgba(255, 255, 255, 0.08)',
            ]}
            locations={[0, 0.16, 0.84, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.specularTopRim}
            pointerEvents="none"
          />

          {/* 6. Bottom Caustic Lip Highlight */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.04)',
              'rgba(255, 255, 255, 0.55)',
              'rgba(255, 255, 255, 0.04)',
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.specularBottomRim}
            pointerEvents="none"
          />

          {/* 7. Inner Specular Refraction Ring */}
          <View style={styles.innerRefractionRim} pointerEvents="none" />

          {/* 8. Sliding Liquid Droplet Lens Active Pill */}
          {activeVisibleIndex >= 0 && (
            <Animated.View
              style={[
                styles.activePill,
                {
                  width: pillWidth,
                  transform: [
                    { translateX: pillAnim },
                    { scaleX: pillScaleX },
                    { scaleY: pillScaleY },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              {/* Translucent water-droplet lens gradient */}
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.56)',
                  'rgba(255, 255, 255, 0.16)',
                  'rgba(20, 20, 19, 0.03)',
                  'rgba(255, 255, 255, 0.38)',
                ]}
                locations={[0, 0.42, 0.78, 1]}
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
    borderWidth: 1,
    borderColor: 'rgba(20, 20, 19, 0.085)',
    // Multi-stage tactile ambient drop shadow
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 12,
    backgroundColor: 'transparent',
  },
  glassContainer: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.58)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px) saturate(200%) contrast(104%) brightness(95.5%)',
        WebkitBackdropFilter: 'blur(20px) saturate(200%) contrast(104%) brightness(95.5%)',
        boxShadow:
          'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.90), inset 0 -1.5px 2.5px rgba(20, 20, 19, 0.08), inset 0 0 14px rgba(255, 255, 255, 0.14)',
      } as any,
      default: {},
    }),
  },
  frostedDiffusion: {
    ...StyleSheet.absoluteFill,
    // Smoked-quartz mineral tint (22% alpha instead of heavy white) so white speculars pop and content blurs through
    backgroundColor: 'rgba(210, 207, 198, 0.22)',
  },
  specularTopRim: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 1.5,
    borderRadius: Radii.pill,
  },
  specularBottomRim: {
    position: 'absolute',
    bottom: 0,
    left: 26,
    right: 26,
    height: 1,
    borderRadius: Radii.pill,
  },
  innerRefractionRim: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  activePill: {
    position: 'absolute',
    top: PILL_TOP,
    left: 0,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    ...Platform.select({
      web: {
        boxShadow:
          '0 4px 12px rgba(20, 20, 19, 0.07), inset 0 1.5px 1px rgba(255, 255, 255, 0.92), inset 0 -1px 1.5px rgba(20, 20, 19, 0.06)',
      } as any,
      default: {},
    }),
  },
  pillSpecularRim: {
    position: 'absolute',
    top: 0.5,
    left: 10,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
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
