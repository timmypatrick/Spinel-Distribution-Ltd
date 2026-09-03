import React, { useState } from 'react';
import { CheckCircle, Download, Package, ArrowRight, Truck, FileText } from 'lucide-react';
import { Order, Invoice } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { InvoiceModal } from '../components/InvoiceModal';
import { api } from '../services/api';

interface OrderSuccessPageProps {
  order: Order;
  onNavigate: (page: string) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ order, onNavigate }) => {
  const { formatPrice } = useCurrency();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState<boolean>(false);

  const handleOpenInvoice = async () => {
    setLoadingInvoice(true);
    try {
      const data = await api.getInvoice(order.id);
      setSelectedInvoice(data.invoice);
    } catch (err) {
      console.error('Failed to load invoice:', err);
    } finally {
      setLoadingInvoice(false);
    }
  };

  return (
    <div className="bg-[#eaeded] min-h-screen pb-16">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950">
              Payment Confirmed & Order Placed!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Thank you for ordering with Spinel Distribution. An email confirmation and tax invoice have been dispatched.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-xs text-left grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Order Number</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{order.order_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Payment Status</span>
              <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[11px] mt-0.5">
                {order.status}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Amount Paid</span>
              <span className="font-bold text-slate-900 text-sm">{formatPrice(order.total_usd)}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Carrier Tracking</span>
              <span className="font-bold text-amber-700 font-mono text-xs">{order.tracking_number || 'DHL-Assigned'}</span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-left text-xs">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-700">
              Items in this Shipment (Free International Delivery)
            </div>
            <div className="divide-y divide-slate-100 p-4">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 first:pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=200&q=80'}
                      alt={item.product_name}
                      className="w-10 h-10 object-contain p-1 bg-slate-50 rounded border"
                    />
                    <div>
                      <div className="font-semibold text-slate-900 line-clamp-1">{item.product_name}</div>
                      <div className="text-slate-500 font-mono text-[10px]">SKU: {item.sku} • Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="font-bold text-slate-900">{formatPrice(item.total_price_usd)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenInvoice}
              disabled={loadingInvoice}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{loadingInvoice ? 'Loading Invoice...' : 'Download Official PDF Invoice'}</span>
            </button>

            <button
              onClick={() => onNavigate('orders')}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
            >
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Track Delivery</span>
            </button>

            <button
              onClick={() => onNavigate('products')}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
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
