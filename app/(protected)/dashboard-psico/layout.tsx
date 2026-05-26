// app/(protected)/dashboard-psico/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
    LuLayoutDashboard,
    LuCalendarDays,
    LuUsers,
    LuMessageSquare,
    LuClipboardList,
    LuMenu,
    LuLogOut,
} from "react-icons/lu";

interface Doctor {
    nombre: string;
    especialidad: string;
    consultorio: string;
    fotoUrl?: string;
}

const NAV_ITEMS = [
    { icon: <LuLayoutDashboard size={18} />, label: "Dashboard", href: "/dashboard-psico" },
    { icon: <LuCalendarDays   size={18} />, label: "Mis Citas",  href: "/dashboard-psico/citas" },
    { icon: <LuUsers          size={18} />, label: "Pacientes",  href: "/dashboard-psico/pacientes" },
    { icon: <LuMessageSquare  size={18} />, label: "Mensajes",   href: "/dashboard-psico/mensajes" },
    { icon: <LuClipboardList  size={18} />, label: "Historial",  href: "/dashboard-psico/historial" },
];

export default function DashboardPsicoLayout({ children }: { children: React.ReactNode }) {
    const router   = useRouter();
    const pathname = usePathname();

    const [doctor,      setDoctor]      = useState<Doctor | null>(null);
    const [menuAbierto, setMenuAbierto] = useState(false);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const snap = await getDoc(doc(db, "doctores", user.uid));
            if (snap.exists()) setDoctor(snap.data() as Doctor);
        }
        cargar();

        const handleFotoUpdate = (e: Event) => {
            const { fotoUrl } = (e as CustomEvent).detail;
            setDoctor(prev => prev ? { ...prev, fotoUrl } : null);
        };
        window.addEventListener("doctor-foto-updated", handleFotoUpdate);
        return () => window.removeEventListener("doctor-foto-updated", handleFotoUpdate);
    }, []);

    async function handleCerrarSesion() {
        await signOut(auth);
        await fetch("/api/session", { method: "DELETE" });
        router.push("/login");
    }

    function isActive(href: string) {
        if (href === "/dashboard-psico") return pathname === "/dashboard-psico";
        return pathname.startsWith(href);
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", fontFamily: "'Montserrat', sans-serif", position: "relative", overflowX: "hidden" }}>

            <style>{`
                aside { transition: transform 0.3s ease-in-out; }
                .psico-main { transition: margin-left 0.3s ease-in-out; }
                @media (max-width: 992px) {
                    aside {
                        transform: ${menuAbierto ? "translateX(0)" : "translateX(-100%)"};
                        box-shadow: ${menuAbierto ? "4px 0 24px rgba(0,0,0,0.1)" : "none"};
                    }
                    .psico-main { margin-left: 0 !important; }
                    .btn-hamburguesa { display: flex !important; }
                }
            `}</style>

            {menuAbierto && (
                <div onClick={() => setMenuAbierto(false)}
                    style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", zIndex: 15 }} />
            )}

            {/* Sidebar */}
            <aside style={{ width: 240, background: "white", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", height: "100vh", zIndex: 20 }}>

                {/* Logo */}
                <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src="https://static.vecteezy.com/system/resources/thumbnails/011/653/087/small_2x/psychology-3d-render-icon-illustration-png.png" style={{ height: 36, width: "auto" }} alt="logo" />
                        <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c" }}>
                            Mente en Calma
                        </span>
                    </div>
                    <button className="btn-hamburguesa" onClick={() => setMenuAbierto(false)}
                        style={{ display: "none", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#6b7280" }}>
                        ✕
                    </button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <button key={item.label}
                                onClick={() => { router.push(item.href); setMenuAbierto(false); }}
                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: active ? "#f0f9f7" : "transparent", color: active ? "#2a5f5a" : "#6b7280", fontFamily: "'Montserrat', sans-serif", fontWeight: active ? 600 : 400, fontSize: "0.88rem", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f9fafb"; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                            >
                                <div style={{ display: "flex", alignItems: "center" }}>{item.icon}</div>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Cerrar sesión */}
                <div style={{ padding: "0 12px 8px" }}>
                    <button onClick={handleCerrarSesion}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: "transparent", color: "#dc2626", fontFamily: "'Montserrat', sans-serif", fontWeight: 500, fontSize: "0.88rem", cursor: "pointer", width: "100%", textAlign: "left", transition: "all 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <LuLogOut size={18} />
                        Cerrar sesión
                    </button>
                </div>

                {/* Avatar doctor — click va a perfil */}
                <div onClick={() => router.push("/dashboard-psico/perfil")}
                    style={{ padding: "16px 20px", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "background 0.2s ease" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                    {/* Foto o inicial */}
                    {doctor?.fotoUrl ? (
                        <img
                            src={doctor.fotoUrl}
                            alt="foto perfil"
                            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #e5e7eb" }}
                        />
                    ) : (
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                            {doctor?.nombre?.[0]?.toUpperCase() ?? "D"}
                        </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#1a2e2c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {doctor?.nombre ?? "Cargando..."}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#4a8a85", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Psicólogo
                        </p>
                    </div>
                </div>
            </aside>

            {/* Contenido principal */}
            <div className="psico-main" style={{ marginLeft: 240, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

                {/* Header sticky */}
                <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "14px 32px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 10 }}>
                    <button className="btn-hamburguesa" onClick={() => setMenuAbierto(true)}
                        style={{ display: "none", background: "#f3f4f6", border: "1px solid #e5e7eb", padding: "8px 12px", borderRadius: 8, cursor: "pointer", color: "#374151", alignItems: "center" }}>
                        <LuMenu size={20} />
                    </button>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#1a2e2c" }}>
                        {NAV_ITEMS.find(n => isActive(n.href))?.label ?? "Panel"}
                    </span>
                </div>

                <div style={{ flex: 1 }}>{children}</div>
            </div>
        </div>
    );
}