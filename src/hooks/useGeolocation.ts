import { useEffect, useState } from 'react';

export interface UserCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function useGeolocation() {
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    refresh();
    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
        setLoading(false);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 60000 }
    );
    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { coords, error, loading, refresh };
}
