"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface Psicologo {
    id: string;
    nombreCompleto: string;
    correo: string;
    telefono: string;
    especialidad: string;
    cedulaProfesional: string;
    estado: "activo" | "inactivo" | "pendiente";
    totalPacientes: number;
    totalCitas: number;
    createdAt: string;
}

interface Paciente {
    id: string;
    nombreCompleto: string;
    correo: string;
    telefono: string;
    estado: "activo" | "pausado" | "alta";
    psicologoId?: string;
    psicologoNombre?: string;
    ultimaCita?: string;
    createdAt: string;
}

type NavId = "dashboard" | "psicologos" | "pacientes" | "alta";

const ESPECIALIDADES: Record<string, string> = {
    psicologia_clinica: "Psicología Clínica",
    terapia_cognitivo_conductual: "T. Cognitivo Conductual",
    terapia_familiar: "Terapia Familiar",
    terapia_parejas: "Terapia de Parejas",
    psicologia_infantil: "Psicología Infantil",
    manejo_estres: "Manejo del Estrés",
    terapia_duelo: "Terapia de Duelo",
    terapia_ocupacional: "Terapia Ocupacional",
};

// ─── Estilos base ─────────────────────────────────────────────────────────────
const TEAL = "#2a7d6f";
const TEAL_LIGHT = "#e6f5f1";
const TEAL_MID = "#4a9e8e";
const SIDEBAR_W = 220;

const card: React.CSSProperties = {
    background: "white",
    borderRadius: 14,
    border: "1px solid #e8f0ee",
    padding: "20px 22px",
};

