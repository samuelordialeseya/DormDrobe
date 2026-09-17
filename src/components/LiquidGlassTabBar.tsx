import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Shirt, Luggage, Sparkles, Settings } from 'lucide-react-native';
import { Radii } from '../theme/theme';

type TabDef = {
  name: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
};

const TABS: TabDef[] = [
  { name: 'Home', Icon: Home, label: 'Home' },
  { name: 'Closet', Icon: Shirt, label: 'Closet' },
  { name: 'Batch', Icon: Luggage, label: 'Actions' },
  { name: 'FitGen', Icon: Sparkles, label: 'Fit Gen' },
  { name: 'Settings', Icon: Settings, label: 'Settings' },
];

const PILL_H = 44;
const BAR_H = 64;
const H_PAD = 20;       // outerContainer paddingHorizontal
const BAR_PAD = 8;     // glassBar paddingHorizontal
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

  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.88)).current;
  const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0.45)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1 : 0.88,
        useNativeDriver: true,
        tension: 320,
        friction: 24,
      }),
      Animated.timing(opacityAnim, {
        toValue: isFocused ? 1 : 0.45,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const iconColor = isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.40)';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.tabItem, { width: tabWidth }]}
    >
      <Animated.View
        style={[
          styles.tabContent,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <IconComponent size={20} color={iconColor} strokeWidth={isFocused ? 2.2 : 1.8} />
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
  const pillWidth = tabWidth * 0.82;

  const getPillX = (idx: number): number => {
    const safeIdx = Math.max(0, idx);
    return BAR_PAD + safeIdx * tabWidth + (tabWidth - pillWidth) / 2;
  };

  // ── Sliding liquid pill ───────────────────────────────────────────
  const pillAnim = useRef(
    new Animated.Value(getPillX(activeVisibleIndex >= 0 ? activeVisibleIndex : 0))
  ).current;

  useEffect(() => {
    if (activeVisibleIndex >= 0) {
      Animated.spring(pillAnim, {
        toValue: getPillX(activeVisibleIndex),
        useNativeDriver: true,
        tension: 300,
        friction: 26,
      }).start();
    }
  }, [activeVisibleIndex, tabWidth, pillWidth]);

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingBottom: insets.bottom + 8 },
      ]}
    >
      <View style={[styles.glassBar, { width: barWidth }]}>
        {/* Sliding active pill — animates between tabs like liquid glass */}
        {activeVisibleIndex >= 0 && (
          <Animated.View
            style={[
              styles.activePill,
              { width: pillWidth, transform: [{ translateX: pillAnim }] },
            ]}
          />
        )}

        {/* Tab items */}
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
  },
  glassBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_H,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(28,28,30,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: BAR_PAD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 20,
  },
  activePill: {
    position: 'absolute',
    top: PILL_TOP,
    left: 0,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
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
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: 'rgba(255,255,255,0.95)',
  },
  tabLabelInactive: {
    color: 'rgba(255,255,255,0.40)',
  },
});
