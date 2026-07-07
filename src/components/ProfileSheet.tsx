import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconClose } from './Icons';

interface Props {
  onClose: () => void;
}

export default function ProfileSheet({ onClose }: Props) {
  const { user, updateNickname } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const unchanged = nickname.trim() === user.nickname;

  const handleSave = async () => {
    const next = nickname.trim();
    if (next.length < 2) {
      setError('Mínimo 2 caracteres');
      return;
    }
    if (next.length > 32) {
      setError('Máximo 32 caracteres');
      return;
    }
    if (unchanged) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');
    setSaved(false);
    try {
      await updateNickname(next);
      setSaved(true);
      window.setTimeout(onClose, 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet profile-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header-row">
          <div className="sheet-title-group">
            <div className="avatar" style={{ background: user.avatar_color }}>
              {user.nickname[0]}
            </div>
            <div>
              <h2>Perfil</h2>
              <p className="sheet-subtitle">{user.first_name} {user.last_name}</p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <IconClose size={18} />
          </button>
        </div>

        <label className="field-label" htmlFor="nickname-input">Apodo</label>
        <input
          id="nickname-input"
          className="profile-input"
          type="text"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setError('');
            setSaved(false);
          }}
          maxLength={32}
          autoComplete="username"
          placeholder="Tu apodo"
        />
        <p className="field-hint">Entre 2 y 32 caracteres. Debe ser único.</p>

        {error && <p className="field-error">{error}</p>}
        {saved && <p className="field-success">Apodo actualizado</p>}

        <button
          type="button"
          className="btn-primary profile-save"
          onClick={handleSave}
          disabled={loading || (!nickname.trim() && unchanged)}
        >
          {loading ? 'Guardando…' : unchanged ? 'Cerrar' : 'Guardar apodo'}
        </button>
      </div>
    </div>
  );
}
