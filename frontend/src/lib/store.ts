import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  whatsappPhone?: string;
  onboardingCompleted?: boolean;
  investorProfile?: string;
  budget?: number;
  preferredCities?: string;
  preferredTypes?: string;
  minYield?: number;
  notifyEmail?: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
        window.location.href = '/login';
      },
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
