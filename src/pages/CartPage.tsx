import React from 'react';
import { ShoppingCart, Trash2, ArrowRight, Truck, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

interface CartPageProps {
  onNavigate: (page: string) => void;
  onSelectProduct: (slug: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate, onSelectProduct }) => {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const { formatPrice, currency } = useCurrency();

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="bg-[#eaeded] min-h-screen pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <button
          onClick={() => onNavigate('products')}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-amber-800 font-semibold mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        {isEmpty ? (
          <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-4">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Your Shopping Cart is Empty</h2>
            <p className="text-xs text-slate-500">
              Discover over 100,000+ enterprise networking, server, and solar infrastructure items available for immediate freight dispatch.
            </p>
            <button
              onClick={() => onNavigate('products')}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-full shadow transition-all"
            >
              Explore Catalogue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Items Box */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-950">Shopping Cart</h1>
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Deselect all items
                </button>
              </div>

              {/* Free shipping check */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2.5 text-xs text-emerald-900">
                <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Part of your order qualifies for <strong>FREE International Delivery</strong>. Select this option at checkout.
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-5 first:pt-0 flex gap-4">
                    <img
                      src={item.product?.image || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80'}
                      alt={item.product?.name}
                      onClick={() => item.product?.slug && onSelectProduct(item.product.slug)}
                      className="w-24 h-24 object-contain p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-amber-500 transition-colors shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3
                          onClick={() => item.product?.slug && onSelectProduct(item.product.slug)}
                          className="text-sm font-semibold text-slate-900 hover:text-amber-700 cursor-pointer line-clamp-2 leading-snug"
                        >
                          {item.product?.name}
                        </h3>
                        <div className="text-right pl-4">
                          <div className="text-base font-bold text-slate-950">
                            {formatPrice(item.total_price_usd)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatPrice(item.unit_price_usd)} each
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 font-mono mt-1">
                        SKU: {item.product?.sku}
                      </div>

                      <div className="text-xs text-emerald-700 font-semibold mt-1">
                        In Stock • Free International Freight
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-bold text-slate-900 bg-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-slate-300">|</span>

                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-4 text-right">
                <span className="text-sm text-slate-600">
                  Subtotal ({cart.total_items} items):{' '}
                </span>
                <span className="text-xl font-black text-slate-950">
                  {formatPrice(cart.total_usd)}
                </span>
              </div>
            </div>

            {/* Right Summary Box */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 sticky top-20">
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-slate-600">Subtotal ({cart.total_items} items):</span>
                  <span className="text-xl font-black text-slate-950">{formatPrice(cart.total_usd)}</span>
                </div>
                <div className="text-xs text-slate-500 text-right">
                  {currency === 'USD' ? `≈ ${formatPrice(cart.total_usd, 'NGN')}` : `Orig. ${formatPrice(cart.total_usd, 'USD')}`}
                </div>
                <div className="flex justify-between text-xs text-emerald-700 font-semibold border-b border-slate-100 pb-3">
                  <span>Shipping:</span>
                  <span>FREE</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('checkout')}
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-full shadow hover:shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Paystack Bank-Grade Payment Security</span>
                </div>
                <p>
                  Prices recalculated and locked server-side during checkout. Instant invoices generated upon payment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
