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
const MAX_VIDEO_MS = 31000;

export default function StoryViewer({ group, startIndex = 0, onClose, onNextUser, onGoToMap }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const advancingRef = useRef(false);

  const items = group.items;
  const item = items[index];
  const mediaUrl = item.media_url || item.image_url;
  const mediaType = item.media_type || 'image';
  const isVideo = mediaType === 'video';

  const goNext = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    if (index < items.length - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
      window.setTimeout(() => { advancingRef.current = false; }, 200);
    } else {
      markStorySeen(items.map((i) => i.id));
      onNextUser?.() ?? onClose();
    }
  }, [index, items, onClose, onNextUser]);

  const goPrev = () => {
    if (index > 0) {
      advancingRef.current = false;
      setIndex((i) => i - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    setIndex(startIndex);
    setProgress(0);
    advancingRef.current = false;
  }, [group.user_id, startIndex]);

  useEffect(() => {
    markStorySeen([item.id]);
  }, [item.id]);

  // Fotos: avance automático
  useEffect(() => {
    if (isVideo) return;
    setProgress(0);
    advancingRef.current = false;
    const start = Date.now();
    const timer = window.setInterval(() => {
      const pct = Math.min(((Date.now() - start) / PHOTO_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (pct >= 100) goNext();
    }, 50);
    return () => window.clearInterval(timer);
  }, [index, isVideo, item.id, goNext]);

  // Videos: cargar, reproducir y sincronizar progreso
  useEffect(() => {
    if (!isVideo) return;

    const video = videoRef.current;
    if (!video) return;

    setProgress(0);
    setVideoLoading(true);
    advancingRef.current = false;

    let fallbackTimer: number | null = null;
    let stalled = false;

    const clearFallback = () => {
      if (fallbackTimer != null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const scheduleFallback = () => {
      clearFallback();
      const durationMs = video.duration && isFinite(video.duration)
        ? Math.min(video.duration * 1000 + 800, MAX_VIDEO_MS)
        : Math.min((item.duration_seconds || 30) * 1000 + 800, MAX_VIDEO_MS);
      fallbackTimer = window.setTimeout(() => {
        if (!stalled) goNext();
      }, durationMs);
    };

    const handlePlaying = () => {
      setVideoLoading(false);
      stalled = false;
      scheduleFallback();
    };

    const handleWaiting = () => {
      setVideoLoading(true);
      stalled = true;
    };

    const handleTimeUpdate = () => {
      if (!video.duration || !isFinite(video.duration)) return;
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleEnded = () => {
      clearFallback();
      goNext();
    };

    const handleError = () => {
      clearFallback();
      setVideoLoading(false);
      window.setTimeout(goNext, 800);
    };

    const startPlayback = async () => {
      try {
        video.currentTime = 0;
        await video.play();
      } catch {
        video.muted = true;
        setMuted(true);
        try {
          await video.play();
        } catch {
          handleError();
        }
      }
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    if (video.readyState >= 2) {
      startPlayback();
    } else {
      video.addEventListener('loadeddata', startPlayback, { once: true });
    }

    return () => {
      clearFallback();
      video.pause();
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [index, isVideo, item.id, item.duration_seconds, mediaUrl, goNext]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted, item.id]);

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
            <button
              type="button"
              className="story-mute"
              onClick={(e) => {
                e.stopPropagation();
                setMuted((m) => !m);
              }}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          )}
          <button type="button" className="story-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="story-media-wrap">
        {isVideo ? (
          <video
            key={item.id}
            ref={videoRef}
            className="story-image"
            src={mediaUrl}
            playsInline
            muted={muted}
            preload="auto"
          />
        ) : (
          <img key={item.id} className="story-image" src={mediaUrl} alt="" />
        )}
        {isVideo && videoLoading && (
          <div className="story-video-loading">
            <div className="loading-spinner" />
          </div>
        )}
      </div>

      <div className="story-tap-zones">
        <button type="button" className="story-tap-left" onClick={goPrev} aria-label="Anterior" />
        <button type="button" className="story-tap-right" onClick={goNext} aria-label="Siguiente" />
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
