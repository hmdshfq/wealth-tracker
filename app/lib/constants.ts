// Exchange rates (approximate - in real app would fetch live)
export const EXCHANGE_RATES = {
  EUR_PLN: 4.31,
  USD_PLN: 4.05,
  EUR_USD: 1.06,
};

// ETF data with simulated prices
export const ETF_DATA: Record<string, { name: string; currency: string; basePrice: number }> = {
  'FWIA.DE': {
    name: 'Invesco FTSE All-World',
    currency: 'EUR',
    basePrice: 7.12,
  },
  'VWCE.DE': {
    name: 'Vanguard FTSE All-World',
    currency: 'EUR',
    basePrice: 144.36,
  },
  'WEBN': {
    name: 'Amundi Prime All Country World',
    currency: 'EUR',
    basePrice: 8.45,
  },
  'IUSQ.DE': { 
    name: 'iShares MSCI ACWI', 
    currency: 'EUR', 
    basePrice: 92.42 
  },
};

export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
