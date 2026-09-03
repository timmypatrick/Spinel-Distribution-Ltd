import React, { useState, useEffect } from 'react';
import { 
  Star, Truck, ShieldCheck, Check, ShoppingCart, 
  ArrowLeft, RefreshCw, Cpu, Award, Zap, Share2 
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface ProductDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, onBack, onNavigate }) => {
  const { formatPrice, currency } = useCurrency();
  const { addItem } = useCart();
  const { success, error } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [adding, setAdding] = useState<boolean>(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const data = await api.getProduct(slug);
        setProduct(data.product);
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      success(`Added ${quantity} unit(s) of "${product.name}" to cart`);
    } catch (err: unknown) {
      error((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      await addItem(product.id, quantity);
      onNavigate('checkout');
    } catch (err: unknown) {
      error((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading enterprise product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Product not found</h2>
        <p className="text-xs text-slate-500">The requested equipment could not be found or has been discontinued.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 font-bold text-xs rounded-lg shadow"
        >
          Return to Catalogue
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="bg-[#eaeded] min-h-screen pb-16">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto flex items-center gap-2">
          <button onClick={onBack} className="hover:text-amber-700 font-medium flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to results</span>
          </button>
          <span>/</span>
          <span className="text-slate-700">{product.category_name}</span>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-md">{product.name}</span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Product Image Showcase */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative w-full aspect-square bg-slate-50 rounded-xl border border-slate-200 p-6 flex items-center justify-center overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                />
                <span className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {product.condition}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-slate-50 border border-slate-200 rounded-lg p-2 cursor-pointer hover:border-amber-500 flex items-center justify-center"
                  >
                    <img
                      src={product.image}
                      alt={`Thumbnail ${i + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Middle: Product Specifications & Details */}
            <div className="lg:col-span-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-800 font-bold uppercase tracking-wider mb-1">
                  <span>{product.brand_name || 'Enterprise'}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">{product.sku}</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-950 leading-snug">
                  {product.name}
                </h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'fill-slate-200 text-slate-200'}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-800">{product.rating.toFixed(1)} out of 5</span>
                <span className="text-xs text-slate-400">({product.review_count} ratings)</span>
              </div>

              {/* Price Block */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-950">
                    {formatPrice(product.price_usd)}
                  </span>
                  {product.compare_at_price_usd && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatPrice(product.compare_at_price_usd)}
                    </span>
                  )}
                </div>

                {/* Secondary currency conversion */}
                <div className="text-xs text-slate-500 mt-0.5">
                  {currency === 'USD' ? (
                    <span>Equivalent to ≈ <strong>{formatPrice(product.price_usd, 'NGN')}</strong></span>
                  ) : (
                    <span>Original price: <strong>{formatPrice(product.price_usd, 'USD')}</strong></span>
                  )}
                </div>

                <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  <span>FREE International Freight included with this unit</span>
                </div>
              </div>

              {/* Technical Description */}
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-1.5">Overview</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Technical Specifications Table */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <h3 className="font-bold text-sm text-slate-900 mb-2">Technical Specifications</h3>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden text-xs">
                    {Object.entries(product.specifications).map(([key, val], idx) => (
                      <div
                        key={key}
                        className={`flex py-2 px-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                      >
                        <span className="w-1/3 font-semibold text-slate-500">{key}</span>
                        <span className="w-2/3 text-slate-900 font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Amazon "Buy Box" */}
            <div className="lg:col-span-3">
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 shadow-sm space-y-4 sticky top-20 text-xs">
                <div>
                  <div className="text-2xl font-black text-slate-950">
                    {formatPrice(product.price_usd)}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {currency === 'USD' ? `≈ ${formatPrice(product.price_usd, 'NGN')}` : `Orig. ${formatPrice(product.price_usd, 'USD')}`}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>FREE Delivery</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Dispatched within 24 hours via DHL Express
                  </div>
                </div>

                <div>
                  {isOutOfStock ? (
                    <span className="text-rose-600 font-bold text-sm">Currently Out of Stock</span>
                  ) : (
                    <div>
                      <span className="text-emerald-800 font-extrabold text-sm block">In Stock</span>
                      <span className="text-slate-500 text-[11px]">
                        Available: {product.stock_quantity} units
                      </span>
                    </div>
                  )}
                </div>

                {!isOutOfStock && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Quantity:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      {[...Array(Math.min(10, product.stock_quantity))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || adding}
                    className={`w-full py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-[0.99] ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{adding ? 'Adding...' : 'Add to Cart'}</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className={`w-full py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-[0.99] ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Buy Now</span>
                  </button>
                </div>

                {/* Fulfillment Details */}
                <div className="border-t border-slate-200 pt-3 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ships from</span>
                    <span className="font-semibold text-slate-800">SPINEL DISTRIBUTION</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sold by</span>
                    <span className="font-semibold text-slate-800">SPINEL DISTRIBUTION</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Returns</span>
                    <span className="font-semibold text-slate-800">30-day enterprise replacement</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Warranty</span>
                    <span className="font-semibold text-slate-800">{product.warranty || 'OEM 1-Year'}</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Paystack transaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
