import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleSendOtp = () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    setIsOtpSent(true);
    Alert.alert('OTP Sent', `Verification code sent to ${email}`);
  };

  const handleVerifyOtp = () => {
    if (!otp.trim()) {
      Alert.alert('Required', 'Please enter 6-digit OTP code.');
      return;
    }
    Alert.alert('Verified!', 'Login successful.');
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={36} color="#ffffff" />
          </View>
          <Text style={styles.brandTitle}>Coaching ERP</Text>
          <Text style={styles.brandSub}>Teacher & Management App</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Login to Institute</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="teacher@coaching.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {isOtpSent ? (
            <>
              <Text style={styles.label}>Enter 6-Digit Verification Code</Text>
              <TextInput
                style={styles.input}
                placeholder="123456"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
                <Text style={styles.primaryBtnText}>Verify & Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp}>
                <Text style={styles.primaryBtnText}>Send Login OTP</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandTitle: { fontSize: 24, fontWeight: '900', color: '#ffffff' },
  brandSub: { fontSize: 13, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  cardHeader: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 6 },
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
  primaryBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
