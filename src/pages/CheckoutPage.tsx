import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Truck, CreditCard, Lock, CheckCircle2, 
  ArrowRight, AlertCircle, Building2, MapPin 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Address, Order } from '../types';

interface CheckoutPageProps {
  onOrderCompleted: (order: Order) => void;
  onNavigate: (page: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onOrderCompleted, onNavigate }) => {
  const { cart, clearCart } = useCart();
  const { formatPrice, currency, exchangeRate } = useCurrency();
  const { user } = useAuth();
  const { success, error, toast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [useCustomAddress, setUseCustomAddress] = useState<boolean>(false);

  // Address form fields
  const [fullName, setFullName] = useState(user ? `${user.first_name} ${user.last_name}` : '');
  const [company, setCompany] = useState('Enterprise Client');
  const [phone, setPhone] = useState(user?.phone || '+234 800 123 4567');
  const [addressLine1, setAddressLine1] = useState('14 Akin Adesola St');
  const [city, setCity] = useState('Victoria Island');
  const [state, setState] = useState('Lagos State');
  const [postalCode, setPostalCode] = useState('101241');
  const [country, setCountry] = useState('Nigeria');

  const [paymentCurrency, setPaymentCurrency] = useState<'USD' | 'NGN'>(currency);
  const [processing, setProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment'>('review');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [paymentRef, setPaymentRef] = useState<string>('');

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const data = await api.getAddresses();
        if (data.addresses && data.addresses.length > 0) {
          setAddresses(data.addresses);
        }
      } catch (err) {
        console.warn('Addresses not pre-loaded:', err);
      }
    };
    if (user) {
      loadAddresses();
    }
  }, [user]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Items in Cart</h2>
        <p className="text-xs text-slate-500 mb-4">Please add products to your cart before proceeding to checkout.</p>
        <button
          onClick={() => onNavigate('products')}
          className="px-6 py-2 bg-amber-400 hover:bg-amber-500 font-bold text-xs rounded-full"
        >
          Return to Catalogue
        </button>
      </div>
    );
  }

  const getActiveShippingAddress = (): Address => {
    if (!useCustomAddress && addresses.length > 0 && addresses[selectedAddressIndex]) {
      return addresses[selectedAddressIndex];
    }
    return {
      id: 'custom-addr',
      user_id: user?.id || 'guest',
      address_type: 'shipping',
      full_name: fullName,
      company,
      phone,
      street_line1: addressLine1,
      city,
      state,
      postal_code: postalCode,
      country,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const handleCreateOrderAndInitializePaystack = async () => {
    if (!user) {
      toast('Please sign in or use a demo account to complete checkout.', 'info');
      onNavigate('auth');
      return;
    }

    setProcessing(true);
    try {
      const activeAddress = getActiveShippingAddress();

      // Step 1: Create Order on server with authoritative price and stock calculations
      const orderData = await api.checkout({
        items: cart.items.map(i => ({ productId: i.product_id, quantity: i.quantity })),
        shipping_address: activeAddress,
        billing_address: activeAddress,
        currency: paymentCurrency,
        idempotency_key: `idem_${cart.id}_${Date.now()}`
      });

      const order = orderData.order;
      setCreatedOrder(order);

      // Step 2: Initialize Paystack transaction server-side
      const payInit = await api.initializePayment(order.id, paymentCurrency);
      setPaymentRef(payInit.reference);
      setCheckoutStep('payment');
      success(`Order placed (#${order.order_number}). Ready for Paystack payment.`);
    } catch (err: unknown) {
      error((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyAndFinalizePayment = async () => {
    if (!paymentRef || !createdOrder) return;

    setProcessing(true);
    try {
      // Call server verification API (never trust frontend alone!)
      const verification = await api.verifyPayment(paymentRef);
      if (verification.success && verification.order.status === 'PAID') {
        await clearCart();
        success('Payment confirmed by Paystack! Invoice generated.');
        onOrderCompleted(verification.order);
      } else {
        error('Payment could not be verified by Paystack.');
      }
    } catch (err: unknown) {
      error((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const totalPayableNgn = Math.round(cart.total_usd * exchangeRate * 100) / 100;

  return (
    <div className="bg-[#eaeded] min-h-screen pb-16">
      {/* Secure Checkout Header */}
      <div className="bg-[#131921] border-b border-slate-800 text-white py-4 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://i.ibb.co/nNS90SKj/pokecutweb-1788465862994.png"
              alt="SPINEL DISTRIBUTION"
              className="h-8 object-contain"
            />
            <span className="font-extrabold text-amber-400 text-sm tracking-wider">CHECKOUT</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL TLS Encryption</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Checkout Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Shipping Address */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="font-bold text-base text-slate-900">Delivery Address</h2>
                </div>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setUseCustomAddress(!useCustomAddress)}
                    className="text-xs text-amber-700 hover:underline font-semibold"
                  >
                    {useCustomAddress ? 'Choose saved address' : 'Add new address'}
                  </button>
                )}
              </div>

              {!useCustomAddress && addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((addr, idx) => (
                    <label
                      key={addr.id}
                      className={`block p-3.5 rounded-lg border cursor-pointer transition-all ${
                        selectedAddressIndex === idx
                          ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="shipping_address"
                          checked={selectedAddressIndex === idx}
                          onChange={() => setSelectedAddressIndex(idx)}
                          className="mt-1 text-amber-500 focus:ring-amber-400"
                        />
                        <div className="text-xs text-slate-700">
                          <span className="font-bold text-slate-900">{addr.full_name}</span> {addr.company && `(${addr.company})`}
                          <div>{addr.address_line1}, {addr.city}, {addr.state}, {addr.postal_code}, {addr.country}</div>
                          <div className="text-slate-500 mt-0.5">Phone: {addr.phone}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Country *</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State / Province *</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Payment Method & Paystack Gateway */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h2 className="font-bold text-base text-slate-900">Payment Method (Paystack Gateway)</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded text-emerald-800 font-black">
                      PS
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Paystack Verified Merchant Gateway</div>
                      <div className="text-slate-500 text-[11px]">Supports Cards, Bank Transfers, and USSD</div>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>

                {/* Currency Selection for Payment */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-700">Settlement Currency:</span>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="radio"
                        name="pay_currency"
                        checked={paymentCurrency === 'USD'}
                        onChange={() => setPaymentCurrency('USD')}
                        className="text-amber-500 focus:ring-amber-400"
                      />
                      <span>USD ($) — ${cart.total_usd.toFixed(2)}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="radio"
                        name="pay_currency"
                        checked={paymentCurrency === 'NGN'}
                        onChange={() => setPaymentCurrency('NGN')}
                        className="text-amber-500 focus:ring-amber-400"
                      />
                      <span>NGN (₦) — ₦{totalPayableNgn.toLocaleString()} (Rate: 1 USD = ₦{exchangeRate})</span>
                    </label>
                  </div>
                </div>

                {/* Paystack Payment Processing State */}
                {checkoutStep === 'payment' && createdOrder && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">Transaction Initialized</span>
                      <span className="font-mono text-slate-600 font-semibold">{paymentRef}</span>
                    </div>

                    <p className="text-slate-700 leading-relaxed">
                      Order <strong>#{createdOrder.order_number}</strong> is currently pending payment. 
                      You can verify and simulate immediate settlement below using our verified server-side transaction verification handler.
                    </p>

                    <button
                      onClick={handleVerifyAndFinalizePayment}
                      disabled={processing}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow flex items-center justify-center gap-2 transition-colors"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span>{processing ? 'Verifying with Paystack...' : 'Complete Payment with Paystack (Simulate Live)'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Review Items in Order */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h2 className="font-bold text-base text-slate-900">Review Items & Shipping</h2>
              </div>

              <div className="divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product?.image}
                        alt={item.product?.name}
                        className="w-12 h-12 object-contain bg-slate-50 border rounded p-1"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 line-clamp-1">{item.product?.name}</div>
                        <div className="text-slate-500 font-mono text-[10px]">SKU: {item.product?.sku}</div>
                        <div className="text-slate-500">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatPrice(item.total_price_usd)}</div>
                      <div className="text-emerald-700 font-semibold text-[10px]">Free Shipping</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Order Summary Column */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 sticky top-20 text-xs">
            <h3 className="font-bold text-base text-slate-950 border-b border-slate-100 pb-3">
              Order Summary
            </h3>

            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Items ({cart.total_items}):</span>
                <span className="font-semibold text-slate-900">{formatPrice(cart.total_usd)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>International Delivery:</span>
                <span>FREE</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax:</span>
                <span>$0.00</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Order Total (USD):</span>
                <span className="text-xl font-black text-slate-950">${cart.total_usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline text-slate-500">
                <span>Total in NGN:</span>
                <span className="font-bold text-slate-800">₦{totalPayableNgn.toLocaleString()}</span>
              </div>
            </div>

            {checkoutStep === 'review' ? (
              <button
                onClick={handleCreateOrderAndInitializePaystack}
                disabled={processing}
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-full shadow hover:shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>{processing ? 'Calculating and Locking Prices...' : 'Place Order & Pay with Paystack'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleVerifyAndFinalizePayment}
                disabled={processing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-full shadow hover:shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>{processing ? 'Verifying Transaction...' : 'Complete Payment'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>SPINEL Freight Guarantee</span>
              </div>
              <p>
                Stock is reserved immediately upon placement. Real-time carrier tracking provided via DHL Express.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
