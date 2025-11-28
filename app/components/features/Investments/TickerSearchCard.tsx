'use client';
import React, { useState } from 'react';
import { Card, Input, Button, SectionTitle } from '@/app/components/ui';
import { TickerInfo } from '@/app/lib/types';
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
}

export const TickerSearchCard: React.FC<TickerSearchCardProps> = ({
  onAddTicker,
  existingTickers,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <Card>
      <SectionTitle>Find & Add Tickers</SectionTitle>
      <div className={styles.searchContainer}>
        <Input 
          placeholder="Search symbol (e.g., AAPL, VWCE)" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          wrapperStyle={{ flex: 1 }}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {results.length > 0 && (
        <div className={styles.resultsList}>
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
                >
                  {isAdded ? 'Added' : 'Add'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
