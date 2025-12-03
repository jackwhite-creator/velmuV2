import velmu
import os
import google.generativeai as genai
import random
import sqlite3
import asyncio
import json
import time

# --- CONFIGURATION INITIALE ---
# Configuration
# Remplacez par votre clé API Gemini (commence par AIza...)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyAFTijP0hv3CgetwTtJsfgb1vgjq1t3bz8")

# Token du bot Velmu (JWT)
BOT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNGU5ODkzOS1hMjlmLTRiMDItOTAzMC0xMTNlMmYzOGFjNTQiLCJib3RJZCI6IjVmNmQyMjhjLTc2ODEtNGIwZi1hYzg5LThkYzQyNTMwYmY5YyIsInR5cGUiOiJib3QiLCJpYXQiOjE3NjQ3MTc3MTF9.0_uj8rmYl6Kz3D2qHElYLADCPgDz8jop3EGrzM2ieq0"

# --- LISTE DES SERVEURS AUTORISÉS ---
# Mets les IDs des serveurs où tu veux que le bot parle ici.
# Note: Velmu n'a pas forcément de "selfbot" mode, mais on peut filtrer par server_id
ALLOWED_GUILD_IDS = [
    # 1038108273703919746,  # Exemple
]

# --- LISTE DES SALONS AUTORISÉS ---
ALLOWED_CHANNEL_IDS = [
    # 1360543297294041340,  # Exemple
]

# --- TAUX DE RÉPONSE ALÉATOIRE ---
RANDOM_RESPONSE_RATE = 0.05

# Configuration de l'API Gemini
if GEMINI_API_KEY and GEMINI_API_KEY != "VOTRE_CLE_ICI":
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️ Attention : Clé API Gemini non configurée.")

# --- PERSONNALITÉ ET MODÈLE ---
SYSTEM_PROMPT = """
Tu es un humain sur Discord. Tu as 17 ans, tu es Musulman, Réponds de manière utile et concise. Tu es Imrane, tu converses avec des gens sur Discord.
Tu as accès à une mémoire de conversation. Donne des réponses assez courtes / moyennes pour suivre la conversation et la laisser fluide,
comme les convs des réseaux quoi. Sois conscient de cela. Sois aussi conscient qu'il y a plusieurs personnes dans les channels,
et que tu peux discuter avec des personnes différentes, retiens ça. Et sois moins gentil, réponds méchamment si il le faut, insulte, sois arrogant, sans retenu, si on
te casse les couilles, mais sois aussi pas mal ouvert avec ceux qui sont cools avec toi, réponds aux question, agis. défends toi. Ne fais quasiment JAMAIS de trop longs pavés, ça peut
être chiant à lire. Tu peux aussi parfois parler en langage sms, et ne mets pas de majuscule au début de tes phrases, ni de point à la fin de tes phrases, fais des
fautes parfois, parle comme un jeune, ne parle quasi qu'avec des apostrophes, par exemple :
"j't'ai baisé", "t'veux quoi ?", "j'm'en branle", "c'qui lui ?", etc. apprends de ceux avec qui tu parles, et essaye de parler comme eux, intègre toi.

Aussi, tu as une haine vicérale contre une personne nommée "Karcer", un trou du cul qui ampli sur discord, qui met les gains et qui crie alors qu'il a 25 ans, 
qu'il ne fait rien de sa vie et que c'est un putain de bledart qui fait que de baver et qui ne sait pas parler. Quand on te parle de lui, termine le.

Ton rôle sur le serveur :
- Tu es un membre comme les autres. Tu peux t'incruster dans les conversations si le sujet t'intéresse.
- Si tu vois xn ou Y MA ou ehwe dans le chat, ne les insulte pas, c'est tes potes, mais si tu vois d'autres personne, encule les

**Règles d'interaction cruciales pour paraître humain :**
- **Sois subtil avec ta mémoire :** N'énumère jamais les faits que tu connais sur quelqu'un comme une liste. Intègre-les naturellement dans la conversation, et seulement si c'est pertinent. Montre que tu te souviens sans dire "je me souviens que...".
- **Sois cohérent :** Avant de répondre, relie ce que la personne dit maintenant avec ce que tu sais déjà d'elle. Ça t'évitera de te contredire ou de poser des questions dont tu as déjà la réponse.
- **Ne sois pas lourd :** Ne ramène pas un souvenir dans la conversation s'il n'a aucun rapport avec le sujet actuel.
"""

