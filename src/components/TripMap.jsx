import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Numbered pins in visiting order. Loaded only when the map tab is opened.
export default function TripMap({ days }) {
  const box = useRef(null);

  useEffect(() => {
    const map = L.map(box.current).setView([22.5, 79], 4);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const points = [];
    days.forEach((day, d) => {
      let n = 0;
      day.items.forEach((item) => {
        n += 1;
        if (item.lat === undefined) return;
        const icon = L.divIcon({ className: "", html: `<span class="map-pin">${d + 1}.${n}</span>`, iconSize: [34, 24] });
        const label = document.createElement("div");
        label.textContent = `Day ${d + 1}: ${item.name}`; // text, never HTML
        L.marker([item.lat, item.lng], { icon, title: item.name }).bindPopup(label).addTo(map);
        points.push([item.lat, item.lng]);
      });
    });
    if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 14 });
    return () => map.remove();
  }, [days]);

  return <div ref={box} className="z-0 h-[60dvh] w-full rounded-2xl" aria-label="Trip map" />;
}
