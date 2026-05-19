import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../firebase-admin";
import { Cita, CreateCitaInput, EstadoCita } from "./cita.types";

const COLLECTION = "citas";

export async function createCita(input: CreateCitaInput): Promise<Cita> {
    const now = Timestamp.now();
    const data = {
        pacienteId: input.pacienteId,
        pacienteNombre: input.pacienteNombre,
        pacienteSexo: input.pacienteSexo,
        doctorId: input.doctorId,
        doctorNombre: input.doctorNombre,
        doctorSexo: input.doctorSexo,
        especialidad: input.especialidad,
        fecha: input.fecha,
        hora: input.hora,
        lugar: input.lugar,
        estado: (input.estado ?? "PENDIENTE") as EstadoCita,
        notas: input.notas ?? "",
        createdAt: now,
        updatedAt: now,
    };
    const ref = await adminDb.collection(COLLECTION).add(data);
    return {
        id: ref.id,
        pacienteId: data.pacienteId,
        pacienteNombre: data.pacienteNombre,
        pacienteSexo: data.pacienteSexo,
        doctorId: data.doctorId,
        doctorNombre: data.doctorNombre,
        doctorSexo: data.doctorSexo,
        especialidad: data.especialidad,
        fecha: data.fecha,
        hora: data.hora,
        lugar: data.lugar,
        estado: data.estado,
        notas: data.notas,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
    };
}

export async function getCitasByPaciente(pacienteId: string): Promise<Cita[]> {
    const snap = await adminDb
        .collection(COLLECTION)
        .where("pacienteId", "==", pacienteId)
        .get();
    return snap.docs.map(mapDoc).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export async function getCitasByDoctor(doctorId: string): Promise<Cita[]> {
    const snap = await adminDb
        .collection(COLLECTION)
        .where("doctorId", "==", doctorId)
        .get();
    return snap.docs.map(mapDoc).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export async function updateCitaEstado(
    citaId: string,
    estado: EstadoCita,
): Promise<void> {
    await adminDb.collection(COLLECTION).doc(citaId).update({
        estado,
        updatedAt: Timestamp.now(),
    });
}

function mapDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): Cita {
    const d = doc.data();
    return {
        id: doc.id,
        pacienteId: String(d.pacienteId ?? ""),
        pacienteNombre: String(d.pacienteNombre ?? ""),
        pacienteSexo: (d.pacienteSexo ?? "M") as "M" | "F",
        doctorId: String(d.doctorId ?? ""),
        doctorNombre: String(d.doctorNombre ?? ""),
        doctorSexo: (d.doctorSexo ?? "M") as "M" | "F",
        especialidad: String(d.especialidad ?? ""),
        fecha: String(d.fecha ?? ""),
        hora: String(d.hora ?? ""),
        lugar: String(d.lugar ?? ""),
        estado: (d.estado ?? "PENDIENTE") as EstadoCita,
        notas: String(d.notas ?? ""),
        createdAt: d.createdAt?.toDate?.().toISOString() ?? "",
        updatedAt: d.updatedAt?.toDate?.().toISOString() ?? "",
    };
}
