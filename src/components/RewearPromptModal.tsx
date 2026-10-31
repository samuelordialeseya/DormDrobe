import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  ClothingItem,
  getWornCount,
  formatStatusLabel,
  formatTimes,
  isIntimatesItem,
  isSockItem,
} from '../types/wardrobe';
import { Colors, Radii, Spacing } from '../theme/theme';
import { useWardrobe } from '../context/WardrobeContext';
import PressableScale from './PressableScale';
import IntimatesMockupBadge from './IntimatesMockupBadge';
import { CategoryIcon, AlertTriangle } from './AppIcons';

interface PromptProps {
  visible: boolean;
  /** The already-worn pieces the user is about to wear again */
  items: ClothingItem[];
  onConfirm: () => void;
  onSendToLaundry: () => void;
  onCancel: () => void;
}

/**
 * "This piece has been worn X times — are you sure?" dialog.
 * Only ever shown for pieces that are already Worn; clean pieces never trigger it.
 */
export function RewearPromptModal({
  visible,
  items,
  onConfirm,
  onSendToLaundry,
  onCancel,
}: PromptProps) {
  const isSingle = items.length === 1;
  const single = isSingle ? items[0] : null;
  const singleCount = single ? getWornCount(single) : 0;

  const title = single
    ? `Worn ${formatTimes(singleCount)} already`
    : `${items.length} pieces already worn`;

  const body = single
    ? `${single.name} has been worn ${formatTimes(singleCount)} since its last wash. Are you sure you want to wear it again?`
    : 'These pieces have been worn since their last wash. Are you sure you want to wear them again?';

  const confirmLabel = single ? 'Yes, wear it again' : 'Yes, wear them again';
  const confirmSub = single ? `Becomes Worn · ${singleCount + 1}x` : null;
  const laundryLabel = single ? 'Send to laundry instead' : 'Send worn pieces to laundry';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <AlertTriangle size={20} color={Colors.statusWorn} strokeWidth={2.4} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {items.map((it) => (
              <View key={it.id} style={styles.row}>
                <View style={styles.thumb}>
                  {isIntimatesItem(it) ? (
                    <IntimatesMockupBadge item={it} variant="thumb" size={40} />
                  ) : it.imageUrl ? (
                    <Image source={{ uri: it.imageUrl }} style={styles.thumbImg} resizeMode="contain" />
                  ) : (
                    <CategoryIcon
                      category={isSockItem(it) ? 'socks' : it.category}
                      size={20}
                      color={Colors.textSecondary}
                    />
                  )}
                </View>
                <Text style={styles.rowName} numberOfLines={1}>
                  {it.name}
                </Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{formatStatusLabel('worn', getWornCount(it))}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <PressableScale onPress={onConfirm} scaleTo={0.97} style={styles.fullWidth}>
            <View style={styles.primaryBtn}>
              <Text style={styles.primaryText}>{confirmLabel}</Text>
              {confirmSub && <Text style={styles.primarySub}>{confirmSub}</Text>}
            </View>
          </PressableScale>

          <PressableScale onPress={onSendToLaundry} scaleTo={0.97} style={styles.fullWidth}>
            <View style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>{laundryLabel}</Text>
            </View>
          </PressableScale>

          <PressableScale onPress={onCancel} scaleTo={0.96} style={styles.cancelWrap}>
            <Text style={styles.cancelText}>Cancel</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

interface RewearRequest {
  /** Pieces about to be worn. Only the ones already Worn are shown in the prompt. */
  items: ClothingItem[];
  /** The user confirmed (or nothing needed confirming). Runs the actual wear action. */
  onConfirm: () => void;
  /** Called after worn pieces were sent to laundry instead (ids of those pieces). */
  onSentToLaundry?: (ids: string[]) => void;
  /** Called when the user backs out. */
  onCancel?: () => void;
}

/**
 * Shared re-wear confirmation for every place a piece can be worn
 * (Guided Fit, Fit Gen, Lookbook, Closet card, detail sheet).
 *
 * - All pieces clean → `onConfirm` runs straight away, no prompt.
 * - Any piece already Worn → prompt first.
 *
 * Render `rewearModal` once in the calling component.
 */
export function useRewearPrompt() {
  const { batchSetStatusByIds } = useWardrobe();
  const [pending, setPending] = useState<RewearRequest | null>(null);
  // Keep the last request around so the fade-out doesn't flash an empty dialog
  const [shown, setShown] = useState<ClothingItem[]>([]);

  const requestWear = useCallback((req: RewearRequest) => {
    const worn = req.items.filter((it) => it.status === 'worn');
    if (worn.length === 0) {
      req.onConfirm();
      return;
    }
    setShown(worn);
    setPending(req);
  }, []);

  const close = useCallback(() => setPending(null), []);

  const handleConfirm = useCallback(() => {
    const req = pending;
    setPending(null);
    req?.onConfirm();
  }, [pending]);

  const handleLaundry = useCallback(() => {
    const req = pending;
    setPending(null);
    if (!req) return;
    const wornIds = req.items.filter((it) => it.status === 'worn').map((it) => it.id);
    batchSetStatusByIds(
      wornIds,
      'in_laundry',
      wornIds.length === 1
        ? `${req.items.find((it) => it.id === wornIds[0])?.name ?? 'Piece'} moved to Laundry`
        : `Moved ${wornIds.length} worn pieces to Laundry`,
    );
    req.onSentToLaundry?.(wornIds);
  }, [pending, batchSetStatusByIds]);

  const handleCancel = useCallback(() => {
    const req = pending;
    close();
    req?.onCancel?.();
  }, [pending, close]);

  const rewearModal = (
    <RewearPromptModal
      visible={!!pending}
      items={shown}
      onConfirm={handleConfirm}
      onSendToLaundry={handleLaundry}
      onCancel={handleCancel}
    />
  );

  return { requestWear, rewearModal };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 20, 19, 0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.bgBase,
    borderRadius: Radii.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  body: {
    color: Colors.textTertiary,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.lg,
  },
  listScroll: {
    alignSelf: 'stretch',
    maxHeight: 190,
    marginBottom: Spacing.lg,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 8,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: {
    width: '90%',
    height: '90%',
  },
  rowName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  countPill: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderRadius: Radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countPillText: {
    color: Colors.statusWorn,
    fontSize: 11,
    fontWeight: '700',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  primarySub: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
  secondaryBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: Colors.statusLaundry,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cancelWrap: {
    alignItems: 'center',
    paddingVertical: 14,
    alignSelf: 'stretch',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
