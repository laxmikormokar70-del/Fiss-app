import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const [instituteName, setInstituteName] = useState('Apex Coaching Institute');
  const [teacherName, setTeacherName] = useState('Amit Sir');
  const [phone, setPhone] = useState('9876543210');
  const [pinLockEnabled, setPinLockEnabled] = useState(true);
  const [timeLockEnabled, setTimeLockEnabled] = useState(true);

  const handleSave = () => {
    Alert.alert('Settings Saved', 'Coaching ERP settings updated successfully.');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header Card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{teacherName.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{teacherName}</Text>
        <Text style={styles.sub}>{instituteName}</Text>
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
          <Text style={styles.verifiedText}>Verified Teacher</Text>
        </View>
      </View>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Institute Details</Text>

        <Text style={styles.fieldLabel}>Institute / Coaching Name</Text>
        <TextInput style={styles.input} value={instituteName} onChangeText={setInstituteName} />

        <Text style={styles.fieldLabel}>Teacher Full Name</Text>
        <TextInput style={styles.input} value={teacherName} onChangeText={setTeacherName} />

        <Text style={styles.fieldLabel}>Mobile Number</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security & Access Locks</Text>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>4-Digit PIN Security</Text>
            <Text style={styles.toggleSub}>Require PIN when opening app</Text>
          </View>
          <Switch
            value={pinLockEnabled}
            onValueChange={setPinLockEnabled}
            trackColor={{ false: '#cbd5e1', true: '#86efac' }}
            thumbColor={pinLockEnabled ? '#16a34a' : '#f1f5f9'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Time-Based Auto Lock</Text>
            <Text style={styles.toggleSub}>Lock attendance editing outside batch hours</Text>
          </View>
          <Switch
            value={timeLockEnabled}
            onValueChange={setTimeLockEnabled}
            trackColor={{ false: '#cbd5e1', true: '#86efac' }}
            thumbColor={timeLockEnabled ? '#16a34a' : '#f1f5f9'}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Ionicons name="save-outline" size={20} color="#ffffff" />
        <Text style={styles.saveBtnText}>Save Profile Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert('Logged Out', 'Redirecting to login...')}>
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.logoutBtnText}>Log Out Account</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 26, fontWeight: '900', color: '#ffffff' },
  name: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  sub: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '600' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 8,
  },
  verifiedText: { fontSize: 11, fontWeight: '800', color: '#15803d' },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  toggleSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  saveBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '800' },
});
