import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Radii, Spacing } from '../theme/theme';
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
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (toast) {
      // Clear any prior timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // Spring entrance
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 300,
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
          tension: 340,
          friction: 22,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss with asymmetric quick exit (160ms)
      const duration = toast.duration ?? 3400;
      timerRef.current = setTimeout(() => {
        dismissWithAnimation();
      }, duration);
    } else {
      translateY.setValue(30);
      opacity.setValue(0);
      scale.setValue(0.94);
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
        toValue: 16,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!toast) return null;

  const renderIcon = () => {
    if (toast.type === 'warning') {
      return <AlertTriangle size={15} color="#D97706" strokeWidth={2.4} />;
    }
    if (toast.type === 'info') {
      return <Info size={15} color="#3B82F6" strokeWidth={2.4} />;
    }
    return <Check size={15} color="#16A34A" strokeWidth={2.8} />;
  };

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Animated.View
        style={[
          styles.toastPill,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={styles.specular} />
        <View style={styles.iconWrap}>{renderIcon()}</View>
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
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
    bottom: 84, // Sits right above the floating liquid glass tab bar
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 19, 0.96)',
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 9,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    maxWidth: 380,
    overflow: 'hidden',
    position: 'relative',
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  actionBtn: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
