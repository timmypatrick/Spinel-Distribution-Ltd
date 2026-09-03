import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart, CartItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { user } = useAuth();

  const initCart = async () => {
    let cartId = localStorage.getItem('spinel_cart_id');
    if (!cartId) {
      cartId = `cart_${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem('spinel_cart_id', cartId);
    }

    try {
      const data = await api.getCart(cartId);
      setCart(data.cart);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initCart();
  }, [user]);

  const refreshCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data.cart);
    } catch (err) {
      console.error('Failed to refresh cart:', err);
    }
  };

  const addItem = async (productId: string, quantity: number = 1) => {
    setLoading(true);
    try {
      const data = await api.addToCart(productId, quantity);
      setCart(data.cart);
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    setLoading(true);
    try {
      const data = await api.updateCartQuantity(productId, quantity);
      setCart(data.cart);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    setLoading(true);
    try {
      const data = await api.removeFromCart(productId);
      setCart(data.cart);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      const data = await api.clearCart();
      setCart(data.cart);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, isOpen, setIsOpen, addItem, updateQuantity, removeItem, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
