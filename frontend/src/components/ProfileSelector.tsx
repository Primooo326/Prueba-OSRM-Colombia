import { useApp } from '../context/AppContext';
import { PROFILES, PROFILE_KEYS } from '../config/profiles';

export default function ProfileSelector() {
    const { currentProfile, setProfile } = useApp();

    return (
        <div className="grid grid-cols-5 gap-1.5 mb-4">
            {PROFILE_KEYS.map((key) => {
                const p = PROFILES[key];
                const isActive = key === currentProfile;
                return (
                    <button
                        key={key}
                        onClick={() => setProfile(key)}
                        className={`btn btn-sm flex-col gap-0.5 h-auto py-2.5 px-1 text-xs font-semibold border-2 transition-all duration-200 hover:-translate-y-0.5 ${isActive
                                ? 'border-primary bg-primary/15 text-primary shadow-lg shadow-primary/20'
                                : 'btn-ghost border-base-content/10 text-base-content/60'
                            }`}
                        style={
                            isActive
                                ? { borderColor: p.color, color: p.color, boxShadow: `0 0 20px ${p.color}30` }
                                : undefined
                        }
                    >
                        <span className="text-xl">{p.icon}</span>
                        <span className="text-[0.65rem]">{p.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
