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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Category,
  Location,
  Status,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../types/wardrobe';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import { useWardrobe } from '../context/WardrobeContext';

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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Missing Name', 'Give your clothing item a name.'); return; }
    if (!color.trim()) { Alert.alert('Missing Color', 'What color is it?'); return; }

    addItem({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      category,
      color: color.trim(),
      brand: brand.trim() || null,
      location,
      status,
      imageUrl: imageUri,
      isUniformWhiteTee: isUniform,
      lastWornAt: null,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    });

    Alert.alert('Added', `${name} has been added to your wardrobe.`);
    setName(''); setColor(''); setBrand(''); setImageUri(null); setNotes(''); setIsUniform(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Item</Text>
              <Text style={styles.subtitle}>Capture a new clothing item</Text>
            </View>

            {/* Photo picker */}
            <TouchableOpacity style={styles.photoPicker} onPress={pickImage} activeOpacity={0.7}>
              <View style={styles.specular} />
              {imageUri ? (
                <>
                  <Text style={styles.photoEmoji}>📸</Text>
                  <Text style={styles.photoLabel}>Photo attached</Text>
                </>
              ) : (
                <>
                  <View style={styles.cameraIconRing}>
                    <Text style={styles.cameraIcon}>📷</Text>
                  </View>
                  <Text style={styles.photoLabel}>Tap to add photo</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Name */}
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
                placeholder="e.g. Black, White, Navy"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {/* Brand */}
            <Text style={styles.fieldLabel}>Brand</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="e.g. Uniqlo, Carhartt"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {/* Category */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => {
                const active = cat === category;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.65}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Location */}
            <Text style={styles.fieldLabel}>Location</Text>
            <View style={styles.chipRow}>
              {LOCATIONS.map((loc) => {
                const active = loc === location;
                return (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setLocation(loc)}
                    activeOpacity={0.65}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {LOC_SHORT[loc]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Status */}
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.chipRow}>
              {STATUSES.map((st) => {
                const active = st === status;
                const statusColor = STATUS_COLORS[st];
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.chip,
                      active && {
                        backgroundColor: statusColor + '18',
                        borderColor: statusColor + '60',
                      },
                    ]}
                    onPress={() => setStatus(st)}
                    activeOpacity={0.65}
                  >
                    <Text style={[styles.chipText, active && { color: statusColor }]}>
                      {STATUS_LABELS[st]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Uniform toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsUniform(!isUniform)}
              activeOpacity={0.7}
            >
              <View style={[styles.toggleBox, isUniform && styles.toggleBoxActive]}>
                {isUniform && <Text style={styles.toggleCheck}>✓</Text>}
              </View>
              <View style={styles.toggleTextArea}>
                <Text style={styles.toggleLabel}>School Uniform White Tee</Text>
                <Text style={styles.toggleDesc}>Tag for uniform outfit generation</Text>
              </View>
            </TouchableOpacity>

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any extra details…"
                placeholderTextColor={Colors.textTertiary}
                multiline
              />
            </View>

            {/* Save */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <View style={styles.saveSpecular} />
              <Text style={styles.saveBtnText}>Add to Wardrobe</Text>
            </TouchableOpacity>
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: 140,
  },
  header: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.title1,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
  photoPicker: {
    height: 120,
    backgroundColor: Colors.glassLight,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  specular: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  cameraIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.glassMid,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: { fontSize: 20 },
  photoEmoji: { fontSize: 32 },
  photoLabel: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  fieldLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrap: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    backgroundColor: Colors.glassLight,
  },
  input: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    color: Colors.textPrimary,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  // Active = brighter glass + white text (no color fill for category/location)
  chipActive: {
    backgroundColor: Colors.glassBright,
    borderColor: Colors.borderGlassBright,
  },
  chipText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    backgroundColor: Colors.glassLight,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  toggleBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleBoxActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  toggleCheck: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleTextArea: { flex: 1 },
  toggleLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  toggleDesc: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.xl,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: Spacing.xxl,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveSpecular: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
