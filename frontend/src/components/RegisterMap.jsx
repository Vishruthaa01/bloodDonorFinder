import React, { useEffect, useRef } from 'react';

export const RegisterMap = ({ latitude, longitude, onChange, zoom = 15 }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current || !window.L) return;

      const L = window.L;

      const initialLat = parseFloat(latitude) || 11.273495;
      const initialLng = parseFloat(longitude) || 77.606811;

      if (mapInstance.current) {
        mapInstance.current.remove();
      }

      const map = L.map(mapRef.current).setView([initialLat, initialLng], zoom);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: hsl(354, 80%, 48%); width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); transform: translate(-3px, -3px);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: customIcon,
        draggable: true
      }).addTo(map);
      markerInstance.current = marker;

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onChange(position.lat.toFixed(6), position.lng.toFixed(6));
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange(lat.toFixed(6), lng.toFixed(6));
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markerInstance.current || !window.L) return;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      const markerLatLng = markerInstance.current.getLatLng();
      if (Math.abs(markerLatLng.lat - lat) > 0.00001 || Math.abs(markerLatLng.lng - lng) > 0.00001) {
        markerInstance.current.setLatLng([lat, lng]);
        mapInstance.current.setView([lat, lng]);
      }
    }
  }, [latitude, longitude]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: '240px', 
        width: '100%', 
        borderRadius: 'var(--radius-sm)', 
        border: '1px solid var(--border-color)',
        zIndex: 5,
        backgroundColor: '#e5e7eb',
        marginTop: '12px'
      }} 
    />
  );
};
