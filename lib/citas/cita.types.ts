export type EstadoCita = "PENDIENTE" | "ACEPTADA" | "COMPLETADA" | "CANCELADA";

export interface Cita {
    id: string;
    // Paciente (denormalizado para evitar joins)
    pacienteId: string;
    pacienteNombre: string;
    pacienteSexo: "M" | "F";
    // Doctor
    doctorId: string;
    doctorNombre: string;
    doctorSexo: "M" | "F";
    especialidad: string;
    // Detalles de la cita
    fecha: string;
    hora: string;
    lugar: string;
    estado: EstadoCita;
    notas?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCitaInput {
    pacienteId: string;
    pacienteNombre: string;
    pacienteSexo: "M" | "F";
    doctorId: string;
    doctorNombre: string;
    doctorSexo: "M" | "F";
    especialidad: string;
    fecha: string;
    hora: string;
    lugar: string;
    estado?: EstadoCita;
    notas?: string;
}
