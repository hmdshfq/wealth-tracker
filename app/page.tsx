'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Layout components
import { Header, Footer, Navigation, TabName } from '@/app/components/layout';

// Feature components
import {
  DashboardTab,
  HoldingsTab,
  TransactionsTab,
  CashTab,
  GoalTab,
  ExportModal,
  ImportModal,
} from '@/app/components/features';

// UI components
import { Toast } from '@/app/components/ui';

// Types and constants
import {
  Holding,
  HoldingWithDetails,
  Transaction,
  CashBalance,
  Goal,
  AllocationItem,
  ProjectionDataPoint,
  NewTransaction,
  NewCash,
} from '@/app/lib/types';
import { EXCHANGE_RATES, ETF_DATA } from '@/app/lib/constants';

// Styles
import styles from './page.module.css';

// ============================================================================
// INITIAL DATA
// ============================================================================

const INITIAL_HOLDINGS: Holding[] = [
  { ticker: 'FWIA.DE', shares: 518, avgCost: 6.54 },
  { ticker: 'VWCE.DE', shares: 7.13, avgCost: 122.18 },
  { ticker: 'IUSQ.DE', shares: 4, avgCost: 88.32 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, date: '2025-11-11', ticker: 'FWIA.DE', action: 'Buy', shares: 32, price: 7.15, currency: 'EUR' },
  { id: 2, date: '2025-11-04', ticker: 'FWIA.DE', action: 'Buy', shares: 34, price: 7.14, currency: 'EUR' },
  { id: 3, date: '2025-10-31', ticker: 'FWIA.DE', action: 'Buy', shares: 13, price: 7.18, currency: 'EUR' },
  { id: 4, date: '2025-10-13', ticker: 'FWIA.DE', action: 'Buy', shares: 29, price: 6.95, currency: 'EUR' },
  { id: 5, date: '2025-09-08', ticker: 'VWCE.DE', action: 'Buy', shares: 2, price: 141.5, currency: 'EUR' },
];

const INITIAL_CASH: CashBalance[] = [
  { currency: 'PLN', amount: 2500 },
  { currency: 'EUR', amount: 150 },
  { currency: 'USD', amount: 0 },
];

