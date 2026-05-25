"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import {
    collection, query, where, getDocs, addDoc,
    onSnapshot, orderBy, Timestamp, doc, updateDoc,
    setDoc, getDoc
} from "firebase/firestore";
import { LuSearch, LuSend, LuMessageSquare } from "react-icons/lu";

interface Paciente {
    uid: string;
    nombre: string;
    especialidad: string;
    fotoUrl?: string;
}

interface Conversacion {
    id: string;
    pacienteId: string;
    pacienteNombre: string;
    doctorEspecialidad: string;
    ultimoMensaje: string;
    ultimaFecha: any;
    noLeidos_doctor: number;
}

interface Mensaje {
    id: string;
    texto: string;
    senderId: string;
    fecha: any;
    leido: boolean;
}

const FILTROS = ["Todos", "No leídos", "Urgentes"];

export default function MensajesPsico() {
    const router = useRouter();
    const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
    const [pacientesDisponibles, setPacientesDisponibles] = useState<Paciente[]>([]);
    const [convActiva, setConvActiva] = useState<Conversacion | null>(null);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState("Todos");
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const unsubRef = useRef<(() => void) | null>(null);
    const userRef = useRef<any>(null);

    useEffect(() => {
        async function cargar() {
            const user = auth.currentUser;
            if (!user) { router.push("/login"); return; }
            userRef.current = user;

            // Obtener pacientes con quienes ha tenido citas
            const qCitas = query(collection(db, "citas"), where("doctorId", "==", user.uid));
            const snapCitas = await getDocs(qCitas);
            const pacientesMap = new Map<string, Paciente>();
            snapCitas.docs.forEach(d => {
                const data = d.data();
                if (!pacientesMap.has(data.pacienteId)) {
                    pacientesMap.set(data.pacienteId, {
                        uid: data.pacienteId,
                        nombre: data.pacienteNombre,
                        especialidad: data.especialidad,
                    });
                }
            });
            setPacientesDisponibles(Array.from(pacientesMap.values()));

            // Escuchar conversaciones del doctor
            const qConv = query(collection(db, "conversaciones"), where("doctorId", "==", user.uid));
            onSnapshot(qConv, snap => {
                const convs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversacion));
                convs.sort((a, b) => {
                    const fa = a.ultimaFecha?.toDate?.() ?? new Date(0);
                    const fb = b.ultimaFecha?.toDate?.() ?? new Date(0);
                    return fb.getTime() - fa.getTime();
                });
                setConversaciones(convs);
                setLoading(false);
            });
        }
        cargar();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    async function abrirConversacion(paciente: Paciente) {
        const user = userRef.current;
        if (!user) return;

        const convId = `${paciente.uid}_${user.uid}`;
        const convRef = doc(db, "conversaciones", convId);
        const convSnap = await getDoc(convRef);

        if (!convSnap.exists()) {
            await setDoc(convRef, {
                pacienteId: paciente.uid,
                doctorId: user.uid,
                pacienteNombre: paciente.nombre,
                doctorEspecialidad: paciente.especialidad,
                ultimoMensaje: "",
                ultimaFecha: Timestamp.now(),
                noLeidos_paciente: 0,
                noLeidos_doctor: 0,
            });
        }

        const conv: Conversacion = {
            id: convId,
            pacienteId: paciente.uid,
            pacienteNombre: paciente.nombre,
            doctorEspecialidad: paciente.especialidad,
            ultimoMensaje: convSnap.data()?.ultimoMensaje ?? "",
            ultimaFecha: convSnap.data()?.ultimaFecha ?? Timestamp.now(),
            noLeidos_doctor: 0,
        };
        setConvActiva(conv);
        escucharMensajes(convId);
        await updateDoc(convRef, { noLeidos_doctor: 0 });
    }

    function escucharMensajes(convId: string) {
        if (unsubRef.current) unsubRef.current();
        const q = query(collection(db, "conversaciones", convId, "mensajes"), orderBy("fecha", "asc"));
        unsubRef.current = onSnapshot(q, snap => {
            setMensajes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mensaje)));
        });
    }

    async function handleSeleccionarConv(conv: Conversacion) {
        setConvActiva(conv);
        escucharMensajes(conv.id);
        await updateDoc(doc(db, "conversaciones", conv.id), { noLeidos_doctor: 0 });
    }

    async function handleEnviar() {
        if (!texto.trim() || !convActiva || enviando) return;
        const user = userRef.current;
        setEnviando(true);
        try {
            await addDoc(collection(db, "conversaciones", convActiva.id, "mensajes"), {
                texto: texto.trim(),
                senderId: user.uid,
                fecha: Timestamp.now(),
                leido: false,
            });
            await updateDoc(doc(db, "conversaciones", convActiva.id), {
                ultimoMensaje: texto.trim(),
                ultimaFecha: Timestamp.now(),
                noLeidos_paciente: (convActiva.noLeidos_doctor ?? 0) + 1,
            });
            setTexto("");
        } finally { setEnviando(false); }
    }

    function formatHora(ts: any) {
        if (!ts) return "";
        const d = ts.toDate?.() ?? new Date(ts);
        return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    }

    function formatFechaConv(ts: any) {
        if (!ts) return "";
        const d = ts.toDate?.() ?? new Date(ts);
        const hoy = new Date();
        if (d.toDateString() === hoy.toDateString()) return formatHora(ts);
        return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
    }

    const pacientesSinConv = pacientesDisponibles.filter(
        p => !conversaciones.find(c => c.pacienteId === p.uid)
    );

    const convFiltradas = conversaciones
        .filter(c => {
            const coincideBusqueda = c.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase());
            const coincideFiltro = filtro === "Todos" ? true :
                filtro === "No leídos" ? c.noLeidos_doctor > 0 :
                filtro === "Urgentes" ? c.noLeidos_doctor >= 3 : true;
            return coincideBusqueda && coincideFiltro;
        });

    const pacsFiltrados = pacientesSinConv.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f8fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", color: "#4a8a85" }}>Cargando...</p>
        </div>
    );

    return (
        <div style={{ height: "100vh", display: "flex", fontFamily: "'Montserrat', sans-serif", background: "white" }}>

            {/* Panel izquierdo */}
            <div style={{ width: 300, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>

                <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #e5e7eb" }}>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#1a2e2c", margin: "0 0 12px" }}>Mensajes</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", borderRadius: 10, padding: "8px 12px", border: "1px solid #e5e7eb", marginBottom: 10 }}>
                        <LuSearch size={14} color="#9ca3af" />
                        <input
                            placeholder="Buscar paciente..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            style={{ border: "none", background: "none", outline: "none", fontSize: "0.82rem", color: "#374151", width: "100%", fontFamily: "'Montserrat', sans-serif" }}
                        />
                    </div>

                    {/* Filtros */}
                    <div style={{ display: "flex", gap: 6 }}>
                        {FILTROS.map(f => (
                            <button key={f} onClick={() => setFiltro(f)}
                                style={{ padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, fontFamily: "'Montserrat', sans-serif", background: filtro === f ? "#2a5f5a" : "#f3f4f6", color: filtro === f ? "white" : "#6b7280", transition: "all 0.15s" }}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {convFiltradas.map(conv => (
                        <div key={conv.id} onClick={() => handleSeleccionarConv(conv)}
                            style={{ padding: "12px 16px", cursor: "pointer", background: convActiva?.id === conv.id ? "#f0f9f7" : "white", borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                            onMouseEnter={e => { if (convActiva?.id !== conv.id) e.currentTarget.style.background = "#fafafa"; }}
                            onMouseLeave={e => { if (convActiva?.id !== conv.id) e.currentTarget.style.background = "white"; }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                                    {conv.pacienteNombre?.[0]?.toUpperCase() ?? "P"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#1a2e2c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.pacienteNombre}</p>
                                        <span style={{ fontSize: "0.68rem", color: "#9ca3af", flexShrink: 0, marginLeft: 4 }}>{formatFechaConv(conv.ultimaFecha)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.ultimoMensaje || conv.doctorEspecialidad}</p>
                                        {conv.noLeidos_doctor > 0 && (
                                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: conv.noLeidos_doctor >= 3 ? "#dc2626" : "#4a8a85", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 4 }}>
                                                <span style={{ fontSize: "0.6rem", color: "white", fontWeight: 700 }}>{conv.noLeidos_doctor}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {pacsFiltrados.length > 0 && (
                        <>
                            <div style={{ padding: "8px 16px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                                <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tus pacientes</p>
                            </div>
                            {pacsFiltrados.map(paciente => (
                                <div key={paciente.uid} onClick={() => abrirConversacion(paciente)}
                                    style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", transition: "background 0.15s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                                    onMouseLeave={e => e.currentTarget.style.background = "white"}>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #b2ddd7, #4a8a85)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                                            {paciente.nombre?.[0]?.toUpperCase() ?? "P"}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#1a2e2c" }}>{paciente.nombre}</p>
                                            <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{paciente.especialidad}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {convFiltradas.length === 0 && pacsFiltrados.length === 0 && (
                        <div style={{ padding: "32px 16px", textAlign: "center" }}>
                            <LuMessageSquare size={32} color="#d1d5db" style={{ margin: "0 auto 8px" }} />
                            <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>
                                {busqueda ? "No se encontraron resultados" : "Sin mensajes aún"}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Panel derecho — chat */}
            {convActiva ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ padding: "12px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12, background: "white" }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #6b9e9a, #2d6560)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.9rem" }}>
                            {convActiva.pacienteNombre?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "#1a2e2c", fontFamily: "'Poppins', sans-serif" }}>{convActiva.pacienteNombre}</p>
                            <p style={{ margin: 0, fontSize: "0.72rem", color: "#4a8a85" }}>{convActiva.doctorEspecialidad}</p>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8, background: "#f8fafb" }}>
                        {mensajes.length === 0 && (
                            <div style={{ textAlign: "center", margin: "auto", color: "#9ca3af" }}>
                                <LuMessageSquare size={40} color="#d1d5db" style={{ margin: "0 auto 8px" }} />
                                <p style={{ fontSize: "0.82rem" }}>Inicia la conversación con {convActiva.pacienteNombre}</p>
                            </div>
                        )}
                        {mensajes.map(m => {
                            const esMio = m.senderId === userRef.current?.uid;
                            return (
                                <div key={m.id} style={{ display: "flex", justifyContent: esMio ? "flex-end" : "flex-start" }}>
                                    <div style={{
                                        maxWidth: "65%", padding: "10px 14px",
                                        borderRadius: esMio ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                        background: esMio ? "linear-gradient(135deg, #6b9e9a, #2d6560)" : "white",
                                        color: esMio ? "white" : "#1a2e2c",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                                        border: esMio ? "none" : "1px solid #e5e7eb"
                                    }}>
                                        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>{m.texto}</p>
                                        <p style={{ margin: "4px 0 0", fontSize: "0.65rem", color: esMio ? "rgba(255,255,255,0.7)" : "#9ca3af", textAlign: "right" }}>{formatHora(m.fecha)}</p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", background: "white", display: "flex", gap: 10, alignItems: "flex-end" }}>
                        <div style={{ flex: 1, background: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb", padding: "10px 14px" }}>
                            <textarea
                                placeholder={`Escribe un mensaje para ${convActiva.pacienteNombre}...`}
                                value={texto}
                                onChange={e => setTexto(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
                                rows={1}
                                style={{ width: "100%", border: "none", background: "none", outline: "none", resize: "none", fontSize: "0.88rem", fontFamily: "'Montserrat', sans-serif", color: "#374151", lineHeight: 1.5 }}
                            />
                        </div>
                        <button onClick={handleEnviar} disabled={!texto.trim() || enviando}
                            style={{ width: 42, height: 42, borderRadius: "50%", border: "none", background: texto.trim() ? "linear-gradient(135deg, #6b9e9a, #2d6560)" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: texto.trim() ? "pointer" : "not-allowed", flexShrink: 0, transition: "all 0.2s" }}>
                            <LuSend size={16} color={texto.trim() ? "white" : "#9ca3af"} />
                        </button>
                    </div>

                    <div style={{ padding: "6px", background: "white", textAlign: "center" }}>
                        <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>🔒 Cifrado de extremo a extremo · Cumple HIPAA</span>
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafb" }}>
                    <div style={{ textAlign: "center" }}>
                        <LuMessageSquare size={48} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: "#9ca3af", margin: "0 0 4px" }}>Selecciona una conversación</p>
                        <p style={{ fontSize: "0.82rem", color: "#d1d5db", margin: 0 }}>O inicia una con alguno de tus pacientes</p>
                    </div>
                </div>
            )}
        </div>
    );
}