import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens } from '../types/user';
import { AuthState } from '../types/store-types';

interface AuthStateWithActions extends AuthState {
  // Actions
  setUser: (user: User) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@auth_tokens';
const USER_STORAGE_KEY = '@user_data';

export const useAuthStore = create<AuthStateWithActions>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,

  setUser: async (user: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    try {
      const tokens: AuthTokens = { access_token: accessToken, refresh_token: refreshToken };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
      set({ tokens });
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      set({ user: null, tokens: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  clearAuth: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      set({ user: null, tokens: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  },
}));

// Load persisted auth state on app start
export const loadAuthState = async () => {
  try {
    const [tokensJson, userJson] = await Promise.all([
      AsyncStorage.getItem(AUTH_STORAGE_KEY),
      AsyncStorage.getItem(USER_STORAGE_KEY),
    ]);

    if (tokensJson && userJson) {
      const tokens = JSON.parse(tokensJson);
      const user = JSON.parse(userJson);
      useAuthStore.setState({ tokens, user, isAuthenticated: true });
    }
  } catch (error) {
    console.error('Error loading auth state:', error);
  }
};

