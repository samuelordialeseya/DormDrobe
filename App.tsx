import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WardrobeProvider } from './src/context/WardrobeContext';
import TabNavigator from './src/navigation/TabNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <WardrobeProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <TabNavigator />
        </NavigationContainer>
      </WardrobeProvider>
    </SafeAreaProvider>
  );
}
