// app/(public)/singup/VerificandoCorreo.tsx
"use client";

import { useEffect } from "react";
import { Timestamp, doc, setDoc, collection, addDoc } from "firebase/firestore";
import { LuMail } from "react-icons/lu";

interface VerificandoProps {
    email: string;
    auth: any;
    router: any;
    setError: (msg: string) => void;
    error: string;
    tipo: "paciente" | "doctor";
    name: string;
    sexo: string;
    fechaNacimiento: string;
    telefono: number | "";
    especialidad: string;
    otraEspecialidad: string;
    otraDescripcion: string;
    gradoEstudios: string;
    consultorio: string;
    cedulaFile: File | null;
    db: any;
    calcularEdad: (fecha: string) => number;
}

export default function VerificandoCorreo({
    email, auth, router, setError, error, tipo, name, sexo,
    fechaNacimiento, telefono, especialidad, otraEspecialidad,
    otraDescripcion, gradoEstudios, consultorio, cedulaFile, db, calcularEdad
}: VerificandoProps) {

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user: any) => {
            if (user) {
                const intervalo = setInterval(async () => {
                    try {
                        await user.reload();

                        if (user.emailVerified) {
                            clearInterval(intervalo);
                            const now = Timestamp.now();
                            const hackEspecialidad = especialidad === "otra" ? otraEspecialidad.trim() : especialidad;

                            if (tipo === "paciente") {
                                await setDoc(doc(db, "pacientes", user.uid), {
                                    nombre: name.trim(),
                                    email: email.trim(),
                                    sexo,
                                    fechaNacimiento,
                                    edad: calcularEdad(fechaNacimiento),
                                    telefono: Number(telefono),
                                    role: "paciente",
                                    emailVerificado: true,
                                    createdAt: now,
                                    updatedAt: now,
                                });
                            } else {
                                if (especialidad === "otra" && otraEspecialidad.trim()) {
                                    await addDoc(collection(db, "especialidades"), {
                                        nombre: otraEspecialidad.trim(),
                                        descripcion: otraDescripcion.trim(),
                                        createdAt: now,
                                    });
                                }
                                const cedulaFormData = new FormData();
                                cedulaFormData.append("file", cedulaFile!);
                                cedulaFormData.append("tipo", "cedula");

                                const cedulaRes = await fetch("/api/upload", {
                                    method: "POST",
                                    body: cedulaFormData,
                                });
                                const cedulaData = await cedulaRes.json();
                                const cedulaUrl = cedulaData.data.url;

                                await setDoc(doc(db, "doctores", user.uid), {
                                    nombre: name.trim(),
                                    email: email.trim(),
                                    sexo,
                                    telefono: Number(telefono),
                                    especialidad: hackEspecialidad,
                                    gradoEstudios,
                                    consultorio: consultorio.trim(),
                                    cedulaUrl,
                                    cedulaArchivoNombre: cedulaFile!.name,
                                    cedulaArchivoTipo: cedulaFile!.type,
                                    role: "psicologo",
                                    activo: true,
                                    emailVerificado: true,
                                    createdAt: now,
                                    updatedAt: now,
                                });
                            }

                            const token = await user.getIdToken();
                            await fetch("/api/session", {
                                method: "POST",
                                body: JSON.stringify({ token }),
                                headers: { "Content-Type": "application/json" },
                            });

                            const roleRes = await fetch("/api/auth/verify-role");
                            const { role } = await roleRes.json();
                            if (role === "psicologo") router.push("/dashboard-psico");
                            else router.push("/dashboard");
                        }
                    } catch (e: any) {
                        setError(e.message ?? "Error al guardar datos.");
                    }
                }, 3000);

                return () => clearInterval(intervalo);
            }
        });

        return () => unsubscribe();
    }, [auth, router, db, tipo, name, email, sexo, fechaNacimiento, telefono, especialidad, otraEspecialidad, otraDescripcion, gradoEstudios, consultorio, cedulaFile]);

    return (
        <div className="relative min-h-screen" style={{ background: "linear-gradient(to bottom, #5f817d, #0f1e33)" }}>
            <div className="flex items-center justify-center min-h-screen px-4">
                <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0f9f7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <LuMail size={28} color="#4a8a85" />
                    </div>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#1a2e2c", margin: "0 0 12px" }}>
                        ¡Verifica tu correo!
                    </h2>
                    <p style={{ fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.6, margin: "0 0 8px" }}>Te enviamos un correo de verificación a:</p>
                    <p style={{ fontSize: "0.95rem", color: "#2a5f5a", fontWeight: 600, margin: "0 0 16px" }}>{email}</p>
                    <p style={{ fontSize: "0.85rem", color: "#9ca3af", lineHeight: 1.5, margin: "0 0 16px" }}>Una vez que verifiques tu correo serás redirigido automáticamente al Inicio.</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#4a8a85", fontSize: "0.85rem", margin: "0 0 20px" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4a8a85" }} />
                        Esperando verificación...
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#9ca3af", lineHeight: 1.4, margin: "0 0 12px", fontStyle: "italic" }}>(Si no ves el correo, revisa tu carpeta de spam)</p>
                    {error && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px", marginTop: 16 }}>
                            <p style={{ margin: 0, fontSize: "0.82rem", color: "#dc2626" }}>{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}