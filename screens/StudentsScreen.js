import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StudentCard from '../components/StudentCard';
import AddStudentModal from '../components/AddStudentModal';

const INITIAL_STUDENTS = [
  { id: '1', name: 'Aarav Sharma', rollNumber: '101', className: 'Class 10', phone: '9876543210', dueAmount: 0, status: 'Paid' },
  { id: '2', name: 'Priya Verma', rollNumber: '102', className: 'Class 10', phone: '9876543211', dueAmount: 1200, status: 'Due' },
  { id: '3', name: 'Rohan Gupta', rollNumber: '103', className: 'Class 12', phone: '9876543212', dueAmount: 0, status: 'Paid' },
  { id: '4', name: 'Sneha Patel', rollNumber: '104', className: 'Class 12', phone: '9876543213', dueAmount: 1500, status: 'Due' },
  { id: '5', name: 'Karan Malhotra', rollNumber: '105', className: 'Class 11', phone: '9876543214', dueAmount: 800, status: 'Due' },
  { id: '6', name: 'Ananya Roy', rollNumber: '106', className: 'Class 11', phone: '9876543215', dueAmount: 0, status: 'Paid' },
];

export default function StudentsScreen() {
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [addModalVisible, setAddModalVisible] = useState(false);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber.includes(search);
    const matchesFilter = filterClass === 'All' || s.className === filterClass;
    return matchesSearch && matchesFilter;
  });

  const handleAddStudent = (newStudent) => {
    setStudents(prev => [{ id: String(Date.now()), ...newStudent }, ...prev]);
  };

  return (
    <View style={styles.container}>
      {/* Search & Add Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or roll number..."
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Class Filters */}
      <View style={styles.filterRow}>
        {['All', 'Class 10', 'Class 11', 'Class 12'].map(cls => (
          <TouchableOpacity
            key={cls}
            style={[styles.filterChip, filterClass === cls && styles.filterChipActive]}
            onPress={() => setFilterClass(cls)}
          >
            <Text style={[styles.filterText, filterClass === cls && styles.filterTextActive]}>
              {cls}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onPress={() => Alert.alert('Student Card', `Name: ${item.name}\nRoll: ${item.rollNumber}\nClass: ${item.className}\nDue: ₹${item.dueAmount}`)}
            onCall={() => Alert.alert('Dialer', `Calling guardian at ${item.phone}`)}
            onPay={() => Alert.alert('Fee Collector', `Record payment for ${item.name}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptySub}>Try searching with a different keyword or class.</Text>
          </View>
        }
      />

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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    marginLeft: 8,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});
