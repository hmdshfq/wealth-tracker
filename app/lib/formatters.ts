import { EXCHANGE_RATES } from './constants';
import { PreferredCurrency } from './types';

// Dynamic exchange rates (set by useMarketData hook)
let dynamicRates: Record<string, number> = { ...EXCHANGE_RATES };

export const setExchangeRates = (rates: Record<string, number>) => {
  dynamicRates = { ...EXCHANGE_RATES, ...rates };
};

export const getExchangeRates = (): Record<string, number> => dynamicRates;

export const formatPLN = (val: number | undefined | null): string => {
  if (typeof val !== 'number' || isNaN(val)) {
    return '0,00 zł';
  }
  return `${val.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} zł`;
};

export const formatEUR = (val: number): string =>
  `€${val.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export const formatPercent = (val: number): string => 
  `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

// Currency formatting config
interface CurrencyFormat {
  symbol: string;
  locale: string;
  symbolPosition: 'prefix' | 'suffix';
  decimals: number;
}

const CURRENCY_CONFIG: Record<string, CurrencyFormat> = {
  USD: { symbol: '$', locale: 'en-US', symbolPosition: 'prefix', decimals: 2 },
  EUR: { symbol: '€', locale: 'de-DE', symbolPosition: 'suffix', decimals: 2 },
  GBP: { symbol: '£', locale: 'en-GB', symbolPosition: 'prefix', decimals: 2 },
  JPY: { symbol: '¥', locale: 'ja-JP', symbolPosition: 'prefix', decimals: 0 },
  CHF: { symbol: 'CHF ', locale: 'de-CH', symbolPosition: 'suffix', decimals: 2 },
  CAD: { symbol: 'C$', locale: 'en-CA', symbolPosition: 'prefix', decimals: 2 },
  AUD: { symbol: 'A$', locale: 'en-AU', symbolPosition: 'prefix', decimals: 2 },
  CNY: { symbol: '¥', locale: 'zh-CN', symbolPosition: 'prefix', decimals: 2 },
  INR: { symbol: '₹', locale: 'en-IN', symbolPosition: 'prefix', decimals: 2 },
  KRW: { symbol: '₩', locale: 'ko-KR', symbolPosition: 'prefix', decimals: 0 },
  SGD: { symbol: 'S$', locale: 'en-SG', symbolPosition: 'prefix', decimals: 2 },
  HKD: { symbol: 'HK$', locale: 'zh-HK', symbolPosition: 'prefix', decimals: 2 },
  NZD: { symbol: 'NZ$', locale: 'en-NZ', symbolPosition: 'prefix', decimals: 2 },
  SEK: { symbol: 'kr', locale: 'sv-SE', symbolPosition: 'suffix', decimals: 2 },
  NOK: { symbol: 'kr', locale: 'nb-NO', symbolPosition: 'suffix', decimals: 2 },
  DKK: { symbol: 'kr', locale: 'da-DK', symbolPosition: 'suffix', decimals: 2 },
  MXN: { symbol: '$', locale: 'es-MX', symbolPosition: 'prefix', decimals: 2 },
  BRL: { symbol: 'R$', locale: 'pt-BR', symbolPosition: 'prefix', decimals: 2 },
  PLN: { symbol: 'zł', locale: 'pl-PL', symbolPosition: 'suffix', decimals: 2 },
  CZK: { symbol: 'Kč', locale: 'cs-CZ', symbolPosition: 'suffix', decimals: 2 },
  HUF: { symbol: 'Ft', locale: 'hu-HU', symbolPosition: 'suffix', decimals: 0 },
  TRY: { symbol: '₺', locale: 'tr-TR', symbolPosition: 'prefix', decimals: 2 },
  ZAR: { symbol: 'R', locale: 'en-ZA', symbolPosition: 'prefix', decimals: 2 },
};

export const formatCurrency = (val: number, currency: string): string => {
  const config = CURRENCY_CONFIG[currency];
  
  if (!config) {
    // Fallback
    return `${currency}${val.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  
  const formatted = val.toLocaleString(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  
  if (config.symbolPosition === 'prefix') {
    return `${config.symbol}${formatted}`;
  }
  return `${formatted} ${config.symbol}`;
};

// Convert a PLN value to the preferred currency
export const convertCurrency = (valuePLN: number, targetCurrency: PreferredCurrency): number => {
  if (targetCurrency === 'PLN') {
    return valuePLN;
  }
  
  // Always use dynamic rates (from API if fetched, fallback otherwise)
  const rates = dynamicRates;
  
  // Direct conversion to EUR or USD
  if (targetCurrency === 'EUR') {
    return valuePLN / (rates.EUR_PLN || EXCHANGE_RATES.EUR_PLN);
  }
  if (targetCurrency === 'USD') {
    return valuePLN / (rates.USD_PLN || EXCHANGE_RATES.USD_PLN);
  }
  
  // Go through USD for other currencies: PLN -> USD -> target
  const usdPlnRate = rates.USD_PLN || EXCHANGE_RATES.USD_PLN;
  const targetUsdRate = rates[`${targetCurrency}_USD`];
  
  if (targetUsdRate) {
    // Convert PLN to USD, then USD to target
    const valueUSD = valuePLN / usdPlnRate;
    return valueUSD * targetUsdRate;
  }
  
  // Fallback: no rate available, return as-is
  return valuePLN;
};

// Format value in preferred currency (PLN-based values converted)
export const formatPreferredCurrency = (valuePLN: number, currency: PreferredCurrency): string => {
  const converted = convertCurrency(valuePLN, currency);
  return formatCurrency(converted, currency);
};

// Convert FROM a currency TO PLN (for cash balances)
export const convertToPLN = (value: number, fromCurrency: PreferredCurrency): number => {
  if (fromCurrency === 'PLN') {
    return value;
  }
  
  const rates = dynamicRates;
  
  if (fromCurrency === 'EUR') {
    return value * (rates.EUR_PLN || EXCHANGE_RATES.EUR_PLN);
  }
  if (fromCurrency === 'USD') {
    return value * (rates.USD_PLN || EXCHANGE_RATES.USD_PLN);
  }
  
  // Go through USD for other currencies
  const targetUsdRate = rates[`${fromCurrency}_USD`];
  const usdPlnRate = rates.USD_PLN || EXCHANGE_RATES.USD_PLN;
  
  if (targetUsdRate) {
    // Convert fromCurrency to USD, then USD to PLN
    const valueUSD = value * targetUsdRate;
    return valueUSD * usdPlnRate;
  }
  
  // Fallback: return as-is
  return value;
};