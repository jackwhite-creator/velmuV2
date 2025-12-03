/**
 * Types pour les embeds de messages
 */

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedFooter {
  text: string;
  iconUrl?: string;
}

export interface MessageEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: string;
  thumbnail?: string;
  image?: string;
  fields?: EmbedField[];
  footer?: EmbedFooter;
  timestamp?: string;
}
