import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function AdminScreen() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/auth/admin/pending');
      setPending(data.users || []);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const decide = async (decision) => {
    if (!selected) return;
    try {
      setBusy(true);
      await api.post(`/api/auth/admin/verify/${selected._id}`, { decision });
      setSelected(null);
      await load();
      Alert.alert('Done', `Verification ${decision}`);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
      {item.photos?.[0] ? (
        <Image source={{ uri: item.photos[0] }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>
          {[item.age, item.city].filter(Boolean).join(' - ')}
        </Text>
        <Text style={styles.submitted}>
          Submitted {item.verification?.submittedAt
            ? new Date(item.verification.submittedAt).toLocaleString()
            : 'just now'}
        </Text>
      </View>
      <Text style={styles.review}>Review</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending Verifications</Text>
        <Text style={styles.count}>{pending.length} awaiting review</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4AF37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No pending verifications. All clear.</Text>
          }
        />
      )}

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <ScrollView style={styles.modal} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <Text style={styles.modalTitle}>{selected?.name}</Text>
            <Text style={styles.modalMeta}>
              {[selected?.age, selected?.city].filter(Boolean).join(' - ')}
            </Text>
            <Text style={styles.modalEmail}>{selected?.email}</Text>

            <Text style={styles.sectionLabel}>ID Photo</Text>
            {selected?.verification?.idPhotoUrl ? (
              <Image
                source={{ uri: selected.verification.idPhotoUrl }}
                style={styles.docImage}
                resizeMode="contain"
              />
            ) : <Text style={styles.noImage}>No ID photo</Text>}

            <Text style={styles.sectionLabel}>Selfie</Text>
            {selected?.verification?.selfieUrl ? (
              <Image
                source={{ uri: selected.verification.selfieUrl }}
                style={styles.docImage}
                resizeMode="contain"
              />
            ) : <Text style={styles.noImage}>No selfie</Text>}

            <Text style={styles.warning}>
              Check that the ID photo and selfie match, and that the person is 18+.
            </Text>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => decide('approved')}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.approveText}>Approve</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => decide('rejected')}
              disabled={busy}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelected(null)}
              disabled={busy}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  header: {
    padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1C1C24',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  count: { color: '#D4AF37', fontSize: 13, marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#14141A',
    padding: 14, borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#22222C',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 14 },
  avatarFallback: {
    backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#000', fontWeight: '700', fontSize: 18 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  meta: { color: '#777', fontSize: 13, marginTop: 2 },
  submitted: { color: '#555', fontSize: 11, marginTop: 4 },
  review: { color: '#D4AF37', fontSize: 13, fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#0B0B0F',
    maxHeight: '90%',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  modalMeta: { color: '#888', marginTop: 4 },
  modalEmail: { color: '#666', fontSize: 13, marginTop: 2, marginBottom: 10 },
  sectionLabel: {
    color: '#D4AF37', fontSize: 12, letterSpacing: 1,
    marginTop: 20, marginBottom: 8,
  },
  docImage: {
    width: '100%', height: 240, borderRadius: 10, backgroundColor: '#16161C',
  },
  noImage: { color: '#555', fontStyle: 'italic' },
  warning: {
    color: '#D4AF37', fontSize: 13, marginTop: 20, lineHeight: 20,
    padding: 12, backgroundColor: '#2A2416', borderRadius: 8,
  },
  actionBtn: { padding: 16, borderRadius: 12, marginTop: 12 },
  approveBtn: { backgroundColor: '#D4AF37' },
  approveText: { color: '#000', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  rejectBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: '#882020',
  },
  rejectText: { color: '#FF6B6B', textAlign: 'center', fontWeight: '700', fontSize: 16 },
  closeBtn: { padding: 16, marginTop: 8 },
  closeText: { color: '#888', textAlign: 'center' },
});
