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
  members?: any[];
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
  closeConversation: (conversationId: string) => void;
  
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

  // ✅ CORRECTION 1 : Au chargement, on exclut celles qui sont "fermées" dans le LocalStorage
  setConversations: (conversations) => {
    const hiddenIds = JSON.parse(localStorage.getItem('velmu_closed_dms') || '[]');
    const visible = conversations.filter(c => !hiddenIds.includes(c.id));
    set({ conversations: visible });
  },

  // ✅ CORRECTION 2 : Si on ajoute une conv (ex: clic sur "Message" d'un ami), on la dé-bannit
  addConversation: (conversation) => set((state) => {
    // On retire l'ID de la liste noire pour qu'elle réapparaisse
    const hiddenIds = JSON.parse(localStorage.getItem('velmu_closed_dms') || '[]');
    if (hiddenIds.includes(conversation.id)) {
        const newHidden = hiddenIds.filter((id: string) => id !== conversation.id);
        localStorage.setItem('velmu_closed_dms', JSON.stringify(newHidden));
    }

    if (state.conversations.find(c => c.id === conversation.id)) return state;
    return { conversations: [conversation, ...state.conversations] };
  }),

  setActiveConversation: (conversation) => set({ 
    activeConversation: conversation,
    activeServer: null, 
    activeChannel: null 
  }),
  
  // ✅ CORRECTION 3 : Quand on ferme, on sauvegarde l'ID dans le LocalStorage
  closeConversation: (conversationId) => set((state) => {
    const hiddenIds = JSON.parse(localStorage.getItem('velmu_closed_dms') || '[]');
    if (!hiddenIds.includes(conversationId)) {
        hiddenIds.push(conversationId);
        localStorage.setItem('velmu_closed_dms', JSON.stringify(hiddenIds));
    }

    return {
      conversations: state.conversations.filter(c => c.id !== conversationId),
      activeConversation: state.activeConversation?.id === conversationId ? null : state.activeConversation
    };
  }),

  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
}));