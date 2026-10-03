import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';

export default function ChatScreen({ route, navigation }) {
  const { receiverId, receiverName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const room = [user?.id, receiverId].sort().join('_');

  useEffect(() => {
    navigation.setOptions({ title: receiverName });
    socket.emit('join_room', room);
    const onReceive = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on('receive_message', onReceive);
    return () => socket.off('receive_message', onReceive);
  }, [room]);

  const send = () => {
    if (!text.trim()) return;
    socket.emit('send_message', { room, sender: user.id, receiver: receiverId, text: text.trim() });
    setText('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(i) => i._id || String(Math.random())}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const mine = item.sender === user.id;
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={mine ? styles.mineText : styles.theirText}>{item.text}</Text>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} placeholder="Write a message..." placeholderTextColor="#777"
          value={text} onChangeText={setText} />
        <TouchableOpacity style={styles.send} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F' },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 16, marginBottom: 10 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#D4AF37' },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#1C1C24' },
  mineText: { color: '#000' },
  theirText: { color: '#fff' },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1C1C24', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#16161C', color: '#fff', padding: 14, borderRadius: 24, borderWidth: 1, borderColor: '#26262E' },
  send: { marginLeft: 10, backgroundColor: '#D4AF37', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 24 },
  sendText: { color: '#000', fontWeight: '700' },
});
