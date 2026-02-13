'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

// Layout components
import { Header, Footer, Navigation, TabName } from '@/app/components/layout';

// Feature components
import {
  DashboardTab,
  InvestmentsTab,
  CashTab,
  ExportModal,
  ImportModal,
} from '@/app/components/features';

// UI components
import { Toast, LocalStorageBanner } from '@/app/components/ui';

// Types and constants
import {
  HoldingWithDetails,
  Transaction,
  CashBalance,
  CashTransaction,
  Goal,
  AllocationItem,
  NewTransaction,
  NewCash,
  TickerInfo,
  PreferredCurrency,
} from '@/app/lib/types';
import { EXCHANGE_RATES, ETF_DATA } from '@/app/lib/constants';
import { calculateGoalAmount } from '@/app/lib/goalCalculations';
import { calculateHoldingsFromTransactions } from '@/app/lib/holdingsCalculations';
import { generateProjectionData, calculateCumulativeContributions } from '@/app/lib/projectionCalculations';
import { 
  generateInvestmentReportPDF,
  exportGoalProgressChartPDF,
  exportSummaryReport,
  downloadPDF 
} from '@/app/lib/pdfExport';
import {
  DEMO_CASH,
  DEMO_CASH_TRANSACTIONS,
  DEMO_CUSTOM_TICKERS,
  DEMO_GOAL,
  DEMO_TRANSACTIONS,
} from '@/app/lib/demoData';


// Styles
import styles from './page.module.css';

// ============================================================================
// INITIAL DATA
// ============================================================================

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_CASH: CashBalance[] = [
  { currency: 'PLN', amount: 0 },
  { currency: 'EUR', amount: 0 },
  { currency: 'USD', amount: 0 },
];

const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [];

const INITIAL_GOAL: Goal = {
  retirementYear: 2050,
  annualReturn: 0.07,
  monthlyDeposits: 0,
  amount: 0,
  targetYear: 2050,
  depositIncreasePercentage: 0,
  startDate: new Date().toISOString().split('T')[0],
};

