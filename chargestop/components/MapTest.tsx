import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { DEFAULT_CENTER, DEFAULT_ZOOM, DEFAULT_STYLE } from '@lib/mapbox';

const MapTest = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: DEFAULT_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '400px', border: '1px solid #ccc', margin: '2rem 0' }}
    />
  );
};

export default MapTest;
