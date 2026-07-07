import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Pin, LeaderboardEntry, StoryGroup, NotificationItem } from '../types';
import * as api from '../api';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTheme } from '../context/ThemeContext';
import { countUnread, markNotificationsRead } from '../utils/notifications';
import { groupPinsByProximity, type PinCluster } from '../utils/pinClusters';
import { createSinglePinIcon, createStackPinIcon } from './PinClusterIcons';
import HeatmapLayer from './HeatmapLayer';
import UserLocationLayer, { MapFlyTo } from './UserLocationLayer';
import GoogleMapLayer, { type GoogleMapType } from './GoogleMapLayer';
import StoriesBar from './StoriesBar';
import StoryViewer from './StoryViewer';
import AddPinModal from './AddPinModal';
import PinDetailSheet from './PinDetailSheet';
import ClusterPickerSheet from './ClusterPickerSheet';
import Leaderboard from './Leaderboard';
import MapToolbar from './MapToolbar';
import AppMenuSheet from './AppMenuSheet';
import NotificationsPanel from './NotificationsPanel';
import ProfileSheet from './ProfileSheet';
import { IconSun, IconMoon, IconBell } from './Icons';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 3;

export default function MapView() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { coords, error: geoError, loading: geoLoading, refresh: refreshLocation } = useGeolocation();
  const [pins, setPins] = useState<Pin[]>([]);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [activeStory, setActiveStory] = useState<{ group: StoryGroup; index: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [activeCluster, setActiveCluster] = useState<PinCluster | null>(null);
  const [addPinCoords, setAddPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState('density');
  const [heatmapPoints, setHeatmapPoints] = useState<[number, number, number][]>([]);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [mapType, setMapType] = useState<GoogleMapType>('roadmap');
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [flyToTargetKey, setFlyToTargetKey] = useState(0);

  const pinClusters = useMemo(() => groupPinsByProximity(pins), [pins]);

  const loadNotifications = useCallback(() => {
    api.getNotifications()
      .then((items) => {
        setNotifications(items);
        setUnreadCount(countUnread(items));
      })
      .catch(() => setNotifications([]));
  }, []);

  const loadPins = useCallback(() => {
    api.getPins().then(setPins);
  }, []);

  const loadStories = useCallback(() => {
    api.getStories().then(setStories).catch(() => setStories([]));
  }, []);

  const refreshAll = useCallback(() => {
    loadPins();
    loadStories();
    loadNotifications();
  }, [loadPins, loadStories, loadNotifications]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!heatmapOn) return;
    api.getHeatmap(heatmapMode).then((data) => setHeatmapPoints(data.points));
  }, [heatmapOn, heatmapMode, pins]);

  const handleClusterClick = (cluster: PinCluster) => {
    if (cluster.pins.length === 1) {
      setSelectedPin(cluster.pins[0].id);
    } else {
      setActiveCluster(cluster);
    }
  };

  const openLeaderboard = async () => {
    const data = await api.getLeaderboard();
    setLeaderboard(data);
    setShowLeaderboard(true);
  };

  const openStory = (group: StoryGroup, index = 0) => {
    setActiveStory({ group, index });
  };

  const openNextStoryUser = () => {
    if (!activeStory) return;
    const idx = stories.findIndex((s) => s.user_id === activeStory.group.user_id);
    if (idx >= 0 && idx < stories.length - 1) {
      setActiveStory({ group: stories[idx + 1], index: 0 });
    } else {
      setActiveStory(null);
    }
  };

  const pinAtMyLocation = () => {
    if (coords) setAddPinCoords({ lat: coords.lat, lng: coords.lng });
  };

  const recenter = () => {
    if (coords) setRecenterTrigger((t) => t + 1);
    else refreshLocation();
  };

  const goToPin = (pinId: string, lat: number, lng: number) => {
    setActiveStory(null);
    setShowNotifications(false);
    setShowMenu(false);
    setFlyToTarget({ lat, lng, zoom: 16 });
    setFlyToTargetKey((k) => k + 1);
    window.setTimeout(() => setSelectedPin(pinId), 600);
  };

  const openNotifications = () => {
    setShowNotifications(true);
    markNotificationsRead();
    setUnreadCount(0);
  };

  return (
    <div className="map-app">
      <header className="app-header">
        <span className="app-title">LaRachaClub</span>
        <div className="header-actions">
          <button
            type="button"
            className="icon-btn notif-btn"
            onClick={openNotifications}
            aria-label="Notificaciones"
          >
            <IconBell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          <div
            className="user-badge user-badge-btn"
            style={{ borderColor: user?.avatar_color }}
            onClick={() => setShowProfile(true)}
            onKeyDown={(e) => e.key === 'Enter' && setShowProfile(true)}
            role="button"
            tabIndex={0}
            title="Editar perfil"
          >
            <div className="avatar xs" style={{ background: user?.avatar_color }}>
              {user?.nickname[0]}
            </div>
            <span className="user-name">{user?.nickname}</span>
          </div>
        </div>
      </header>

      <StoriesBar
        stories={stories}
        currentUserId={user?.id}
        onOpen={openStory}
      />

      {geoLoading && !coords && (
        <div className="geo-status">Obteniendo ubicación…</div>
      )}
      {geoError && !coords && (
        <div className="geo-status geo-error">
          Ubicación denegada — <button type="button" onClick={refreshLocation}>reintentar</button>
        </div>
      )}

      <div className="map-container">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={2}
          maxZoom={21}
          className="leaflet-map"
          worldCopyJump
        >
          <GoogleMapLayer mapType={mapType} theme={theme} />
          <MapFlyTo
            coords={coords}
            flyToOnLoad
            recenterTrigger={recenterTrigger}
            flyToTarget={flyToTarget}
            flyToTargetKey={flyToTargetKey}
          />
          <MapClickHandler onMapClick={(lat, lng) => setAddPinCoords({ lat, lng })} />
          <UserLocationLayer coords={coords} />

          {!heatmapOn && pinClusters.map((cluster) => (
            <Marker
              key={cluster.id}
              position={[cluster.lat, cluster.lng]}
              icon={cluster.pins.length === 1
                ? createSinglePinIcon(cluster.pins[0])
                : createStackPinIcon(cluster)}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  handleClusterClick(cluster);
                },
              }}
              zIndexOffset={cluster.pins.length > 1 ? 500 : 0}
            />
          ))}

          <HeatmapLayer points={heatmapPoints} visible={heatmapOn} />
        </MapContainer>
      </div>

      <MapToolbar
        hasLocation={!!coords}
        geoLoading={geoLoading}
        heatmapOn={heatmapOn}
        onLocation={recenter}
        onAddPin={pinAtMyLocation}
        onHeatmapToggle={() => setHeatmapOn((v) => !v)}
        onOpenMenu={() => setShowMenu(true)}
      />

      {showMenu && (
        <AppMenuSheet
          onClose={() => setShowMenu(false)}
          onOpenLeaderboard={openLeaderboard}
          onOpenProfile={() => setShowProfile(true)}
          onLogout={logout}
          mapType={mapType}
          onMapTypeChange={setMapType}
          heatmapOn={heatmapOn}
          heatmapMode={heatmapMode}
          onHeatmapToggle={() => setHeatmapOn((v) => !v)}
          onHeatmapModeChange={setHeatmapMode}
        />
      )}

      {showProfile && (
        <ProfileSheet onClose={() => setShowProfile(false)} />
      )}

      {showNotifications && (
        <NotificationsPanel
          items={notifications}
          onClose={() => setShowNotifications(false)}
          onSelect={goToPin}
        />
      )}

      {addPinCoords && (
        <AddPinModal
          lat={addPinCoords.lat}
          lng={addPinCoords.lng}
          userLat={coords?.lat}
          userLng={coords?.lng}
          onClose={() => setAddPinCoords(null)}
          onCreated={refreshAll}
        />
      )}

      {activeCluster && (
        <ClusterPickerSheet
          cluster={activeCluster}
          onClose={() => setActiveCluster(null)}
          onSelect={(pinId) => {
            setActiveCluster(null);
            setSelectedPin(pinId);
          }}
        />
      )}

      {selectedPin && (
        <PinDetailSheet
          pinId={selectedPin}
          onClose={() => setSelectedPin(null)}
          onUpdate={refreshAll}
        />
      )}

      {showLeaderboard && (
        <Leaderboard entries={leaderboard} onClose={() => setShowLeaderboard(false)} />
      )}

      {activeStory && (
        <StoryViewer
          group={activeStory.group}
          startIndex={activeStory.index}
          onClose={() => setActiveStory(null)}
          onNextUser={openNextStoryUser}
          onGoToMap={goToPin}
        />
      )}
    </div>
  );
}
