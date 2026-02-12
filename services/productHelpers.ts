/**
 * Helper functions for working with the new multi-size Product structure
 */

import { Product } from '../types';

/**
 * Get the reference code for a product (prioritize 70ml, then 30ml, then 15ml)
 */
export function getProductReference(product: Product): string {
  return product.cat_70ml || product.cat_30ml || product.cat_15ml || '';
}

/**
 * Get the primary display price for a product
 * Returns the highest non-zero price
 */
export function getProductPrice(product: Product): number {
  const prices = [product.price_70ml, product.price_30ml, product.price_15ml].filter(p => p > 0);
  return prices.length > 0 ? Math.max(...prices) : 0;
}

/**
 * Get the lowest price for a product
 */
export function getProductLowestPrice(product: Product): number {
  const prices = [product.price_70ml, product.price_30ml, product.price_15ml].filter(p => p > 0);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

/**
 * Get a formatted price range for display (e.g., "11.90€ - 35.00€")
 */
export function getProductPriceRange(product: Product): string {
  const prices = [product.price_70ml, product.price_30ml, product.price_15ml].filter(p => p > 0);

  if (prices.length === 0) return '0.00€';
  if (prices.length === 1) return `${prices[0].toFixed(2)}€`;

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return `${min.toFixed(2)}€`;
  return `${min.toFixed(2)}€ - ${max.toFixed(2)}€`;
}

/**
 * Get available sizes for a product
 */
export function getAvailableSizes(product: Product): Array<'15ml' | '30ml' | '70ml'> {
  const sizes: Array<'15ml' | '30ml' | '70ml'> = [];

  if (product.price_15ml > 0) sizes.push('15ml');
  if (product.price_30ml > 0) sizes.push('30ml');
  if (product.price_70ml > 0) sizes.push('70ml');

  return sizes;
}

/**
 * Get the total stock quantity for a product
 */
export function getProductStock(product: Product): number {
  return product.stock_total;
}

/**
 * Check if a product has low stock
 */
export function isLowStock(product: Product): boolean {
  return product.stock_total <= product.alert_threshold;
}

/**
 * Get stock for a specific size
 */
export function getStockBySize(product: Product, size: '15ml' | '30ml' | '70ml'): number {
  switch (size) {
    case '15ml': return product.stock_15ml;
    case '30ml': return product.stock_30ml;
    case '70ml': return product.stock_70ml;
    default: return 0;
  }
}

/**
 * Get price for a specific size
 */
export function getPriceBySize(product: Product, size: '15ml' | '30ml' | '70ml'): number {
  switch (size) {
    case '15ml': return product.price_15ml;
    case '30ml': return product.price_30ml;
    case '70ml': return product.price_70ml;
    default: return 0;
  }
}

/**
 * Create a cart-compatible product with a selected size
 */
export interface CartProduct extends Product {
  selectedSize: '15ml' | '30ml' | '70ml';
  selectedPrice: number;
}

export function createCartProduct(product: Product, size: '15ml' | '30ml' | '70ml'): CartProduct {
  return {
    ...product,
    selectedSize: size,
    selectedPrice: getPriceBySize(product, size)
  };
}

/**
 * Estimate cost based on selling price (typically 50% margin for luxury perfumes)
 * This is used for profit calculation when cost is not stored
 */
export function estimateProductCost(price: number): number {
  return price * 0.5; // 50% cost, 50% margin
}

/**
 * Get the selling price for a cart item (uses selectedPrice if available, otherwise highest price)
 */
export function getItemPrice(item: any): number {
  return item.selectedPrice || getProductPrice(item);
}

/**
 * Get the estimated cost for a cart item
 */
export function getItemCost(item: any): number {
  return estimateProductCost(getItemPrice(item));
}
