import React from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

interface CartDrawerProps {
  onNavigate: (page: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const { cart, isOpen, setIsOpen, updateQuantity, removeItem } = useCart();
  const { formatPrice, currency } = useCurrency();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-5 py-4 bg-[#131921] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-base">Shopping Cart ({cart?.total_items || 0})</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Banner */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Your order qualifies for <strong>FREE International Delivery</strong>!</span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
            {!cart || cart.items.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-800">Your Cart is Empty</p>
                <p className="text-xs text-slate-500 mt-1">Explore our catalogue of 100,000+ enterprise products.</p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('products');
                  }}
                  className="mt-4 px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-full transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex gap-3">
                  <img
                    src={item.product?.image || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80'}
                    alt={item.product?.name || 'Product'}
                    className="w-16 h-16 object-contain bg-slate-50 rounded border border-slate-200 p-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">
                      {item.product?.name}
                    </h4>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      SKU: {item.product?.sku}
                    </div>
                    <div className="text-xs font-bold text-slate-950 mt-1">
                      {formatPrice(item.unit_price_usd)}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-bold text-slate-900 bg-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {cart && cart.items.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-600">Subtotal:</span>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-slate-950">
                    {formatPrice(cart.total_usd)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {currency === 'USD' ? `≈ ${formatPrice(cart.total_usd, 'NGN')}` : `Orig. ${formatPrice(cart.total_usd, 'USD')}`}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('checkout');
                  }}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-full shadow hover:shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('cart');
                  }}
                  className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-full border border-slate-300 transition-colors"
                >
                  View and Edit Cart
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified 256-bit TLS Paystack checkout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
