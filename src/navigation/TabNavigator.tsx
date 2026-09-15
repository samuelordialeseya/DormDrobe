import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';

import ClosetScreen from '../screens/ClosetScreen';
import BatchActionScreen from '../screens/BatchActionScreen';
import FitGeneratorScreen from '../screens/FitGeneratorScreen';
import AddItemScreen from '../screens/AddItemScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#C4B5FD',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Closet"
        component={ClosetScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>👕</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Batch"
        component={BatchActionScreen}
        options={{
          tabBarLabel: 'Actions',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>🧺</Text>
          ),
        }}
      />
      <Tab.Screen
        name="FitGen"
        component={FitGeneratorScreen}
        options={{
          tabBarLabel: 'Fit Gen',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>🎲</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddItemScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>➕</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconActive]}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A1A28',
    borderTopColor: '#2A2A3E',
    borderTopWidth: 1,
    height: 85,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  icon: {
    fontSize: 22,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
});
