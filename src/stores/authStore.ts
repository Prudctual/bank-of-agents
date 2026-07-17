// ============================================
// Authentication Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, setAuthToken, agentsApi, walletsApi, transactionsApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Wallet {
  id: string;
  balance: number;
  currency: string;
}

interface AuthState {
  user: User | null;
  wallet: Wallet | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      wallet: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          if (response.success && response.data) {
            const { user, wallet, token } = response.data;
            setAuthToken(token);
            set({
              user,
              wallet: wallet ? { ...wallet, balance: Number(wallet.balance) } : null,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }
          set({ error: 'فشل تسجيل الدخول', isLoading: false });
          return false;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'حدث خطأ', 
            isLoading: false 
          });
          return false;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(email, password, name);
          if (response.success && response.data) {
            const { user, wallet, token } = response.data;
            setAuthToken(token);
            set({
              user,
              wallet: wallet ? { ...wallet, balance: Number(wallet.balance) } : null,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }
          set({ error: 'فشل إنشاء الحساب', isLoading: false });
          return false;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'حدث خطأ', 
            isLoading: false 
          });
          return false;
        }
      },

      logout: () => {
        setAuthToken(null);
        set({
          user: null,
          wallet: null,
          token: null,
          isAuthenticated: false,
        });
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true });
        try {
          setAuthToken(token);
          const response = await authApi.me();
          if (response.success && response.data) {
            set({
              user: response.data.user,
              wallet: response.data.wallet ? { 
                ...response.data.wallet as Wallet, 
                balance: Number((response.data.wallet as Wallet).balance) 
              } : null,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch {
          // Token expired or invalid
          set({
            user: null,
            wallet: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
