import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function EditProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age ? String(user.age) : '',
    city: user?.city || '',
    bio: user?.bio || '',
    lookingFor: user?.lookingFor || '',
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    try {
      setBusy(true);
      await api.put('/api/auth/profile', {
        ...form,
        age: form.age ? Number(form.age) : undefined,
      });
      await refreshUser();
      Alert.alert('Saved', 'Profile updated');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Permission needed', 'Allow photo access to upload images');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.6,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const base64 = asset.base64
      ? `data:image/jpeg;base64,${asset.base64}`
      : null;

    if (!base64) return Alert.alert('Error', 'Could not read image');

    try {
      setUploading(true);
      await api.post('/api/auth/photos', { image: base64 });
      await refreshUser();
    } catch (err) {
      Alert.alert('Upload failed', err?.response?.data?.message || err.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (index) => {
    try {
      await api.delete(`/api/auth/photos/${index}`);
      await refreshUser();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.section}>Photos</Text>
      <View style={styles.photoRow}>
        {(user?.photos || []).map((p, i) => (
          <TouchableOpacity key={i} onPress={() => removePhoto(i)} style={styles.thumbWrap}>
            <Image source={{ uri: p }} style={styles.thumb} />
            <View style={styles.removeBadge}><Text style={styles.removeText}>x</Text></View>
          </TouchableOpacity>
        ))}
        {(user?.photos?.length || 0) < 6 && (
          <TouchableOpacity style={styles.addPhoto} onPress={pickImage} disabled={uploading}>
            {uploading
              ? <ActivityIndicator color="#D4AF37" />
              : <Text style={styles.addPhotoText}>+</Text>}
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.hint}>Tap a photo to remove it. Max 6.</Text>

      <Text style={styles.section}>Name</Text>
      <TextInput style={styles.input} value={form.name} onChangeText={set('name')} />

      <Text style={styles.section}>Age</Text>
      <TextInput style={styles.input} value={form.age} onChangeText={set('age')}
        keyboardType="number-pad" placeholder="18+" placeholderTextColor="#666" />

      <Text style={styles.section}>City</Text>
      <TextInput style={styles.input} value={form.city} onChangeText={set('city')} />

      <Text style={styles.section}>Bio</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={form.bio} onChangeText={set('bio')}
        multiline maxLength={500}
        placeholder="Tell members about yourself..."
        placeholderTextColor="#666"
      />

      <Text style={styles.section}>Looking for</Text>
      <TextInput
        style={styles.input}
        value={form.lookingFor} onChangeText={set('lookingFor')}
        placeholder="e.g. Social events, dinner companionship"
        placeholderTextColor="#666"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={busy}>
        {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F', padding: 20 },
  section: { color: '#888', fontSize: 12, letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  input: {
    backgroundColor: '#16161C', color: '#fff', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#26262E', fontSize: 15,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap' },
  thumbWrap: { position: 'relative', marginRight: 10, marginBottom: 10 },
  thumb: { width: 90, height: 110, borderRadius: 10 },
  removeBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#D4AF37', width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: '#000', fontWeight: '700', fontSize: 14, lineHeight: 16 },
  addPhoto: {
    width: 90, height: 110, borderRadius: 10,
    borderWidth: 1, borderColor: '#D4AF37', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addPhotoText: { color: '#D4AF37', fontSize: 32, fontWeight: '300' },
  hint: { color: '#555', fontSize: 12, marginTop: 8 },
  button: {
    backgroundColor: '#D4AF37', padding: 16, borderRadius: 12, marginTop: 30,
  },
  buttonText: { color: '#000', textAlign: 'center', fontWeight: '700', fontSize: 16 },
});
