import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

const showAlert = (t, m) => {
  if (Platform.OS === 'web') window.alert(`${t}\n\n${m}`);
  else Alert.alert(t, m);
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return showAlert('Missing', 'Enter email and password');
    try {
      setBusy(true);
      await login(email.trim(), password);
    } catch (err) {
      showAlert('Login failed', err?.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Oslo's Concierge</Text>
      <Text style={styles.sub}>Private. Curated. Verified.</Text>

      <TextInput
        style={styles.input} placeholder="Email" placeholderTextColor="#888"
        autoCapitalize="none" keyboardType="email-address"
        value={email} onChangeText={setEmail}
      />
      <TextInput
        style={styles.input} placeholder="Password" placeholderTextColor="#888"
        secureTextEntry value={password} onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={busy}>
        {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>No account? Create one</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F', justifyContent: 'center', padding: 24 },
  logo: { color: '#D4AF37', fontSize: 30, fontWeight: '700', textAlign: 'center' },
  sub: { color: '#777', textAlign: 'center', marginBottom: 36, marginTop: 6, letterSpacing: 1 },
  input: {
    backgroundColor: '#16161C', color: '#fff', padding: 16, borderRadius: 12,
    marginBottom: 14, borderWidth: 1, borderColor: '#26262E',
  },
  button: { backgroundColor: '#D4AF37', padding: 16, borderRadius: 12, marginTop: 8 },
  buttonText: { color: '#000', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  link: { color: '#D4AF37', textAlign: 'center', marginTop: 22 },
});
