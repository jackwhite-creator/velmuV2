import inspect
from typing import Callable, List, Optional, Dict, Any
from .embed import Embed

class Command:
    """Represents a bot command"""
    def __init__(self, name: str, description: str, category: str, callback: Callable):
        self.name = name
        self.description = description
        self.category = category
        self.callback = callback

class CommandManager:
    """Manages command registration and execution"""
    def __init__(self, client, prefix: str):
        self.client = client
        self.prefix = prefix
        self.commands: Dict[str, Command] = {}
        self.categories: Dict[str, List[Command]] = {}

    def command(self, name: str = None, description: str = "Pas de description", category: str = "Général"):
        """Decorator to register a command"""
        def decorator(func):
            cmd_name = name or func.__name__
            cmd = Command(cmd_name, description, category, func)
            self.register_command(cmd)
            return func
        return decorator

    def register_command(self, command: Command):
        """Register a command manually"""
        self.commands[command.name] = command
        if command.category not in self.categories:
            self.categories[command.category] = []
        self.categories[command.category].append(command)
        print(f"✅ Commande chargée : {command.name}")

    async def handle_message(self, message):
        """Handle incoming messages and execute commands"""
        if message.author.id == self.client.user.id:
            return

        if not message.content.startswith(self.prefix):
            return

        content = message.content[len(self.prefix):]
        parts = content.split(' ')
        cmd_name = parts[0].lower()
        args = parts[1:]

        if cmd_name in self.commands:
            command = self.commands[cmd_name]
            try:
                # Check if callback is async or sync
                if inspect.iscoroutinefunction(command.callback):
                    await command.callback(message, args)
                else:
                    command.callback(message, args)
            except Exception as e:
                print(f"❌ Erreur commande {cmd_name}: {e}")
                message.reply(f"❌ Une erreur est survenue : {str(e)}")
        else:
            # Unknown command
            pass

    def generate_help_embed(self) -> Embed:
        """Generate a dynamic help embed based on registered commands"""
        embed = Embed()
        embed.set_title("📚 Commandes disponibles")
        embed.set_description(f"Préfixe : `{self.prefix}`")
        embed.set_color(0x3498DB)
        
        # Sort categories alphabetically
        sorted_categories = sorted(self.categories.keys())
        
        for category in sorted_categories:
            cmds = self.categories[category]
            cmd_list = [f"`{self.prefix}{cmd.name}` - {cmd.description}" for cmd in cmds]
            embed.add_field(f"**{category}**", "\n".join(cmd_list), inline=False)
            
        embed.set_footer("Généré automatiquement par le CommandManager")
        embed.set_timestamp()
        
        return embed
