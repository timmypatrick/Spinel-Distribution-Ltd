import React from 'react';
import { X, Download, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Invoice } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const { formatPrice } = useCurrency();

  if (!invoice) return null;

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Header & Company Brand
    doc.setFillColor(19, 25, 33);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SPINEL DISTRIBUTION', 15, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(245, 158, 11);
    doc.text('Enterprise Hardware & Solar Distribution Hub', 15, 25);

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('TAX INVOICE / RECEIPT', 150, 18);
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 150, 24);

    // Invoice Meta Information
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice Number: ${invoice.invoice_number}`, 15, 45);
    doc.text(`Order Number: ${invoice.order_number}`, 15, 51);
    doc.text(`Date Issued: ${new Date(invoice.issued_date).toLocaleDateString()}`, 15, 57);

    doc.text('Customer & Shipping Details:', 120, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customer_name, 120, 51);
    doc.text(invoice.customer_email, 120, 56);
    if (invoice.shipping_address) {
      doc.text(`${invoice.shipping_address.address_line1}, ${invoice.shipping_address.city}`, 120, 61);
      doc.text(`${invoice.shipping_address.state}, ${invoice.shipping_address.country}`, 120, 66);
    }

    // Line Items Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 75, 180, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('SKU', 18, 80);
    doc.text('Product Description', 55, 80);
    doc.text('Qty', 135, 80);
    doc.text('Unit Price (USD)', 150, 80);
    doc.text('Total (USD)', 175, 80);

    // Items
    let y = 88;
    invoice.items.forEach((item) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(item.sku || 'N/A', 18, y);
      const title = item.product_name.length > 40 ? item.product_name.substring(0, 38) + '...' : item.product_name;
      doc.text(title, 55, y);
      doc.text(String(item.quantity), 137, y);
      doc.text(`$${item.unit_price_usd.toFixed(2)}`, 150, y);
      doc.text(`$${item.total_price_usd.toFixed(2)}`, 175, y);
      y += 7;
    });

    // Totals Section
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y, 195, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal (USD):', 130, y);
    doc.text(`$${invoice.subtotal_usd.toFixed(2)}`, 175, y);
    y += 6;

    doc.text('International Freight / Shipping:', 130, y);
    doc.setTextColor(16, 185, 129);
    doc.text('FREE', 175, y);
    y += 6;

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Final Total (USD):', 130, y);
    doc.text(`$${invoice.total_usd.toFixed(2)}`, 175, y);
    y += 6;

    if (invoice.total_ngn) {
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Total Charged (NGN):', 130, y);
      doc.text(`NGN ${invoice.total_ngn.toLocaleString()}`, 175, y);
      y += 5;
      doc.setFontSize(7);
      doc.text(`(Exchange Rate: 1 USD = ${invoice.exchange_rate} NGN)`, 130, y);
    }

    // Official Footer & Authentication Stamp
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for choosing SPINEL DISTRIBUTION.', 15, 270);
    doc.text('Authorized Electronic Invoice. Generated via Paystack Verified Merchant Gateway.', 15, 275);

    doc.save(`${invoice.invoice_number}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-[#131921] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Tax Invoice: {invoice.invoice_number}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Body */}
        <div className="p-6 space-y-6 text-sm text-slate-800">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <div className="font-bold text-lg text-slate-900">SPINEL DISTRIBUTION</div>
              <div className="text-xs text-slate-500">Enterprise Logistics Hub, Victoria Island, Lagos</div>
              <div className="text-xs text-slate-500">Email: spineldistribution@gmail.com</div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full">
                {invoice.status}
              </span>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                Order: #{invoice.order_number}
              </div>
              <div className="text-xs text-slate-400">
                {new Date(invoice.issued_date).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div>
              <span className="font-bold text-slate-500 uppercase text-[10px]">Billed & Shipped To</span>
              <div className="font-bold text-slate-900 mt-0.5">{invoice.customer_name}</div>
              <div className="text-slate-600">{invoice.customer_email}</div>
              {invoice.shipping_address && (
                <div className="text-slate-600 mt-0.5">
                  {invoice.shipping_address.address_line1}, {invoice.shipping_address.city}, {invoice.shipping_address.country}
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Payment Settlement</span>
              <div className="font-bold text-slate-900 mt-0.5">Paystack Merchant Gateway</div>
              <div className="text-slate-600">Rate: 1 USD = ₦{invoice.exchange_rate}</div>
              <div className="text-emerald-700 font-semibold">Free Global Freight Applied</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">SKU</th>
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Price (USD)</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2.5 font-mono text-[11px] text-slate-600">{item.sku}</td>
                    <td className="p-2.5 font-medium text-slate-900">{item.product_name}</td>
                    <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                    <td className="p-2.5 text-right">${item.unit_price_usd.toFixed(2)}</td>
                    <td className="p-2.5 text-right font-bold">${item.total_price_usd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (USD):</span>
                <span>${invoice.subtotal_usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Shipping:</span>
                <span>FREE</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-950 border-t border-slate-200 pt-1.5">
                <span>Total Amount:</span>
                <span>${invoice.total_usd.toFixed(2)}</span>
              </div>
              {invoice.total_ngn && (
                <div className="text-slate-500 text-[11px]">
                  Settled as ₦{invoice.total_ngn.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Verified Authentic Invoice
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={downloadPDF}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
