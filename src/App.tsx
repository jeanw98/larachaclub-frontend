import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import WelcomeScreen from './components/WelcomeScreen';
import MapView from './components/MapView';
import './index.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando LaRachaClub...</p>
      </div>
    );
  }

  return user ? <MapView /> : <WelcomeScreen />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
