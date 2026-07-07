import type { Pin } from '../types';

export function isPinVisibleOnMap(pin: Pin): boolean {
  if (pin.is_permanent) return true;
  if (!pin.expires_at) {
    const age = Date.now() - new Date(pin.created_at).getTime();
    return age < 24 * 60 * 60 * 1000;
  }
  return new Date(pin.expires_at).getTime() > Date.now();
}

export function filterVisiblePins(pins: Pin[]): Pin[] {
  return pins.filter(isPinVisibleOnMap);
}

export function pinHoursLeft(pin: Pin): number | null {
  if (pin.is_permanent || pin.is_epic) return null;
  const expires = pin.expires_at
    ? new Date(pin.expires_at).getTime()
    : new Date(pin.created_at).getTime() + 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expires - Date.now()) / 3600000));
}
