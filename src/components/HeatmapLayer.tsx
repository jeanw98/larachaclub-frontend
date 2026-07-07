import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
  points: [number, number, number][];
  visible: boolean;
}

export default function HeatmapLayer({ points, visible }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!visible || points.length === 0) return;

    const heat = (L as unknown as { heatLayer: (pts: [number, number, number][], opts: object) => L.Layer })
      .heatLayer(points, {
        radius: 25,
        blur: 20,
        maxZoom: 10,
        max: 3,
        gradient: {
          0.2: '#4ECDC4',
          0.4: '#FFE66D',
          0.6: '#FF6B6B',
          0.8: '#F472B6',
          1.0: '#A78BFA',
        },
      });

    heat.addTo(map);
    return () => { map.removeLayer(heat); };
  }, [map, points, visible]);

  return null;
}
