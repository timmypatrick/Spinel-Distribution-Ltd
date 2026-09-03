import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, Save, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { SystemSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const { setExchangeRate: updateGlobalExchangeRate } = useCurrency();

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string>('1500');
  const [freeShipping, setFreeShipping] = useState<boolean>(true);
  const [orderPrefix, setOrderPrefix] = useState<string>('SPN');
  const [companyName, setCompanyName] = useState<string>('SPINEL DISTRIBUTION');
  const [supportEmail, setSupportEmail] = useState<string>('spineldistribution@gmail.com');
  const [phone, setPhone] = useState<string>('+234 800 774 6353');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data.settings);
      setExchangeRate(String(data.settings.exchange_rate_usd_to_ngn));
      setFreeShipping(data.settings.free_shipping_enabled);
      setOrderPrefix(data.settings.order_prefix);
      setCompanyName(data.settings.company_name);
      setSupportEmail(data.settings.support_email);
      setPhone(data.settings.support_phone);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const rateNum = Number(exchangeRate);
      const data = await api.updateSettings({
        exchange_rate_usd_to_ngn: rateNum,
        free_shipping_enabled: freeShipping,
        order_prefix: orderPrefix,
        company_name: companyName,
        support_email: supportEmail,
        support_phone: phone
      });
      updateGlobalExchangeRate(rateNum);
      success('System settings & currency exchange rates updated successfully.');
    } catch (err: unknown) {
      error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Configuration & Exchange Rates</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure business rules, currency multipliers, and automated invoicing defaults
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 text-xs max-w-3xl">
        {/* Exchange Rate Section */}
        <div className="space-y-3 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Dual-Currency Exchange Rate (USD → NGN)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            All catalogue prices are authoritatively anchored in USD. The Nigerian Naira (NGN) price is calculated in real-time based on this rate.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Exchange Rate (1 USD = ? NGN)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">₦</span>
                <input
                  type="number"
                  step="1"
                  required
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-2 text-white font-bold font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex flex-col justify-center">
              <span>Preview conversion:</span>
              <strong className="text-amber-400 font-mono text-sm">
                $1,000 USD = ₦{(1000 * Number(exchangeRate || 1500)).toLocaleString()} NGN
              </strong>
            </div>
          </div>
        </div>

        {/* Global Logistics Section */}
        <div className="space-y-3 border-b border-slate-800 pb-5">
          <h3 className="font-bold text-white text-sm">Shipping & Logistics Rules</h3>
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-950 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={freeShipping}
              onChange={(e) => setFreeShipping(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            <div>
              <span className="font-bold text-white block">Free Global Freight Promotion Active</span>
              <span className="text-[11px] text-slate-400">
                Waives all shipping fees for orders destined for Nigeria or international delivery.
              </span>
            </div>
          </label>
        </div>

        {/* Enterprise Brand & Invoicing Contact Info */}
        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm">Company Details & Invoicing Header</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Legal Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Order Number Prefix</label>
              <input
                type="text"
                value={orderPrefix}
                onChange={(e) => setOrderPrefix(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Official Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Support Telephone Line</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
