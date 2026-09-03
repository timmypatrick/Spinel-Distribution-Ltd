import crypto from 'crypto';
import { db } from '../db/schema';
import { Invoice, Order } from '../../types';

export class InvoiceService {
  static generateInvoiceForOrder(order: Order): Invoice {
    // Check if invoice already exists
    const existing = Array.from(db.invoices.values()).find(i => i.order_id === order.id);
    if (existing) return existing;

    const invoiceNumber = `INV-${order.order_number}`;
    const invoiceId = crypto.randomUUID();

    const newInvoice: Invoice = {
      id: invoiceId,
      invoice_number: invoiceNumber,
      order_id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
      customer_name: order.customer_name || 'Valued Customer',
      customer_email: order.customer_email || '',
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      items: order.items,
      subtotal_usd: order.subtotal_usd,
      shipping_usd: order.shipping_usd,
      discount_usd: order.discount_usd,
      total_usd: order.total_usd,
      total_ngn: order.total_charged_ngn,
      currency: order.currency,
      exchange_rate: order.exchange_rate,
      status: order.status === 'PAID' ? 'PAID' : 'ISSUED',
      issued_date: new Date().toISOString()
    };

    db.invoices.set(invoiceId, newInvoice);

    // Audit log
    db.auditLogs.push({
      id: crypto.randomUUID(),
      action: 'INVOICE_GENERATED',
      entity: 'invoices',
      entity_id: invoiceId,
      metadata: { invoice_number: invoiceNumber, order_number: order.order_number },
      created_at: new Date().toISOString()
    });

    return newInvoice;
  }

  static getInvoice(invoiceId: string, userId?: string, isAdmin: boolean = false): Invoice | null {
    const inv = db.invoices.get(invoiceId) || 
      Array.from(db.invoices.values()).find(i => i.invoice_number === invoiceId || i.order_id === invoiceId || i.order_number === invoiceId);
    
    if (!inv) return null;

    // RLS check
    if (!isAdmin && userId && inv.user_id !== userId) {
      return null;
    }

    return inv;
  }

  static getUserInvoices(userId: string): Invoice[] {
    return Array.from(db.invoices.values())
      .filter(i => i.user_id === userId)
      .sort((a, b) => new Date(b.issued_date).getTime() - new Date(a.issued_date).getTime());
  }

  static getAllInvoices(): Invoice[] {
    return Array.from(db.invoices.values())
      .sort((a, b) => new Date(b.issued_date).getTime() - new Date(a.issued_date).getTime());
  }
}
