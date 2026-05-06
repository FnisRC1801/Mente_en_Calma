import { Timestamp } from "firebase-admin/firestore";

export type EstadoPsicologo = "activo" | "inactivo" | "pendiente";

export type EspecialidadPsicologo =
    | "psicologia_clinica"
    | "terapia_cognitivo_conductual"
    | "terapia_familiar"
    | "terapia_parejas"
    | "psicologia_infantil"
    | "manejo_estres"
    | "terapia_duelo"
    | "terapia_ocupacional";

export const ESPECIALIDADES_PSICOLOGO_LABELS: Record<EspecialidadPsicologo, string> = {
    psicologia_clinica: "Psicología Clínica",
    terapia_cognitivo_conductual: "Terapia Cognitivo Conductual",
    terapia_familiar: "Terapia Familiar",
    terapia_parejas: "Terapia de Parejas",
    psicologia_infantil: "Psicología Infantil",
    manejo_estres: "Manejo del Estrés",
    terapia_duelo: "Terapia de Duelo",
    terapia_ocupacional: "Terapia Ocupacional",
};

export interface Psicologo {
    id: string;
    userId: string;               // Auth UID (se llena cuando acepta la invitación)
    nombreCompleto: string;
    correo: string;
    telefono: string;
    especialidad: EspecialidadPsicologo;
    cedulaProfesional: string;
    estado: EstadoPsicologo;
    totalPacientes: number;
    totalCitas: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePsicologoInput {
    nombreCompleto: string;
    correo: string;
    telefono: string;
    especialidad: EspecialidadPsicologo;
    cedulaProfesional: string;
}