import React, { useEffect, useRef } from 'react';

export const MapView = ({ hospitalCoords, donorCoords, radiusKm, zoom = 14 }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

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

      if (mapInstance.current) {
        mapInstance.current.remove();
      }

      const L = window.L;

      const hLat = hospitalCoords[1];
      const hLng = hospitalCoords[0];

      const map = L.map(mapRef.current).setView([hLat, hLng], zoom);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const hospitalIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: hsl(354, 80%, 48%); width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([hLat, hLng], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup('<b>Hospital Location</b>')
        .openPopup();

      // If search radius is provided, draw the searching circle
      if (radiusKm && (!donorCoords || donorCoords.length !== 2)) {
        L.circle([hLat, hLng], {
          color: 'hsl(354, 80%, 48%)',
          fillColor: 'hsl(354, 80%, 48%)',
          fillOpacity: 0.1,
          radius: radiusKm * 1000 // Leaflet takes meters
        }).addTo(map);

        // Adjust map to fit the circle bounds
        const bounds = L.latLng([hLat, hLng]).toBounds(radiusKm * 1000);
        map.fitBounds(bounds);
      }

      // If donor coordinates are provided, show donor and draw connection route
      if (donorCoords && donorCoords.length === 2 && donorCoords[0] && donorCoords[1]) {
        const dLat = donorCoords[1];
        const dLng = donorCoords[0];

        const donorIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: hsl(150, 70%, 35%); width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        L.marker([dLat, dLng], { icon: donorIcon })
          .addTo(map)
          .bindPopup('<b>Donor Location</b>');

        L.polyline([[hLat, hLng], [dLat, dLng]], {
          color: 'hsl(354, 80%, 48%)',
          weight: 3,
          opacity: 0.6,
          dashArray: '6, 8'
        }).addTo(map);

        const bounds = L.latLngBounds([[hLat, hLng], [dLat, dLng]]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [hospitalCoords, donorCoords, radiusKm, zoom]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: '320px', 
        width: '100%', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border-color)',
        zIndex: 5,
        backgroundColor: '#e5e7eb',
        position: 'relative'
      }} 
    />
  );
};
