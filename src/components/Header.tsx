import React, { useState } from 'react';
import { 
  Search, ShoppingCart, MapPin, User, ChevronDown, 
  Menu, ShieldCheck, ShieldAlert, Sparkles, LogOut, 
  Package, FileText, Settings, Database, ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { Category } from '../types';

interface HeaderProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onNavigate: (page: string, param?: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onNavigate,
  currentPage
}) => {
  const { user, isAdmin, logout, switchDemoUser } = useAuth();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const { cart, setIsOpen } = useCart();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#131921] text-white shadow-md select-none">
      {/* Top Main Navigation Bar */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 py-1 px-2 hover:outline hover:outline-1 hover:outline-white rounded transition-all shrink-0"
        >
          <img
            src="https://i.ibb.co/nNS90SKj/pokecutweb-1788465862994.png"
            alt="SPINEL DISTRIBUTION"
            className="h-8 sm:h-9 object-contain filter brightness-110"
          />
          <div className="hidden xl:flex flex-col text-left leading-none">
            <span className="text-amber-400 font-extrabold text-sm tracking-wider">SPINEL</span>
            <span className="text-slate-300 font-medium text-[10px] tracking-widest uppercase">DISTRIBUTION</span>
          </div>
        </button>

        {/* Delivery Location Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 py-1 px-2 hover:outline hover:outline-1 hover:outline-white rounded cursor-pointer shrink-0">
          <MapPin className="w-4 h-4 text-slate-300" />
          <div className="flex flex-col text-left leading-tight text-xs">
            <span className="text-slate-400 text-[11px]">Deliver to</span>
            <span className="font-bold text-white">Nigeria & Intl</span>
          </div>
        </div>

        {/* Global Search Bar (Amazon Style) */}
        <div className="flex-1 flex items-center h-10 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-500">
          {/* Department Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="hidden sm:block h-full bg-slate-100 text-slate-800 text-xs font-medium px-2.5 border-r border-slate-300 focus:outline-none cursor-pointer max-w-[150px] truncate"
          >
            <option value="">All Departments</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search 100,000+ enterprise products, Cisco, Dell, Huawei, Schneider..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-full px-3 text-slate-900 text-sm focus:outline-none placeholder:text-slate-400"
          />

          {/* Search Button */}
          <button
            onClick={onSearchSubmit}
            aria-label="Search"
            className="h-full px-4 bg-amber-400 hover:bg-amber-500 text-slate-900 flex items-center justify-center transition-colors"
          >
            <Search className="w-5 h-5 font-bold" />
          </button>
        </div>

        {/* Currency Switcher (USD / NGN) */}
        <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded p-0.5 shrink-0">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
              currency === 'USD' ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            USD $
          </button>
          <button
            onClick={() => setCurrency('NGN')}
            className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
              currency === 'NGN' ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            NGN ₦
          </button>
        </div>

        {/* Demo Switcher Quick Pill */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setDemoMenuOpen(!demoMenuOpen)}
            className="flex items-center gap-1.5 py-1 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-medium text-amber-300"
            title="Switch User Role for QA and Evaluation"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[100px]">
              {user?.roles.includes('super_admin')
                ? 'Super Admin'
                : user?.roles.includes('catalog_manager')
                ? 'Catalog Mgr'
                : user
                ? 'Customer'
                : 'Role Demo'}
            </span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {demoMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-md shadow-2xl border border-slate-200 z-50 p-2 text-xs">
              <div className="font-bold text-slate-500 px-2 py-1 uppercase text-[10px] tracking-wider border-b border-slate-100">
                Switch Interactive Demo Account
              </div>
              <button
                onClick={() => {
                  switchDemoUser('super_admin');
                  setDemoMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 hover:bg-amber-50 rounded flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-amber-700">Super Admin (David M.)</div>
                  <div className="text-[10px] text-slate-500">Full system & bulk import control</div>
                </div>
                {user?.roles.includes('super_admin') && <span className="text-amber-600 font-bold">Active</span>}
              </button>
              <button
                onClick={() => {
                  switchDemoUser('catalog_manager');
                  setDemoMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 hover:bg-amber-50 rounded flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-amber-700">Catalog Manager (Sarah O.)</div>
                  <div className="text-[10px] text-slate-500">Product & inventory management</div>
                </div>
                {user?.roles.includes('catalog_manager') && <span className="text-amber-600 font-bold">Active</span>}
              </button>
              <button
                onClick={() => {
                  switchDemoUser('customer');
                  setDemoMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-2 hover:bg-amber-50 rounded flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-amber-700">Enterprise Buyer (Tunde A.)</div>
                  <div className="text-[10px] text-slate-500">Cart, checkout, orders & invoices</div>
                </div>
                {user && !isAdmin && <span className="text-amber-600 font-bold">Active</span>}
              </button>
            </div>
          )}
        </div>

        {/* Account & Lists */}
        <div className="relative">
          <button
            onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
            className="flex flex-col text-left py-1 px-2 hover:outline hover:outline-1 hover:outline-white rounded cursor-pointer"
          >
            <span className="text-slate-400 text-[11px] leading-tight">
              Hello, {user ? user.first_name : 'Sign in'}
            </span>
            <div className="flex items-center gap-0.5 font-bold text-xs text-white leading-tight">
              <span>Account & Lists</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </button>

          {accountDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-slate-900 rounded-md shadow-2xl border border-slate-200 z-50 p-2 text-sm">
              {user ? (
                <>
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="font-bold text-slate-900">{user.first_name} {user.last_name}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {user.roles.map(r => (
                        <span key={r} className="bg-amber-100 text-amber-900 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigate('account');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded text-xs flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Your Account & Profile
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('orders');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded text-xs flex items-center gap-2"
                    >
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      Your Orders & Tracking
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('invoices');
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded text-xs flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Invoices & Receipts
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold rounded text-xs flex items-center gap-2 mt-1"
                      >
                        <Settings className="w-3.5 h-3.5 text-amber-700" />
                        Admin Dashboard
                      </button>
                    )}
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 rounded text-xs flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-3 text-center">
                  <button
                    onClick={() => {
                      onNavigate('auth');
                      setAccountDropdownOpen(false);
                    }}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-500 font-bold text-slate-900 text-xs rounded shadow transition-colors"
                  >
                    Sign in to your account
                  </button>
                  <p className="text-[11px] text-slate-500 mt-2">
                    New customer?{' '}
                    <button
                      onClick={() => {
                        onNavigate('auth');
                        setAccountDropdownOpen(false);
                      }}
                      className="text-sky-600 hover:underline font-medium"
                    >
                      Start here.
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Returns & Orders */}
        <button
          onClick={() => onNavigate('orders')}
          className="hidden sm:flex flex-col text-left py-1 px-2 hover:outline hover:outline-1 hover:outline-white rounded cursor-pointer shrink-0"
        >
          <span className="text-slate-400 text-[11px] leading-tight">Returns</span>
          <span className="font-bold text-xs text-white leading-tight">& Orders</span>
        </button>

        {/* Shopping Cart Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 py-1 px-2 hover:outline hover:outline-1 hover:outline-white rounded cursor-pointer shrink-0 text-white"
        >
          <div className="relative">
            <ShoppingCart className="w-7 h-7" />
            <span className="absolute -top-1 left-3.5 bg-amber-400 text-slate-950 font-black text-xs px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
              {cart?.total_items || 0}
            </span>
          </div>
          <div className="hidden lg:flex flex-col text-left leading-tight">
            <span className="text-slate-400 text-[11px]">Cart</span>
            <span className="font-bold text-xs text-amber-400">
              {formatPrice(cart?.total_usd || 0)}
            </span>
          </div>
        </button>
      </div>

      {/* Secondary Department Sub-Header Navigation */}
      <div className="bg-[#232f3e] border-t border-slate-700/50 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar">
          {/* All Departments Trigger */}
          <button
            onClick={() => onNavigate('products')}
            className={`flex items-center gap-1 font-bold px-2 py-1 hover:outline hover:outline-1 hover:outline-white rounded whitespace-nowrap ${
              currentPage === 'products' ? 'bg-slate-700 text-amber-400' : 'text-white'
            }`}
          >
            <Menu className="w-4 h-4" />
            <span>All Products</span>
          </button>

          {/* Category Quick Filters */}
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                onNavigate('products');
              }}
              className={`px-2 py-1 rounded hover:outline hover:outline-1 hover:outline-white whitespace-nowrap transition-colors ${
                selectedCategory === cat.id ? 'text-amber-400 font-bold bg-slate-700/60' : 'text-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Highlight Perks & Admin / QA links */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-amber-400 font-semibold px-2 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Free International Shipping</span>
          </div>

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-1 font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded shadow transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('tests')}
            className="hidden sm:flex items-center gap-1 font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded transition-colors"
            title="Run Automated Verification Tests"
          >
            <Database className="w-3.5 h-3.5" />
            <span>QA Tests</span>
          </button>
        </div>
      </div>
    </header>
  );
};
