export type Sexo = "M" | "F" | "N/A";

export interface Paciente {
    uid: string;
    nombre: string;
    email: string;
    sexo: Sexo;
    telefono?: number;
    edad?: number;       // 👈 agrega el ?
    fotoUrl?: string;    // 👈 agrega esta línea
    createdAt: string;
    updatedAt: string;
}

export interface CreatePacienteInput {
    uid: string;
    nombre: string;
    email: string;
    sexo: Sexo;
    telefono?: number;
    edad: number;
    fechaNacimiento: Date; 
}
