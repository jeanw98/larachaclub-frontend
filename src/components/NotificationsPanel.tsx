import type { NotificationItem } from '../types';
import { REACTIONS } from '../types';
import { formatTimeAgo } from '../utils/notifications';
import { IconBell, IconClose } from './Icons';

interface Props {
  items: NotificationItem[];
  onClose: () => void;
  onSelect: (pinId: string, lat: number, lng: number) => void;
}

function notificationText(item: NotificationItem): string {
  if (item.type === 'comment') {
    const stars = item.rating ? ` · ${item.rating}★` : '';
    const preview = item.body ? `: "${item.body.slice(0, 60)}${item.body.length > 60 ? '…' : ''}"` : '';
    return `comentó tu ${item.pin.media_type === 'video' ? 'video' : 'foto'}${stars}${preview}`;
  }
  const reaction = REACTIONS.find((r) => r.type === item.reaction_type);
  const label = reaction ? `${reaction.emoji} ${reaction.label}` : 'algo';
  return `reaccionó ${label} a tu ${item.pin.media_type === 'video' ? 'video' : 'foto'}`;
}

export default function NotificationsPanel({ items, onClose, onSelect }: Props) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet notifications-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header-row">
          <div className="sheet-title-group">
            <IconBell size={22} />
            <div>
              <h2>Notificaciones</h2>
              <p className="sheet-subtitle">Comentarios y reacciones</p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <IconClose size={18} />
          </button>
        </div>

        <div className="notifications-list">
          {items.length === 0 && (
            <p className="empty-text">Sin notificaciones por ahora</p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="notification-row"
              onClick={() => onSelect(item.pin.id, item.pin.lat, item.pin.lng)}
            >
              <div className="avatar sm" style={{ background: item.actor.avatar_color }}>
                {item.actor.nickname[0]}
              </div>
              <div className="notification-body">
                <p className="notification-text">
                  <strong>{item.actor.nickname}</strong> {notificationText(item)}
                </p>
                {item.pin.place_name && (
                  <span className="notification-place">{item.pin.place_name}</span>
                )}
                <span className="notification-time">{formatTimeAgo(item.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
