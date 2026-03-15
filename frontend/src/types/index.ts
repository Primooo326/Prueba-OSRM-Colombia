export interface VehicleProfile {
    key: string;
    path: string;
    label: string;
    icon: string;
    color: string;
    specs: string;
    height: number;
    width: number;
    weight: string;
    vroomProfile: string;
}

export interface MapPoint {
    id: string;
    lat: number;
    lng: number;
    delivery: number;
    service: number;
    twStart: number | null;
    twEnd: number | null;
    priority: number;
    skills: string;
}

export type ServiceType = 'route' | 'trip' | 'vroom' | 'table';

export interface RouteResult {
    type: 'route' | 'trip';
    distance: number;
    duration: number;
    geometry: string;
    legs?: RouteLeg[];
}

export interface RouteLeg {
    distance: number;
    duration: number;
    steps?: RouteStep[];
}

export interface RouteStep {
    distance: number;
    duration: number;
    name: string;
    maneuver: {
        type: string;
        modifier?: string;
    };
}

export interface VroomResult {
    routes: VroomRoute[];
    unassigned: { id: number; location: [number, number] }[];
    summary: {
        computing_times?: {
            loading?: number;
        };
    };
}

export interface VroomRoute {
    vehicle: number;
    distance: number;
    duration: number;
    geometry: string;
    steps: VroomStep[];
}

export interface VroomStep {
    type: string;
    job?: number;
    arrival: number;
    location: [number, number];
}

export interface TableResult {
    durations: number[][];
    sources: { location: [number, number] }[];
    destinations: { location: [number, number] }[];
}