const badge = (color: string, bg: string): React.CSSProperties => ({
    display: "inline-block",
    fontSize: "0.68rem",
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 6,
    color,
    background: bg,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
});

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardSU() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState<NavId>("dashboard");

    // Datos
    const [psicologos, setPsicologos] = useState<Psicologo[]>([]);
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

    // Formulario alta psicólogo
    const [form, setForm] = useState({
        nombreCompleto: "",
        correo: "",
        telefono: "",
        especialidad: "psicologia_clinica",
        cedulaProfesional: "",
    });
    const [submitting, setSubmitting] = useState(false);

    // Búsqueda
    const [searchPsi, setSearchPsi] = useState("");
    const [searchPac, setSearchPac] = useState("");

    // ── Auth guard ───────────────────────────────────────────────────────────────
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) { router.replace("/login"); return; }
            // Verificar rol
            const token = await u.getIdTokenResult();
            if (token.claims.role !== "superusuario") {
                router.replace("/dashboard");
                return;
            }
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, [router]);

    // ── Cargar datos al cambiar sección ─────────────────────────────────────────
    useEffect(() => {
        if (loading) return;
        if (active === "dashboard" || active === "psicologos") fetchPsicologos();
        if (active === "dashboard" || active === "pacientes") fetchPacientes();
    }, [active, loading]);

    async function fetchPsicologos() {
        setLoadingData(true);
        try {
            const res = await fetch("/api/psicologos");
            const data = await res.json();
            setPsicologos(data.psicologos ?? []);
        } catch { showToast("Error al cargar psicólogos", "err"); }
        finally { setLoadingData(false); }
    }

    async function fetchPacientes() {
        setLoadingData(true);
        try {
            const res = await fetch("/api/pacientes");
            const data = await res.json();
            setPacientes(data.pacientes ?? []);
        } catch { showToast("Error al cargar pacientes", "err"); }
        finally { setLoadingData(false); }
    }

    function showToast(msg: string, type: "ok" | "err") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    // ── Alta psicólogo ───────────────────────────────────────────────────────────
    async function handleAltaPsicologo(e: React.FormEvent) {
        e.preventDefault();
        if (!form.nombreCompleto || !form.correo || !form.cedulaProfesional) {
            showToast("Completa todos los campos obligatorios", "err");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/psicologos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
            showToast("Psicólogo dado de alta. Se envió correo de acceso.", "ok");
            setForm({ nombreCompleto: "", correo: "", telefono: "", especialidad: "psicologia_clinica", cedulaProfesional: "" });
            setActive("psicologos");
            fetchPsicologos();
        } catch (err: any) {
            showToast(err.message ?? "Error al dar de alta", "err");
        } finally { setSubmitting(false); }
    }

    // ── Cambiar estado psicólogo ─────────────────────────────────────────────────
    async function toggleEstadoPsicologo(id: string, actual: string) {
        const nuevo = actual === "activo" ? "inactivo" : "activo";
        try {
            await fetch(`/api/psicologos/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: nuevo }),
            });
            setPsicologos(ps => ps.map(p => p.id === id ? { ...p, estado: nuevo as any } : p));
            showToast(`Psicólogo ${nuevo === "activo" ? "activado" : "desactivado"}`, "ok");
        } catch { showToast("Error al actualizar estado", "err"); }
    }

    const displayName = user?.displayName || user?.email?.split("@")[0] || "Super Admin";

    // ── Loading screen ───────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f5f4" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 40, height: 40, border: `3px solid ${TEAL_LIGHT}`, borderTopColor: TEAL, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: TEAL, fontFamily: "'Poppins',sans-serif", fontSize: "0.9rem" }}>Verificando acceso...</p>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    // ── Filtros ──────────────────────────────────────────────────────────────────
    const psiFiltered = psicologos.filter(p =>
        p.nombreCompleto.toLowerCase().includes(searchPsi.toLowerCase()) ||
        p.correo.toLowerCase().includes(searchPsi.toLowerCase())
    );
    const pacFiltered = pacientes.filter(p =>
        p.nombreCompleto.toLowerCase().includes(searchPac.toLowerCase()) ||
        p.correo.toLowerCase().includes(searchPac.toLowerCase())
    );

    const totalActivos = psicologos.filter(p => p.estado === "activo").length;
    const totalPacActivos = pacientes.filter(p => p.estado === "activo").length;

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f0f5f4", fontFamily: "'Poppins',sans-serif" }}>

            {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
            <aside style={{ width: SIDEBAR_W, background: "white", borderRight: "1px solid #e2ede9", display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 20 }}>
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 28px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${TEAL_MID},${TEAL})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png" alt="" style={{ width: 22, height: 22, objectFit: "cover", borderRadius: 5 }} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "#1a2e2c" }}>Mente en Calma</p>
                        <p style={{ margin: 0, fontSize: "0.62rem", color: TEAL, fontWeight: 600, letterSpacing: "0.08em" }}>SUPER USUARIO</p>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 10px" }}>
                    {([
                        { id: "dashboard", icon: "⊞", label: "Panel General" },
                        { id: "psicologos", icon: "🩺", label: "Psicólogos" },
                        { id: "pacientes", icon: "👤", label: "Pacientes" },
                        { id: "alta", icon: "➕", label: "Dar de Alta" },
                    ] as { id: NavId; icon: string; label: string }[]).map(item => (
                        <button key={item.id} onClick={() => setActive(item.id)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: active === item.id ? 600 : 400, background: active === item.id ? TEAL_LIGHT : "transparent", color: active === item.id ? TEAL : "#6b7280", borderLeft: `3px solid ${active === item.id ? TEAL : "transparent"}`, transition: "all 0.15s", textAlign: "left" }}>
                            <span style={{ fontSize: "1rem" }}>{item.icon}</span>{item.label}
                        </button>
                    ))}
                </nav>

                {/* User */}
                <div style={{ padding: "14px 16px", borderTop: "1px solid #e2ede9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${TEAL_MID},${TEAL})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", color: "white", fontWeight: 700 }}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: "#1a2e2c" }}>{displayName}</p>
                            <p style={{ margin: 0, fontSize: "0.65rem", color: TEAL, fontWeight: 600 }}>ADMINISTRADOR</p>
                        </div>
                    </div>
                    <button onClick={() => signOut(auth).then(() => router.replace("/login"))}
                        title="Cerrar sesión"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "1.1rem", padding: 4, borderRadius: 6, transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>⇥</button>
                </div>
            </aside>

            {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
            <main style={{ marginLeft: SIDEBAR_W, flex: 1, padding: "28px 32px", maxWidth: "calc(100vw - 220px)" }}>

                {/* Topbar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <div>
                        <h1 style={{ margin: 0, fontWeight: 700, fontSize: "1.3rem", color: "#1a2e2c" }}>
                            {active === "dashboard" && "Panel General"}
                            {active === "psicologos" && "Gestión de Psicólogos"}
                            {active === "pacientes" && "Gestión de Pacientes"}
                            {active === "alta" && "Dar de Alta — Psicólogo"}
                        </h1>
                        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>
                            {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    </div>
                    <button onClick={() => signOut(auth).then(() => router.replace("/login"))}
                        style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #e2ede9", borderRadius: 10, padding: "8px 16px", color: "#374151", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", background: "white", transition: "background 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f0f5f4")}
                        onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                        Cerrar sesión
                    </button>
                </div>

                {/* ── SECCIÓN: DASHBOARD ─────────────────────────────────────────────── */}
                {active === "dashboard" && (
                    <div>
                        {/* Stat cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
                            {[
                                { label: "Psicólogos Activos", value: totalActivos, icon: "🩺", color: TEAL, bg: TEAL_LIGHT },
                                { label: "Pacientes Activos", value: totalPacActivos, icon: "👥", color: "#2563eb", bg: "#eff6ff" },
                                { label: "Total Psicólogos", value: psicologos.length, icon: "📋", color: "#7c3aed", bg: "#f5f3ff" },
                                { label: "Total Pacientes", value: pacientes.length, icon: "📊", color: "#d97706", bg: "#fffbeb" },
                            ].map(s => (
                                <div key={s.label} style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ width: 46, height: 46, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                                        {s.icon}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                                        <p style={{ margin: "3px 0 0", fontSize: "0.74rem", color: "#6b7280" }}>{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tabla rápida psicólogos */}
                        <div style={{ ...card, marginBottom: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1a2e2c" }}>🩺 Psicólogos Recientes</h2>
                                <button onClick={() => setActive("psicologos")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: TEAL, fontWeight: 600 }}>Ver todos →</button>
                            </div>
                            <TablePsicologos psicologos={psicologos.slice(0, 5)} onToggle={toggleEstadoPsicologo} />
                        </div>

                        {/* Tabla rápida pacientes */}
                        <div style={card}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1a2e2c" }}>👤 Pacientes Recientes</h2>
                                <button onClick={() => setActive("pacientes")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: TEAL, fontWeight: 600 }}>Ver todos →</button>
                            </div>
                            <TablePacientes pacientes={pacientes.slice(0, 5)} psicologos={psicologos} />
                        </div>
                    </div>
                )}

                {/* ── SECCIÓN: PSICÓLOGOS ────────────────────────────────────────────── */}
                {active === "psicologos" && (
                    <div style={card}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #d1d5db", borderRadius: 10, padding: "7px 13px" }}>
                                <span style={{ color: "#9ca3af" }}>🔍</span>
                                <input
                                    placeholder="Buscar psicólogo..."
                                    value={searchPsi}
                                    onChange={e => setSearchPsi(e.target.value)}
                                    style={{ border: "none", outline: "none", fontSize: "0.83rem", color: "#374151", width: 200, background: "transparent" }}
                                />
                            </div>
                            <button onClick={() => setActive("alta")}
                                style={{ display: "flex", alignItems: "center", gap: 6, background: `linear-gradient(135deg,${TEAL_MID},${TEAL})`, border: "none", borderRadius: 10, padding: "9px 18px", color: "white", fontWeight: 600, fontSize: "0.83rem", cursor: "pointer" }}>
                                ➕ Nuevo Psicólogo
                            </button>
                        </div>
                        {loadingData ? <LoadingRow /> : <TablePsicologos psicologos={psiFiltered} onToggle={toggleEstadoPsicologo} full />}
                    </div>
                )}

                {/* ── SECCIÓN: PACIENTES ─────────────────────────────────────────────── */}
                {active === "pacientes" && (
                    <div style={card}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #d1d5db", borderRadius: 10, padding: "7px 13px" }}>
                                <span style={{ color: "#9ca3af" }}>🔍</span>
                                <input
                                    placeholder="Buscar paciente..."
                                    value={searchPac}
                                    onChange={e => setSearchPac(e.target.value)}
                                    style={{ border: "none", outline: "none", fontSize: "0.83rem", color: "#374151", width: 200, background: "transparent" }}
                                />
                            </div>
                        </div>
                        {loadingData ? <LoadingRow /> : <TablePacientes pacientes={pacFiltered} psicologos={psicologos} full />}
                    </div>
                )}

                {/* ── SECCIÓN: ALTA PSICÓLOGO ────────────────────────────────────────── */}
                {active === "alta" && (
                    <div style={{ maxWidth: 620 }}>
                        <div style={card}>
                            <p style={{ margin: "0 0 22px", fontSize: "0.85rem", color: "#6b7280" }}>
                                Al dar de alta al psicólogo se creará su cuenta y recibirá un correo con acceso a la plataforma.
                            </p>

                            <form onSubmit={handleAltaPsicologo}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                                    <Field label="Nombre completo *" value={form.nombreCompleto} onChange={v => setForm(f => ({ ...f, nombreCompleto: v }))} placeholder="Ej. Dra. Ana García" />
                                    <Field label="Correo electrónico *" type="email" value={form.correo} onChange={v => setForm(f => ({ ...f, correo: v }))} placeholder="doctor@correo.com" />
                                    <Field label="Teléfono" value={form.telefono} onChange={v => setForm(f => ({ ...f, telefono: v }))} placeholder="+52 000 000 0000" />
                                    <Field label="Cédula profesional *" value={form.cedulaProfesional} onChange={v => setForm(f => ({ ...f, cedulaProfesional: v }))} placeholder="12345678" />
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Especialidad *</label>
                                    <select value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
                                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", background: "white", outline: "none" }}>
                                        {Object.entries(ESPECIALIDADES).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>

                                <button type="submit" disabled={submitting}
                                    style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: submitting ? "#9ca3af" : `linear-gradient(135deg,${TEAL_MID},${TEAL})`, color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: submitting ? "not-allowed" : "pointer", transition: "opacity 0.2s" }}>
                                    {submitting ? "Procesando..." : "✅ Dar de Alta y Enviar Correo"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {/* ── TOAST ────────────────────────────────────────────────────────────── */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 24, right: 24, zIndex: 999,
                    background: toast.type === "ok" ? "#065f46" : "#991b1b",
                    color: "white", borderRadius: 12, padding: "12px 20px",
                    fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    animation: "fadeIn 0.3s ease",
                }}>
                    {toast.type === "ok" ? "✅" : "❌"} {toast.msg}
                </div>
            )}

            <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        * { box-sizing: border-box; }
      `}</style>
        </div>
    );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: "0.85rem", color: "#374151", background: "white", outline: "none", transition: "border 0.2s" }}
                onFocus={e => (e.target.style.borderColor = "#4a9e8e")}
                onBlur={e => (e.target.style.borderColor = "#d1d5db")}
            />
        </div>
    );
}