const STORAGE_KEY = 'investment-tracker-data';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InvestmentTracker() {
  // ---------------------------------------------------------------------------
  // Core State
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');

  // Currency preference
  const [preferredCurrency, setPreferredCurrency] = useState<PreferredCurrency>('PLN');
  const [goal, setGoal] = useState<Goal>(INITIAL_GOAL);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [cash, setCash] = useState<CashBalance[]>(INITIAL_CASH);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(INITIAL_CASH_TRANSACTIONS);
  const [customTickers, setCustomTickers] = useState<Record<string, TickerInfo>>({});

  // Compute holdings from transactions
  const holdings = useMemo(() => calculateHoldingsFromTransactions(transactions), [transactions]);
  const allTickers = useMemo(() => ({ ...ETF_DATA, ...customTickers }), [customTickers]);

  // ---------------------------------------------------------------------------
  // Data Persistence
  // ---------------------------------------------------------------------------
  const { isLoaded: isAuthLoaded, isSignedIn } = useUser();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const isCloudMode = isAuthLoaded && isSignedIn && !isLocalOnly;
  const isGuestMode = isAuthLoaded && !isSignedIn;
  const showLocalStorageBanner = isAuthLoaded && !isSignedIn;
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastCloudSave, setLastCloudSave] = useState<Date | null>(null);
  const [cloudSaveToast, setCloudSaveToast] = useState(false);
  const [cloudErrorToast, setCloudErrorToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('local-only-mode');
    if (stored === 'true') {
      setIsLocalOnly(true);
    }
  }, []);

  // Load preferred currency from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('preferred-currency');
    if (stored === 'EUR' || stored === 'USD' || stored === 'PLN') {
      setPreferredCurrency(stored);
    }
  }, []);

  const buildCloudPayload = useCallback(() => {
    return {
      goal,
      transactions,
      cash,
      cashTransactions,
      customTickers,
    };
  }, [goal, transactions, cash, cashTransactions, customTickers]);

  const saveToCloud = useCallback(
    async (showToast: boolean) => {
      if (!isCloudMode) return;
      setCloudSaveStatus('saving');
      try {
        const response = await fetch('/api/user-data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(buildCloudPayload()),
        });

        if (!response.ok) {
          throw new Error('Failed to save data');
        }

        setCloudSaveStatus('saved');
        setLastCloudSave(new Date());
        if (showToast) {
          setCloudSaveToast(true);
          setTimeout(() => setCloudSaveToast(false), 2500);
        }
      } catch (error) {
        console.error('Failed to save data to database:', error);
        setCloudSaveStatus('error');
        if (showToast) {
          setCloudErrorToast(true);
          setTimeout(() => setCloudErrorToast(false), 3000);
        }
      }
    },
    [buildCloudPayload, isCloudMode]
  );

  const toggleLocalOnly = useCallback(() => {
    setIsLocalOnly((prev) => {
      const next = !prev;
      localStorage.setItem('local-only-mode', String(next));
      if (next) {
        setCloudSaveStatus('idle');
      }
      if (!next && isSignedIn) {
        void saveToCloud(true);
      }
      return next;
    });
  }, [isSignedIn, saveToCloud]);

  useEffect(() => {
    if (!isAuthLoaded) return;
    let isActive = true;

    const loadData = async () => {
      if (isSignedIn) {
        try {
          const response = await fetch('/api/user-data', {
            cache: 'no-store',
            credentials: 'include',
          });
          if (!response.ok) {
            const details = await response.text();
            console.error('Failed to load user data:', response.status, details);
            setCloudSaveStatus('error');
            return;
          }
          const result = await response.json();
          if (!isActive) return;
          const data = result?.data;
          if (data) {
            if (data.goal) setGoal(data.goal);
            if (data.transactions) setTransactions(data.transactions);
            if (data.cash) setCash(data.cash);
            if (data.cashTransactions) setCashTransactions(data.cashTransactions);
            if (data.customTickers) setCustomTickers(data.customTickers);
          }
        } catch (error) {
          console.error('Failed to load data from database:', error);
          setCloudSaveStatus('error');
        } finally {
          if (isActive) setIsDataLoaded(true);
        }
        return;
      }

      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (parsedData.goal) setGoal(parsedData.goal);
          if (parsedData.transactions) setTransactions(parsedData.transactions);
          if (parsedData.cash) setCash(parsedData.cash);
          if (parsedData.cashTransactions) setCashTransactions(parsedData.cashTransactions);
          if (parsedData.customTickers) setCustomTickers(parsedData.customTickers);
        } else {
          const demoPayload = {
            goal: DEMO_GOAL,
            transactions: DEMO_TRANSACTIONS,
            cash: DEMO_CASH,
            cashTransactions: DEMO_CASH_TRANSACTIONS,
            customTickers: DEMO_CUSTOM_TICKERS,
          };
          setGoal(DEMO_GOAL);
          setTransactions(DEMO_TRANSACTIONS);
          setCash(DEMO_CASH);
          setCashTransactions(DEMO_CASH_TRANSACTIONS);
          setCustomTickers(DEMO_CUSTOM_TICKERS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPayload));
        }
      } catch (error) {
        console.error('Failed to load data from local storage:', error);
        setGoal(DEMO_GOAL);
        setTransactions(DEMO_TRANSACTIONS);
        setCash(DEMO_CASH);
        setCashTransactions(DEMO_CASH_TRANSACTIONS);
        setCustomTickers(DEMO_CUSTOM_TICKERS);
      } finally {
        if (isActive) setIsDataLoaded(true);
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [isAuthLoaded, isSignedIn]);

  useEffect(() => {
    if (!isDataLoaded) return;

    if (isCloudMode) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        void saveToCloud(false);
      }, 800);

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buildCloudPayload()));
    } catch (error) {
      console.error('Failed to save data to local storage:', error);
    }
  }, [buildCloudPayload, isDataLoaded, isCloudMode, saveToCloud]);

  // ---------------------------------------------------------------------------
  // Prices State
  // ---------------------------------------------------------------------------
  type PriceData = {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
};

