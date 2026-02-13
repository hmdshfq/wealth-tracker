import { EXCHANGE_RATES } from './constants';
import { PreferredCurrency } from './types';

export const formatPLN = (val: number | undefined | null): string => {
  if (typeof val !== 'number' || isNaN(val)) {
    return 'zł0,00';
  }
  return `zł${val.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const formatEUR = (val: number): string =>
  `€${val.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export const formatPercent = (val: number): string => 
  `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

export const formatCurrency = (val: number, currency: string): string => {
  const symbol = currency === 'PLN' ? 'zł' : currency === 'EUR' ? '€' : '$';
  return `${symbol}${val.toLocaleString('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

// Convert a PLN value to the preferred currency
export const convertCurrency = (valuePLN: number, targetCurrency: PreferredCurrency): number => {
  if (targetCurrency === 'PLN') {
    return valuePLN;
  }
  if (targetCurrency === 'EUR') {
    return valuePLN / EXCHANGE_RATES.EUR_PLN;
  }
  if (targetCurrency === 'USD') {
    return valuePLN / EXCHANGE_RATES.USD_PLN;
  }
  return valuePLN;
};

// Format value in preferred currency (PLN-based values converted)
export const formatPreferredCurrency = (valuePLN: number, currency: PreferredCurrency): string => {
  const converted = convertCurrency(valuePLN, currency);
  return formatCurrency(converted, currency);
};
