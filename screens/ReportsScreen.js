import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReportsScreen() {
  const handleExportPDF = () => {
    Alert.alert('Generating Report', 'Exporting PDF Attendance & Fee Analytics summary...');
  };

  const handleExportExcel = () => {
    Alert.alert('Generating Excel', 'Exporting CSV/XLSX Monthly Roster...');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Month Selector */}
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>July 2026 Summary</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
          <Ionicons name="download-outline" size={18} color="#ffffff" />
          <Text style={styles.exportBtnText}>PDF Export</Text>
        </TouchableOpacity>
      </View>

      {/* Analytics Overview Cards */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Attendance Performance</Text>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Average Daily Attendance</Text>
          <Text style={styles.valGreen}>94.2%</Text>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Total Working Days</Text>
          <Text style={styles.val}>22 Days</Text>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Most Regular Class</Text>
          <Text style={styles.val}>Class 10 (97.8%)</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Financial Analytics</Text>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Total Projected Revenue</Text>
          <Text style={styles.val}>₹5,400</Text>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Total Collected</Text>
          <Text style={styles.valGreen}>₹2,700 (50%)</Text>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Total Outstanding Dues</Text>
          <Text style={styles.valRed}>₹2,700 (50%)</Text>
        </View>
      </View>

      {/* Quick Export Actions */}
      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={handleExportPDF}>
          <Ionicons name="document-text" size={28} color="#dc2626" />
          <Text style={styles.actionTitle}>Full PDF Ledger</Text>
          <Text style={styles.actionSub}>Detailed student breakdown</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleExportExcel}>
          <Ionicons name="grid" size={28} color="#16a34a" />
          <Text style={styles.actionTitle}>Excel Sheet</Text>
          <Text style={styles.actionSub}>Raw CSV export for accounting</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  exportBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  val: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  valGreen: { fontSize: 13, fontWeight: '900', color: '#16a34a' },
  valRed: { fontSize: 13, fontWeight: '900', color: '#dc2626' },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  actionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  actionSub: { fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 2 },
});
