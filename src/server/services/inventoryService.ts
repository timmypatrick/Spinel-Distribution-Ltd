import crypto from 'crypto';
import { db } from '../db/schema';
import { InventoryItem, InventoryMovement } from '../../types';

export class InventoryService {
  static getInventory(productId: string): InventoryItem | null {
    return db.inventory.get(productId) || null;
  }

  static getAllInventory(): InventoryItem[] {
    return Array.from(db.inventory.values());
  }

  static getMovements(productId?: string): InventoryMovement[] {
    if (productId) {
      return db.inventoryMovements.filter(m => m.product_id === productId);
    }
    return [...db.inventoryMovements].reverse();
  }

  static reserveStock(productId: string, quantity: number, orderId: string): boolean {
    const inv = db.inventory.get(productId);
    const prod = db.products.get(productId);
    if (!inv || !prod) return false;

    if (inv.quantity_available < quantity) {
      return false;
    }

    const previousQty = inv.quantity_on_hand;
    inv.quantity_reserved += quantity;
    inv.quantity_available = inv.quantity_on_hand - inv.quantity_reserved;
    inv.updated_at = new Date().toISOString();

    db.inventoryMovements.push({
      id: crypto.randomUUID(),
      product_id: productId,
      product_name: prod.name,
      sku: prod.sku,
      movement_type: 'RESERVATION',
      quantity_changed: quantity,
      previous_quantity: previousQty,
      new_quantity: inv.quantity_on_hand,
      reference_type: 'order',
      reference_id: orderId,
      reason: `Temporary reservation during checkout order #${orderId}`,
      created_at: new Date().toISOString()
    });

    return true;
  }

  static releaseReservation(productId: string, quantity: number, orderId: string): void {
    const inv = db.inventory.get(productId);
    const prod = db.products.get(productId);
    if (!inv) return;

    inv.quantity_reserved = Math.max(0, inv.quantity_reserved - quantity);
    inv.quantity_available = inv.quantity_on_hand - inv.quantity_reserved;
    inv.updated_at = new Date().toISOString();

    db.inventoryMovements.push({
      id: crypto.randomUUID(),
      product_id: productId,
      product_name: prod?.name,
      sku: prod?.sku,
      movement_type: 'RELEASE',
      quantity_changed: quantity,
      previous_quantity: inv.quantity_on_hand,
      new_quantity: inv.quantity_on_hand,
      reference_type: 'order',
      reference_id: orderId,
      reason: `Released reservation for cancelled/abandoned order #${orderId}`,
      created_at: new Date().toISOString()
    });
  }

  static commitSale(productId: string, quantity: number, orderId: string): void {
    const inv = db.inventory.get(productId);
    const prod = db.products.get(productId);
    if (!inv || !prod) return;

    const prevQty = inv.quantity_on_hand;
    inv.quantity_reserved = Math.max(0, inv.quantity_reserved - quantity);
    inv.quantity_on_hand = Math.max(0, inv.quantity_on_hand - quantity);
    inv.quantity_available = inv.quantity_on_hand - inv.quantity_reserved;
    inv.updated_at = new Date().toISOString();

    // Update product stock_quantity & availability
    prod.stock_quantity = inv.quantity_on_hand;
    if (prod.stock_quantity <= 0) {
      prod.availability = 'OUT_OF_STOCK';
    } else if (prod.stock_quantity <= inv.reorder_threshold) {
      prod.availability = 'LOW_STOCK';
    }
    prod.updated_at = new Date().toISOString();

    db.inventoryMovements.push({
      id: crypto.randomUUID(),
      product_id: productId,
      product_name: prod.name,
      sku: prod.sku,
      movement_type: 'SALE',
      quantity_changed: -quantity,
      previous_quantity: prevQty,
      new_quantity: inv.quantity_on_hand,
      reference_type: 'order',
      reference_id: orderId,
      reason: `Fulfilled sale for confirmed payment order #${orderId}`,
      created_at: new Date().toISOString()
    });
  }

  static adjustStock(productId: string, newQuantity: number, reason: string, userId?: string): InventoryItem {
    const inv = db.inventory.get(productId);
    const prod = db.products.get(productId);
    if (!inv || !prod) throw new Error('Product not found in inventory');

    const previousQty = inv.quantity_on_hand;
    const diff = newQuantity - previousQty;

    inv.quantity_on_hand = Math.max(0, newQuantity);
    inv.quantity_available = Math.max(0, inv.quantity_on_hand - inv.quantity_reserved);
    inv.updated_at = new Date().toISOString();

    prod.stock_quantity = inv.quantity_on_hand;
    prod.availability = inv.quantity_on_hand > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
    prod.updated_at = new Date().toISOString();

    db.inventoryMovements.push({
      id: crypto.randomUUID(),
      product_id: productId,
      product_name: prod.name,
      sku: prod.sku,
      movement_type: 'ADJUSTMENT',
      quantity_changed: diff,
      previous_quantity: previousQty,
      new_quantity: inv.quantity_on_hand,
      reason,
      created_by: userId,
      created_at: new Date().toISOString()
    });

    return inv;
  }
}
