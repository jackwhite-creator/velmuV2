import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    // 1. Si déjà connecté ou connexion en cours, on ne fait rien
    const { socket } = get();
    if (socket?.connected) return;

    // 2. Récupération du token depuis ton AuthStore existant
    const token = useAuthStore.getState().token;
    if (!token) return;

    // 3. Initialisation propre
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    
    // ⚠️ CORRECTION ICI : On utilise la variable BASE_URL (sans guillemets !)
    const newSocket = io(BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    // 4. Gestion des événements de base (Debug & État)
    newSocket.on('connect', () => {
      console.log('🟢 Socket connecté:', newSocket.id);
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Socket déconnecté');
      set({ isConnected: false });
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
    
    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));