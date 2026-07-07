import type { Pin } from '../types';

export interface PinCluster {
  id: string;
  lat: number;
  lng: number;
  pins: Pin[];
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Agrupa pins que están a menos de `radiusM` metros entre sí */
export function groupPinsByProximity(pins: Pin[], radiusM = 45): PinCluster[] {
  const used = new Set<string>();
  const clusters: PinCluster[] = [];

  const sorted = [...pins].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  for (const pin of sorted) {
    if (used.has(pin.id)) continue;

    const group: Pin[] = [pin];
    used.add(pin.id);

    for (const other of sorted) {
      if (used.has(other.id)) continue;
      const nearPin = group.some(
        (p) => haversineMeters(p.lat, p.lng, other.lat, other.lng) <= radiusM
      );
      if (nearPin) {
        group.push(other);
        used.add(other.id);
      }
    }

    const lat = group.reduce((s, p) => s + p.lat, 0) / group.length;
    const lng = group.reduce((s, p) => s + p.lng, 0) / group.length;

    clusters.push({
      id: group.map((p) => p.id).sort().join('_'),
      lat,
      lng,
      pins: group,
    });
  }

  return clusters;
}

export function getPinThumbHtml(pin: Pin, className = '') {
  const url = pin.media_url || pin.image_url;
  const isVideo = pin.media_type === 'video';
  if (isVideo) {
    return `<div class="pin-video-thumb ${className}"><span class="pin-play">▶</span></div>`;
  }
  return `<img src="${url}" class="${className}" alt="" />`;
}
