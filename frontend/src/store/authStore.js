/**
 * Zustand auth store - manages JWT token, user state, and login/logout actions.
 */
import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  isLoading: false,

  /**
   * Login: authenticate and store JWT token, then fetch profile
   */
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      set({ token, isLoading: false });
      // Fetch user profile after login
      await get().fetchProfile();
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.response?.data?.detail || 'Login failed' };
    }
  },

  /**
   * Register: create account then auto-login
   */
  register: async (data) => {
    set({ isLoading: true });
    try {
      await api.post('/api/auth/register', data);
      // Auto-login after registration
      const result = await get().login(data.email, data.password);
      return result;
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.response?.data?.detail || 'Registration failed' };
    }
  },

  /**
   * Fetch current user profile
   */
  fetchProfile: async () => {
    try {
      const res = await api.get('/api/user/profile');
      set({ user: res.data });
    } catch (err) {
      // Token invalid, logout
      if (err.response?.status === 401) {
        get().logout();
      }
    }
  },

  /**
   * Logout: clear token and user state
   */
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => !!get().token,
}));

export default useAuthStore;
