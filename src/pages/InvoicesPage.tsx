import React, { useState, useEffect } from 'react';
import { FileText, Download, ShieldCheck, ArrowLeft, Calendar } from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { InvoiceModal } from '../components/InvoiceModal';

interface InvoicesPageProps {
  onNavigate: (page: string) => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ onNavigate }) => {
  const { formatPrice } = useCurrency();
  const { user, isAdmin } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      try {
        const data = await api.getUserInvoices();
        setInvoices(data.invoices);
      } catch (err) {
        console.error('Failed to load invoices:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      loadInvoices();
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="bg-[#eaeded] min-h-screen pb-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Invoices & Tax Receipts</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official downloadable PDF documentation for all settled orders
            </p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs text-slate-600 hover:text-amber-800 font-semibold flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center animate-pulse space-y-3">
            <div className="h-6 bg-slate-200 rounded w-1/4 mx-auto" />
            <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No invoices found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Invoices are automatically generated and stored upon successful Paystack payment confirmation.
            </p>
            <button
              onClick={() => onNavigate('products')}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-full shadow"
            >
              Browse Catalogue
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Order #</th>
                  <th className="p-3.5">Date Issued</th>
                  <th className="p-3.5">Customer / Entity</th>
                  <th className="p-3.5 text-right">Total (USD)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="p-3.5 font-mono text-slate-600">{inv.order_number}</td>
                    <td className="p-3.5 text-slate-600">{new Date(inv.issued_date).toLocaleDateString()}</td>
                    <td className="p-3.5 text-slate-800 font-medium">{inv.customer_name}</td>
                    <td className="p-3.5 text-right font-bold text-slate-950">${inv.total_usd.toFixed(2)}</td>
                    <td className="p-3.5 text-center">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded shadow-xs flex items-center gap-1.5 ml-auto transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
