import { Product, Client } from '../types';

export const GeminiService = {
  generateProductRecommendations: async (client: Client, products: Product[]): Promise<string[]> => {
    return products.slice(0, 3).map(p => p.name);
  },

  generateSalesArguments: async (product: Product): Promise<string> => {
    return `${product.name} - Un excellent produit de la catégorie ${product.category}. Qualité supérieure garantie.`;
  }
};

export async function generateProductRecommendations(client: Client, products: Product[]): Promise<string[]> {
  return GeminiService.generateProductRecommendations(client, products);
}

export async function generateSalesArguments(product: Product): Promise<string> {
  return GeminiService.generateSalesArguments(product);
}
