import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, FileText, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Order, Invoice } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { InvoiceModal } from '../../components/InvoiceModal';

export const AdminOrdersPage: React.FC = () => {
  const { success, error } = useToast();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Status update modal
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('PROCESSING');
  const [carrier, setCarrier] = useState<string>('DHL Express');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [statusComment, setStatusComment] = useState<string>('Dispatched from Spinel Lagos hub');
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminOrders();
      setOrders(data.orders);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenStatusModal = (o: Order) => {
    setEditingOrder(o);
    setNewStatus(o.status);
    setCarrier(o.carrier || 'DHL Express');
    setTrackingNumber(o.tracking_number || `DHL-${Math.floor(10000000 + Math.random() * 90000000)}`);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setUpdating(true);
    try {
      await api.updateOrderStatus(editingOrder.id, {
        status: newStatus as any,
        carrier,
        tracking_number: trackingNumber,
        comment: statusComment
      });
      success(`Order #${editingOrder.order_number} transitioned to ${newStatus}`);
      setEditingOrder(null);
      loadOrders();
    } catch (err: unknown) {
      error((err as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  const handleViewInvoice = async (orderId: string) => {
    try {
      const data = await api.getInvoice(orderId);
      setSelectedInvoice(data.invoice);
    } catch (err: unknown) {
      error('Invoice not found or order pending payment.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders & Fulfillment Pipeline</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status transitions, carrier tracking assignment, and invoice archives
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold">
            <tr>
              <th className="p-3.5">Order #</th>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Items</th>
              <th className="p-3.5 text-right">Total (USD)</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5">Carrier / Tracking</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="p-4">
                    <div className="h-4 bg-slate-800 rounded" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No orders placed in system.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="text-slate-300 hover:bg-slate-800/40">
                  <td className="p-3.5 font-mono font-bold text-amber-400">{o.order_number}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{o.customer_name}</div>
                    <div className="text-slate-500 text-[11px]">{o.customer_email}</div>
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {o.items.length} item(s)
                  </td>
                  <td className="p-3.5 text-right font-bold text-white">${o.total_usd.toFixed(2)}</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      o.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                      o.status === 'SHIPPED' ? 'bg-sky-500/10 text-sky-400' :
                      o.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {o.tracking_number ? (
                      <div>
                        <div className="text-white font-medium">{o.carrier || 'DHL'}</div>
                        <div className="font-mono text-[11px] text-slate-500">{o.tracking_number}</div>
                      </div>
                    ) : (
                      <span className="text-slate-600 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenStatusModal(o)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px]"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleViewInvoice(o.id)}
                        className="p-1 text-amber-400 hover:text-amber-300"
                        title="View Official Invoice"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Transition Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-xs">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                Fulfill Order #{editingOrder.order_number}
              </h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Order Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-bold focus:ring-1 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                  <option value="PAID">PAID</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PACKED">PACKED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Logistics Carrier</label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. DHL Express International"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Carrier Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DHL-98471924"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Status Timeline Note</label>
                <textarea
                  rows={2}
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded shadow"
                >
                  {updating ? 'Saving...' : 'Apply Transition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
