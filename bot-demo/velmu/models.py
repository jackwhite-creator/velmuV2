class User:
    def __init__(self, data, http=None):
        self.id = data.get('id')
        self.username = data.get('username')
        self.discriminator = data.get('discriminator')
        self.is_bot = data.get('isBot', False)
        self.avatar_url = data.get('avatarUrl')
        self._http = http

    def send(self, content, embed=None):
        """Envoie un message privé à l'utilisateur."""
        if not self._http:
            raise Exception("HTTP client not initialized for this user")
        # TODO: Implémenter create_dm dans http.py
        pass

    def __str__(self):
        return f"{self.username}#{self.discriminator}"

class Server:
    def __init__(self, data, http):
        self.id = data.get('id')
        self.name = data.get('name')
        self.owner_id = data.get('ownerId')
        self.icon_url = data.get('iconUrl')
        self._http = http

    def get_member(self, user_id):
        """Récupère un membre du serveur."""
        # TODO: Ajouter get_member dans http.py
        pass

    def get_members(self):
        """Récupère tous les membres du serveur."""
        data = self._http.get_server_members(self.id)
        return data

    def kick(self, user_id):
        """Expulse un membre."""
        return self._http.kick_user(self.id, user_id)

    def ban(self, user_id):
        """Bannit un membre."""
        # TODO: Ajouter ban_user dans http.py
        pass

    def __str__(self):
        return self.name

class Channel:
    def __init__(self, data, http):
        self.id = data.get('id')
        self.name = data.get('name')
        self.type = data.get('type')
        self.server_id = data.get('serverId')
        self._http = http

    def send(self, content=None, embed=None):
        """Envoie un message dans le salon."""
        return self._http.send_message(self.id, content, embed)

    def fetch_message(self, message_id):
        """Récupère un message spécifique."""
        data = self._http.get_message(message_id)
        if data:
            return Message(data, self._http)
        return None

    def history(self, limit=50):
        """Récupère l'historique des messages."""
        data = self._http.get_channel_messages(self.id, limit)
        if isinstance(data, list):
            return [Message(msg_data, self._http) for msg_data in data]
        return []

    def __str__(self):
        return self.name

class Message:
    def __init__(self, data, http):
        self.id = data.get('id')
        self.content = data.get('content')
        
        user_data = data.get('user')
        if user_data:
            self.author = User(user_data, http)
        else:
            # Fallback si pas d'user (ex: message système ou erreur API)
            # On crée un user "Inconnu" ou on laisse None
            self.author = None

        self.channel_id = data.get('channelId')
        self.server_id = data.get('serverId')
        self.created_at = data.get('createdAt')
        self.reply_to_id = data.get('replyToId')
        self._http = http
        
        self.channel = Channel({'id': self.channel_id, 'serverId': self.server_id}, http)
        if self.server_id:
            self.server = Server({'id': self.server_id}, http)
        else:
            self.server = None

        self.referenced_message = None
        if self.reply_to_id:
            # Si le message référencé est inclus dans les données (souvent le cas)
            if 'replyTo' in data and data['replyTo']:
                self.referenced_message = Message(data['replyTo'], http)

    def reply(self, content=None, embed=None):
        """Répond au message."""
        # Pour répondre, on utilise send_message avec replyToId si l'API le supporte
        # Si l'API backend ne supporte pas encore replyToId dans le payload de création,
        # on fait un send classique. Mais le but est de supporter les réponses.
        # On suppose que send_message sera mis à jour ou qu'on passe un paramètre.
        # Pour l'instant, on fait un send simple comme avant, mais on pourrait ajouter reply_to_id
        return self._http.send_message(self.channel_id, content, embed, reply_to_id=self.id)

    def delete(self):
        """Supprime le message."""
        return self._http.delete_message(self.id)

    def edit(self, content):
        """Modifie le message."""
        return self._http.edit_message(self.id, content)

    def add_reaction(self, emoji):
        """Ajoute une réaction."""
        return self._http.add_reaction(self.id, emoji)

    def remove_reaction(self, emoji, user_id=None):
        """Retire une réaction."""
        return self._http.remove_reaction(self.id, emoji, user_id)

    def __str__(self):
        return self.content

class Reaction:
    def __init__(self, data, http):
        self.http = http
        self.message_id = data.get('messageId')
        self.user_id = data.get('userId')
        self.emoji = data.get('emoji')
        
        if 'reaction' in data:
            reaction_data = data['reaction']
            self.message_id = reaction_data.get('messageId')
            self.user_id = reaction_data.get('userId')
            self.emoji = reaction_data.get('emoji')
            
    def message(self):
        """Récupère le message associé."""
        data = self.http.get_message(self.message_id)
        if data:
            return Message(data, self.http)
        return None

    def delete(self):
        """Supprime la réaction."""
        return self.http.remove_reaction(self.message_id, self.emoji)

    def __repr__(self):
        return f"<Reaction emoji='{self.emoji}' user_id='{self.user_id}' message_id='{self.message_id}'>"
