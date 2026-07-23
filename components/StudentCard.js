import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StudentCard({ student, onPress, onCall, onPay }) {
  const isPaid = student.status === 'Paid' || (student.dueAmount && student.dueAmount <= 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        {student.photoUrl ? (
          <Image source={{ uri: student.photoUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>
            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
          </Text>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{student.name || 'Unnamed Student'}</Text>
          <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgeDue]}>
            <Text style={[styles.badgeText, isPaid ? styles.badgeTextPaid : styles.badgeTextDue]}>
              {isPaid ? 'PAID' : `DUE ₹${student.dueAmount || 0}`}
            </Text>
          </View>
        </View>

        <Text style={styles.details}>
          Roll: {student.rollNumber || 'N/A'} • Class: {student.className || 'General'}
        </Text>
        <Text style={styles.phone}>
          📞 {student.phone || 'No phone'}
        </Text>
      </View>

      <View style={styles.actions}>
        {onCall && (
          <TouchableOpacity style={styles.actionBtn} onPress={onCall}>
            <Ionicons name="call-outline" size={18} color="#16a34a" />
          </TouchableOpacity>
        )}
        {onPay && !isPaid && (
          <TouchableOpacity style={[styles.actionBtn, styles.payBtn]} onPress={onPay}>
            <Ionicons name="wallet-outline" size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  details: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  phone: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 2,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePaid: {
    backgroundColor: '#dcfce7',
  },
  badgeDue: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextPaid: {
    color: '#15803d',
  },
  badgeTextDue: {
    color: '#b91c1c',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtn: {
    backgroundColor: '#16a34a',
  },
});