function TablePsicologos({ psicologos, onToggle, full }: {
    psicologos: Psicologo[]; onToggle: (id: string, estado: string) => void; full?: boolean;
}) {
    if (psicologos.length === 0) return <EmptyState msg="No hay psicólogos registrados." />;

    const cols = full
        ? ["Nombre", "Correo", "Especialidad", "Cédula", "Pacientes", "Citas", "Estado", "Acciones"]
        : ["Nombre", "Especialidad", "Pacientes", "Estado"];

    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                <thead>
                    <tr>
                        {cols.map(c => (
                            <th key={c} style={{ textAlign: "left", padding: "10px 12px", color: "#9ca3af", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.06em", borderBottom: "1px solid #f0f0f0", textTransform: "uppercase" }}>{c}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {psicologos.map((p, i) => (
                        <tr key={p.id} style={{ background: i % 2 === 0 ? "white" : "#fafcfb" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f0f9f7")}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafcfb")}>
                            <td style={{ padding: "12px 12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#e6f5f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#2a7d6f", flexShrink: 0 }}>
                                        {p.nombreCompleto.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                    </div>
                                    <span style={{ fontWeight: 600, color: "#1a2e2c" }}>{p.nombreCompleto}</span>
                                </div>
                            </td>
                            {full && <td style={{ padding: "12px" }}><span style={{ color: "#6b7280" }}>{p.correo}</span></td>}
                            <td style={{ padding: "12px" }}><span style={{ color: "#374151" }}>{ESPECIALIDADES[p.especialidad] ?? p.especialidad}</span></td>
                            {full && <td style={{ padding: "12px" }}><span style={{ color: "#6b7280" }}>{p.cedulaProfesional}</span></td>}
                            <td style={{ padding: "12px", textAlign: "center" }}><span style={{ fontWeight: 700, color: "#2563eb" }}>{p.totalPacientes}</span></td>
                            {full && <td style={{ padding: "12px", textAlign: "center" }}><span style={{ fontWeight: 700, color: "#7c3aed" }}>{p.totalCitas}</span></td>}
                            <td style={{ padding: "12px" }}>
                                <span style={badge(
                                    p.estado === "activo" ? "#065f46" : "#991b1b",
                                    p.estado === "activo" ? "#d1fae5" : "#fee2e2"
                                )}>{p.estado}</span>
                            </td>
                            {full && (
                                <td style={{ padding: "12px" }}>
                                    <button onClick={() => onToggle(p.id, p.estado)}
                                        style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #e2ede9", background: "white", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: p.estado === "activo" ? "#991b1b" : "#065f46", transition: "background 0.2s" }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#f0f5f4")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                                        {p.estado === "activo" ? "Desactivar" : "Activar"}
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TablePacientes({ pacientes, psicologos, full }: {
    pacientes: Paciente[]; psicologos: Psicologo[]; full?: boolean;
}) {
    if (pacientes.length === 0) return <EmptyState msg="No hay pacientes registrados." />;

    const cols = full
        ? ["Paciente", "Correo", "Psicólogo asignado", "Última cita", "Estado"]
        : ["Paciente", "Psicólogo asignado", "Estado"];

    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                <thead>
                    <tr>
                        {cols.map(c => (
                            <th key={c} style={{ textAlign: "left", padding: "10px 12px", color: "#9ca3af", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.06em", borderBottom: "1px solid #f0f0f0", textTransform: "uppercase" }}>{c}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {pacientes.map((p, i) => {
                        const psi = psicologos.find(ps => ps.id === p.psicologoId);
                        return (
                            <tr key={p.id} style={{ background: i % 2 === 0 ? "white" : "#fafcfb" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#f0f9f7")}
                                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafcfb")}>
                                <td style={{ padding: "12px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>
                                            {p.nombreCompleto.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, color: "#1a2e2c" }}>{p.nombreCompleto}</p>
                                            {full && <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{p.correo}</p>}
                                        </div>
                                    </div>
                                </td>
                                {full && <td style={{ padding: "12px", color: "#6b7280" }}>{p.correo}</td>}
                                <td style={{ padding: "12px" }}>
                                    {psi ? (
                                        <span style={{ color: "#2a7d6f", fontWeight: 600 }}>{psi.nombreCompleto}</span>
                                    ) : (
                                        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Sin asignar</span>
                                    )}
                                </td>
                                {full && (
                                    <td style={{ padding: "12px", color: "#6b7280" }}>
                                        {p.ultimaCita ? new Date(p.ultimaCita).toLocaleDateString("es-MX") : "—"}
                                    </td>
                                )}
                                <td style={{ padding: "12px" }}>
                                    <span style={badge(
                                        p.estado === "activo" ? "#065f46" : p.estado === "pausado" ? "#92400e" : "#1e40af",
                                        p.estado === "activo" ? "#d1fae5" : p.estado === "pausado" ? "#fef3c7" : "#dbeafe"
                                    )}>{p.estado}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function LoadingRow() {
    return (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #e2ede9", borderTopColor: "#2a7d6f", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
            Cargando...
        </div>
    );
}

function EmptyState({ msg }: { msg: string }) {
    return (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>{msg}</p>
        </div>
    );
}