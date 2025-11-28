/**
 * API Types - Velmu V2
 * Request/Response types pour toutes les routes API
 */

import { ChannelType, RequestStatus } from './types';

// ============================================================================
// AUTH
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    discriminator: string;
    avatarUrl: string | null;
  };
}

// ============================================================================
// USER
// ============================================================================

export interface UpdateUserRequest {
  username?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

// ============================================================================
// SERVER
// ============================================================================

export interface CreateServerRequest {
  name: string;
  iconUrl?: string;
}

export interface UpdateServerRequest {
  name?: string;
  iconUrl?: string;
  systemChannelId?: string | null;
}

// ============================================================================
// CATEGORY
// ============================================================================

export interface CreateCategoryRequest {
  name: string;
  serverId: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  order?: number;
}

// ============================================================================
// CHANNEL
// ============================================================================

export interface CreateChannelRequest {
  name: string;
  type?: ChannelType;
  serverId: string;
  categoryId?: string;
}

export interface UpdateChannelRequest {
  name?: string;
  categoryId?: string | null;
  order?: number;
}

// ============================================================================
// MESSAGE
// ============================================================================

export interface CreateMessageRequest {
  content: string;
  replyToId?: string;
  attachments?: {
    url: string;
    filename: string;
    type: string;
    size: number;
  }[];
}

export interface UpdateMessageRequest {
  content: string;
}

// ============================================================================
// CONVERSATION
// ============================================================================

export interface CreateConversationRequest {
  userId: string;
}

// ============================================================================
// FRIEND
// ============================================================================

export interface SendFriendRequestRequest {
  username: string;
  discriminator: string;
}

export interface UpdateFriendRequestRequest {
  status: RequestStatus;
}

// ============================================================================
// INVITE
// ============================================================================

export interface CreateInviteRequest {
  serverId: string;
  maxUses?: number;
  expiresIn?: number; // en heures
}

export interface JoinServerRequest {
  code: string;
}

// ============================================================================
// MEMBER
// ============================================================================

export interface UpdateMemberRequest {
  nickname?: string | null;
  roleIds?: string[];
}

// ============================================================================
// GENERIC RESPONSES
// ============================================================================

export interface SuccessResponse {
  success: true;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}

export interface PaginationQuery {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
