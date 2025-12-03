import velmu
import requests
import random

def setup(manager):

    @manager.command(name="joke", description="Blague aléatoire", category="🎨 Fun")
    def joke_command(message, args):
        try:
            response = requests.get("https://v2.jokeapi.dev/joke/Any?lang=fr&type=single", timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                joke_text = ""
                if 'joke' in data:
                    joke_text = data['joke']
                else:
                    # Fallback
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
                manager.client.http.send_message(message.channel_id, embed=embed)
            else:
                message.reply("❌ Impossible de récupérer une blague.")
        except:
            # Fallback local en cas d'erreur
            jokes = [
                "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tombent dans le bateau ! 🤿",
                "Qu'est-ce qu'un crocodile qui surveille une station ? Un Lacoste ! 🐊"
            ]
            embed = velmu.Embed()
            embed.set_title("😄 Blague")
            embed.set_description(random.choice(jokes))
            embed.set_color(0xF1C40F)
            manager.client.http.send_message(message.channel_id, embed=embed)

    @manager.command(name="catfact", description="Fait sur les chats", category="🎨 Fun")
    def catfact_command(message, args):
        try:
            response = requests.get("https://catfact.ninja/fact", timeout=5)
            if response.status_code == 200:
                data = response.json()
                embed = velmu.Embed()
                embed.set_title("🐱 Fait sur les chats")
                embed.set_description(data['fact'])
                embed.set_color(0xE67E22)
                manager.client.http.send_message(message.channel_id, embed=embed)
            else:
                message.reply("❌ Erreur API.")
        except Exception as e:
            message.reply(f"❌ Erreur : {str(e)}")

    @manager.command(name="dogfact", description="Fait sur les chiens", category="🎨 Fun")
    def dogfact_command(message, args):
        try:
            response = requests.get("https://dog-api.kinduff.com/api/facts", timeout=5)
            if response.status_code == 200:
                data = response.json()
                embed = velmu.Embed()
                embed.set_title("🐶 Fait sur les chiens")
                embed.set_description(data['facts'][0])
                embed.set_color(0x8D6E63)
                manager.client.http.send_message(message.channel_id, embed=embed)
            else:
                message.reply("❌ Erreur API.")
        except Exception as e:
            message.reply(f"❌ Erreur : {str(e)}")

    @manager.command(name="advice", description="Conseil du jour", category="🎨 Fun")
    def advice_command(message, args):
        try:
            response = requests.get("https://api.adviceslip.com/advice", timeout=5)
            if response.status_code == 200:
                data = response.json()
                embed = velmu.Embed()
                embed.set_title("💡 Conseil du jour")
                embed.set_description(data['slip']['advice'])
                embed.set_color(0x9B59B6)
                manager.client.http.send_message(message.channel_id, embed=embed)
            else:
                message.reply("❌ Erreur API.")
        except Exception as e:
            message.reply(f"❌ Erreur : {str(e)}")

    @manager.command(name="slap", description="Gifle quelqu'un", category="🎨 Fun")
    def slap_command(message, args):
        target = args[0] if args else "quelqu'un"
        message.channel.send(f"👋 **{message.author.username}** gifle {target} ! *PAF !*")

    @manager.command(name="hug", description="Câlin virtuel", category="🎨 Fun")
    def hug_command(message, args):
        target = args[0] if args else "quelqu'un"
        message.channel.send(f"🤗 **{message.author.username}** fait un câlin à {target} ! *Aww...*")

    @manager.command(name="roll", description="Lance un dé", category="🎨 Fun")
    def roll_command(message, args):
        max_num = int(args[0]) if args and args[0].isdigit() else 100
        result = random.randint(1, max_num)
        message.reply(f"🎲 **Résultat du dé :** {result} *(sur {max_num})*")

    @manager.command(name="flip", description="Pile ou Face", category="🎨 Fun")
    def flip_command(message, args):
        result = random.choice(["Pile ⚪", "Face ⚫"])
        message.reply(f"🪙 **Résultat :** {result}")

    @manager.command(name="8ball", description="Boule magique", category="🎨 Fun")
    def eightball_command(message, args):
        if not args:
            return message.reply("❓ Pose-moi une question !")
        
        responses = [
            "✅ Oui, absolument !", "✅ C'est certain.", "✅ Sans aucun doute.",
            "🤔 Probablement.", "🤔 Les signes pointent vers oui.",
            "⚠️ Réponse incertaine, réessaye.", "⚠️ Demande plus tard.",
            "❌ Non.", "❌ Très douteux.", "❌ N'y compte pas."
        ]
        message.reply(f"🔮 **{random.choice(responses)}**")
