import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import {
  Category,
  Location,
  Status,
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
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
} from '../components/AppIcons';

const CATEGORIES: Category[] = ['tops', 'bottoms', 'underwear', 'footwear', 'outerwear', 'accessories'];
const LOCATIONS: Location[] = ['calamba_home', 'batangas_dorm', 'in_transit_bag'];
const STATUSES: Status[] = ['clean', 'worn', 'in_laundry', 'drying'];

const LOC_SHORT: Record<Location, string> = {
  calamba_home: 'Calamba',
  batangas_dorm: 'Batangas',
  in_transit_bag: 'In Bag',
};

export default function AddItemScreen() {
  const { addItem } = useWardrobe();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('tops');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [location, setLocation] = useState<Location>('batangas_dorm');
  const [status, setStatus] = useState<Status>('clean');
  const [isUniform, setIsUniform] = useState(false);
  const [notes, setNotes] = useState('');

  // Image & non-AI background removal states
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [cutoutUri, setCutoutUri] = useState<string | null>(null);
  const [isCutoutActive, setIsCutoutActive] = useState(false);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [bgTolerance, setBgTolerance] = useState(28);

  const pickImage = async () => {
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
      Alert.alert('Missing Name', 'Give your clothing item a name.');
      return;
    }
    if (!color.trim()) {
      Alert.alert('Missing Color', 'What color is it?');
      return;
    }

    const finalImage = isCutoutActive && cutoutUri ? cutoutUri : originalUri;

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

    Alert.alert('Item Added', `${name} has been added to your wardrobe.`);
    setName('');
    setColor('');
    setBrand('');
    setOriginalUri(null);
    setCutoutUri(null);
    setIsCutoutActive(false);
    setNotes('');
    setIsUniform(false);
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
                <Text style={styles.title}>Add Item</Text>
                <Text style={styles.subtitle}>Capture a new clothing item</Text>
              </View>
            </FadeSlideIn>

            {/* Photo Picker & Non-AI Background Cutout Card */}
            <FadeSlideIn delay={60} fromY={12}>
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
                                {cutoutUri ? 'Re-Cutout' : 'Remove Background (Non-AI)'}
                              </Text>
                            </View>
                          )}
                        </PressableScale>

                        <PressableScale onPress={pickImage} scaleTo={0.94}>
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
                  <PressableScale scaleTo={0.97} onPress={pickImage}>
                    <View style={styles.emptyPhotoPicker}>
                      <View style={styles.cameraIconRing}>
                        <Camera size={26} color={Colors.textPrimary} strokeWidth={1.8} />
                      </View>
                      <Text style={styles.photoLabel}>Tap to snap or upload photo</Text>
                      <Text style={styles.photoSubLabel}>
                        Auto non-AI edge background removal supported
                      </Text>
                    </View>
                  </PressableScale>
                )}
              </View>
            </FadeSlideIn>

            {/* Name */}
            <FadeSlideIn delay={100} fromY={12}>
              <Text style={styles.fieldLabel}>Name *</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder='e.g. "White Uniqlo Tee #5"'
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              {/* Color */}
              <Text style={styles.fieldLabel}>Color *</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={color}
                  onChangeText={setColor}
                  placeholder='e.g. "White", "Navy", "Khaki"'
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
            <FadeSlideIn delay={140} fromY={12}>
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
            <FadeSlideIn delay={180} fromY={12}>
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
                          {LOC_SHORT[loc]}
                        </Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            </FadeSlideIn>

            {/* Status */}
            <FadeSlideIn delay={220} fromY={12}>
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
                              fontWeight: '600',
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
            <FadeSlideIn delay={260} fromY={12}>
              <PressableScale
                scaleTo={0.97}
                onPress={() => setIsUniform(!isUniform)}
              >
                <View style={[styles.toggleRow, isUniform && styles.toggleRowActive]}>
                  <View style={styles.toggleLeft}>
                    <Text style={styles.toggleTitle}>School Uniform Staple</Text>
                    <Text style={styles.toggleSub}>
                      Tag as uniform white tee for fast daily outfit generator
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
            <FadeSlideIn delay={280} fromY={12}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Airism, dry clean only, slightly loose fit"
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </FadeSlideIn>

            {/* Save Button */}
            <FadeSlideIn delay={300} fromY={14}>
              <PressableScale scaleTo={0.96} onPress={handleSave}>
                <View style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Save to Wardrobe</Text>
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
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  emptyPhotoPicker: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9F9FB',
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'dashed',
  },
  cameraIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: { fontSize: 20 },
  photoLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  photoSubLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  previewContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  imageFrame: {
    width: 180,
    height: 180,
    borderRadius: Radii.lg,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cutoutFrame: {
    backgroundColor: '#E5E5EA',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  previewImage: {
    width: 170,
    height: 170,
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
    backgroundColor: '#1C1C1E',
    borderRadius: Radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  cutoutControls: {
    backgroundColor: '#F2F2F7',
    borderRadius: Radii.lg,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  viewToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.06)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
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
    borderColor: 'rgba(0,0,0,0.06)',
  },
  tolBtnActive: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
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
  inputWrap: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
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
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
  chipIcon: { fontSize: 12 },
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
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleRowActive: {
    borderColor: 'rgba(10,132,255,0.3)',
    backgroundColor: 'rgba(10,132,255,0.05)',
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
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleIndicatorOn: {
    backgroundColor: '#0A84FF',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  textAreaWrap: {
    minHeight: 70,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: Radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
