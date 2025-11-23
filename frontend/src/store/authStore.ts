import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  discriminator: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void; // <--- Nouvelle action
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  // Permet de mettre à jour le profil sans déconnecter
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  }
}));