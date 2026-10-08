import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { socket } from '../services/socket';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        socket.connect();
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (t, u) => {
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    socket.connect();
  };

  const refreshUser = async () => {
    const { data } = await api.get('/api/auth/me');
    const u = data.user;
    const normalized = {
      id: u._id, name: u.name, email: u.email, role: u.role,
      age: u.age, gender: u.gender, city: u.city, bio: u.bio,
      interests: u.interests, lookingFor: u.lookingFor,
      budgetRange: u.budgetRange, photos: u.photos,
      isVerified: u.isVerified, isPremium: u.isPremium,
      verification: u.verification,
    };
    setUser(normalized);
    await AsyncStorage.setItem('user', JSON.stringify(normalized));
    return normalized;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    await persist(data.token, data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    await persist(data.token, data.user);
    return data;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    socket.disconnect();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
