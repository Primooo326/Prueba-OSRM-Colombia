import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MapPoint, ServiceType } from '../types';
import { executeServiceCall } from '../services/api';

interface VroomVehicleOptions {
    capacity: number;
    skills: string;
    startTime: number;
    endTime: number;
}

interface AppState {
    currentProfile: string;
    currentService: ServiceType;
    points: MapPoint[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastResult: any;
    isLoading: boolean;
    error: string | null;
    vroomOptions: VroomVehicleOptions;
    routeSteps: boolean;
    tripRoundtrip: boolean;
    isPanelOpen: boolean;
}

interface AppContextType extends AppState {
    setProfile: (key: string) => void;
    setService: (svc: ServiceType) => void;
    addPoint: (lat: number, lng: number) => void;
    removePoint: (id: string) => void;
    updatePoint: (id: string, updates: Partial<MapPoint>) => void;
    movePoint: (id: string, lat: number, lng: number) => void;
    reversePoints: () => void;
    clearAll: () => void;
    executeService: () => Promise<void>;
    setVroomOptions: (opts: Partial<VroomVehicleOptions>) => void;
    setRouteSteps: (v: boolean) => void;
    setTripRoundtrip: (v: boolean) => void;
    togglePanel: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

let idCounter = 0;
function generateId() {
    return `pt-${++idCounter}-${Date.now()}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>({
        currentProfile: 'car',
        currentService: 'route',
        points: [],
        lastResult: null,
        isLoading: false,
        error: null,
        vroomOptions: { capacity: 100, skills: '', startTime: 0, endTime: 28800 },
        routeSteps: true,
        tripRoundtrip: true,
        isPanelOpen: true,
    });

    const setProfile = useCallback((key: string) => {
        setState((s) => ({ ...s, currentProfile: key }));
    }, []);

    const setService = useCallback((svc: ServiceType) => {
        setState((s) => ({ ...s, currentService: svc }));
    }, []);

    const addPoint = useCallback((lat: number, lng: number) => {
        const newPoint: MapPoint = {
            id: generateId(),
            lat,
            lng,
            delivery: 10,
            service: 300,
            twStart: null,
            twEnd: null,
            priority: 50,
            skills: '',
        };
        setState((s) => ({ ...s, points: [...s.points, newPoint] }));
    }, []);

    const removePoint = useCallback((id: string) => {
        setState((s) => ({ ...s, points: s.points.filter((p) => p.id !== id) }));
    }, []);

    const updatePoint = useCallback((id: string, updates: Partial<MapPoint>) => {
        setState((s) => ({
            ...s,
            points: s.points.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
    }, []);

    const movePoint = useCallback((id: string, lat: number, lng: number) => {
        setState((s) => ({
            ...s,
            points: s.points.map((p) => (p.id === id ? { ...p, lat, lng } : p)),
        }));
    }, []);

    const reversePoints = useCallback(() => {
        setState((s) => ({ ...s, points: [...s.points].reverse() }));
    }, []);

    const clearAll = useCallback(() => {
        setState((s) => ({
            ...s,
            points: [],
            lastResult: null,
            error: null,
        }));
    }, []);

    const executeServiceFn = useCallback(async () => {
        if (state.points.length < 2) {
            setState((s) => ({ ...s, error: 'Mínimo 2 puntos requeridos.' }));
            return;
        }
        setState((s) => ({ ...s, isLoading: true, error: null }));
        try {
            const data = await executeServiceCall(
                state.currentService,
                state.currentProfile,
                state.points,
                {
                    steps: state.routeSteps,
                    roundtrip: state.tripRoundtrip,
                    vehicleCapacity: state.vroomOptions.capacity,
                    vehicleSkills: state.vroomOptions.skills,
                    vehicleStartTime: state.vroomOptions.startTime,
                    vehicleEndTime: state.vroomOptions.endTime,
                }
            );
            setState((s) => ({ ...s, lastResult: data, isLoading: false }));
        } catch (e) {
            setState((s) => ({
                ...s,
                isLoading: false,
                error: e instanceof Error ? e.message : 'Error desconocido',
            }));
        }
    }, [state.points, state.currentService, state.currentProfile, state.routeSteps, state.tripRoundtrip, state.vroomOptions]);

    const setVroomOptions = useCallback((opts: Partial<VroomVehicleOptions>) => {
        setState((s) => ({ ...s, vroomOptions: { ...s.vroomOptions, ...opts } }));
    }, []);

    const setRouteSteps = useCallback((v: boolean) => {
        setState((s) => ({ ...s, routeSteps: v }));
    }, []);

    const setTripRoundtrip = useCallback((v: boolean) => {
        setState((s) => ({ ...s, tripRoundtrip: v }));
    }, []);

    const togglePanel = useCallback(() => {
        setState((s) => ({ ...s, isPanelOpen: !s.isPanelOpen }));
    }, []);

    const value: AppContextType = {
        ...state,
        setProfile,
        setService,
        addPoint,
        removePoint,
        updatePoint,
        movePoint,
        reversePoints,
        clearAll,
        executeService: executeServiceFn,
        setVroomOptions,
        setRouteSteps,
        setTripRoundtrip,
        togglePanel,
    };

    return React.createElement(AppContext.Provider, { value }, children);
}

export function useApp(): AppContextType {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
