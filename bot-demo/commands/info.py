import velmu
from datetime import datetime

def format_date(iso_date):
    """Formate une date ISO en format lisible"""
    try:
        dt = datetime.fromisoformat(iso_date.replace('Z', '+00:00'))
        return dt.strftime("%d/%m/%Y à %H:%M")
    except:
        return "Date inconnue"

def setup(manager):

    @manager.command(name="serverinfo", description="Infos détaillées du serveur", category="📊 Informations")
    def serverinfo_command(message, args):
        if not message.server_id:
            return message.reply("❌ Cette commande fonctionne uniquement sur un serveur.")
        
        server = manager.client.http.get_server(message.server_id)
        if server:
            members = manager.client.http.get_server_members(message.server_id)
            member_count = len(members) if members else "?"
            
            # Compter les bots
            bot_count = 0
            if members:
                for member in members:
                    if member.get('user', {}).get('isBot', False):
                        bot_count += 1
            
            created_date = format_date(server.get('createdAt'))
            
            embed = velmu.Embed()
            embed.set_title(f"📊 {server.get('name')}")
            embed.set_color(0x3498DB)
            if server.get('iconUrl'):
                embed.set_thumbnail(server.get('iconUrl'))
            
            embed.add_field("ID", server.get('id'), inline=True)
            embed.add_field("Propriétaire", f"<@{server.get('ownerId')}>", inline=True)
            embed.add_field("Membres", f"{member_count} ({bot_count} bots)", inline=True)
            embed.add_field("Créé le", created_date, inline=False)
            
            manager.client.http.send_message(message.channel_id, embed=embed)
        else:
            message.reply("❌ Impossible de récupérer les informations du serveur.")

    @manager.command(name="userinfo", description="Tes informations", category="📊 Informations")
    def userinfo_command(message, args):
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
        
        manager.client.http.send_message(message.channel_id, embed=embed)

    @manager.command(name="members", description="Liste des membres", category="📊 Informations")
    def members_command(message, args):
        if not message.server_id:
            return message.reply("❌ Cette commande fonctionne uniquement sur un serveur.")
        
        members = manager.client.http.get_server_members(message.server_id)
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
            
            embed = velmu.Embed()
            embed.set_title(f"👥 Membres du serveur ({displayed}/{total})")
            embed.set_description("\n".join(member_list))
            if total > 20:
                embed.set_footer(f"Et {total - 20} autres membres...")
            embed.set_color(0x2ECC71)
            
            manager.client.http.send_message(message.channel_id, embed=embed)
        else:
            message.reply("❌ Impossible de récupérer la liste des membres.")

    @manager.command(name="channelinfo", description="Infos du salon", category="📊 Informations")
    def channelinfo_command(message, args):
        embed = velmu.Embed()
        embed.set_title("💬 Informations du Salon")
        embed.set_color(0x95A5A6)
        
        embed.add_field("ID", message.channel_id, inline=False)
        embed.add_field("Serveur ID", message.server_id or "Conversation Privée", inline=False)
        
        manager.client.http.send_message(message.channel_id, embed=embed)

    @manager.command(name="avatar", description="Affiche ton avatar", category="📊 Informations")
    def avatar_command(message, args):
        target_user = message.author
        if target_user.avatar_url:
            embed = velmu.Embed()
            embed.set_title(f"🖼️ Avatar de {target_user.username}")
            embed.set_image(target_user.avatar_url)
            embed.set_color(0x95A5A6)
            manager.client.http.send_message(message.channel_id, embed=embed)
        else:
            message.reply(f"ℹ️ {target_user.username} utilise l'avatar par défaut.")
