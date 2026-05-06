"use client";

import { useEffect, useState, useTransition } from "react";
import {
    getPacientesAction,
    updateEstadoPacienteAction,
} from "./actions";
import type { Paciente, EstadoPaciente } from "@/lib/altas/Pacientes.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
}

function formatFecha(iso: string): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function tiempoRelativo(iso: string): string {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const dias = Math.floor(diff / 86400000);
    if (dias === 0) return "Hoy";
    if (dias === 1) return "Ayer";
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} sem`;
    return formatFecha(iso);
}

// ─── Badge de estado ──────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoPaciente, { label: string; cls: string }> = {
    activo: { label: "ACTIVO", cls: "badge-activo" },
    pausado: { label: "PAUSADO", cls: "badge-pausado" },
    alta: { label: "ALTA", cls: "badge-alta" },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PacientesPage() {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<EstadoPaciente | "todos">("todos");
    const [isPending, startTransition] = useTransition();
    const [accionPacienteId, setAccionPacienteId] = useState<string | null>(null);

    useEffect(() => {
        getPacientesAction()
            .then(setPacientes)
            .finally(() => setLoading(false));
    }, []);

    const pacientesFiltrados = pacientes.filter((p) => {
        const matchBusqueda =
            p.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.correo.toLowerCase().includes(busqueda.toLowerCase());
        const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
        return matchBusqueda && matchEstado;
    });

    function handleCambiarEstado(pacienteId: string, estado: EstadoPaciente) {
        setAccionPacienteId(pacienteId);
        startTransition(async () => {
            await updateEstadoPacienteAction(pacienteId, estado);
            setPacientes((prev) =>
                prev.map((p) => (p.id === pacienteId ? { ...p, estado } : p))
            );
            setAccionPacienteId(null);
        });
    }

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .pac-root {
          font-family: 'Sora', sans-serif;
          background: #f0f4f8;
          min-height: 100vh;
          padding: 2rem 2.5rem;
          color: #0f1923;
        }

        /* Header */
        .pac-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .pac-title { font-size: 1.75rem; font-weight: 700; color: #0f1923; margin: 0; }
        .pac-subtitle { font-size: 0.85rem; color: #64748b; margin: 0.2rem 0 0; }

        .btn-citas-aceptar {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #0f1923;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 0.65rem 1.2rem;
          font-family: 'Sora', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-citas-aceptar:hover { background: #1e3a5f; transform: translateY(-1px); }
        .btn-citas-aceptar .badge-count {
          position: absolute;
          top: -8px; right: -8px;
          background: #ef4444;
          color: #fff;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          min-width: 20px;
          text-align: center;
        }

        /* Controles */
        .pac-controles {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .pac-search-wrap {
          position: relative;
          flex: 1;
          min-width: 220px;
        }
        .pac-search-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 1rem;
          pointer-events: none;
        }
        .pac-search {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.4rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 0.875rem;
          color: #0f1923;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .pac-search:focus { border-color: #3b82f6; }

        .filtro-btn {
          padding: 0.65rem 1rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          color: #64748b;
          transition: all 0.15s;
        }
        .filtro-btn:hover { border-color: #3b82f6; color: #3b82f6; }
        .filtro-btn.active-todos { background: #0f1923; color: #fff; border-color: #0f1923; }
        .filtro-btn.active-activo { background: #dcfce7; color: #16a34a; border-color: #16a34a; }
        .filtro-btn.active-pausado { background: #fef9c3; color: #ca8a04; border-color: #ca8a04; }
        .filtro-btn.active-alta { background: #dbeafe; color: #2563eb; border-color: #2563eb; }

        /* Stats */
        .pac-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .stat-card {
          background: #fff;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          border: 1px solid #e2e8f0;
        }
        .stat-num { font-size: 1.75rem; font-weight: 700; color: #0f1923; }
        .stat-label { font-size: 0.75rem; color: #94a3b8; margin-top: 0.1rem; text-transform: uppercase; letter-spacing: 0.05em; }

        /* Tabla */
        .pac-tabla-wrap {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .pac-tabla {
          width: 100%;
          border-collapse: collapse;
        }
        .pac-tabla thead tr {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .pac-tabla th {
          text-align: left;
          padding: 0.875rem 1.25rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .pac-tabla tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s;
        }
        .pac-tabla tbody tr:last-child { border-bottom: none; }
        .pac-tabla tbody tr:hover { background: #f8fafc; }
        .pac-tabla td {
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          vertical-align: middle;
        }

        /* Avatar + nombre */
        .pac-info { display: flex; align-items: center; gap: 0.75rem; }
        .pac-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .pac-nombre { font-weight: 600; color: #0f1923; font-size: 0.875rem; }
        .pac-id { font-family: 'DM Mono', monospace; font-size: 0.72rem; color: #94a3b8; }

        /* Badges */
        .badge {
          display: inline-block;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .badge-activo { background: #dcfce7; color: #16a34a; }
        .badge-pausado { background: #fef9c3; color: #ca8a04; }
        .badge-alta { background: #dbeafe; color: #2563eb; }

        /* Acciones */
        .acciones-wrap { display: flex; gap: 0.5rem; align-items: center; }
        .btn-seguimiento {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.4rem 0.75rem;
          background: #f0f9ff;
          color: #0284c7;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          font-family: 'Sora', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-seguimiento:hover { background: #0284c7; color: #fff; border-color: #0284c7; }

        .btn-menu {
          width: 30px; height: 30px;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          background: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #94a3b8;
          font-size: 1.1rem;
          transition: all 0.15s;
          position: relative;
        }
        .btn-menu:hover { border-color: #94a3b8; color: #0f1923; }

        /* Dropdown de estado */
        .dropdown-wrapper { position: relative; }
        .dropdown-menu {
          position: absolute;
          right: 0; top: calc(100% + 4px);
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          z-index: 50;
          min-width: 150px;
          overflow: hidden;
        }
        .dropdown-item {
          display: block;
          width: 100%;
          padding: 0.6rem 1rem;
          text-align: left;
          background: none;
          border: none;
          font-family: 'Sora', sans-serif;
          font-size: 0.8rem;
          cursor: pointer;
          color: #374151;
          transition: background 0.1s;
        }
        .dropdown-item:hover { background: #f8fafc; }
        .dropdown-item.danger { color: #ef4444; }
        .dropdown-item.danger:hover { background: #fef2f2; }

        /* Loading */
        .loading-wrap {
          display: flex; align-items: center; justify-content: center;
          padding: 4rem;
          color: #94a3b8;
          font-size: 0.9rem;
          gap: 0.5rem;
        }
        .spinner {
          width: 20px; height: 20px;
          border: 2px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          color: #94a3b8;
        }
        .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .empty-text { font-size: 0.9rem; }

        /* Footer tabla */
        .pac-footer {
          padding: 0.875rem 1.25rem;
          border-top: 1px solid #f1f5f9;
          font-size: 0.8rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
        }
        .pac-footer-spinner {
          width: 14px; height: 14px;
          border: 2px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>

            <div className="pac-root">
                {/* Header */}
                <div className="pac-header">
                    <div>
                        <h1 className="pac-title">Pacientes</h1>
                        <p className="pac-subtitle">Gestión de expedientes y seguimiento clínico</p>
                    </div>
                    <a href="/dashboard_psico/citas-pendientes" className="btn-citas-aceptar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Citas por Aceptar
                        {pacientes.length > 0 && (
                            <span className="badge-count">!</span>
                        )}
                    </a>
                </div>

                {/* Stats */}
                <div className="pac-stats">
                    <div className="stat-card">
                        <div className="stat-num">{pacientes.length}</div>
                        <div className="stat-label">Total pacientes</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-num" style={{ color: "#16a34a" }}>
                            {pacientes.filter((p) => p.estado === "activo").length}
                        </div>
                        <div className="stat-label">Activos</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-num" style={{ color: "#ca8a04" }}>
                            {pacientes.filter((p) => p.estado === "pausado").length}
                        </div>
                        <div className="stat-label">Pausados</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-num" style={{ color: "#2563eb" }}>
                            {pacientes.filter((p) => p.estado === "alta").length}
                        </div>
                        <div className="stat-label">Alta médica</div>
                    </div>
                </div>

                {/* Controles */}
                <div className="pac-controles">
                    <div className="pac-search-wrap">
                        <span className="pac-search-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <input
                            className="pac-search"
                            placeholder="Buscar paciente..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    {(["todos", "activo", "pausado", "alta"] as const).map((f) => (
                        <button
                            key={f}
                            className={`filtro-btn ${filtroEstado === f ? `active-${f}` : ""}`}
                            onClick={() => setFiltroEstado(f)}
                        >
                            {f === "todos" ? "Todos" : f === "activo" ? "Activos" : f === "pausado" ? "Pausados" : "Alta médica"}
                        </button>
                    ))}
                </div>

                {/* Tabla */}
                <div className="pac-tabla-wrap">
                    {loading ? (
                        <div className="loading-wrap">
                            <div className="spinner" />
                            Cargando pacientes...
                        </div>
                    ) : pacientesFiltrados.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">👤</div>
                            <div className="empty-text">
                                {busqueda ? "No se encontraron pacientes con esa búsqueda" : "Aún no tienes pacientes asignados"}
                            </div>
                        </div>
                    ) : (
                        <table className="pac-tabla">
                            <thead>
                                <tr>
                                    <th>NOMBRE DEL PACIENTE</th>
                                    <th>EDAD</th>
                                    <th>ÚLTIMA CITA</th>
                                    <th>ESTADO</th>
                                    <th>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pacientesFiltrados.map((p) => (
                                    <PacienteRow
                                        key={p.id}
                                        paciente={p}
                                        isLoading={accionPacienteId === p.id && isPending}
                                        onCambiarEstado={handleCambiarEstado}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!loading && pacientesFiltrados.length > 0 && (
                        <div className="pac-footer">
                            Mostrando {pacientesFiltrados.length} de {pacientes.length} pacientes
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ─── Fila de paciente ─────────────────────────────────────────────────────────

function PacienteRow({
    paciente,
    isLoading,
    onCambiarEstado,
}: {
    paciente: Paciente;
    isLoading: boolean;
    onCambiarEstado: (id: string, estado: EstadoPaciente) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const cfg = ESTADO_CONFIG[paciente.estado];
    const iniciales = paciente.nombreCompleto
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    const edad = paciente.fechaNacimiento ? calcularEdad(paciente.fechaNacimiento) : null;

    return (
        <tr style={{ opacity: isLoading ? 0.6 : 1 }}>
            {/* Nombre */}
            <td>
                <div className="pac-info">
                    <div className="pac-avatar">{iniciales}</div>
                    <div>
                        <div className="pac-nombre">{paciente.nombreCompleto}</div>
                        <div className="pac-id">ID: #PC-{paciente.id.slice(-4).toUpperCase()}</div>
                    </div>
                </div>
            </td>

            {/* Edad */}
            <td style={{ color: "#374151" }}>
                {edad !== null ? `${edad} años` : "—"}
            </td>

            {/* Última cita */}
            <td style={{ color: "#374151" }}>
                {tiempoRelativo(paciente.ultimaCita ?? "")}
            </td>

            {/* Estado */}
            <td>
                <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
            </td>

            {/* Acciones */}
            <td>
                <div className="acciones-wrap">
                    <button className="btn-seguimiento">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                        </svg>
                        Seguimiento
                    </button>

                    <div className="dropdown-wrapper">
                        <button
                            className="btn-menu"
                            onClick={() => setMenuOpen((v) => !v)}
                            disabled={isLoading}
                        >
                            ⋮
                        </button>
                        {menuOpen && (
                            <div className="dropdown-menu">
                                {paciente.estado !== "activo" && (
                                    <button
                                        className="dropdown-item"
                                        onClick={() => { onCambiarEstado(paciente.id, "activo"); setMenuOpen(false); }}
                                    >
                                        ✓ Marcar Activo
                                    </button>
                                )}
                                {paciente.estado !== "pausado" && (
                                    <button
                                        className="dropdown-item"
                                        onClick={() => { onCambiarEstado(paciente.id, "pausado"); setMenuOpen(false); }}
                                    >
                                        ⏸ Pausar tratamiento
                                    </button>
                                )}
                                {paciente.estado !== "alta" && (
                                    <button
                                        className="dropdown-item danger"
                                        onClick={() => { onCambiarEstado(paciente.id, "alta"); setMenuOpen(false); }}
                                    >
                                        ✦ Dar de alta
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}