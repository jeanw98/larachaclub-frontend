import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Pin, LeaderboardEntry, StoryGroup } from '../types';
import * as api from '../api';
import { useGeolocation } from '../hooks/useGeolocation';
import { groupPinsByProximity, type PinCluster } from '../utils/pinClusters';
import { createSinglePinIcon, createStackPinIcon } from './PinClusterIcons';
import HeatmapLayer from './HeatmapLayer';
import UserLocationLayer, { MapFlyTo } from './UserLocationLayer';
import StoriesBar from './StoriesBar';
import StoryViewer from './StoryViewer';
import AddPinModal from './AddPinModal';
import PinDetailSheet from './PinDetailSheet';
import ClusterPickerSheet from './ClusterPickerSheet';
import Leaderboard from './Leaderboard';
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

const HEATMAP_MODES = [
  { id: 'density', label: '🔥 Densidad', emoji: '🔥' },
  { id: 'funny', label: '😂 Gracioso', emoji: '😂' },
  { id: 'love', label: '😍 Amor', emoji: '😍' },
  { id: 'scare', label: '😱 Miedo', emoji: '😱' },
  { id: 'awful', label: '🤮 Horrible', emoji: '🤮' },
  { id: 'wow', label: '🤯 Wow', emoji: '🤯' },
];

const DEFAULT_CENTER: [number, number] = [20, 0];

export default function MapView() {
  const { user, logout } = useAuth();
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
  const [showHeatModes, setShowHeatModes] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const hasFlownRef = useRef(false);

  const pinClusters = useMemo(() => groupPinsByProximity(pins), [pins]);

  const mapCenter: [number, number] = coords ? [coords.lat, coords.lng] : DEFAULT_CENTER;
  const mapZoom = coords ? 14 : 2;

  const loadPins = useCallback(() => {
    api.getPins().then(setPins);
  }, []);

  const loadStories = useCallback(() => {
    api.getStories().then(setStories).catch(() => setStories([]));
  }, []);

  const refreshAll = useCallback(() => {
    loadPins();
    loadStories();
  }, [loadPins, loadStories]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  useEffect(() => {
    if (!heatmapOn) return;
    api.getHeatmap(heatmapMode).then((data) => setHeatmapPoints(data.points));
  }, [heatmapOn, heatmapMode, pins]);

  useEffect(() => {
    if (coords && !hasFlownRef.current) {
      hasFlownRef.current = true;
      setRecenterTrigger((t) => t + 1);
    }
  }, [coords]);

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

  return (
    <div className="map-app">
      <header className="app-header">
        <div className="header-left">
          <span className="app-title">LaRachaClub</span>
        </div>
        <div className="header-right">
          <div className="user-badge" style={{ borderColor: user?.avatar_color }}>
            <div className="avatar xs" style={{ background: user?.avatar_color }}>
              {user?.nickname[0]}
            </div>
            <span>{user?.nickname}</span>
          </div>
        </div>
      </header>

      <StoriesBar
        stories={stories}
        currentUserId={user?.id}
        onOpen={openStory}
      />

      {geoLoading && !coords && (
        <div className="geo-status">📡 Obteniendo tu ubicación...</div>
      )}
      {geoError && !coords && (
        <div className="geo-status geo-error">
          Ubicación denegada — <button type="button" onClick={refreshLocation}>reintentar</button>
        </div>
      )}

      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={2}
          maxZoom={18}
          className="leaflet-map"
          worldCopyJump
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapFlyTo coords={coords} flyToOnLoad recenterTrigger={recenterTrigger} />
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

      <div className="fab-bar">
        <button
          className="fab fab-location"
          onClick={() => {
            if (coords) setRecenterTrigger((t) => t + 1);
            else refreshLocation();
          }}
          title="Mi ubicación"
          disabled={geoLoading && !coords}
        >
          ◉
        </button>
        {coords && (
          <button className="fab fab-secondary" onClick={pinAtMyLocation} title="Pin aquí">
            📷
          </button>
        )}
        <button
          className={`fab ${heatmapOn ? 'active' : ''}`}
          onClick={() => setHeatmapOn(!heatmapOn)}
          title="Mapa de calor"
        >
          {heatmapOn ? '🔥' : '🗺️'}
        </button>
        {heatmapOn && (
          <button className="fab fab-secondary" onClick={() => setShowHeatModes(!showHeatModes)}>
            {HEATMAP_MODES.find((m) => m.id === heatmapMode)?.emoji || '🔥'}
          </button>
        )}
        <button className="fab fab-secondary" onClick={openLeaderboard} title="Ranking">
          🏆
        </button>
        <button className="fab fab-secondary" onClick={logout} title="Salir">
          👋
        </button>
      </div>

      {showHeatModes && (
        <div className="heatmap-modes">
          {HEATMAP_MODES.map((m) => (
            <button
              key={m.id}
              className={heatmapMode === m.id ? 'active' : ''}
              onClick={() => { setHeatmapMode(m.id); setShowHeatModes(false); }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div className="map-hint">
        Toca el mapa para crear un pin · Varios pins juntos se agrupan
      </div>

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
        />
      )}
    </div>
  );
}
