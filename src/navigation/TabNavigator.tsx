import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import ClosetScreen from '../screens/ClosetScreen';
import BatchActionScreen from '../screens/BatchActionScreen';
import FitGeneratorScreen from '../screens/FitGeneratorScreen';
import AddItemScreen from '../screens/AddItemScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LiquidGlassTabBar from '../components/LiquidGlassTabBar';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Closet" component={ClosetScreen} />
      <Tab.Screen name="Batch" component={BatchActionScreen} />
      <Tab.Screen name="FitGen" component={FitGeneratorScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen
        name="Add"
        component={AddItemScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
}
