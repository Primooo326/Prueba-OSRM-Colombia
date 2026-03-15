import { useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { PROFILES } from '../config/profiles';
import { MAP_CENTER, MAP_ZOOM, TILE_URL, TILE_ATTRIBUTION, VROOM_ROUTE_COLORS } from '../config/constants';
import { decodePolyline } from '../services/api';

// Create colored circle icons for markers
function createCircleIcon(color: string, label: string): L.DivIcon {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
      width: 28px; height: 28px; border-radius: 50%;
      background: ${color}; border: 2.5px solid white;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      font-family: 'Inter', sans-serif;
    ">${label}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

function MapClickHandler() {
    const { addPoint } = useApp();
    useMapEvents({
        click(e) {
            addPoint(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function DraggableMarker({
    pointId,
    lat,
    lng,
    color,
    label,
    tooltipText,
    onRemove,
    onMove,
}: {
    pointId: string;
    lat: number;
    lng: number;
    color: string;
    label: string;
    tooltipText: string;
    onRemove: (id: string) => void;
    onMove: (id: string, lat: number, lng: number) => void;
}) {
    const markerRef = useRef<L.Marker>(null);
    const icon = useMemo(() => createCircleIcon(color, label), [color, label]);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker) {
                    const pos = marker.getLatLng();
                    onMove(pointId, pos.lat, pos.lng);
                }
            },
            contextmenu() {
                onRemove(pointId);
            },
        }),
        [pointId, onMove, onRemove]
    );

    return (
        <Marker
            position={[lat, lng]}
            icon={icon}
            draggable
            eventHandlers={eventHandlers}
            ref={markerRef}
        >
            <Tooltip direction="top" offset={[0, -16]}>
                {tooltipText}
            </Tooltip>
        </Marker>
    );
}

export default function MapView() {
    const { points, currentService, currentProfile, lastResult, removePoint, movePoint } = useApp();
    const profile = PROFILES[currentProfile];

    const handleRemove = useCallback(
        (id: string) => removePoint(id),
        [removePoint]
    );

    const handleMove = useCallback(
        (id: string, lat: number, lng: number) => movePoint(id, lat, lng),
        [movePoint]
    );

    // Compute polylines from results
    const polylines = useMemo(() => {
        if (!lastResult) return [];

        if (currentService === 'vroom' && lastResult.routes) {
            return lastResult.routes.map((r: { geometry?: string }, i: number) => ({
                positions: r.geometry ? decodePolyline(r.geometry) : [],
                color: VROOM_ROUTE_COLORS[i % VROOM_ROUTE_COLORS.length],
            }));
        }

        if ((currentService === 'route' || currentService === 'trip') && (lastResult.routes || lastResult.trips)) {
            const routes = lastResult.routes || lastResult.trips;
            if (routes.length > 0 && routes[0].geometry) {
                return [
                    {
                        positions: decodePolyline(routes[0].geometry),
                        color: profile.color,
                    },
                ];
            }
        }

        return [];
    }, [lastResult, currentService, profile.color]);

    return (
        <MapContainer
            center={MAP_CENTER}
            zoom={MAP_ZOOM}
            className="w-full h-full z-0"
            zoomControl={true}
            attributionControl={true}
        >
            <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
            <MapClickHandler />

            {points.map((p, i) => {
                const isDepot = currentService === 'vroom' && i === 0;
                const label = isDepot ? 'D' : String(i + 1);
                const color = isDepot ? '#a855f7' : profile.color;
                const tooltip = isDepot
                    ? '🏢 Depósito'
                    : currentService === 'vroom'
                        ? `📦 Job ${i}`
                        : `Punto ${i + 1}`;

                return (
                    <DraggableMarker
                        key={p.id}
                        pointId={p.id}
                        lat={p.lat}
                        lng={p.lng}
                        color={color}
                        label={label}
                        tooltipText={tooltip}
                        onRemove={handleRemove}
                        onMove={handleMove}
                    />
                );
            })}

            {polylines.map((pl: { positions: [number, number][]; color: string }, i: number) => (
                <Polyline
                    key={`polyline-${i}`}
                    positions={pl.positions}
                    pathOptions={{ color: pl.color, weight: 5, opacity: 0.85 }}
                />
            ))}
        </MapContainer>
    );
}
