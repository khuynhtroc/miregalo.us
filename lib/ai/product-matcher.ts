import 'server-only';
import { db } from '@/lib/db';
import type { Product, GiftItem } from '@/lib/types';

/**
 * Matches items or topic to our product library.
 * If a product matches, returns the product and attaches its slug to the gift item.
 */
export async function matchProductsForItems(items: GiftItem[]): Promise<GiftItem[]> {
  const { rows: products } = await db.find('products', { eq: { active: true } });
  if (products.length === 0) return items;

  return items.map((item) => {
    const headingLower = item.heading.toLowerCase();
    
    // Find closest matching product
    const matched = products.find((p) => {
      const pNameLower = p.name.toLowerCase();
      return (
        headingLower.includes(pNameLower) ||
        pNameLower.includes(headingLower) ||
        p.tags?.some((t) => headingLower.includes(t.toLowerCase()))
      );
    });

    if (matched) {
      return {
        ...item,
        url: `/go/${matched.slug}/`,
        button_label: item.button_label || 'Ver en Tienda',
        merchant: item.merchant || matched.merchant || 'Miregalo Store',
        price: item.price || matched.price || undefined,
        image: item.image || matched.image || undefined,
      };
    }

    return item;
  });
}

/**
 * Searches the product library by keyword in Spanish or English.
 */
export async function searchProducts(query: string, limit = 5): Promise<Product[]> {
  const { rows } = await db.find('products', {
    search: { fields: ['name', 'notes', 'category', 'merchant'], term: query },
    limit,
  });
  return rows;
}
