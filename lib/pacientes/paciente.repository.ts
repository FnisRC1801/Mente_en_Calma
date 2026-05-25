import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../firebase-admin";
import { Paciente, CreatePacienteInput, Sexo } from "./paciente.types";

const COLLECTION = "pacientes";

export async function createPaciente(
    input: CreatePacienteInput,
): Promise<Paciente> {
    const now = Timestamp.now();
    const data = {
        nombre: input.nombre,
        email: input.email,
        sexo: input.sexo,
        telefono: input.telefono ?? 0,
        createdAt: now,
        updatedAt: now,
    };
    // El uid de Auth ES el id del documento.
    await adminDb.collection(COLLECTION).doc(input.uid).set(data);
    return {
        uid: input.uid,
        nombre: data.nombre,
        email: data.email,
        sexo: data.sexo,
        telefono: data.telefono,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
    };
}

export async function getPacienteByUid(uid: string): Promise<Paciente | null> {
    const doc = await adminDb.collection(COLLECTION).doc(uid).get();
    if (!doc.exists) return null;
    const d = doc.data()!;
    return {
    uid: doc.id,
    nombre: String(d.nombre ?? ""),
    email: String(d.email ?? ""),
    sexo: (d.sexo ?? "M") as Sexo,
    telefono: Number(d.telefono ?? 0),
    fotoUrl: d.fotoUrl ? String(d.fotoUrl) : undefined,   // 👈 agrega
    createdAt: d.createdAt?.toDate?.().toISOString() ?? "",
    updatedAt: d.updatedAt?.toDate?.().toISOString() ?? "",
};    
}
