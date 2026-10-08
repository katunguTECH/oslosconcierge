import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, refreshUser, logout } = useAuth();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try { await refreshUser(); } catch (e) { /* ignore */ }
      })();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  const completion = [
    user.name, user.age, user.city, user.bio,
    user.photos?.length > 0,
  ].filter(Boolean).length;
  const pct = Math.round((completion / 5) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        {user.photos?.[0] ? (
          <Image source={{ uri: user.photos[0] }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meta}>
          {[user.age, user.city].filter(Boolean).join(' - ') || 'Add age and city'}
        </Text>
        <Text style={styles.completion}>{pct}% profile complete</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Bio</Text>
        <Text style={styles.value}>{user.bio || 'No bio yet'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Looking for</Text>
        <Text style={styles.value}>{user.lookingFor || 'Not set'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Photos ({user.photos?.length || 0}/6)</Text>
        <View style={styles.photoRow}>
          {(user.photos || []).map((p, i) => (
            <Image key={i} source={{ uri: p }} style={styles.thumb} />
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  center: { flex: 1, backgroundColor: '#0B0B0F', justifyContent: 'center' },
  header: { alignItems: 'center', paddingTop: 30, paddingBottom: 24 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 14 },
  avatarFallback: {
    backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#000', fontWeight: '700', fontSize: 42 },
  name: { color: '#fff', fontSize: 22, fontWeight: '700' },
  meta: { color: '#888', marginTop: 4 },
  completion: { color: '#D4AF37', marginTop: 8, fontSize: 13 },
  section: { paddingHorizontal: 20, marginTop: 16 },
  label: { color: '#666', fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  value: { color: '#fff', fontSize: 15, lineHeight: 22 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap' },
  thumb: { width: 80, height: 80, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  button: {
    backgroundColor: '#D4AF37', marginHorizontal: 20, marginTop: 30,
    padding: 16, borderRadius: 12,
  },
  buttonText: { color: '#000', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  logoutBtn: { marginTop: 18, padding: 12 },
  logoutText: { color: '#888', textAlign: 'center' },
});
