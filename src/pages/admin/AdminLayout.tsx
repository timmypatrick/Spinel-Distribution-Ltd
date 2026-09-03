import React from 'react';
import { 
  LayoutDashboard, Package, UploadCloud, Layers, ShoppingBag, 
  Users, Settings, ShieldAlert, ArrowLeft, CheckCircle2, Shield, Activity 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  children
}) => {
  const { user, hasPermission } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products Catalogue', icon: Package, permission: 'products:read' },
    { id: 'import', label: 'Excel/CSV Import Hub', icon: UploadCloud, permission: 'products:import' },
    { id: 'inventory', label: 'Inventory & Movements', icon: Layers, permission: 'inventory:read' },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag, permission: 'orders:read' },
    { id: 'users', label: 'User Roles & RBAC', icon: Users, permission: 'users:manage' },
    { id: 'settings', label: 'Currency & Settings', icon: Settings, permission: 'settings:manage' },
    { id: 'audit', label: 'Audit Security Logs', icon: ShieldAlert, permission: 'audit:read' },
    { id: 'tests', label: 'Automated QA Tests', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onExitAdmin}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </button>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <img
              src="https://i.ibb.co/nNS90SKj/pokecutweb-1788465862994.png"
              alt="SPINEL DISTRIBUTION"
              className="h-7 object-contain"
            />
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Admin Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <div className="font-bold text-white">{user?.first_name} {user?.last_name}</div>
            <div className="text-[10px] text-amber-400 font-mono uppercase">{user?.role}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400">
            {user?.first_name?.charAt(0) || 'A'}
          </div>
        </div>
      </header>

      {/* Admin Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-950/80 border-r border-slate-800 p-4 space-y-1.5 shrink-0 hidden md:block">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Operations & Control
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const allowed = !item.permission || hasPermission(item.permission as any);
            if (!allowed) return null;

            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Mobile Horizontal Tabs */}
        <div className="md:hidden bg-slate-950 p-2 border-b border-slate-800 flex overflow-x-auto gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap ${
                currentTab === item.id ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Dynamic Admin View */}
        <main className="flex-1 overflow-y-auto bg-[#0b1120] p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
