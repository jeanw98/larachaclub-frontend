import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function WelcomeScreen() {
  const { register, login } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        if (!firstName.trim() || !lastName.trim()) {
          setError('Nombre y apellido son obligatorios');
          return;
        }
        await register({
          nickname: nickname.trim() || undefined,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password,
        });
      } else {
        if (!nickname.trim()) {
          setError('El apodo es obligatorio');
          return;
        }
        await login(nickname.trim(), password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome">
      <div className="welcome-bg" />
      <div className="welcome-content">
        <h1>LaRachaClub</h1>
        <p className="welcome-tagline">
          Fija fotos y videos en el mapa mundial.<br />
          Califica, reacciona y sube en el ranking.
        </p>

        <div className="auth-tabs">
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Unirse
          </button>
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Entrar
          </button>
        </div>

        <div className="welcome-form">
          {mode === 'register' && (
            <>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={64}
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={64}
                />
              </div>
              <input
                type="text"
                placeholder="Apodo (opcional — aleatorio si vacío)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={32}
              />
            </>
          )}
          {mode === 'login' && (
            <input
              type="text"
              placeholder="Apodo"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={32}
            />
          )}
          <input
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
          {error && <p className="error-text">{error}</p>}
          <button
            className="btn btn-primary"
            disabled={loading || password.length < 6}
            onClick={handleSubmit}
          >
            {loading ? '...' : mode === 'register' ? 'Crear cuenta 🎲' : 'Entrar 🔑'}
          </button>
        </div>

        <div className="welcome-features">
          <div className="feature-chip">🗺️ Mapa mundial</div>
          <div className="feature-chip">😂 Reacciones</div>
          <div className="feature-chip">🏆 Ranking</div>
          <div className="feature-chip">🔥 Mapa de calor</div>
        </div>
      </div>
    </div>
  );
}
