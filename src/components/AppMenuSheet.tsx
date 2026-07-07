import type { GoogleMapType } from './GoogleMapLayer';
import { useTheme } from '../context/ThemeContext';
import {
  IconTrophy, IconHeatmap, IconSun, IconMoon, IconLogout,
} from './Icons';

const HEATMAP_MODES = [
  { id: 'density', label: 'Densidad' },
  { id: 'funny', label: 'Gracioso' },
  { id: 'love', label: 'Amor' },
  { id: 'scare', label: 'Miedo' },
  { id: 'awful', label: 'Horrible' },
  { id: 'wow', label: 'Wow' },
];

const MAP_TYPES: { id: GoogleMapType; label: string }[] = [
  { id: 'roadmap', label: 'Mapa' },
  { id: 'satellite', label: 'Satélite' },
  { id: 'hybrid', label: 'Híbrido' },
];

interface Props {
  onClose: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  mapType: GoogleMapType;
  onMapTypeChange: (type: GoogleMapType) => void;
  heatmapOn: boolean;
  heatmapMode: string;
  onHeatmapToggle: () => void;
  onHeatmapModeChange: (mode: string) => void;
}

export default function AppMenuSheet({
  onClose,
  onOpenLeaderboard,
  onOpenProfile,
  onLogout,
  mapType,
  onMapTypeChange,
  heatmapOn,
  heatmapMode,
  onHeatmapToggle,
  onHeatmapModeChange,
}: Props) {
  const { theme, toggleTheme } = useTheme();

  const handleLeaderboard = () => {
    onClose();
    onOpenLeaderboard();
  };

  const handleProfile = () => {
    onClose();
    onOpenProfile();
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header-row">
          <h2>Menú</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="menu-section">
          <p className="menu-label">Mapa</p>
          <div className="chip-row">
            {MAP_TYPES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chip ${mapType === m.id ? 'active' : ''}`}
                onClick={() => onMapTypeChange(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="menu-section">
          <div className="menu-row">
            <div className="menu-row-text">
              <IconHeatmap size={18} />
              <span>Mapa de calor</span>
            </div>
            <button
              type="button"
              className={`toggle ${heatmapOn ? 'on' : ''}`}
              onClick={onHeatmapToggle}
              aria-pressed={heatmapOn}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
          {heatmapOn && (
            <div className="chip-row">
              {HEATMAP_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`chip ${heatmapMode === m.id ? 'active' : ''}`}
                  onClick={() => onHeatmapModeChange(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="menu-list">
          <button type="button" className="menu-item" onClick={handleProfile}>
            <span className="menu-avatar" style={{ background: 'var(--primary)' }}>@</span>
            <span>Cambiar apodo</span>
          </button>
          <button type="button" className="menu-item" onClick={handleLeaderboard}>
            <IconTrophy size={18} />
            <span>Ranking</span>
          </button>
          <button type="button" className="menu-item" onClick={toggleTheme}>
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <button type="button" className="menu-item danger" onClick={handleLogout}>
            <IconLogout size={18} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
