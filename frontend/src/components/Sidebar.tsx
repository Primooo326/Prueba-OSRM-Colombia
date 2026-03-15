import { useApp } from '../context/AppContext';
import { PROFILES } from '../config/profiles';
import { SERVICE_DESCRIPTIONS } from '../config/constants';
import ProfileSelector from './ProfileSelector';
import ServiceTabs from './ServiceTabs';
import PointList from './PointList';
import VroomVehicleConfig from './VroomVehicleConfig';

export default function Sidebar() {
    const {
        currentProfile,
        currentService,
        points,
        isLoading,
        reversePoints,
        clearAll,
        executeService,
        routeSteps,
        setRouteSteps,
        tripRoundtrip,
        setTripRoundtrip,
    } = useApp();

    const profile = PROFILES[currentProfile];

    const getButtonLabel = () => {
        switch (currentService) {
            case 'vroom':
                return '⚡ OPTIMIZAR VROOM';
            case 'table':
                return '📊 CALCULAR MATRIZ';
            case 'trip':
                return '🔄 OPTIMIZAR TSP';
            default:
                return '🚀 CALCULAR RUTA';
        }
    };

    return (
        <aside className="w-[380px] bg-base-200 flex flex-col z-10 border-r border-base-content/10 shrink-0">
            {/* Header */}
            <div className="px-5 py-5 bg-gradient-to-br from-base-300 to-base-200 border-b border-base-content/10">
                <h1 className="text-lg font-extrabold tracking-tight">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                        OSRM Navigator
                    </span>
                </h1>
                <p className="text-xs text-base-content/40 mt-0.5">Multi-Perfil Routing • Colombia</p>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-base-300">
                <ProfileSelector />

                {/* Profile specs badge */}
                <div className="text-xs text-base-content/40 text-center py-2 px-3 bg-base-300 rounded-lg mb-4 border border-base-content/5">
                    {profile.icon} <strong>{profile.label}</strong> — {profile.specs} | Ruta: /{profile.path}
                </div>

                <ServiceTabs />

                {/* Service description */}
                <p className="text-xs text-base-content/30 italic mb-3">
                    {SERVICE_DESCRIPTIONS[currentService]}
                </p>

                {/* Service-specific params */}
                {currentService === 'route' && (
                    <div className="card bg-base-300 border border-base-content/5 mb-3">
                        <div className="card-body p-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-base-content/50 mb-2">
                                Opciones de Ruta
                            </h4>
                            <label className="label cursor-pointer justify-start gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-xs checkbox-primary"
                                    checked={routeSteps}
                                    onChange={(e) => setRouteSteps(e.target.checked)}
                                />
                                <span className="label-text text-xs">Incluir instrucciones paso a paso</span>
                            </label>
                        </div>
                    </div>
                )}

                {currentService === 'trip' && (
                    <div className="card bg-base-300 border border-base-content/5 mb-3">
                        <div className="card-body p-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-base-content/50 mb-2">
                                Modo TSP
                            </h4>
                            <select
                                className="select select-sm select-bordered w-full bg-base-200"
                                value={String(tripRoundtrip)}
                                onChange={(e) => setTripRoundtrip(e.target.value === 'true')}
                            >
                                <option value="true">🔄 Circular (volver al inicio)</option>
                                <option value="false">➡️ Lineal (no retorno)</option>
                            </select>
                        </div>
                    </div>
                )}

                <VroomVehicleConfig />

                {/* Points */}
                <div className="card bg-base-300 border border-base-content/5 mb-3">
                    <div className="card-body p-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-base-content/50 flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-success" />
                            Puntos ({points.length})
                        </h4>
                        <button
                            className="btn btn-ghost btn-xs w-full border border-base-content/10 mb-2 text-xs font-semibold"
                            onClick={reversePoints}
                        >
                            ↕ Invertir Ruta
                        </button>
                        <PointList />
                    </div>
                </div>

                {/* Action buttons */}
                <button
                    className={`btn btn-block font-bold uppercase tracking-wider text-sm mb-2 ${currentService === 'vroom'
                            ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 hover:shadow-lg hover:shadow-purple-500/30'
                            : 'bg-gradient-to-r from-blue-500 to-blue-700 text-white border-0 hover:shadow-lg hover:shadow-blue-500/30'
                        }`}
                    onClick={executeService}
                    disabled={isLoading}
                >
                    {isLoading && <span className="loading loading-spinner loading-xs" />}
                    {getButtonLabel()}
                </button>

                <button className="btn btn-ghost btn-block btn-sm text-base-content/40 hover:text-error" onClick={clearAll}>
                    🗑 LIMPIAR TODO
                </button>
            </div>
        </aside>
    );
}
