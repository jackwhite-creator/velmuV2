import { create } from 'zustand';
import api from '../lib/api';

export interface Channel {
  id: string;
  name: string;
  type: string;
  serverId?: string;
}

export interface Category {
  id: string;
  name: string;
  channels: Channel[];
}

export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  ownerId: string;
  categories?: Category[];
}

export interface Conversation {
  id: string;
  lastMessageAt: string;
  unreadCount: number;
  users: {
    id: string;
    username: string;
    avatarUrl: string | null;
    discriminator: string;
  }[];
}

interface ServerState {
  isLoaded: boolean;
  servers: Server[];
  activeServer: Server | null;
  activeChannel: Channel | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onlineUsers: Set<string>;

  setIsLoaded: (loaded: boolean) => void;
  setServers: (servers: Server[]) => void;
  addServer: (server: Server) => void;
  removeServer: (serverId: string) => void;
  
  setActiveServer: (server: Server | null) => void;
  updateServer: (server: Server) => void;

  setActiveChannel: (channel: Channel | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  markConversationAsRead: (conversationId: string) => void;
  touchConversation: (conversationId: string) => void; // <--- NOUVEAU
  closeConversation: (conversationId: string) => void;
  
  setOnlineUsers: (userIds: string[]) => void;
  getLastChannelId: (serverId: string) => string | null;
}

export const useServerStore = create<ServerState>((set, get) => ({
  isLoaded: false,
  servers: [],
  activeServer: null,
  activeChannel: null,
  conversations: [],
  activeConversation: null,
  onlineUsers: new Set(),

  setIsLoaded: (isLoaded) => set({ isLoaded }),

  setServers: (servers) => set({ servers }),
  addServer: (server) => set((state) => ({ servers: [...state.servers, server] })),
  removeServer: (serverId) => set((state) => ({ servers: state.servers.filter((s) => s.id !== serverId) })),
  
  setActiveServer: (server) => set({ 
    activeServer: server, 
    activeConversation: null,
    activeChannel: null 
  }),

  updateServer: (updatedServer) => set((state) => {
    const newServers = state.servers.map(s => s.id === updatedServer.id ? updatedServer : s);
    let newActiveServer = state.activeServer;
    let newActiveChannel = state.activeChannel;

    if (state.activeServer?.id === updatedServer.id) {
        newActiveServer = updatedServer;
        if (state.activeChannel) {
            const foundChannel = updatedServer.categories
                ?.flatMap(c => c.channels)
                .find(c => c.id === state.activeChannel!.id);
            if (foundChannel) newActiveChannel = foundChannel;
            else newActiveChannel = null;
        }
    }
    return { servers: newServers, activeServer: newActiveServer, activeChannel: newActiveChannel };
  }),
  
  setActiveChannel: (channel) => {
    const currentServer = get().activeServer;
    if (channel && currentServer) {
        localStorage.setItem(`velmu_last_channel_${currentServer.id}`, channel.id);
    }
    set({ activeChannel: channel });
  },

  setConversations: (conversations) => {
    conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    set({ conversations });
  },

  addConversation: (conversation) => set((state) => {
    const exists = state.conversations.some(c => c.id === conversation.id);
    if (exists) {
        const others = state.conversations.filter(c => c.id !== conversation.id);
        return { conversations: [conversation, ...others] };
    }
    return { conversations: [conversation, ...state.conversations] };
  }),

  setActiveConversation: (conversation) => {
      if (conversation) {
          get().markConversationAsRead(conversation.id);
      }
      set({ 
        activeConversation: conversation,
        activeServer: null, 
        activeChannel: null 
      });
  },

  markConversationAsRead: (conversationId) => set((state) => ({
      conversations: state.conversations.map(c => 
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
  })),

  // ✅ NOUVELLE FONCTION : Remonte la conversation en haut de liste
  touchConversation: (conversationId) => set((state) => {
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (!conversation) return state; // Si elle n'est pas dans la liste (ex: fermée), on ne fait rien (ou on pourrait reload)

      // On met à jour la date
      const updatedConv = { ...conversation, lastMessageAt: new Date().toISOString() };
      
      // On la sort de la liste
      const others = state.conversations.filter(c => c.id !== conversationId);
      
      // On la remet tout en haut
      return { conversations: [updatedConv, ...others] };
  }),
  
  closeConversation: (conversationId) => {
    api.post(`/conversations/${conversationId}/close`).catch(console.error);
    set((state) => ({
      conversations: state.conversations.filter(c => c.id !== conversationId),
      activeConversation: state.activeConversation?.id === conversationId ? null : state.activeConversation
    }));
  },

  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),

  getLastChannelId: (serverId) => {
      return localStorage.getItem(`velmu_last_channel_${serverId}`);
  }
}));