import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function JobConfigModal() {
    const { points, updatePoint } = useApp();
    const [pointId, setPointId] = useState<string | null>(null);
    const [delivery, setDelivery] = useState(10);
    const [service, setService] = useState(300);
    const [twStart, setTwStart] = useState('');
    const [twEnd, setTwEnd] = useState('');
    const [priority, setPriority] = useState(50);
    const [skills, setSkills] = useState('');

    useEffect(() => {
        const modal = document.getElementById('job-config-modal') as HTMLDialogElement;
        if (!modal) return;

        const observer = new MutationObserver(() => {
            const id = modal.getAttribute('data-point-id');
            if (id && modal.open) {
                setPointId(id);
                const point = points.find((p) => p.id === id);
                if (point) {
                    setDelivery(point.delivery);
                    setService(point.service);
                    setTwStart(point.twStart !== null ? String(point.twStart) : '');
                    setTwEnd(point.twEnd !== null ? String(point.twEnd) : '');
                    setPriority(point.priority);
                    setSkills(point.skills);
                }
            }
        });

        observer.observe(modal, { attributes: true });
        return () => observer.disconnect();
    }, [points]);

    const handleSave = () => {
        if (!pointId) return;
        updatePoint(pointId, {
            delivery,
            service,
            twStart: twStart ? parseInt(twStart) : null,
            twEnd: twEnd ? parseInt(twEnd) : null,
            priority,
            skills,
        });
        const modal = document.getElementById('job-config-modal') as HTMLDialogElement;
        modal?.close();
    };

    return (
        <dialog id="job-config-modal" className="modal modal-bottom sm:modal-middle">
            <div className="modal-box bg-base-200 border border-base-content/10">
                <h3 className="font-bold text-lg mb-4 pb-3 border-b border-base-content/10">
                    ⚙️ Configurar Trabajo
                </h3>

                <div className="form-control mb-3">
                    <label className="label py-0.5">
                        <span className="label-text text-xs font-semibold">Demanda / Entrega</span>
                    </label>
                    <input
                        type="number"
                        className="input input-bordered input-sm bg-base-300"
                        value={delivery}
                        onChange={(e) => setDelivery(parseInt(e.target.value) || 0)}
                    />
                </div>

                <div className="form-control mb-3">
                    <label className="label py-0.5">
                        <span className="label-text text-xs font-semibold">Tiempo Servicio (s)</span>
                    </label>
                    <input
                        type="number"
                        className="input input-bordered input-sm bg-base-300"
                        value={service}
                        onChange={(e) => setService(parseInt(e.target.value) || 0)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="form-control">
                        <label className="label py-0.5">
                            <span className="label-text text-xs font-semibold">Ventana Inicio</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered input-sm bg-base-300"
                            placeholder="0"
                            value={twStart}
                            onChange={(e) => setTwStart(e.target.value)}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label py-0.5">
                            <span className="label-text text-xs font-semibold">Ventana Fin</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered input-sm bg-base-300"
                            placeholder="86400"
                            value={twEnd}
                            onChange={(e) => setTwEnd(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="form-control">
                        <label className="label py-0.5">
                            <span className="label-text text-xs font-semibold">Prioridad (0-100)</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered input-sm bg-base-300"
                            value={priority}
                            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label py-0.5">
                            <span className="label-text text-xs font-semibold">Skills Req.</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered input-sm bg-base-300"
                            placeholder="ej: 1"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                        />
                    </div>
                </div>

                <div className="modal-action">
                    <form method="dialog">
                        <button className="btn btn-sm btn-ghost">Cancelar</button>
                    </form>
                    <button className="btn btn-sm btn-primary" onClick={handleSave}>
                        Guardar
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    );
}
