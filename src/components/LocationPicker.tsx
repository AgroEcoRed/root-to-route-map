import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, AlertCircle } from "lucide-react";

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

const LocationPicker = ({ lat, lng, onChange }: LocationPickerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultLat = lat || -34.61;
    const defaultLng = lng || -58.44;

    mapRef.current = L.map(containerRef.current).setView([defaultLat, defaultLng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapRef.current);

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current!.getLatLng();
        onChange(pos.lat, pos.lng);
      });
    }

    mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      } else {
        markerRef.current = L.marker([newLat, newLng], { draggable: true }).addTo(mapRef.current!);
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current!.getLatLng();
          onChange(pos.lat, pos.lng);
        });
      }
      onChange(newLat, newLng);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker when lat/lng change externally
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current!.getLatLng();
        onChange(pos.lat, pos.lng);
      });
    }
    mapRef.current.setView([lat, lng], 14);
  }, [lat, lng]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange(latitude, longitude);
        setLocating(false);
      },
      (err) => {
        let msg = "No se pudo obtener tu ubicación. Marcala en el mapa o ingresá coordenadas.";
        if (err.code === 1) msg = "Permiso de ubicación denegado. Habilitalo en el navegador (ícono 🔒 junto a la URL) o marcá el punto en el mapa.";
        else if (err.code === 2) msg = "Ubicación no disponible. Probá con GPS activado o marcá el punto en el mapa.";
        else if (err.code === 3) msg = "Tiempo de espera agotado. Marcá tu ubicación en el mapa.";
        setError(msg);
        setShowManual(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualSubmit = () => {
    const la = parseFloat(manualLat.replace(",", "."));
    const ln = parseFloat(manualLng.replace(",", "."));
    if (isNaN(la) || isNaN(ln) || la < -90 || la > 90 || ln < -180 || ln > 180) {
      setError("Coordenadas inválidas. Ej: -34.6037, -58.3816");
      return;
    }
    setError("");
    onChange(la, ln);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Marcá tu ubicación en el mapa o usá GPS</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGeolocate}
          disabled={locating}
          className="text-xs gap-1.5"
        >
          <Navigation className="h-3.5 w-3.5" />
          {locating ? "Buscando..." : "Usar mi ubicación"}
        </Button>
      </div>
      <div
        ref={containerRef}
        className="w-full h-[220px] rounded-lg border border-border overflow-hidden"
        style={{ zIndex: 0 }}
      />
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
      {showManual && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Latitud</label>
            <Input value={manualLat} onChange={(e) => setManualLat(e.target.value)} placeholder="-34.6037" className="h-9 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Longitud</label>
            <Input value={manualLng} onChange={(e) => setManualLng(e.target.value)} placeholder="-58.3816" className="h-9 text-sm" />
          </div>
          <Button type="button" size="sm" onClick={handleManualSubmit}>Usar</Button>
        </div>
      )}
      {lat && lng && (
        <p className="text-xs text-muted-foreground">
          📍 {lat.toFixed(4)}, {lng.toFixed(4)} — Podés arrastrar el pin para ajustar
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
