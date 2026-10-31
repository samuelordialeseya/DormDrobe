import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WardrobeProvider } from './src/context/WardrobeContext';
import TabNavigator from './src/navigation/TabNavigator';
import DeviceFrame from './src/components/DeviceFrame';
import { Colors } from './src/theme/theme';
import { requestPersistentStorage } from './src/utils/storage';

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
  useEffect(() => {
    // Automatically ask Safari (iOS) and Chromium (Android) to mark storage as persistent
    requestPersistentStorage();

    // Lock document scroll so whole-page browser dragging/rubberbanding is blocked,
    // and completely eliminate browser scrollbar tracks for a native iOS/Android feel.
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      let styleEl = document.getElementById('dormdrobe-viewport-lock');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dormdrobe-viewport-lock';
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        html, body, #root {
          height: 100% !important;
          max-height: 100% !important;
          overflow: hidden !important;
          overscroll-behavior: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }

        /* Suppress all browser scrollbars across Chrome, Safari, Firefox, and Edge */
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0px !important;
          height: 0px !important;
          background: transparent !important;
        }

        /* Prevent text cursor / blue selection highlight when dragging on web */
        body {
          user-select: none;
          -webkit-user-select: none;
        }
        input, textarea {
          user-select: text;
          -webkit-user-select: text;
        }
      `;
    }
  }, []);

  return (
    <SafeAreaProvider>
      <DeviceFrame>
        <WardrobeProvider>
          <View style={styles.root}>
            <NavigationContainer theme={AppTheme}>
              <StatusBar style="dark" />
              <TabNavigator />
            </NavigationContainer>
          </View>
        </WardrobeProvider>
      </DeviceFrame>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
});
