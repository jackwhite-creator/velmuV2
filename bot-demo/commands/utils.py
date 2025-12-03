import time

def setup(manager):

    @manager.command(name="say", description="Fait parler le bot", category="🎮 Utilitaires")
    def say_command(message, args):
        if not args:
            return message.reply("❓ Je dois dire quoi ?")
        
        text = " ".join(args)
        message.channel.send(text)
        try:
            manager.client.http.delete_message(message.id)
        except:
            pass

    @manager.command(name="calc", description="Calculatrice", category="🎮 Utilitaires")
    def calc_command(message, args):
        if not args:
            return message.reply(f">❌ Usage : {manager.prefix}calc <expression>")
        
        try:
            expression = " ".join(args)
            # Sécurité basique
            allowed_chars = r"0123456789+-*/.()\s"
            if all(c in allowed_chars for c in expression):
                result = eval(expression)
                message.reply(f"🧮 **Résultat :** {result}")
            else:
                message.reply("❌ Expression invalide. Utilise seulement des chiffres et +, -, *, /, ( )")
        except:
            message.reply("❌ Impossible de calculer cette expression.")

    @manager.command(name="stats", description="Statistiques du bot", category="🎮 Utilitaires")
    def stats_command(message, args):
        uptime_seconds = int(time.time() - getattr(manager.client, 'start_time', time.time()))
        hours = uptime_seconds // 3600
        minutes = (uptime_seconds % 3600) // 60
        
        stats = f"""📈 **Statistiques du Bot**

>**Préfixe :** {manager.prefix}
**Commandes :** {len(manager.commands)}
**Uptime :** {hours}h {minutes}m
**Version :** *2.1 Modular*"""
        message.reply(stats)
