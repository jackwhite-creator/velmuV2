import time
import velmu

def setup(manager):
    
    @manager.command(name="help", description="Affiche la liste des commandes", category="✨ Générales")
    def help_command(message, args):
        embed = manager.generate_help_embed()
        manager.client.http.send_message(message.channel_id, embed=embed)

    @manager.command(name="ping", description="Teste la latence du bot", category="✨ Générales")
    def ping_command(message, args):
        start = time.time()
        # On simule un petit délai pour le calcul
        end = time.time()
        latency = int((end - start) * 1000)
        message.reply(f"🏓 **Pong !** Latence : *{latency}ms*")

    @manager.command(name="uptime", description="Affiche le temps de fonctionnement", category="✨ Générales")
    def uptime_command(message, args):
        uptime_seconds = int(time.time() - getattr(manager.client, 'start_time', time.time()))
        hours = uptime_seconds // 3600
        minutes = (uptime_seconds % 3600) // 60
        seconds = uptime_seconds % 60
        message.reply(f"⏰ En ligne depuis : **{hours}h {minutes}m {seconds}s**")

    @manager.command(name="botinfo", description="Informations sur le bot", category="✨ Générales")
    def botinfo_command(message, args):
        bot_user = manager.client.user
        
        # Helper pour formater la date
        def format_date(iso_date):
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(iso_date.replace('Z', '+00:00'))
                return dt.strftime("%d/%m/%Y à %H:%M")
            except:
                return "Date inconnue"

        created_at = bot_user.created_at if hasattr(bot_user, 'created_at') else None
        
        embed = velmu.Embed()
        embed.set_title("🤖 Informations du Bot")
        embed.set_color(0x3498DB)
        embed.set_thumbnail(bot_user.avatar_url or "https://cdn.discordapp.com/embed/avatars/0.png")
        
        embed.add_field("Nom", bot_user.username, inline=True)
        embed.add_field("ID", bot_user.id, inline=True)
        embed.add_field("Préfixe", manager.prefix, inline=True)
        embed.add_field("Version", "2.1 Modular", inline=True)
        embed.add_field("Créé le", format_date(created_at) if created_at else 'Inconnue', inline=False)
        
        manager.client.http.send_message(message.channel_id, embed=embed)
