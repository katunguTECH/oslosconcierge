import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const { data } = await api.get('/api/auth/members');
          setMembers(data.members);
        } catch (err) {
          console.log('Load members failed:', err.message);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Chat', { receiverId: item._id, receiverName: item.name })}
    >
      {item.photos?.[0] ? (
        <Image source={{ uri: item.photos[0] }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>
          {item.name} {item.isVerified ? '  [V]' : ''} {item.isPremium ? '  [P]' : ''}
        </Text>
        <Text style={styles.meta}>
          {[item.age, item.city].filter(Boolean).join(' - ') || 'New member'}
        </Text>
      </View>
      <Text style={styles.chat}>Chat</Text>
    </TouchableOpacity>
  );

  const isAdmin = user?.role === 'admin';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Welcome, {user?.name}</Text>
          <Text style={styles.sub}>Oslo's Concierge</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminLogin')}
            style={[styles.topBtn, { marginRight: 8 }]}
          >
            <Text style={styles.topBtnText}>Admin</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.topBtn}
        >
          <Text style={styles.topBtnText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {!user?.isVerified && (
        <TouchableOpacity
          style={styles.verifyBanner}
          onPress={() => navigation.navigate('Verify')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.verifyTitle}>
              {user?.verification?.status === 'pending'
                ? 'Verification in review'
                : 'Get verified'}
            </Text>
            <Text style={styles.verifyText}>
              {user?.verification?.status === 'pending'
                ? 'We are reviewing your documents'
                : 'Boost trust and unlock premium features'}
            </Text>
          </View>
          <Text style={styles.verifyArrow}>→</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator color="#D4AF37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>No members yet. Invite someone.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1C1C24',
  },
  hello: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sub: { color: '#D4AF37', fontSize: 12, letterSpacing: 1, marginTop: 2 },
  topBtn: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
    borderWidth: 1, borderColor: '#D4AF37',
  },
  topBtnText: { color: '#D4AF37', fontSize: 12, fontWeight: '600' },
  verifyBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1610', borderWidth: 1, borderColor: '#3A3020',
    marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 12,
  },
  verifyTitle: { color: '#D4AF37', fontWeight: '700', fontSize: 15 },
  verifyText: { color: '#888', fontSize: 12, marginTop: 2 },
  verifyArrow: { color: '#D4AF37', fontSize: 22, marginLeft: 12 },
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
  chat: { color: '#D4AF37', fontSize: 13, fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
});
