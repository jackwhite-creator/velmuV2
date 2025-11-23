export const formatDiscordDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isSameDay(date, now)) {
    return `Aujourd'hui à ${timeStr}`;
  }

  if (isSameDay(date, yesterday)) {
    return `Hier à ${timeStr}`;
  }

  // Format JJ/MM/AAAA HH:MM
  return `${date.toLocaleDateString()} ${timeStr}`;
};