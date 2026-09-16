import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
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

const PILL_H = 44;
const BAR_H = 64;
const H_PAD = 20;       // outerContainer paddingHorizontal
const BAR_PAD = 8;     // glassBar paddingHorizontal
const SCREEN_W = Dimensions.get('window').width;
const BAR_W = SCREEN_W - H_PAD * 2;
const TAB_W = (BAR_W - BAR_PAD * 2) / TABS.length;
const PILL_W = TAB_W * 0.82;
const PILL_TOP = (BAR_H - PILL_H) / 2;

function pillX(index: number): number {
  return BAR_PAD + index * TAB_W + (TAB_W - PILL_W) / 2;
}

interface TabButtonProps {
  route: any;
  index: number;
  isFocused: boolean;
  onPress: () => void;
}

function TabButton({ route, isFocused, onPress }: TabButtonProps) {
  const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];

  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.88)).current;
  const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0.38)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1 : 0.88,
        useNativeDriver: true,
        tension: 320,
        friction: 24,
      }),
      Animated.timing(opacityAnim, {
        toValue: isFocused ? 1 : 0.38,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.tabContent,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <Text style={styles.tabIcon}>{tab.icon}</Text>
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

  // ── Sliding liquid pill ───────────────────────────────────────────
  const pillAnim = useRef(new Animated.Value(pillX(state.index))).current;

  useEffect(() => {
    Animated.spring(pillAnim, {
      toValue: pillX(state.index),
      useNativeDriver: true,
      tension: 300,
      friction: 26,
    }).start();
  }, [state.index]);

  return (
    <View
      style={[
        styles.outerContainer,
        { paddingBottom: insets.bottom + 8 },
      ]}
    >
      <View style={styles.glassBar}>
        {/* Sliding active pill — animates between tabs like liquid glass */}
        <Animated.View
          style={[
            styles.activePill,
            { transform: [{ translateX: pillAnim }] },
          ]}
        />

        {/* Tab items */}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

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
    width: BAR_W,
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
    width: PILL_W,
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
    width: TAB_W,
    height: BAR_H,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: 'rgba(255,255,255,0.95)',
  },
  tabLabelInactive: {
    color: 'rgba(255,255,255,0.32)',
  },
});