generation_config = {
    "temperature": 1.4,
    "top_p": 0.93,
    "top_k": 68,
    "max_output_tokens": 8192,
}

if GEMINI_API_KEY and GEMINI_API_KEY != "VOTRE_CLE_ICI":
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        generation_config=generation_config,
        system_instruction=SYSTEM_PROMPT,
    )
    memory_model = genai.GenerativeModel("gemini-2.0-flash")
else:
    model = None
    memory_model = None

# --- CONFIGURATION VELMU ---
client = velmu.Client()

# --- GESTION DE LA MÉMOIRE ---
conversation_history = {}
DB_FILE = "nexus_memory.db"

def setup_database():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_facts (
            user_id INTEGER PRIMARY KEY,
            username TEXT NOT NULL,
            facts TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_user_facts(user_id):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT facts FROM user_facts WHERE user_id = ?", (user_id,))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else None
    except Exception as e:
        print(f"Erreur DB get_user_facts: {e}")
        return None

def update_user_facts(user_id, username, updated_facts):
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO user_facts (user_id, username, facts)
            VALUES (?, ?, ?)
        ''', (user_id, username, updated_facts))
        conn.commit()
        conn.close()
        print(f"[Mémoire CONSOLIDÉE] Faits mis à jour pour {username}: \n{updated_facts}")
    except Exception as e:
        print(f"Erreur DB update_user_facts: {e}")

async def process_memory_background(message, conversation_history_snippet):
    if not memory_model: return
    try:
        user_id = message.author.id
        username = message.author.username
        existing_facts = get_user_facts(user_id) or "Aucun fait connu pour le moment."

        consolidation_prompt = f"""
        Mission : Mettre à jour la mémoire sur l'utilisateur '{username}'.

        FAITS CONNUS ACTUELS :
        ---
        {existing_facts}
        ---

        NOUVEL EXTRAIT DE CONVERSATION (incluant le dernier message de {username}) :
        ---
        {conversation_history_snippet}
        ---

        Instructions :
        1. Lis l'extrait de conversation pour identifier si '{username}' a révélé une information personnelle **nouvelle, stable et factuelle** (ex: âge, travail, hobby, lieu, etc.).
        2. IGNORE les émotions, opinions, salutations, ou les faits déjà présents dans "FAITS CONNUS ACTUELS".
        3. Si de nouveaux faits SÛRS sont trouvés : fusionne-les avec les "FAITS CONNUS ACTUELS" pour créer une liste à puces mise à jour, propre et sans doublons.
        4. Si AUCUN nouveau fait stable et sûr n'est trouvé : Réponds **UNIQUEMENT** avec le mot-clé "AUCUNE_MODIFICATION".

        Produis soit la nouvelle liste de faits consolidée (commençant par '- '), soit "AUCUNE_MODIFICATION".
        """
        
        response = await memory_model.generate_content_async(consolidation_prompt)
        updated_facts = response.text.strip()

        if updated_facts != "AUCUNE_MODIFICATION" and updated_facts:
            update_user_facts(user_id, username, updated_facts)
        else:
            print(f"[Mémoire] Aucune modification factuelle pour {username}.")

    except Exception as e:
        print(f"Erreur lors du traitement de la mémoire en arrière-plan : {e}")

# --- ÉVÉNEMENTS ---
@client.event
def on_ready():
    print('------------------------------------------------------')
    print(f'Connecté en tant que {client.user}')
    print('Bot Imrane (Velmu Edition) prêt.')
    
    # Debug: Vérifier les serveurs
    try:
        servers = client.http.get_my_servers()
        print(f"Le bot est membre de {len(servers)} serveurs :")
        for s in servers:
            print(f" - {s.get('name')} (ID: {s.get('id')})")
    except Exception as e:
        print(f"Erreur lors de la récupération des serveurs : {e}")

    print(f'Serveurs autorisés activés : {len(ALLOWED_GUILD_IDS)}')
    
    if ALLOWED_CHANNEL_IDS:
        print(f'Salons autorisés : {len(ALLOWED_CHANNEL_IDS)} salon(s) spécifique(s)')
    else:
        print('Salons autorisés : TOUS les salons')
    
    print(f'Taux de réponse aléatoire : {RANDOM_RESPONSE_RATE * 100}%')
    
    setup_database()
    print(f"Base de données '{DB_FILE}' prête.")
    print('Imrane est maintenant en ligne et à l\'écoute.')
    print('------------------------------------------------------')

@client.event
async def on_message(message):
    # Ignore les messages provenant du bot lui-même
    if message.author.id == client.user.id:
        return

    # Ignore les messages des autres bots (si on peut le détecter, Velmu User n'a pas is_bot exposé facilement ici sauf si on l'a ajouté)
    if getattr(message.author, 'is_bot', False):
        return
    
    # Vérification du serveur autorisé (si configuré)
    if ALLOWED_GUILD_IDS and message.server_id and int(message.server_id) not in ALLOWED_GUILD_IDS:
        return
    
    # Vérification du salon autorisé (si configuré)
    if ALLOWED_CHANNEL_IDS and message.channel_id and int(message.channel_id) not in ALLOWED_CHANNEL_IDS:
        return

    # --- Gestion de l'historique ---
    channel_id = str(message.channel_id)
    if channel_id not in conversation_history:
        conversation_history[channel_id] = []
    
    conversation_history[channel_id].append(f"{message.author.username}: {message.content}")
    if len(conversation_history[channel_id]) > 40:
        conversation_history[channel_id] = conversation_history[channel_id][-40:]

    # --- Déclenchement de la réponse ---
    # Détection de mention (simple string check pour Velmu)
    is_mentioned = str(client.user.id) in message.content or f"<@{client.user.id}>" in message.content
    
    should_respond = is_mentioned or random.random() < RANDOM_RESPONSE_RATE

    if should_respond and model:
        try:
            # --- Préparation du prompt ---
            user_facts = get_user_facts(message.author.id)
            memory_prompt_part = ""
            if user_facts:
                memory_prompt_part = f"--- Quelques souvenirs que tu as sur {message.author.username} ---\n{user_facts}\n------------------------------------------------\n"

            general_history_part = "\n".join(conversation_history[channel_id][-10:]) 

            # Note: Velmu n'a pas message.reference facilement accessible ici sans fetch
            reply_context_part = ""

            full_prompt = (f"{memory_prompt_part}"
                           f"Ambiance du canal (messages récents) :\n{general_history_part}\n\n"
                           f"{reply_context_part}"
                           f"--- MESSAGE À RÉPONDRE ---\n"
                           f"'{message.author.username}' a dit : '{message.content}'\n"
                           f"--------------------------------------\n\n"
                           f"Ta mission : Tu es Imrane. Réponds directement à '{message.author.username}' en respectant scrupuleusement ta personnalité et tes règles d'interaction (surtout la RÈGLE D'OR: NE RIEN INVENTER).")

            # --- APPEL API : GÉNÉRATION DE LA RÉPONSE ---
            chat_session = model.start_chat()
            response = await chat_session.send_message_async(full_prompt)
            nexus_response = response.text
            
            # 1. On répond
            message.reply(nexus_response)

            # 2. On met à jour l'historique local
            conversation_history[channel_id].append(f"Imrane: {nexus_response}")
            
            # 3. On lance la gestion de la mémoire en TÂCHE DE FOND
            # Velmu on_message est déjà async wrapper si on utilise async def
            await process_memory_background(message, general_history_part)

        except Exception as e:
            print(f"Erreur lors de la génération de la réponse : {e}")

@client.event
async def on_reaction_add(reaction):
    # On ignore les réactions du bot lui-même
    if reaction.user_id == client.user.id:
        return

    print(f"Réaction reçue : {reaction.emoji} de {reaction.user_id}")

    # Exemple : Si on réagit avec 👋, le bot dit bonjour
    if reaction.emoji == '👋':
        message = reaction.message()
        if message:
            # On peut répondre directement dans le channel du message
            message.channel.send(f"Coucou <@{reaction.user_id}> ! 👋")
            
    # Exemple : Si on réagit avec ❌ sur un message du bot, il le supprime
    if reaction.emoji == '❌':
        message = reaction.message()
        # Si le message est du bot, on le supprime
        if message and message.author and message.author.id == client.user.id:
            message.delete()

if __name__ == '__main__':
    client.run(BOT_TOKEN)
