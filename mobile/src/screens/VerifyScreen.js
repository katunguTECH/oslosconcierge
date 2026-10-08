import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const showAlert = (t, m) => {
  if (Platform.OS === 'web') window.alert(`${t}\n\n${m}`);
  else Alert.alert(t, m);
};

export default function VerifyScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [busyE, setBusyE] = useState(false);
  const [busyP, setBusyP] = useState(false);
  const [sentE, setSentE] = useState(false);
  const [sentP, setSentP] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => { try { await refreshUser(); } catch (e) {} })();
    }, [])
  );

  const emailVerified = user?.emailVerified;
  const phoneVerified = user?.phoneVerified;
  const hasPhone = !!(user?.phone && user.phone.trim() !== '');

  const savePhone = async () => {
    if (!phoneInput.trim()) return showAlert('Missing', 'Enter your phone number');
    try {
      setBusyP(true);
      await api.post('/api/verify/set-phone', { phone: phoneInput });
      await refreshUser();
      showAlert('Saved', 'Phone number saved');
      setPhoneInput('');
    } catch (err) {
      showAlert('Error', err?.response?.data?.message || err.message);
    } finally { setBusyP(false); }
  };

  const sendEmail = async () => {
    try {
      setBusyE(true);
      await api.post('/api/verify/send-email');
      setSentE(true);
      showAlert('Sent', `Code sent to ${user?.email}`);
    } catch (err) {
      showAlert('Error', err?.response?.data?.message || err.message);
    } finally { setBusyE(false); }
  };

  const checkEmail = async () => {
    if (!emailCode) return showAlert('Missing', 'Enter the code');
    try {
      setBusyE(true);
      await api.post('/api/verify/check-email', { code: emailCode });
      await refreshUser();
      showAlert('Success', 'Email verified');
      setEmailCode('');
    } catch (err) {
      showAlert('Error', err?.response?.data?.message || err.message);
    } finally { setBusyE(false); }
  };

  const sendPhone = async () => {
    try {
      setBusyP(true);
      await api.post('/api/verify/send-phone');
      setSentP(true);
      showAlert('Sent', `SMS sent to ${user?.phone}`);
    } catch (err) {
      showAlert('Error', err?.response?.data?.message || err.message);
    } finally { setBusyP(false); }
  };

  const checkPhone = async () => {
    if (!phoneCode) return showAlert('Missing', 'Enter the code');
    try {
      setBusyP(true);
      await api.post('/api/verify/check-phone', { code: phoneCode });
      await refreshUser();
      showAlert('Success', 'Phone verified');
      setPhoneCode('');
    } catch (err) {
      showAlert('Error', err?.response?.data?.message || err.message);
    } finally { setBusyP(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.title}>Verify your account</Text>
      <Text style={styles.subtitle}>
        Confirm your email and phone to unlock the platform.
      </Text>

      {/* EMAIL */}
      <View style={[styles.card, emailVerified && styles.cardDone]}>
        <View style={styles.row}>
          <Text style={styles.stepLabel}>1. Email</Text>
          {emailVerified && <Text style={styles.done}>VERIFIED</Text>}
        </View>
        <Text style={styles.value}>{user?.email || '-'}</Text>

        {!emailVerified && (
          <>
            {!sentE ? (
              <TouchableOpacity style={styles.btn} onPress={sendEmail} disabled={busyE}>
                {busyE ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Send code</Text>}
              </TouchableOpacity>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={emailCode}
                  onChangeText={setEmailCode}
                />
                <TouchableOpacity style={styles.btn} onPress={checkEmail} disabled={busyE}>
                  {busyE ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Confirm email</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={sendEmail} disabled={busyE}>
                  <Text style={styles.resend}>Resend code</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>

      {/* PHONE */}
      <View style={[styles.card, phoneVerified && styles.cardDone]}>
        <View style={styles.row}>
          <Text style={styles.stepLabel}>2. Phone</Text>
          {phoneVerified && <Text style={styles.done}>VERIFIED</Text>}
        </View>

        {!hasPhone ? (
          <>
            <Text style={styles.value}>Add your phone number to continue</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="+254712345678"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              value={phoneInput}
              onChangeText={setPhoneInput}
            />
            <TouchableOpacity style={styles.btn} onPress={savePhone} disabled={busyP}>
              {busyP ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Save phone number</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.value}>{user?.phone}</Text>
            {!phoneVerified && (
              <>
                {!sentP ? (
                  <TouchableOpacity style={styles.btn} onPress={sendPhone} disabled={busyP}>
                    {busyP ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Send SMS code</Text>}
                  </TouchableOpacity>
                ) : (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit code"
                      placeholderTextColor="#666"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={phoneCode}
                      onChangeText={setPhoneCode}
                    />
                    <TouchableOpacity style={styles.btn} onPress={checkPhone} disabled={busyP}>
                      {busyP ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Confirm phone</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={sendPhone} disabled={busyP}>
                      <Text style={styles.resend}>Resend code</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 10 },
  subtitle: { color: '#888', lineHeight: 22, marginBottom: 20 },
  card: {
    backgroundColor: '#14141A', borderWidth: 1, borderColor: '#22222C',
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  cardDone: { borderColor: '#3A5A2A', backgroundColor: '#0F1A0C' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  stepLabel: { color: '#D4AF37', fontSize: 15, fontWeight: '700' },
  done: { color: '#7FBF5A', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  value: { color: '#ccc', fontSize: 14, marginBottom: 14 },
  input: {
    backgroundColor: '#16161C', color: '#fff', padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#26262E', fontSize: 18, letterSpacing: 4,
    textAlign: 'center', marginBottom: 10,
  },
  phoneInput: {
    backgroundColor: '#16161C', color: '#fff', padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#26262E', fontSize: 16, marginBottom: 10,
  },
  btn: { backgroundColor: '#D4AF37', padding: 14, borderRadius: 10 },
  btnText: { color: '#000', textAlign: 'center', fontWeight: '700', fontSize: 15 },
  resend: { color: '#888', textAlign: 'center', marginTop: 12, fontSize: 13 },
});
