import React, { useState, useEffect } from 'react';
import { Package, Truck, Calendar, FileText, ChevronRight, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { Order, Invoice } from '../types';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { InvoiceModal } from '../components/InvoiceModal';

interface OrdersPageProps {
  onNavigate: (page: string) => void;
  onSelectProduct: (slug: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate, onSelectProduct }) => {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const data = await api.getUserOrders();
        setOrders(data.orders);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const data = await api.getInvoice(orderId);
      setSelectedInvoice(data.invoice);
    } catch (err) {
      console.error('Failed to load invoice:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'SHIPPED':
      case 'PACKED':
      case 'PROCESSING':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Package className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your orders</h2>
        <p className="text-xs text-slate-500">Track shipments, view invoice histories, and process returns.</p>
        <button
          onClick={() => onNavigate('auth')}
          className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-full shadow"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#eaeded] min-h-screen pb-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Your Orders</h1>
            <p className="text-xs text-slate-500 mt-0.5">Track, return, or re-order enterprise hardware</p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            <span>View All Invoices</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-4">
                <div className="h-5 bg-slate-200 rounded w-1/4" />
                <div className="h-16 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No orders placed yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't placed any enterprise hardware orders yet. Browse our catalogue of 100,000+ items.
            </p>
            <button
              onClick={() => onNavigate('products')}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-full shadow"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                {/* Order Card Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-slate-600">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Order Placed</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Total</span>
                      <span className="font-bold text-slate-900">{formatPrice(order.total_usd)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Ship To</span>
                      <span className="font-semibold text-slate-800">{order.customer_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Order #</span>
                      <span className="font-mono font-bold text-slate-900">{order.order_number}</span>
                    </div>

                    <button
                      onClick={() => handleDownloadInvoice(order.id)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Invoice (PDF)</span>
                    </button>
                  </div>
                </div>

                {/* Status & Carrier Strip */}
                <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Carrier: {order.carrier || 'DHL Express International'}</span>
                    </span>
                    {order.tracking_number && (
                      <span className="font-mono text-slate-500">({order.tracking_number})</span>
                    )}
                  </div>

                  <div className="text-emerald-700 font-semibold text-[11px]">
                    Free Global Freight Applied
                  </div>
                </div>

                {/* Items in Order */}
                <div className="p-5 divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=200&q=80'}
                          alt={item.product_name}
                          className="w-14 h-14 object-contain bg-slate-50 border rounded p-1"
                        />
                        <div>
                          <h4 className="font-semibold text-slate-900 hover:text-amber-700 cursor-pointer">
                            {item.product_name}
                          </h4>
                          <div className="text-slate-500 font-mono text-[10px] mt-0.5">
                            SKU: {item.sku} • Quantity: {item.quantity}
                          </div>
                          <div className="text-xs font-bold text-slate-950 mt-1">
                            {formatPrice(item.unit_price_usd)} each
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate('products')}
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 font-bold text-slate-950 rounded-lg shadow-xs transition-colors shrink-0"
                      >
                        Buy it again
                      </button>
                    </div>
                  ))}
                </div>

                {/* Status Timeline History */}
                {order.status_history && order.status_history.length > 0 && (
                  <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700 block mb-1">Status History Timeline:</span>
                    <div className="space-y-1">
                      {order.status_history.map((h) => (
                        <div key={h.id} className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-800">{h.to_status}</span>
                          <span className="text-slate-400">•</span>
                          <span>{h.comment}</span>
                          <span className="text-slate-400 text-[10px]">
                            ({new Date(h.created_at).toLocaleTimeString()})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
