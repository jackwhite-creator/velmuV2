/**
 * Shared Types - Velmu V2
 * Types partagés entre backend et frontend
 * Basés sur le schema Prisma
 */

// ============================================================================
// ENUMS
// ============================================================================

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

// ============================================================================
// ENTITY TYPES (Database Models)
// ============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  createdAt: Date | string;
}

export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  ownerId: string;
  systemChannelId: string | null;
  createdAt: Date | string;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  position: number;
  serverId: string;
}

export interface Member {
  id: string;
  joinedAt: Date | string;
  nickname: string | null;
  userId: string;
  serverId: string;
  roleIds: string[];
}

export interface Category {
  id: string;
  name: string;
  order: number;
  serverId: string;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  order: number;
  categoryId: string | null;
  serverId: string;
}

export interface Invite {
  id: string;
  code: string;
  uses: number;
  maxUses: number;
  expiresAt: Date | string | null;
  createdAt: Date | string;
  serverId: string;
  creatorId: string;
}

export interface Conversation {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastMessageAt: Date | string;
}

export interface ConversationMember {
  id: string;
  joinedAt: Date | string;
  lastReadAt: Date | string;
  closed: boolean;
  userId: string;
  conversationId: string;
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  channelId: string | null;
  conversationId: string | null;
  replyToId: string | null;
  embed?: any;
}

export interface Attachment {
  id: string;
  url: string;
  filename: string;
  type: string;
  size: number;
  messageId: string;
}

export interface FriendRequest {
  id: string;
  createdAt: Date | string;
  status: RequestStatus;
  senderId: string;
  receiverId: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
  createdAt: Date | string;
}

// ============================================================================
// EXTENDED TYPES (With Relations)
// ============================================================================

export interface UserPublic {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  bio?: string | null;
  isBot?: boolean;
}

export interface ServerWithRelations extends Server {
  categories?: CategoryWithChannels[];
  channels?: Channel[];
  members?: MemberWithUser[];
  roles?: Role[];
}

export interface CategoryWithChannels extends Category {
  channels: Channel[];
}

export interface MemberWithUser extends Member {
  user: UserPublic;
  roles?: Role[];
}

export interface ReactionWithUser extends Reaction {
  user: UserPublic;
}

export interface MessageWithRelations extends Message {
  user: UserPublic;
  attachments?: Attachment[];
  replyTo?: Message | null;
  reactions?: ReactionWithUser[];
}

export interface ConversationWithMembers extends Conversation {
  members: ConversationMemberWithUser[];
  messages?: Message[];
}

export interface ConversationMemberWithUser extends ConversationMember {
  user: UserPublic;
}

export interface InviteWithCreator extends Invite {
  creator: UserPublic;
  server?: Server;
}

export interface FriendRequestWithUsers extends FriendRequest {
  sender: UserPublic;
  receiver: UserPublic;
}

// ============================================================================
// DTO TYPES (Conversation list for frontend)
// ============================================================================

export interface ConversationListItem {
  id: string;
  lastMessageAt: string;
  unreadCount: number;
  users: UserPublic[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
