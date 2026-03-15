import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PROFILES } from '../config/profiles';
import { MANEUVER_ICONS, VROOM_ROUTE_COLORS } from '../config/constants';
import { formatDistance, formatDuration, formatTime } from '../services/api';

type PanelTab = 'summary' | 'instructions' | 'json';

export default function DataPanel() {
    const { lastResult, currentService, currentProfile, isLoading, error, isPanelOpen, togglePanel } = useApp();
    const [activeTab, setActiveTab] = useState<PanelTab>('summary');
    const profile = PROFILES[currentProfile];

    return (
        <div
            className={`bg-base-200 border-t-2 border-base-content/10 flex flex-col z-20 transition-all duration-300 ${isPanelOpen ? 'h-56' : 'h-10'
                }`}
        >
            {/* Tabs */}
            <div className="flex bg-base-300 border-b border-base-content/10 min-h-[40px] items-stretch">
                {(['summary', 'instructions', 'json'] as PanelTab[]).map((tab) => {
                    const icons = { summary: '📊', instructions: '🧭', json: '{ }' };
                    const labels = { summary: 'Resumen', instructions: 'Instrucciones', json: 'JSON' };
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 text-xs font-semibold transition-all flex items-center gap-1.5 border-b-2 ${activeTab === tab
                                    ? 'text-primary border-primary'
                                    : 'text-base-content/40 border-transparent hover:text-base-content/60'
                                }`}
                        >
                            <span>{icons[tab]}</span>
                            {labels[tab]}
                        </button>
                    );
                })}
                <button
                    onClick={togglePanel}
                    className="ml-auto px-4 text-lg text-base-content/40 hover:text-base-content/80 transition"
                >
                    {isPanelOpen ? '⬇' : '⬆'}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 text-sm">
                {isLoading && (
                    <div className="flex items-center gap-3 text-base-content/50">
                        <span className="loading loading-spinner loading-sm" />
                        Calculando con perfil {profile.icon} {profile.label}...
                    </div>
                )}

                {error && (
                    <div className="alert alert-error text-sm">
                        <span>❌ Error: {error}</span>
                    </div>
                )}

                {!isLoading && !error && !lastResult && (
                    <div className="text-center py-4 text-base-content/30">
                        <div className="text-2xl mb-2 opacity-50">🗺️</div>
                        <p>Selecciona puntos y calcula una ruta</p>
                    </div>
                )}

                {!isLoading && !error && lastResult && (
                    <>
                        {/* SUMMARY */}
                        {activeTab === 'summary' && <SummaryView />}

                        {/* INSTRUCTIONS */}
                        {activeTab === 'instructions' && <InstructionsView />}

                        {/* JSON */}
                        {activeTab === 'json' && (
                            <pre className="text-xs text-base-content/50 font-mono whitespace-pre-wrap">
                                {JSON.stringify(lastResult, null, 2)}
                            </pre>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function SummaryView() {
    const { lastResult, currentService, currentProfile } = useApp();
    const profile = PROFILES[currentProfile];

    if (currentService === 'vroom') {
        return <VroomSummary data={lastResult} />;
    }

    if (currentService === 'table') {
        return <TableSummary data={lastResult} />;
    }

    // Route or Trip
    const routes = lastResult.routes || lastResult.trips;
    if (!routes?.length) {
        return <div className="text-error font-semibold">No se encontró ruta.</div>;
    }

    const r = routes[0];
    return (
        <div className="stats stats-horizontal bg-base-300 shadow">
            <div className="stat px-5 py-3">
                <div className="stat-title text-xs">Distancia total</div>
                <div className="stat-value text-lg" style={{ color: profile.color }}>
                    {formatDistance(r.distance)} km
                </div>
            </div>
            <div className="stat px-5 py-3">
                <div className="stat-title text-xs">Tiempo estimado</div>
                <div className="stat-value text-lg">{formatDuration(r.duration)}</div>
            </div>
            <div className="stat px-5 py-3">
                <div className="stat-title text-xs">Perfil</div>
                <div className="stat-value text-lg">
                    {profile.icon} {profile.label}
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VroomSummary({ data }: { data: any }) {
    if (!data.routes?.length) {
        return <div className="text-error">No se encontró solución.</div>;
    }

    return (
        <div>
            <div className="stats stats-horizontal bg-base-300 shadow mb-4">
                <div className="stat px-5 py-3">
                    <div className="stat-title text-xs">Vehículos usados</div>
                    <div className="stat-value text-lg text-purple-500">{data.routes.length}</div>
                </div>
                <div className="stat px-5 py-3">
                    <div className="stat-title text-xs">Tiempo cómputo</div>
                    <div className="stat-value text-lg">{data.summary?.computing_times?.loading || 0}ms</div>
                </div>
            </div>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.routes.map((r: any, i: number) => {
                const c = VROOM_ROUTE_COLORS[i % VROOM_ROUTE_COLORS.length];
                return (
                    <div
                        key={i}
                        className="border-l-4 pl-3 mb-2 py-2 px-3 rounded-r-lg bg-base-300"
                        style={{ borderColor: c }}
                    >
                        <div className="font-bold text-sm">
                            Vehículo {r.vehicle} — {formatDistance(r.distance)}km • {Math.round(r.duration / 60)}min
                        </div>
                        <div className="text-xs text-base-content/40 mt-1 space-y-0.5">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {r.steps?.filter((s: any) => s.type === 'job').map((s: any, j: number) => (
                                <div key={j}>
                                    📦 Job {s.job} — Arr: {formatTime(s.arrival)}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {data.unassigned?.length > 0 && (
                <div className="alert alert-warning mt-3 text-sm">
                    ⚠️ {data.unassigned.length} trabajos sin asignar
                </div>
            )}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableSummary({ data }: { data: any }) {
    if (!data.durations) {
        return <div className="text-error">Sin datos de matriz.</div>;
    }

    const n = data.durations.length;
    return (
        <div>
            <div className="stats bg-base-300 shadow mb-4">
                <div className="stat px-5 py-3">
                    <div className="stat-title text-xs">Dimensión matriz</div>
                    <div className="stat-value text-lg">
                        {n}×{n}
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="table table-xs table-zebra">
                    <thead>
                        <tr>
                            <th></th>
                            {Array.from({ length: n }, (_, j) => (
                                <th key={j} className="text-center">
                                    P{j + 1}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.durations.map((row: number[], i: number) => (
                            <tr key={i}>
                                <th>P{i + 1}</th>
                                {row.map((val: number, j: number) => {
                                    const minutes = Math.round(val / 60);
                                    const intensity = Math.min(minutes / 60, 1);
                                    return (
                                        <td
                                            key={j}
                                            className="text-center"
                                            style={{ backgroundColor: `rgba(59,130,246,${intensity * 0.4})` }}
                                        >
                                            {minutes}m
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function InstructionsView() {
    const { lastResult, currentService } = useApp();

    if (currentService === 'vroom' || currentService === 'table') {
        return <div className="text-base-content/30 text-center py-4">No disponible para este servicio.</div>;
    }

    const routes = lastResult?.routes || lastResult?.trips;
    if (!routes?.length) return null;

    const r = routes[0];
    if (!r.legs) {
        return <div className="text-base-content/30 text-center py-4">Sin instrucciones detalladas.</div>;
    }

    return (
        <ul className="space-y-0">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {r.legs.flatMap((leg: any) =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (leg.steps || []).map((step: any, j: number) => {
                    const icon = MANEUVER_ICONS[step.maneuver?.type] || '➡️';
                    const name = step.name || 'Vía sin nombre';
                    const dist = (step.distance / 1000).toFixed(2);
                    const mins = Math.round(step.duration / 60);

                    return (
                        <li
                            key={j}
                            className="flex gap-3 py-2.5 px-2 border-b border-base-content/5 hover:bg-base-300 rounded transition-colors cursor-default"
                        >
                            <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center text-base shrink-0">
                                {icon}
                            </div>
                            <div>
                                <div className="font-semibold text-sm">{name}</div>
                                <div className="text-xs text-base-content/40">
                                    {dist} km • {mins} min
                                </div>
                            </div>
                        </li>
                    );
                })
            )}
        </ul>
    );
}
