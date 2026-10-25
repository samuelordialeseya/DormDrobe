import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  Category,
  Location,
  Status,
  ClothingItem,
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  COLOR_SWATCHES,
} from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import { useWardrobe } from '../context/WardrobeContext';
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
import { removeImageBackground } from '../utils/backgroundRemoval';
import {
  CategoryIcon,
  LocationIcon,
  Camera,
  RotateCcw,
  Sparkles,
  X,
} from '../components/AppIcons';

const CATEGORIES: Category[] = ['tops', 'bottoms', 'underwear', 'footwear', 'outerwear', 'accessories'];
const LOCATIONS: Location[] = ['batangas_dorm', 'calamba_home', 'in_transit_bag'];
const STATUSES: Status[] = ['clean', 'worn', 'in_laundry'];

const LOC_SHORT: Record<Location, string> = {
  batangas_dorm: 'Batangas Dorm',
  calamba_home: 'Calamba Home',
  in_transit_bag: 'In Bag',
};

export default function AddItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editItem = route.params?.editItem as ClothingItem | undefined;

  const { addItem, updateItem, currentLocation, showToast, getLocationLabel } = useWardrobe();

  const [name, setName] = useState(editItem?.name ?? '');
  const [category, setCategory] = useState<Category>(editItem?.category ?? 'tops');
  const [color, setColor] = useState(editItem?.color ?? 'White');
  const [brand, setBrand] = useState(editItem?.brand ?? '');
  const [location, setLocation] = useState<Location>(editItem?.location ?? currentLocation);
  const [status, setStatus] = useState<Status>(editItem?.status ?? 'clean');
  const [isUniform, setIsUniform] = useState(editItem?.isUniformWhiteTee ?? false);
  const [notes, setNotes] = useState(editItem?.notes ?? '');

  // Image & non-AI background removal states
  const [originalUri, setOriginalUri] = useState<string | null>(editItem?.imageUrl ?? null);
  const [cutoutUri, setCutoutUri] = useState<string | null>(null);
  const [isCutoutActive, setIsCutoutActive] = useState(false);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [bgTolerance, setBgTolerance] = useState(28);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCategory(editItem.category);
      setColor(editItem.color);
      setBrand(editItem.brand ?? '');
      setLocation(editItem.location);
      setStatus(editItem.status);
      setIsUniform(editItem.isUniformWhiteTee);
      setNotes(editItem.notes);
      setOriginalUri(editItem.imageUrl);
    }
  }, [editItem]);

  // Gallery Picker
  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setOriginalUri(uri);
      setCutoutUri(null);
      setIsCutoutActive(false);
    }
  };

  // Camera Capture
  const takeWithCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera Permission', 'Please allow camera access to take garment photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setOriginalUri(uri);
      setCutoutUri(null);
      setIsCutoutActive(false);
    }
  };

  const handleRemoveBackground = async (toleranceValue = bgTolerance) => {
    if (!originalUri) return;
    setIsProcessingBg(true);
    try {
      const result = await removeImageBackground(originalUri, {
        tolerance: toleranceValue,
        feather: 14,
      });
      setCutoutUri(result);
      setIsCutoutActive(true);
      setBgTolerance(toleranceValue);
    } catch (err) {
      Alert.alert('Error', 'Could not process background cutout.');
    } finally {
      setIsProcessingBg(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast({ message: 'Give your clothing item a name', type: 'warning' });
      return;
    }
    if (!color.trim()) {
      showToast({ message: 'Select or enter a color', type: 'warning' });
      return;
    }

    const finalImage = isCutoutActive && cutoutUri ? cutoutUri : originalUri;

    if (editItem) {
      updateItem(editItem.id, {
        name: name.trim(),
        category,
        color: color.trim(),
        brand: brand.trim() || null,
        location,
        status,
        imageUrl: finalImage,
        isUniformWhiteTee: isUniform,
        notes: notes.trim(),
      });
      showToast({ message: `Updated ${name.trim()}`, type: 'success' });
    } else {
      addItem({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name.trim(),
        category,
        color: color.trim(),
        brand: brand.trim() || null,
        location,
        status,
        imageUrl: finalImage,
        isUniformWhiteTee: isUniform,
        lastWornAt: null,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      });
      showToast({ message: `Added ${name.trim()} to wardrobe`, type: 'success' });
    }

    navigation.goBack();
  };

  const activeImagePreview = isCutoutActive && cutoutUri ? cutoutUri : originalUri;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <FadeSlideIn delay={0} fromY={-10}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>
                    {editItem ? 'Edit Piece' : 'Add Item'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {editItem ? 'Update garment details' : 'Capture a new clothing item'}
                  </Text>
                </View>
                <PressableScale onPress={() => navigation.goBack()} style={styles.closeBtn}>
                  <X size={18} color={Colors.textTertiary} />
                </PressableScale>
              </View>
            </FadeSlideIn>

            {/* Photo Picker & Non-AI Background Cutout Card */}
            <FadeSlideIn delay={40} fromY={12}>
              <View style={styles.photoCard}>
                <View style={styles.specular} />

                {activeImagePreview ? (
                  <View style={styles.previewContainer}>
                    <View
                      style={[
                        styles.imageFrame,
                        isCutoutActive && styles.cutoutFrame,
                      ]}
                    >
                      <Image
                        source={{ uri: activeImagePreview }}
                        style={styles.previewImage}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Cutout Actions */}
                    <View style={styles.cutoutActions}>
                      <View style={styles.cutoutBtnRow}>
                        <PressableScale
                          onPress={() => handleRemoveBackground()}
                          scaleTo={0.94}
                          style={styles.removeBgBtn}
                          disabled={isProcessingBg}
                        >
                          {isProcessingBg ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              {cutoutUri ? (
                                <RotateCcw size={14} color="#FFFFFF" strokeWidth={2.2} />
                              ) : (
                                <Sparkles size={14} color="#FFFFFF" strokeWidth={2.2} />
                              )}
                              <Text style={styles.removeBgText}>
                                {cutoutUri ? 'Re-Cutout' : 'Remove Background'}
                              </Text>
                            </View>
                          )}
                        </PressableScale>

                        <PressableScale onPress={pickFromGallery} scaleTo={0.94}>
                          <View style={styles.changePhotoBtn}>
                            <Text style={styles.changePhotoText}>Change</Text>
                          </View>
                        </PressableScale>
                      </View>

                      {/* Toggle Cutout vs Original */}
                      {cutoutUri && (
                        <View style={styles.cutoutControls}>
                          <View style={styles.viewToggleRow}>
                            <TouchableOpacity
                              onPress={() => setIsCutoutActive(false)}
                              style={[
                                styles.viewToggleBtn,
                                !isCutoutActive && styles.viewToggleBtnActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.viewToggleText,
                                  !isCutoutActive && styles.viewToggleTextActive,
                                ]}
                              >
                                Original
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => setIsCutoutActive(true)}
                              style={[
                                styles.viewToggleBtn,
                                isCutoutActive && styles.viewToggleBtnActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.viewToggleText,
                                  isCutoutActive && styles.viewToggleTextActive,
                                ]}
                              >
                                Cutout PNG
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* Sensitivity Pills */}
                          <View style={styles.toleranceRow}>
                            <Text style={styles.toleranceLabel}>Tolerance:</Text>
                            {[18, 28, 40].map((tol) => (
                              <TouchableOpacity
                                key={tol}
                                onPress={() => handleRemoveBackground(tol)}
                                style={[
                                  styles.tolBtn,
                                  bgTolerance === tol && styles.tolBtnActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.tolText,
                                    bgTolerance === tol && styles.tolTextActive,
                                  ]}
                                >
                                  {tol === 18 ? 'Light' : tol === 28 ? 'Med' : 'Aggressive'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyPhotoContainer}>
                    <Text style={styles.photoLabel}>Add Garment Photo</Text>
                    <Text style={styles.photoSubLabel}>
                      Automatic clean edge cutout supported
                    </Text>

                    <View style={styles.photoChoiceRow}>
                      <PressableScale
                        scaleTo={0.95}
                        onPress={takeWithCamera}
                        style={styles.photoChoiceBtn}
                      >
                        <Camera size={20} color={Colors.textPrimary} />
                        <Text style={styles.photoChoiceText}>Take Photo</Text>
                      </PressableScale>

                      <PressableScale
                        scaleTo={0.95}
                        onPress={pickFromGallery}
                        style={styles.photoChoiceBtn}
                      >
                        <Sparkles size={20} color={Colors.textPrimary} />
                        <Text style={styles.photoChoiceText}>Choose Gallery</Text>
                      </PressableScale>
                    </View>
                  </View>
                )}
              </View>
            </FadeSlideIn>

            {/* Name */}
            <FadeSlideIn delay={80} fromY={12}>
              <Text style={styles.fieldLabel}>Name *</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder='e.g. "White Uniqlo Airism Tee"'
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              {/* Color Swatch Picker + Custom Input */}
              <Text style={styles.fieldLabel}>Color *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorSwatchRow}
              >
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected = color.toLowerCase() === swatch.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={swatch.name}
                      onPress={() => setColor(swatch.name)}
                      style={[
                        styles.colorSwatchBtn,
                        isSelected && styles.colorSwatchBtnActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.colorSwatchCircle,
                          { backgroundColor: swatch.hex, borderColor: swatch.border },
                        ]}
                      />
                      <Text
                        style={[
                          styles.colorSwatchName,
                          isSelected && styles.colorSwatchNameActive,
                        ]}
                      >
                        {swatch.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={[styles.inputWrap, { marginTop: 8 }]}>
                <TextInput
                  style={styles.input}
                  value={color}
                  onChangeText={setColor}
                  placeholder="Or enter custom color name..."
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              {/* Brand */}
              <Text style={styles.fieldLabel}>Brand (Optional)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder='e.g. "Uniqlo", "Zara", "Nike"'
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </FadeSlideIn>

            {/* Category */}
            <FadeSlideIn delay={120} fromY={12}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((cat) => {
                  const active = cat === category;
                  return (
                    <PressableScale
                      key={cat}
                      scaleTo={0.93}
                      onPress={() => setCategory(cat)}
                    >
                      <View style={[styles.chip, active && styles.chipActive]}>
                        <CategoryIcon
                          category={cat}
                          size={13}
                          color={active ? '#FFFFFF' : Colors.textTertiary}
                          strokeWidth={2}
                        />
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {CATEGORY_LABELS[cat]}
                        </Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            </FadeSlideIn>

            {/* Location */}
            <FadeSlideIn delay={150} fromY={12}>
              <Text style={styles.fieldLabel}>Location</Text>
              <View style={styles.chipRow}>
                {LOCATIONS.map((loc) => {
                  const active = loc === location;
                  return (
                    <PressableScale
                      key={loc}
                      scaleTo={0.93}
                      onPress={() => setLocation(loc)}
                    >
                      <View style={[styles.chip, active && styles.chipActive]}>
                        <LocationIcon
                          location={loc}
                          size={13}
                          color={active ? '#FFFFFF' : Colors.textTertiary}
                          strokeWidth={2}
                        />
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {loc === 'in_transit_bag' ? 'In Bag' : getLocationLabel(loc)}
                        </Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            </FadeSlideIn>

            {/* Status */}
            <FadeSlideIn delay={180} fromY={12}>
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.chipRow}>
                {STATUSES.map((st) => {
                  const active = st === status;
                  return (
                    <PressableScale
                      key={st}
                      scaleTo={0.93}
                      onPress={() => setStatus(st)}
                    >
                      <View
                        style={[
                          styles.chip,
                          active && {
                            backgroundColor: STATUS_COLORS[st] + '22',
                            borderColor: STATUS_COLORS[st] + '66',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: STATUS_COLORS[st] },
                          ]}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            active && {
                              color: STATUS_COLORS[st],
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {STATUS_LABELS[st]}
                        </Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            </FadeSlideIn>

            {/* School uniform toggle */}
            <FadeSlideIn delay={210} fromY={12}>
              <PressableScale
                scaleTo={0.97}
                onPress={() => setIsUniform(!isUniform)}
              >
                <View style={[styles.toggleRow, isUniform && styles.toggleRowActive]}>
                  <View style={styles.toggleLeft}>
                    <Text style={styles.toggleTitle}>School Uniform Staple</Text>
                    <Text style={styles.toggleSub}>
                      Tag for fast school uniform rotation in Fit Studio
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.toggleIndicator,
                      isUniform && styles.toggleIndicatorOn,
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        isUniform && styles.toggleThumbOn,
                      ]}
                    />
                  </View>
                </View>
              </PressableScale>
            </FadeSlideIn>

            {/* Notes */}
            <FadeSlideIn delay={240} fromY={12}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Wash cold, loose fit, keeps me cool in Batangas heat"
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </FadeSlideIn>

            {/* Save Button */}
            <FadeSlideIn delay={270} fromY={14}>
              <PressableScale scaleTo={0.96} onPress={handleSave}>
                <View style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>
                    {editItem ? 'Save Changes' : 'Save to Wardrobe'}
                  </Text>
                </View>
              </PressableScale>
            </FadeSlideIn>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgBase },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 130,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.title1,
    fontSize: 24,
    marginBottom: 2,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 13,
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
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  emptyPhotoContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.bgSubtle,
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderColor: Colors.borderGlass,
    borderStyle: 'dashed',
    gap: 6,
  },
  photoLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  photoSubLabel: {
    color: Colors.textTertiary,
    fontSize: 11.5,
    marginBottom: 8,
  },
  photoChoiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  photoChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  photoChoiceText: {
    color: Colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  imageFrame: {
    width: 170,
    height: 170,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  cutoutFrame: {
    backgroundColor: Colors.bgDeep,
    borderColor: Colors.borderGlassBright,
  },
  previewImage: {
    width: 160,
    height: 160,
  },
  cutoutActions: {
    width: '100%',
    gap: 8,
  },
  cutoutBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  removeBgBtn: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBgText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  changePhotoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  cutoutControls: {
    backgroundColor: Colors.bgSubtle,
    borderRadius: Radii.lg,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  viewToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 20, 19, 0.05)',
    borderRadius: Radii.pill,
    padding: 2,
  },
  viewToggleBtn: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  viewToggleText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  viewToggleTextActive: {
    color: Colors.textPrimary,
  },
  toleranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toleranceLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  tolBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  tolBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tolText: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  tolTextActive: {
    color: '#FFFFFF',
  },
  fieldLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  colorSwatchRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  colorSwatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  colorSwatchBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.bgSubtle,
  },
  colorSwatchCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  colorSwatchName: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  colorSwatchNameActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  inputWrap: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    backgroundColor: '#FFFFFF',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  input: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  textAreaWrap: {
    minHeight: 80,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  toggleRowActive: {
    borderColor: 'rgba(29, 78, 216, 0.25)',
    backgroundColor: Colors.locBatangasBg,
  },
  toggleLeft: { flex: 1 },
  toggleTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleSub: {
    color: Colors.textTertiary,
    fontSize: 11,
    lineHeight: 15,
  },
  toggleIndicator: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.bgDeep,
    padding: 2,
    justifyContent: 'center',
  },
  toggleIndicatorOn: {
    backgroundColor: Colors.accent,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 15,
    borderRadius: Radii.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
