import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import adminApi, { setAdminPassword } from '../services/adminApi';

export default function AdminLoginScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!password) return Alert.alert('Missing', 'Enter the admin password');
    try {
      setBusy(true);
      await adminApi.post('/api/admin/login', { password });
      await setAdminPassword(password);
      navigation.replace('AdminDashboard');
    } catch (err) {
      Alert.alert('Access denied', err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Oslo's Concierge</Text>
      <Text style={styles.sub}>ADMIN ACCESS</Text>

      <TextInput
        style={styles.input}
        placeholder="Admin password"
        placeholderTextColor="#888"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={busy}>
        {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Unlock</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back to app</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F', justifyContent: 'center', padding: 24 },
  logo: { color: '#D4AF37', fontSize: 26, fontWeight: '700', textAlign: 'center' },
  sub: { color: '#666', textAlign: 'center', marginBottom: 36, marginTop: 6, letterSpacing: 3, fontSize: 12 },
  input: {
    backgroundColor: '#16161C', color: '#fff', padding: 16, borderRadius: 12,
    marginBottom: 14, borderWidth: 1, borderColor: '#26262E',
  },
  button: { backgroundColor: '#D4AF37', padding: 16, borderRadius: 12, marginTop: 8 },
  buttonText: { color: '#000', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  link: { color: '#D4AF37', textAlign: 'center', marginTop: 22 },
});
