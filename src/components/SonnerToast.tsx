import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radii, Spacing } from '../theme/theme';
import { Check, AlertTriangle, Info } from './AppIcons';

export interface ToastConfig {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
  action?: {
    label: string;
    onPress: () => void;
  };
  duration?: number;
}

interface Props {
  toast: ToastConfig | null;
  onDismiss: () => void;
}

export default function SonnerToast({ toast, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Directional top-down physics: dynamic capsule drops gracefully from above
  const translateY = useRef(new Animated.Value(-32)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const timerRef = useRef<any>(null);

  // Responsive top positioning:
  // - On mobile devices (iOS/Android): respect hardware safe area insets (sits right below notch/Dynamic Island)
  // - On web desktop inside iPhone simulator frame (windowWidth > 500): sits 50px down (just below simulated 44px notch)
  // - On mobile web without safe-area inset: safe 16px top margin
  const isDesktop = windowWidth > 500;
  const topOffset = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'web' && isDesktop ? 50 : 16);

  useEffect(() => {
    if (toast) {
      if (timerRef.current) clearTimeout(timerRef.current);

      // Spring entrance: descend fluidly from the top
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 320,
          friction: 24,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 360,
          friction: 22,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss with asymmetric quick exit
      const duration = toast.duration ?? 3200;
      timerRef.current = setTimeout(() => {
        dismissWithAnimation();
      }, duration);
    } else {
      translateY.setValue(-32);
      opacity.setValue(0);
      scale.setValue(0.92);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  const dismissWithAnimation = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -24,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  // Swipe up to dismiss gesture support
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy < -6,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -6) {
          dismissWithAnimation();
        }
      },
    })
  ).current;

  if (!toast) return null;

  const renderIcon = () => {
    if (toast.type === 'warning') {
      return <AlertTriangle size={14} color="#FBBF24" strokeWidth={2.4} />;
    }
    if (toast.type === 'info') {
      return <Info size={14} color="#60A5FA" strokeWidth={2.4} />;
    }
    return <Check size={14} color="#4ADE80" strokeWidth={2.8} />;
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { top: topOffset }]}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.toastPill,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={styles.specular} />
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={dismissWithAnimation}
          style={styles.pillContent}
        >
          <View
            style={[
              styles.iconWrap,
              toast.type === 'warning' && styles.iconWrapWarning,
              toast.type === 'info' && styles.iconWrapInfo,
              (!toast.type || toast.type === 'success') && styles.iconWrapSuccess,
            ]}
          >
            {renderIcon()}
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </TouchableOpacity>

        {toast.action && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              toast.action?.onPress();
              dismissWithAnimation();
            }}
            style={styles.actionBtn}
          >
            <Text style={styles.actionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
    zIndex: 10001,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 19, 0.94)',
    borderRadius: Radii.pill,
    paddingLeft: 12,
    paddingRight: 14,
    paddingVertical: 9,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    maxWidth: 390,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      } as any,
      default: {},
    }),
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexShrink: 1,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  iconWrapWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.20)',
  },
  iconWrapInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.20)',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.15,
    flexShrink: 1,
  },
  actionBtn: {
    marginLeft: 4,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
