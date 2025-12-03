import velmu
import random
import time
import re

# Configuration
BOT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNGU5ODkzOS1hMjlmLTRiMDItOTAzMC0xMTNlMmYzOGFjNTQiLCJib3RJZCI6IjVmNmQyMjhjLTc2ODEtNGIwZi1hYzg5LThkYzQyNTMwYmY5YyIsInR5cGUiOiJib3QiLCJpYXQiOjE3NjQ3MTc3MTF9.0_uj8rmYl6Kz3D2qHElYLADCPgDz8jop3EGrzM2ieq0"

client = velmu.Client()

# Stockage des parties en cours
# {
#   message_id: {
#       'mode': 'pve' | 'pvp',
#       'p1': user_id,
#       'p2': user_id | 'bot',
#       'p1_name': username,
#       'p2_name': username,
#       'moves': {user_id: move},
#       'channel_id': channel_id
#   }
# }
active_games = {}

MOVES = {
    '🪨': 'Pierre',
    '📄': 'Feuille',
    '✂️': 'Ciseau'
}

def get_winner(move1, move2):
    if move1 == move2:
        return 'draw'
    if (move1 == '🪨' and move2 == '✂️') or \
       (move1 == '📄' and move2 == '🪨') or \
       (move1 == '✂️' and move2 == '📄'):
        return 'p1'
    return 'p2'

@client.event
def on_ready():
    print(f'🎮 Bot PFC connecté : {client.user}')

@client.event
def on_message(message):
    if message.author.id == client.user.id:
        return

    if message.content.startswith("!pfc"):
        # Analyse de la commande pour trouver une mention
        # Supporte <@ID> et <@!ID> avec support des UUIDs
        mention_match = re.search(r'<@!?([a-zA-Z0-9-]+)>', message.content)
        
        target_id = None
        target_name = "Bot"
        mode = 'pve'

        if mention_match:
            target_id = mention_match.group(1)
            
            # On ne peut pas se défier soi-même
            if target_id == message.author.id:
                message.reply("Tu ne peux pas jouer contre toi-meme !")
                return
            
            # Si on mentionne le bot, on joue en PvE
            if target_id == client.user.id:
                mode = 'pve'
                target_name = "Bot"
            else:
                mode = 'pvp'
                target_name = f"<@{target_id}>" 
        else:
            target_id = 'bot'

        # Création de l'embed de défi
        embed = velmu.Embed()
        embed.set_title("Pierre, Feuille, Ciseau !")
        embed.set_color(0xF1C40F)
        
        if mode == 'pve':
            embed.set_description(f"{message.author.username} defie le Bot !\n\nFais ton choix en reagissant ci-dessous ! 👇")
            embed.set_footer("Joue contre l'IA")
        else:
            embed.set_description(f"{message.author.username} defie {target_name} !\n\nLes deux joueurs doivent reagir pour jouer ! 👇")
            embed.set_footer("Mode PvP - En attente des joueurs")

        # Envoi du message
        msg_data = message.channel.send(embed=embed)
        
        if msg_data and 'id' in msg_data:
            msg_id = msg_data['id']
            
            active_games[msg_id] = {
                'mode': mode,
                'p1': message.author.id,
                'p2': target_id,
                'p1_name': message.author.username,
                'p2_name': target_name, # On garde le format mention pour l'affichage si possible, ou juste "Adversaire"
                'moves': {},
                'channel_id': message.channel_id
            }
            
            # Ajout des réactions
            temp_msg = velmu.Message(msg_data, client.http)
            temp_msg.add_reaction('🪨')
            time.sleep(0.2)
            temp_msg.add_reaction('📄')
            time.sleep(0.2)
            temp_msg.add_reaction('✂️')

@client.event
def on_reaction_add(reaction):
    if reaction.user_id == client.user.id:
        return

    if reaction.message_id not in active_games:
        return

    game = active_games[reaction.message_id]
    user_id = reaction.user_id
    
    # Vérifier si le joueur fait partie de la partie
    # En PvP, p2 est l'ID de l'adversaire. En PvE, p2 est 'bot' (donc user_id ne matchera jamais 'bot')
    if user_id != game['p1'] and user_id != game['p2']:
        return

    # Vérifier si c'est un move valide
    if reaction.emoji not in MOVES:
        return

    # Vérifier si le joueur a déjà joué
    if user_id in game['moves']:
        return

    # Enregistrer le coup
    game['moves'][user_id] = reaction.emoji
    
    # Retirer la réaction pour garder le mystère
    try:
        reaction.delete()
    except:
        pass

    # Logique PvE
    if game['mode'] == 'pve':
        # Le joueur a joué, le bot joue instantanément
        bot_move = random.choice(list(MOVES.keys()))
        user_move = game['moves'][user_id]
        
        winner = get_winner(user_move, bot_move)
        
        embed = velmu.Embed()
        embed.set_title("Resultat du duel")
        
        description = f"{game['p1_name']} : {user_move} {MOVES[user_move]}\n"
        description += f"Bot : {bot_move} {MOVES[bot_move]}\n\n"
        
        if winner == 'draw':
            embed.set_color(0x95A5A6)
            description += "Egalite !"
        elif winner == 'p1':
            embed.set_color(0x2ECC71)
            description += f"{game['p1_name']} a gagne !"
        else:
            embed.set_color(0xE74C3C)
            description += "Le Bot a gagne !"
            
        embed.set_description(description)
        
        msg = reaction.message()
        if msg:
            msg.reply(embed=embed)
            
        del active_games[reaction.message_id]

    # Logique PvP
    elif game['mode'] == 'pvp':
        # Vérifier si les deux ont joué
        if len(game['moves']) == 2:
            p1_move = game['moves'][game['p1']]
            p2_move = game['moves'][game['p2']]
            
            winner = get_winner(p1_move, p2_move)
            
            embed = velmu.Embed()
            embed.set_title("Resultat du duel PvP")
            
            # Pour p2_name, c'est <@ID>, on essaie de l'afficher proprement
            description = f"{game['p1_name']} : {p1_move} {MOVES[p1_move]}\n"
            description += f"Adversaire : {p2_move} {MOVES[p2_move]}\n\n"
            
            if winner == 'draw':
                embed.set_color(0x95A5A6)
                description += "Egalite parfaite !"
            elif winner == 'p1':
                embed.set_color(0xF1C40F)
                description += f"{game['p1_name']} remporte la victoire !"
            else:
                embed.set_color(0xF1C40F)
                description += f"L'adversaire remporte la victoire !"
                
            embed.set_description(description)
            
            msg = reaction.message()
            if msg:
                msg.reply(embed=embed)
                
            del active_games[reaction.message_id]
        else:
            # Un seul joueur a joué
            # On peut envoyer un message de confirmation discret si on veut, mais reaction.delete() suffit souvent
            pass

@client.event
def on_reply(message):
    if message.referenced_message and message.referenced_message.author.id == client.user.id:
        message.add_reaction('👀')

if __name__ == '__main__':
    client.run(BOT_TOKEN)
