import type {
  User, AuthResponse, Pin, PinDetail, LeaderboardEntry,
  HeatmapData, ReactionType, PlaceSuggestion, GeoResult, StoryGroup, NotificationItem,
} from './types';
import { apiUrl, apiHeaders } from './config';

const ACCESS_KEY = 'amici_access_token';
const REFRESH_KEY = 'amici_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(apiUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ refresh_token: refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

async function request<T>(url: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = apiHeaders({
    ...(options.headers as Record<string, string>),
  });
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(apiUrl(url), { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(url, options, false);
    clearTokens();
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Error en la solicitud');
  }
  return res.json();
}

export interface RegisterData {
  nickname?: string;
  first_name: string;
  last_name: string;
  password: string;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }, false);
  setTokens(res.access_token, res.refresh_token);
  return res;
}

export async function login(nickname: string, password: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password }),
  }, false);
  setTokens(res.access_token, res.refresh_token);
  return res;
}

export async function logout(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch { /* ignore */ }
  clearTokens();
}

export async function getMe(): Promise<User> {
  return request<User>('/api/auth/me');
}

export async function updateNickname(nickname: string): Promise<User> {
  return request<User>('/api/auth/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return request<LeaderboardEntry[]>('/api/users/leaderboard');
}

export async function getPins(): Promise<Pin[]> {
  return request<Pin[]>('/api/pins');
}

export async function getPin(id: string): Promise<PinDetail> {
  return request<PinDetail>(`/api/pins/${id}`);
}

export async function createPin(
  media: File,
  lat: number,
  lng: number,
  caption: string,
  place?: { google_place_id?: string; place_name?: string; formatted_address?: string },
  duration?: number,
  userLocation?: { lat: number; lng: number },
  cameraCapture?: boolean
): Promise<Pin> {
  const form = new FormData();
  form.append('photo', media);
  form.append('lat', String(lat));
  form.append('lng', String(lng));
  form.append('caption', caption);
  if (userLocation) {
    form.append('user_lat', String(userLocation.lat));
    form.append('user_lng', String(userLocation.lng));
  }
  if (cameraCapture) form.append('camera_capture', '1');
  if (place?.google_place_id) form.append('google_place_id', place.google_place_id);
  if (place?.place_name) form.append('place_name', place.place_name);
  if (place?.formatted_address) form.append('formatted_address', place.formatted_address);
  if (duration != null) form.append('duration', String(duration));

  return request<Pin>('/api/pins', { method: 'POST', body: form });
}

export async function addComment(pinId: string, text: string, rating?: number) {
  return request(`/api/pins/${pinId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, ...(rating != null ? { rating } : {}) }),
  });
}

export async function toggleReaction(pinId: string, type: ReactionType) {
  return request(`/api/pins/${pinId}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
}

export async function getHeatmap(mode: string): Promise<HeatmapData> {
  return request<HeatmapData>(`/api/heatmap?mode=${mode}`);
}

export async function getStories(): Promise<StoryGroup[]> {
  return request<StoryGroup[]>('/api/stories');
}

export async function getNotifications(): Promise<NotificationItem[]> {
  return request<NotificationItem[]>('/api/notifications');
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
  return request<GeoResult>(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
}

export async function searchPlaces(q: string, lat?: number, lng?: number): Promise<PlaceSuggestion[]> {
  let url = `/api/geo/autocomplete?q=${encodeURIComponent(q)}`;
  if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
  return request<PlaceSuggestion[]>(url);
}

export async function getPlaceDetails(placeId: string) {
  return request(`/api/geo/place/${placeId}`);
}

export async function sendFriendRequest(nickname: string) {
  return request('/api/relations/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
}

export async function getFriends() {
  return request('/api/relations/friends');
}

export async function getPendingRequests() {
  return request('/api/relations/pending');
}

export async function acceptFriendRequest(id: string) {
  return request(`/api/relations/${id}/accept`, { method: 'POST' });
}
