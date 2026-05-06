import { Timestamp } from "firebase-admin/firestore";
import { CreateProductInput, Product } from "./altas.types";
import { adminDb } from "../firebase-admin";

const COLLETION_NAME = "products";

export async function createProduct(
    input: CreateProductInput,
): Promise<Product> {
    const now = Timestamp.now();

    const productData = {
        name: input.name,
        category: input.category,
        description: input.description,
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await adminDb.collection(COLLETION_NAME).add(productData);

    return {
        id: docRef.id,
        name: productData.name,
        category: productData.category,
        description: productData.description,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
    };
}

export async function getProducts(): Promise<Product[]> {
    const snapshot = await adminDb
        .collection(COLLETION_NAME)
        .orderBy("createdAt", "desc")
        .get();

    const products = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: String(data.name ?? ""),
            category: String(data.category ?? ""),
            description: String(data.description ?? ""),
            createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
            updatedAt: data.updatedAt?.toDate?.().toISOString() ?? "",
        };

    });

    return products;
}