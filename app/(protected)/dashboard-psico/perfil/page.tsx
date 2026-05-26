"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, getDocs, collection, addDoc } from "firebase/firestore"; import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import {
    LuUser, LuMail, LuShield, LuPencil, LuCheck, LuX,
    LuLock, LuCamera, LuPlus, LuTrash2, LuFileText,
    LuExternalLink, LuUpload, LuBrain, LuHeart, LuHeartPulse,
    LuSparkles, LuBaby, LuSmile, LuActivity, LuBookOpen,
    LuUsers, LuStar, LuZap, LuLeaf, LuSun, LuMoon,
} from "react-icons/lu";
import { FaGoogle } from "react-icons/fa";

const ICONOS_DISPONIBLES = [
    { id: "LuBrain", icon: LuBrain, label: "Cerebro" },
    { id: "LuHeart", icon: LuHeart, label: "Corazon" },
    { id: "LuHeartPulse", icon: LuHeartPulse, label: "Pulso" },
    { id: "LuSparkles", icon: LuSparkles, label: "Duelo" },
    { id: "LuBaby", icon: LuBaby, label: "Infantil" },
    { id: "LuSmile", icon: LuSmile, label: "Bienestar" },
    { id: "LuActivity", icon: LuActivity, label: "Actividad" },
    { id: "LuBookOpen", icon: LuBookOpen, label: "Educativa" },
    { id: "LuUsers", icon: LuUsers, label: "Familiar" },
    { id: "LuStar", icon: LuStar, label: "Especial" },
    { id: "LuZap", icon: LuZap, label: "Crisis" },
    { id: "LuLeaf", icon: LuLeaf, label: "Mindfulness" },
    { id: "LuSun", icon: LuSun, label: "Positiva" },
    { id: "LuMoon", icon: LuMoon, label: "Sueno" },
];

const ICONO_DEFAULT = "LuBrain";

function getIconComponent(id: string) {
    return ICONOS_DISPONIBLES.find(i => i.id === id)?.icon ?? LuBrain;
}

interface Especialidad {
    nombre: string;
    descripcion?: string;
    icono: string;
    dirigidoA: "menores" | "adultos" | "ambos";
}

interface Documento {
    nombre: string;
    url: string;
    tipo: string;
    fecha: string;
}

interface Doctor {
    nombre: string;
    email: string;
    telefono?: number;
    sexo?: string;
    gradoEstudios?: string;
    consultorio?: string;
    fotoUrl?: string;
    especialidad: string;
    especialidades?: Especialidad[];
    cedulaArchivo?: string;
    cedulaArchivoNombre?: string;
    cedulaArchivoTipo?: string;
    cedulaUrl?: string;
    documentos?: Documento[];
}

