import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SignUpScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', city: '' });
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSignUp = async () => {
    if (!form.name || !form.email || !form.password) {
      return Alert.alert('Missing info', 'Name, email and password are required');
    }
    if (Number(form.age) < 18) {
      return Alert.alert('Age restriction', 'You must be 18 or older to join');
    }
    try {
      setBusy(true);
      await register({ ...form, age: Number(form.age) });
    } catch (err) {
      Alert.alert('Sign up failed', err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create your account</Text>

      <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#888"
        value={form.name} onChangeText={set('name')} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888"
        autoCapitalize="none" keyboardType="email-address"
        value={form.email} onChangeText={set('email')} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888"
        secureTextEntry value={form.password} onChangeText={set('password')} />
      <TextInput style={styles.input} placeholder="Age (18+)" placeholderTextColor="#888"
        keyboardType="number-pad" value={form.age} onChangeText={set('age')} />
      <TextInput style={styles.input} placeholder="City" placeholderTextColor="#888"
        value={form.city} onChangeText={set('city')} />

      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={busy}>
        {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Join</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Already a member? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0B0B0F', padding: 24, justifyContent: 'center' },
  title: { color: '#D4AF37', fontSize: 24, fontWeight: '700', marginBottom: 26, textAlign: 'center' },
  input: {
    backgroundColor: '#16161C', color: '#fff', padding: 16, borderRadius: 12,
    marginBottom: 14, borderWidth: 1, borderColor: '#26262E',
  },
  button: { backgroundColor: '#D4AF37', padding: 16, borderRadius: 12, marginTop: 8 },
  buttonText: { color: '#000', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  link: { color: '#D4AF37', textAlign: 'center', marginTop: 22 },
});
