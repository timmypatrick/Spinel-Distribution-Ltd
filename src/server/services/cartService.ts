import crypto from 'crypto';
import { db } from '../db/schema';
import { Cart, CartItem } from '../../types';

export class CartService {
  static getOrCreateCart(cartId?: string, userId?: string): Cart {
    if (cartId && db.carts.has(cartId)) {
      const cart = db.carts.get(cartId)!;
      if (userId && !cart.user_id) {
        cart.user_id = userId;
      }
      return this.recalculateCart(cart);
    }

    // Look up by userId
    if (userId) {
      const userCart = Array.from(db.carts.values()).find(c => c.user_id === userId);
      if (userCart) {
        return this.recalculateCart(userCart);
      }
    }

    const newCart: Cart = {
      id: cartId || crypto.randomUUID(),
      user_id: userId,
      items: [],
      subtotal_usd: 0,
      shipping_usd: 0,
      discount_usd: 0,
      total_usd: 0,
      total_items: 0
    };

    db.carts.set(newCart.id, newCart);
    return newCart;
  }

  static addItem(cartId: string, productId: string, quantity: number, userId?: string): Cart {
    const cart = this.getOrCreateCart(cartId, userId);
    const product = db.products.get(productId);
    if (!product || product.status !== 'ACTIVE') {
      throw new Error('Product not available for purchase');
    }

    const inventory = db.inventory.get(productId);
    const available = inventory ? inventory.quantity_available : product.stock_quantity;
    if (available < 1) {
      throw new Error('This item is currently out of stock');
    }

    const existingIndex = cart.items.findIndex(item => item.product_id === productId);
    const targetQuantity = existingIndex >= 0 ? cart.items[existingIndex].quantity + quantity : quantity;

    if (targetQuantity > available) {
      throw new Error(`Only ${available} unit(s) available in stock`);
    }

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity = targetQuantity;
      cart.items[existingIndex].unit_price_usd = product.price_usd; // Authoritative price from db
      cart.items[existingIndex].total_price_usd = product.price_usd * targetQuantity;
      cart.items[existingIndex].product = product;
    } else {
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        cart_id: cart.id,
        product_id: productId,
        product: product,
        quantity: targetQuantity,
        unit_price_usd: product.price_usd,
        total_price_usd: product.price_usd * targetQuantity
      };
      cart.items.push(newItem);
    }

    return this.recalculateCart(cart);
  }

  static updateQuantity(cartId: string, productId: string, quantity: number, userId?: string): Cart {
    const cart = this.getOrCreateCart(cartId, userId);
    const product = db.products.get(productId);
    if (!product) throw new Error('Product not found');

    if (quantity <= 0) {
      return this.removeItem(cartId, productId, userId);
    }

    const inventory = db.inventory.get(productId);
    const available = inventory ? inventory.quantity_available : product.stock_quantity;
    if (quantity > available) {
      throw new Error(`Only ${available} unit(s) available in stock`);
    }

    const item = cart.items.find(i => i.product_id === productId);
    if (item) {
      item.quantity = quantity;
      item.unit_price_usd = product.price_usd;
      item.total_price_usd = product.price_usd * quantity;
      item.product = product;
    }

    return this.recalculateCart(cart);
  }

  static removeItem(cartId: string, productId: string, userId?: string): Cart {
    const cart = this.getOrCreateCart(cartId, userId);
    cart.items = cart.items.filter(i => i.product_id !== productId);
    return this.recalculateCart(cart);
  }

  static clearCart(cartId: string): Cart {
    const cart = this.getOrCreateCart(cartId);
    cart.items = [];
    return this.recalculateCart(cart);
  }

  public static recalculateCart(cart: Cart): Cart {
    let subtotal = 0;
    let totalItems = 0;

    // Refresh every item with authoritative DB price
    for (const item of cart.items) {
      const liveProduct = db.products.get(item.product_id);
      if (liveProduct) {
        item.product = liveProduct;
        item.unit_price_usd = liveProduct.price_usd;
        item.total_price_usd = liveProduct.price_usd * item.quantity;
        subtotal += item.total_price_usd;
        totalItems += item.quantity;
      }
    }

    cart.subtotal_usd = Math.round(subtotal * 100) / 100;
    cart.shipping_usd = 0.00; // Free shipping rule
    cart.discount_usd = 0.00;
    cart.total_usd = cart.subtotal_usd;
    cart.total_items = totalItems;

    db.carts.set(cart.id, cart);
    return cart;
  }
}
