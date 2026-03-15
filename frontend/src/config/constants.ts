export const API_HOST = 'https://osrm.oberon360.com';
export const API_VROOM = 'https://osrm.oberon360.com/vroom/';

export const MAP_CENTER: [number, number] = [4.62, -74.10];
export const MAP_ZOOM = 13;

export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

export const SERVICE_DESCRIPTIONS: Record<string, string> = {
    route: 'Calcula la ruta más óptima entre los puntos seleccionados.',
    trip: 'Optimiza el orden de visita (Problema del Viajero Comerciante).',
    vroom: 'Optimización avanzada con restricciones de capacidad, skills y ventanas de tiempo.',
    table: 'Genera la matriz de distancias/duraciones NxN entre todos los puntos.',
};

export const MANEUVER_ICONS: Record<string, string> = {
    depart: '🚩',
    arrive: '🏁',
    'turn-left': '⬅️',
    'turn-right': '➡️',
    'turn-slight-left': '↖️',
    'turn-slight-right': '↗️',
    'turn-sharp-left': '↩️',
    'turn-sharp-right': '↪️',
    continue: '⬆️',
    'roundabout-turn': '🔄',
    'merge-left': '🔀',
    'merge-right': '🔀',
    'fork-left': '↙️',
    'fork-right': '↘️',
    'end-of-road-left': '⬅️',
    'end-of-road-right': '➡️',
    'new-name': '⬆️',
    straight: '⬆️',
    roundabout: '🔄',
    rotary: '🔄',
    uturn: '🔃',
};

export const VROOM_ROUTE_COLORS = ['#a855f7', '#f97316', '#3b82f6', '#ef4444', '#22c55e', '#ec4899'];
