/**
 * Shared Types - Frontend
 * Re-export des types du backend pour usage frontend
 */

// Pour l'instant, on copie les types essentiels
// TODO: Partager directement les types du backend via un package partagé

export enum ChannelType {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}

export enum MessageType {
  DEFAULT = 'DEFAULT',
  SYSTEM = 'SYSTEM'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED'
}

export interface UserPublic {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  bio?: string | null;
}

export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  ownerId: string;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  serverId: string;
  categoryId?: string | null;
}

export interface Category {
  id: string;
  name: string;
  channels: Channel[];
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: UserPublic;
  attachments?: Attachment[];
  replyTo?: Message | null;
}

export interface Attachment {
  id: string;
  url: string;
  filename: string;
  type: string;
  size: number;
}

export interface Conversation {
  id: string;
  lastMessageAt: string;
  unreadCount: number;
  users: UserPublic[];
}

export interface FriendRequest {
  id: string;
  status: RequestStatus;
  sender: UserPublic;
  receiver: UserPublic;
  createdAt: string;
}
