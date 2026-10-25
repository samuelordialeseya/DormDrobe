import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DIRTY_STATUSES, UnpackStatusAction } from '../types/wardrobe';
import { Colors, Radii, Spacing } from '../theme/theme';
import { useWardrobe } from '../context/WardrobeContext';
import PressableScale from './PressableScale';

interface PromptProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet shown on "Unpack" when the Transit Bag holds worn / in-laundry pieces.
 * Lets the user decide what happens to those pieces' status as they leave the bag.
 */
export function UnpackPromptModal({ visible, onClose }: PromptProps) {
  const insets = useSafeAreaInsets();
  const { items, currentLocation, unpackTransitBag, getLocationLabel } = useWardrobe();

  const bagItems = items.filter((it) => it.location === 'in_transit_bag');
  const dirtyCount = bagItems.filter((it) => DIRTY_STATUSES.includes(it.status)).length;
  const cleanCount = bagItems.length - dirtyCount;
  const place = getLocationLabel(currentLocation);

  const choose = (action: UnpackStatusAction) => {
    onClose();
    unpackTransitBag(currentLocation, action);
  };

  const options: { action: UnpackStatusAction; title: string; sub: string; color: string }[] = [
    {
      action: 'clean',
      title: 'Mark all clean',
      sub: `These were washed — ${dirtyCount} dirty piece${dirtyCount === 1 ? '' : 's'} become Clean & Ready`,
      color: Colors.statusClean,
    },
    {
      action: 'in_laundry',
      title: 'Send dirty ones to laundry',
      sub: `I'm washing them at ${place} — ${dirtyCount} piece${dirtyCount === 1 ? '' : 's'} go to Laundry`,
      color: Colors.statusLaundry,
    },
    {
      action: 'keep',
      title: 'Keep as they are',
      sub: 'Only move them — statuses stay the same',
      color: Colors.textTertiary,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.handle} />

          <Text style={styles.title}>
            Unpack {bagItems.length} item{bagItems.length === 1 ? '' : 's'} to {place}
          </Text>
          <Text style={styles.subtitle}>
            {cleanCount} clean · {dirtyCount} worn / dirty. What should happen to the dirty ones?
          </Text>

          <View style={styles.optionList}>
            {options.map((opt) => (
              <PressableScale
                key={opt.action}
                onPress={() => choose(opt.action)}
                scaleTo={0.97}
              >
                <View style={styles.option}>
                  <View style={[styles.optionDot, { backgroundColor: opt.color }]} />
                  <View style={styles.optionBody}>
                    <Text style={styles.optionTitle}>{opt.title}</Text>
                    <Text style={styles.optionSub}>{opt.sub}</Text>
                  </View>
                </View>
              </PressableScale>
            ))}
          </View>

          <PressableScale onPress={onClose} scaleTo={0.96} style={styles.cancelWrap}>
            <Text style={styles.cancelText}>Cancel</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Shared "Unpack" behaviour for Home and Closet.
 * - Bag has only clean pieces → unpacks immediately in one tap.
 * - Bag has worn / laundry pieces → opens the prompt first.
 * Render `unpackModal` once somewhere in the calling screen.
 */
export function useUnpackFlow() {
  const { items, currentLocation, unpackTransitBag } = useWardrobe();
  const [visible, setVisible] = useState(false);

  const requestUnpack = useCallback(() => {
    const bag = items.filter((it) => it.location === 'in_transit_bag');
    if (bag.length === 0) return;
    const hasDirty = bag.some((it) => DIRTY_STATUSES.includes(it.status));
    if (hasDirty) {
      setVisible(true);
    } else {
      unpackTransitBag(currentLocation, 'keep');
    }
  }, [items, currentLocation, unpackTransitBag]);

  const unpackModal = (
    <UnpackPromptModal visible={visible} onClose={() => setVisible(false)} />
  );

  return { requestUnpack, unpackModal };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 20, 19, 0.45)',
  },
  sheet: {
    backgroundColor: Colors.bgBase,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(20, 20, 19, 0.15)',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  optionList: {
    gap: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionBody: {
    flex: 1,
  },
  optionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  optionSub: {
    color: Colors.textTertiary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  cancelWrap: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: Spacing.xs,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
