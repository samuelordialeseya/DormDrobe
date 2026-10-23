import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import {
  ClothingItem,
  Location,
  Status,
  LOCATION_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  CATEGORY_LABELS,
} from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import { useWardrobe } from '../context/WardrobeContext';
import PressableScale from './PressableScale';
import StatusBadge from './StatusBadge';
import {
  CategoryIcon,
  LocationIcon,
  X,
  Trash2,
  Edit3,
  Clock,
  Check,
} from './AppIcons';

interface Props {
  item: ClothingItem | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (item: ClothingItem) => void;
}

const ALL_STATUSES: Status[] = ['clean', 'worn', 'in_laundry', 'drying', 'misplaced'];
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
  const { updateItem, deleteItem, addItem, showToast, getLocationLabel } = useWardrobe();

  // Bottom sheet spring animations
  const translateY = useRef(new Animated.Value(450)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Inline notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    if (visible && item) {
      setNotesText(item.notes || '');
      setEditingNotes(false);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 280,
          friction: 26,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 450,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, item]);

  if (!item) return null;

  const handleStatusChange = (newStatus: Status) => {
    if (!item) return;
    const oldStatus = item.status;
    updateItem(item.id, {
      status: newStatus,
      ...(newStatus === 'worn' ? { lastWornAt: new Date().toISOString() } : {}),
    });
    showToast({
      message: `Marked as ${STATUS_LABELS[newStatus]}`,
      type: 'success',
      action: {
        label: 'Undo',
        onPress: () => updateItem(item.id, { status: oldStatus }),
      },
    });
  };

  const handleLocationChange = (newLocation: Location) => {
    if (!item) return;
    const oldLocation = item.location;
    updateItem(item.id, { location: newLocation });
    showToast({
      message: `Moved to ${getLocationLabel(newLocation)}`,
      type: 'success',
      action: {
        label: 'Undo',
        onPress: () => updateItem(item.id, { location: oldLocation }),
      },
    });
  };

  const handleSaveNotes = () => {
    if (!item) return;
    updateItem(item.id, { notes: notesText.trim() });
    setEditingNotes(false);
    showToast({ message: 'Notes updated', type: 'info' });
  };

  const handleDelete = () => {
    if (!item) return;
    Alert.alert(
      'Remove Garment',
      `Are you sure you want to remove "${item.name}" from your wardrobe?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const deletedCopy = { ...item };
            deleteItem(item.id);
            onClose();
            showToast({
              message: `Removed ${deletedCopy.name}`,
              type: 'info',
              action: {
                label: 'Undo',
                onPress: () => addItem(deletedCopy),
              },
            });
          },
        },
      ],
    );
  };

  const swatchColor = COLOR_MAP[item.color.toLowerCase()] ?? '#636366';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY }] },
          ]}
        >
          {/* Top handle grabber */}
          <View style={styles.handleWrap}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.garmentName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.brand && <Text style={styles.garmentBrand}>{item.brand}</Text>}
            </View>
            <PressableScale onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={Colors.textTertiary} />
            </PressableScale>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Garment Hero Row: Image + Tags */}
            <View style={styles.heroRow}>
              <View style={styles.imageFrame}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.heroImage}
                    resizeMode="contain"
                  />
                ) : (
                  <CategoryIcon category={item.category} size={48} color={Colors.textSecondary} />
                )}
              </View>

              <View style={styles.metaCol}>
                <View style={styles.tagPill}>
                  <CategoryIcon category={item.category} size={13} color={Colors.textSecondary} />
                  <Text style={styles.tagText}>{CATEGORY_LABELS[item.category]}</Text>
                </View>

                <View style={styles.tagPill}>
                  <View style={[styles.swatchDot, { backgroundColor: swatchColor }]} />
                  <Text style={styles.tagText}>{item.color}</Text>
                </View>

                {item.isUniformWhiteTee && (
                  <View style={styles.uniformPill}>
                    <Text style={styles.uniformPillText}>SCHOOL UNIFORM</Text>
                  </View>
                )}

                <View style={styles.wearHistoryPill}>
                  <Clock size={12} color={Colors.textTertiary} />
                  <Text style={styles.wearHistoryText}>
                    {formatRelativeTime(item.lastWornAt)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Status Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>STATUS</Text>
              <View style={styles.statusRow}>
                {ALL_STATUSES.map((st) => {
                  const active = item.status === st;
                  const color = STATUS_COLORS[st];
                  return (
                    <TouchableOpacity
                      key={st}
                      activeOpacity={0.7}
                      onPress={() => handleStatusChange(st)}
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
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Quick Location Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LOCATION</Text>
              <View style={styles.locationRow}>
                {ALL_LOCATIONS.map((loc) => {
                  const active = item.location === loc;
                  const isBatangas = loc === 'batangas_dorm';
                  const isCalamba = loc === 'calamba_home';
                  const activeBg = isBatangas
                    ? Colors.locBatangas
                    : isCalamba
                    ? Colors.locCalamba
                    : Colors.locInTransit;

                  return (
                    <TouchableOpacity
                      key={loc}
                      activeOpacity={0.7}
                      onPress={() => handleLocationChange(loc)}
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
                      >
                        {loc === 'in_transit_bag'
                          ? 'In Bag'
                          : getLocationLabel(loc)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>NOTES</Text>
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
                      onPress={() => setEditingNotes(false)}
                      style={styles.notesCancelBtn}
                    >
                      <Text style={styles.notesCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveNotes}
                      style={styles.notesSaveBtn}
                    >
                      <Text style={styles.notesSaveText}>Save Notes</Text>
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
                      !item.notes && styles.notesPlaceholder,
                    ]}
                  >
                    {item.notes || 'No notes yet. Tap to add details, sizing, or laundry tips.'}
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
                    onClose();
                    onEdit(item);
                  }}
                  style={styles.actionBtnEdit}
                >
                  <Edit3 size={15} color={Colors.textPrimary} />
                  <Text style={styles.actionBtnEditText}>Edit Piece</Text>
                </PressableScale>
              )}

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
      </View>
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
    paddingVertical: 6,
  },
  handleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(20, 20, 19, 0.2)',
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
  },
  locBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  locBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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
});
