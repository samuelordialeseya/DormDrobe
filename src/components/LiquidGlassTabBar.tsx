import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii } from '../theme/theme';

type TabDef = {
  name: string;
  icon: string;
  label: string;
};

const TABS: TabDef[] = [
  { name: 'Closet', icon: '👕', label: 'Closet' },
  { name: 'Batch', icon: '🧺', label: 'Actions' },
  { name: 'FitGen', icon: '✨', label: 'Fit Gen' },
  { name: 'Add', icon: '＋', label: 'Add' },
  { name: 'Settings', icon: '⚙', label: 'Settings' },
];

export default function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outerContainer, { paddingBottom: insets.bottom + 8 }]}>
      {/* Pill-shaped liquid glass bar */}
      <View style={styles.glassBar}>
        {/* Top specular highlight */}
        <View style={styles.topHighlight} />
        {/* Inner glow */}
        <View style={styles.innerGlow} />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];

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
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              {/* Active indicator pill */}
              {isFocused && (
                <View style={styles.activePill}>
                  <View style={styles.activePillGlow} />
                </View>
              )}

              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabIcon,
                    isFocused ? styles.tabIconActive : styles.tabIconInactive,
                  ]}
                >
                  {tab.icon}
                </Text>
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
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
    paddingHorizontal: 16,
    // No background — lets the screen content show through
  },
  glassBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 64,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(18,16,30,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 8,
    overflow: 'hidden',
    // Shadow/glow
    shadowColor: Colors.purple500,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderTopLeftRadius: Radii.pill,
    borderTopRightRadius: Radii.pill,
  },
  innerGlow: {
    position: 'absolute',
    top: 1,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderTopLeftRadius: Radii.pill,
    borderTopRightRadius: Radii.pill,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -22 }],
    width: 48,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139,92,246,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.40)',
    overflow: 'hidden',
  },
  activePillGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(196,181,253,0.6)',
  },
  tabContent: {
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabIconInactive: {
    opacity: 0.45,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: Colors.purple300,
  },
  tabLabelInactive: {
    color: 'rgba(255,255,255,0.38)',
  },
});
