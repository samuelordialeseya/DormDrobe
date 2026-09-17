import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WardrobeProvider } from './src/context/WardrobeContext';
import TabNavigator from './src/navigation/TabNavigator';
import DeviceFrame from './src/components/DeviceFrame';
import { Colors } from './src/theme/theme';

// Override nav theme background to match our Apple Frost light design
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.bgBase,
    card: '#FFFFFF',
    text: Colors.textPrimary,
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
              <StatusBar style="dark" />
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
    backgroundColor: Colors.bgBase,
  },
});
