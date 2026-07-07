const READ_AT_KEY = 'larachaclub_notifications_read_at';

export function getNotificationsReadAt(): string {
  return localStorage.getItem(READ_AT_KEY) || '';
}

export function markNotificationsRead() {
  localStorage.setItem(READ_AT_KEY, new Date().toISOString());
}

export function countUnread(notifications: { created_at: string }[]): number {
  const readAt = getNotificationsReadAt();
  if (!readAt) return notifications.length;
  const readTime = new Date(readAt).getTime();
  return notifications.filter((n) => new Date(n.created_at).getTime() > readTime).length;
}

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}
