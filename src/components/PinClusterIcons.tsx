import L from 'leaflet';
import type { PinCluster } from '../utils/pinClusters';
import { getPinThumbHtml } from '../utils/pinClusters';

export function createSinglePinIcon(pin: Parameters<typeof getPinThumbHtml>[0]) {
  const inner = getPinThumbHtml(pin);
  const epicBadge = pin.is_epic ? '<span class="epic-pin-badge" title="Momento épico">⚡</span>' : '';
  return L.divIcon({
    className: 'custom-pin',
    html: `<div class="pin-marker-wrap ${pin.is_epic ? 'is-epic' : ''}">${epicBadge}<div class="pin-marker ${pin.media_type === 'video' ? 'is-video' : ''}" style="border-color: ${pin.avatar_color || '#4ECDC4'}">${inner}</div></div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
}

export function createStackPinIcon(cluster: PinCluster) {
  const count = cluster.pins.length;
  const visible = cluster.pins.slice(0, 3);

  const layers = visible.map((pin, i) => {
    const offset = (visible.length - 1 - i) * 6;
    const rotate = (visible.length - 1 - i) * -6 + 3;
    const thumb = getPinThumbHtml(pin, 'stack-thumb');
    return `<div class="pin-stack-layer" style="--offset:${offset}px; --rotate:${rotate}deg; border-color:${pin.avatar_color || '#4ECDC4'}">${thumb}</div>`;
  }).join('');

  return L.divIcon({
    className: 'custom-pin pin-stack-icon',
    html: `
      <div class="pin-stack ${cluster.pins.some((p) => p.is_epic) ? 'is-epic' : ''}" role="button" aria-label="${count} pins en este lugar">
        ${cluster.pins.some((p) => p.is_epic) ? '<span class="epic-pin-badge">⚡</span>' : ''}
        ${layers}
        <span class="pin-stack-count">${count}</span>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 52],
    popupAnchor: [0, -52],
  });
}
