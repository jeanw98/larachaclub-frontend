import L from 'leaflet';

// Required before leaflet.gridlayer.googlemutant loads
(window as Window & { L?: typeof L }).L = L;

export default L;
