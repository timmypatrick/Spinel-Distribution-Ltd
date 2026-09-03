import React from 'react';
import { ShieldCheck, Truck, Clock, RefreshCw, CreditCard, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#131a22] text-slate-300 text-xs">
      {/* Back to Top bar */}
      <button
        onClick={scrollToTop}
        className="w-full py-3 bg-[#232f3e] hover:bg-[#37475a] text-white font-semibold text-center transition-colors block text-xs"
      >
        Back to top
      </button>

      {/* Trust & Guarantees Strip */}
      <div className="border-b border-slate-800 bg-[#17202a] py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center">
            <Truck className="w-6 h-6 text-amber-400 mb-2" />
            <span className="font-bold text-white text-sm">Free Global Shipping</span>
            <span className="text-slate-400 text-xs mt-0.5">Complimentary freight on all orders</span>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-6 h-6 text-amber-400 mb-2" />
            <span className="font-bold text-white text-sm">Tier-1 OEM Warranty</span>
            <span className="text-slate-400 text-xs mt-0.5">100% genuine factory authorized gear</span>
          </div>
          <div className="flex flex-col items-center">
            <CreditCard className="w-6 h-6 text-amber-400 mb-2" />
            <span className="font-bold text-white text-sm">Paystack Verified</span>
            <span className="text-slate-400 text-xs mt-0.5">256-bit TLS encrypted bank-grade checkout</span>
          </div>
          <div className="flex flex-col items-center">
            <RefreshCw className="w-6 h-6 text-amber-400 mb-2" />
            <span className="font-bold text-white text-sm">30-Day Enterprise Returns</span>
            <span className="text-slate-400 text-xs mt-0.5">Hassle-free replacement policy</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-bold text-white text-sm mb-3">Get to Know Us</h4>
          <ul className="space-y-2 text-slate-400">
            <li><button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition-colors">About Spinel Distribution</button></li>
            <li><button onClick={() => onNavigate('products')} className="hover:text-amber-400 transition-colors">100,000+ Hardware Catalogue</button></li>
            <li><a href="#partner" className="hover:text-amber-400 transition-colors">Enterprise OEM Alliances</a></li>
            <li><a href="#sustainability" className="hover:text-amber-400 transition-colors">Solar & Green Infrastructure</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-3">Customer Services</h4>
          <ul className="space-y-2 text-slate-400">
            <li><button onClick={() => onNavigate('account')} className="hover:text-amber-400 transition-colors">Your Account</button></li>
            <li><button onClick={() => onNavigate('orders')} className="hover:text-amber-400 transition-colors">Your Orders & Tracking</button></li>
            <li><button onClick={() => onNavigate('invoices')} className="hover:text-amber-400 transition-colors">Download Invoices (PDF)</button></li>
            <li><a href="#shipping" className="hover:text-amber-400 transition-colors">Shipping Rates & Policies</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-3">Payment & Currencies</h4>
          <p className="text-slate-400 mb-3 leading-relaxed">
            All prices authoritative in USD with real-time automated conversion to Nigerian Naira (NGN) powered by Paystack secure payment processor.
          </p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-slate-800 rounded font-semibold text-white">USD ($)</span>
            <span className="px-2 py-1 bg-slate-800 rounded font-semibold text-white">NGN (₦)</span>
            <span className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-semibold">Paystack Secured</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm mb-3">Headquarters & Inquiries</h4>
          <ul className="space-y-2 text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>SPINEL DISTRIBUTION Logistics Hub, Victoria Island, Lagos, Nigeria</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>spineldistribution@gmail.com</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>+234 800 774 6353</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright & Security Strip */}
      <div className="border-t border-slate-800 py-6 text-center text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img
            src="https://i.ibb.co/nNS90SKj/pokecutweb-1788465862994.png"
            alt="SPINEL DISTRIBUTION"
            className="h-6 opacity-70"
          />
          <span className="font-bold text-slate-400 text-sm">SPINEL DISTRIBUTION</span>
        </div>
        <p className="text-[11px]">
          © {new Date().getFullYear()} SPINEL DISTRIBUTION, Inc. or its affiliates. All rights reserved. Designed for enterprise scalability exceeding 100,000+ items.
        </p>
      </div>
    </footer>
  );
};
