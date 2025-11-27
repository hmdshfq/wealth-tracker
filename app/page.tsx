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
  CashTransaction,
  Goal,
  AllocationItem,
  ProjectionDataPoint,
  NewTransaction,
  NewCash,
} from '@/app/lib/types';
import { EXCHANGE_RATES, ETF_DATA } from '@/app/lib/constants';
import { calculateGoalAmount } from '@/app/lib/goalCalculations';
import { calculateMonthlyProjection } from '@/app/lib/projectionCalculations';
import { calculateHoldingsFromTransactions } from '@/app/lib/holdingsCalculations';

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
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InvestmentTracker() {
  // ---------------------------------------------------------------------------
  // Core State
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [goal, setGoal] = useState<Goal>(INITIAL_GOAL);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [cash, setCash] = useState<CashBalance[]>(INITIAL_CASH);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(INITIAL_CASH_TRANSACTIONS);

  // Compute holdings from transactions
  const holdings = useMemo(() => calculateHoldingsFromTransactions(transactions), [transactions]);

  // ---------------------------------------------------------------------------
  // Data Persistence
  // ---------------------------------------------------------------------------
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('investment-tracker-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.goal) setGoal(parsedData.goal);
        if (parsedData.transactions) setTransactions(parsedData.transactions);
        if (parsedData.cash) setCash(parsedData.cash);
        if (parsedData.cashTransactions) setCashTransactions(parsedData.cashTransactions);
      }
    } catch (error) {
      console.error('Failed to load data from local storage:', error);
    }
  }, []); // Empty array ensures this runs only once on mount

  useEffect(() => {
    try {
      const dataToSave = {
        goal,
        transactions,
        cash,
        cashTransactions,
      };
      localStorage.setItem('investment-tracker-data', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save data to local storage:', error);
    }
  }, [goal, transactions, cash, cashTransactions]);

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

  const getFirstTransactionDate = useCallback(() => {
    if (transactions.length === 0) {
      const today = new Date();
      return { year: today.getFullYear(), month: today.getMonth() + 1 };
    }
    const sortedTransactions = [...transactions].sort((a, b) => {
      const [aYear, aMonth, aDay] = a.date.split('-').map(Number);
      const [bYear, bMonth, bDay] = b.date.split('-').map(Number);
      return new Date(aYear, aMonth - 1, aDay).getTime() - new Date(bYear, bMonth - 1, bDay).getTime();
    });
    const [year, month] = sortedTransactions[0].date.split('-').map(Number);
    return { year, month };
  }, [transactions]);

  const getActualInvestedByDate = useCallback((date: string) => {
    let totalInvested = 0;
    transactions.forEach((tx) => {
      // Only count Buy transactions and only up to the specified date (inclusive of the whole month)
      if (tx.action === 'Buy' && tx.date.substring(0, 7) <= date) {
        const value = tx.shares * tx.price;
        // Convert to PLN
        const valuePLN = tx.currency === 'PLN' ? value :
                         tx.currency === 'EUR' ? value * exchangeRates.EUR_PLN :
                         tx.currency === 'USD' ? value * exchangeRates.USD_PLN :
                         value;
        totalInvested += valuePLN;
      }
    });
    return Math.round(totalInvested * 100) / 100;
  }, [transactions, exchangeRates]);

  const projectionData: ProjectionDataPoint[] = useMemo(() => {
    const { year, month } = getFirstTransactionDate();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // 1. Past Projection (Start -> Now)
    // Simulates the "Ideal Path" from the beginning starting at 0
    const pastProjection = calculateMonthlyProjection(
      0, // Start with 0
      currentYear, // Calculate up to current year
      goal.annualReturn,
      goal.monthlyDeposits,
      year, // Start Year
      month, // Start Month
      goal.amount,
      goal.depositIncreasePercentage,
      0, // initial contributions
      0  // initial returns
    ).filter(p => p.date < currentDateStr);

    // 2. Future Projection (Now -> Retirement)
    // Projects from current actual Net Worth
    const totalDeposits = cashTransactions.reduce((sum, t) => {
       const amountPLN = t.currency === 'PLN' ? t.amount : 
                        t.currency === 'EUR' ? t.amount * exchangeRates.EUR_PLN :
                        t.amount * exchangeRates.USD_PLN;
       return sum + (t.type === 'deposit' ? amountPLN : -amountPLN);
    }, 0);

    const initialContributions = totalDeposits;
    const initialReturns = totalNetWorth - initialContributions;

    const futureProjection = calculateMonthlyProjection(
      totalNetWorth,
      goal.retirementYear,
      goal.annualReturn,
      goal.monthlyDeposits,
      currentYear,
      currentMonth,
      goal.amount,
      goal.depositIncreasePercentage,
      initialContributions,
      initialReturns
    );

    // Combine
    const combined = [...pastProjection, ...futureProjection];

    // Add actual invested amounts to each projection point
    return combined.map((point) => ({
      ...point,
      actualInvestedAmount: getActualInvestedByDate(point.date),
    }));
  }, [totalNetWorth, goal, getFirstTransactionDate, getActualInvestedByDate, cashTransactions, exchangeRates]);

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
  }, [goal, transactions, cash, cashTransactions]);

  const exportToCSV = useCallback((type: 'holdings' | 'transactions' | 'cash' | 'cashTransactions') => {
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
            prices={prices}
            newTx={newTx}
            onTxChange={(updates) => setNewTx((prev) => ({ ...prev, ...updates }))}
            onAddTransaction={addTransaction}
            onEditTransaction={editTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        )}

        {activeTab === 'cash' && (
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
