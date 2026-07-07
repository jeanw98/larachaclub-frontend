import type { PinCluster } from '../utils/pinClusters';
import MediaDisplay from './MediaDisplay';

interface Props {
  cluster: PinCluster;
  onSelect: (pinId: string) => void;
  onClose: () => void;
}

export default function ClusterPickerSheet({ cluster, onSelect, onClose }: Props) {
  const place = cluster.pins[0]?.place_name || cluster.pins[0]?.formatted_address;

  return (
    <div className="sheet-overlay cluster-picker-overlay" onClick={onClose}>
      <div className="sheet cluster-picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>{cluster.pins.length} en este lugar</h2>
        {place && <p className="sheet-subtitle place-address">{place}</p>}
        <p className="sheet-subtitle">Toca la que quieras ver</p>

        <div className="cluster-fan">
          {cluster.pins.map((pin, i) => {
            const angle = cluster.pins.length === 1
              ? 0
              : -20 + (40 / Math.max(cluster.pins.length - 1, 1)) * i;
            const lift = Math.abs(angle) * 0.3;

            return (
              <button
                key={pin.id}
                type="button"
                className="cluster-card"
                style={{
                  '--fan-angle': `${angle}deg`,
                  '--fan-lift': `${lift}px`,
                  '--accent': pin.avatar_color || '#4ECDC4',
                } as React.CSSProperties}
                onClick={() => onSelect(pin.id)}
              >
                <div className="cluster-card-media">
                  <MediaDisplay
                    url={pin.media_url || pin.image_url}
                    mediaType={pin.media_type || 'image'}
                    muted
                  />
                  {pin.media_type === 'video' && <span className="cluster-video-badge">▶</span>}
                </div>
                <div className="cluster-card-info">
                  <div className="avatar xs" style={{ background: pin.avatar_color }}>
                    {pin.user_name?.[0]}
                  </div>
                  <span>{pin.user_name}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="cluster-list">
          {cluster.pins.map((pin) => (
            <button
              key={pin.id}
              type="button"
              className="cluster-list-row"
              onClick={() => onSelect(pin.id)}
            >
              <div className="cluster-list-thumb">
                <MediaDisplay
                  url={pin.media_url || pin.image_url}
                  mediaType={pin.media_type || 'image'}
                  muted
                />
              </div>
              <div className="cluster-list-body">
                <strong>{pin.user_name}</strong>
                {pin.caption && <p>{pin.caption}</p>}
              </div>
              <span className="cluster-list-arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
