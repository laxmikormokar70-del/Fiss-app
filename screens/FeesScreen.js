import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FEE_RECORDS = [
  { id: '1', studentName: 'Aarav Sharma', className: 'Class 10', amount: 1200, month: 'July 2026', status: 'Paid', paidDate: '2026-07-15' },
  { id: '2', studentName: 'Priya Verma', className: 'Class 10', amount: 1200, month: 'July 2026', status: 'Due', paidDate: '-' },
  { id: '3', studentName: 'Rohan Gupta', className: 'Class 12', amount: 1500, month: 'July 2026', status: 'Paid', paidDate: '2026-07-10' },
  { id: '4', studentName: 'Sneha Patel', className: 'Class 12', amount: 1500, month: 'July 2026', status: 'Due', paidDate: '-' },
];

export default function FeesScreen() {
  const [activeTab, setActiveTab] = useState('All');
  const [feeList, setFeeList] = useState(FEE_RECORDS);

  const filteredList = feeList.filter(f => activeTab === 'All' || f.status === activeTab);

  const handleCollect = (item) => {
    Alert.alert(
      'Collect Fee Payment',
      `Record ₹${item.amount} payment for ${item.studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Send Receipt',
          onPress: () => {
            setFeeList(prev => prev.map(p => p.id === item.id ? { ...p, status: 'Paid', paidDate: new Date().toISOString().split('T')[0] } : p));
            Alert.alert('Payment Received', 'Receipt dispatched via SMS & Email.');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Revenue Banner */}
      <View style={styles.revenueBanner}>
        <View style={styles.revBox}>
          <Text style={styles.revLabel}>TOTAL COLLECTED</Text>
          <Text style={styles.revAmountPaid}>₹2,700</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.revBox}>
          <Text style={styles.revLabel}>PENDING DUES</Text>
          <Text style={styles.revAmountDue}>₹2,700</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {['All', 'Due', 'Paid'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredList}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.studentName}>{item.studentName}</Text>
                <Text style={styles.subInfo}>{item.className} • {item.month}</Text>
              </View>
              <Text style={styles.amountText}>₹{item.amount}</Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>
                {item.status === 'Paid' ? `Paid on ${item.paidDate}` : 'Payment Pending'}
              </Text>

              {item.status === 'Due' ? (
                <TouchableOpacity style={styles.collectBtn} onPress={() => handleCollect(item)}>
                  <Ionicons name="cash-outline" size={16} color="#ffffff" />
                  <Text style={styles.collectBtnText}>Collect Payment</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                  <Text style={styles.paidBadgeText}>COMPLETED</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  revenueBanner: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    margin: 16,
    borderRadius: 16,
    padding: 18,
  },
  revBox: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  revLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },
  revAmountPaid: { fontSize: 20, fontWeight: '900', color: '#4ade80', marginTop: 4 },
  revAmountDue: { fontSize: 20, fontWeight: '900', color: '#f87171', marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabItemActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#ffffff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  subInfo: { fontSize: 12, color: '#64748b', marginTop: 2 },
  amountText: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dateText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  collectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  collectBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidBadgeText: { fontSize: 10, fontWeight: '800', color: '#15803d' },
});
