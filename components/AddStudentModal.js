import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddStudentModal({ visible, onClose, onSave }) {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [className, setClassName] = useState('Class 10');
  const [monthlyFee, setMonthlyFee] = useState('1000');

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter student name.');
      return;
    }
    onSave({
      name: name.trim(),
      rollNumber: rollNumber.trim() || String(Math.floor(100 + Math.random() * 900)),
      phone: phone.trim(),
      className: className.trim(),
      monthlyFee: Number(monthlyFee) || 1000,
      dueAmount: Number(monthlyFee) || 1000,
      status: 'Due',
      createdAt: new Date().toISOString(),
    });
    setName('');
    setRollNumber('');
    setPhone('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Student</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>Student Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Roll Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 101"
              value={rollNumber}
              onChangeText={setRollNumber}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Guardian Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Class / Grade</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Class 10"
              value={className}
              onChangeText={setClassName}
            />

            <Text style={styles.label}>Monthly Fee (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1000"
              value={monthlyFee}
              onChangeText={setMonthlyFee}
              keyboardType="number-pad"
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.saveText}>Save Student</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  form: {
    marginVertical: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
