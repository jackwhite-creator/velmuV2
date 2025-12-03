import requests

class HTTPClient:
    def __init__(self, token, api_url='http://localhost:4000/api'):
        self.token = token
        self.api_url = api_url
        self.headers = {
            'Authorization': f'Bot {token}',
            'Content-Type': 'application/json'
        }

    def request(self, method, endpoint, **kwargs):
        url = f"{self.api_url}{endpoint}"
        response = requests.request(method, url, headers=self.headers, **kwargs)
        
        if response.status_code == 403:
            try:
                error_msg = response.json().get('error', 'Permission denied')
            except:
                error_msg = response.text
            print(f"❌ ERREUR PERMISSION ({method} {endpoint}): {error_msg}")
            print("👉 Vérifiez que le bot a les permissions nécessaires (SEND_MESSAGES, MANAGE_MESSAGES, etc.)")
            return None

        try:
            return response.json()
        except:
            return response.text

    def send_message(self, channel_id, content=None, embed=None, reply_to_id=None):
        """
        Send a message to a channel
        Args:
            channel_id: ID of the channel
            content: Text content (optional if embed is provided)
            embed: Embed object (optional)
            reply_to_id: ID of the message to reply to (optional)
        """
        payload = {'channelId': channel_id}
        
        if content:
            payload['content'] = content
        
        if embed:
            # If embed is an Embed object, convert to dict
            if hasattr(embed, 'to_dict'):
                payload['embed'] = embed.to_dict()
            else:
                payload['embed'] = embed
        
        if reply_to_id:
            payload['replyToId'] = reply_to_id
        
        return self.request('POST', '/messages', json=payload)

    def kick_user(self, server_id, user_id):
        return self.request('DELETE', f'/members/{server_id}/kick/{user_id}')

    def get_server_id_from_channel(self, channel_id):
        # Cette route n'existe pas directement comme "get server from channel"
        # Mais on peut récupérer les infos du channel
        data = self.request('GET', f'/channels/{channel_id}')
        if isinstance(data, dict):
            return data.get('serverId')
        return None

    def get_me(self):
        return self.request('GET', '/users/me')

    def get_my_servers(self):
        return self.request('GET', '/users/me/servers')

    # --- Messages ---
    def delete_message(self, message_id):
        return self.request('DELETE', f'/messages/{message_id}')

    def get_message(self, message_id):
        return self.request('GET', f'/messages/{message_id}')

    def get_channel_messages(self, channel_id, limit=50):
        return self.request('GET', f'/messages?channelId={channel_id}&limit={limit}')

    # --- Servers ---
    def get_server(self, server_id):
        return self.request('GET', f'/servers/{server_id}')

    def get_server_members(self, server_id):
        return self.request('GET', f'/members/{server_id}')

    # --- Channels ---
    def create_channel(self, server_id, name, type='TEXT', category_id=None):
        data = {
            'serverId': server_id,
            'name': name,
            'type': type,
            'categoryId': category_id
        }
        return self.request('POST', '/channels', json=data)

    def delete_channel(self, channel_id):
        return self.request('DELETE', f'/channels/{channel_id}')

    # --- Reactions ---
    def add_reaction(self, message_id, emoji):
        return self.request('POST', f'/messages/{message_id}/reactions', json={'emoji': emoji})

    def remove_reaction(self, message_id, emoji, user_id=None):
        return self.request('DELETE', f'/messages/{message_id}/reactions/{emoji}')

    # --- Edits ---
    def edit_message(self, message_id, content):
        return self.request('PUT', f'/messages/{message_id}', json={'content': content})

    # --- Moderation ---
    def ban_user(self, server_id, user_id):
        # Route hypothétique, à adapter si elle existe
        return self.request('POST', f'/members/{server_id}/ban', json={'userId': user_id})
