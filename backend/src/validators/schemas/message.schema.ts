import { z } from 'zod';

const uuidSchema = z.string().uuid("ID invalide");

// Message Schemas
export const CreateMessageSchema = z.object({
  content: z.string()
    .max(2000, "Le message ne peut pas dépasser 2000 caractères")
    .optional(),
  channelId: uuidSchema.optional(),
  conversationId: uuidSchema.optional(),
  replyToId: uuidSchema.optional()
}).refine(
  (data) => data.content || data.channelId || data.conversationId,
  "Le message doit contenir du texte ou une destination"
).refine(
  (data) => !(data.channelId && data.conversationId),
  "Le message ne peut pas être envoyé à la fois dans un channel et une conversation"
);

export const UpdateMessageSchema = z.object({
  content: z.string()
    .min(1, "Le message ne peut pas être vide")
    .max(2000, "Le message ne peut pas dépasser 2000 caractères")
});

// Friend Request Schemas
export const SendFriendRequestSchema = z.object({
  username: z.string().optional(),
  discriminator: z.string().optional(),
  usernameString: z.string().optional()
}).refine(
  (data) => (data.username && data.discriminator) || data.usernameString,
  "Vous devez fournir username#discriminator ou usernameString"
);

export const RespondFriendRequestSchema = z.object({
  requestId: uuidSchema,
  action: z.enum(['ACCEPT', 'DECLINE'])
});

// Conversation Schemas
export const CreateConversationSchema = z.object({
  recipientId: uuidSchema
});

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type UpdateMessageInput = z.infer<typeof UpdateMessageSchema>;
export type SendFriendRequestInput = z.infer<typeof SendFriendRequestSchema>;
export type RespondFriendRequestInput = z.infer<typeof RespondFriendRequestSchema>;
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
