import { useApp } from '../context/AppContext';
import type { ServiceType } from '../types';
import { PROFILES } from '../config/profiles';

const TABS: { key: ServiceType; icon: string; label: string }[] = [
    { key: 'route', icon: '🧭', label: 'Ruta' },
    { key: 'trip', icon: '🔄', label: 'TSP' },
    { key: 'vroom', icon: '⚡', label: 'VROOM' },
    { key: 'table', icon: '📊', label: 'Matriz' },
];

export default function ServiceTabs() {
    const { currentService, setService, currentProfile } = useApp();
    const profileColor = PROFILES[currentProfile].color;

    return (
        <div role="tablist" className="tabs tabs-box mb-3">
            {TABS.map(({ key, icon, label }) => {
                const isActive = currentService === key;
                const isVroom = key === 'vroom';

                return (
                    <button
                        key={key}
                        role="tab"
                        onClick={() => setService(key)}
                        className={`tab tab-sm font-bold text-xs uppercase tracking-wider transition-all ${isActive ? 'tab-active text-white !rounded-lg' : 'text-base-content/50'
                            }`}
                        style={
                            isActive
                                ? {
                                    backgroundColor: isVroom ? '#a855f7' : profileColor,
                                    borderColor: isVroom ? '#a855f7' : profileColor,
                                }
                                : undefined
                        }
                    >
                        <span className="mr-1">{icon}</span>
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
