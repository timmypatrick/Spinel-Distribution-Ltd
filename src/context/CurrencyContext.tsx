import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface CurrencyContextType {
  currency: 'USD' | 'NGN';
  setCurrency: (currency: 'USD' | 'NGN') => void;
  exchangeRate: number;
  refreshSettings: () => Promise<void>;
  formatPrice: (priceUsd: number, targetCurrency?: 'USD' | 'NGN') => string;
  convertToNgn: (priceUsd: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<'USD' | 'NGN'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(1500);

  const refreshSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data.settings && data.settings.exchange_rate_usd_to_ngn) {
        setExchangeRate(data.settings.exchange_rate_usd_to_ngn);
      }
    } catch (err) {
      console.warn('Could not fetch latest exchange rate, using fallback 1500:', err);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('spinel_currency');
    if (saved === 'USD' || saved === 'NGN') {
      setCurrencyState(saved);
    }
    refreshSettings();
  }, []);

  const setCurrency = (c: 'USD' | 'NGN') => {
    setCurrencyState(c);
    localStorage.setItem('spinel_currency', c);
  };

  const convertToNgn = (priceUsd: number): number => {
    return Math.round(priceUsd * exchangeRate * 100) / 100;
  };

  const formatPrice = (priceUsd: number, targetCurrency?: 'USD' | 'NGN'): string => {
    const active = targetCurrency || currency;
    if (active === 'NGN') {
      const ngnAmount = priceUsd * exchangeRate;
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 0
      }).format(ngnAmount);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(priceUsd);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, refreshSettings, formatPrice, convertToNgn }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
