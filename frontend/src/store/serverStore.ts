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
  
  // Actions de Navigation (Reset le contexte)
  setActiveServer: (server: Server | null) => void;
  
  // ✅ NOUVEAU : Action de Mise à jour (Garde le contexte)
  updateServer: (server: Server) => void;

  setActiveChannel: (channel: Channel | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
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
  
  // Navigation : On change de serveur, donc on reset le salon
  setActiveServer: (server) => set({ 
    activeServer: server, 
    activeConversation: null,
    activeChannel: null 
  }),

  // ✅ MISE À JOUR SILENCIEUSE : On met à jour les données sans casser la vue
  updateServer: (updatedServer) => set((state) => {
    // 1. Mettre à jour la liste des serveurs
    const newServers = state.servers.map(s => s.id === updatedServer.id ? updatedServer : s);
    
    // 2. Si c'est le serveur actif, on le met à jour MAIS...
    let newActiveServer = state.activeServer;
    let newActiveChannel = state.activeChannel;

    if (state.activeServer?.id === updatedServer.id) {
        newActiveServer = updatedServer;
        
        // 3. ...On s'assure que le salon actif est toujours valide (mis à jour)
        if (state.activeChannel) {
            const foundChannel = updatedServer.categories
                ?.flatMap(c => c.channels)
                .find(c => c.id === state.activeChannel!.id);
            
            // Si le salon existe toujours (ex: juste renommé), on met à jour l'objet
            if (foundChannel) {
                newActiveChannel = foundChannel;
            } else {
                // Si le salon a été supprimé, alors là oui, on le retire
                newActiveChannel = null;
            }
        }
    }

    return {
        servers: newServers,
        activeServer: newActiveServer,
        activeChannel: newActiveChannel
    };
  }),
  
  setActiveChannel: (channel) => {
    const currentServer = get().activeServer;
    if (channel && currentServer) {
        localStorage.setItem(`velmu_last_channel_${currentServer.id}`, channel.id);
    }
    set({ activeChannel: channel });
  },

  setConversations: (conversations) => {
    const hiddenIds = JSON.parse(localStorage.getItem('velmu_closed_dms') || '[]');
    const visible = conversations.filter(c => !hiddenIds.includes(c.id));
    set({ conversations: visible });
  },

  addConversation: (conversation) => set((state) => {
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

  getLastChannelId: (serverId) => {
      return localStorage.getItem(`velmu_last_channel_${serverId}`);
  }
}));