import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STUDENTS_LIST = [
  { id: '1', name: 'Aarav Sharma', rollNumber: '101', status: 'Present' },
  { id: '2', name: 'Priya Verma', rollNumber: '102', status: 'Absent' },
  { id: '3', name: 'Rohan Gupta', rollNumber: '103', status: 'Present' },
  { id: '4', name: 'Sneha Patel', rollNumber: '104', status: 'Present' },
  { id: '5', name: 'Karan Malhotra', rollNumber: '105', status: 'Late' },
];

export default function AttendanceScreen() {
  const [attendance, setAttendance] = useState(
    STUDENTS_LIST.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.status }), {})
  );

  const toggleStatus = (id, newStatus) => {
    setAttendance(prev => ({ ...prev, [id]: newStatus }));
  };

  const presentCount = Object.values(attendance).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'Absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'Late').length;

  const handleSaveAttendance = () => {
    Alert.alert('Attendance Saved', `Marked ${presentCount} Present, ${absentCount} Absent, ${lateCount} Late.`);
  };

  return (
    <View style={styles.container}>
      {/* Batch Header */}
      <View style={styles.batchBanner}>
        <View>
          <Text style={styles.batchName}>Class 10 - Mathematics</Text>
          <Text style={styles.batchTime}>Today's Batch • 05:00 PM</Text>
        </View>
        <TouchableOpacity style={styles.qrBtn} onPress={() => Alert.alert('QR Scanner', 'Launching Camera QR Scanner...')}>
          <Ionicons name="qr-code-outline" size={20} color="#ffffff" />
          <Text style={styles.qrBtnText}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Chips */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryBox, styles.bgPresent]}>
          <Text style={styles.summaryNum}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>PRESENT</Text>
        </View>
        <View style={[styles.summaryBox, styles.bgAbsent]}>
          <Text style={styles.summaryNum}>{absentCount}</Text>
          <Text style={styles.summaryLabel}>ABSENT</Text>
        </View>
        <View style={[styles.summaryBox, styles.bgLate]}>
          <Text style={styles.summaryNum}>{lateCount}</Text>
          <Text style={styles.summaryLabel}>LATE</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={STUDENTS_LIST}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const status = attendance[item.id] || 'Present';
          return (
            <View style={styles.rowCard}>
              <View style={styles.studentInfo}>
                <Text style={styles.rollNum}>#{item.rollNumber}</Text>
                <Text style={styles.studentName}>{item.name}</Text>
              </View>

              <View style={styles.actionGroup}>
                <TouchableOpacity
                  style={[styles.statusToggle, status === 'Present' && styles.togglePresent]}
                  onPress={() => toggleStatus(item.id, 'Present')}
                >
                  <Text style={[styles.toggleText, status === 'Present' && styles.toggleTextActive]}>P</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusToggle, status === 'Absent' && styles.toggleAbsent]}
                  onPress={() => toggleStatus(item.id, 'Absent')}
                >
                  <Text style={[styles.toggleText, status === 'Absent' && styles.toggleTextActive]}>A</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusToggle, status === 'Late' && styles.toggleLate]}
                  onPress={() => toggleStatus(item.id, 'Late')}
                >
                  <Text style={[styles.toggleText, status === 'Late' && styles.toggleTextActive]}>L</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Bottom Save Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAttendance}>
          <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
          <Text style={styles.saveBtnText}>Submit & Send SMS Alerts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  batchBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 18,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  batchTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  qrBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  summaryBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  bgPresent: { backgroundColor: '#dcfce7' },
  bgAbsent: { backgroundColor: '#fee2e2' },
  bgLate: { backgroundColor: '#fef3c7' },
  summaryNum: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  summaryLabel: { fontSize: 10, fontWeight: '800', color: '#475569', marginTop: 2 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rollNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  statusToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  togglePresent: { backgroundColor: '#22c55e' },
  toggleAbsent: { backgroundColor: '#ef4444' },
  toggleLate: { backgroundColor: '#f59e0b' },
  toggleText: { fontSize: 14, fontWeight: '800', color: '#64748b' },
  toggleTextActive: { color: '#ffffff' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
