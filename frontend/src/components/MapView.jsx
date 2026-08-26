import React, { useEffect, useRef } from 'react';

const calcDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const MapView = ({ hospitalCoords, donorCoords, donors, radiusKm, zoom = 14, height = '320px' }) => {
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

      const hasHospital = hospitalCoords && hospitalCoords.length === 2 && hospitalCoords[0] !== undefined && hospitalCoords[1] !== undefined;
      const hLat = hasHospital ? hospitalCoords[1] : 12.9716;
      const hLng = hasHospital ? hospitalCoords[0] : 77.5946;

      const map = L.map(mapRef.current).setView([hLat, hLng], zoom);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      if (hasHospital) {
        const hospitalIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: hsl(354, 80%, 48%); width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">H</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker([hLat, hLng], { icon: hospitalIcon })
          .addTo(map)
          .bindPopup('<b>Hospital Location</b>');
      }

      const bounds = L.latLngBounds([]);
      if (hasHospital) {
        bounds.extend([hLat, hLng]);
      }

      // If search radius is provided without specific donors list, draw searching circle
      if (radiusKm && hasHospital && (!donorCoords || donorCoords.length !== 2) && (!donors || donors.length === 0)) {
        L.circle([hLat, hLng], {
          color: 'hsl(354, 80%, 48%)',
          fillColor: 'hsl(354, 80%, 48%)',
          fillOpacity: 0.1,
          radius: radiusKm * 1000
        }).addTo(map);

        const circleBounds = L.latLng([hLat, hLng]).toBounds(radiusKm * 1000);
        map.fitBounds(circleBounds);
      }

      // Single donor tracking mode
      if (donorCoords && donorCoords.length === 2 && donorCoords[0] && donorCoords[1] && hasHospital) {
        const dLat = donorCoords[1];
        const dLng = donorCoords[0];

        const donorIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: hsl(150, 70%, 35%); width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
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

        const trackingBounds = L.latLngBounds([[hLat, hLng], [dLat, dLng]]);
        map.fitBounds(trackingBounds, { padding: [50, 50] });
      }

      // Multi-donor overview mode
      if (donors && Array.isArray(donors) && donors.length > 0) {
        donors.forEach((donor) => {
          if (donor.location && donor.location.coordinates && donor.location.coordinates.length === 2) {
            const dLng = donor.location.coordinates[0];
            const dLat = donor.location.coordinates[1];

            const distKm = hasHospital ? calcDistance(hLat, hLng, dLat, dLng) : null;
            const isAvailable = donor.isAvailable !== false;
            const bgColor = isAvailable ? '#10b981' : '#6b7280';

            const donorIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: ${bgColor}; color: white; font-weight: 700; font-size: 10px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25); text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${donor.bloodGroup || 'BD'}</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });

            const popupHtml = `
              <div style="font-family: system-ui, sans-serif; font-size: 13px; min-width: 160px;">
                <div style="font-weight: 700; font-size: 14px; color: #111827; margin-bottom: 4px;">${donor.name}</div>
                <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px;">
                  <span style="background: #ffe4e6; color: #e11d48; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${donor.bloodGroup}</span>
                  <span style="background: ${isAvailable ? '#dcfce7' : '#f3f4f6'}; color: ${isAvailable ? '#15803d' : '#4b5563'}; font-weight: 600; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                    ${isAvailable ? 'Available' : 'Offline'}
                  </span>
                </div>
                ${distKm !== null ? `<div style="font-size: 12px; color: #374151; margin-top: 4px;">Distance: <strong>${distKm.toFixed(1)} km</strong></div>` : ''}
                ${donor.phone ? `<div style="font-size: 12px; color: #374151; margin-top: 2px;">Phone: <strong>${donor.phone}</strong></div>` : ''}
              </div>
            `;

            L.marker([dLat, dLng], { icon: donorIcon })
              .addTo(map)
              .bindPopup(popupHtml);

            bounds.extend([dLat, dLng]);
          }
        });

        if (bounds.isValid() && (!donorCoords || donorCoords.length !== 2)) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [hospitalCoords, donorCoords, donors, radiusKm, zoom]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: height, 
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
