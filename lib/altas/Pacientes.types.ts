import { Timestamp } from "firebase-admin/firestore";

export type EstadoPaciente = "activo" | "pausado" | "alta";
export type EstadoCita = "pendiente" | "aceptada" | "rechazada" | "completada" | "cancelada";
export type TipoSolicitante = "paciente" | "tutor";

export type Especialidad =
    | "cita_general"
    | "cita_prueba"
    | "terapia_parejas"
    | "terapia_familiar"
    | "terapia_ocupacional"
    | "terapia_educativa"
    | "terapia_duelo"
    | "terapia_clinica"
    | "psicologia_infantil"
    | "evaluacion_emocional"
    | "terapia_adolescentes"
    | "control_ansiedad"
    | "manejo_estres";

export const ESPECIALIDADES_LABELS: Record<Especialidad, string> = {
    cita_general: "Cita General",
    cita_prueba: "Cita de Prueba",
    terapia_parejas: "Terapia de Parejas",
    terapia_familiar: "Terapia Familiar",
    terapia_ocupacional: "Terapia Ocupacional",
    terapia_educativa: "Terapia Educativa",
    terapia_duelo: "Terapia de Duelo",
    terapia_clinica: "Terapia Clínica",
    psicologia_infantil: "Psicología Infantil",
    evaluacion_emocional: "Evaluación Emocional",
    terapia_adolescentes: "Terapia para Adolescentes",
    control_ansiedad: "Control de Ansiedad",
    manejo_estres: "Manejo del Estrés",
};

// ─── Paciente ────────────────────────────────────────────────────────────────

export interface Paciente {
    id: string;
    userId: string;                 // Auth UID del paciente
    nombreCompleto: string;
    correo: string;
    telefono: string;
    fechaNacimiento: string;        // ISO date
    tipoSolicitante: TipoSolicitante;
    // Si es tutor:
    nombreTutor?: string;
    // Relación con psicólogo (se asigna al aceptar la primera cita)
    psicologoId?: string;
    estado: EstadoPaciente;
    ultimaCita?: string;            // ISO date
    createdAt: string;
    updatedAt: string;
}

export interface CreatePacienteInput {
    userId: string;
    nombreCompleto: string;
    correo: string;
    telefono: string;
    fechaNacimiento: string;
    tipoSolicitante: TipoSolicitante;
    nombreTutor?: string;
}

// ─── Cita ─────────────────────────────────────────────────────────────────────

export interface Cita {
    id: string;
    pacienteId: string;
    pacienteNombre: string;
    pacienteCorreo: string;
    psicologoId: string;            // Al crear la cita el paciente elige psicólogo
    especialidad: Especialidad;
    motivoConsulta: string;
    fechaSolicitada?: string;       // ISO datetime (puede no estar aún)
    estado: EstadoCita;
    consultorio?: string;
    notas?: string;                 // Notas del psicólogo
    createdAt: string;
    updatedAt: string;
}

export interface CreateCitaInput {
    pacienteId: string;
    pacienteNombre: string;
    pacienteCorreo: string;
    psicologoId: string;
    especialidad: Especialidad;
    motivoConsulta: string;
    fechaSolicitada?: string;
}