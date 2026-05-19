import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const tipo = formData.get("tipo") as string ?? "imagen";

        if (!file) {
            return NextResponse.json({ ok: false, message: "No se recibió ningún archivo." }, { status: 400 });
        }

        // Validar tipo
        const esImagen = file.type.startsWith("image/");
        const esPDF = file.type === "application/pdf";

        if (!esImagen && !esPDF) {
            return NextResponse.json({ ok: false, message: "Solo se permiten imágenes o PDFs." }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: tipo === "cedula" ? "cedulas" : "perfiles",
                    resource_type: esPDF ? "raw" : "image",
                },
                (error, result) => {
                    if (error) { reject(error); return; }
                    resolve(result);
                }
            ).end(buffer);
        });

        return NextResponse.json({
            ok: true,
            message: "Archivo subido exitosamente.",
            data: {
                url: result.secure_url,
                publicId: result.public_id,
            }
        });

    } catch (error) {
        console.error("Error al subir archivo:", error);
        return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
    }
}