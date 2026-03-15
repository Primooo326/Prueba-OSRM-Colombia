import { useApp } from '../context/AppContext';
import { PROFILES } from '../config/profiles';

export default function PointList() {
    const { points, currentService, currentProfile, removePoint } = useApp();
    const color = PROFILES[currentProfile].color;

    if (points.length === 0) {
        return (
            <div className="text-center py-6 text-base-content/40">
                <div className="text-3xl mb-2 opacity-50">📍</div>
                <p className="text-sm">Haz clic en el mapa para agregar puntos</p>
            </div>
        );
    }

    return (
        <ul className="space-y-1">
            {points.map((p, i) => {
                const isDepot = currentService === 'vroom' && i === 0;
                const role = isDepot
                    ? '🏢 Depósito'
                    : currentService === 'vroom'
                        ? `📦 Job ${i}`
                        : `Punto ${i + 1}`;
                const bgColor = isDepot ? '#a855f7' : color;
                const label = isDepot ? 'D' : String(i + 1);

                return (
                    <li
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-base-200 border border-base-content/5 hover:bg-base-300 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                style={{ backgroundColor: bgColor }}
                            >
                                {label}
                            </div>
                            <div>
                                <div className="text-sm font-semibold">{role}</div>
                                <div className="text-xs text-base-content/40">
                                    {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-1">
                            {currentService === 'vroom' && !isDepot && (
                                <button
                                    className="btn btn-ghost btn-xs text-warning"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const modal = document.getElementById('job-config-modal') as HTMLDialogElement;
                                        modal?.setAttribute('data-point-id', p.id);
                                        modal?.showModal();
                                    }}
                                    title="Configurar"
                                >
                                    ⚙
                                </button>
                            )}
                            <button
                                className="btn btn-ghost btn-xs text-error"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removePoint(p.id);
                                }}
                                title="Eliminar"
                            >
                                ✕
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
