export const formatPLN = (val: number | undefined | null): string => {
  if (typeof val !== 'number' || isNaN(val)) {
    return 'zł0,00';
  }
  return `zł${val.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatEUR = (val: number): string =>
  `€${val.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatPercent = (val: number): string => 
  `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

export const formatCurrency = (val: number, currency: string): string => {
  const symbol = currency === 'PLN' ? 'zł' : currency === 'EUR' ? '€' : '$';
  return `${symbol}${val.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
