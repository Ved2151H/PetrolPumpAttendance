import { apiClient } from './client';
import * as SecureStore from 'expo-secure-store';

export const authService = {
  login: async (email: string, password: string) => {
    const res: any = await apiClient.post('/auth/login', { email, password });
    if (res.data && res.data.token) {
      await SecureStore.setItemAsync('auth_token', res.data.token);
    }
    return res.data;
  },
  
  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    return apiClient.post('/auth/logout');
  },
  
  me: async () => {
    const res: any = await apiClient.get('/auth/me');
    return res.data;
  },
};
