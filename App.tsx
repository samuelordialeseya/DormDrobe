import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WardrobeProvider } from './src/context/WardrobeContext';
import TabNavigator from './src/navigation/TabNavigator';
import DeviceFrame from './src/components/DeviceFrame';

// Override nav theme background to match our design
const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0A0A0A',
    card: '#0A0A0A',
    border: 'transparent',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <WardrobeProvider>
        <DeviceFrame>
          <View style={styles.root}>
            <NavigationContainer theme={AppTheme}>
              <StatusBar style="light" />
              <TabNavigator />
            </NavigationContainer>
          </View>
        </DeviceFrame>
      </WardrobeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
});
