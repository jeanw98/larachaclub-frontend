import { useState, useRef, useEffect, useCallback } from 'react';
import { canvasToJpegFileWithGps, blobToFile } from '../utils/embedGps';

const MAX_VIDEO_SECONDS = 30;

interface Props {
  userLat: number;
  userLng: number;
  initialMode?: 'photo' | 'video';
  onCapture: (file: File, isVideo: boolean, duration?: number) => void;
  onClose: () => void;
}

function getSupportedVideoMime(): string {
  const types = [
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm',
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

function canUseMediaRecorder() {
  return typeof MediaRecorder !== 'undefined' && !!getSupportedVideoMime();
}

export default function CameraCapture({
  userLat,
  userLng,
  initialMode = 'photo',
  onCapture,
  onClose,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recordSecondsRef = useRef(0);
  const nativeVideoRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'photo' | 'video'>(initialMode);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [recorderAvailable] = useState(canUseMediaRecorder);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    setReady(false);
    stopStream();

    const wantAudio = mode === 'video';

    const tryGetUserMedia = async (constraints: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    };

    try {
      await tryGetUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: wantAudio,
      });
    } catch {
      try {
        await tryGetUserMedia({ video: { facingMode: facing }, audio: wantAudio });
      } catch {
        try {
          await tryGetUserMedia({ video: true, audio: wantAudio });
        } catch {
          if (wantAudio) {
            try {
              await tryGetUserMedia({ video: true, audio: false });
              setError('Micrófono no disponible — video sin audio');
            } catch {
              setError('No se pudo acceder a la cámara. Permite el acceso en tu navegador.');
            }
          } else {
            setError('No se pudo acceder a la cámara. Permite el acceso en tu navegador.');
          }
        }
      }
    }
  }, [facing, mode, stopStream]);

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  const takePhoto = async () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const file = await canvasToJpegFileWithGps(canvas, userLat, userLng);
    stopStream();
    onCapture(file, false);
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;

    if (!recorderAvailable) {
      nativeVideoRef.current?.click();
      return;
    }

    const mime = getSupportedVideoMime();
    chunksRef.current = [];
    recordSecondsRef.current = 0;
    setRecordSeconds(0);

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 2_500_000,
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime.split(';')[0] });
        const ext = mime.includes('mp4') ? 'mp4' : 'webm';
        const file = blobToFile(blob, `video.${ext}`, mime.split(';')[0]);
        stopStream();
        onCapture(file, true, recordSecondsRef.current || 1);
      };

      recorder.onerror = () => {
        setError('Error al grabar. Prueba de nuevo o usa la cámara nativa.');
        setRecording(false);
      };

      recorder.start(250);
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        recordSecondsRef.current += 1;
        setRecordSeconds(recordSecondsRef.current);
        if (recordSecondsRef.current >= MAX_VIDEO_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch {
      nativeVideoRef.current?.click();
    }
  };

  const handleNativeVideo = async (file: File) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const dur = video.duration;
      if (dur > MAX_VIDEO_SECONDS) {
        setError(`El video debe durar máximo ${MAX_VIDEO_SECONDS} segundos`);
        return;
      }
      stopStream();
      onCapture(file, true, dur);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      setError('No se pudo leer el video');
    };
  };

  const switchCamera = () => {
    if (!recording) setFacing((f) => (f === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="camera-overlay" onClick={onClose}>
      <div className="camera-panel" onClick={(e) => e.stopPropagation()}>
        <div className="camera-header">
          <button type="button" className="camera-close" onClick={onClose}>✕</button>
          <div className="camera-modes">
            <button
              type="button"
              className={mode === 'photo' ? 'active' : ''}
              onClick={() => { if (!recording) setMode('photo'); }}
            >
              Foto
            </button>
            <button
              type="button"
              className={mode === 'video' ? 'active' : ''}
              onClick={() => { if (!recording) setMode('video'); }}
            >
              Video
            </button>
          </div>
          <button
            type="button"
            className="camera-switch"
            onClick={switchCamera}
            title="Cambiar cámara"
            disabled={recording}
          >
            🔄
          </button>
        </div>

        <div className="camera-viewport">
          <video
            ref={videoRef}
            className={`camera-video ${facing === 'user' ? 'mirror' : ''}`}
            playsInline
            muted
            autoPlay
          />
          {recording && (
            <div className="camera-rec-indicator">
              <span className="rec-dot" /> {recordSeconds}s / {MAX_VIDEO_SECONDS}s
            </div>
          )}
          {!ready && !error && <div className="camera-loading">Iniciando cámara...</div>}
        </div>

        {error && <p className="error-text camera-error">{error}</p>}

        {mode === 'video' && !recorderAvailable && !recording && (
          <p className="camera-native-hint">
            Tu navegador usará la cámara nativa para grabar video
          </p>
        )}

        <div className="camera-controls">
          {mode === 'photo' ? (
            <button
              type="button"
              className="camera-shutter photo"
              disabled={!ready}
              onClick={takePhoto}
              aria-label="Tomar foto"
            />
          ) : recording ? (
            <button
              type="button"
              className="camera-shutter stop"
              onClick={stopRecording}
              aria-label="Detener video"
            />
          ) : (
            <button
              type="button"
              className="camera-shutter video"
              disabled={!ready}
              onClick={startRecording}
              aria-label="Grabar video"
            />
          )}
        </div>

        <input
          ref={nativeVideoRef}
          type="file"
          accept="video/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleNativeVideo(f);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
