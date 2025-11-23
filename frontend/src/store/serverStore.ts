import { create } from 'zustand';

export interface Channel {
  id: string;
  name: string;
  type: string;
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
  members?: any[]; // Ajout pour typage
}

export interface Conversation {
  id: string;
  users: {
    id: string;
    username: string;
    avatarUrl: string | null;
    discriminator: string;
  }[];
}

interface ServerState {
  servers: Server[];
  activeServer: Server | null;
  activeChannel: Channel | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onlineUsers: Set<string>;

  setServers: (servers: Server[]) => void;
  addServer: (server: Server) => void;
  removeServer: (serverId: string) => void;
  setActiveServer: (server: Server | null) => void;
  setActiveChannel: (channel: Channel | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  
  // Simplifié : juste le setter global
  setOnlineUsers: (userIds: string[]) => void;
}

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  activeServer: null,
  activeChannel: null,
  conversations: [],
  activeConversation: null,
  onlineUsers: new Set(),

  setServers: (servers) => set({ servers }),
  addServer: (server) => set((state) => ({ servers: [...state.servers, server] })),
  removeServer: (serverId) => set((state) => ({ servers: state.servers.filter((s) => s.id !== serverId) })),
  
  setActiveServer: (server) => set({ activeServer: server, activeConversation: null }),
  setActiveChannel: (channel) => set({ activeChannel: channel }),

  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) => set((state) => {
    if (state.conversations.find(c => c.id === conversation.id)) return state;
    return { conversations: [conversation, ...state.conversations] };
  }),
  setActiveConversation: (conversation) => set({ 
    activeConversation: conversation,
    activeServer: null, 
    activeChannel: null 
  }),

  // Mise à jour atomique de toute la liste
  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
}));