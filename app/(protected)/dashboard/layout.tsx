"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
    LuLayoutDashboard, LuCalendarDays, LuMessageSquare,
    LuClipboardList, LuSettings, LuMenu, LuLogOut
} from "react-icons/lu";

interface Paciente {
    nombre: string;
    email: string;
    sexo: string;
    fotoUrl?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const ocultarSidebar = pathname === "/dashboard/nueva-cita";
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [menuAbierto, setMenuAbierto] = useState(false);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const snap = await getDoc(doc(db, "pacientes", user.uid));
            if (snap.exists()) setPaciente(snap.data() as Paciente);
        }
        cargar();
    }, []);

    async function handleCerrarSesion() {
        await signOut(auth);
        await fetch("/api/session", { method: "DELETE" });
        router.push("/login");
    }

    const NAV_ITEMS = [
        { icon: <LuLayoutDashboard size={18} />, label: "Inicio", ruta: "/dashboard" },
        { icon: <LuCalendarDays size={18} />, label: "Mis Citas", ruta: "/dashboard/mis-citas" },
        { icon: <LuMessageSquare size={18} />, label: "Mensajes", ruta: "/dashboard/mensajes" },
        { icon: <LuClipboardList size={18} />, label: "Historial Médico", ruta: "/dashboard/historial" },
        { icon: <LuSettings size={18} />, label: "Configuración", ruta: "/dashboard/configuracion" },
    ];

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", fontFamily: "'Montserrat', sans-serif", position: "relative", overflowX: "hidden" }}>

            <style>{`
                aside { transition: transform 0.3s ease-in-out; }
                main { transition: margin-left 0.3s ease-in-out; }
                @media (max-width: 992px) {
                    aside {
                        transform: ${menuAbierto ? "translateX(0)" : "translateX(-100%)"};
                        box-shadow: ${menuAbierto ? "4px 0 24px rgba(0,0,0,0.1)" : "none"};
                    }
                    main { margin-left: 0 !important; }
                    .btn-hamburguesa { display: flex !important; }
                }
            `}</style>

            {/* Overlay móvil */}
            {menuAbierto && (
                <div onClick={() => setMenuAbierto(false)}
                    style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", zIndex: 15 }} />
            )}

            {/* Sidebar */}
            <aside style={{ width: 240, background: "white", borderRight: "1px solid #e5e7eb", display: ocultarSidebar ? "none" : "flex", flexDirection: "column", padding: "20px 0", position: "fixed", height: "100vh", zIndex: 20 }}>
                {/* Logo */}
                <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png" style={{ height: 36, width: "auto" }} />
                        <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c" }}>Mente en Calma</span>
                    </div>
                    <button className="btn-hamburguesa" onClick={() => setMenuAbierto(false)}
                        style={{ display: "none", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#6b7280" }}>✕</button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                    {NAV_ITEMS.map(item => {
                        const activo = pathname === item.ruta;
                        return (
                            <button key={item.label} onClick={() => { router.push(item.ruta); setMenuAbierto(false); }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "10px 12px", borderRadius: 10, border: "none",
                                    background: activo ? "#f0f9f7" : "transparent",
                                    color: activo ? "#2a5f5a" : "#6b7280",
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontWeight: activo ? 600 : 400,
                                    fontSize: "0.88rem", cursor: "pointer", textAlign: "left",
                                    transition: "all 0.15s"
                                }}>
                                {item.icon}
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Cerrar sesión */}
                <button onClick={handleCerrarSesion}
                    style={{
                        display: "flex", alignItems: "center", gap: 10,
                        margin: "0 12px 12px", padding: "10px 12px", borderRadius: 10,
                        border: "none", background: "transparent",
                        color: "#dc2626", fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600, fontSize: "0.88rem", cursor: "pointer",
                        textAlign: "left", transition: "all 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <LuLogOut size={18} />
                    Cerrar sesión
                </button>

                {/* Usuario */}
                <div onClick={() => router.push("/dashboard/perfil")}
                    style={{ padding: "16px 20px", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "background 0.2s ease" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {paciente?.fotoUrl ? (
                        <img src={paciente.fotoUrl} alt="foto"
                            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #e5e7eb" }} />
                    ) : (
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                            {paciente?.nombre?.[0]?.toUpperCase() ?? "P"}
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#1a2e2c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{paciente?.nombre}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#4a8a85", textTransform: "uppercase", letterSpacing: "0.05em" }}>Paciente</p>
                    </div>
                </div>
            </aside>

            {/* Contenido */}
            <main style={{ marginLeft: ocultarSidebar ? 0 : 240, flex: 1, minWidth: 0 }}>
                {/* Botón hamburguesa móvil */}
                <div className="btn-hamburguesa" style={{ display: "none", padding: "12px 16px", background: "white", borderBottom: "1px solid #e5e7eb" }}>
                    <button onClick={() => setMenuAbierto(true)}
                        style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", padding: "8px 12px", borderRadius: 8, cursor: "pointer", color: "#374151", display: "flex", alignItems: "center" }}>
                        <LuMenu size={20} />
                    </button>
                </div>
                {children}
            </main>
        </div>
    );
}