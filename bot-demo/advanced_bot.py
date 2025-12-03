import velmu
import time
import requests
from datetime import datetime

# Configuration
BOT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNGU5ODkzOS1hMjlmLTRiMDItOTAzMC0xMTNlMmYzOGFjNTQiLCJib3RJZCI6IjVmNmQyMjhjLTc2ODEtNGIwZi1hYzg5LThkYzQyNTMwYmY5YyIsInR5cGUiOiJib3QiLCJpYXQiOjE3NjQ3MTc3MTF9.0_uj8rmYl6Kz3D2qHElYLADCPgDz8jop3EGrzM2ieq0"

CONFIG = {
    "prefix": "!",
    "welcome_channel_id": "b514708d-792c-44c0-b65a-ae5eebc47d02",
    "bad_words": ["idiot", "nul", "spam", "stupide"],
    "auto_mod_enabled": True,
    "admin_users": []
}

client = velmu.Client()

def format_date(iso_date):
    """Formate une date ISO en format lisible"""
    try:
        dt = datetime.fromisoformat(iso_date.replace('Z', '+00:00'))
        return dt.strftime("%d/%m/%Y à %H:%M")
    except:
        return "Date inconnue"

# ============================
# ÉVÉNEMENTS
# ============================

@client.event
def on_ready():
    print(f'🚀 Bot avancé connecté : {client.user}')
    print(f'📝 Préfixe des commandes : {CONFIG["prefix"]}')
    print(f'🛡️  Auto-modération : {"Activée" if CONFIG["auto_mod_enabled"] else "Désactivée"}')

@client.event
def on_member_join(member):
    username = member.get('user', {}).get('username', 'Inconnu')
    print(f"👋 Nouveau membre : {username}")
    
    channel_id = CONFIG["welcome_channel_id"]
    if channel_id and channel_id != "REMPLACER_PAR_ID_DU_CHANNEL":
        try:
            welcome_msg = f">🎉 Bienvenue **{username}** sur le serveur !\n  Tape {CONFIG['prefix']}help pour voir toutes les commandes."
            channel = client.get_channel(channel_id)
            if channel:
                channel.send(welcome_msg)
                print(f"✅ Message de bienvenue envoyé")
        except Exception as e:
            print(f"❌ Erreur envoi bienvenue : {e}")

