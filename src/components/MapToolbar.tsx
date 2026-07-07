import { IconLocation, IconPlus, IconHeatmap, IconMenu } from './Icons';

interface Props {
  hasLocation: boolean;
  geoLoading: boolean;
  heatmapOn: boolean;
  onLocation: () => void;
  onAddPin: () => void;
  onHeatmapToggle: () => void;
  onOpenMenu: () => void;
}

export default function MapToolbar({
  hasLocation,
  geoLoading,
  heatmapOn,
  onLocation,
  onAddPin,
  onHeatmapToggle,
  onOpenMenu,
}: Props) {
  return (
    <nav className="map-toolbar" aria-label="Herramientas del mapa">
      <button
        type="button"
        className="toolbar-btn"
        onClick={onLocation}
        disabled={geoLoading && !hasLocation}
        aria-label="Mi ubicación"
        title="Mi ubicación"
      >
        <IconLocation />
      </button>
      <button
        type="button"
        className="toolbar-btn primary"
        onClick={onAddPin}
        disabled={!hasLocation}
        aria-label="Crear pin"
        title="Crear pin"
      >
        <IconPlus />
      </button>
      <button
        type="button"
        className={`toolbar-btn ${heatmapOn ? 'active' : ''}`}
        onClick={onHeatmapToggle}
        aria-label="Mapa de calor"
        title="Mapa de calor"
        aria-pressed={heatmapOn}
      >
        <IconHeatmap />
      </button>
      <button
        type="button"
        className="toolbar-btn"
        onClick={onOpenMenu}
        aria-label="Menú"
        title="Menú"
      >
        <IconMenu />
      </button>
    </nav>
  );
}
