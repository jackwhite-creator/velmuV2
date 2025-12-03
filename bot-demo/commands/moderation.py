import time

def setup(manager):
    
    @manager.command(name="purge", description="Supprime un nombre de messages", category="🛡️ Modération")
    def purge_command(message, args):
        if not message.server_id:
            return message.reply("❌ Cette commande fonctionne uniquement sur un serveur.")
        
        try:
            amount = int(args[0]) if args else 10
            if amount > 50:
                amount = 50
                message.reply("⚠️ Limite de 50 messages maximum. Suppression de 50 messages...")
            
            print(f"🧹 Purge : {amount} messages dans {message.channel_id}")
            messages = manager.client.http.get_channel_messages(message.channel_id, limit=amount + 1)
            
            if not messages or not isinstance(messages, list):
                return message.reply("❌ Impossible de récupérer les messages.")

            count = 0
            for msg_data in messages:
                try:
                    manager.client.http.delete_message(msg_data['id'])
                    count += 1
                    time.sleep(0.1)
                except Exception as e:
                    print(f"❌ Erreur suppression {msg_data['id']}: {e}")
            
            confirmation = manager.client.http.send_message(message.channel_id, f"🧹 **{count}** messages supprimés avec succès.")
            
            if confirmation:
                time.sleep(3)
                try:
                    manager.client.http.delete_message(confirmation.get('id'))
                except:
                    pass
            
        except ValueError:
            message.reply(f">❌ Usage : {manager.prefix}purge <nombre>")
        except Exception as e:
            message.reply(f"❌ Erreur lors de la suppression : {str(e)}")

    @manager.command(name="warn", description="Avertit un membre", category="🛡️ Modération")
    def warn_command(message, args):
        if not args:
            return message.reply(f">❌ Usage : {manager.prefix}warn <raison>")
        
        reason = " ".join(args)
        message.reply(f"⚠️ **Avertissement enregistré**\nRaison : *{reason}*")
