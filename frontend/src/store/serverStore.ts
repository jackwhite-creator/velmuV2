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

export interface Member {
  id: string;
  userId: string;
  serverId: string;
  nickname: string | null;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatarUrl: string | null;
    bio?: string | null;
  };
  roles: {
    id: string;
    name: string;
    color: string;
    position: number;
  }[];
}

export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  ownerId: string;
  categories?: Category[];
  members?: Member[];
  roles?: any[]; // For hierarchy checks
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
  
  // Member Actions
  addMember: (serverId: string, member: Member) => void;
  removeMember: (serverId: string, memberId: string) => void;
  updateMember: (serverId: string, member: Member) => void;

  setActiveChannel: (channel: Channel | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  markConversationAsRead: (conversationId: string) => void;
  touchConversation: (conversationId: string) => void; 
  closeConversation: (conversationId: string) => void;
  
  setOnlineUsers: (userIds: string[]) => void;
  getLastChannelId: (serverId: string) => string | null;
  handleNewMessage: (message: any) => void;
  getMemberColor: (member: Member) => string | null;
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

  addMember: (serverId, member) => set((state) => {
      // Update in servers list
      const newServers = state.servers.map(s => {
          if (s.id === serverId) {
              const currentMembers = s.members || [];
              if (currentMembers.some(m => m.id === member.id)) return s;
              return { ...s, members: [...currentMembers, member] };
          }
          return s;
      });

      // Update activeServer if it matches
      let newActiveServer = state.activeServer;
      if (state.activeServer?.id === serverId) {
          const currentMembers = state.activeServer.members || [];
          if (!currentMembers.some(m => m.id === member.id)) {
              newActiveServer = { ...state.activeServer, members: [...currentMembers, member] };
          }
      }

      return { servers: newServers, activeServer: newActiveServer };
  }),

  removeMember: (serverId, memberId) => set((state) => {
      const newServers = state.servers.map(s => {
          if (s.id === serverId && s.members) {
              return { ...s, members: s.members.filter(m => m.id !== memberId) };
          }
          return s;
      });

      let newActiveServer = state.activeServer;
      if (state.activeServer?.id === serverId && state.activeServer.members) {
          newActiveServer = { ...state.activeServer, members: state.activeServer.members.filter(m => m.id !== memberId) };
      }

      return { servers: newServers, activeServer: newActiveServer };
  }),

  updateMember: (serverId, member) => set((state) => {
      const newServers = state.servers.map(s => {
          if (s.id === serverId && s.members) {
              return { ...s, members: s.members.map(m => m.id === member.id ? member : m) };
          }
          return s;
      });

      let newActiveServer = state.activeServer;
      if (state.activeServer?.id === serverId && state.activeServer.members) {
          newActiveServer = { ...state.activeServer, members: state.activeServer.members.map(m => m.id === member.id ? member : m) };
      }

      return { servers: newServers, activeServer: newActiveServer };
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

  touchConversation: (conversationId) => set((state) => {
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (!conversation) return state; 

      const updatedConv = { ...conversation, lastMessageAt: new Date().toISOString() };
      
      const others = state.conversations.filter(c => c.id !== conversationId);
      
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
  },

  handleNewMessage: (message) => set((state) => {
      if (!message.conversationId) return state;

      const conversationId = message.conversationId;
      const conversation = state.conversations.find(c => c.id === conversationId);
      
      if (!conversation) return state;

      const isActive = state.activeConversation?.id === conversationId;
      
      const updatedConv = { 
          ...conversation, 
          lastMessageAt: message.createdAt,
          unreadCount: isActive ? 0 : (conversation.unreadCount || 0) + 1
      };

      const others = state.conversations.filter(c => c.id !== conversationId);
      
      return { conversations: [updatedConv, ...others] };
  }),

  getMemberColor: (member: Member) => {
    if (!member.roles || member.roles.length === 0) return null;
    
    // Sort by position DESC
    const sortedRoles = [...member.roles].sort((a, b) => b.position - a.position);
    
    // Find first role with non-default color
    for (const role of sortedRoles) {
        if (role.color && role.color !== '#99aab5') {
            return role.color;
        }
    }
    
    return null;
  }
}));