@client.event
def on_member_leave(member):
    username = member.get('user', {}).get('username', 'Inconnu')
    print(f"👋 Membre parti : {username}")

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
                    message.delete()
                    message.channel.send(f"⚠️ {message.author.username}, surveille ton langage s'il te plaît !")
                except Exception as e:
                    print(f"❌ Erreur auto-mod: {e}")
                return

    # Commandes
    if not message.content.startswith(CONFIG["prefix"]):
        return

    content = message.content[len(CONFIG["prefix"]):]
    parts = content.split(' ')
    command = parts[0].lower()
    args = parts[1:]

    # ============================
    # COMMANDES GÉNÉRALES
    # ============================

    if command == "help":
        help_text = f"""📚 **Commandes disponibles**

**✨ GÉNÉRALES**
>{CONFIG['prefix']}help - Affiche ce message
>{CONFIG['prefix']}ping - Teste la latence
>{CONFIG['prefix']}uptime - Temps de fonctionnement
>{CONFIG['prefix']}botinfo - Informations sur le bot

**📊 INFORMATIONS**
>{CONFIG['prefix']}serverinfo - Infos détaillées du serveur
>{CONFIG['prefix']}userinfo - Tes informations
>{CONFIG['prefix']}members - Liste des membres
>{CONFIG['prefix']}channelinfo - Infos du salon
>{CONFIG['prefix']}avatar - Ton avatar

**🛡️ MODÉRATION**
>{CONFIG['prefix']}purge <nombre> - Supprime des messages
>{CONFIG['prefix']}warn <raison> - Avertit un membre

**🎮 UTILITAIRES**
>{CONFIG['prefix']}say <msg> - Fait parler le bot
>{CONFIG['prefix']}stats - Statistiques
>{CONFIG['prefix']}roll [max] - Lance un dé
>{CONFIG['prefix']}flip - Pile ou Face
>{CONFIG['prefix']}8ball <question> - Boule magique
>{CONFIG['prefix']}calc <expression> - Calculatrice

**🎨 FUN**
>{CONFIG['prefix']}joke - Blague aléatoire
>{CONFIG['prefix']}catfact - Fait sur les chats
>{CONFIG['prefix']}dogfact - Fait sur les chiens
>{CONFIG['prefix']}advice - Conseil du jour
>{CONFIG['prefix']}slap <@mention> - Gifle quelqu'un
>{CONFIG['prefix']}hug <@mention> - Câlin virtuel

**🌐 API & INFOS**
>{CONFIG['prefix']}country <pays> - Infos sur un pays
>{CONFIG['prefix']}pokemon <nom> - Infos Pokémon
>{CONFIG['prefix']}crypto <btc/eth> - Prix crypto
>{CONFIG['prefix']}space - Photo NASA du jour"""
        message.reply(help_text)

    elif command == "ping":
        start = time.time()
        end = time.time()
        latency = int((end - start) * 1000)
        message.reply(f"🏓 **Pong !** Latence : *{latency}ms*")

    elif command == "uptime":
        uptime_seconds = int(time.time() - getattr(client, 'start_time', time.time()))
        hours = uptime_seconds // 3600
        minutes = (uptime_seconds % 3600) // 60
        seconds = uptime_seconds % 60
        message.reply(f"⏰ En ligne depuis : **{hours}h {minutes}m {seconds}s**")

    elif command == "botinfo":
        bot_user = client.user
        created_at = bot_user.created_at if hasattr(bot_user, 'created_at') else None
        
        info = f"""🤖 **Informations du Bot**

**Nom :** {bot_user.username}
**ID :** {bot_user.id}
**Discriminateur :** #{bot_user.discriminator}
**Créé le :** {format_date(created_at) if created_at else 'Inconnue'}
>**Préfixe :** {CONFIG['prefix']}
**Version :** *2.1 Advanced*"""
        message.reply(info)

    # ============================
    # INFORMATIONS
    # ============================

    elif command == "serverinfo":
        if not message.server_id:
            return message.reply("❌ Cette commande fonctionne uniquement sur un serveur.")
        
        server = client.get_server(message.server_id)
        if server:
            members = server.get_members()
            member_count = len(members) if members else "?"
            
            # Compter les bots
            bot_count = 0
            if members:
                for member in members:
                    if member.get('user', {}).get('isBot', False):
                        bot_count += 1
            
            # created_date = format_date(server.created_at) # Pas encore dispo dans Server model
            
            info = f"""📊 **Informations du Serveur**

**Nom :** {server.name}
**ID :** {server.id}
**Propriétaire :** <@{server.owner_id}>
**Membres :** {member_count} *({bot_count} bots)*
**Icône :** {server.icon_url or 'Aucune'}"""
            message.reply(info)
        else:
            message.reply("❌ Impossible de récupérer les informations du serveur.")

    elif command == "userinfo":
        target_user = message.author
        
        created_date = format_date(target_user.created_at) if hasattr(target_user, 'created_at') else "Inconnue"
        user_type = "🤖 Bot" if target_user.is_bot else "👤 Utilisateur"
        avatar_url = target_user.avatar_url or "https://cdn.discordapp.com/embed/avatars/0.png"
        
        embed = velmu.Embed()
        embed.set_author(target_user.username, icon_url=avatar_url)
        embed.set_title("Informations Utilisateur")
        embed.set_color(0x3498DB)
        
        embed.set_thumbnail(avatar_url)
        
        embed.add_field("ID", target_user.id, inline=True)
        embed.add_field("Type", user_type, inline=True)
        embed.add_field("Compte créé le", created_date, inline=False)
        
        embed.set_footer(f"Demandé par {message.author.username}", icon_url=avatar_url)
        embed.set_timestamp()
        
        message.channel.send(embed=embed)

    elif command == "members":
        if not message.server_id:
            return message.reply("❌ Cette commande fonctionne uniquement sur un serveur.")
        
        server = client.get_server(message.server_id)
        if server:
            members = server.get_members()
        else:
            members = None

        if members:
            member_list = []
            for i, member in enumerate(members[:20], 1):
                user = member.get('user', {})
                username = user.get('username', 'Inconnu')
                is_bot = user.get('isBot', False)
                emoji = "🤖" if is_bot else "👤"
                member_list.append(f"{emoji} **{i}.** {username}")
            
            total = len(members)
            displayed = min(20, total)
            msg = f"👥 **Membres du serveur** *({displayed}/{total})*\n\n"
            msg += "\n".join(member_list)
            if total > 20:
                msg += f"\n\n*Et {total - 20} autres membres...*"
            message.reply(msg)
        else:
            message.reply("❌ Impossible de récupérer la liste des membres.")

    elif command == "channelinfo":
        channel_info = f"""💬 **Informations du Salon**

**ID :** {message.channel_id}
**Serveur :** {message.server_id or '*Conversation privée*'}"""
        message.reply(channel_info)

    elif command == "avatar":
        target_user = message.author
        if target_user.avatar_url:
            embed = velmu.Embed()
            embed.set_title(f"🖼️ Avatar de {target_user.username}")
            embed.set_image(target_user.avatar_url)
            embed.set_color(0x95A5A6)
            message.channel.send(embed=embed)
        else:
            message.reply(f"ℹ️ {target_user.username} utilise l'avatar par défaut.")

    # ============================
    # MODÉRATION
    # ============================

    elif command == "purge":
        if not message.server_id:
            return message.reply("❌ Cette commande fonctionne uniquement sur un serveur.")
        
        try:
            amount = int(args[0]) if args else 10
            if amount > 50:
                amount = 50
                message.reply("⚠️ Limite de 50 messages maximum. Suppression de 50 messages...")
            
            print(f"🧹 Purge : {amount} messages dans {message.channel_id}")
            messages = message.channel.history(limit=amount + 1)
            
            if not messages:
                return message.reply("❌ Impossible de récupérer les messages.")

            count = 0
            for msg in messages:
                try:
                    msg.delete()
                    count += 1
                    time.sleep(0.1)
                except Exception as e:
                    print(f"❌ Erreur suppression {msg.id}: {e}")
            
            print(f"✅ {count} messages supprimés")
            confirmation = message.channel.send(f"🧹 **{count}** messages supprimés avec succès.")
            
            if confirmation:
                # confirmation est un dict car send retourne le json de l'API, pas un objet Message encore (sauf si on update send)
                # Channel.send retourne self._http.send_message qui retourne le JSON.
                # Pour être propre il faudrait que Channel.send retourne un objet Message.
                # Mais pour l'instant on gère le dict retourné par l'API.
                time.sleep(3)
                try:
                    client.http.delete_message(confirmation.get('id'))
                except:
                    pass
            
        except ValueError:
            message.reply(f">❌ Usage : {CONFIG['prefix']}purge <nombre>")
        except Exception as e:
            message.reply(f"❌ Erreur lors de la suppression : {str(e)}")

    elif command == "warn":
        if not args:
            return message.reply(f">❌ Usage : {CONFIG['prefix']}warn <raison>")
        
        reason = " ".join(args)
        message.reply(f"⚠️ **Avertissement enregistré**\nRaison : *{reason}*")

    # ============================
    # UTILITAIRES
    # ============================

    elif command == "say":
        if not args:
            return message.reply("❓ Je dois dire quoi ?")
        
        text = " ".join(args)
        message.channel.send(text)
        try:
            message.delete()
        except:
            pass

    elif command == "stats":
        uptime_seconds = int(time.time() - getattr(client, 'start_time', time.time()))
        hours = uptime_seconds // 3600
        minutes = (uptime_seconds % 3600) // 60
        
        stats = f"""📈 **Statistiques du Bot**

>**Préfixe :** {CONFIG['prefix']}
**Auto-modération :** {'✅ Activée' if CONFIG['auto_mod_enabled'] else '❌ Désactivée'}
**Mots filtrés :** {len(CONFIG['bad_words'])}
**Uptime :** {hours}h {minutes}m
**Version :** *2.1 Advanced*"""
        message.reply(stats)

    elif command == "roll":
        import random
        max_num = int(args[0]) if args and args[0].isdigit() else 100
        result = random.randint(1, max_num)
        message.reply(f"🎲 **Résultat du dé :** {result} *(sur {max_num})*")

    elif command == "flip":
        import random
        result = random.choice(["Pile ⚪", "Face ⚫"])
        message.reply(f"🪙 **Résultat :** {result}")

    elif command == "8ball":
        import random
        if not args:
            return message.reply("❓ Pose-moi une question !")
        
        responses = [
            "✅ Oui, absolument !",
            "✅ C'est certain.",
            "✅ Sans aucun doute.",
            "🤔 Probablement.",
            "🤔 Les signes pointent vers oui.",
            "⚠️ Réponse incertaine, réessaye.",
            "⚠️ Demande plus tard.",
            "❌ Non.",
            "❌ Très douteux.",
            "❌ N'y compte pas."
        ]
        message.reply(f"🔮 **{random.choice(responses)}**")

    elif command == "calc":
        if not args:
            return message.reply(f">❌ Usage : {CONFIG['prefix']}calc <expression>")
        
        try:
            expression = " ".join(args)
            # Sécurité basique : autoriser seulement les opérations mathématiques
            allowed_chars = r"0123456789+-*/.()\s"
            if all(c in allowed_chars for c in expression):
                result = eval(expression)
                message.reply(f"🧮 **Résultat :** {result}")
            else:
                message.reply("❌ Expression invalide. Utilise seulement des chiffres et +, -, *, /, ( )")
        except:
            message.reply("❌ Impossible de calculer cette expression.")

    elif command == "slap":
        target = args[0] if args else "quelqu'un"
        message.channel.send(f"👋 **{message.author.username}** gifle {target} ! *PAF !*")

    elif command == "hug":
        target = args[0] if args else "quelqu'un"
        message.channel.send(f"🤗 **{message.author.username}** fait un câlin à {target} ! *Aww...*")

    elif command == "joke":
        try:
            response = requests.get("https://v2.jokeapi.dev/joke/Any?lang=fr&type=single", timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                joke_text = ""
                if 'joke' in data:
                    joke_text = data['joke']
                else:
                    # Fallback sur nos blagues locales
                    import random
                    jokes = [
                        "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tombent dans le bateau ! 🤿",
                        "Qu'est-ce qu'un crocodile qui surveille une station ? Un Lacoste ! 🐊",
                        "Qu'est-ce qu'un dinosaure qui dort ? Un dinodor ! 🦕"
                    ]
                    joke_text = random.choice(jokes)
                    
                embed = velmu.Embed()
                embed.set_title("😄 Blague")
                embed.set_description(joke_text)
                embed.set_color(0xF1C40F)
                message.channel.send(embed=embed)
            else:
                message.reply("❌ Impossible de récupérer une blague pour le moment.")
        except:
            import random
            jokes = [
                "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tombent dans le bateau ! 🤿",
                "Qu'est-ce qu'un crocodile qui surveille une station ? Un Lacoste ! 🐊"
            ]
            embed = velmu.Embed()
            embed.set_title("😄 Blague")
            embed.set_description(random.choice(jokes))
            embed.set_color(0xF1C40F)
            message.channel.send(embed=embed)

    elif command == "catfact":
        try:
            response = requests.get("https://catfact.ninja/fact", timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                embed = velmu.Embed()
                embed.set_title("🐱 Fait sur les chats")
                embed.set_description(data['fact'])
                embed.set_color(0xE67E22)
                
                message.channel.send(embed=embed)
            else:
                message.reply("❌ Impossible de récupérer un fait sur les chats.")
        except Exception as e:
            message.reply(f"❌ Erreur lors de la récupération : {str(e)}")

    elif command == "dogfact":
        try:
            response = requests.get("https://dog-api.kinduff.com/api/facts", timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                embed = velmu.Embed()
                embed.set_title("🐶 Fait sur les chiens")
                embed.set_description(data['facts'][0])
                embed.set_color(0x8D6E63)
                
                message.channel.send(embed=embed)
            else:
                message.reply("❌ Impossible de récupérer un fait sur les chiens.")
        except Exception as e:
            message.reply(f"❌ Erreur lors de la récupération : {str(e)}")

    elif command == "advice":
        try:
            response = requests.get("https://api.adviceslip.com/advice", timeout=5)
            if response.status_code == 200:
                data = response.json()
                advice = data['slip']['advice']
                
                embed = velmu.Embed()
                embed.set_title("💡 Conseil du jour")
                embed.set_description(advice)
                embed.set_color(0x9B59B6)
                
                message.channel.send(embed=embed)
            else:
                message.reply("❌ Impossible de récupérer un conseil.")
        except Exception as e:
            message.reply(f"❌ Erreur lors de la récupération : {str(e)}")

    # ============================
    # API & INFOS
    # ============================

    elif command == "country":
        if not args:
            return message.reply(f">❌ Usage : {CONFIG['prefix']}country <nom du pays>")
        
        country_name = " ".join(args)
        try:
            response = requests.get(f"https://restcountries.com/v3.1/name/{country_name}", timeout=5)
            if response.status_code == 200:
                data = response.json()[0]
                
                name = data['name']['common']
                capital = data.get('capital', ['Inconnue'])[0]
                population = f"{data.get('population', 0):,}".replace(',', ' ')
                region = data.get('region', 'Inconnue')
                flag_emoji = data.get('flag', '️')
                flag_url = data.get('flags', {}).get('png', '')
                
                languages = ', '.join(data.get('languages', {}).values()) if data.get('languages') else 'Inconnues'
                
                embed = velmu.Embed()
                embed.set_title(f"{flag_emoji} {name}", url=f"https://en.wikipedia.org/wiki/{name.replace(' ', '_')}")
                embed.set_description(f"Informations sur **{name}**")
                embed.set_color(0x3498DB)
                
                embed.add_field("Capitale", capital, inline=True)
                embed.add_field("Région", region, inline=True)
                embed.add_field("Population", population, inline=True)
                embed.add_field("Langues", languages, inline=False)
                
                if flag_url:
                    embed.set_thumbnail(flag_url)
                
                embed.set_footer("Données via RestCountries")
                
                message.channel.send(embed=embed)
            else:
                message.reply(f"❌ Pays **{country_name}** introuvable.")
        except Exception as e:
            message.reply(f"❌ Erreur lors de la recherche : {str(e)}")

    elif command == "pokemon":
        if not args:
            return message.reply(f">❌ Usage : {CONFIG['prefix']}pokemon <nom>")
        
        pokemon_name = args[0].lower()
        try:
            response = requests.get(f"https://pokeapi.co/api/v2/pokemon/{pokemon_name}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                name = data['name'].capitalize()
                height = data['height'] / 10  # en mètres
                weight = data['weight'] / 10  # en kg
                types = ', '.join([t['type']['name'].capitalize() for t in data['types']])
                hp = next((s['base_stat'] for s in data['stats'] if s['stat']['name'] == 'hp'), 0)
                attack = next((s['base_stat'] for s in data['stats'] if s['stat']['name'] == 'attack'), 0)
                defense = next((s['base_stat'] for s in data['stats'] if s['stat']['name'] == 'defense'), 0)
                sprite_url = data['sprites']['front_default']

                embed = velmu.Embed()
                embed.set_title(f"⚡ {name}", url=f"https://www.pokemon.com/fr/pokedex/{pokemon_name}")
                embed.set_description(f"**Type(s) :** {types}")
                embed.set_color(0xFFCB05)

                embed.add_field("Taille", f"{height}m", inline=True)
                embed.add_field("Poids", f"{weight}kg", inline=True)
                embed.add_field("PV", str(hp), inline=True)
                embed.add_field("Attaque", str(attack), inline=True)
                embed.add_field("Défense", str(defense), inline=True)

                if sprite_url:
                    embed.set_thumbnail(sprite_url)
                
                embed.set_footer("Données via PokéAPI")

                message.channel.send(embed=embed)
            else:
                message.reply(f"❌ Pokémon **{pokemon_name}** introuvable.")
        except Exception as e:
            message.reply(f"❌ Erreur : {str(e)}")

    elif command == "crypto":
        if not args:
            return message.reply(f">❌ Usage : {CONFIG['prefix']}crypto <bitcoin/ethereum/etc>")
        
        crypto = args[0].lower()
        try:
            response = requests.get(f"https://api.coingecko.com/api/v3/simple/price?ids={crypto}&vs_currencies=eur,usd&include_24hr_change=true", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if crypto in data:
                    price_eur = data[crypto].get('eur', 0)
                    price_usd = data[crypto].get('usd', 0)
                    change = data[crypto].get('usd_24h_change', 0)
                    
                    trend = "📈" if change > 0 else "📉"
                    color = 0x2ECC71 if change > 0 else 0xE74C3C
                    
                    embed = velmu.Embed()
                    embed.set_title(f"💰 {crypto.upper()}", url=f"https://www.coingecko.com/en/coins/{crypto}")
                    embed.set_color(color)
                    
                    embed.add_field("Prix (EUR)", f"{price_eur:,.2f} €", inline=True)
                    embed.add_field("Prix (USD)", f"{price_usd:,.2f} $", inline=True)
                    embed.add_field("Variation 24h", f"{trend} {change:.2f}%", inline=False)
                    
                    embed.set_footer("Données via CoinGecko")
                    
                    message.channel.send(embed=embed)
                else:
                    message.reply(f"❌ Crypto **{crypto}** introuvable.")
            else:
                message.reply("❌ Erreur lors de la récupération des données.")
        except Exception as e:
            message.reply(f"❌ Erreur : {str(e)}")

    elif command == "space":
        try:
            response = requests.get("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY", timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                title = data.get('title', 'Image du jour')
                description = data.get('explanation', 'Pas de description')
                url = data.get('url', '')
                date = data.get('date', '')
                
                # Limiter la description
                if len(description) > 300:
                    description = description[:297] + "..."
                
                embed = velmu.Embed()
                embed.set_title(f"🌌 {title}")
                embed.set_description(description)
                embed.set_color(0x0B3D91)
                embed.set_image(url)
                embed.set_footer(f"NASA APOD • {date}")
                
                message.channel.send(embed=embed)
            else:
                message.reply("❌ Impossible de récupérer l'image du jour.")
        except Exception as e:
            message.reply(f"❌ Erreur : {str(e)}")

    # ============================
    # COMMANDE INCONNUE
    # ============================
    
    else:
        message.reply(f">❓ Commande inconnue. Tape {CONFIG['prefix']}help pour voir toutes les commandes.")

@client.event
def on_reaction_add(reaction):
    # On ignore les réactions du bot lui-même
    if reaction.user_id == client.user.id:
        return

    print(f"Réaction reçue : {reaction.emoji} de {reaction.user_id}")

    # Exemple : Si on réagit avec 👋, le bot dit bonjour
    if reaction.emoji == '👋':
        message = reaction.message()
        if message:
            message.channel.send(f"Coucou <@{reaction.user_id}> ! 👋")
            
    # Exemple : Si on réagit avec ❌ sur un message du bot, il le supprime
    if reaction.emoji == '❌':
        message = reaction.message()
        # Si le message est du bot, on le supprime
        if message and message.author and message.author.id == client.user.id:
            message.delete()

# ============================
# DÉMARRAGE
# ============================

if __name__ == '__main__':
    client.start_time = time.time()
    print("="*50)
    print("🤖 Démarrage du bot Velmu Advanced v2.1")
    print("="*50)
    client.run(BOT_TOKEN)
