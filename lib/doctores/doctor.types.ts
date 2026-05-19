export type Sexo = "M" | "F";

export interface Doctor {
    uid: string;
    nombre: string;
    email: string;
    sexo: Sexo;
    telefono: number;   // ← agregar
    especialidad: string;
    consultorio: string;
    activo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDoctorInput {
    uid: string;
    nombre: string;
    email: string;
    sexo: Sexo;
    telefono: number;   // ← agregar
    especialidad: string;
    consultorio: string;
}