import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../firebase-admin";
import { Doctor, CreateDoctorInput, Sexo } from "./doctor.types";

const COLLECTION = "doctores";

export async function createDoctor(input: CreateDoctorInput): Promise<Doctor> {
    const now = Timestamp.now();
    const data = {
        nombre: input.nombre,
        email: input.email,
        sexo: input.sexo,
        telefono: input.telefono,  // ← agregar
        especialidad: input.especialidad,
        consultorio: input.consultorio,
        activo: true,
        createdAt: now,
        updatedAt: now,
    };
    await adminDb.collection(COLLECTION).doc(input.uid).set(data);
    return {
        uid: input.uid,
        nombre: data.nombre,
        email: data.email,
        sexo: data.sexo,
        telefono: data.telefono,
        especialidad: data.especialidad,
        consultorio: data.consultorio,
        activo: data.activo,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
    };
}

export async function getDoctorByUid(uid: string): Promise<Doctor | null> {
    const doc = await adminDb.collection(COLLECTION).doc(uid).get();
    if (!doc.exists) return null;
    return mapDocToDoctor(doc);
}

export async function getAllDoctores(): Promise<Doctor[]> {
    const snap = await adminDb
        .collection(COLLECTION)
        .where("activo", "==", true)
        .get();
    return snap.docs.map(mapDocToDoctor);
}

function mapDocToDoctor(doc: FirebaseFirestore.DocumentSnapshot): Doctor {
    const d = doc.data()!;
    return {
        uid: doc.id,
        nombre: String(d.nombre ?? ""),
        email: String(d.email ?? ""),
        sexo: (d.sexo ?? "M") as Sexo,
        especialidad: String(d.especialidad ?? ""),
        consultorio: String(d.consultorio ?? ""),
        activo: Boolean(d.activo ?? true),
        telefono: Number(d.telefono ?? 0),  // ← agregar
        createdAt: d.createdAt?.toDate?.().toISOString() ?? "",
        updatedAt: d.updatedAt?.toDate?.().toISOString() ?? "",
    };

}

