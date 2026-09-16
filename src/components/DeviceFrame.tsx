import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';

interface Props {
  children: React.ReactNode;
}

export default function DeviceFrame({ children }: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = windowWidth > 500;

  // View mode on PC: 'iphone' (390x844) or 'fullscreen'
  const [viewMode, setViewMode] = useState<'iphone' | 'fullscreen'>('iphone');

  // If on actual mobile phone or small viewport, render native 100% full screen
  if (!isDesktop) {
    return <View style={styles.nativeContainer}>{children}</View>;
  }

  const isIPhoneMode = viewMode === 'iphone';

  // iPhone 13 Dimensions
  const IPHONE_WIDTH = 390;
  const IPHONE_HEIGHT = 844;
  // Fit nicely inside browser height with clearance for top switcher
  const frameHeight = Math.min(IPHONE_HEIGHT, windowHeight - 64);

  return (
    <View style={styles.desktopCanvas}>
      {/* Top Viewport Mode Switcher */}
      <View style={styles.desktopHeader}>
        <View style={styles.viewSwitcher}>
          <TouchableOpacity
            onPress={() => setViewMode('iphone')}
            style={[styles.switchBtn, isIPhoneMode && styles.switchBtnActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.switchText, isIPhoneMode && styles.switchTextActive]}>
              📱 iPhone 13 (390 × 844)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('fullscreen')}
            style={[styles.switchBtn, !isIPhoneMode && styles.switchBtnActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.switchText, !isIPhoneMode && styles.switchTextActive]}>
              💻 Full PC View
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Container */}
      <View
        style={[
          styles.frameWrapper,
          isIPhoneMode
            ? {
                width: IPHONE_WIDTH,
                height: frameHeight,
                borderRadius: 48,
                borderWidth: 4,
                borderColor: '#25252A',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 24 },
                shadowOpacity: 0.85,
                shadowRadius: 40,
                elevation: 25,
              }
            : styles.fullscreenFrame,
        ]}
      >
        {/* iPhone 13 Notch & iOS Status Bar (active only in iPhone mode) */}
        {isIPhoneMode && (
          <View pointerEvents="none" style={styles.topChrome}>
            {/* Notch */}
            <View style={styles.notch}>
              <View style={styles.speaker} />
              <View style={styles.camera} />
            </View>

            {/* iOS Status Bar */}
            <View style={styles.statusBar}>
              <Text style={styles.statusTime}>9:41</Text>
              <View style={styles.statusIcons}>
                {/* Cellular signal bars */}
                <View style={styles.signalBars}>
                  <View style={[styles.signalBar, { height: 4 }]} />
                  <View style={[styles.signalBar, { height: 6 }]} />
                  <View style={[styles.signalBar, { height: 8 }]} />
                  <View style={[styles.signalBar, { height: 10 }]} />
                </View>
                {/* 5G label */}
                <Text style={styles.networkText}>5G</Text>
                {/* Battery icon */}
                <View style={styles.batteryOuter}>
                  <View style={styles.batteryFill} />
                  <View style={styles.batteryCap} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Application Content */}
        <View style={[styles.appContent, isIPhoneMode && styles.appContentIPhone]}>
          {children}
        </View>

        {/* iPhone Home Indicator Bar */}
        {isIPhoneMode && (
          <View pointerEvents="none" style={styles.homeIndicatorWrapper}>
            <View style={styles.homeIndicator} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  desktopCanvas: {
    flex: 1,
    backgroundColor: '#070709',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  desktopHeader: {
    marginBottom: 10,
    alignItems: 'center',
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(28,28,30,0.85)',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  switchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  switchBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  switchText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600',
  },
  switchTextActive: {
    color: '#FFFFFF',
  },
  frameWrapper: {
    position: 'relative',
    backgroundColor: '#0A0A0A',
  },
  fullscreenFrame: {
    width: '100%',
    maxWidth: 900,
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    zIndex: 9999,
  },
  notch: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -77,
    width: 154,
    height: 28,
    backgroundColor: '#000000',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  speaker: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1C1C20',
  },
  camera: {
    position: 'absolute',
    right: 32,
    top: 9,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0B0B14',
    borderWidth: 1,
    borderColor: '#191924',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 10,
  },
  statusTime: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 10,
  },
  signalBar: {
    width: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 0.8,
  },
  networkText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginRight: 2,
  },
  batteryOuter: {
    width: 22,
    height: 11,
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    padding: 1.5,
    position: 'relative',
    justifyContent: 'center',
  },
  batteryFill: {
    height: '100%',
    width: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  batteryCap: {
    position: 'absolute',
    right: -3,
    width: 2,
    height: 4,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  appContent: {
    flex: 1,
  },
  appContentIPhone: {
    paddingTop: 8,
  },
  homeIndicatorWrapper: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  homeIndicator: {
    width: 134,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
