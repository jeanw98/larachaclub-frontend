import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import GoogleMutant from 'leaflet.gridlayer.googlemutant/src/Leaflet.GoogleMutant.mjs';
import type { Theme } from '../context/ThemeContext';

export type GoogleMapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

const LIGHT_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f0f2f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e8edf2' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c8e6c9' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#fafafa' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffe082' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#81d4fa' }] },
];

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#141422' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b8ba8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#141422' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2e2e4a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e1e32' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2e28' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252540' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d3d5c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c2340' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4ecdc4' }] },
];

const FALLBACK_TILES: Record<Theme, string> = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

function roadmapStyles(theme: Theme) {
  return theme === 'dark' ? DARK_MAP_STYLES : LIGHT_MAP_STYLES;
}

interface Props {
  mapType: GoogleMapType;
  theme: Theme;
}

export default function GoogleMapLayer({ mapType, theme }: Props) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    let cancelled = false;

    async function mountLayer() {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }

      if (apiKey) {
        try {
          setOptions({ key: apiKey, v: 'weekly' });
          await importLibrary('maps');
          if (cancelled) return;

          const googleLayer = new GoogleMutant({
            type: mapType,
            maxZoom: 21,
            styles: mapType === 'roadmap' ? roadmapStyles(theme) : undefined,
          });
          googleLayer.addTo(map);
          layerRef.current = googleLayer;
          return;
        } catch (err) {
          console.warn('Google Maps no disponible, usando mapa alternativo', err);
        }
      }

      if (cancelled) return;
      const fallback = L.tileLayer(FALLBACK_TILES[theme], {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        maxZoom: 20,
      });
      fallback.addTo(map);
      layerRef.current = fallback;
    }

    mountLayer();

    return () => {
      cancelled = true;
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, apiKey, mapType, theme]);

  return null;
}
