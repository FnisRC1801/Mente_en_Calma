export type Sexo = "M" | "F";

export interface Paciente {
    uid: string;
    nombre: string;
    email: string;
    sexo: Sexo;
    telefono?: number;  // ← number
    edad: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePacienteInput {
    uid: string;
    nombre: string;
    email: string;
    sexo: Sexo;
    telefono?: number;  // ← number
}