export default function PerfilDoctor() {
    const router = useRouter();
    const fotoInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);  // para documentos nuevos
    const cedulaInputRef = useRef<HTMLInputElement>(null);  // para subir cedula
    const espSelectRef = useRef<HTMLSelectElement>(null);

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [esGoogle, setEsGoogle] = useState(false);
    const [error, setError] = useState("");
    const [exito, setExito] = useState("");
    const [guardando, setGuardando] = useState(false);

    const [editandoNombre, setEditandoNombre] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState("");
    const [editandoTelefono, setEditandoTelefono] = useState(false);
    const [nuevoTelefono, setNuevoTelefono] = useState("");
    const [editandoConsultorio, setEditandoConsultorio] = useState(false);
    const [nuevoConsultorio, setNuevoConsultorio] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [passwordActual, setPasswordActual] = useState("");
    const [passwordNueva, setPasswordNueva] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showEmail, setShowEmail] = useState(false);
    const [nuevoEmail, setNuevoEmail] = useState("");
    const [passwordEmail, setPasswordEmail] = useState("");

    const [showAgregarEsp, setShowAgregarEsp] = useState(false);
    const [modoEsp, setModoEsp] = useState<"existente" | "nueva">("existente");
    const [nuevaEspNombre, setNuevaEspNombre] = useState("");
    const [espSeleccionada, setEspSeleccionada] = useState("");
    const [nuevaEspDesc, setNuevaEspDesc] = useState("");
    const [nuevaEspIcono, setNuevaEspIcono] = useState(ICONO_DEFAULT);
    const [nuevaEspDirigido, setNuevaEspDirigido] = useState<"menores" | "adultos" | "ambos">("ambos");
    const [especialidadesColeccion, setEspecialidadesColeccion] = useState<string[]>([]);

    const [subiendoDoc, setSubiendoDoc] = useState(false);
    const [nombreDoc, setNombreDoc] = useState("");
    const [tipoDoc, setTipoDoc] = useState("Cedula");
    const [subiendoFoto, setSubiendoFoto] = useState(false);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            setEsGoogle(user.providerData.some(p => p.providerId === "google.com"));
            const snap = await getDoc(doc(db, "doctores", user.uid));
            if (snap.exists()) setDoctor(snap.data() as Doctor);
            const espSnap = await getDocs(collection(db, "especialidades"));
            setEspecialidadesColeccion(espSnap.docs.map(d => (d.data() as any).nombre as string).sort());
            setLoading(false);
        }
        cargar();
    }, []);

    function mostrarExito(msg: string) {
        setExito(msg);
        setTimeout(() => setExito(""), 3000);
    }

    async function handleSubirFoto(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { setError("Solo se permiten imagenes."); return; }
        if (file.size > 5 * 1024 * 1024) { setError("Maximo 5 MB."); return; }
        setSubiendoFoto(true); setError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("tipo", "perfil");
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (!data.ok) throw new Error(data.message);
            await updateDoc(doc(db, "doctores", auth.currentUser!.uid), { fotoUrl: data.data.url });
            setDoctor(prev => prev ? { ...prev, fotoUrl: data.data.url } : null);
            window.dispatchEvent(new CustomEvent("doctor-foto-updated", { detail: { fotoUrl: data.data.url } }));
            mostrarExito("Foto actualizada.");
        } catch (e: any) { setError(e.message ?? "Error al subir foto."); }
        finally { setSubiendoFoto(false); }
    }

    async function handleGuardarNombre() {
        if (!nuevoNombre.trim()) return;
        setGuardando(true);
        try {
            await updateDoc(doc(db, "doctores", auth.currentUser!.uid), { nombre: nuevoNombre.trim() });
            setDoctor(prev => prev ? { ...prev, nombre: nuevoNombre.trim() } : null);
            setEditandoNombre(false);
            mostrarExito("Nombre actualizado.");
        } catch { setError("Error al actualizar nombre."); }
        finally { setGuardando(false); }
    }

    async function handleGuardarTelefono() {
        if (!nuevoTelefono.trim()) return;
        setGuardando(true);
        try {
            await updateDoc(doc(db, "doctores", auth.currentUser!.uid), { telefono: Number(nuevoTelefono) });
            setDoctor(prev => prev ? { ...prev, telefono: Number(nuevoTelefono) } : null);
            setEditandoTelefono(false);
            mostrarExito("Telefono actualizado.");
        } catch { setError("Error al actualizar telefono."); }
        finally { setGuardando(false); }
    }

    async function handleGuardarConsultorio() {
        if (!nuevoConsultorio.trim()) return;
        setGuardando(true);
        try {
            await updateDoc(doc(db, "doctores", auth.currentUser!.uid), { consultorio: nuevoConsultorio.trim() });
            setDoctor(prev => prev ? { ...prev, consultorio: nuevoConsultorio.trim() } : null);
            setEditandoConsultorio(false);
            mostrarExito("Consultorio actualizado.");
        } catch { setError("Error al actualizar consultorio."); }
        finally { setGuardando(false); }
    }

    async function handleAgregarEspecialidad() {
        const nombre = modoEsp === "existente"
            ? espSeleccionada.trim()
            : nuevaEspNombre.trim();
        if (!nombre) { setError("Selecciona o escribe una especialidad."); return; }
        const nueva: Especialidad = {
            nombre,
            descripcion: modoEsp === "nueva" ? (nuevaEspDesc.trim() || undefined) : undefined,
            icono: modoEsp === "nueva" ? nuevaEspIcono : ICONO_DEFAULT,
            dirigidoA: modoEsp === "nueva" ? nuevaEspDirigido : "ambos",
        };
        try {
            await updateDoc(doc(db, "doctores", auth.currentUser!.uid), { especialidades: arrayUnion(nueva) });
            setDoctor(prev => prev ? { ...prev, especialidades: [...(prev.especialidades ?? []), nueva] } : null);

            // Si es nueva, agregar también a la colección
            if (modoEsp === "nueva") {
                const yaExiste = especialidadesColeccion.includes(nombre);
                if (!yaExiste) {
                    await addDoc(collection(db, "especialidades"), {
                        nombre,
                        descripcion: nuevaEspDesc.trim() || "",
                        createdAt: new Date(),
                    });
                    setEspecialidadesColeccion(prev => [...prev, nombre].sort());
                }
            }

            setNuevaEspNombre(""); setNuevaEspDesc(""); setNuevaEspIcono(ICONO_DEFAULT); setNuevaEspDirigido("ambos");
            setShowAgregarEsp(false);
            mostrarExito("Especialidad agregada.");
        } catch { setError("Error al agregar especialidad."); }
    }

    async function handleEliminarEspecialidad(esp: Especialidad) {
        try {
            await updateDoc(doc(db, "doctores", auth.currentUser!.uid), { especialidades: arrayRemove(esp) });
            setDoctor(prev => prev ? { ...prev, especialidades: prev.especialidades?.filter(e => e.nombre !== esp.nombre) } : null);
            mostrarExito("Especialidad eliminada.");
        } catch { setError("Error al eliminar especialidad."); }
    }

    async function handleSubirDocumento(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { setError("Maximo 10 MB."); return; }
        if (!nombreDoc.trim()) { setError("Escribe un nombre para el documento."); return; }
        setSubiendoDoc(true); setError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("tipo", "documento");
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (!data.ok) throw new Error(data.message);
            const nuevoDoc: Documento = {
                nombre: nombreDoc.trim(),
                url: data.data.url,
                tipo: tipoDoc,
                fecha: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }),
            };
            await updateDoc(doc(db, "doctores", auth.currentUser!.uid), { documentos: arrayUnion(nuevoDoc) });
            setDoctor(prev => prev ? { ...prev, documentos: [...(prev.documentos ?? []), nuevoDoc] } : null);
            setNombreDoc(""); setTipoDoc("Cedula");
            mostrarExito("Documento subido.");
        } catch (e: any) { setError(e.message ?? "Error al subir documento."); }
        finally { setSubiendoDoc(false); }
    }

    async function handleCambiarPassword() {
        if (!passwordNueva || passwordNueva !== passwordConfirm) { setError("Las contrasenas no coinciden."); return; }
        setGuardando(true);
        try {
            const user = auth.currentUser!;
            const cred = EmailAuthProvider.credential(user.email!, passwordActual);
            await reauthenticateWithCredential(user, cred);
            await updatePassword(user, passwordNueva);
            setShowPassword(false);
            setPasswordActual(""); setPasswordNueva(""); setPasswordConfirm("");
            mostrarExito("Contrasena actualizada.");
        } catch { setError("Contrasena actual incorrecta."); }
        finally { setGuardando(false); }
    }

    async function handleCambiarEmail() {
        if (!nuevoEmail.trim()) return;
        setGuardando(true);
        try {
            const user = auth.currentUser!;
            const cred = EmailAuthProvider.credential(user.email!, passwordEmail);
            await reauthenticateWithCredential(user, cred);
            await updateEmail(user, nuevoEmail.trim());
            await updateDoc(doc(db, "doctores", user.uid), { email: nuevoEmail.trim() });
            setDoctor(prev => prev ? { ...prev, email: nuevoEmail.trim() } : null);
            setShowEmail(false); setNuevoEmail(""); setPasswordEmail("");
            mostrarExito("Correo actualizado.");
        } catch { setError("Contrasena incorrecta o correo invalido."); }
        finally { setGuardando(false); }
    }

    const inputStyle: React.CSSProperties = {
        width: "100%", border: "1px solid #d1d5db", borderRadius: 10,
        padding: "10px 14px", fontSize: "0.9rem", outline: "none",
        fontFamily: "'Montserrat', sans-serif", color: "#111827", boxSizing: "border-box",
    };

    const labelStyle: React.CSSProperties = {
        display: "block", fontSize: "0.72rem", fontWeight: 600,
        color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    const especialidades = doctor?.especialidades ?? [];
    const documentos = doctor?.documentos ?? [];

    // Soporta tanto cedulaUrl (campo viejo) como cedulaArchivo (campo nuevo)
    const urlCedula = doctor?.cedulaArchivo ?? doctor?.cedulaUrl;
    const cedulaPrincipal = urlCedula?.startsWith("https://") ? {
        nombre: doctor?.cedulaArchivoNombre ?? "Cedula profesional",
        url: urlCedula,
        tipo: "Cedula",
        fecha: "Al registrarse",
    } : null;

    return (
        <div style={{ padding: "24px 32px", fontFamily: "'Montserrat', sans-serif", maxWidth: 780, margin: "0 auto" }}>
            <style>{`
                @keyframes spin   { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* Inputs ocultos */}
            <input ref={fotoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleSubirFoto} />

            {exito && <div style={{ background: "#f0f9f7", border: "1px solid #b2ddd7", borderRadius: 10, padding: "10px 16px", color: "#2a5f5a", fontSize: "0.88rem", marginBottom: 16 }}>{exito}</div>}
            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", color: "#dc2626", fontSize: "0.88rem", marginBottom: 16 }}>
                {error}
                <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}>X</button>
            </div>}

            {/* Foto */}
            <div style={{ background: "white", borderRadius: 16, padding: "28px 24px", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ position: "relative" }}>
                    {doctor?.fotoUrl ? (
                        <img src={doctor.fotoUrl} alt="Foto" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid #e5e7eb" }} />
                    ) : (
                        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "2.2rem" }}>
                            {doctor?.nombre?.[0]?.toUpperCase() ?? "D"}
                        </div>
                    )}
                    <button onClick={() => fotoInputRef.current?.click()} disabled={subiendoFoto}
                        style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: "50%", background: "#4a8a85", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        {subiendoFoto
                            ? <div style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            : <LuCamera size={14} color="white" />}
                    </button>
                </div>
                <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#1a2e2c" }}>{doctor?.nombre}</p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#4a8a85", textTransform: "uppercase", letterSpacing: "0.05em" }}>{doctor?.especialidad}</p>
                </div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", textAlign: "center" }}>
                    Solo puedes subir una foto de perfil profesional. No se permiten avatares.
                </p>
            </div>

            {/* Datos personales */}
            <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <LuUser size={18} color="#4a8a85" /> Datos Personales
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <CampoEditable label="Nombre completo" valor={doctor?.nombre ?? ""} editando={editandoNombre} nuevoValor={nuevoNombre} onChange={setNuevoNombre} onEditar={() => { setNuevoNombre(doctor?.nombre ?? ""); setEditandoNombre(true); }} onGuardar={handleGuardarNombre} onCancelar={() => setEditandoNombre(false)} inputStyle={inputStyle} />
                    <div style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 10 }}>
                        <p style={{ ...labelStyle, marginBottom: 4 }}>Correo electronico</p>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "#1a2e2c", fontWeight: 500 }}>{doctor?.email}</p>
                    </div>
                    <CampoEditable label="Telefono" valor={doctor?.telefono ? `+52 ${doctor.telefono}` : "No registrado"} editando={editandoTelefono} nuevoValor={nuevoTelefono} onChange={setNuevoTelefono} onEditar={() => { setNuevoTelefono(String(doctor?.telefono ?? "")); setEditandoTelefono(true); }} onGuardar={handleGuardarTelefono} onCancelar={() => setEditandoTelefono(false)} inputStyle={inputStyle} tipo="number" />
                    <CampoEditable label="Consultorio" valor={doctor?.consultorio ?? "No registrado"} editando={editandoConsultorio} nuevoValor={nuevoConsultorio} onChange={setNuevoConsultorio} onEditar={() => { setNuevoConsultorio(doctor?.consultorio ?? ""); setEditandoConsultorio(true); }} onGuardar={handleGuardarConsultorio} onCancelar={() => setEditandoConsultorio(false)} inputStyle={inputStyle} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                            { label: "Sexo", valor: doctor?.sexo === "M" ? "Masculino" : doctor?.sexo === "F" ? "Femenino" : "-" },
                            { label: "Grado estudios", valor: doctor?.gradoEstudios ?? "-" },
                            
                        ].map(item => (
                            <div key={item.label} style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 10 }}>
                                <p style={{ ...labelStyle, marginBottom: 4 }}>{item.label}</p>
                                <p style={{ margin: 0, fontSize: "0.9rem", color: "#1a2e2c", fontWeight: 500 }}>{item.valor}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Especialidades */}
            <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                        <LuBrain size={18} color="#4a8a85" /> Especialidades
                    </h2>
                    <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setModoEsp("existente"); setShowAgregarEsp(true); setNuevaEspNombre(""); }}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "none", background: "#f0f9f7", color: "#2a5f5a", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                            <LuPlus size={13} /> De la lista
                        </button>
                        <button onClick={() => { setModoEsp("nueva"); setShowAgregarEsp(true); setNuevaEspNombre(""); }}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                            <LuPlus size={13} /> Nueva
                        </button>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#f0f9f7", borderRadius: 10, border: "1px solid #b2ddd7", marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#2d6560", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                        <LuBrain size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", color: "#1a2e2c" }}>{doctor?.especialidad}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#4a8a85" }}>Especialidad principal - Ambos</p>
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "#4a8a85", background: "#e0f4f1", padding: "2px 8px", borderRadius: 10 }}>Principal</span>
                </div>

                {especialidades.map((esp, i) => {
                    const IconComp = getIconComponent(esp.icono);
                    return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                                <IconComp size={16} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", color: "#1a2e2c" }}>{esp.nombre}</p>
                                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textTransform: "capitalize" }}>
                                    Dirigido a: {esp.dirigidoA}{esp.descripcion ? ` - ${esp.descripcion}` : ""}
                                </p>
                            </div>
                            <button onClick={() => handleEliminarEspecialidad(esp)}
                                style={{ padding: "6px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", display: "flex" }}>
                                <LuTrash2 size={14} color="#dc2626" />
                            </button>
                        </div>
                    );
                })}

                {showAgregarEsp && (
                    <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px", border: "1px solid #e5e7eb", marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>

                        {modoEsp === "existente" ? (
                            <div>
                                <label style={labelStyle}>Seleccionar especialidad de la lista</label>
                                <select
                                    value={espSeleccionada}
                                    onChange={e => setEspSeleccionada(e.target.value)}
                                    style={{ ...inputStyle, appearance: "none" as any }}>
                                    <option value="">-- Selecciona una especialidad --</option>
                                    {especialidadesColeccion
                                        .filter(e => e !== doctor?.especialidad && !especialidades.find(x => x.nombre === e))
                                        .map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label style={labelStyle}>Nombre de la especialidad</label>
                                    <input value={nuevaEspNombre} onChange={e => setNuevaEspNombre(e.target.value)} placeholder="Ej. Terapia Cognitivo Conductual" style={inputStyle} />
                                </div>
                                {nuevaEspNombre.trim().length > 0 && (
                                    <div style={{ animation: "fadeIn 0.2s ease" }}>
                                        <label style={labelStyle}>Descripcion (opcional)</label>
                                        <textarea value={nuevaEspDesc} onChange={e => setNuevaEspDesc(e.target.value)} placeholder="Describe brevemente en que consiste..." rows={2} style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
                                    </div>
                                )}
                                <div>
                                    <label style={labelStyle}>Icono</label>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                                        {ICONOS_DISPONIBLES.map(({ id, icon: Icon, label }) => (
                                            <button key={id} type="button" onClick={() => setNuevaEspIcono(id)} title={label}
                                                style={{ padding: "8px", borderRadius: 8, border: `2px solid ${nuevaEspIcono === id ? "#4a8a85" : "#e5e7eb"}`, background: nuevaEspIcono === id ? "#f0f9f7" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Icon size={18} color={nuevaEspIcono === id ? "#2a5f5a" : "#6b7280"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Dirigido a</label>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {(["menores", "adultos", "ambos"] as const).map(op => (
                                            <button key={op} type="button" onClick={() => setNuevaEspDirigido(op)}
                                                style={{ flex: 1, padding: "9px", borderRadius: 8, border: `2px solid ${nuevaEspDirigido === op ? "#4a8a85" : "#e5e7eb"}`, background: nuevaEspDirigido === op ? "#f0f9f7" : "white", cursor: "pointer", fontSize: "0.8rem", fontWeight: nuevaEspDirigido === op ? 600 : 400, color: nuevaEspDirigido === op ? "#2a5f5a" : "#6b7280", textTransform: "capitalize", fontFamily: "'Montserrat', sans-serif" }}>
                                                {op}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { setShowAgregarEsp(false); setNuevaEspNombre(""); setNuevaEspDesc(""); setEspSeleccionada(""); }}
                                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: "0.88rem", color: "#374151", fontWeight: 500 }}>
                                Cancelar
                            </button>
                            <button onClick={handleAgregarEspecialidad}
                                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif", fontSize: "0.88rem" }}>
                                Agregar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Documentos */}
            <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                    <LuFileText size={18} color="#4a8a85" /> Documentos Profesionales
                </h2>
                <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "#9ca3af" }}>Visibles para los pacientes en tu perfil publico.</p>

                {/* Cedula principal */}
                {cedulaPrincipal
                    ? <DocumentoItem doc={cedulaPrincipal} esPrincipal />
                    : documentos.length === 0 && (
                        <div style={{ padding: "12px 16px", background: "#fef9ec", borderRadius: 10, border: "1px solid #fde68a", marginBottom: 12 }}>
                            <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "#92400e" }}>
                                No se encontro cedula profesional. Por favor subela.
                            </p>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                <input
                                    value={nombreDoc}
                                    onChange={e => setNombreDoc(e.target.value)}
                                    placeholder="Nombre del archivo"
                                    style={{ flex: 1, border: "1px solid #fde68a", borderRadius: 8, padding: "7px 10px", fontSize: "0.82rem", outline: "none", fontFamily: "'Montserrat', sans-serif", minWidth: 140 }}
                                />
                                {/* ── Boton cedula usa cedulaInputRef ── */}
                                <div style={{ position: "relative", display: "inline-flex" }}>
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#b45309", color: "white", fontSize: "0.82rem", fontWeight: 600, fontFamily: "'Montserrat', sans-serif", pointerEvents: "none" }}>
                                        <LuUpload size={13} /> Subir cedula
                                    </div>
                                    <input
                                        ref={cedulaInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={e => {
                                            if (!nombreDoc.trim()) setNombreDoc("Cedula profesional");
                                            setTipoDoc("Cedula");
                                            handleSubirDocumento(e);
                                        }}
                                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", fontSize: 0 }}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {documentos.map((d, i) => <DocumentoItem key={i} doc={d} />)}

                {/* Subir nuevo documento */}
                <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px", border: "1px dashed #d1d5db", marginTop: 12 }}>
                    <p style={{ margin: "0 0 12px", fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>Subir nuevo documento</p>
                    <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 160 }}>
                            <label style={labelStyle}>Nombre del documento</label>
                            <input
                                value={nombreDoc}
                                onChange={e => setNombreDoc(e.target.value)}
                                placeholder="Ej. Titulo universitario"
                                style={{ ...inputStyle, padding: "9px 12px" }}
                            />
                        </div>
                        <div style={{ minWidth: 140 }}>
                            <label style={labelStyle}>Tipo</label>
                            <select value={tipoDoc} onChange={e => setTipoDoc(e.target.value)} style={{ ...inputStyle, padding: "9px 12px", appearance: "none" as any }}>
                                {["Cedula", "Titulo", "Certificacion", "Diploma", "Otro"].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* ── Boton documentos usa docInputRef (ref separado) ── */}
                    <div style={{ position: "relative", display: "inline-flex" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: subiendoDoc ? "#9ca3af" : "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontWeight: 600, fontSize: "0.85rem", fontFamily: "'Montserrat', sans-serif", pointerEvents: "none" }}>
                            {subiendoDoc
                                ? <><div style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Subiendo...</>
                                : <><LuUpload size={15} /> Seleccionar archivo</>}
                        </div>
                        <input
                            ref={docInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            disabled={subiendoDoc}
                            onChange={e => {
                                if (!nombreDoc.trim()) { setError("Escribe un nombre para el documento."); return; }
                                handleSubirDocumento(e);
                            }}
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: subiendoDoc ? "not-allowed" : "pointer", fontSize: 0 }}
                        />
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>PDF, imagenes o Word - maximo 10 MB</p>
                </div>
            </div>

            {/* Seguridad */}
            <div style={{ background: "white", borderRadius: 16, padding: "24px", border: "1px solid #e5e7eb" }}>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <LuShield size={18} color="#4a8a85" /> Seguridad y Cuenta
                </h2>

                {esGoogle ? (
                    <div style={{ padding: "16px", background: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FaGoogle size={18} color="#4285F4" />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1a2e2c" }}>Cuenta de Google</p>
                            <p style={{ margin: 0, fontSize: "0.78rem", color: "#9ca3af" }}>Tu sesion esta vinculada a Google. El correo y contrasena se gestionan desde tu cuenta de Google.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: 10 }}>
                            <button onClick={() => setShowEmail(!showEmail)}
                                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <LuMail size={16} color="#6b7280" />
                                    <span style={{ fontSize: "0.9rem", color: "#374151" }}>Cambiar correo</span>
                                </div>
                                <LuPencil size={15} color="#9ca3af" />
                            </button>
                            {showEmail && (
                                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10, padding: "16px", background: "#f9fafb", borderRadius: 10 }}>
                                    <input type="email" placeholder="Nuevo correo" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} style={inputStyle} />
                                    <input type="password" placeholder="Contrasena actual" value={passwordEmail} onChange={e => setPasswordEmail(e.target.value)} style={inputStyle} />
                                    <button onClick={handleCambiarEmail} disabled={guardando}
                                        style={{ padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                                        {guardando ? "Guardando..." : "Actualizar correo"}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <button onClick={() => setShowPassword(!showPassword)}
                                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <LuLock size={16} color="#6b7280" />
                                    <span style={{ fontSize: "0.9rem", color: "#374151" }}>Cambiar contrasena</span>
                                </div>
                                <LuPencil size={15} color="#9ca3af" />
                            </button>
                            {showPassword && (
                                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10, padding: "16px", background: "#f9fafb", borderRadius: 10 }}>
                                    <input type="password" placeholder="Contrasena actual" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} style={inputStyle} />
                                    <input type="password" placeholder="Nueva contrasena" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} style={inputStyle} />
                                    <input type="password" placeholder="Confirmar contrasena" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} style={inputStyle} />
                                    <button onClick={handleCambiarPassword} disabled={guardando}
                                        style={{ padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", color: "white", fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" }}>
                                        {guardando ? "Guardando..." : "Actualizar contrasena"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function CampoEditable({ label, valor, editando, nuevoValor, onChange, onEditar, onGuardar, onCancelar, inputStyle, tipo = "text" }: {
    label: string; valor: string; editando: boolean; nuevoValor: string;
    onChange: (v: string) => void; onEditar: () => void; onGuardar: () => void; onCancelar: () => void;
    inputStyle: React.CSSProperties; tipo?: string;
}) {
    return (
        <div style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: 10 }}>
            {editando ? (
                <div style={{ display: "flex", gap: 8 }}>
                    <input type={tipo} value={nuevoValor} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, padding: "6px 10px" }} autoFocus />
                    <button onClick={onGuardar} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#4a8a85", color: "white", cursor: "pointer" }}><LuCheck size={16} /></button>
                    <button onClick={onCancelar} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}><LuX size={16} /></button>
                </div>
            ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#1a2e2c", fontWeight: 500 }}>{valor}</p>
                    </div>
                    <button onClick={onEditar} style={{ padding: "6px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer" }}><LuPencil size={15} color="#6b7280" /></button>
                </div>
            )}
        </div>
    );
}

function DocumentoItem({ doc, esPrincipal = false }: { doc: { nombre: string; url: string; tipo: string; fecha: string }; esPrincipal?: boolean }) {
    function getUrlAbierta(url: string) {
        if (!url) return url;
        if (url.includes("/raw/upload/")) {
            return url.replace("/raw/upload/", "/raw/upload/fl_attachment:false/");
        }
        return url;
    }
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: esPrincipal ? "#f0f9f7" : "#f9fafb", borderRadius: 10, border: `1px solid ${esPrincipal ? "#b2ddd7" : "#e5e7eb"}`, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: esPrincipal ? "#2d6560" : "#4a8a85", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <LuFileText size={16} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", color: "#1a2e2c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.nombre}</p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{doc.tipo} - {doc.fecha}</p>
            </div>
            {esPrincipal && (
                <span style={{ fontSize: "0.68rem", color: "#4a8a85", background: "#e0f4f1", padding: "2px 8px", borderRadius: 10, flexShrink: 0 }}>
                    Principal
                </span>
            )}
            <a href={getUrlAbierta(doc.url)} target="_blank" rel="noopener noreferrer"
                style={{ padding: "6px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", display: "flex", cursor: "pointer", textDecoration: "none" }}>
                <LuExternalLink size={14} color="#6b7280" />
            </a>
        </div>
    );
}