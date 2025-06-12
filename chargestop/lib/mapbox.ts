import mapboxgl from 'mapbox-gl';

// Set MapBox token from environment variable
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Default map settings
export const DEFAULT_CENTER: [number, number] = [-0.1278, 51.5074]; // London as default
export const DEFAULT_ZOOM = 10;
export const DEFAULT_STYLE = 'mapbox://styles/mapbox/streets-v11';

// Optionally export types for use elsewhere
export type MapboxMap = Map;
export type MapboxMarker = Marker;
export type MapboxPopup = Popup;
