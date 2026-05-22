"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut, updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import {
    LuUser, LuMail, LuShield,
    LuPencil, LuCheck, LuX, LuLock,
    LuArrowLeft, LuCamera, LuLogOut
} from "react-icons/lu";
import { FaGoogle } from "react-icons/fa";
import ModalFotoPerfil from "@/components/ModalFotoPerfil";

interface Paciente {
    nombre: string;
    email: string;
    telefono?: number;
    sexo?: string;
    fechaNacimiento?: string;
    edad?: number;
    fotoUrl?: string;
}

export default function PerfilPaciente() {
    const router = useRouter();
    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [loading, setLoading] = useState(true);
    const [esGoogle, setEsGoogle] = useState(false);

    const [editandoNombre, setEditandoNombre] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [editandoTelefono, setEditandoTelefono] = useState(false);
    const [nuevoTelefono, setNuevoTelefono] = useState("");

    const [showCambiarPassword, setShowCambiarPassword] = useState(false);
    const [passwordActual, setPasswordActual] = useState("");
    const [passwordNueva, setPasswordNueva] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const [showCambiarEmail, setShowCambiarEmail] = useState(false);
    const [nuevoEmail, setNuevoEmail] = useState("");
    const [passwordParaEmail, setPasswordParaEmail] = useState("");

    const [error, setError] = useState("");
    const [exito, setExito] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [subiendoFoto, setSubiendoFoto] = useState(false);
    const [showModalFoto, setShowModalFoto] = useState(false);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            const snap = await getDoc(doc(db, "pacientes", user.uid));
            if (snap.exists()) setPaciente(snap.data() as Paciente);
            setEsGoogle(user.providerData.some(p => p.providerId === "google.com"));
            setLoading(false);
        }
        cargar();
    }, []);

    async function handleGuardarNombre() {
        if (!nuevoNombre.trim()) return;
        setGuardando(true);
        try {
            await updateDoc(doc(db, "pacientes", auth.currentUser!.uid), { nombre: nuevoNombre.trim() });
            setPaciente(prev => prev ? { ...prev, nombre: nuevoNombre.trim() } : null);
            setEditandoNombre(false);
            setExito("Nombre actualizado correctamente.");
            setTimeout(() => setExito(""), 3000);
        } catch { setError("Error al actualizar nombre."); }
        finally { setGuardando(false); }
    }

    async function handleGuardarTelefono() {
        if (!nuevoTelefono.trim()) return;
        setGuardando(true);
        try {
            await updateDoc(doc(db, "pacientes", auth.currentUser!.uid), { telefono: Number(nuevoTelefono) });
            setPaciente(prev => prev ? { ...prev, telefono: Number(nuevoTelefono) } : null);
            setEditandoTelefono(false);
            setExito("Teléfono actualizado correctamente.");
            setTimeout(() => setExito(""), 3000);
        } catch { setError("Error al actualizar teléfono."); }
        finally { setGuardando(false); }
    }

    async function handleSubirFoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { setError("Solo se permiten imágenes."); return; }
        if (file.size > 5 * 1024 * 1024) { setError("La imagen no puede superar 5 MB."); return; }
        setSubiendoFoto(true); setError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("tipo", "perfil");
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (!data.ok) throw new Error(data.message);
            await updateDoc(doc(db, "pacientes", auth.currentUser!.uid), { fotoUrl: data.data.url });
            setPaciente(prev => prev ? { ...prev, fotoUrl: data.data.url } : null);
            setShowModalFoto(false);
            setExito("Foto actualizada correctamente.");
            setTimeout(() => setExito(""), 3000);
        } catch (e: any) {
            setError(e.message ?? "Error al subir la foto.");
        } finally { setSubiendoFoto(false); }
    }

    async function handleCambiarPassword() {
        if (!passwordNueva || passwordNueva !== passwordConfirm) {
            setError("Las contraseñas no coinciden."); return;
        }
        setGuardando(true);
        try {
            const user = auth.currentUser!;
            const cred = EmailAuthProvider.credential(user.email!, passwordActual);
            await reauthenticateWithCredential(user, cred);
            await updatePassword(user, passwordNueva);
            setShowCambiarPassword(false);
            setPasswordActual(""); setPasswordNueva(""); setPasswordConfirm("");
            setExito("Contraseña actualizada correctamente.");
            setTimeout(() => setExito(""), 3000);
        } catch { setError("Contraseña actual incorrecta."); }
        finally { setGuardando(false); }
    }

    async function handleCambiarEmail() {
        if (!nuevoEmail.trim()) return;
        setGuardando(true);
        try {
            const user = auth.currentUser!;
            const cred = EmailAuthProvider.credential(user.email!, passwordParaEmail);
            await reauthenticateWithCredential(user, cred);
            await updateEmail(user, nuevoEmail.trim());
            await updateDoc(doc(db, "pacientes", user.uid), { email: nuevoEmail.trim() });
            setPaciente(prev => prev ? { ...prev, email: nuevoEmail.trim() } : null);
            setShowCambiarEmail(false);
            setNuevoEmail(""); setPasswordParaEmail("");
            setExito("Correo actualizado correctamente.");
            setTimeout(() => setExito(""), 3000);
        } catch { setError("Contraseña incorrecta o correo inválido."); }
        finally { setGuardando(false); }
    }

    async function handleCerrarSesion() {
        await signOut(auth);
        await fetch("/api/session", { method: "DELETE" });
        router.push("/login");
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", border: "1px solid #d1d5db", borderRadius: 10,
        padding: "10px 14px", fontSize: "0.9rem", outline: "none",
        fontFamily: "'Montserrat', sans-serif", color: "#111827",
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", fontFamily: "'Montserrat', sans-serif" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Modal foto */}
            {showModalFoto && (
                <ModalFotoPerfil
                    nombreUsuario={paciente?.nombre ?? "P"}
                    subiendoFoto={subiendoFoto}
                    onSubirFoto={handleSubirFoto}
                    onSeleccionar={async (url) => {
                        await updateDoc(doc(db, "pacientes", auth.currentUser!.uid), { fotoUrl: url });
                        setPaciente(prev => prev ? { ...prev, fotoUrl: url } : null);
                        setShowModalFoto(false);
                        setExito("Foto actualizada correctamente.");
                        setTimeout(() => setExito(""), 3000);
                    }}
                    onCerrar={() => setShowModalFoto(false)}
                />
            )}

            {/* Header */}
            <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => router.push("/dashboard")}
                        style={{ padding: "8px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <LuArrowLeft size={18} color="#374151" />
                    </button>
                    <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c", margin: 0 }}>Mi Perfil</h1>
                </div>
                <button onClick={handleCerrarSesion}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: "0.85rem", cursor: "pointer" }}>
                    <LuLogOut size={16} /> Cerrar sesión
                </button>
            </div>

            <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

                {exito && <div style={{ background: "#f0f9f7", border: "1px solid #b2ddd7", borderRadius: 10, padding: "10px 16px", color: "#2a5f5a", fontSize: "0.88rem" }}>✅ {exito}</div>}
                {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", color: "#dc2626", fontSize: "0.88rem" }}>{error}</div>}

                {/* Card foto + nombre */}
                <div style={{ background: "white", borderRadius: 16, padding: "28px 24px", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div style={{ position: "relative" }}>
                        {paciente?.fotoUrl ? (
                            <img src={paciente.fotoUrl} alt="Foto de perfil"
                                style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid #e5e7eb" }} />
                        ) : (
                            <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "2rem" }}>
                                {paciente?.nombre?.[0]?.toUpperCase() ?? "P"}
                            </div>
                        )}
                        <label onClick={() => setShowModalFoto(true)}
                            style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: "50%", background: "#4a8a85", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <LuCamera size={14} color="white" />
                        </label>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c" }}>{paciente?.nombre}</p>
                        <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#4a8a85", textTransform: "uppercase", letterSpacing: "0.05em" }}>Paciente</p>
                    </div>
                </div>

                {/* Datos personales */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <LuUser size={18} color="#4a8a85" /> Datos Personales
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* Nombre */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#f9fafb", borderRadius: 10 }}>
                            {editandoNombre ? (
                                <div style={{ display: "flex", gap: 8, flex: 1 }}>
                                    <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)}
                                        style={{ ...inputStyle, padding: "6px 10px" }} autoFocus />
                                    <button onClick={handleGuardarNombre} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#4a8a85", color: "white", cursor: "pointer" }}>
                                        <LuCheck size={16} />
                                    </button>
                                    <button onClick={() => setEditandoNombre(false)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}>
                                        <LuX size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Nombre</p>
                                        <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#1a2e2c", fontWeight: 500 }}>{paciente?.nombre}</p>
                                    </div>
                                    <button onClick={() => { setNuevoNombre(paciente?.nombre ?? ""); setEditandoNombre(true); }}
                                        style={{ padding: "6px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer" }}>
                                        <LuPencil size={15} color="#6b7280" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Email */}
                        <div style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 10 }}>
                            <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Correo</p>
                            <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#1a2e2c", fontWeight: 500 }}>{paciente?.email}</p>
                        </div>

                        {/* Teléfono */}
                        <div style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 10 }}>
                            {editandoTelefono ? (
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input type="number" value={nuevoTelefono} onChange={e => setNuevoTelefono(e.target.value)}
                                        placeholder="Teléfono" style={{ ...inputStyle, padding: "6px 10px" }} autoFocus />
                                    <button onClick={handleGuardarTelefono} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#4a8a85", color: "white", cursor: "pointer" }}>
                                        <LuCheck size={16} />
                                    </button>
                                    <button onClick={() => setEditandoTelefono(false)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}>
                                        <LuX size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Teléfono</p>
                                        <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#1a2e2c", fontWeight: 500 }}>
                                            {paciente?.telefono ? `+52 ${paciente.telefono}` : "No registrado"}
                                        </p>
                                    </div>
                                    <button onClick={() => { setNuevoTelefono(String(paciente?.telefono ?? "")); setEditandoTelefono(true); }}
                                        style={{ padding: "6px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer" }}>
                                        <LuPencil size={15} color="#6b7280" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Fecha nacimiento y edad */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 10 }}>
                                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fecha de nacimiento</p>
                                <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#1a2e2c", fontWeight: 500 }}>{paciente?.fechaNacimiento ?? "—"}</p>
                            </div>
                            <div style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 10 }}>
                                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Edad</p>
                                <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#1a2e2c", fontWeight: 500 }}>{paciente?.edad ? `${paciente.edad} años` : "—"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seguridad */}
                <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <LuShield size={18} color="#4a8a85" /> Seguridad y Cuenta
                    </h2>

                    <div style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 10, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                        {esGoogle ? <FaGoogle size={16} color="#4285F4" /> : <LuMail size={16} color="#6b7280" />}
                        <div>
                            <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Método de inicio de sesión</p>
                            <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#1a2e2c", fontWeight: 500 }}>{esGoogle ? "Google" : "Correo y contraseña"}</p>
                        </div>
                    </div>

                    {!esGoogle && (
                        <div style={{ marginBottom: 12 }}>
                            <button onClick={() => setShowCambiarEmail(!showCambiarEmail)}
                                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <LuMail size={16} color="#6b7280" />
                                    <span style={{ fontSize: "0.9rem", color: "#374151" }}>Cambiar correo</span>
                                </div>
                                <LuPencil size={15} color="#9ca3af" />
                            </button>
                            {showCambiarEmail && (
                                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10, padding: "16px", background: "#f9fafb", borderRadius: 10 }}>
                                    <input type="email" placeholder="Nuevo correo" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} style={inputStyle} />
                                    <input type="password" placeholder="Contraseña actual" value={passwordParaEmail} onChange={e => setPasswordParaEmail(e.target.value)} style={inputStyle} />
                                    <button onClick={handleCambiarEmail} disabled={guardando}
                                        style={{ padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontWeight: 600, cursor: "pointer" }}>
                                        {guardando ? "Guardando..." : "Actualizar correo"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {!esGoogle && (
                        <div>
                            <button onClick={() => setShowCambiarPassword(!showCambiarPassword)}
                                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <LuLock size={16} color="#6b7280" />
                                    <span style={{ fontSize: "0.9rem", color: "#374151" }}>Cambiar contraseña</span>
                                </div>
                                <LuPencil size={15} color="#9ca3af" />
                            </button>
                            {showCambiarPassword && (
                                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10, padding: "16px", background: "#f9fafb", borderRadius: 10 }}>
                                    <input type="password" placeholder="Contraseña actual" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} style={inputStyle} />
                                    <input type="password" placeholder="Nueva contraseña" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} style={inputStyle} />
                                    <input type="password" placeholder="Confirmar nueva contraseña" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} style={inputStyle} />
                                    <button onClick={handleCambiarPassword} disabled={guardando}
                                        style={{ padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontWeight: 600, cursor: "pointer" }}>
                                        {guardando ? "Guardando..." : "Actualizar contraseña"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}