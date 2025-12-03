import velmu
import requests

def setup(manager):

    @manager.command(name="country", description="Infos sur un pays", category="🌐 API & Infos")
    def country_command(message, args):
        if not args:
            return message.reply(f">❌ Usage : {manager.prefix}country <nom du pays>")
        
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
                
                manager.client.http.send_message(message.channel_id, embed=embed)
            else:
                message.reply(f"❌ Pays **{country_name}** introuvable.")
        except Exception as e:
            message.reply(f"❌ Erreur lors de la recherche : {str(e)}")

    @manager.command(name="pokemon", description="Infos Pokémon", category="🌐 API & Infos")
    def pokemon_command(message, args):
        if not args:
            return message.reply(f">❌ Usage : {manager.prefix}pokemon <nom>")
        
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

                manager.client.http.send_message(message.channel_id, embed=embed)
            else:
                message.reply(f"❌ Pokémon **{pokemon_name}** introuvable.")
        except Exception as e:
            message.reply(f"❌ Erreur : {str(e)}")

    @manager.command(name="crypto", description="Prix crypto", category="🌐 API & Infos")
    def crypto_command(message, args):
        if not args:
            return message.reply(f">❌ Usage : {manager.prefix}crypto <bitcoin/ethereum/etc>")
        
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
                    
                    manager.client.http.send_message(message.channel_id, embed=embed)
                else:
                    message.reply(f"❌ Crypto **{crypto}** introuvable.")
            else:
                message.reply("❌ Erreur lors de la récupération des données.")
        except Exception as e:
            message.reply(f"❌ Erreur : {str(e)}")

    @manager.command(name="space", description="Photo NASA du jour", category="🌐 API & Infos")
    def space_command(message, args):
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
                
                manager.client.http.send_message(message.channel_id, embed=embed)
            else:
                message.reply("❌ Impossible de récupérer l'image du jour.")
        except Exception as e:
            message.reply(f"❌ Erreur : {str(e)}")
