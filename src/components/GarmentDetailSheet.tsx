import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Easing,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ClothingItem,
  Location,
  Status,
  LOCATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  CATEGORY_LABELS,
  isSockItem,
  isIntimatesItem,
  getWornCount,
  formatTimes,
} from '../types/wardrobe';
import IntimatesMockupBadge from './IntimatesMockupBadge';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import { useWardrobe } from '../context/WardrobeContext';
import PressableScale from './PressableScale';
import StatusBadge from './StatusBadge';
import { useRewearPrompt } from './RewearPromptModal';
import {
  CategoryIcon,
  LocationIcon,
  X,
  Trash2,
  Edit3,
  Clock,
  Check,
  Copy,
} from './AppIcons';

interface Props {
  item: ClothingItem | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (item: ClothingItem) => void;
}

const ALL_STATUSES: Status[] = ['clean', 'worn', 'in_laundry'];
const ALL_LOCATIONS: Location[] = ['batangas_dorm', 'calamba_home', 'in_transit_bag'];

const COLOR_MAP: Record<string, string> = {
  white: '#F8F8FA',
  black: '#1C1C1E',
  navy: '#1B2A4A',
  gray: '#8E8E93',
  grey: '#8E8E93',
  khaki: '#C3B091',
  olive: '#6B7C45',
  brown: '#8B5E3C',
  blue: '#3478F6',
  green: '#30D158',
  yellow: '#FFD60A',
  orange: '#FF9F0A',
  pink: '#FF375F',
  purple: '#BF5AF2',
  beige: '#D4C4A8',
};

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Never worn yet';
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Worn today';
  if (diffDays === 1) return 'Worn yesterday';
  if (diffDays < 7) return `Worn ${diffDays} days ago`;
  if (diffDays < 30) return `Worn ${Math.floor(diffDays / 7)}w ago`;
  return `Last worn ${new Date(isoString).toLocaleDateString()}`;
}

