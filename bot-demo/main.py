import velmu
import time
import os
import importlib
from velmu.commands import CommandManager

# Configuration
BOT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNDc4MzNlYi1jZDRiLTQ5NTYtOTYwYy0zZTBjZGNjMjQ1ZTgiLCJib3RJZCI6ImM0MmU0YTExLWE5OWYtNGI3NC05YmI2LWVjZTJlYTMwNjU3ZiIsInR5cGUiOiJib3QiLCJpYXQiOjE3NjQ2ODgyNzl9.XvRTvmlmicCtOs9QaVK1LcsJ3i3FLTudVoZRc-bJ3aU"

CONFIG = {
    "prefix": "!",
    "welcome_channel_id": "b514708d-792c-44c0-b65a-ae5eebc47d02",
    "bad_words": ["idiot", "nul", "spam", "stupide"],
    "auto_mod_enabled": True
}

client = velmu.Client()
manager = CommandManager(client, CONFIG["prefix"])

# ============================
# CHARGEMENT DES COMMANDES
# ============================

def load_commands():
    """Charge dynamiquement les modules de commandes"""
    commands_dir = os.path.join(os.path.dirname(__file__), 'commands')
    for filename in os.listdir(commands_dir):
        if filename.endswith('.py') and not filename.startswith('__'):
            module_name = f"commands.{filename[:-3]}"
            try:
                module = importlib.import_module(module_name)
                if hasattr(module, 'setup'):
                    module.setup(manager)
                    print(f"📦 Module chargé : {filename}")
            except Exception as e:
                print(f"❌ Erreur chargement {filename}: {e}")

# ============================
# ÉVÉNEMENTS
# ============================

@client.event
def on_ready():
    print(f'🚀 Bot Modulaire Connecté : {client.user}')
    print(f'📝 Préfixe : {CONFIG["prefix"]}')
    print(f'📚 Commandes chargées : {len(manager.commands)}')

@client.event
def on_message(message):
    if message.author.id == client.user.id:
        return

    # Auto-Modération
    if CONFIG["auto_mod_enabled"]:
        for bad_word in CONFIG["bad_words"]:
            if bad_word in message.content.lower():
                print(f"🛡️ Auto-mod: Message supprimé de {message.author}")
                try:
                    client.http.delete_message(message.id)
                    message.channel.send(f"⚠️ {message.author.username}, surveille ton langage s'il te plaît !")
                except:
                    pass
                return

    # Gestion des commandes via le CommandManager
    # Note: handle_message est async, mais on l'appelle ici de manière synchrone car on_message n'est pas async dans cette lib
    # Pour simplifier, on utilise asyncio.run si nécessaire ou on adapte handle_message
    import asyncio
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    if loop.is_running():
        # Si on est déjà dans une loop (ce qui est probable si le client est async)
        asyncio.create_task(manager.handle_message(message))
    else:
        loop.run_until_complete(manager.handle_message(message))

@client.event
def on_member_join(member):
    username = member.get('user', {}).get('username', 'Inconnu')
    print(f"👋 Nouveau membre : {username}")
    
    channel_id = CONFIG["welcome_channel_id"]
    if channel_id and channel_id != "REMPLACER_PAR_ID_DU_CHANNEL":
        try:
            welcome_msg = f">🎉 Bienvenue **{username}** sur le serveur !\n  Tape {CONFIG['prefix']}help pour voir toutes les commandes."
            client.http.send_message(channel_id, welcome_msg)
        except Exception as e:
            print(f"❌ Erreur envoi bienvenue : {e}")

# ============================
# DÉMARRAGE
# ============================

if __name__ == '__main__':
    client.start_time = time.time()
    print("="*50)
    print("🤖 Démarrage du bot Velmu Modular v3.0")
    print("="*50)
    load_commands()
    client.run(BOT_TOKEN)
