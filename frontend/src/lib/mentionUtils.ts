import { Channel, Server } from '../store/serverStore';

/**
 * Prépare le contenu du message pour le backend en remplaçant les mentions @username par <@userId>
 */
export const prepareMentionsForBackend = (content: string, users: any[]): string => {
  if (!users || users.length === 0) return content;

  return content.replace(/@([a-zA-Z0-9_.-]+)/g, (match, username) => {
    const user = users.find((u: any) => u.username === username);
    if (user) {
      return `<@${user.id}>`;
    }
    return match;
  });
};

/**
 * Traite le contenu brut du backend (<@userId>) pour l'affichage frontend ([@username](#mention-id))
 */
export const processMentionsForFrontend = (
  content: string, 
  activeConversation: any, 
  activeServer: Server | null,
  processEveryone: boolean = true
): string => {
  if (!content) return '';

  return content.replace(/<@([a-zA-Z0-9-]+)>/g, (match, userId) => {
      let username = "Utilisateur inconnu";
      
      // Recherche dans la conversation active (DM)
      if (activeConversation && activeConversation.users) {
          const user = activeConversation.users.find((u: any) => u.id === userId);
          if (user) username = user.username;
      } 
      
      // Recherche dans le serveur actif
      if (username === "Utilisateur inconnu" && activeServer && activeServer.members) {
          const member = activeServer.members.find((m: any) => m.userId === userId);
          if (member && member.user) username = member.user.username;
      }

      return `[@${username}](#mention-${userId})`;
  }).replace(/@everyone/g, (match) => processEveryone ? '[@everyone](#mention-everyone)' : match);
};
