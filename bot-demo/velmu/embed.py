"""
Embed builder for rich message embeds
"""

from datetime import datetime
from typing import Optional, List, Dict, Any


class EmbedField:
    """Represents a field in an embed"""
    def __init__(self, name: str, value: str, inline: bool = False):
        self.name = name
        self.value = value
        self.inline = inline
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "value": self.value,
            "inline": self.inline
        }


class Embed:
    """
    Builder class for creating rich embeds
    
    Example:
        embed = Embed()
        embed.set_title("Pokemon Info")
        embed.set_description("Pikachu - Electric Type")
        embed.set_color("#FFDD57")
        embed.add_field("HP", "35", inline=True)
        embed.add_field("Attack", "55", inline=True)
        embed.set_thumbnail("https://example.com/pikachu.png")
    """
    
    def __init__(self):
        self._title: Optional[str] = None
        self._description: Optional[str] = None
        self._url: Optional[str] = None
        self._color: Optional[str] = None
        self._thumbnail: Optional[str] = None
        self._image: Optional[str] = None
        self._author_name: Optional[str] = None
        self._author_url: Optional[str] = None
        self._author_icon: Optional[str] = None
        self._fields: List[EmbedField] = []
        self._footer_text: Optional[str] = None
        self._footer_icon: Optional[str] = None
        self._timestamp: Optional[str] = None
    
    def set_author(self, name: str, url: Optional[str] = None, icon_url: Optional[str] = None) -> 'Embed':
        """
        Set the author of the embed
        Args:
            name: Author name (max 256 chars)
            url: Optional URL for the author name
            icon_url: Optional icon URL
        """
        self._author_name = name[:256]
        if url:
            self._author_url = url
        if icon_url:
            self._author_icon = icon_url
        return self
    
    def set_title(self, title: str, url: Optional[str] = None) -> 'Embed':
        """Set the embed title (max 256 chars)"""
        self._title = title[:256]
        if url:
            self._url = url
        return self
    
    def set_description(self, description: str) -> 'Embed':
        """Set the embed description (max 4096 chars)"""
        self._description = description[:4096]
        return self
    
    def set_url(self, url: str) -> 'Embed':
        """Set the URL for the title"""
        self._url = url
        return self
    
    def set_color(self, color: Any) -> 'Embed':
        """
        Set the embed color
        Args:
            color: Hex color string (e.g., "#FF5733") or integer (e.g., 0xFF5733)
        """
        if isinstance(color, int):
            color = f"#{color:06X}"
            
        # Ensure format is #RRGGBB
        if not color.startswith('#'):
            color = '#' + color
        self._color = color.upper()
        return self
    
    def set_thumbnail(self, url: str) -> 'Embed':
        """Set the thumbnail image (small image on the right)"""
        self._thumbnail = url
        return self
    
    def set_image(self, url: str) -> 'Embed':
        """Set the main image (large image at the bottom)"""
        self._image = url
        return self
    
    def add_field(self, name: str, value: str, inline: bool = False) -> 'Embed':
        """
        Add a field to the embed (max 25 fields)
        Args:
            name: Field name (max 256 chars)
            value: Field value (max 1024 chars)
            inline: Whether the field should be displayed inline
        """
        if len(self._fields) < 25:
            field = EmbedField(name[:256], value[:1024], inline)
            self._fields.append(field)
        return self
    
    def set_footer(self, text: str, icon_url: Optional[str] = None) -> 'Embed':
        """
        Set the footer text and optional icon
        Args:
            text: Footer text (max 2048 chars)
            icon_url: Optional footer icon URL
        """
        self._footer_text = text[:2048]
        if icon_url:
            self._footer_icon = icon_url
        return self
    
    def set_timestamp(self, timestamp: Optional[datetime] = None) -> 'Embed':
        """
        Set the timestamp (defaults to now)
        Args:
            timestamp: datetime object, defaults to current time
        """
        if timestamp is None:
            timestamp = datetime.utcnow()
        self._timestamp = timestamp.isoformat() + 'Z'
        return self
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the embed to a dictionary for JSON serialization"""
        data: Dict[str, Any] = {}
        
        if self._author_name:
            data['author'] = {'name': self._author_name}
            if self._author_url:
                data['author']['url'] = self._author_url
            if self._author_icon:
                data['author']['iconUrl'] = self._author_icon
        
        if self._title:
            data['title'] = self._title
        if self._description:
            data['description'] = self._description
        if self._url:
            data['url'] = self._url
        if self._color:
            data['color'] = self._color
        if self._thumbnail:
            data['thumbnail'] = self._thumbnail
        if self._image:
            data['image'] = self._image
        if self._fields:
            data['fields'] = [field.to_dict() for field in self._fields]
        if self._footer_text:
            data['footer'] = {'text': self._footer_text}
            if self._footer_icon:
                data['footer']['iconUrl'] = self._footer_icon
        if self._timestamp:
            data['timestamp'] = self._timestamp
        
        return data
    
    def __repr__(self) -> str:
        return f"<Embed title={self._title!r} fields={len(self._fields)}>"
