import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radii } from '../theme/theme';

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
      <View style={styles.glassBar}>
        {/* Specular top edge */}
        <View style={styles.topHighlight} />

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
              activeOpacity={0.6}
              style={styles.tabItem}
            >
              {/* Active pill — neutral white tint, no color */}
              {isFocused && <View style={styles.activePill} />}

              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabIcon,
                    { opacity: isFocused ? 1 : 0.38 },
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
    paddingHorizontal: 20,
  },
  glassBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 64,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(28,28,30,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    // NO overflow:hidden — would clip the activePill on Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 20,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderTopLeftRadius: Radii.pill,
    borderTopRightRadius: Radii.pill,
    // Prevent topHighlight from clipping outside the bar
    zIndex: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    // Bar height 64, pill height 42 → top = (64-42)/2 = 11
    top: 11,
    // pill width 44, but we center via alignItems on tabItem
    // Use left/right to center within the flex item
    left: '10%',
    right: '10%',
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  tabContent: {
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: 'rgba(255,255,255,0.88)',
  },
  tabLabelInactive: {
    color: 'rgba(255,255,255,0.32)',
  },
});
