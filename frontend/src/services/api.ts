import { API_HOST, API_VROOM } from '../config/constants';
import { PROFILES } from '../config/profiles';
import type { MapPoint, ServiceType } from '../types';

export async function executeServiceCall(
    service: ServiceType,
    profileKey: string,
    points: MapPoint[],
    options: {
        steps?: boolean;
        roundtrip?: boolean;
        vehicleCapacity?: number;
        vehicleSkills?: string;
        vehicleStartTime?: number;
        vehicleEndTime?: number;
    } = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    const profile = PROFILES[profileKey];
    if (!profile) throw new Error(`Perfil desconocido: ${profileKey}`);

    if (service === 'vroom') {
        return fetchVroom(profileKey, points, options);
    }

    const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
    let url = `${API_HOST}/${profile.path}/${service}/v1/driving/${coords}?overview=full&geometries=polyline`;

    if (service === 'route' && options.steps) {
        url += '&steps=true';
    }
    if (service === 'trip') {
        url += `&roundtrip=${options.roundtrip ?? true}`;
    }
    if (service === 'table') {
        url += '&annotations=duration';
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return res.json();
}

async function fetchVroom(
    profileKey: string,
    points: MapPoint[],
    options: {
        vehicleCapacity?: number;
        vehicleSkills?: string;
        vehicleStartTime?: number;
        vehicleEndTime?: number;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    const depot = points[0];
    const vSkills = options.vehicleSkills
        ? options.vehicleSkills.split(',').map(Number)
        : undefined;

    const body = {
        vehicles: [
            {
                id: 1,
                profile: profileKey,
                start: [depot.lng, depot.lat],
                end: [depot.lng, depot.lat],
                capacity: [options.vehicleCapacity ?? 100],
                skills: vSkills,
                time_window: [options.vehicleStartTime ?? 0, options.vehicleEndTime ?? 28800],
            },
        ],
        jobs: points.slice(1).map((p, idx) => {
            const job: Record<string, unknown> = {
                id: idx + 1,
                location: [p.lng, p.lat],
                delivery: [p.delivery],
                service: p.service,
                priority: p.priority,
            };
            if (p.twStart !== null && p.twEnd !== null) {
                job.time_windows = [[p.twStart, p.twEnd]];
            }
            if (p.skills) {
                job.skills = p.skills.split(',').map(Number);
            }
            return job;
        }),
        options: { g: true },
    };

    const res = await fetch(API_VROOM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return res.json();
}

/**
 * Decode an encoded OSRM polyline to [lat, lng] pairs.
 * Uses the standard Google Polyline encoding algorithm.
 */
export function decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte: number;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const dLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dLat;

        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const dLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dLng;

        points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
}

export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

export function formatDistance(meters: number): string {
    return (meters / 1000).toFixed(1);
}
