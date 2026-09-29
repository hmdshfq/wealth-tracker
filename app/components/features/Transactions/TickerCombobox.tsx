'use client';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { TickerInfo } from '@/lib/types';
import styles from './Transactions.module.css';

interface TickerSearchResult {
  symbol: string;
  shortname: string;
  exchDisp?: string;
  typeDisp?: string;
}

interface TickerComboboxProps {
  value: string;
  onChange: (ticker: string) => void;
  onRegister: (symbol: string, info: TickerInfo) => void;
  allTickers: Record<string, TickerInfo>;
  label?: string;
  wrapperStyle?: React.CSSProperties;
}

const SEARCH_DEBOUNCE_MS = 250;
const MAX_OPTIONS = 12;

// A searchable ticker field. Known tickers (allTickers) are matched locally for
// instant results; anything else is looked up against /api/ticker-search as you
// type. Selecting a symbol that isn't registered yet auto-registers it, so the
// ticker universe grows from use instead of a hardcoded seed list.
export const TickerCombobox: React.FC<TickerComboboxProps> = ({
  value,
  onChange,
  onRegister,
  allTickers,
  label,
  wrapperStyle,
}) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<TickerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Reflect external value changes (e.g. form reset) in the input text.
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Dismiss the dropdown when clicking outside the field.
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  // Debounced remote lookup. Only fires while the dropdown is open so we don't
  // hit Yahoo for a value the user never intends to change.
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 1) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/ticker-search?query=${encodeURIComponent(q)}`);
        if (!response.ok) throw new Error('Failed to search tickers');
        const data = await response.json();
        if (!cancelled) setResults(data.results || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  // Local matches come first so already-known tickers resolve without a request.
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const seen = new Set<string>();
    const merged: { symbol: string; name: string; exchange?: string }[] = [];

    for (const [symbol, info] of Object.entries(allTickers)) {
      if (seen.has(symbol)) continue;
      if (q && !symbol.toLowerCase().includes(q) && !info.name.toLowerCase().includes(q)) continue;
      seen.add(symbol);
      merged.push({ symbol, name: info.name });
    }

    for (const result of results) {
      if (seen.has(result.symbol)) continue;
      seen.add(result.symbol);
      merged.push({ symbol: result.symbol, name: result.shortname, exchange: result.exchDisp });
    }

    return merged.slice(0, MAX_OPTIONS);
  }, [allTickers, results, query]);

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  const select = (symbol: string, name?: string) => {
    onChange(symbol);
    setQuery(symbol);
    setOpen(false);
    // Register unknown symbols so they persist, get priced, and show a name.
    if (!allTickers[symbol]) {
      onRegister(symbol, { name: name || symbol, currency: 'EUR', basePrice: 0 });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      const choice = options[highlighted];
      if (open && choice) {
        e.preventDefault();
        select(choice.symbol, choice.name);
      } else if (query.trim()) {
        // Allow committing an arbitrary symbol the search didn't surface.
        e.preventDefault();
        onChange(query.trim());
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={styles.comboboxWrapper} style={wrapperStyle} ref={containerRef}>
      {label && <label className={styles.comboboxLabel}>{label}</label>}
      <input
        className={styles.comboboxInput}
        value={query}
        placeholder="Search ticker (e.g. VWCE, WEBN.DE)"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {open && (options.length > 0 || loading) && (
        <ul className={styles.comboboxDropdown} role="listbox" id={listboxId}>
          {loading && options.length === 0 && (
            <li className={styles.comboboxHint}>Searching…</li>
          )}
          {options.map((option, index) => (
            <li
              key={option.symbol}
              role="option"
              aria-selected={index === highlighted}
              className={`${styles.comboboxOption} ${index === highlighted ? styles.comboboxOptionActive : ''}`}
              onMouseEnter={() => setHighlighted(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                select(option.symbol, option.name);
              }}
            >
              <span className={styles.comboboxSymbol}>{option.symbol}</span>
              <span className={styles.comboboxName}>
                {option.name}
                {option.exchange ? ` • ${option.exchange}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TickerCombobox;
