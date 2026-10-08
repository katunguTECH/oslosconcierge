import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import adminApi, { clearAdminPassword } from '../services/adminApi';

export default function AdminDashboardScreen({ navigation }) {
  const [data, setData] = useState({ stats: {}, users: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/api/admin/users');
      setData(res.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        await clearAdminPassword();
        Alert.alert('Session expired', 'Please log in again', [
          { text: 'OK', onPress: () => navigation.replace('AdminLogin') },
        ]);
      } else {
        Alert.alert('Error', err?.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const verify = async (userId, decision) => {
    try {
      setBusy(true);
      await adminApi.post(`/api/admin/verify/${userId}`, { decision });
      setSelected(null);
      await load();
      Alert.alert('Done', `User ${decision}`);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeUser = (user) => {
    Alert.alert(
      'Delete user',
      `Permanently delete ${user.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              await adminApi.delete(`/api/admin/users/${user._id}`);
              setSelected(null);
              await load();
              Alert.alert('Deleted', `${user.name} removed`);
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || err.message);
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const logout = async () => {
    await clearAdminPassword();
    navigation.replace('AdminLogin');
  };

  const statusBadge = (u) => {
    if (u.isVerified) return { text: 'VERIFIED', color: '#4CAF50' };
    if (u.verification?.status === 'pending') return { text: 'PENDING', color: '#D4AF37' };
    if (u.verification?.status === 'rejected') return { text: 'REJECTED', color: '#FF6B6B' };
    return { text: 'UNVERIFIED', color: '#666' };
  };

  const renderItem = ({ item }) => {
    const badge = statusBadge(item);
    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
        {item.photos?.[0] ? (
          <Image source={{ uri: item.photos[0] }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {item.name} {item.role === 'admin' ? ' [ADMIN]' : ''}
          </Text>
          <Text style={styles.meta}>
            {[item.age, item.city].filter(Boolean).join(' - ') || 'New user'}
          </Text>
          <Text style={[styles.badge, { color: badge.color }]}>{badge.text}</Text>
        </View>
        <Text style={styles.review}>View</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Oslo's Concierge</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{data.stats.total || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{data.stats.verified || 0}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: '#D4AF37' }]}>{data.stats.pending || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4AF37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data.users}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No users yet.</Text>}
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

            {selected?.bio ? <Text style={styles.modalBio}>{selected.bio}</Text> : null}

            <Text style={styles.sectionLabel}>Profile Photos</Text>
            <View style={styles.photoRow}>
              {(selected?.photos || []).length > 0 ? (
                selected.photos.map((p, i) => (
                  <Image key={i} source={{ uri: p }} style={styles.thumb} />
                ))
              ) : (
                <Text style={styles.noImage}>No photos</Text>
              )}
            </View>

            {selected?.verification?.status === 'pending' && (
              <>
                <Text style={styles.sectionLabel}>Verification Documents</Text>
                <Text style={styles.hint}>ID Photo</Text>
                {selected.verification.idPhotoUrl ? (
                  <Image
                    source={{ uri: selected.verification.idPhotoUrl }}
                    style={styles.docImage}
                    resizeMode="contain"
                  />
                ) : <Text style={styles.noImage}>No ID uploaded</Text>}

                <Text style={styles.hint}>Selfie</Text>
                {selected.verification.selfieUrl ? (
                  <Image
                    source={{ uri: selected.verification.selfieUrl }}
                    style={styles.docImage}
                    resizeMode="contain"
                  />
                ) : <Text style={styles.noImage}>No selfie uploaded</Text>}
              </>
            )}

            <Text style={styles.sectionLabel}>Actions</Text>

            {selected?.verification?.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => verify(selected._id, 'approved')}
                  disabled={busy}
                >
                  <Text style={styles.approveText}>Approve Verification</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => verify(selected._id, 'rejected')}
                  disabled={busy}
                >
                  <Text style={styles.rejectText}>Reject Verification</Text>
                </TouchableOpacity>
              </>
            )}

            {selected?.isVerified && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => verify(selected._id, 'unverified')}
                disabled={busy}
              >
                <Text style={styles.rejectText}>Revoke Verification</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => removeUser(selected)}
              disabled={busy}
            >
              <Text style={styles.deleteText}>Delete User</Text>
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
    flexDirection: 'row', alignItems: 'center',
    padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1C1C24',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#D4AF37', fontSize: 12, marginTop: 2, letterSpacing: 1 },
  logoutBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1, borderColor: '#333',
  },
  logoutText: { color: '#888', fontSize: 12 },
  statsRow: {
    flexDirection: 'row', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#1C1C24',
  },
  stat: {
    flex: 1, alignItems: 'center', backgroundColor: '#14141A',
    borderRadius: 12, padding: 12, marginHorizontal: 4,
    borderWidth: 1, borderColor: '#22222C',
  },
  statNum: { color: '#fff', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#777', fontSize: 11, marginTop: 2, letterSpacing: 1 },
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
  name: { color: '#fff', fontSize: 15, fontWeight: '600' },
  meta: { color: '#777', fontSize: 12, marginTop: 2 },
  badge: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  review: { color: '#D4AF37', fontSize: 12, fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#0B0B0F', maxHeight: '92%',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  modalMeta: { color: '#888', marginTop: 4 },
  modalEmail: { color: '#666', fontSize: 13, marginTop: 2 },
  modalBio: { color: '#aaa', marginTop: 12, fontStyle: 'italic' },
  sectionLabel: {
    color: '#D4AF37', fontSize: 12, letterSpacing: 1,
    marginTop: 20, marginBottom: 8, fontWeight: '600',
  },
  hint: { color: '#888', fontSize: 12, marginBottom: 6, marginTop: 6 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap' },
  thumb: { width: 70, height: 70, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  docImage: {
    width: '100%', height: 200, borderRadius: 10, backgroundColor: '#16161C',
  },
  noImage: { color: '#555', fontStyle: 'italic' },
  actionBtn: { padding: 15, borderRadius: 12, marginTop: 10 },
  approveBtn: { backgroundColor: '#D4AF37' },
  approveText: { color: '#000', textAlign: 'center', fontWeight: '700', fontSize: 15 },
  rejectBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#882020' },
  rejectText: { color: '#FF6B6B', textAlign: 'center', fontWeight: '700', fontSize: 15 },
  deleteBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#882020', marginTop: 24 },
  deleteText: { color: '#FF6B6B', textAlign: 'center', fontWeight: '700', fontSize: 15 },
  closeBtn: { padding: 16, marginTop: 8 },
  closeText: { color: '#888', textAlign: 'center' },
});
