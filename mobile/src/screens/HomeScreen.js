import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Chat', { receiverId: item._id, receiverName: item.name })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>
          {item.name} {item.isVerified ? ' [V]' : ''} {item.isPremium ? ' [P]' : ''}
        </Text>
        <Text style={styles.meta}>
          {[item.age, item.city].filter(Boolean).join(' - ') || 'New member'}
        </Text>
      </View>
      <Text style={styles.chat}>Chat</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Welcome, {user?.name}</Text>
          <Text style={styles.sub}>Oslo's Concierge</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1C1C24',
  },
  hello: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sub: { color: '#D4AF37', fontSize: 12, letterSpacing: 1, marginTop: 2 },
  logout: { color: '#888' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#14141A',
    padding: 14, borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#22222C',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#D4AF37',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  avatarText: { color: '#000', fontWeight: '700', fontSize: 18 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  meta: { color: '#777', fontSize: 13, marginTop: 2 },
  chat: { color: '#D4AF37', fontSize: 13, fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
});
