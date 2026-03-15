import { useApp } from '../context/AppContext';

export default function VroomVehicleConfig() {
    const { currentService, vroomOptions, setVroomOptions } = useApp();

    if (currentService !== 'vroom') return null;

    return (
        <div className="card bg-base-200 border border-base-content/5 mb-3">
            <div className="card-body p-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-base-content/50 flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Vehículo VROOM
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="form-control">
                        <label className="label py-0.5">
                            <span className="label-text text-xs">Capacidad</span>
                        </label>
                        <input
                            type="number"
                            className="input input-sm input-bordered w-full bg-base-300"
                            value={vroomOptions.capacity}
                            onChange={(e) => setVroomOptions({ capacity: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label py-0.5">
                            <span className="label-text text-xs">Skills (1,2..)</span>
                        </label>
                        <input
                            type="text"
                            className="input input-sm input-bordered w-full bg-base-300"
                            placeholder="1, 2"
                            value={vroomOptions.skills}
                            onChange={(e) => setVroomOptions({ skills: e.target.value })}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label py-0.5">
                            <span className="label-text text-xs">Inicio Turno (s)</span>
                        </label>
                        <input
                            type="number"
                            className="input input-sm input-bordered w-full bg-base-300"
                            value={vroomOptions.startTime}
                            onChange={(e) => setVroomOptions({ startTime: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label py-0.5">
                            <span className="label-text text-xs">Fin Turno (s)</span>
                        </label>
                        <input
                            type="number"
                            className="input input-sm input-bordered w-full bg-base-300"
                            value={vroomOptions.endTime}
                            onChange={(e) => setVroomOptions({ endTime: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
