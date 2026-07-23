import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import StatCard from '../components/StatCard';
import ScheduleCard from '../components/ScheduleCard';
import QuickActionButton from '../components/QuickActionButton';
import StudentCard from '../components/StudentCard';
import AddStudentModal from '../components/AddStudentModal';

// Mock initial data if Firestore is syncing
const INITIAL_STUDENTS = [
  { id: '1', name: 'Aarav Sharma', rollNumber: '101', className: 'Class 10', phone: '9876543210', dueAmount: 0, status: 'Paid' },
  { id: '2', name: 'Priya Verma', rollNumber: '102', className: 'Class 10', phone: '9876543211', dueAmount: 1200, status: 'Due' },
  { id: '3', name: 'Rohan Gupta', rollNumber: '103', className: 'Class 12', phone: '9876543212', dueAmount: 0, status: 'Paid' },
  { id: '4', name: 'Sneha Patel', rollNumber: '104', className: 'Class 12', phone: '9876543213', dueAmount: 1500, status: 'Due' },
];

export default function DashboardScreen({ navigation }) {
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAddStudent = (newStudent) => {
    setStudents(prev => [{ id: String(Date.now()), ...newStudent }, ...prev]);
    Alert.alert('Success', `${newStudent.name} added successfully!`);
  };

  const totalStudents = students.length;
  const totalPaid = students.filter(s => s.status === 'Paid' || s.dueAmount <= 0).length;
  const totalDueAmount = students.reduce((sum, s) => sum + (s.dueAmount || 0), 0);

  return (
    <View style={styles.container}>
      <Header
        teacherName="Amit Sir"
        instituteName="Apex Coaching Institute"
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <StatCard
              title="Total Students"
              value={String(totalStudents)}
              subtitle="Active Enrollment"
              icon="people"
              color="#2563eb"
              bg="#eff6ff"
            />
            <StatCard
              title="Attendance Rate"
              value="94.2%"
              subtitle="Today's Average"
              icon="checkmark-done"
              color="#16a34a"
              bg="#f0fdf4"
            />
          </View>

          <View style={styles.statRow}>
            <StatCard
              title="Paid Fees"
              value={`${totalPaid}/${totalStudents}`}
              subtitle="Clear Records"
              icon="card"
              color="#0284c7"
              bg="#f0f9ff"
            />
            <StatCard
              title="Pending Dues"
              value={`₹${totalDueAmount}`}
              subtitle="Action Required"
              icon="alert-circle"
              color="#dc2626"
              bg="#fef2f2"
            />
          </View>
        </View>

        {/* Live Schedule */}
        <ScheduleCard
          batchName="Class 10 - Mathematics"
          className="CBSE Batch A"
          startTime="05:00 PM"
          endTime="06:30 PM"
          onMarkPress={() => navigation.navigate('Attendance')}
        />

        {/* Quick Action Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Management</Text>
        </View>

        <View style={styles.quickGrid}>
          <QuickActionButton
            title="Add Student"
            icon="person-add"
            color="#2563eb"
            onPress={() => setAddModalVisible(true)}
          />
          <QuickActionButton
            title="Attendance"
            icon="checkbox"
            color="#16a34a"
            onPress={() => navigation.navigate('Attendance')}
          />
          <QuickActionButton
            title="Fee Collect"
            icon="wallet"
            color="#d97706"
            onPress={() => navigation.navigate('Fees')}
          />
          <QuickActionButton
            title="Reports"
            icon="document-text"
            color="#9333ea"
            onPress={() => navigation.navigate('Reports')}
          />
        </View>

        {/* Recent Students Roster */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>Recent Students</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Students')}>
            <Text style={styles.viewAllText}>View All ({totalStudents}) →</Text>
          </TouchableOpacity>
        </View>

        {students.slice(0, 3).map(student => (
          <StudentCard
            key={student.id}
            student={student}
            onPress={() => Alert.alert('Student Details', `${student.name} - ${student.className}`)}
            onCall={() => Alert.alert('Calling', `Dialing ${student.phone}`)}
          />
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>

      <AddStudentModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddStudent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statsContainer: {
    marginBottom: 6,
  },
  statRow: {
    flexDirection: 'row',
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 8,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
