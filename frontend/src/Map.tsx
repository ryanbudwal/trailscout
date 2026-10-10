import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "./types";
export function TrailMap({
  places,
  onSelect,
}: {
  places: Place[];
  onSelect: (place: Place) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    if (!root.current) return;
    const m = L.map(root.current, {
      scrollWheelZoom: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView([43.685, -79.38], 11);
    map.current = m;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    const observer = new ResizeObserver(() => {
      if (map.current === m) m.invalidateSize({ animate: false });
    });
    observer.observe(root.current);
    return () => {
      observer.disconnect();
      map.current = null;
      m.stop();
      m.remove();
    };
  }, []);
  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    places.forEach((p, i) => {
      const icon = L.divIcon({
        className: "trail-marker",
        html: `<span>${i + 1}</span>`,
        iconSize: [32, 38],
        iconAnchor: [16, 38],
      });
      const marker = L.marker([p.latitude, p.longitude], {
        icon,
        alt: p.name,
        title: p.name,
        keyboard: true,
        riseOnHover: true,
      }).addTo(layer.current!);
      const element = marker.getElement();
      element?.setAttribute("aria-label", p.name);
      element?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onSelect(p);
        }
      });
      const label = document.createElement("span");
      label.textContent = p.name;
      marker.bindTooltip(label);
      marker.on("click", () => onSelect(p));
    });
    if (places.length)
      map.current.fitBounds(
        L.latLngBounds(places.map((p) => [p.latitude, p.longitude])),
        { padding: [40, 40], maxZoom: 13, animate: false },
      );
  }, [places, onSelect]);
  return (
    <div className="map-shell">
      <div
        ref={root}
        className="map"
        aria-label="Interactive map of outdoor places"
      />
      <div className="map-caption">
        <span className="live-dot" /> Approximate park locations · tap a pin
      </div>
    </div>
  );
}