const INITIAL_GOAL: Goal = { amount: 4204928, targetYear: 2054 };

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InvestmentTracker() {
  // ---------------------------------------------------------------------------
  // Core State
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [goal, setGoal] = useState<Goal>(INITIAL_GOAL);
  const [holdings, setHoldings] = useState<Holding[]>(INITIAL_HOLDINGS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [cash, setCash] = useState<CashBalance[]>(INITIAL_CASH);

  // ---------------------------------------------------------------------------
  // Prices State
  // ---------------------------------------------------------------------------
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ---------------------------------------------------------------------------
  // Modal State
  // ---------------------------------------------------------------------------
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  // ---------------------------------------------------------------------------
  // Form State
  // ---------------------------------------------------------------------------
  const [newTx, setNewTx] = useState<NewTransaction>({
    date: new Date().toISOString().split('T')[0],
    ticker: 'FWIA.DE',
    action: 'Buy',
    shares: '',
    price: '',
    currency: 'EUR',
  });

  const [newCash, setNewCash] = useState<NewCash>({ currency: 'PLN', amount: '' });

  // ---------------------------------------------------------------------------
  // Goal Edit State
  // ---------------------------------------------------------------------------
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState<Goal>({ ...goal });

  // ---------------------------------------------------------------------------
  // Exchange Rates State
  // ---------------------------------------------------------------------------
  const [exchangeRates, setExchangeRates] = useState(EXCHANGE_RATES);

  // ---------------------------------------------------------------------------
  // Price Fetching
  // ---------------------------------------------------------------------------
  const fetchPrices = useCallback(async () => {
    setPricesLoading(true);

    try {
      // Fetch ETF prices
      const tickers = Object.keys(ETF_DATA).join(',');
      const pricesResponse = await fetch(`/api/prices?tickers=${tickers}`);

      if (!pricesResponse.ok) throw new Error('Failed to fetch prices');

      const pricesData = await pricesResponse.json();

      const newPrices: Record<string, number> = {};
      for (const [ticker, info] of Object.entries(pricesData.prices)) {
        newPrices[ticker] = (info as { price: number }).price;
      }

      setPrices(newPrices);

      // Fetch exchange rates
      const ratesResponse = await fetch('/api/exchange-rates');
      if (ratesResponse.ok) {
        const ratesData = await ratesResponse.json();
        setExchangeRates(ratesData.rates);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      // Fall back to base prices from constants
      const fallbackPrices: Record<string, number> = {};
      Object.entries(ETF_DATA).forEach(([ticker, data]) => {
        fallbackPrices[ticker] = data.basePrice;
      });
      setPrices(fallbackPrices);
    } finally {
      setPricesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // ---------------------------------------------------------------------------
  // Calculated Values
  // ---------------------------------------------------------------------------
  const portfolioValue = useMemo(() => {
    let totalEUR = 0;
    holdings.forEach((h) => {
      const price = prices[h.ticker] || ETF_DATA[h.ticker]?.basePrice || 0;
      totalEUR += h.shares * price;
    });
    return totalEUR * exchangeRates.EUR_PLN;
  }, [holdings, prices, exchangeRates]);

  const totalCost = useMemo(() => {
    let costEUR = 0;
    holdings.forEach((h) => {
      costEUR += h.shares * h.avgCost;
    });
    return costEUR * exchangeRates.EUR_PLN;
  }, [holdings, exchangeRates]);

  const totalCashPLN = useMemo(() => {
    return cash.reduce((sum, c) => {
      if (c.currency === 'PLN') return sum + c.amount;
      if (c.currency === 'EUR') return sum + c.amount * exchangeRates.EUR_PLN;
      if (c.currency === 'USD') return sum + c.amount * exchangeRates.USD_PLN;
      return sum;
    }, 0);
  }, [cash, exchangeRates]);

  const totalNetWorth = portfolioValue + totalCashPLN;
  const totalGain = portfolioValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const goalProgress = (totalNetWorth / goal.amount) * 100;

  const holdingsData: HoldingWithDetails[] = useMemo(() => {
    return holdings.map((h) => {
      const price = prices[h.ticker] || ETF_DATA[h.ticker]?.basePrice || 0;
      const value = h.shares * price;
      const cost = h.shares * h.avgCost;
      const gain = value - cost;
      const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
      return {
        ...h,
        name: ETF_DATA[h.ticker]?.name || h.ticker,
        price,
        value,
        valuePLN: value * exchangeRates.EUR_PLN,
        cost,
        gain,
        gainPercent,
      };
    });
  }, [holdings, prices, exchangeRates]);

  const allocationData: AllocationItem[] = useMemo(() => {
    const total = holdingsData.reduce((sum, h) => sum + h.value, 0);
    return holdingsData.map((h) => ({
      name: h.ticker,
      value: h.value,
      percent: total > 0 ? (h.value / total) * 100 : 0,
    }));
  }, [holdingsData]);

  const projectionData: ProjectionDataPoint[] = useMemo(() => {
    const currentYear = 2025;
    const years: ProjectionDataPoint[] = [];
    let value = totalNetWorth;
    const monthlyContribution = 1500;
    const annualReturn = 0.07;

    for (let year = currentYear; year <= goal.targetYear; year++) {
      years.push({ year, value: Math.round(value), goal: goal.amount });
      value = value * (1 + annualReturn) + monthlyContribution * 12;
    }
    return years;
  }, [totalNetWorth, goal]);

  // ---------------------------------------------------------------------------
  // Export Functions
  // ---------------------------------------------------------------------------
  const exportToJSON = useCallback(() => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      goal,
      holdings,
      transactions,
      cash,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment-tracker-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  }, [goal, holdings, transactions, cash]);

  const exportToCSV = useCallback((type: 'holdings' | 'transactions' | 'cash') => {
    let csv = '';
    let filename = '';

    if (type === 'holdings') {
      csv = 'Ticker,Name,Shares,AvgCost,CurrentPrice,ValueEUR,ValuePLN,GainEUR,GainPercent\n';
      holdingsData.forEach((h) => {
        csv += `${h.ticker},"${h.name}",${h.shares.toFixed(4)},${h.avgCost.toFixed(2)},${h.price.toFixed(2)},${h.value.toFixed(2)},${h.valuePLN.toFixed(2)},${h.gain.toFixed(2)},${h.gainPercent.toFixed(2)}\n`;
      });
      filename = `holdings-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'transactions') {
      csv = 'Date,Ticker,Action,Shares,Price,Currency,Total\n';
      transactions.forEach((tx) => {
        csv += `${tx.date},${tx.ticker},${tx.action},${tx.shares},${tx.price.toFixed(2)},${tx.currency},${(tx.shares * tx.price).toFixed(2)}\n`;
      });
      filename = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'cash') {
      csv = 'Currency,Amount,AmountPLN\n';
      cash.forEach((c) => {
        let inPLN = c.amount;
        if (c.currency === 'EUR') inPLN = c.amount * exchangeRates.EUR_PLN;
        if (c.currency === 'USD') inPLN = c.amount * exchangeRates.USD_PLN;
        csv += `${c.currency},${c.amount.toFixed(2)},${inPLN.toFixed(2)}\n`;
      });
      filename = `cash-${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  }, [holdingsData, transactions, cash, exchangeRates]);

  // ---------------------------------------------------------------------------
  // Import Functions
  // ---------------------------------------------------------------------------
  const handleImport = useCallback(() => {
    setImportError('');
    try {
      const data = JSON.parse(importData);

      if (!data.holdings || !data.transactions || !data.cash || !data.goal) {
        throw new Error('Invalid file format. Missing required fields.');
      }

      if (!Array.isArray(data.holdings)) throw new Error('Holdings must be an array');
      data.holdings.forEach((h: Holding, i: number) => {
        if (!h.ticker || typeof h.shares !== 'number' || typeof h.avgCost !== 'number') {
          throw new Error(`Invalid holding at index ${i}`);
        }
      });

      if (!Array.isArray(data.transactions)) throw new Error('Transactions must be an array');
      data.transactions.forEach((tx: Transaction, i: number) => {
        if (!tx.date || !tx.ticker || !tx.action || typeof tx.shares !== 'number' || typeof tx.price !== 'number') {
          throw new Error(`Invalid transaction at index ${i}`);
        }
      });

      if (!Array.isArray(data.cash)) throw new Error('Cash must be an array');
      data.cash.forEach((c: CashBalance, i: number) => {
        if (!c.currency || typeof c.amount !== 'number') {
          throw new Error(`Invalid cash entry at index ${i}`);
        }
      });

      if (typeof data.goal.amount !== 'number' || typeof data.goal.targetYear !== 'number') {
        throw new Error('Invalid goal format');
      }

      setHoldings(data.holdings);
      setTransactions(data.transactions);
      setCash(data.cash);
      setGoal(data.goal);
      setShowImportModal(false);
      setImportData('');
    } catch (e) {
      setImportError((e as Error).message || 'Failed to parse JSON');
    }
  }, [importData]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(event.target?.result as string);
      setImportError('');
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  // ---------------------------------------------------------------------------
  // Transaction Functions
  // ---------------------------------------------------------------------------
  const addTransaction = useCallback(() => {
    if (!newTx.shares || !newTx.price) return;

    const tx: Transaction = {
      id: Date.now(),
      date: newTx.date,
      ticker: newTx.ticker,
      action: newTx.action as 'Buy' | 'Sell',
      shares: parseFloat(newTx.shares),
      price: parseFloat(newTx.price),
      currency: newTx.currency,
    };

    setTransactions((prev) => [tx, ...prev]);

    const existingIdx = holdings.findIndex((h) => h.ticker === tx.ticker);
    if (existingIdx >= 0) {
      const existing = holdings[existingIdx];
      const newShares = existing.shares + tx.shares;
      const newAvgCost = (existing.shares * existing.avgCost + tx.shares * tx.price) / newShares;
      const updated = [...holdings];
      updated[existingIdx] = { ...existing, shares: newShares, avgCost: newAvgCost };
      setHoldings(updated);
    } else {
      setHoldings((prev) => [...prev, { ticker: tx.ticker, shares: tx.shares, avgCost: tx.price }]);
    }

    setNewTx((prev) => ({ ...prev, shares: '', price: '' }));
  }, [newTx, holdings]);

  // ---------------------------------------------------------------------------
  // Cash Functions
  // ---------------------------------------------------------------------------
  const addCash = useCallback(() => {
    if (!newCash.amount) return;
    const idx = cash.findIndex((c) => c.currency === newCash.currency);
    if (idx >= 0) {
      const updated = [...cash];
      updated[idx] = { ...updated[idx], amount: updated[idx].amount + parseFloat(newCash.amount) };
      setCash(updated);
    }
    setNewCash((prev) => ({ ...prev, amount: '' }));
  }, [newCash, cash]);

  // ---------------------------------------------------------------------------
  // Goal Functions
  // ---------------------------------------------------------------------------
  const handleGoalEditStart = useCallback(() => {
    setEditingGoal(true);
    setTempGoal({ ...goal });
  }, [goal]);

  const handleGoalEditSave = useCallback(() => {
    setGoal({ ...tempGoal });
    setEditingGoal(false);
  }, [tempGoal]);

  const handleGoalEditCancel = useCallback(() => {
    setEditingGoal(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className={styles.container}>
      <Header
        onImport={() => setShowImportModal(true)}
        onExport={() => setShowExportModal(true)}
        onRefresh={fetchPrices}
        isLoading={pricesLoading}
        lastUpdate={lastUpdate}
      />

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className={styles.main}>
        {activeTab === 'dashboard' && (
          <DashboardTab
            portfolioValue={portfolioValue}
            totalGain={totalGain}
            totalGainPercent={totalGainPercent}
            totalCashPLN={totalCashPLN}
            cash={cash}
            totalNetWorth={totalNetWorth}
            goal={goal}
            goalProgress={goalProgress}
            allocationData={allocationData}
            projectionData={projectionData}
            prices={prices}
          />
        )}

        {activeTab === 'holdings' && (
          <HoldingsTab
            holdingsData={holdingsData}
            portfolioValue={portfolioValue}
            totalGain={totalGain}
            totalGainPercent={totalGainPercent}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            newTx={newTx}
            onTxChange={(updates) => setNewTx((prev) => ({ ...prev, ...updates }))}
            onAddTransaction={addTransaction}
          />
        )}

        {activeTab === 'cash' && (
          <CashTab
            cash={cash}
            totalCashPLN={totalCashPLN}
            newCash={newCash}
            onCashChange={(updates) => setNewCash((prev) => ({ ...prev, ...updates }))}
            onAddCash={addCash}
          />
        )}

        {activeTab === 'goal' && (
          <GoalTab
            goal={goal}
            tempGoal={tempGoal}
            editingGoal={editingGoal}
            totalNetWorth={totalNetWorth}
            goalProgress={goalProgress}
            projectionData={projectionData}
            onEditStart={handleGoalEditStart}
            onEditCancel={handleGoalEditCancel}
            onEditSave={handleGoalEditSave}
            onTempGoalChange={(updates) => setTempGoal((prev) => ({ ...prev, ...updates }))}
          />
        )}
      </main>

      <Footer />

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportJSON={exportToJSON}
        onExportCSV={exportToCSV}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        importData={importData}
        importError={importError}
        onImportDataChange={setImportData}
        onFileUpload={handleFileUpload}
        onImport={handleImport}
      />

      {/* Toast */}
      <Toast message="Export successful!" isVisible={exportSuccess} />
    </div>
  );
}
