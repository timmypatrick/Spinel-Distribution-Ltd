import crypto from 'crypto';
import { db } from '../db/schema';
import { Product, Category, Brand, ProductFilterParams, CatalogueStats } from '../../types';
import { InventoryService } from './inventoryService';

export class ProductService {
  // Public search: Section 10: "The public website MUST NOT display the total number of products in the catalogue."
  static getPublicProducts(params: ProductFilterParams): {
    products: Product[];
    page: number;
    limit: number;
    hasMore: boolean;
  } {
    const result = db.queryProducts(params);
    return {
      products: result.products,
      page: result.page,
      limit: result.limit,
      hasMore: result.page < result.totalPages
    };
  }

  // Admin search: Displays exact counts, aggregates, inactive & archived items
  static getAdminProducts(params: ProductFilterParams): {
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    let result = Array.from(db.products.values());

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    if (params.category_id) {
      result = result.filter(p => p.category_id === params.category_id);
    }

    if (params.brand_id) {
      result = result.filter(p => p.brand_id === params.brand_id);
    }

    if (params.availability) {
      result = result.filter(p => p.availability === params.availability);
    }

    // Sort by latest
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = result.length;
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = result.slice((page - 1) * limit, page * limit);

    return {
      products: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  static getProductBySlug(slug: string): Product | null {
    return Array.from(db.products.values()).find(p => p.slug === slug && p.status === 'ACTIVE') || null;
  }

  static getProductById(id: string): Product | null {
    return db.products.get(id) || null;
  }

  static getCategories(): Category[] {
    return Array.from(db.categories.values()).filter(c => c.is_active);
  }

  static getBrands(): Brand[] {
    return Array.from(db.brands.values()).filter(b => b.is_active);
  }

  static getCatalogueStats(): CatalogueStats {
    return db.getCatalogueStats();
  }

  static createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count'>, userId?: string): Product {
    // Check SKU uniqueness
    const existingSku = Array.from(db.products.values()).find(p => p.sku.toLowerCase() === data.sku.toLowerCase().trim());
    if (existingSku) {
      throw new Error(`Product with SKU "${data.sku}" already exists`);
    }

    const id = crypto.randomUUID();
    const cat = db.categories.get(data.category_id);
    const brand = data.brand_id ? db.brands.get(data.brand_id) : undefined;

    const newProduct: Product = {
      ...data,
      id,
      category_name: cat?.name || 'General',
      brand_name: brand?.name,
      rating: 5.0,
      review_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.products.set(id, newProduct);

    // Initialize inventory item
    db.inventory.set(id, {
      product_id: id,
      product_name: newProduct.name,
      sku: newProduct.sku,
      quantity_on_hand: newProduct.stock_quantity,
      quantity_reserved: 0,
      quantity_available: newProduct.stock_quantity,
      reorder_threshold: 10,
      warehouse_location: 'Main Distribution Hub - Zone B',
      last_counted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Record inventory movement
    db.inventoryMovements.push({
      id: crypto.randomUUID(),
      product_id: id,
      product_name: newProduct.name,
      sku: newProduct.sku,
      movement_type: 'INITIAL',
      quantity_changed: newProduct.stock_quantity,
      previous_quantity: 0,
      new_quantity: newProduct.stock_quantity,
      reference_type: 'product_creation',
      reason: 'Manual product creation via admin',
      created_by: userId,
      created_at: new Date().toISOString()
    });

    // Audit log
    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: userId,
      action: 'PRODUCT_CREATED',
      entity: 'products',
      entity_id: id,
      metadata: { sku: newProduct.sku, name: newProduct.name, price_usd: newProduct.price_usd },
      created_at: new Date().toISOString()
    });

    return newProduct;
  }

  static updateProduct(id: string, updates: Partial<Product>, userId?: string): Product {
    const existing = db.products.get(id);
    if (!existing) throw new Error('Product not found');

    const prevPrice = existing.price_usd;
    const prevStock = existing.stock_quantity;

    const updated: Product = {
      ...existing,
      ...updates,
      id,
      updated_at: new Date().toISOString()
    };

    db.products.set(id, updated);

    // Check if stock changed
    if (updates.stock_quantity !== undefined && updates.stock_quantity !== prevStock) {
      InventoryService.adjustStock(id, updates.stock_quantity, 'Manual stock update via admin product editor', userId);
    }

    // Audit log
    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: userId,
      action: 'PRODUCT_UPDATED',
      entity: 'products',
      entity_id: id,
      metadata: {
        price_changed: updates.price_usd !== undefined && updates.price_usd !== prevPrice,
        prevPrice,
        newPrice: updates.price_usd,
        prevStock,
        newStock: updates.stock_quantity
      },
      created_at: new Date().toISOString()
    });

    return updated;
  }

  static deleteProduct(id: string, userId?: string): boolean {
    const p = db.products.get(id);
    if (!p) return false;

    // Archive or remove
    p.status = 'ARCHIVED';
    p.availability = 'DISCONTINUED';
    p.updated_at = new Date().toISOString();

    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: userId,
      action: 'PRODUCT_ARCHIVED',
      entity: 'products',
      entity_id: id,
      metadata: { sku: p.sku },
      created_at: new Date().toISOString()
    });

    return true;
  }
}
