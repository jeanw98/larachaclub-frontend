import type { LeaderboardEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { IconTrophy, IconClose } from './Icons';

interface Props {
  entries: LeaderboardEntry[];
  onClose: () => void;
}

export default function Leaderboard({ entries, onClose }: Props) {
  const { user } = useAuth();

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet leaderboard-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header-row">
          <div className="sheet-title-group">
            <IconTrophy size={22} />
            <div>
              <h2>Ranking</h2>
              <p className="sheet-subtitle">Pins y reacciones</p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <IconClose size={18} />
          </button>
        </div>

        <div className="leaderboard-list">
          {entries.length === 0 && (
            <p className="empty-text">Aún no hay jugadores — ¡sé el primero!</p>
          )}
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`leaderboard-row ${entry.id === user?.id ? 'is-me' : ''}`}
            >
              <span className={`rank ${i < 3 ? `top-${i + 1}` : ''}`}>
                {i + 1}
              </span>
              <div className="avatar sm" style={{ background: entry.avatar_color }}>
                {entry.nickname[0]}
              </div>
              <div className="leaderboard-info">
                <span className="name">{entry.nickname}</span>
                <span className="stats">
                  {entry.pin_count} pins · {entry.funny_reactions} reacciones
                </span>
              </div>
              <span className="score">{entry.total_score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
