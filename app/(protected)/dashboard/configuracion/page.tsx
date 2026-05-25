"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
    LuBell, LuBellOff, LuShield,
    LuTrash2, LuChevronRight, LuCheck
} from "react-icons/lu";

interface Config {
    notif_citas: boolean;
    notif_mensajes: boolean;
    notif_estados: boolean;
    privacidad_foto: boolean;
    privacidad_historial: boolean;
}

const DEFAULT_CONFIG: Config = {
    notif_citas: true,
    notif_mensajes: true,
    notif_estados: true,
    privacidad_foto: true,
    privacidad_historial: true,
};

export default function ConfiguracionPaciente() {
    const router = useRouter();
    const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState<string | null>(null);
    const [showEliminar, setShowEliminar] = useState(false);
    const [exito, setExito] = useState("");

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const snap = await getDoc(doc(db, "pacientes", user.uid));
            if (snap.exists()) {
                const data = snap.data();
                if (data.config) setConfig({ ...DEFAULT_CONFIG, ...data.config });
            }
            setLoading(false);
        }
        cargar();
    }, []);

    async function handleToggle(key: keyof Config, value: any) {
        const user = auth.currentUser;
        if (!user) return;
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        setGuardando(key);
        try {
            await updateDoc(doc(db, "pacientes", user.uid), { config: newConfig });
            setExito("Guardado");
            setTimeout(() => setExito(""), 2000);
        } finally { setGuardando(null); }
    }

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", fontFamily: "'Montserrat', sans-serif" }}>

            {/* Modal eliminar cuenta */}
            {showEliminar && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <div style={{ background: "white", borderRadius: 20, padding: "28px", maxWidth: 400, width: "100%", textAlign: "center" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                            <LuTrash2 size={24} color="#dc2626" />
                        </div>
                        <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#1a2e2c", margin: "0 0 8px" }}>¿Eliminar cuenta?</h3>
                        <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 24px", lineHeight: 1.5 }}>
                            Esta acción es irreversible. Se eliminarán todos tus datos, citas e historial médico.
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setShowEliminar(false)}
                                style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>
                                Cancelar
                            </button>
                            <button style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 32px", position: "sticky", top: 0, zIndex: 10 }}>
                <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: 0 }}>Configuración</h1>
                {exito && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.78rem", color: "#2a5f5a", marginLeft: 12 }}>
                        <LuCheck size={14} /> {exito}
                    </span>
                )}
            </div>

            <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Notificaciones */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <LuBell size={18} color="#4a8a85" /> Notificaciones
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                            { key: "notif_citas" as keyof Config, label: "Recordatorio de citas", desc: "Recibe un aviso 24 horas antes de tu cita" },
                            { key: "notif_mensajes" as keyof Config, label: "Mensajes nuevos", desc: "Notificación cuando tu psicólogo te escriba" },
                            { key: "notif_estados" as keyof Config, label: "Cambios de estado", desc: "Cuando una cita sea aceptada, cancelada o modificada" },
                        ].map(item => (
                            <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 12, background: "#f9fafb" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    {config[item.key] ? <LuBell size={16} color="#4a8a85" /> : <LuBellOff size={16} color="#9ca3af" />}
                                    <div>
                                        <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 500, color: "#1a2e2c" }}>{item.label}</p>
                                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>{item.desc}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleToggle(item.key, !config[item.key])}
                                    style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: config[item.key] ? "#4a8a85" : "#d1d5db", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: config[item.key] ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Privacidad */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <LuShield size={18} color="#4a8a85" /> Privacidad
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                            { key: "privacidad_foto" as keyof Config, label: "Mostrar foto de perfil", desc: "Tu foto será visible para tus psicólogos" },
                            { key: "privacidad_historial" as keyof Config, label: "Compartir historial completo", desc: "Permite que tus psicólogos vean todo tu historial" },
                        ].map(item => (
                            <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 12, background: "#f9fafb" }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 500, color: "#1a2e2c" }}>{item.label}</p>
                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>{item.desc}</p>
                                </div>
                                <button onClick={() => handleToggle(item.key, !config[item.key])}
                                    style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: config[item.key] ? "#4a8a85" : "#d1d5db", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: config[item.key] ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cuenta */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <LuShield size={18} color="#4a8a85" /> Cuenta
                    </h2>
                    <button onClick={() => setShowEliminar(true)}
                        style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <LuTrash2 size={16} color="#dc2626" />
                            <div style={{ textAlign: "left" }}>
                                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 500, color: "#dc2626" }}>Eliminar cuenta</p>
                                <p style={{ margin: 0, fontSize: "0.75rem", color: "#f87171" }}>Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <LuChevronRight size={16} color="#dc2626" />
                    </button>
                </div>
            </div>
        </div>
    );
}