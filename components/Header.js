import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ teacherName, instituteName, onProfilePress }) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {teacherName ? teacherName.charAt(0).toUpperCase() : 'T'}
          </Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.greetingText}>Welcome Back 👋</Text>
          <Text style={styles.nameText}>{teacherName || 'Teacher'}</Text>
          <Text style={styles.subText}>{instituteName || 'Coaching ERP'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
        <Ionicons name="settings-outline" size={22} color="#0f172a" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 18,
  },
  textContainer: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
