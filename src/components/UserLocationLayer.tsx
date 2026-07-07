import { useEffect, useState } from 'react';
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
}

export function MapFlyTo({ coords, flyToOnLoad, recenterTrigger }: Props) {
  const map = useMap();
  const [hasFlown, setHasFlown] = useState(false);

  useEffect(() => {
    if (coords && flyToOnLoad && !hasFlown) {
      map.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
      setHasFlown(true);
    }
  }, [coords, flyToOnLoad, hasFlown, map]);

  useEffect(() => {
    if (coords && recenterTrigger && recenterTrigger > 0) {
      map.flyTo([coords.lat, coords.lng], 15, { duration: 0.8 });
    }
  }, [coords, recenterTrigger, map]);

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
