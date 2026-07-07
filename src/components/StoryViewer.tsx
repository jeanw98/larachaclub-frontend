import { useState, useEffect, useCallback, useRef } from 'react';
import type { StoryGroup } from '../types';
import { markStorySeen } from './StoriesBar';
import { IconPinMap } from './Icons';

interface Props {
  group: StoryGroup;
  startIndex?: number;
  onClose: () => void;
  onNextUser?: () => void;
  onGoToMap?: (pinId: string, lat: number, lng: number) => void;
}

const PHOTO_DURATION_MS = 5000;

export default function StoryViewer({ group, startIndex = 0, onClose, onNextUser, onGoToMap }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const items = group.items;
  const item = items[index];
  const mediaUrl = item.media_url || item.image_url;
  const mediaType = item.media_type || 'image';
  const isVideo = mediaType === 'video';

  const goNext = useCallback(() => {
    if (index < items.length - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
    } else {
      markStorySeen(items.map((i) => i.id));
      onNextUser?.() ?? onClose();
    }
  }, [index, items, onClose, onNextUser]);

  const goPrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setProgress(0);
    }
  };

  // Progreso automático para fotos
  useEffect(() => {
    if (isVideo) return;
    setProgress(0);
    const start = Date.now();
    const timer = window.setInterval(() => {
      const pct = Math.min(((Date.now() - start) / PHOTO_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (pct >= 100) goNext();
    }, 50);
    return () => window.clearInterval(timer);
  }, [index, isVideo, goNext]);

  // Respaldo: si el video no dispara onEnded, avanzar igual
  useEffect(() => {
    if (!isVideo) return;
    const maxMs = Math.min((item.duration_seconds || 30) + 1, 31) * 1000;
    const timer = window.setTimeout(goNext, maxMs);
    return () => window.clearTimeout(timer);
  }, [index, isVideo, item.duration_seconds, item.id, goNext]);

  useEffect(() => {
    markStorySeen([item.id]);
  }, [item.id]);

  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration || !isFinite(v.duration)) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const expiresAt = new Date(item.expires_at);
  const hoursLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 3600000));

  return (
    <div className="story-viewer">
      <div className="story-progress-bar">
        {items.map((storyItem, i) => (
          <div key={storyItem.id} className="story-progress-segment">
            <div
              className="story-progress-fill"
              style={{
                width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      <div className="story-header">
        <div className="story-author">
          <div className="avatar xs" style={{ background: group.avatar_color }}>
            {group.nickname[0]}
          </div>
          <span>{group.nickname}</span>
          <span className="story-counter">{index + 1}/{items.length}</span>
          <span className="story-time">{hoursLeft}h restantes</span>
        </div>
        <div className="story-header-actions">
          {isVideo && (
            <button type="button" className="story-mute" onClick={() => setMuted((m) => !m)}>
              {muted ? '🔇' : '🔊'}
            </button>
          )}
          <button type="button" className="story-close" onClick={onClose}>✕</button>
        </div>
      </div>

      {isVideo ? (
        <video
          key={item.id}
          ref={videoRef}
          className="story-image"
          src={mediaUrl}
          autoPlay
          playsInline
          muted={muted}
          preload="auto"
          onEnded={goNext}
          onTimeUpdate={handleVideoTimeUpdate}
        />
      ) : (
        <img key={item.id} className="story-image" src={mediaUrl} alt="" />
      )}

      <div className="story-tap-zones">
        <div className="story-tap-left" onClick={goPrev} />
        <div className="story-tap-right" onClick={goNext} />
      </div>

      {(item.caption || item.place_name) && (
        <div className="story-footer">
          {item.place_name && <p className="story-place">{item.place_name}</p>}
          {item.caption && <p className="story-caption">{item.caption}</p>}
        </div>
      )}

      {onGoToMap && item.lat != null && item.lng != null && (
        <button
          type="button"
          className="story-go-map"
          onClick={(e) => {
            e.stopPropagation();
            onGoToMap(item.id, item.lat, item.lng);
          }}
        >
          <IconPinMap size={18} />
          Ver en el mapa
        </button>
      )}
    </div>
  );
}
