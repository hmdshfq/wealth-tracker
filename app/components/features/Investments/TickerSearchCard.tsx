'use client';
import React, { useState } from 'react';
import { Card, Input, Button, SectionTitle, Modal, Select } from '@/components/ui';
import { TickerInfo } from '@/lib/types';
import styles from './Investments.module.css';

interface SearchResult {
  symbol: string;
  shortname: string;
  exchDisp: string;
  typeDisp: string;
}

interface TickerSearchCardProps {
  onAddTicker: (symbol: string, info: TickerInfo) => void;
  existingTickers: string[];
  customTickers: Record<string, TickerInfo>;
  onEditTicker: (symbol: string, info: TickerInfo) => void;
  onDeleteTicker: (symbol: string) => void;
  allTickers: Record<string, TickerInfo>;
  heldTickers: string[];
}

export const TickerSearchCard: React.FC<TickerSearchCardProps> = ({
  onAddTicker,
  existingTickers,
  customTickers,
  onEditTicker,
  onDeleteTicker,
  allTickers,
  heldTickers,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TickerInfo>({ name: '', currency: 'EUR', basePrice: 0 });

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch(`/api/ticker-search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search tickers');
      
      const data = await response.json();
      setResults(data.results || []);
      
      if (data.results && data.results.length === 0) {
        setError('No results found');
      }
    } catch (err) {
      setError('Failed to fetch results');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAdd = (result: SearchResult) => {
    onAddTicker(result.symbol, {
      name: result.shortname,
      currency: 'EUR', // Default, will likely be updated by price fetcher or manual edit later
      basePrice: 0,
    });
  };

  const startEdit = (symbol: string, info: TickerInfo) => {
    setEditingTicker(symbol);
    setEditForm({ ...info });
  };

  const saveEdit = () => {
    if (editingTicker) {
      onEditTicker(editingTicker, editForm);
      setEditingTicker(null);
    }
  };

  const currencyOptions = [
    { value: 'EUR', label: 'EUR' },
    { value: 'USD', label: 'USD' },
    { value: 'PLN', label: 'PLN' },
  ];

  return (
    <Card>
      <SectionTitle>Find & Add Tickers</SectionTitle>
      <div className={styles.searchContainer} aria-busy={loading}>
        <Input 
          placeholder="Search symbol (e.g., AAPL, VWCE)" 
          value={query}
          onChange={(e) => {
            const newValue = e.target.value;
            setQuery(newValue);
            if (!newValue.trim()) {
              setResults([]);
              setError('');
            }
          }}
          onKeyDown={handleKeyDown}
          wrapperStyle={{ flex: 1 }}
        />
        <Button onClick={handleSearch} isLoading={loading} loadingLabel="Searching...">
          Search
        </Button>
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {results.length > 0 && (
        <div className={styles.resultsList} style={{ marginBottom: '24px' }}>
          {results.map((result) => {
            const isAdded = existingTickers.includes(result.symbol);
            return (
              <div 
                key={result.symbol} 
                className={styles.tickerResultRow}
              >
                <div className={styles.tickerResultInfo}>
                  <div className={styles.tickerSymbol}>{result.symbol}</div>
                  <div className={styles.tickerName}>
                    {result.shortname} • {result.exchDisp}
                  </div>
                </div>
                <Button
                  size="small" 
                  variant={isAdded ? "secondary" : "primary"}
                  disabled={isAdded}
                  onClick={() => handleAdd(result)}
                  className={styles.tickerResultButton}
                >
                  {isAdded ? 'Added' : 'Add'}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {Object.keys(allTickers).length > 0 && (
        <div className={styles.customTickersSection}>
          <SectionTitle>All Available Tickers</SectionTitle>
          <div className={styles.resultsList}>
            {Object.entries(allTickers).map(([symbol, info]) => {
              const isCustom = !!customTickers[symbol];
              // Check if held (case-insensitive just in case)
              const isHeld = heldTickers.some(h => h.toLowerCase() === symbol.toLowerCase());
              return (
                <div key={symbol} className={styles.tickerResultRow}>
                  <div className={styles.tickerResultInfo}>
                    <div className={styles.tickerSymbol}>{symbol}</div>
                    <div className={styles.tickerName}>{info.name} ({info.currency})</div>
                  </div>
                  <div className={styles.tickerResultActions}>
                    <Button size="small" variant="secondary" onClick={() => startEdit(symbol, info)} className={styles.tickerResultButton}>Edit</Button>
                    {!isHeld && (
                      <Button 
                        size="small" 
                        variant="red" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTicker(symbol);
                        }}
                        className={styles.tickerResultButton}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal 
        isOpen={!!editingTicker} 
        onClose={() => setEditingTicker(null)} 
        title={`Edit ${editingTicker}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
          <Input
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Select
            label="Currency"
            options={currencyOptions}
            value={editForm.currency}
            onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
          />
          <Input
            type="number"
            label="Base Price (Fallback)"
            value={editForm.basePrice}
            onChange={(e) => setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) || 0 })}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => setEditingTicker(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