export default function GarmentDetailSheet({ item, visible, onClose, onEdit }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { updateItem, deleteItem, duplicateItem, addItem, showToast, getLocationLabel, wearItemAgain } =
    useWardrobe();
  const { requestWear, rewearModal } = useRewearPrompt();

  // Start just below the viewport fold (~540-620px), avoiding wasted off-screen travel
  const SHEET_OFFSCREEN = Math.min(Math.max(windowHeight * 0.8, 500), 620);
  const sheetOffscreenRef = useRef(SHEET_OFFSCREEN);
  sheetOffscreenRef.current = SHEET_OFFSCREEN;

  // Bottom sheet animations - start off-screen
  const translateY = useRef(new Animated.Value(SHEET_OFFSCREEN)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Retain active item and modal state so exit animations can complete smoothly
  const [displayedItem, setDisplayedItem] = useState<ClothingItem | null>(item);
  const [modalVisible, setModalVisible] = useState(visible && !!item);
  const isClosing = useRef(false);

  // Active item reference (persists during exit animation even if parent resets prop)
  const activeItem = item ?? displayedItem;

  // Local drafts for fields that can be edited inside the card
  const [draftStatus, setDraftStatus] = useState<Status>(item?.status ?? 'clean');
  const [draftLocation, setDraftLocation] = useState<Location>(item?.location ?? 'batangas_dorm');
  const [notesText, setNotesText] = useState(item?.notes || '');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSaveBtn, setShowSaveBtn] = useState(false);

  // Auto-pop save button animation
  const savePopAnim = useRef(new Animated.Value(0)).current;

  // Track changes against original item
  const hasStatusChanged = !!activeItem && draftStatus !== activeItem.status;
  const hasLocationChanged = !!activeItem && draftLocation !== activeItem.location;
  const hasNotesChanged = !!activeItem && notesText.trim() !== (activeItem.notes || '').trim();
  const hasChanges = hasStatusChanged || hasLocationChanged || hasNotesChanged;
  const changeCount =
    (hasStatusChanged ? 1 : 0) + (hasLocationChanged ? 1 : 0) + (hasNotesChanged ? 1 : 0);

  // Fast, crisp exit animation sliding down out of the viewport
  const animateClose = useCallback(
    (callback?: () => void) => {
      if (isClosing.current) return;
      isClosing.current = true;

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: sheetOffscreenRef.current,
          duration: 170,
          easing: Easing.bezier(0.32, 0.72, 0, 1), // snappy drawer sweep down
          useNativeDriver: true,
        }),
      ]).start(() => {
        isClosing.current = false;
        setModalVisible(false);
        if (callback) {
          callback();
        }
        onClose();
      });
    },
    [onClose],
  );

  // Fast, smooth entrance animation coming from the bottom
  useEffect(() => {
    if (visible && item) {
      isClosing.current = false;
      setDisplayedItem(item);
      setModalVisible(true);
      setDraftStatus(item.status);
      setDraftLocation(item.location);
      setNotesText(item.notes || '');
      setEditingNotes(false);
      setSavedSuccess(false);
      setShowSaveBtn(false);
      savePopAnim.setValue(0);

      // Reset to off-screen bottom before gliding up
      translateY.stopAnimation();
      backdropOpacity.stopAnimation();
      translateY.setValue(sheetOffscreenRef.current);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 170,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          easing: Easing.bezier(0.23, 1, 0.32, 1), // high-momentum strong ease-out
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!visible && modalVisible && !isClosing.current) {
      // Parent changed visible to false externally
      animateClose();
    }
  }, [visible, item?.id, animateClose, modalVisible]);

  // Spring animation for auto-popping the save button beside the close button
  useEffect(() => {
    if (hasChanges) {
      setShowSaveBtn(true);
      Animated.spring(savePopAnim, {
        toValue: 1,
        tension: 320,
        friction: 20,
        useNativeDriver: true,
      }).start();
    } else if (showSaveBtn) {
      Animated.timing(savePopAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setShowSaveBtn(false);
      });
    }
  }, [hasChanges]);

  // Handle attempt close with unsaved changes prompt
  const handleResetDrafts = () => {
    if (!activeItem) return;
    setDraftStatus(activeItem.status);
    setDraftLocation(activeItem.location);
    setNotesText(activeItem.notes || '');
    setEditingNotes(false);
  };

  const handleSaveAll = (shouldClose = true) => {
    if (!activeItem || !hasChanges) {
      if (shouldClose) animateClose();
      return;
    }

    const patch: Partial<ClothingItem> = {};
    const changesSummary: string[] = [];

    if (hasStatusChanged) {
      patch.status = draftStatus;
      if (draftStatus === 'worn' && activeItem.status !== 'worn') {
        patch.lastWornAt = new Date().toISOString();
        patch.wearCount = 1;
      } else if (draftStatus === 'clean') {
        // Washed: the wear counter starts over
        patch.wearCount = 0;
      }
      changesSummary.push(`status to ${STATUS_LABELS[draftStatus]}`);
    }

    if (hasLocationChanged) {
      patch.location = draftLocation;
      changesSummary.push(`location to ${getLocationLabel(draftLocation)}`);
    }

    if (hasNotesChanged) {
      patch.notes = notesText.trim();
      changesSummary.push('notes');
    }

    const prevSnapshot: Partial<ClothingItem> = {
      status: activeItem.status,
      wearCount: activeItem.wearCount,
      location: activeItem.location,
      notes: activeItem.notes,
      lastWornAt: activeItem.lastWornAt,
    };

    updateItem(activeItem.id, patch);
    setSavedSuccess(true);

    let toastMessage = `Saved changes to ${activeItem.name}`;
    if (changesSummary.length === 1) {
      if (hasStatusChanged) {
        toastMessage = `Marked as ${STATUS_LABELS[draftStatus]}`;
      } else if (hasLocationChanged) {
        toastMessage = `Moved to ${getLocationLabel(draftLocation)}`;
      } else if (hasNotesChanged) {
        toastMessage = 'Notes updated';
      }
    }

    showToast({
      message: toastMessage,
      type: 'success',
      action: {
        label: 'Undo',
        onPress: () => updateItem(activeItem.id, prevSnapshot),
      },
    });

    if (shouldClose) {
      setTimeout(() => {
        animateClose();
      }, 60);
    }
  };

  const handleAttemptClose = () => {
    if (isClosing.current) return;
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes to this clothing item. Would you like to save them before exiting?',
        [
          {
            text: 'Discard & Exit',
            style: 'destructive',
            onPress: () => {
              handleResetDrafts();
              animateClose();
            },
          },
          {
            text: 'Keep Editing',
            style: 'cancel',
            onPress: () => {
              Animated.timing(translateY, {
                toValue: 0,
                duration: 150,
                easing: Easing.bezier(0.23, 1, 0.32, 1),
                useNativeDriver: true,
              }).start();
            },
          },
          {
            text: 'Save & Exit',
            onPress: () => {
              handleSaveAll(true);
            },
          },
        ],
      );
    } else {
      animateClose();
    }
  };

  const handleDuplicate = () => {
    if (!activeItem) return;
    const it = activeItem;
    animateClose(() => {
      duplicateItem(it.id);
    });
  };

  const handleDelete = () => {
    if (!activeItem) return;
    const deletedCopy = { ...activeItem };
    const itemId = activeItem.id;
    animateClose(() => {
      deleteItem(itemId);
      showToast({
        message: `Removed ${deletedCopy.name}`,
        type: 'info',
        action: {
          label: 'Undo',
          onPress: () => addItem(deletedCopy),
        },
      });
    });
  };

  // Swipe-down pan responder for natural, physical dismissal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const progress = Math.min(gestureState.dy / 350, 1);
          backdropOpacity.setValue(Math.max(0, 1 - progress * 0.7));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 90 || gestureState.vy > 0.5) {
          handleAttemptClose();
        } else {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 0,
              duration: 150,
              easing: Easing.bezier(0.23, 1, 0.32, 1),
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 130,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  if (!modalVisible && !activeItem) return null;
  if (!activeItem) return null;

  const swatchColor = COLOR_MAP[activeItem.color.toLowerCase()] ?? '#636366';

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleAttemptClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={handleAttemptClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom + 16, 32),
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top handle grabber with drag-to-dismiss gesture */}
          <View style={styles.handleWrap} {...panResponder.panHandlers}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.garmentName} numberOfLines={1}>
                {activeItem.name}
              </Text>
              {activeItem.brand && <Text style={styles.garmentBrand}>{activeItem.brand}</Text>}
            </View>
            <View style={styles.headerActions}>
              {showSaveBtn && (
                <Animated.View
                  style={[
                    styles.headerSaveAnim,
                    {
                      opacity: savePopAnim,
                      transform: [
                        {
                          scale: savePopAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.65, 1],
                          }),
                        },
                        {
                          translateX: savePopAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <PressableScale
                    onPress={() => handleSaveAll(true)}
                    scaleTo={0.93}
                  >
                    <View
                      style={[
                        styles.headerSaveBtn,
                        savedSuccess && styles.headerSaveBtnSuccess,
                      ]}
                    >
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                      <Text style={styles.headerSaveBtnText}>
                        {savedSuccess ? 'Saved' : 'Save'}
                      </Text>
                    </View>
                  </PressableScale>
                </Animated.View>
              )}

              <PressableScale onPress={handleAttemptClose} style={styles.closeBtn}>
                <X size={18} color={Colors.textTertiary} />
              </PressableScale>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Garment Hero Row: Image + Tags */}
            <View style={styles.heroRow}>
              <View style={styles.imageFrame}>
                {isIntimatesItem(activeItem) ? (
                  <IntimatesMockupBadge
                    item={activeItem}
                    variant="thumb"
                    size={98}
                    style={{ width: '100%', height: '100%', borderWidth: 0 }}
                  />
                ) : activeItem.imageUrl ? (
                  <Image
                    source={{ uri: activeItem.imageUrl }}
                    style={styles.heroImage}
                    resizeMode="contain"
                  />
                ) : (
                  <CategoryIcon category={isSockItem(activeItem) ? 'socks' : activeItem.category} size={48} color={Colors.textSecondary} />
                )}
              </View>

              <View style={styles.metaCol}>
                <StatusBadge
                  status={draftStatus}
                  wearCount={
                    draftStatus === 'worn'
                      ? activeItem.status === 'worn'
                        ? getWornCount(activeItem)
                        : 1
                      : undefined
                  }
                  size="sm"
                />

                <View style={styles.tagPill}>
                  <CategoryIcon category={activeItem.category} size={13} color={Colors.textSecondary} />
                  <Text style={styles.tagText}>{CATEGORY_LABELS[activeItem.category]}</Text>
                </View>

                <View style={styles.tagPill}>
                  <View style={[styles.swatchDot, { backgroundColor: swatchColor }]} />
                  <Text style={styles.tagText}>{activeItem.color}</Text>
                </View>

                {activeItem.isUniformWhiteTee && (
                  <View style={styles.uniformPill}>
                    <Text style={styles.uniformPillText}>SCHOOL UNIFORM</Text>
                  </View>
                )}

                <View style={styles.wearHistoryPill}>
                  <Clock size={12} color={Colors.textTertiary} />
                  <Text style={styles.wearHistoryText}>
                    {draftStatus === 'worn' && activeItem.status !== 'worn'
                      ? 'Will be marked worn today'
                      : activeItem.status === 'worn'
                      ? `${formatTimes(getWornCount(activeItem))} since wash · ${formatRelativeTime(activeItem.lastWornAt)}`
                      : formatRelativeTime(activeItem.lastWornAt)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Status Selector */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>STATUS</Text>
                {hasStatusChanged && (
                  <View style={styles.editedBadge}>
                    <Text style={styles.editedBadgeText}>edited</Text>
                  </View>
                )}
              </View>
              <View style={styles.statusRow}>
                {ALL_STATUSES.map((st) => {
                  const active = draftStatus === st;
                  const isOriginal = activeItem.status === st;
                  const color = STATUS_COLORS[st];
                  return (
                    <TouchableOpacity
                      key={st}
                      activeOpacity={0.7}
                      onPress={() => setDraftStatus(st)}
                      style={[
                        styles.statusBtn,
                        active && {
                          backgroundColor: color + '18',
                          borderColor: color,
                        },
                      ]}
                    >
                      <View style={[styles.statusDot, { backgroundColor: color }]} />
                      <Text
                        style={[
                          styles.statusBtnText,
                          active && { color, fontWeight: '700' },
                        ]}
                      >
                        {STATUS_LABELS[st]}
                      </Text>
                      {active && !isOriginal && (
                        <View style={[styles.changeIndicatorDot, { backgroundColor: color }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Re-wear: only for pieces that are already worn; asks before counting another wear */}
              {activeItem.status === 'worn' && !hasStatusChanged && (
                <PressableScale
                  scaleTo={0.97}
                  onPress={() =>
                    requestWear({
                      items: [activeItem],
                      onConfirm: () => wearItemAgain(activeItem.id),
                    })
                  }
                  style={styles.wearAgainWrap}
                >
                  <View style={styles.wearAgainBtn}>
                    <Clock size={14} color={STATUS_COLORS.worn} />
                    <Text style={styles.wearAgainText}>
                      Wear again · Worn {getWornCount(activeItem) + 1}x
                    </Text>
                  </View>
                </PressableScale>
              )}
            </View>

            {/* Quick Location Selector */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>LOCATION</Text>
                {hasLocationChanged && (
                  <View style={styles.editedBadge}>
                    <Text style={styles.editedBadgeText}>edited</Text>
                  </View>
                )}
              </View>
              <View style={styles.locationRow}>
                {ALL_LOCATIONS.map((loc) => {
                  const active = draftLocation === loc;
                  const isBatangas = loc === 'batangas_dorm';
                  const isCalamba = loc === 'calamba_home';
                  const activeBg = isBatangas
                    ? Colors.locBatangas
                    : isCalamba
                    ? Colors.locCalamba
                    : Colors.locInTransit;
                  const isOriginal = activeItem.location === loc;
                  const rawLabel = getLocationLabel(loc);
                  const displayLabel =
                    loc === 'in_transit_bag' && (rawLabel === 'In-Transit Bag' || rawLabel === 'in_transit_bag')
                      ? 'Transit Bag'
                      : rawLabel;

                  return (
                    <TouchableOpacity
                      key={loc}
                      activeOpacity={0.7}
                      onPress={() => setDraftLocation(loc)}
                      style={[
                        styles.locBtn,
                        active && { backgroundColor: activeBg, borderColor: activeBg },
                      ]}
                    >
                      <LocationIcon
                        location={loc}
                        size={14}
                        color={active ? '#FFFFFF' : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.locBtnText,
                          active && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {displayLabel}
                      </Text>
                      {active && !isOriginal && (
                        <View style={styles.changeIndicatorDotLight} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionLabel}>NOTES</Text>
                  {hasNotesChanged && (
                    <View style={styles.editedBadge}>
                      <Text style={styles.editedBadgeText}>edited</Text>
                    </View>
                  )}
                </View>
                {!editingNotes && (
                  <TouchableOpacity onPress={() => setEditingNotes(true)}>
                    <Text style={styles.editNotesLink}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {editingNotes ? (
                <View style={styles.notesEditWrap}>
                  <TextInput
                    style={styles.notesInput}
                    value={notesText}
                    onChangeText={setNotesText}
                    placeholder="Add care tips, size, fabric, or fit notes..."
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                    autoFocus
                  />
                  <View style={styles.notesBtnRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setNotesText(activeItem.notes || '');
                        setEditingNotes(false);
                      }}
                      style={styles.notesCancelBtn}
                    >
                      <Text style={styles.notesCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setEditingNotes(false)}
                      style={styles.notesSaveBtn}
                    >
                      <Text style={styles.notesSaveText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setEditingNotes(true)}
                  style={styles.notesBox}
                >
                  <Text
                    style={[
                      styles.notesText,
                      !notesText && styles.notesPlaceholder,
                    ]}
                  >
                    {notesText || 'No notes yet. Tap to add details, sizing, or laundry tips.'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action Bar */}
            <View style={styles.actionRow}>
              {onEdit && (
                <PressableScale
                  scaleTo={0.96}
                  onPress={() => {
                    if (hasChanges) {
                      Alert.alert(
                        'Unsaved Changes',
                        'You have unsaved edits. Save them before editing other details?',
                        [
                          {
                            text: 'Discard & Edit Full',
                            style: 'destructive',
                            onPress: () => {
                              handleResetDrafts();
                              animateClose(() => {
                                onEdit(activeItem);
                              });
                            },
                          },
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Save & Edit Full',
                            onPress: () => {
                              handleSaveAll(false);
                              animateClose(() => {
                                onEdit({
                                  ...activeItem,
                                  status: draftStatus,
                                  location: draftLocation,
                                  notes: notesText.trim(),
                                });
                              });
                            },
                          },
                        ],
                      );
                    } else {
                      animateClose(() => {
                        onEdit(activeItem);
                      });
                    }
                  }}
                  style={styles.actionBtnEdit}
                >
                  <Edit3 size={15} color={Colors.textPrimary} />
                  <Text style={styles.actionBtnEditText}>Edit</Text>
                </PressableScale>
              )}

              <PressableScale
                scaleTo={0.96}
                onPress={handleDuplicate}
                style={styles.actionBtnDuplicate}
              >
                <Copy size={15} color={Colors.textPrimary} />
                <Text style={styles.actionBtnDuplicateText}>Duplicate</Text>
              </PressableScale>

              <PressableScale
                scaleTo={0.96}
                onPress={handleDelete}
                style={styles.actionBtnDelete}
              >
                <Trash2 size={15} color="#DC2626" />
                <Text style={styles.actionBtnDeleteText}>Delete</Text>
              </PressableScale>
            </View>
          </ScrollView>
        </Animated.View>
        {rewearModal}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 20, 19, 0.45)',
  },
  sheetContainer: {
    backgroundColor: Colors.bgBase,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    paddingTop: 8,
    paddingBottom: 36,
    maxHeight: '85%',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  handleBar: {
    width: 42,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(20, 20, 19, 0.22)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGlass,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  garmentName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  garmentBrand: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  imageFrame: {
    width: 100,
    height: 100,
    borderRadius: Radii.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    width: '90%',
    height: '90%',
  },
  metaCol: {
    flex: 1,
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  swatchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  uniformPill: {
    backgroundColor: Colors.locBatangasBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(29, 78, 216, 0.22)',
  },
  uniformPillText: {
    color: Colors.locBatangas,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  wearHistoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  wearHistoryText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
  section: {
    gap: 6,
  },
  wearAgainWrap: {
    alignSelf: 'stretch',
    marginTop: 2,
  },
  wearAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  wearAgainText: {
    color: STATUS_COLORS.worn,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  editNotesLink: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBtnText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  locBtn: {
    flex: 1,
    minWidth: 0,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
  },
  locBtnText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  notesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    minHeight: 54,
    justifyContent: 'center',
  },
  notesText: {
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  notesPlaceholder: {
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  notesEditWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderGlassBright,
    gap: Spacing.sm,
  },
  notesInput: {
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 6,
  },
  notesBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  notesCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgSubtle,
  },
  notesCancelText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  notesSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.accent,
  },
  notesSaveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGlass,
  },
  actionBtnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: Radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  actionBtnEditText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnDuplicate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: Radii.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  actionBtnDuplicateText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnDelete: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.xl,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  actionBtnDeleteText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editedBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.28)',
  },
  editedBadgeText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  changeIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 1,
  },
  changeIndicatorDotLight: {
    position: 'absolute',
    top: 5,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSaveAnim: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSaveBtn: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 3,
  },
  headerSaveBtnSuccess: {
    backgroundColor: Colors.statusClean,
    shadowColor: Colors.statusClean,
  },
  headerSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
