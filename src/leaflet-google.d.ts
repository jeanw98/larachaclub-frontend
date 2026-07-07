declare module 'leaflet.gridlayer.googlemutant/src/Leaflet.GoogleMutant.mjs' {
  import { GridLayer } from 'leaflet';

  interface GoogleMutantOptions {
    type?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
    maxZoom?: number;
    styles?: Record<string, unknown>[];
  }

  export default class GoogleMutant extends GridLayer {
    constructor(options?: GoogleMutantOptions);
  }
}
