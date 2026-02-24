import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Goal, Transaction, CashBalance, CashTransaction, TickerInfo } from '../types';
import { STORAGE_KEY } from '../constants/initialState';
import {
  DEMO_CASH,
  DEMO_CASH_TRANSACTIONS,
  DEMO_CUSTOM_TICKERS,
  DEMO_GOAL,
  DEMO_TRANSACTIONS,
} from '../demoData';

interface PortfolioState {
  goal: Goal;
  transactions: Transaction[];
  cash: CashBalance[];
  cashTransactions: CashTransaction[];
  customTickers: Record<string, TickerInfo>;
}

interface PersistenceArgs {
  portfolio: PortfolioState;
  setGoal: (goal: Goal) => void;
  setTransactions: (tx: Transaction[]) => void;
  setCash: (cash: CashBalance[]) => void;
  setCashTransactions: (tx: CashTransaction[]) => void;
  setCustomTickers: (tickers: Record<string, TickerInfo>) => void;
}

export function usePortfolioPersistence({
  portfolio,
  setGoal,
  setTransactions,
  setCash,
  setCashTransactions,
  setCustomTickers,
}: PersistenceArgs) {
  const { isLoaded: isAuthLoaded, isSignedIn } = useUser();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const isCloudMode = isAuthLoaded && isSignedIn && !isLocalOnly;
  const showLocalStorageBanner = isAuthLoaded && !isSignedIn;
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cloudSaveStatus, setCloudSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastCloudSave, setLastCloudSave] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('local-only-mode');
    if (stored === 'true') {
      setIsLocalOnly(true);
    }
  }, []);

  const buildCloudPayload = useCallback(() => {
    return {
      goal: portfolio.goal,
      transactions: portfolio.transactions,
      cash: portfolio.cash,
      cashTransactions: portfolio.cashTransactions,
      customTickers: portfolio.customTickers,
    };
  }, [portfolio]);

  const saveToCloud = useCallback(
    async (showToast: boolean, onSuccessToast?: () => void, onErrorToast?: () => void) => {
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
        if (showToast && onSuccessToast) {
          onSuccessToast();
        }
      } catch {
        setCloudSaveStatus('error');
        if (showToast && onErrorToast) {
          onErrorToast();
        }
      }
    },
    [buildCloudPayload, isCloudMode]
  );

  const toggleLocalOnly = useCallback(
    (onCloudSync?: () => void) => {
      setIsLocalOnly((prev) => {
        const next = !prev;
        localStorage.setItem('local-only-mode', String(next));
        if (next) {
          setCloudSaveStatus('idle');
        }
        if (!next && isSignedIn && onCloudSync) {
          onCloudSync();
        }
        return next;
      });
    },
    [isSignedIn]
  );

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
        } catch {
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
      } catch {
        setGoal(DEMO_GOAL);
        setTransactions(DEMO_TRANSACTIONS);
        setCash(DEMO_CASH);
        setCashTransactions(DEMO_CASH_TRANSACTIONS);
        setCustomTickers(DEMO_CUSTOM_TICKERS);
      } finally {
        if (isActive) setIsDataLoaded(true);
      }
    };

    void loadData();

    return () => {
      isActive = false;
    };
  }, [isAuthLoaded, isSignedIn, setGoal, setTransactions, setCash, setCashTransactions, setCustomTickers]);

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
    } catch {
      // ignore local storage write failure
    }
  }, [buildCloudPayload, isDataLoaded, isCloudMode, saveToCloud]);

  return {
    isAuthLoaded,
    isSignedIn,
    isDataLoaded,
    isLocalOnly,
    isCloudMode,
    showLocalStorageBanner,
    cloudSaveStatus,
    lastCloudSave,
    saveToCloud,
    toggleLocalOnly,
  };
}
