import React from 'react';
import { 
  Server, Shield, Cpu, Zap, ArrowRight, CheckCircle2, 
  Truck, Award, RefreshCw, BarChart2, Star 
} from 'lucide-react';
import { Category, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useCurrency } from '../context/CurrencyContext';

interface HomePageProps {
  categories: Category[];
  featuredProducts: Product[];
  onSelectCategory: (catId: string) => void;
  onSelectProduct: (slug: string) => void;
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  featuredProducts,
  onSelectCategory,
  onSelectProduct,
  onNavigate
}) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="bg-[#eaeded] min-h-screen pb-16">
      {/* Enterprise Hero Banner */}
      <div className="relative bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white overflow-hidden">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-12 md:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Authorized Tier-1 OEM Distributor</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                Enterprise Hardware & Power Distribution at Global Scale
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Direct procurement of Cisco, Dell, Huawei, APC, and Schneider enterprise networking, 
                high-density servers, and solar power infrastructure. Fully backed by genuine OEM warranties, 
                free global shipping, and Paystack secure payment processing.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => onNavigate('products')}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-lg shadow-lg hover:shadow-xl flex items-center gap-2 transition-all"
                >
                  <span>Explore Catalogue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('tests')}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <BarChart2 className="w-4 h-4 text-sky-400" />
                  <span>View System Architecture & QA</span>
                </button>
              </div>

              {/* Guarantees Bar */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/60 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% Genuine OEM Equipment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Free Freight to Nigeria & Global</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Dual Currency (USD & NGN)</span>
                </div>
              </div>
            </div>

            {/* Featured Hardware Hero Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm relative">
                <div className="absolute top-4 right-4 bg-amber-400 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase">
                  Featured Deployment
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-400/10 rounded-xl text-amber-400">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base leading-tight">Cisco Catalyst 9300-48P</h2>
                    <p className="text-slate-400 text-xs">48-Port PoE+ Enterprise Switch</p>
                  </div>
                </div>

                <div className="h-44 bg-slate-950/80 rounded-xl overflow-hidden mb-4 p-4 flex items-center justify-center border border-slate-800">
                  <img
                    src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80"
                    alt="Cisco Catalyst 9300"
                    className="max-h-full object-contain filter drop-shadow-md"
                  />
                </div>

                <div className="flex items-baseline justify-between border-t border-slate-800 pt-3">
                  <div>
                    <div className="text-xs text-slate-400">Enterprise Price</div>
                    <div className="text-2xl font-black text-white">{formatPrice(4850)}</div>
                  </div>
                  <button
                    onClick={() => onNavigate('products')}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg transition-colors"
                  >
                    View Specs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 -mt-6 relative z-20 space-y-8">
        {/* Amazon-style Category Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.slice(0, 4).map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                onNavigate('products');
              }}
              className="bg-white rounded-lg p-5 shadow hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between border border-slate-200"
            >
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-3">{cat.name}</h3>
                <div className="h-36 bg-slate-50 rounded-md overflow-hidden mb-4 flex items-center justify-center border border-slate-100 p-2">
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80'}
                    alt={cat.name}
                    className="max-h-full object-contain"
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                <span>Shop now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          ))}
        </div>

        {/* Featured Hardware Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Featured Enterprise Hardware</h2>
              <p className="text-xs text-slate-500 mt-0.5">Top-tier datacenter, switching, and solar inverter solutions in stock</p>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
            >
              <span>View full catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {featuredProducts.slice(0, 5).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </div>

        {/* Value Proposition Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-50 rounded-lg text-amber-600 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Complimentary Global Freight</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enjoy 100% free door-to-door delivery on all enterprise hardware orders dispatched to Nigeria and worldwide destinations.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Paystack Bank-Grade Security</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Seamless checkout supporting debit/credit cards and instant bank transfers with HMAC SHA512 verified webhooks and server-side payment guarantees.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-sky-50 rounded-lg text-sky-600 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">100,000+ SKU High-Scale Catalogue</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                High-performance PostgreSQL architecture with async Excel/CSV streaming import engines designed for over 1,000,000 products.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
