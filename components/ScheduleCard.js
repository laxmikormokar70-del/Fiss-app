import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ScheduleCard({ batchName, className, startTime, endTime, onMarkPress }) {
  const [timeText, setTimeText] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE SCHEDULE</Text>
        </View>
        <Text style={styles.timeClock}>{timeText || 'Active'}</Text>
      </View>

      <Text style={styles.batchTitle}>{batchName || 'Default Batch'}</Text>
      <Text style={styles.classSubtitle}>Class: {className || 'Class 10'}</Text>

      <View style={styles.footer}>
        <View style={styles.timeBox}>
          <Ionicons name="time-outline" size={16} color="#475569" />
          <Text style={styles.timeText}>{startTime || '06:00 PM'} - {endTime || '07:30 PM'}</Text>
        </View>

        <TouchableOpacity style={styles.markBtn} onPress={onMarkPress} activeOpacity={0.8}>
          <Ionicons name="checkbox-outline" size={16} color="#ffffff" />
          <Text style={styles.markBtnText}>Take Attendance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: 0.5,
  },
  timeClock: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  batchTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  classSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  markBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
