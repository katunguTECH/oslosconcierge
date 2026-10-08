import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

const ADMIN_KEY = 'adminPassword';

const adminApi = axios.create({ baseURL: API_URL });

adminApi.interceptors.request.use(async (config) => {
  const pw = await AsyncStorage.getItem(ADMIN_KEY);
  if (pw) config.headers['x-admin-password'] = pw;
  return config;
});

export const setAdminPassword = async (pw) => {
  await AsyncStorage.setItem(ADMIN_KEY, pw);
};

export const clearAdminPassword = async () => {
  await AsyncStorage.removeItem(ADMIN_KEY);
};

export const getAdminPassword = async () => {
  return AsyncStorage.getItem(ADMIN_KEY);
};

export default adminApi;
