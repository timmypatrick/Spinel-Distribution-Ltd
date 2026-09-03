import React, { useState, useEffect } from 'react';
import { 
  Package, CheckCircle2, AlertTriangle, Layers, DollarSign, 
  ShoppingBag, Users, UploadCloud, ArrowUpRight, ArrowDownRight, RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';

interface DashboardStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  out_of_stock_products: number;
  total_categories: number;
  total_brands: number;
  total_customers: number;
  total_orders: number;
  total_revenue_usd: number;
  recent_imports: Array<{
    id: string;
    file_name: string;
    total_rows: number;
    successful_rows: number;
    failed_rows: number;
    status: string;
    created_at: string;
  }>;
}

export const AdminDashboardPage: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { formatPrice } = useCurrency();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
        <p className="text-xs">Computing database catalogue aggregates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations & Catalogue Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time aggregate telemetry computed at the database level
          </p>
        </div>
        <button
          onClick={loadStats}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Catalogue Scale (Total)</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.total_products.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            {stats?.active_products} active ({stats?.inactive_products} inactive)
          </div>
        </div>

        {/* Out of Stock Alert */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Out of Stock SKUs</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {stats?.out_of_stock_products}
          </div>
          <div className="text-[11px] text-slate-500">
            Requires inventory replenishment
          </div>
        </div>

        {/* Total Orders & Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Orders Executed</span>
            <ShoppingBag className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.total_orders}
          </div>
          <div className="text-[11px] text-slate-500">
            Across {stats?.total_customers} corporate buyers
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Gross Revenue Settled</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ${stats?.total_revenue_usd.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            Processed via Paystack Gateway
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launchpad */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-sm text-white">Quick Operations</h3>
          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('import')}
              className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4" />
                <span>Launch Excel/CSV Importer</span>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('products')}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-sky-400" />
                <span>Manage Product Catalogue</span>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('inventory')}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Stock On-Hand & Adjustments</span>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recent Imports Status */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Recent Async Import Pipelines</h3>
            <button
              onClick={() => onNavigateTab('import')}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Open Full Import Engine
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="pb-2">File</th>
                  <th className="pb-2 text-center">Total Rows</th>
                  <th className="pb-2 text-center">Success</th>
                  <th className="pb-2 text-center">Failed</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats?.recent_imports && stats.recent_imports.length > 0 ? (
                  stats.recent_imports.map((job) => (
                    <tr key={job.id} className="text-slate-300">
                      <td className="py-2.5 font-medium">{job.file_name}</td>
                      <td className="py-2.5 text-center font-mono">{job.total_rows}</td>
                      <td className="py-2.5 text-center font-mono text-emerald-400">{job.successful_rows}</td>
                      <td className="py-2.5 text-center font-mono text-rose-400">{job.failed_rows}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : job.status === 'FAILED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      No recent import executions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
