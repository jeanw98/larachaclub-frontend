import { useState, useEffect } from 'react';
import type { LeaderboardEntry, StreakLeaderboardEntry, StreakActivityType } from '../types';
import { useAuth } from '../context/AuthContext';
import { IconTrophy, IconClose } from './Icons';
import * as api from '../api';

type Tab = 'pins' | StreakActivityType;

interface Props {
  onClose: () => void;
}

const TABS: { id: Tab; label: string; subtitle: string }[] = [
  { id: 'pins', label: 'Pins', subtitle: 'Pins y reacciones' },
  { id: 'coito', label: 'Coito', subtitle: 'Racha de coito' },
  { id: 'entreno', label: 'Entreno', subtitle: 'Racha de entreno' },
];

export default function Leaderboard({ onClose }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('pins');
  const [pinEntries, setPinEntries] = useState<LeaderboardEntry[]>([]);
  const [streakEntries, setStreakEntries] = useState<StreakLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const activeTab = TABS.find((t) => t.id === tab)!;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (tab === 'pins') {
          const data = await api.getLeaderboard();
          if (!cancelled) setPinEntries(data);
        } else {
          const data = await api.getStreakLeaderboard(tab);
          if (!cancelled) setStreakEntries(data);
        }
      } catch {
        if (!cancelled) {
          if (tab === 'pins') setPinEntries([]);
          else setStreakEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tab]);

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet leaderboard-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header-row">
          <div className="sheet-title-group">
            <IconTrophy size={22} />
            <div>
              <h2>Ranking</h2>
              <p className="sheet-subtitle">{activeTab.subtitle}</p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <IconClose size={18} />
          </button>
        </div>

        <div className="chip-row leaderboard-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="leaderboard-list">
          {loading && <p className="empty-text">Cargando…</p>}

          {!loading && tab === 'pins' && pinEntries.length === 0 && (
            <p className="empty-text">Aún no hay jugadores — ¡sé el primero!</p>
          )}

          {!loading && tab !== 'pins' && streakEntries.length === 0 && (
            <p className="empty-text">Nadie ha registrado todavía — ¡sé el primero!</p>
          )}

          {!loading && tab === 'pins' && pinEntries.map((entry, i) => (
            <div
              key={entry.id}
              className={`leaderboard-row ${entry.id === user?.id ? 'is-me' : ''}`}
            >
              <span className={`rank ${i < 3 ? `top-${i + 1}` : ''}`}>{i + 1}</span>
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

          {!loading && tab !== 'pins' && streakEntries.map((entry, i) => (
            <div
              key={entry.id}
              className={`leaderboard-row streak-row ${entry.id === user?.id ? 'is-me' : ''} ${entry.on_streak ? 'on-streak' : ''}`}
            >
              <span className={`rank ${i < 3 ? `top-${i + 1}` : ''}`}>{i + 1}</span>
              <div className="avatar sm" style={{ background: entry.avatar_color }}>
                {entry.nickname[0]}
              </div>
              <div className="leaderboard-info">
                <span className="name">{entry.nickname}</span>
                <span className="streak-tier-badge">{entry.tier}</span>
                <span className="stats">
                  {entry.on_streak ? (
                    <strong className="streak-live">{entry.current_streak} días en racha 🔥</strong>
                  ) : (
                    <span className="streak-broken">Sin racha activa</span>
                  )}
                  {entry.longest_streak > 0 && (
                    <> · mejor: {entry.longest_streak} · {entry.total_days} días totales</>
                  )}
                </span>
              </div>
              <div className="streak-score" title="Racha actual">
                <span className="streak-score-num">{entry.current_streak}</span>
                <span className="streak-score-label">
                  {entry.on_streak ? 'días 🔥' : 'días'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
