import socketio
import asyncio
import inspect
from .http import HTTPClient
from .models import Message, User, Reaction, Server, Channel

class Client:
    def __init__(self):
        self.sio = socketio.Client()
        self.http = None
        self.user = None
        self._events = {}
        
        # Création d'une boucle d'événements persistante pour ce client
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

        # Enregistrement des handlers internes
        self.sio.on('connect', self._on_connect)
        self.sio.on('new_message', self._on_message_received)
        self.sio.on('member_added', self._on_member_added)
        self.sio.on('member_removed', self._on_member_removed)
        self.sio.on('message_reaction_add', self._on_reaction_add)
        self.sio.on('message_reaction_remove', self._on_reaction_remove)

    def event(self, func):
        """Décorateur pour enregistrer un événement."""
        self._events[func.__name__] = func
        return func

    def run(self, token):
        """Lance le bot."""
        self.http = HTTPClient(token)
        try:
            # Authentification via handshake (requis par le serveur)
            self.sio.connect('http://localhost:4000', auth={'token': token})
            self.sio.wait()
        except Exception as e:
            print(f"Erreur de connexion : {e}")

    # --- Helpers ---
    def get_server(self, server_id):
        data = self.http.get_server(server_id)
        if data:
            return Server(data, self.http)
        return None

    def get_channel(self, channel_id):
        # On utilise get_server_id_from_channel pour récupérer les infos du channel
        # car get_server_id_from_channel appelle en fait GET /channels/:id qui retourne tout le channel
        data = self.http.request('GET', f'/channels/{channel_id}')
        if isinstance(data, dict):
            return Channel(data, self.http)
        return None

    def get_user(self, user_id):
        # TODO: Ajouter get_user dans http.py
        # Pour l'instant on ne peut pas récupérer un user arbitraire facilement sans endpoint public
        pass

    def _on_connect(self):
        print('Connecté au serveur Socket.IO')
        try:
            # On récupère nos propres infos via l'API
            user_data = self.http.get_me()
            if user_data:
                self.user = User(user_data, self.http)
                print(f'Authentifié en tant que {self.user}')
                
                # Déclenche l'événement on_ready s'il existe
                if 'on_ready' in self._events:
                    handler = self._events['on_ready']
                    if inspect.iscoroutinefunction(handler):
                        self.loop.run_until_complete(handler())
                    else:
                        handler()
        except Exception as e:
            print(f"Erreur lors de la récupération du profil : {e}")

    # _on_authenticated supprimé car non utilisé par le serveur

    def _on_message_received(self, data):
        # Conversion des données brutes en objet Message
        message = Message(data, self.http)
        
        # Déclenche l'événement on_message s'il existe
        if 'on_message' in self._events:
            handler = self._events['on_message']
            try:
                if inspect.iscoroutinefunction(handler):
                    self.loop.run_until_complete(handler(message))
                else:
                    handler(message)
            except Exception as e:
                print(f"Erreur dans on_message : {e}")

        # Déclenche l'événement on_reply s'il existe et si c'est une réponse
        if message.reply_to_id and 'on_reply' in self._events:
            handler = self._events['on_reply']
            try:
                if inspect.iscoroutinefunction(handler):
                    self.loop.run_until_complete(handler(message))
                else:
                    handler(message)
            except Exception as e:
                print(f"Erreur dans on_reply : {e}")

    def _on_member_added(self, data):
        if 'on_member_join' in self._events:
            handler = self._events['on_member_join']
            if inspect.iscoroutinefunction(handler):
                self.loop.run_until_complete(handler(data))
            else:
                handler(data)

    def _on_member_removed(self, data):
        if 'on_member_leave' in self._events:
            handler = self._events['on_member_leave']
            if inspect.iscoroutinefunction(handler):
                self.loop.run_until_complete(handler(data))
            else:
                handler(data)

    def _on_reaction_add(self, data):
        if 'on_reaction_add' in self._events:
            reaction = Reaction(data, self.http)
            handler = self._events['on_reaction_add']
            if inspect.iscoroutinefunction(handler):
                self.loop.run_until_complete(handler(reaction))
            else:
                handler(reaction)

    def _on_reaction_remove(self, data):
        if 'on_reaction_remove' in self._events:
            reaction = Reaction(data, self.http)
            handler = self._events['on_reaction_remove']
            if inspect.iscoroutinefunction(handler):
                self.loop.run_until_complete(handler(reaction))
            else:
                handler(reaction)
