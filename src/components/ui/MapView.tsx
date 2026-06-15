import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapViewProps {
  track: [number, number][]; // [lng, lat]
  className?: string;
}

// Lee un token de color del tema activo (evita colores hardcodeados en el código).
function themeColor(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v || fallback;
}

// Estilo raster con relieve de OpenTopoMap (tiles OSM, sin API key).
const TOPO_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    opentopo: {
      type: 'raster',
      tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenTopoMap (CC-BY-SA) · © OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'opentopo', type: 'raster', source: 'opentopo' }],
};

export function MapView({ track, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || track.length === 0) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TOPO_STYLE,
      center: track[0],
      zoom: 12,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      if (track.length > 1) {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: track } },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': themeColor('--primary', 'tomato'), 'line-width': 4 },
        });

        const bounds = track.reduce(
          (b, c) => b.extend(c as maplibregl.LngLatLike),
          new maplibregl.LngLatBounds(track[0], track[0]),
        );
        map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
      }

      // Marcadores de inicio y fin
      new maplibregl.Marker({ color: themeColor('--secondary', 'gold') }).setLngLat(track[0]).addTo(map);
      if (track.length > 1) {
        new maplibregl.Marker({ color: themeColor('--primary', 'tomato') })
          .setLngLat(track[track.length - 1])
          .addTo(map);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [track]);

  return <div ref={containerRef} className={className || 'w-full h-full rounded-2xl overflow-hidden'} />;
}
