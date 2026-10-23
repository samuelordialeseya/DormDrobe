import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Share,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isSupabaseConfigured } from '../config/supabase';
import { useWardrobe } from '../context/WardrobeContext';
import { Colors, Radii, Spacing, Typography } from '../theme/theme';
import FadeSlideIn from '../components/FadeSlideIn';
import PressableScale from '../components/PressableScale';
import { AppStorage, isStoragePersisted, requestPersistentStorage } from '../utils/storage';
import {
  ShieldCheck,
  HardDrive,
  DownloadSimple,
  UploadSimple,
  BarChart3,
  Layers,
  Shirt,
  Check,
  LocationIcon,
} from '../components/AppIcons';

export default function SettingsScreen() {
  const {
    items,
    exportBackup,
    restoreBackup,
    showToast,
    locationNames,
    updateLocationNames,
    getLocationLabel,
  } = useWardrobe();
  const [isPersisted, setIsPersisted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const [dormName, setDormName] = useState(locationNames.batangas_dorm);
  const [homeName, setHomeName] = useState(locationNames.calamba_home);
  const [bagName, setBagName] = useState(locationNames.in_transit_bag);

  useEffect(() => {
    setDormName(locationNames.batangas_dorm);
    setHomeName(locationNames.calamba_home);
    setBagName(locationNames.in_transit_bag);
  }, [locationNames]);

  const handleSaveLocationNames = () => {
    updateLocationNames({
      batangas_dorm: dormName.trim() || 'Batangas Dorm',
      calamba_home: homeName.trim() || 'Calamba Home',
      in_transit_bag: bagName.trim() || 'In-Transit Bag',
    });
    showToast({ message: 'Custom location names saved!', type: 'success' });
  };

  useEffect(() => {
    (async () => {
      const persisted = await isStoragePersisted();
      setIsPersisted(persisted);
    })();
  }, []);

  const handleEnablePersistence = async () => {
    const granted = await requestPersistentStorage();
    setIsPersisted(granted);
    if (granted) {
      showToast({ message: 'Persistent storage active — iOS will not purge data', type: 'success' });
    } else {
      showToast({ message: 'Storage is running in best-effort local mode', type: 'info' });
    }
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const jsonStr = await exportBackup();
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `dormdrobe_backup_${dateStr}.json`;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast({ message: `Wardrobe backup saved: ${filename}`, type: 'success' });
      } else {
        await Share.share({
          message: jsonStr,
          title: filename,
        });
        showToast({ message: 'Wardrobe backup generated!', type: 'success' });
      }
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Could not export wardrobe backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreBackup = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        setIsRestoring(true);
        try {
          const text = await file.text();
          const res = await restoreBackup(text);
          if (res.success) {
            showToast({
              message: `Restored ${res.count} garments from ${file.name}!`,
              type: 'success',
            });
          } else {
            Alert.alert('Restore Failed', res.error || 'Invalid backup file structure.');
          }
        } catch (err: any) {
          Alert.alert('File Read Error', err?.message || 'Could not read backup file.');
        } finally {
          setIsRestoring(false);
        }
      };
      input.click();
    } else {
      Alert.alert(
        'Restore on Mobile',
        'To restore a backup file, please open DormDrobe in Safari or Chrome and use the Restore button.',
      );
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your local clothing items and reload default seed data on next launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AppStorage.removeItem('@dormdrobe/clothing');
            await AppStorage.removeItem('@dormdrobe/saved_outfits');
            await AppStorage.removeItem('@dormdrobe/wear_history');
            showToast({ message: 'Reset complete. Refresh to reload fresh seed data.', type: 'info' });
          },
        },
      ],
    );
  };

  const stats = [
    { label: 'Total Pieces', value: items.length, color: Colors.textPrimary },
    { label: 'Clean & Ready', value: items.filter((i) => i.status === 'clean').length, color: Colors.statusClean },
    { label: 'Needs Wash', value: items.filter((i) => i.status === 'worn' || i.status === 'in_laundry').length, color: Colors.statusWorn },
    { label: getLocationLabel('batangas_dorm'), value: items.filter((i) => i.location === 'batangas_dorm').length, color: Colors.accent },
    { label: getLocationLabel('calamba_home'), value: items.filter((i) => i.location === 'calamba_home').length, color: Colors.textSecondary },
    { label: getLocationLabel('in_transit_bag'), value: items.filter((i) => i.location === 'in_transit_bag').length, color: Colors.statusDrying },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <FadeSlideIn delay={0} fromY={12}>
            <View style={styles.header}>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Privacy, backups & storage architecture</Text>
            </View>
          </FadeSlideIn>

          {/* 100% On-Device Privacy Card (Tarsi Model) */}
          <FadeSlideIn delay={60} fromY={16}>
            <View style={[styles.card, styles.privacyCard]}>
              <View style={styles.specular} />
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <ShieldCheck size={20} color={Colors.statusClean} strokeWidth={2} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>100% On-Device & Private</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: Colors.statusClean }]} />
                    <Text style={[styles.statusText, { color: Colors.statusClean }]}>
                      {isSupabaseConfigured ? 'Local-First + Optional Cloud' : 'Zero-Knowledge (Tarsi Model)'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.privacyBody}>
                Your clothes, cutout photos, and wear logs live strictly inside your device. No photos or wardrobe data are ever uploaded to a central database or viewed by developers.
              </Text>

              {/* Technical indicators */}
              <View style={styles.techPillRow}>
                <View style={styles.techPill}>
                  <Check size={12} color={Colors.statusClean} />
                  <Text style={styles.techPillText}>IndexedDB (Unlimited MB)</Text>
                </View>
                <PressableScale onPress={handleEnablePersistence}>
                  <View style={[styles.techPill, isPersisted && styles.techPillActive]}>
                    <Check size={12} color={isPersisted ? Colors.statusClean : Colors.textTertiary} />
                    <Text style={[styles.techPillText, isPersisted && { color: Colors.statusClean }]}>
                      {isPersisted ? 'Persistent Storage: Active' : 'Enable Persistence'}
                    </Text>
                  </View>
                </PressableScale>
              </View>
            </View>
          </FadeSlideIn>

          {/* Backup & Restore (Tarsi-Style Safety Net) */}
          <FadeSlideIn delay={120} fromY={16}>
            <View style={styles.card}>
              <View style={styles.specular} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <HardDrive size={20} color={Colors.textPrimary} strokeWidth={2} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Wardrobe Backup & Restore</Text>
                  <Text style={styles.cardSubtitle}>Never lose your clothes if switching phones</Text>
                </View>
              </View>

              <Text style={styles.backupHint}>
                Export a single JSON file to your iPhone Files app or Google Drive. You can restore this file on any device anytime.
              </Text>

              <View style={styles.backupActionRow}>
                <PressableScale onPress={handleExportBackup} style={styles.actionBtnWrapper}>
                  <View style={styles.backupBtnPrimary}>
                    <DownloadSimple size={16} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.backupBtnTextPrimary}>
                      {isExporting ? 'Exporting...' : 'Export Backup'}
                    </Text>
                  </View>
                </PressableScale>

                <PressableScale onPress={handleRestoreBackup} style={styles.actionBtnWrapper}>
                  <View style={styles.backupBtnSecondary}>
                    <UploadSimple size={16} color={Colors.textPrimary} strokeWidth={2} />
                    <Text style={styles.backupBtnTextSecondary}>
                      {isRestoring ? 'Restoring...' : 'Restore'}
                    </Text>
                  </View>
                </PressableScale>
              </View>
            </View>
          </FadeSlideIn>

          {/* Custom Locations Configuration */}
          <FadeSlideIn delay={150} fromY={16}>
            <View style={styles.card}>
              <View style={styles.specular} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <LocationIcon location="batangas_dorm" size={20} color={Colors.textPrimary} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Custom Location Names</Text>
                  <Text style={styles.cardSubtitle}>Personalize for your school, dorm, or city</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DORM / CAMPUS RESIDENCE</Text>
                <View style={styles.inputRow}>
                  <LocationIcon location="batangas_dorm" size={16} color={Colors.locBatangas} />
                  <TextInput
                    style={styles.textInput}
                    value={dormName}
                    onChangeText={setDormName}
                    placeholder="e.g. Batangas Dorm, Taft Condo, UP Dorm"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>HOME / FAMILY RESIDENCE</Text>
                <View style={styles.inputRow}>
                  <LocationIcon location="calamba_home" size={16} color={Colors.locCalamba} />
                  <TextInput
                    style={styles.textInput}
                    value={homeName}
                    onChangeText={setHomeName}
                    placeholder="e.g. Calamba Home, Family House, Cavite Home"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>LUGGAGE / TRANSIT BAG</Text>
                <View style={styles.inputRow}>
                  <LocationIcon location="in_transit_bag" size={16} color={Colors.locInTransit} />
                  <TextInput
                    style={styles.textInput}
                    value={bagName}
                    onChangeText={setBagName}
                    placeholder="e.g. In-Transit Bag, Weekend Duffel"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
              </View>

              <PressableScale onPress={handleSaveLocationNames} scaleTo={0.96} style={{ marginTop: Spacing.sm }}>
                <View style={styles.saveBtn}>
                  <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.saveBtnText}>Save Location Names</Text>
                </View>
              </PressableScale>
            </View>
          </FadeSlideIn>

          {/* Stats */}
          <FadeSlideIn delay={180} fromY={16}>
            <View style={styles.card}>
              <View style={styles.specular} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <BarChart3 size={20} color={Colors.textPrimary} strokeWidth={2} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Wardrobe Inventory</Text>
                  <Text style={styles.cardSubtitle}>{items.length} items logged</Text>
                </View>
              </View>
              <View style={styles.statsGrid}>
                {stats.map((s) => (
                  <View key={s.label} style={styles.statCell}>
                    <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeSlideIn>

          {/* Data management / Danger zone */}
          <FadeSlideIn delay={240} fromY={16}>
            <View style={styles.card}>
              <View style={styles.specular} />
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <Layers size={20} color={Colors.textPrimary} strokeWidth={2} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Reset Wardrobe</Text>
                </View>
              </View>
              <PressableScale onPress={handleClearData} scaleTo={0.96}>
                <View style={styles.dangerBtn}>
                  <Text style={styles.dangerBtnText}>Reset to Default Seed Data</Text>
                </View>
              </PressableScale>
              <Text style={styles.hint}>
                Clears current custom pieces and resets to fresh starter student items.
              </Text>
            </View>
          </FadeSlideIn>

          {/* About */}
          <FadeSlideIn delay={300} fromY={16}>
            <View style={[styles.card, styles.aboutCard]}>
              <View style={styles.specular} />
              <PressableScale scaleTo={0.92}>
                <View style={styles.aboutLogo}>
                  <Shirt size={32} color="#FFFFFF" strokeWidth={1.8} />
                </View>
              </PressableScale>
              <Text style={styles.aboutAppName}>DormDrobe</Text>
              <Text style={styles.aboutTagline}>Your private multi-location wardrobe companion</Text>
              <Text style={styles.aboutDesc}>
                Architected for students commuting between Batangas Dorm and Calamba Home. Zero tracking. 100% Local-First.
              </Text>
              <Text style={styles.version}>v1.0.0 (Local-First PWA Edition)</Text>
            </View>
          </FadeSlideIn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgBase },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: Spacing.xs,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20,20,19,0.06)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  privacyCard: {
    borderColor: 'rgba(22, 163, 74, 0.16)',
    backgroundColor: '#FCFDFB',
  },
  specular: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgSubtle,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: { flex: 1 },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  cardSubtitle: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  privacyBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  techPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20,20,19,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  techPillActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  techPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  backupHint: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  backupActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnWrapper: {
    flex: 1,
  },
  backupBtnPrimary: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radii.lg,
  },
  backupBtnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backupBtnSecondary: {
    backgroundColor: Colors.bgSubtle,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radii.lg,
  },
  backupBtnTextSecondary: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: Colors.textTertiary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  statCell: {
    width: '30.5%',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.bgSubtle,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  statNum: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
    textAlign: 'center',
  },
  dangerBtn: {
    backgroundColor: 'rgba(220,38,38,0.06)',
    borderRadius: Radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.18)',
    marginBottom: 2,
  },
  dangerBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  aboutLogo: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  aboutAppName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  aboutTagline: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  aboutDesc: {
    color: Colors.textTertiary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  version: {
    color: Colors.textInactive,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginTop: Spacing.sm,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgSubtle,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: 12,
    marginTop: Spacing.xs,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
