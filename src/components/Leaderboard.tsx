import type { LeaderboardEntry } from '../types';
import { useAuth } from '../context/AuthContext';

interface Props {
  entries: LeaderboardEntry[];
  onClose: () => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ entries, onClose }: Props) {
  const { user } = useAuth();

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet leaderboard-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>🏆 Ranking</h2>
        <p className="sheet-subtitle">Los mejores pinners y reacciones</p>

        <div className="leaderboard-list">
          {entries.length === 0 && (
            <p className="empty-text">Aún no hay jugadores — ¡sé el primero!</p>
          )}
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`leaderboard-row ${entry.id === user?.id ? 'is-me' : ''}`}
            >
              <span className="rank">{i < 3 ? MEDALS[i] : `#${i + 1}`}</span>
              <div
                className="avatar"
                style={{ background: entry.avatar_color }}
              >
                {entry.nickname[0]}
              </div>
              <div className="leaderboard-info">
                <span className="name">{entry.nickname}</span>
                <span className="stats">
                  {entry.pin_count} pins · {entry.funny_reactions} 😂
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
