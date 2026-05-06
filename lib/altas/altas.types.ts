export interface Product {
    id: string;
    name: string;
    category: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductInput {
    name: string;
    category: string;
    description: string;
}