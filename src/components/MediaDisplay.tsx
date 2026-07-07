interface Props {
  url: string;
  mediaType?: 'image' | 'video';
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  onEnded?: () => void;
}

export default function MediaDisplay({
  url,
  mediaType = 'image',
  className = '',
  autoPlay = false,
  muted = true,
  controls = false,
  loop = false,
  onEnded,
}: Props) {
  if (mediaType === 'video') {
    return (
      <video
        className={className}
        src={url}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        loop={loop}
        playsInline
        preload="metadata"
        onEnded={onEnded}
      />
    );
  }

  return <img className={className} src={url} alt="" />;
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('No se pudo leer el video'));
    };
    video.src = URL.createObjectURL(file);
  });
}
