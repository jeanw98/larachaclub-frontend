import { useState, useRef, useEffect } from 'react';
import * as api from '../api';
import type { PlaceSuggestion } from '../types';
import type { MediaType } from '../types';
import MediaDisplay, { getVideoDuration } from './MediaDisplay';
import CameraCapture from './CameraCapture';
import { validateMediaLocationClient } from '../utils/mediaValidation';

const MAX_VIDEO_SECONDS = 30;

interface Props {
  lat: number;
  lng: number;
  userLat?: number;
  userLng?: number;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddPinModal({ lat, lng, userLat, userLng, onClose, onCreated }: Props) {
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [duration, setDuration] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [fromCamera, setFromCamera] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<{
    google_place_id?: string;
    place_name?: string;
    formatted_address?: string;
  } | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasUserLocation = userLat != null && userLng != null;

  useEffect(() => {
    api.reverseGeocode(lat, lng)
      .then((geo) => {
        if (geo.formatted_address) {
          setSelectedPlace({
            google_place_id: geo.place_id || undefined,
            place_name: geo.place_name || undefined,
            formatted_address: geo.formatted_address,
          });
        }
      })
      .finally(() => setGeoLoading(false));
  }, [lat, lng]);

  useEffect(() => {
    if (placeQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      api.searchPlaces(placeQuery, lat, lng).then(setSuggestions).catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [placeQuery, lat, lng]);

  const processFile = async (file: File, isVideo: boolean, dur?: number, cameraCapture = false) => {
    setError('');
    setVerified(false);
    setFromCamera(cameraCapture);

    if (!hasUserLocation) {
      setError('Activa tu ubicación para verificar que la foto es legítima');
      return;
    }

    if (isVideo) {
      const videoDur = dur ?? await getVideoDuration(file).catch(() => null);
      if (!videoDur || videoDur > MAX_VIDEO_SECONDS) {
        setError(`El video debe durar máximo ${MAX_VIDEO_SECONDS} segundos`);
        return;
      }
      setDuration(videoDur);
      setMediaType('video');
    } else {
      setDuration(null);
      setMediaType('image');
    }

    const locationCheck = await validateMediaLocationClient(
      file, lat, lng, userLat!, userLng!, undefined, cameraCapture
    );
    if (!locationCheck.ok) {
      setError(locationCheck.error);
      return;
    }

    setVerified(true);
    setMedia(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleFile = async (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      setError('Solo imágenes o videos');
      return;
    }
    await processFile(file, isVideo);
  };

  const handleCameraCapture = async (file: File, isVideo: boolean, dur?: number) => {
    setShowCamera(false);
    await processFile(file, isVideo, dur, true);
  };

  const selectPlace = async (suggestion: PlaceSuggestion) => {
    try {
      const details = await api.getPlaceDetails(suggestion.place_id) as {
        place_id: string; place_name?: string; formatted_address?: string;
      };
      setSelectedPlace({
        google_place_id: details.place_id,
        place_name: details.place_name,
        formatted_address: details.formatted_address,
      });
      setPlaceQuery('');
      setSuggestions([]);
    } catch {
      setSelectedPlace({
        google_place_id: suggestion.place_id,
        place_name: suggestion.main_text,
        formatted_address: suggestion.description,
      });
      setPlaceQuery('');
      setSuggestions([]);
    }
  };

  const handleSubmit = async () => {
    if (!media) {
      setError('Elige una foto o video primero');
      return;
    }
    if (!hasUserLocation) {
      setError('Se requiere tu ubicación GPS activa');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const created = await api.createPin(
        media, lat, lng, caption,
        selectedPlace || undefined,
        duration ?? undefined,
        { lat: userLat!, lng: userLng! },
        fromCamera
      );
      if (created.is_epic) {
        window.alert('⚡ ¡Momento épico! Esta publicación queda en el mapa para siempre.');
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el pin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose}>
        <div className="sheet add-pin-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-handle" />
          <h2>Crear pin</h2>

          {geoLoading ? (
            <p className="sheet-subtitle">Buscando ubicación...</p>
          ) : selectedPlace?.formatted_address ? (
            <p className="sheet-subtitle place-address">{selectedPlace.formatted_address}</p>
          ) : (
            <p className="sheet-subtitle">{lat.toFixed(4)}, {lng.toFixed(4)}</p>
          )}

          {!hasUserLocation && (
            <p className="verify-warning">⚠️ Activa tu ubicación para publicar</p>
          )}

          <p className="verify-hint">
            Usa la cámara para foto o video en el lugar, o sube desde galería con GPS
          </p>

          <div className="place-search">
            <input
              type="text"
              placeholder="Buscar lugar (Google)"
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
            />
            {suggestions.length > 0 && (
              <div className="place-suggestions">
                {suggestions.map((s) => (
                  <button key={s.place_id} type="button" onClick={() => selectPlace(s)}>
                    <strong>{s.main_text}</strong>
                    {s.secondary_text && <span>{s.secondary_text}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`photo-picker ${preview ? 'has-photo' : ''}`}>
            {preview ? (
              <>
                <MediaDisplay
                  url={preview}
                  mediaType={mediaType}
                  className="media-preview"
                  autoPlay={mediaType === 'video'}
                  muted
                  loop
                />
                {verified && <span className="verified-badge">✓ Ubicación verificada</span>}
                <button
                  type="button"
                  className="media-change-btn"
                  onClick={() => {
                    setMedia(null);
                    setPreview(null);
                    setVerified(false);
                  }}
                >
                  Cambiar
                </button>
              </>
            ) : (
              <div className="photo-picker-placeholder">
                <span>📷</span>
                <p>Elige cómo subir tu contenido</p>
                <p className="hint-small">Videos máx. {MAX_VIDEO_SECONDS}s</p>
              </div>
            )}
          </div>

          {!preview && (
            <div className="media-source-btns">
              <button
                type="button"
                className="btn btn-camera"
                disabled={!hasUserLocation}
                onClick={() => { setCameraMode('photo'); setShowCamera(true); }}
              >
                Foto con cámara
              </button>
              <button
                type="button"
                className="btn btn-camera-video"
                disabled={!hasUserLocation}
                onClick={() => { setCameraMode('video'); setShowCamera(true); }}
              >
                Video con cámara
              </button>
              <button
                type="button"
                className="btn btn-gallery"
                onClick={() => fileRef.current?.click()}
              >
                Galería
              </button>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />

          <input
            className="caption-input"
            type="text"
            placeholder="Cuéntanos algo de este lugar..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
          />

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn btn-primary"
            disabled={loading || !media || !verified || !hasUserLocation}
            onClick={handleSubmit}
          >
            {loading ? 'Publicando...' : '¡Publicar!'}
          </button>
        </div>
      </div>

      {showCamera && hasUserLocation && (
        <CameraCapture
          userLat={userLat!}
          userLng={userLng!}
          initialMode={cameraMode}
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