const [prices, setPrices] = useState<Record<string, PriceData>>({});
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

  const [newCash, setNewCash] = useState<NewCash>({
    currency: 'PLN',
    amount: '',
    type: 'deposit',
    note: '',
  });

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
      // Check if there are any tickers to fetch
      const tickers = Object.keys(allTickers);
      if (tickers.length === 0) {
        console.log('No tickers available, using fallback prices');
        setPrices({});
        return;
      }

      // Fetch ETF prices
      const tickersParam = tickers.join(',');
      const pricesResponse = await fetch(`/api/prices?tickers=${tickersParam}`);

      if (!pricesResponse.ok) {
        throw new Error(`HTTP ${pricesResponse.status}: ${pricesResponse.statusText}`);
      }

      const pricesData = await pricesResponse.json();

      if (pricesData.error) {
        throw new Error(pricesData.error);
      }

      const newPrices: Record<string, PriceData> = {};
      for (const [ticker, info] of Object.entries(pricesData.prices || {})) {
        newPrices[ticker] = info as PriceData;
      }

      setPrices(newPrices);

      // Fetch exchange rates
      const ratesResponse = await fetch('/api/exchange-rates');
      if (ratesResponse.ok) {
        const ratesData = await ratesResponse.json();
        setExchangeRates(ratesData.rates);
      } else {
        console.warn('Failed to fetch exchange rates, using fallback');
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.warn('Failed to fetch prices from API, using fallback:', error instanceof Error ? error.message : error);
      // Fall back to base prices from constants
      const fallbackPrices: Record<string, PriceData> = {};
      Object.entries(allTickers).forEach(([ticker, data]) => {
        fallbackPrices[ticker] = {
          price: data.basePrice,
          change: 0,
          changePercent: 0,
          currency: data.currency || 'EUR'
        };
      });
      setPrices(fallbackPrices);
    } finally {
      setPricesLoading(false);
    }
  }, [allTickers]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 300000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // ---------------------------------------------------------------------------
  // Calculated Values
  // ---------------------------------------------------------------------------
  const portfolioValue = useMemo(() => {
    let totalEUR = 0;
    holdings.forEach((h) => {
      const price = prices[h.ticker]?.price || allTickers[h.ticker]?.basePrice || 0;
      totalEUR += h.shares * price;
    });
    return totalEUR * exchangeRates.EUR_PLN;
  }, [holdings, prices, exchangeRates, allTickers]);

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
  const cloudToastMessage = lastCloudSave
    ? `Cloud synced at ${lastCloudSave.toLocaleTimeString()}`
    : 'Cloud synced';

  const holdingsData: HoldingWithDetails[] = useMemo(() => {
    return holdings.map((h) => {
      const price = prices[h.ticker]?.price || allTickers[h.ticker]?.basePrice || 0;
      const value = h.shares * price;
      const cost = h.shares * h.avgCost;
      const gain = value - cost;
      const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
      return {
        ...h,
        name: allTickers[h.ticker]?.name || h.ticker,
        price,
        value,
        valuePLN: value * exchangeRates.EUR_PLN,
        cost,
        gain,
        gainPercent,
      };
    });
  }, [holdings, prices, exchangeRates, allTickers]);

  const allocationData: AllocationItem[] = useMemo(() => {
    const total = holdingsData.reduce((sum, h) => sum + h.value, 0);
    return holdingsData.map((h) => ({
      name: h.ticker,
      value: h.value,
      percent: total > 0 ? (h.value / total) * 100 : 0,
    }));
  }, [holdingsData]);

  // ---------------------------------------------------------------------------
  // Export Functions
  // ---------------------------------------------------------------------------
  const exportToJSON = useCallback(() => {
    const data = {
      version: '1.1',
      exportDate: new Date().toISOString(),
      goal,
      transactions,
      cash,
      cashTransactions,
      customTickers,
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
  }, [goal, transactions, cash, cashTransactions, customTickers]);

  // PDF Export Functions
  const exportToPDF = useCallback(async (type: 'full' | 'summary' | 'goal-chart') => {
    try {
      let blob: Blob | null = null;
      let filename = '';

      if (type === 'full') {
        // Generate comprehensive report
        const projectionData = generateProjectionData(goal, totalNetWorth);
        blob = await generateInvestmentReportPDF(
          goal,
          holdingsData,
          transactions,
          cash,
          cashTransactions,
          projectionData
        );
        filename = `investment-report-${new Date().toISOString().split('T')[0]}`;
      } else if (type === 'summary') {
        // Generate summary report
        blob = await exportSummaryReport(goal, holdingsData, cash);
        filename = `summary-report-${new Date().toISOString().split('T')[0]}`;
      } else if (type === 'goal-chart') {
        // Generate goal progress chart
        const projectionData = generateProjectionData(goal, totalNetWorth);
        const totalActualContributions = calculateCumulativeContributions(transactions, exchangeRates);
        blob = await exportGoalProgressChartPDF(
          goal,
          projectionData,
          totalNetWorth,
          totalActualContributions
        );
        filename = `goal-progress-${new Date().toISOString().split('T')[0]}`;
      }

      if (!blob || !filename) {
        throw new Error(`Unsupported PDF export type: ${type}`);
      }

      downloadPDF(blob, filename);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('PDF export failed:', error);
      setImportError('Failed to generate PDF report');
      setTimeout(() => setImportError(''), 3000);
    }
  }, [goal, holdingsData, transactions, cash, cashTransactions, totalNetWorth, exchangeRates]);

  const exportToCSV = useCallback((type: 'holdings' | 'investments' | 'cash' | 'cashTransactions') => {
    let csv = '';
    let filename = '';

    if (type === 'holdings') {
      csv = 'Ticker,Name,Shares,AvgCost,CurrentPrice,ValueEUR,ValuePLN,GainEUR,GainPercent\n';
      holdingsData.forEach((h) => {
        csv += `${h.ticker},"${h.name}",${h.shares.toFixed(4)},${h.avgCost.toFixed(2)},${h.price.toFixed(2)},${h.value.toFixed(2)},${h.valuePLN.toFixed(2)},${h.gain.toFixed(2)},${h.gainPercent.toFixed(2)}\n`;
      });
      filename = `holdings-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'investments') {
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
    } else if (type === 'cashTransactions') {
      csv = 'Date,Type,Currency,Amount,Note\n';
      cashTransactions.forEach((tx) => {
        csv += `${tx.date},${tx.type},${tx.currency},${tx.amount.toFixed(2)},"${tx.note || ''}"\n`;
      });
      filename = `cash-transactions-${new Date().toISOString().split('T')[0]}.csv`;
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
  }, [holdingsData, transactions, cash, cashTransactions, exchangeRates]);

  // ---------------------------------------------------------------------------
  // Import Functions
  // ---------------------------------------------------------------------------
  const handleImport = useCallback(() => {
    setImportError('');
    try {
      const data = JSON.parse(importData);

      if (!data.transactions || !data.cash || !data.goal) {
        throw new Error('Invalid file format. Missing required fields (transactions, cash, goal).');
      }

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

      setTransactions(data.transactions);
      setCash(data.cash);
      setGoal(data.goal);
      // Handle cashTransactions (may not exist in older exports)
      if (data.cashTransactions && Array.isArray(data.cashTransactions)) {
        setCashTransactions(data.cashTransactions);
      } else {
        setCashTransactions([]);
      }
      // Handle customTickers
      if (data.customTickers && typeof data.customTickers === 'object') {
        setCustomTickers(data.customTickers);
      }

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

  const addCustomTicker = useCallback((symbol: string, info: TickerInfo) => {
    setCustomTickers((prev) => ({ ...prev, [symbol]: info }));
  }, []);

  const editCustomTicker = useCallback((symbol: string, info: TickerInfo) => {
    setCustomTickers((prev) => ({ ...prev, [symbol]: info }));
  }, []);

  const deleteCustomTicker = useCallback((symbol: string) => {
    setCustomTickers((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
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
    setNewTx((prev) => ({ ...prev, shares: '', price: '' }));
  }, [newTx]);

  const editTransaction = useCallback((editedTx: Transaction) => {
    // Update transaction only - holdings will be recalculated automatically
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === editedTx.id ? editedTx : tx))
    );
  }, []);

  const deleteTransaction = useCallback((id: number) => {
    // Remove transaction only - holdings will be recalculated automatically
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---------------------------------------------------------------------------
  // Cash Functions
  // ---------------------------------------------------------------------------
  const addCash = useCallback(() => {
    if (!newCash.amount) return;

    const amount = parseFloat(newCash.amount);
    const currency = newCash.currency as 'PLN' | 'EUR' | 'USD';

    // Create transaction
    const tx: CashTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: newCash.type,
      currency,
      amount,
      note: newCash.note || undefined,
    };

    setCashTransactions((prev) => [tx, ...prev]);

    // Update balance
    const idx = cash.findIndex((c) => c.currency === currency);
    if (idx >= 0) {
      const updated = [...cash];
      const delta = newCash.type === 'deposit' ? amount : -amount;
      updated[idx] = { ...updated[idx], amount: updated[idx].amount + delta };
      setCash(updated);
    }

    setNewCash((prev) => ({ ...prev, amount: '', note: '' }));
  }, [newCash, cash]);

  const editCashTransaction = useCallback((editedTx: CashTransaction) => {
    // Find original transaction
    const originalTx = cashTransactions.find((tx) => tx.id === editedTx.id);
    if (!originalTx) return;

    // Reverse original transaction's effect on balance
    const originalDelta = originalTx.type === 'deposit' ? -originalTx.amount : originalTx.amount;
    const newDelta = editedTx.type === 'deposit' ? editedTx.amount : -editedTx.amount;

    // Update cash balances
    setCash((prevCash) => {
      const updated = [...prevCash];

      // If currency changed, update both old and new currencies
      if (originalTx.currency !== editedTx.currency) {
        // Remove from old currency
        const oldIdx = updated.findIndex((c) => c.currency === originalTx.currency);
        if (oldIdx >= 0) {
          updated[oldIdx] = { ...updated[oldIdx], amount: updated[oldIdx].amount + originalDelta };
        }
        // Add to new currency
        const newIdx = updated.findIndex((c) => c.currency === editedTx.currency);
        if (newIdx >= 0) {
          updated[newIdx] = { ...updated[newIdx], amount: updated[newIdx].amount + newDelta };
        }
      } else {
        // Same currency - just update the difference
        const idx = updated.findIndex((c) => c.currency === editedTx.currency);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], amount: updated[idx].amount + originalDelta + newDelta };
        }
      }

      return updated;
    });

    // Update transaction
    setCashTransactions((prev) =>
      prev.map((tx) => (tx.id === editedTx.id ? editedTx : tx))
    );
  }, [cashTransactions]);

  const deleteCashTransaction = useCallback((id: number) => {
    const tx = cashTransactions.find((t) => t.id === id);
    if (!tx) return;

    // Reverse the transaction's effect on balance
    const delta = tx.type === 'deposit' ? -tx.amount : tx.amount;

    setCash((prevCash) => {
      const updated = [...prevCash];
      const idx = updated.findIndex((c) => c.currency === tx.currency);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], amount: updated[idx].amount + delta };
      }
      return updated;
    });

    // Remove transaction
    setCashTransactions((prev) => prev.filter((t) => t.id !== id));
  }, [cashTransactions]);

  // ---------------------------------------------------------------------------
  // Goal Functions
  // ---------------------------------------------------------------------------
  const handleGoalEditStart = useCallback(() => {
    setEditingGoal(true);
    setTempGoal({ ...goal });
  }, [goal]);

  const handleGoalEditSave = useCallback(() => {
    // Calculate the goal amount based on retirement parameters
    const calculatedAmount = calculateGoalAmount(
      totalNetWorth,
      tempGoal.retirementYear,
      tempGoal.annualReturn,
      tempGoal.monthlyDeposits,
      tempGoal.depositIncreasePercentage
    );

    setGoal({
      ...tempGoal,
      amount: calculatedAmount,
      targetYear: tempGoal.retirementYear,
    });
    setEditingGoal(false);
  }, [tempGoal, totalNetWorth]);

  const handleGoalEditCancel = useCallback(() => {
    setEditingGoal(false);
  }, []);

  // ---------------------------------------------------------------------------

  // Currency preference handlers
  const handlePreferredCurrencyChange = useCallback((currency: PreferredCurrency) => {
    setPreferredCurrency(currency);
    localStorage.setItem('preferred-currency', currency);
  }, []);
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className={styles.container}>
      {showLocalStorageBanner && <LocalStorageBanner />}
      <Header
        onImport={() => setShowImportModal(true)}
        onExport={() => setShowExportModal(true)}
        onRefresh={fetchPrices}
        isLoading={pricesLoading}
        lastUpdate={lastUpdate}
        onSyncCloud={isCloudMode ? () => saveToCloud(true) : undefined}
        onRetrySync={cloudSaveStatus === 'error' ? () => saveToCloud(true) : undefined}
        onToggleLocalOnly={isAuthLoaded && isSignedIn ? toggleLocalOnly : undefined}
        cloudSaveStatus={cloudSaveStatus}
        isLocalOnly={isLocalOnly}
      />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className={styles.main}>
          {activeTab === 'dashboard' && (
            <div>
              <DashboardTab
                portfolioValue={portfolioValue}
                totalGain={totalGain}
                totalGainPercent={totalGainPercent}
                totalCashPLN={totalCashPLN}
                cash={cash}
                totalNetWorth={totalNetWorth}
                allocationData={allocationData}
                prices={prices}
                etfData={allTickers}
                goal={goal}
                goalProgress={goalProgress}
                preferredCurrency={preferredCurrency}
              />
            </div>
          )}

          {activeTab === 'investments' && (
            <div>
              <InvestmentsTab
                // Transaction data
                transactions={transactions}
                prices={prices}
                etfData={allTickers}
                newTx={newTx}
                onTxChange={(updates) => setNewTx((prev) => ({ ...prev, ...updates }))}
                onAddTransaction={addTransaction}
                onEditTransaction={editTransaction}
                onDeleteTransaction={deleteTransaction}
                onAddTicker={addCustomTicker}
                customTickers={customTickers}
                onEditTicker={editCustomTicker}
                onDeleteTicker={deleteCustomTicker}
                // Holdings for ticker search
                holdingsData={holdingsData}
                // Goal data
                goal={goal}
                tempGoal={tempGoal}
                editingGoal={editingGoal}
                totalNetWorth={totalNetWorth}
                goalProgress={goalProgress}
                preferredCurrency={preferredCurrency}
                portfolioValue={portfolioValue}
                exchangeRates={exchangeRates}
                onPreferredCurrencyChange={handlePreferredCurrencyChange}
                onEditStart={handleGoalEditStart}
                onEditCancel={handleGoalEditCancel}
                onEditSave={handleGoalEditSave}
                onTempGoalChange={(updates) => setTempGoal((prev) => ({ ...prev, ...updates }))}
              />
            </div>
          )}

          {activeTab === 'cash' && (
            <div>
              <CashTab
                cash={cash}
                cashTransactions={cashTransactions}
                totalCashPLN={totalCashPLN}
                newCash={newCash}
                exchangeRates={exchangeRates}
                onCashChange={(updates) => setNewCash((prev) => ({ ...prev, ...updates }))}
                onAddCash={addCash}
                onEditCashTransaction={editCashTransaction}
                onDeleteCashTransaction={deleteCashTransaction}
                preferredCurrency={preferredCurrency}
              />
            </div>
          )}
      </main>

      <Footer lastUpdate={lastUpdate} />

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportJSON={exportToJSON}
        onExportCSV={exportToCSV}
        onExportPDF={exportToPDF}
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
      <Toast message={cloudToastMessage} isVisible={cloudSaveToast} />
      <Toast message="Cloud sync failed" isVisible={cloudErrorToast} />
    </div>
  );
}
