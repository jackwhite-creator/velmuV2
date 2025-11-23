import { create } from 'zustand';

export interface FriendRequest {
  id: string;
  status: 'PENDING' | 'ACCEPTED';
  senderId: string;
  receiverId: string;
  sender: { id: string; username: string; discriminator: string; avatarUrl: string | null };
  receiver: { id: string; username: string; discriminator: string; avatarUrl: string | null };
}

interface FriendState {
  requests: FriendRequest[];
  setRequests: (requests: FriendRequest[]) => void;
  addRequest: (request: FriendRequest) => void;
  updateRequest: (requestId: string, status: 'ACCEPTED', fullData?: FriendRequest) => void; // Ajout fullData
  removeRequest: (requestId: string) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  requests: [],
  
  setRequests: (requests) => set({ requests }),
  
  // Ajout intelligent : Si la requête existe déjà, on la met à jour, sinon on l'ajoute
  addRequest: (request) => set((state) => {
    const exists = state.requests.some(r => r.id === request.id);
    if (exists) {
      return { requests: state.requests.map(r => r.id === request.id ? request : r) };
    }
    return { requests: [...state.requests, request] };
  }),
  
  // Mise à jour robuste
  updateRequest: (requestId, status, fullData) => set((state) => ({
    requests: state.requests.map(r => {
        if (r.id === requestId) {
            // Si on a les nouvelles données complètes (via socket), on les utilise
            if (fullData) return fullData;
            // Sinon on change juste le statut
            return { ...r, status };
        }
        return r;
    })
  })),
  
  removeRequest: (requestId) => set((state) => ({
    requests: state.requests.filter(r => r.id !== requestId)
  })),
}));