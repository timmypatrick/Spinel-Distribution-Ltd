import React, { useState } from 'react';
import { Star, ShoppingCart, Check, ShieldCheck } from 'lucide-react';
import { Product } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface ProductCardProps {
  product: Product;
  onSelect: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { currency, formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { success, error } = useToast();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock_quantity < 1) return;

    setAdding(true);
    try {
      await addItem(product.id, 1);
      success(`Added "${product.name}" to cart`);
    } catch (err: unknown) {
      error((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const isOutOfStock = product.stock_quantity <= 0 || product.availability === 'OUT_OF_STOCK';

  return (
    <div
      onClick={() => onSelect(product.slug)}
      className="group bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden cursor-pointer h-full"
    >
      {/* Product Image Container */}
      <div className="relative pt-[80%] w-full bg-slate-50 overflow-hidden border-b border-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {product.condition === 'NEW' && (
          <span className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">
            FACTORY SEALED
          </span>
        )}

        {product.compare_at_price_usd && product.compare_at_price_usd > product.price_usd && (
          <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
            SAVE {Math.round(((product.compare_at_price_usd - product.price_usd) / product.compare_at_price_usd) * 100)}%
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-semibold text-amber-800 uppercase tracking-wider">{product.brand_name || 'Enterprise'}</span>
            <span className="text-slate-400 font-mono text-[10px]">{product.sku}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-slate-900 font-semibold text-sm line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors mb-1.5">
            {product.name}
          </h3>

          {/* Ratings */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'fill-slate-200 text-slate-200'}`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-700">{product.rating.toFixed(1)}</span>
            <span className="text-[11px] text-slate-400">({product.review_count})</span>
          </div>

          {/* Pricing */}
          <div className="mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-950">
                {formatPrice(product.price_usd)}
              </span>
              {product.compare_at_price_usd && (
                <span className="text-xs text-slate-400 line-through">
                  {formatPrice(product.compare_at_price_usd)}
                </span>
              )}
            </div>

            {/* Secondary currency preview */}
            <div className="text-[11px] text-slate-500 font-medium">
              {currency === 'USD' ? (
                <span>≈ {formatPrice(product.price_usd, 'NGN')}</span>
              ) : (
                <span>Orig. {formatPrice(product.price_usd, 'USD')}</span>
              )}
            </div>
          </div>

          {/* Free shipping & delivery note */}
          <div className="text-[11px] text-slate-600 mb-3 space-y-0.5">
            <div className="font-medium text-emerald-700 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>FREE Delivery by Spinel Logistics</span>
            </div>
            <div className="text-slate-500">
              {isOutOfStock ? (
                <span className="text-rose-600 font-bold">Currently Out of Stock</span>
              ) : (
                <span className="text-emerald-800 font-semibold">In Stock ({product.stock_quantity} available)</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Add to Cart button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          className={`w-full py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-amber-400 hover:bg-amber-500 text-slate-950 hover:shadow active:scale-[0.99]'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{adding ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
};
