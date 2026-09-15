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
import { useWardrobe } from '../context/WardrobeContext';
import {
  Category,
  Location,
  Status,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  LOCATION_LABELS,
  STATUS_LABELS,
} from '../types/wardrobe';

const CATEGORIES: Category[] = ['tops', 'bottoms', 'underwear', 'footwear', 'outerwear', 'accessories'];
const LOCATIONS: Location[] = ['calamba_home', 'batangas_dorm', 'in_transit_bag'];
const STATUSES: Status[] = ['clean', 'worn', 'in_laundry', 'drying'];

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
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Give your clothing item a name.');
      return;
    }
    if (!color.trim()) {
      Alert.alert('Missing Color', 'What color is it?');
      return;
    }

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

    Alert.alert('Added! 🎉', `${name} has been added to your wardrobe.`);

    // Reset form
    setName('');
    setColor('');
    setBrand('');
    setImageUri(null);
    setNotes('');
    setIsUniform(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Add Item</Text>
          <Text style={styles.subtitle}>Quick-capture a new clothing item</Text>

          {/* Photo */}
          <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
            {imageUri ? (
              <Text style={styles.photoEmoji}>📸</Text>
            ) : (
              <>
                <Text style={styles.photoEmoji}>📷</Text>
                <Text style={styles.photoLabel}>Tap to add photo</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Name */}
          <Text style={styles.fieldLabel}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder='e.g. "White Uniqlo Tee #5"'
            placeholderTextColor="#4B5563"
          />

          {/* Color */}
          <Text style={styles.fieldLabel}>Color *</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder="e.g. Black, White, Navy"
            placeholderTextColor="#4B5563"
          />

          {/* Brand */}
          <Text style={styles.fieldLabel}>Brand</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. Uniqlo, Carhartt"
            placeholderTextColor="#4B5563"
          />

          {/* Category */}
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location */}
          <Text style={styles.fieldLabel}>Location</Text>
          <View style={styles.chipRow}>
            {LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.chip, location === loc && styles.chipActive]}
                onPress={() => setLocation(loc)}
              >
                <Text style={[styles.chipText, location === loc && styles.chipTextActive]}>
                  {LOCATION_LABELS[loc]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Status */}
          <Text style={styles.fieldLabel}>Status</Text>
          <View style={styles.chipRow}>
            {STATUSES.map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.chip, status === st && styles.chipActive]}
                onPress={() => setStatus(st)}
              >
                <Text style={[styles.chipText, status === st && styles.chipTextActive]}>
                  {STATUS_LABELS[st]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Uniform toggle */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsUniform(!isUniform)}
          >
            <View style={[styles.toggleBox, isUniform && styles.toggleBoxActive]}>
              {isUniform && <Text style={styles.toggleCheck}>✓</Text>}
            </View>
            <Text style={styles.toggleLabel}>
              This is a white T-shirt for school uniform
            </Text>
          </TouchableOpacity>

          {/* Notes */}
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any extra details…"
            placeholderTextColor="#4B5563"
            multiline
          />

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>+ Add to Wardrobe</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13131A',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 16,
  },
  photoPicker: {
    height: 120,
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2A2A3E',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  photoEmoji: {
    fontSize: 36,
  },
  photoLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 6,
  },
  fieldLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1E1E2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F9FAFB',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#1E1E2E',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  chipActive: {
    backgroundColor: '#8B5CF620',
    borderColor: '#8B5CF6',
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#C4B5FD',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  toggleBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6',
  },
  toggleCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleLabel: {
    color: '#D1D5DB',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
