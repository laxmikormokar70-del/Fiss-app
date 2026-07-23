import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatCard({ title, value, subtitle, icon, color = '#16a34a', bg = '#f0fdf4' }) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: color }]}>
          <Ionicons name={icon} size={18} color="#ffffff" />
        </View>
        <Text style={[styles.title, { color: color }]}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 4,
    marginVertical: 4,
    minWidth: 140,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
});
