import { useEffect, useRef } from 'react';
import { Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { UserCoords } from '../hooks/useGeolocation';

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="user-dot"><div class="user-dot-pulse"></div><div class="user-dot-core"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface Props {
  coords: UserCoords | null;
  flyToOnLoad?: boolean;
  recenterTrigger?: number;
  flyToTarget?: { lat: number; lng: number; zoom?: number } | null;
  flyToTargetKey?: number;
}

export function MapFlyTo({ coords, flyToOnLoad, recenterTrigger, flyToTarget, flyToTargetKey }: Props) {
  const map = useMap();
  const hasFlownRef = useRef(false);
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  useEffect(() => {
    if (coords && flyToOnLoad && !hasFlownRef.current) {
      hasFlownRef.current = true;
      map.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
    }
  }, [coords, flyToOnLoad, map]);

  useEffect(() => {
    if (!recenterTrigger || !coordsRef.current) return;
    const c = coordsRef.current;
    map.flyTo([c.lat, c.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [recenterTrigger, map]);

  useEffect(() => {
    if (!flyToTarget || flyToTargetKey == null) return;
    map.flyTo(
      [flyToTarget.lat, flyToTarget.lng],
      flyToTarget.zoom ?? 16,
      { duration: 1 },
    );
  }, [flyToTarget, flyToTargetKey, map]);

  return null;
}

export function flyToUser(map: L.Map, coords: UserCoords) {
  map.flyTo([coords.lat, coords.lng], 15, { duration: 0.8 });
}

export default function UserLocationLayer({ coords }: { coords: UserCoords | null }) {
  if (!coords) return null;

  return (
    <>
      <Marker position={[coords.lat, coords.lng]} icon={userIcon} zIndexOffset={1000}>
      </Marker>
      {coords.accuracy && coords.accuracy < 500 && (
        <Circle
          center={[coords.lat, coords.lng]}
          radius={coords.accuracy}
          pathOptions={{ color: '#4ECDC4', fillColor: '#4ECDC4', fillOpacity: 0.12, weight: 1 }}
        />
      )}
    </>
  );
}
