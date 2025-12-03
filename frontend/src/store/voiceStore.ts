import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { useSocketStore } from './socketStore';
import { useServerStore } from './serverStore';
import { useAuthStore } from './authStore';

export interface VoiceParticipantState {
    isMuted: boolean;
    isDeafened: boolean;
    isCameraOn: boolean;
    isScreenShareOn: boolean;
}

interface VoiceState {
  currentChannelId: string | null;
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isCameraOn: boolean;
  isScreenShareOn: boolean;
  token: string | null;
  participants: Record<string, string[]>; // channelId -> userIds
  participantStates: Record<string, VoiceParticipantState>; // userId -> state
  
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: () => void;
  setToken: (token: string) => void;
  setConnected: (connected: boolean) => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleCamera: (isOn: boolean) => void;
  toggleScreenShare: (isOn: boolean) => void;
  updateParticipants: (channelId: string, userId: string, action: 'join' | 'leave') => void;
  setParticipants: (participants: Record<string, string[]>) => void;
  setParticipantState: (userId: string, state: Partial<VoiceParticipantState>) => void;
  updateLocalState: (changes: Partial<VoiceParticipantState>) => void;
}

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set, get) => ({
      currentChannelId: null,
      currentChannelName: null,
      currentServerName: null,
      isConnected: false,
      isMuted: false,
      isDeafened: false,
      isCameraOn: false,
      isScreenShareOn: false,
      token: null,
      participants: {},
      participantStates: {},

      joinChannel: async (channelId) => {
        try {
          const response = await api.get(`/livekit/token?channelId=${channelId}`);
          
          const { isMuted, isDeafened, isCameraOn, isScreenShareOn } = get();

          // Find channel and server names for persistence
          const servers = useServerStore.getState().servers;
          let channelName = "Salon Vocal";
          let serverName = "Serveur";

          for (const s of servers) {
              const c = s.channels?.find(ch => ch.id === channelId);
              if (c) {
                  channelName = c.name;
                  serverName = s.name;
                  break;
              }
              if (s.categories) {
                  for (const cat of s.categories) {
                      const cCat = cat.channels.find(ch => ch.id === channelId);
                      if (cCat) {
                          channelName = cCat.name;
                          serverName = s.name;
                          break;
                      }
                  }
              }
              if (serverName !== "Serveur") break;
          }

          // Emit socket event with initial state
          const socket = useSocketStore.getState().socket;
          const activeServer = useServerStore.getState().activeServer;
          if (socket && activeServer) {
            socket.emit('join_voice', { 
                channelId, 
                serverId: activeServer.id,
                initialState: { isMuted, isDeafened, isCameraOn, isScreenShareOn }
            });
          }

          set({ 
            currentChannelId: channelId, 
            currentChannelName: channelName,
            currentServerName: serverName,
            token: response.data.token,
            isConnected: true 
          });
        } catch (error) {
          console.error("Failed to join voice channel:", error);
        }
      },
      leaveChannel: () => {
        const { currentChannelId, participants } = get();
        const socket = useSocketStore.getState().socket;
        const activeServer = useServerStore.getState().activeServer;
        
        // Optimistically remove self from participants
        if (currentChannelId) {
            const userId = useAuthStore.getState().user?.id;
            
            if (userId && participants[currentChannelId]) {
                 const newParticipants = participants[currentChannelId].filter(id => id !== userId);
                 set((state) => ({
                     participants: { ...state.participants, [currentChannelId]: newParticipants }
                 }));
            }
        }

        if (socket && currentChannelId && activeServer) {
            socket.emit('leave_voice', { channelId: currentChannelId, serverId: activeServer.id });
        }

        set({ currentChannelId: null, currentChannelName: null, currentServerName: null, token: null, isConnected: false });
      },
      setToken: (token) => set({ token }),
      setConnected: (connected) => set({ isConnected: connected }),
      toggleMute: () => {
          const newState = !get().isMuted;
          set({ isMuted: newState });
          get().updateLocalState({ isMuted: newState });
      },
      toggleDeafen: () => {
          const newState = !get().isDeafened;
          set({ isDeafened: newState });
          get().updateLocalState({ isDeafened: newState });
      },
      toggleCamera: (isOn) => {
          set({ isCameraOn: isOn });
          get().updateLocalState({ isCameraOn: isOn });
      },
      toggleScreenShare: (isOn) => {
          set({ isScreenShareOn: isOn });
          get().updateLocalState({ isScreenShareOn: isOn });
      },
      updateParticipants: (channelId, userId, action) => set((state) => {
        const currentParticipants = { ...state.participants };
        
        if (action === 'join') {
            // 1. Remove user from ALL other channels first (enforce single channel rule)
            Object.keys(currentParticipants).forEach(cid => {
                if (currentParticipants[cid]?.includes(userId)) {
                    currentParticipants[cid] = currentParticipants[cid].filter(id => id !== userId);
                }
            });

            // 2. Add to new channel
            const channelUsers = currentParticipants[channelId] || [];
            if (!channelUsers.includes(userId)) {
                currentParticipants[channelId] = [...channelUsers, userId];
            }
        } else {
            // Leave action
            const channelUsers = currentParticipants[channelId] || [];
            currentParticipants[channelId] = channelUsers.filter(id => id !== userId);
        }
        
        return { participants: currentParticipants };
      }),
      setParticipants: (participants) => set({ participants }),
      setParticipantState: (userId, newState) => set((state) => ({
          participantStates: {
              ...state.participantStates,
              [userId]: { ...state.participantStates[userId], ...newState }
          }
      })),
      updateLocalState: (changes) => {
          const socket = useSocketStore.getState().socket;
          if (socket) {
              socket.emit('voice_state_change', changes);
          }
      }
    }),
    {
      name: 'voice-storage',
      partialize: (state) => ({ 
        currentChannelId: state.currentChannelId,
        currentChannelName: state.currentChannelName,
        currentServerName: state.currentServerName,
        isConnected: state.isConnected,
        token: state.token,
        isMuted: state.isMuted,
        isDeafened: state.isDeafened
      }),
    }
  )
);
