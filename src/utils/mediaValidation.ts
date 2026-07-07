import exifr from 'exifr';

const TOLERANCE_M = 800;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function extractGpsFromFile(file: File): Promise<{ lat: number; lng: number } | null> {
  try {
    const gps = await exifr.gps(file);
    if (gps?.latitude != null && gps?.longitude != null) {
      return { lat: gps.latitude, lng: gps.longitude };
    }
  } catch { /* sin GPS */ }
  return null;
}

export async function validateMediaLocationClient(
  file: File,
  pinLat: number,
  pinLng: number,
  userLat: number,
  userLng: number,
  toleranceM = TOLERANCE_M,
  cameraCapture = false
): Promise<{ ok: true } | { ok: false; error: string }> {
  let mediaGps = await extractGpsFromFile(file);

  if (!mediaGps && cameraCapture) {
    mediaGps = { lat: userLat, lng: userLng };
  }

  if (!mediaGps) {
    return {
      ok: false,
      error: 'La foto no tiene coordenadas GPS. Toma la foto con la cámara del celular en el lugar.',
    };
  }

  const distMediaUser = haversineMeters(mediaGps.lat, mediaGps.lng, userLat, userLng);
  const distMediaPin = haversineMeters(mediaGps.lat, mediaGps.lng, pinLat, pinLng);
  const distUserPin = haversineMeters(userLat, userLng, pinLat, pinLng);

  if (distMediaUser > toleranceM) {
    return { ok: false, error: `La foto fue tomada a ${Math.round(distMediaUser)}m de tu ubicación actual` };
  }
  if (distMediaPin > toleranceM) {
    return { ok: false, error: `La foto no coincide con el lugar del pin (${Math.round(distMediaPin)}m de diferencia)` };
  }
  if (distUserPin > toleranceM) {
    return { ok: false, error: `El pin está a ${Math.round(distUserPin)}m de tu ubicación. Colócalo donde estás` };
  }

  return { ok: true };
}
