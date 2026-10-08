import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function VerifyScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [idPhoto, setIdPhoto] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try { await refreshUser(); } catch (e) { /* ignore */ }
      })();
    }, [])
  );

  const status = user?.verification?.status || 'unverified';

  const pickImage = async (setter) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Permission needed', 'Allow photo access to upload documents');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) return Alert.alert('Error', 'Could not read image');
    setter(`data:image/jpeg;base64,${asset.base64}`);
  };

  const handleSubmit = async () => {
    if (!idPhoto || !selfie) {
      return Alert.alert('Missing photos', 'Upload both your ID and a selfie');
    }
    try {
      setBusy(true);
      await api.post('/api/auth/verify', { idPhoto, selfie });
      await refreshUser();
      Alert.alert('Submitted', 'Our team will review within 24 hours.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  if (status === 'approved') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigIcon}>OK</Text>
        <Text style={styles.approvedTitle}>You are verified</Text>
        <Text style={styles.approvedText}>
          Your identity has been confirmed. Other members see a verified badge on your profile.
        </Text>
      </View>
    );
  }

  if (status === 'pending') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigIcon}>...</Text>
        <Text style={styles.pendingTitle}>Verification under review</Text>
        <Text style={styles.pendingText}>
          Our team is reviewing your documents. This usually takes less than 24 hours.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.title}>Verify your identity</Text>
      <Text style={styles.subtitle}>
        Verified members get higher trust, better matches, and access to premium features.
        Your documents are stored privately and never shown to other users.
      </Text>

      {status === 'rejected' && (
        <View style={styles.rejectedBox}>
          <Text style={styles.rejectedText}>
            Your previous verification was rejected.
            {user?.verification?.rejectionReason ? ` Reason: ${user.verification.rejectionReason}` : ''}
          </Text>
        </View>
      )}

      <Text style={styles.label}>1. Government-issued ID</Text>
      <Text style={styles.help}>National ID, passport, or driver's license</Text>
      <TouchableOpacity style={styles.upload} onPress={() => pickImage(setIdPhoto)}>
        {idPhoto ? (
          <Image source={{ uri: idPhoto }} style={styles.preview} />
        ) : (
          <Text style={styles.uploadText}>+ Upload ID</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>2. Selfie</Text>
      <Text style={styles.help}>A clear photo of your face</Text>
      <TouchableOpacity style={styles.upload} onPress={() => pickImage(setSelfie)}>
        {selfie ? (
          <Image source={{ uri: selfie }} style={styles.preview} />
        ) : (
          <Text style={styles.uploadText}>+ Take/Upload Selfie</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Submit for Review</Text>}
      </TouchableOpacity>

      <Text style={styles.privacy}>
        Your ID is encrypted and only visible to our verification team.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  center: { flex: 1, backgroundColor: '#0B0B0F', padding: 30, justifyContent: 'center', alignItems: 'center' },
  bigIcon: {
    color: '#D4AF37', fontSize: 60, fontWeight: '700', marginBottom: 20,
  },
  approvedTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  approvedText: { color: '#888', textAlign: 'center', lineHeight: 22 },
  pendingTitle: { color: '#D4AF37', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  pendingText: { color: '#888', textAlign: 'center', lineHeight: 22 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 12 },
  subtitle: { color: '#888', lineHeight: 22, marginBottom: 24 },
  label: { color: '#D4AF37', fontSize: 15, fontWeight: '600', marginTop: 20, marginBottom: 6 },
  help: { color: '#666', fontSize: 13, marginBottom: 10 },
  upload: {
    borderWidth: 1, borderColor: '#D4AF37', borderStyle: 'dashed',
    borderRadius: 12, height: 180,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#16161C',
  },
  uploadText: { color: '#D4AF37', fontSize: 16 },
  preview: { width: '100%', height: '100%', borderRadius: 12 },
  button: {
    backgroundColor: '#D4AF37', padding: 16, borderRadius: 12, marginTop: 30,
  },
  buttonText: { color: '#000', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  privacy: { color: '#555', textAlign: 'center', fontSize: 12, marginTop: 16 },
  rejectedBox: {
    backgroundColor: '#2A0F0F', borderWidth: 1, borderColor: '#5A1F1F',
    borderRadius: 10, padding: 14, marginBottom: 10,
  },
  rejectedText: { color: '#FF8888', lineHeight: 20 },
});
