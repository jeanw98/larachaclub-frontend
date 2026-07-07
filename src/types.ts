export type ReactionType = 'funny' | 'awful' | 'scare' | 'love' | 'wow' | 'meh';

export interface User {
  id: string;
  nickname: string;
  first_name: string;
  last_name: string;
  avatar_color: string;
  created_at?: string;
  cool_name?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export type MediaType = 'image' | 'video';

export interface Pin {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  caption: string;
  image_url: string;
  media_url?: string;
  media_type?: MediaType;
  mime_type?: string;
  duration_seconds?: number | null;
  google_place_id?: string | null;
  place_name?: string | null;
  formatted_address?: string | null;
  created_at: string;
  user_name?: string;
  avatar_color?: string;
  reactions?: Record<ReactionType, number>;
  comment_count?: number;
  avg_rating?: number | null;
}

export interface Comment {
  id: string;
  pin_id: string;
  user_id: string;
  text: string;
  rating: number;
  created_at: string;
  nickname: string;
  cool_name?: string;
  avatar_color: string;
}

export interface PinDetail extends Pin {
  comments: Comment[];
  user_reaction: ReactionType | null;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  first_name: string;
  last_name: string;
  avatar_color: string;
  pin_count: number;
  funny_reactions: number;
  total_score: number;
  rank_position?: number;
  cool_name?: string;
}

export interface HeatmapData {
  mode: string;
  points: [number, number, number][];
}

export interface PlaceSuggestion {
  place_id: string;
  description: string;
  main_text?: string;
  secondary_text?: string;
}

export interface GeoResult {
  formatted_address: string | null;
  place_id: string | null;
  place_name: string | null;
}

export interface StoryItem {
  id: string;
  image_url: string;
  media_url?: string;
  media_type?: MediaType;
  duration_seconds?: number | null;
  caption: string;
  place_name?: string | null;
  formatted_address?: string | null;
  created_at: string;
  expires_at: string;
}

export interface StoryGroup {
  user_id: string;
  nickname: string;
  avatar_color: string;
  items: StoryItem[];
}

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'funny', emoji: '😂', label: 'Gracioso' },
  { type: 'love', emoji: '😍', label: 'Amor' },
  { type: 'wow', emoji: '🤯', label: 'Wow' },
  { type: 'scare', emoji: '😱', label: 'Miedo' },
  { type: 'awful', emoji: '🤮', label: 'Horrible' },
  { type: 'meh', emoji: '😐', label: 'Meh' },
];
