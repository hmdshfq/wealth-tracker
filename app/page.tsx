'use client'
import React, { useState, useEffect, useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Area,
    AreaChart,
} from 'recharts';

// Exchange rates (approximate - in real app would fetch live)
const EXCHANGE_RATES = {
    EUR_PLN: 4.31,
    USD_PLN: 4.05,
    EUR_USD: 1.06,
};

// ETF data with simulated prices
const ETF_DATA = {
    'FWIA.DE': {
        name: 'Invesco FTSE All-World',
        currency: 'EUR',
        basePrice: 7.12,
    },
    'VWCE.DE': {
        name: 'Vanguard FTSE All-World',
        currency: 'EUR',
        basePrice: 144.36,
    },
    WEBN: {
        name: 'Amundi Prime All Country World',
        currency: 'EUR',
        basePrice: 8.45,
    },
    'IUSQ.DE': { name: 'iShares MSCI ACWI', currency: 'EUR', basePrice: 92.42 },
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function InvestmentTracker() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [goal, setGoal] = useState({ amount: 4204928, targetYear: 2054 });
    const [holdings, setHoldings] = useState([
        { ticker: 'FWIA.DE', shares: 518, avgCost: 6.54 },
        { ticker: 'VWCE.DE', shares: 7.13, avgCost: 122.18 },
        { ticker: 'IUSQ.DE', shares: 4, avgCost: 88.32 },
    ]);
    const [transactions, setTransactions] = useState([
        {
            id: 1,
            date: '2025-11-11',
            ticker: 'FWIA.DE',
            action: 'Buy',
            shares: 32,
            price: 7.15,
            currency: 'EUR',
        },
        {
            id: 2,
            date: '2025-11-04',
            ticker: 'FWIA.DE',
            action: 'Buy',
            shares: 34,
            price: 7.14,
            currency: 'EUR',
        },
        {
            id: 3,
            date: '2025-10-31',
            ticker: 'FWIA.DE',
            action: 'Buy',
            shares: 13,
            price: 7.18,
            currency: 'EUR',
        },
        {
            id: 4,
            date: '2025-10-13',
            ticker: 'FWIA.DE',
            action: 'Buy',
            shares: 29,
            price: 6.95,
            currency: 'EUR',
        },
        {
            id: 5,
            date: '2025-09-08',
            ticker: 'VWCE.DE',
            action: 'Buy',
            shares: 2,
            price: 141.5,
            currency: 'EUR',
        },
    ]);
    const [cash, setCash] = useState([
        { currency: 'PLN', amount: 2500 },
        { currency: 'EUR', amount: 150 },
        { currency: 'USD', amount: 0 },
    ]);
    const [prices, setPrices] = useState({});
    const [pricesLoading, setPricesLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Import/Export state
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState('');
    const [importError, setImportError] = useState('');
    const [exportSuccess, setExportSuccess] = useState(false);

    // New transaction form
    const [newTx, setNewTx] = useState({
        date: new Date().toISOString().split('T')[0],
        ticker: 'FWIA.DE',
        action: 'Buy',
        shares: '',
        price: '',
        currency: 'EUR',
    });

    // New cash form
    const [newCash, setNewCash] = useState({ currency: 'PLN', amount: '' });

    // Goal edit
    const [editingGoal, setEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState({ ...goal });

    // Simulate fetching live prices
    const fetchPrices = async () => {
        setPricesLoading(true);
        await new Promise((r) => setTimeout(r, 800));

        const newPrices = {};
        Object.entries(ETF_DATA).forEach(([ticker, data]) => {
            // Simulate small price fluctuation
            const fluctuation = (Math.random() - 0.5) * 0.02;
            newPrices[ticker] = data.basePrice * (1 + fluctuation);
        });
        setPrices(newPrices);
        setLastUpdate(new Date());
        setPricesLoading(false);
    };

    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 60000);
        return () => clearInterval(interval);
    }, []);

    // Export data to JSON
    const exportToJSON = () => {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            goal,
            holdings,
            transactions,
            cash,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `investment-tracker-${
            new Date().toISOString().split('T')[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
    };

    // Export to CSV
    const exportToCSV = (type) => {
        let csv = '';
        let filename = '';

        if (type === 'holdings') {
            csv =
                'Ticker,Name,Shares,AvgCost,CurrentPrice,ValueEUR,ValuePLN,GainEUR,GainPercent\n';
            holdingsData.forEach((h) => {
                csv += `${h.ticker},"${h.name}",${h.shares.toFixed(
                    4
                )},${h.avgCost.toFixed(2)},${h.price.toFixed(
                    2
                )},${h.value.toFixed(2)},${h.valuePLN.toFixed(
                    2
                )},${h.gain.toFixed(2)},${h.gainPercent.toFixed(2)}\n`;
            });
            filename = `holdings-${new Date().toISOString().split('T')[0]}.csv`;
        } else if (type === 'transactions') {
            csv = 'Date,Ticker,Action,Shares,Price,Currency,Total\n';
            transactions.forEach((tx) => {
                csv += `${tx.date},${tx.ticker},${tx.action},${
                    tx.shares
                },${tx.price.toFixed(2)},${tx.currency},${(
                    tx.shares * tx.price
                ).toFixed(2)}\n`;
            });
            filename = `transactions-${
                new Date().toISOString().split('T')[0]
            }.csv`;
        } else if (type === 'cash') {
            csv = 'Currency,Amount,AmountPLN\n';
            cash.forEach((c) => {
                let inPLN = c.amount;
                if (c.currency === 'EUR')
                    inPLN = c.amount * EXCHANGE_RATES.EUR_PLN;
                if (c.currency === 'USD')
                    inPLN = c.amount * EXCHANGE_RATES.USD_PLN;
                csv += `${c.currency},${c.amount.toFixed(2)},${inPLN.toFixed(
                    2
                )}\n`;
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
    };

    // Import from JSON
    const handleImport = () => {
        setImportError('');
        try {
            const data = JSON.parse(importData);

            // Validate structure
            if (
                !data.holdings ||
                !data.transactions ||
                !data.cash ||
                !data.goal
            ) {
                throw new Error(
                    'Invalid file format. Missing required fields.'
                );
            }

            // Validate holdings
            if (!Array.isArray(data.holdings))
                throw new Error('Holdings must be an array');
            data.holdings.forEach((h, i) => {
                if (
                    !h.ticker ||
                    typeof h.shares !== 'number' ||
                    typeof h.avgCost !== 'number'
                ) {
                    throw new Error(`Invalid holding at index ${i}`);
                }
            });

            // Validate transactions
            if (!Array.isArray(data.transactions))
                throw new Error('Transactions must be an array');
            data.transactions.forEach((tx, i) => {
                if (
                    !tx.date ||
                    !tx.ticker ||
                    !tx.action ||
                    typeof tx.shares !== 'number' ||
                    typeof tx.price !== 'number'
                ) {
                    throw new Error(`Invalid transaction at index ${i}`);
                }
            });

            // Validate cash
            if (!Array.isArray(data.cash))
                throw new Error('Cash must be an array');
            data.cash.forEach((c, i) => {
                if (!c.currency || typeof c.amount !== 'number') {
                    throw new Error(`Invalid cash entry at index ${i}`);
                }
            });

            // Validate goal
            if (
                typeof data.goal.amount !== 'number' ||
                typeof data.goal.targetYear !== 'number'
            ) {
                throw new Error('Invalid goal format');
            }

            // All valid - import data
            setHoldings(data.holdings);
            setTransactions(data.transactions);
            setCash(data.cash);
            setGoal(data.goal);
            setShowImportModal(false);
            setImportData('');
        } catch (e) {
            setImportError(e.message || 'Failed to parse JSON');
        }
    };

    // Handle file upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setImportData(event.target.result);
            setImportError('');
        };
        reader.onerror = () => {
            setImportError('Failed to read file');
        };
        reader.readAsText(file);
    };

    // Calculate portfolio value
    const portfolioValue = useMemo(() => {
        let totalEUR = 0;
        holdings.forEach((h) => {
            const price =
                prices[h.ticker] || ETF_DATA[h.ticker]?.basePrice || 0;
            totalEUR += h.shares * price;
        });
        return totalEUR * EXCHANGE_RATES.EUR_PLN;
    }, [holdings, prices]);

    // Calculate total cost basis
    const totalCost = useMemo(() => {
        let costEUR = 0;
        holdings.forEach((h) => {
            costEUR += h.shares * h.avgCost;
        });
        return costEUR * EXCHANGE_RATES.EUR_PLN;
    }, [holdings]);

    // Calculate cash in PLN
    const totalCashPLN = useMemo(() => {
        return cash.reduce((sum, c) => {
            if (c.currency === 'PLN') return sum + c.amount;
            if (c.currency === 'EUR')
                return sum + c.amount * EXCHANGE_RATES.EUR_PLN;
            if (c.currency === 'USD')
                return sum + c.amount * EXCHANGE_RATES.USD_PLN;
            return sum;
        }, 0);
    }, [cash]);

    const totalNetWorth = portfolioValue + totalCashPLN;
    const totalGain = portfolioValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const goalProgress = (totalNetWorth / goal.amount) * 100;

    // Holdings with current values
    const holdingsData = useMemo(() => {
        return holdings.map((h) => {
            const price =
                prices[h.ticker] || ETF_DATA[h.ticker]?.basePrice || 0;
            const value = h.shares * price;
            const cost = h.shares * h.avgCost;
            const gain = value - cost;
            const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
            return {
                ...h,
                name: ETF_DATA[h.ticker]?.name || h.ticker,
                price,
                value,
                valuePLN: value * EXCHANGE_RATES.EUR_PLN,
                cost,
                gain,
                gainPercent,
            };
        });
    }, [holdings, prices]);

    // Allocation data for pie chart
    const allocationData = useMemo(() => {
        const total = holdingsData.reduce((sum, h) => sum + h.value, 0);
        return holdingsData.map((h) => ({
            name: h.ticker,
            value: h.value,
            percent: total > 0 ? (h.value / total) * 100 : 0,
        }));
    }, [holdingsData]);

    // Projected growth data
    const projectionData = useMemo(() => {
        const currentYear = 2025;
        const years = [];
        let value = totalNetWorth;
        const monthlyContribution = 1500;
        const annualReturn = 0.07;

        for (let year = currentYear; year <= goal.targetYear; year++) {
            years.push({ year, value: Math.round(value), goal: goal.amount });
            value = value * (1 + annualReturn) + monthlyContribution * 12;
        }
        return years;
    }, [totalNetWorth, goal]);

    // Add transaction
    const addTransaction = () => {
        if (!newTx.shares || !newTx.price) return;

        const tx = {
            id: Date.now(),
            ...newTx,
            shares: parseFloat(newTx.shares),
            price: parseFloat(newTx.price),
        };

        setTransactions([tx, ...transactions]);

        // Update holdings
        const existingIdx = holdings.findIndex((h) => h.ticker === tx.ticker);
        if (existingIdx >= 0) {
            const existing = holdings[existingIdx];
            const newShares = existing.shares + tx.shares;
            const newAvgCost =
                (existing.shares * existing.avgCost + tx.shares * tx.price) /
                newShares;
            const updated = [...holdings];
            updated[existingIdx] = {
                ...existing,
                shares: newShares,
                avgCost: newAvgCost,
            };
            setHoldings(updated);
        } else {
            setHoldings([
                ...holdings,
                { ticker: tx.ticker, shares: tx.shares, avgCost: tx.price },
            ]);
        }

        setNewTx({ ...newTx, shares: '', price: '' });
    };

    // Add cash
    const addCash = () => {
        if (!newCash.amount) return;
        const idx = cash.findIndex((c) => c.currency === newCash.currency);
        if (idx >= 0) {
            const updated = [...cash];
            updated[idx] = {
                ...updated[idx],
                amount: updated[idx].amount + parseFloat(newCash.amount),
            };
            setCash(updated);
        }
        setNewCash({ ...newCash, amount: '' });
    };

    const formatPLN = (val) =>
        `zł${val.toLocaleString('pl-PL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    const formatEUR = (val) =>
        `€${val.toLocaleString('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    const formatPercent = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

    return (
        <div
            style={{
                minHeight: '100vh',
                background:
                    'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                color: '#e2e8f0',
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                padding: '24px',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                    paddingBottom: '16px',
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            margin: 0,
                            background:
                                'linear-gradient(90deg, #10b981, #3b82f6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Investment Tracker
                    </h1>
                    <p
                        style={{
                            fontSize: '12px',
                            color: '#64748b',
                            margin: '4px 0 0 0',
                        }}
                    >
                        ETF Portfolio & Goal Tracker
                    </p>
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                    }}
                >
                    <button
                        onClick={() => setShowImportModal(true)}
                        style={{
                            padding: '8px 16px',
                            background: '#334155',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            color: '#e2e8f0',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        ↓ Import
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        style={{
                            padding: '8px 16px',
                            background: '#334155',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            color: '#e2e8f0',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        ↑ Export
                    </button>
                    <button
                        onClick={fetchPrices}
                        disabled={pricesLoading}
                        style={{
                            padding: '8px 16px',
                            background: pricesLoading
                                ? '#334155'
                                : 'linear-gradient(90deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: pricesLoading ? 'wait' : 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        {pricesLoading ? '⟳ Loading...' : '↻ Refresh Prices'}
                    </button>
                    {lastUpdate && (
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                            Updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div
                style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '24px',
                    background: 'rgba(30, 41, 59, 0.5)',
                    padding: '4px',
                    borderRadius: '12px',
                    width: 'fit-content',
                }}
            >
                {['dashboard', 'holdings', 'transactions', 'cash', 'goal'].map(
                    (tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 20px',
                                background:
                                    activeTab === tab
                                        ? 'linear-gradient(90deg, #10b981, #059669)'
                                        : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: activeTab === tab ? 'white' : '#94a3b8',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontWeight: activeTab === tab ? '600' : '400',
                                textTransform: 'capitalize',
                            }}
                        >
                            {tab}
                        </button>
                    )
                )}
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
                <div style={{ display: 'grid', gap: '24px' }}>
                    {/* Top Stats */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                        }}
                    >
                        <div
                            style={{
                                background: 'rgba(30, 41, 59, 0.6)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid rgba(148, 163, 184, 0.1)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                Portfolio Value
                            </p>
                            <p
                                style={{
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    margin: 0,
                                    color: '#f8fafc',
                                }}
                            >
                                {formatPLN(portfolioValue)}
                            </p>
                            <p
                                style={{
                                    fontSize: '14px',
                                    margin: '8px 0 0 0',
                                    color:
                                        totalGain >= 0 ? '#10b981' : '#ef4444',
                                }}
                            >
                                {formatPLN(totalGain)} (
                                {formatPercent(totalGainPercent)})
                            </p>
                        </div>

                        <div
                            style={{
                                background: 'rgba(30, 41, 59, 0.6)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid rgba(148, 163, 184, 0.1)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                Total Cash
                            </p>
                            <p
                                style={{
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    margin: 0,
                                    color: '#f8fafc',
                                }}
                            >
                                {formatPLN(totalCashPLN)}
                            </p>
                            <div
                                style={{
                                    marginTop: '8px',
                                    display: 'flex',
                                    gap: '12px',
                                    fontSize: '12px',
                                    color: '#94a3b8',
                                }}
                            >
                                {cash.map((c) => (
                                    <span key={c.currency}>
                                        {c.currency}:{' '}
                                        {c.amount.toLocaleString()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div
                            style={{
                                background: 'rgba(30, 41, 59, 0.6)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid rgba(148, 163, 184, 0.1)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                Net Worth
                            </p>
                            <p
                                style={{
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    margin: 0,
                                    color: '#f8fafc',
                                }}
                            >
                                {formatPLN(totalNetWorth)}
                            </p>
                            <p
                                style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    margin: '8px 0 0 0',
                                }}
                            >
                                Portfolio + Cash
                            </p>
                        </div>
                    </div>

                    {/* Goal Progress */}
                    <div
                        style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                            }}
                        >
                            <div>
                                <p
                                    style={{
                                        fontSize: '12px',
                                        color: '#64748b',
                                        margin: '0 0 4px 0',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                    }}
                                >
                                    Goal Progress
                                </p>
                                <p
                                    style={{
                                        fontSize: '14px',
                                        color: '#94a3b8',
                                        margin: 0,
                                    }}
                                >
                                    Target: {formatPLN(goal.amount)} by{' '}
                                    {goal.targetYear}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p
                                    style={{
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        margin: 0,
                                        color: '#10b981',
                                    }}
                                >
                                    {goalProgress.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                        <div
                            style={{
                                height: '12px',
                                background: 'rgba(148, 163, 184, 0.2)',
                                borderRadius: '6px',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    width: `${Math.min(goalProgress, 100)}%`,
                                    background:
                                        'linear-gradient(90deg, #10b981, #3b82f6)',
                                    borderRadius: '6px',
                                    transition: 'width 0.5s ease',
                                }}
                            />
                        </div>
                        <p
                            style={{
                                fontSize: '12px',
                                color: '#64748b',
                                margin: '8px 0 0 0',
                            }}
                        >
                            {formatPLN(goal.amount - totalNetWorth)} remaining
                        </p>
                    </div>

                    {/* Charts Row */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1.5fr',
                            gap: '24px',
                        }}
                    >
                        {/* Allocation Pie */}
                        <div
                            style={{
                                background: 'rgba(30, 41, 59, 0.6)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid rgba(148, 163, 184, 0.1)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    margin: '0 0 16px 0',
                                }}
                            >
                                Allocation
                            </p>
                            <div style={{ height: '200px' }}>
                                <ResponsiveContainer width='100%' height='100%'>
                                    <PieChart>
                                        <Pie
                                            data={allocationData}
                                            cx='50%'
                                            cy='50%'
                                            innerRadius={50}
                                            outerRadius={80}
                                            dataKey='value'
                                            stroke='none'
                                        >
                                            {allocationData.map(
                                                (entry, idx) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={
                                                            COLORS[
                                                                idx %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [
                                                formatEUR(value),
                                                name,
                                            ]}
                                            contentStyle={{
                                                background: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    marginTop: '16px',
                                }}
                            >
                                {allocationData.map((item, idx) => (
                                    <div
                                        key={item.name}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '12px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '3px',
                                                background:
                                                    COLORS[idx % COLORS.length],
                                            }}
                                        />
                                        <span
                                            style={{
                                                color: '#94a3b8',
                                                flex: 1,
                                            }}
                                        >
                                            {item.name}
                                        </span>
                                        <span style={{ color: '#f8fafc' }}>
                                            {item.percent.toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Projection Chart */}
                        <div
                            style={{
                                background: 'rgba(30, 41, 59, 0.6)',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid rgba(148, 163, 184, 0.1)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    margin: '0 0 16px 0',
                                }}
                            >
                                Projected Growth (7% annual + zł1,500/mo)
                            </p>
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width='100%' height='100%'>
                                    <AreaChart data={projectionData}>
                                        <defs>
                                            <linearGradient
                                                id='colorValue'
                                                x1='0'
                                                y1='0'
                                                x2='0'
                                                y2='1'
                                            >
                                                <stop
                                                    offset='5%'
                                                    stopColor='#10b981'
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset='95%'
                                                    stopColor='#10b981'
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey='year'
                                            stroke='#64748b'
                                            fontSize={10}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke='#64748b'
                                            fontSize={10}
                                            tickLine={false}
                                            tickFormatter={(v) =>
                                                `${(v / 1000000).toFixed(1)}M`
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value) => [
                                                formatPLN(value),
                                            ]}
                                            contentStyle={{
                                                background: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                            }}
                                        />
                                        <Area
                                            type='monotone'
                                            dataKey='value'
                                            stroke='#10b981'
                                            strokeWidth={2}
                                            fill='url(#colorValue)'
                                        />
                                        <Line
                                            type='monotone'
                                            dataKey='goal'
                                            stroke='#3b82f6'
                                            strokeDasharray='5 5'
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Live Prices */}
                    <div
                        style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                margin: '0 0 16px 0',
                            }}
                        >
                            Live ETF Prices
                        </p>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '12px',
                            }}
                        >
                            {Object.entries(ETF_DATA).map(([ticker, data]) => {
                                const price = prices[ticker] || data.basePrice;
                                const change =
                                    ((price - data.basePrice) /
                                        data.basePrice) *
                                    100;
                                return (
                                    <div
                                        key={ticker}
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.5)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            border: '1px solid rgba(148, 163, 184, 0.1)',
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                margin: '0 0 4px 0',
                                                color: '#f8fafc',
                                            }}
                                        >
                                            {ticker}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: '10px',
                                                color: '#64748b',
                                                margin: '0 0 8px 0',
                                            }}
                                        >
                                            {data.name}
                                        </p>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'baseline',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '20px',
                                                    fontWeight: '700',
                                                    color: '#f8fafc',
                                                }}
                                            >
                                                €{price.toFixed(2)}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    color:
                                                        change >= 0
                                                            ? '#10b981'
                                                            : '#ef4444',
                                                    fontWeight: '500',
                                                }}
                                            >
                                                {formatPercent(change)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Holdings Tab */}
            {activeTab === 'holdings' && (
                <div
                    style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                    }}
                >
                    <p
                        style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 24px 0',
                        }}
                    >
                        Holdings
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '13px',
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        borderBottom:
                                            '1px solid rgba(148, 163, 184, 0.2)',
                                    }}
                                >
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 8px',
                                            color: '#64748b',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Ticker
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'left',
                                            padding: '12px 8px',
                                            color: '#64748b',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Name
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'right',
                                            padding: '12px 8px',
                                            color: '#64748b',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Shares
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'right',
                                            padding: '12px 8px',
                                            color: '#64748b',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Avg Cost
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'right',
                                            padding: '12px 8px',
                                            color: '#64748b',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Price
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'right',
                                            padding: '12px 8px',
                                            color: '#64748b',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Value (EUR)
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'right',
                                            padding: '12px 8px',
                                            color: '#64748b',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Value (PLN)
                                    </th>
                                    <th
                                        style={{
                                            textAlign: 'right',
                                            padding: '12px 8px',
                                            color: '#64748b',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Gain
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdingsData.map((h) => (
                                    <tr
                                        key={h.ticker}
                                        style={{
                                            borderBottom:
                                                '1px solid rgba(148, 163, 184, 0.1)',
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: '16px 8px',
                                                fontWeight: '600',
                                                color: '#10b981',
                                            }}
                                        >
                                            {h.ticker}
                                        </td>
                                        <td
                                            style={{
                                                padding: '16px 8px',
                                                color: '#94a3b8',
                                            }}
                                        >
                                            {h.name}
                                        </td>
                                        <td
                                            style={{
                                                padding: '16px 8px',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {h.shares.toFixed(2)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '16px 8px',
                                                textAlign: 'right',
                                            }}
                                        >
                                            €{h.avgCost.toFixed(2)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '16px 8px',
                                                textAlign: 'right',
                                            }}
                                        >
                                            €{h.price.toFixed(2)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '16px 8px',
                                                textAlign: 'right',
                                                fontWeight: '600',
                                            }}
                                        >
                                            {formatEUR(h.value)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '16px 8px',
                                                textAlign: 'right',
                                                fontWeight: '600',
                                            }}
                                        >
                                            {formatPLN(h.valuePLN)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '16px 8px',
                                                textAlign: 'right',
                                                color:
                                                    h.gain >= 0
                                                        ? '#10b981'
                                                        : '#ef4444',
                                                fontWeight: '600',
                                            }}
                                        >
                                            {formatEUR(h.gain)} (
                                            {formatPercent(h.gainPercent)})
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr
                                    style={{
                                        borderTop:
                                            '2px solid rgba(148, 163, 184, 0.3)',
                                    }}
                                >
                                    <td
                                        colSpan={5}
                                        style={{
                                            padding: '16px 8px',
                                            fontWeight: '600',
                                        }}
                                    >
                                        Total
                                    </td>
                                    <td
                                        style={{
                                            padding: '16px 8px',
                                            textAlign: 'right',
                                            fontWeight: '700',
                                            fontSize: '15px',
                                        }}
                                    >
                                        {formatEUR(
                                            holdingsData.reduce(
                                                (sum, h) => sum + h.value,
                                                0
                                            )
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: '16px 8px',
                                            textAlign: 'right',
                                            fontWeight: '700',
                                            fontSize: '15px',
                                        }}
                                    >
                                        {formatPLN(portfolioValue)}
                                    </td>
                                    <td
                                        style={{
                                            padding: '16px 8px',
                                            textAlign: 'right',
                                            color:
                                                totalGain >= 0
                                                    ? '#10b981'
                                                    : '#ef4444',
                                            fontWeight: '700',
                                            fontSize: '15px',
                                        }}
                                    >
                                        {formatPLN(totalGain)} (
                                        {formatPercent(totalGainPercent)})
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
                <div style={{ display: 'grid', gap: '24px' }}>
                    {/* Add Transaction Form */}
                    <div
                        style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                margin: '0 0 16px 0',
                            }}
                        >
                            Add Transaction
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '12px',
                                alignItems: 'flex-end',
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        display: 'block',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Date
                                </label>
                                <input
                                    type='date'
                                    value={newTx.date}
                                    onChange={(e) =>
                                        setNewTx({
                                            ...newTx,
                                            date: e.target.value,
                                        })
                                    }
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        color: '#f8fafc',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        display: 'block',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Ticker
                                </label>
                                <select
                                    value={newTx.ticker}
                                    onChange={(e) =>
                                        setNewTx({
                                            ...newTx,
                                            ticker: e.target.value,
                                        })
                                    }
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        color: '#f8fafc',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                        minWidth: '120px',
                                    }}
                                >
                                    {Object.keys(ETF_DATA).map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        display: 'block',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Action
                                </label>
                                <select
                                    value={newTx.action}
                                    onChange={(e) =>
                                        setNewTx({
                                            ...newTx,
                                            action: e.target.value,
                                        })
                                    }
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        color: '#f8fafc',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <option value='Buy'>Buy</option>
                                    <option value='Sell'>Sell</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        display: 'block',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Shares
                                </label>
                                <input
                                    type='number'
                                    step='0.01'
                                    placeholder='0'
                                    value={newTx.shares}
                                    onChange={(e) =>
                                        setNewTx({
                                            ...newTx,
                                            shares: e.target.value,
                                        })
                                    }
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        color: '#f8fafc',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                        width: '80px',
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        display: 'block',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Price (EUR)
                                </label>
                                <input
                                    type='number'
                                    step='0.01'
                                    placeholder='0.00'
                                    value={newTx.price}
                                    onChange={(e) =>
                                        setNewTx({
                                            ...newTx,
                                            price: e.target.value,
                                        })
                                    }
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        color: '#f8fafc',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                        width: '100px',
                                    }}
                                />
                            </div>
                            <button
                                onClick={addTransaction}
                                style={{
                                    padding: '10px 24px',
                                    background:
                                        'linear-gradient(90deg, #10b981, #059669)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    fontWeight: '600',
                                }}
                            >
                                + Add
                            </button>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div
                        style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                margin: '0 0 16px 0',
                            }}
                        >
                            Transaction History ({transactions.length})
                        </p>
                        <div style={{ overflowX: 'auto' }}>
                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '13px',
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            borderBottom:
                                                '1px solid rgba(148, 163, 184, 0.2)',
                                        }}
                                    >
                                        <th
                                            style={{
                                                textAlign: 'left',
                                                padding: '12px 8px',
                                                color: '#64748b',
                                                fontWeight: '500',
                                            }}
                                        >
                                            Date
                                        </th>
                                        <th
                                            style={{
                                                textAlign: 'left',
                                                padding: '12px 8px',
                                                color: '#64748b',
                                                fontWeight: '500',
                                            }}
                                        >
                                            Ticker
                                        </th>
                                        <th
                                            style={{
                                                textAlign: 'left',
                                                padding: '12px 8px',
                                                color: '#64748b',
                                                fontWeight: '500',
                                            }}
                                        >
                                            Action
                                        </th>
                                        <th
                                            style={{
                                                textAlign: 'right',
                                                padding: '12px 8px',
                                                color: '#64748b',
                                                fontWeight: '500',
                                            }}
                                        >
                                            Shares
                                        </th>
                                        <th
                                            style={{
                                                textAlign: 'right',
                                                padding: '12px 8px',
                                                color: '#64748b',
                                                fontWeight: '500',
                                            }}
                                        >
                                            Price
                                        </th>
                                        <th
                                            style={{
                                                textAlign: 'right',
                                                padding: '12px 8px',
                                                color: '#64748b',
                                                fontWeight: '500',
                                            }}
                                        >
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr
                                            key={tx.id}
                                            style={{
                                                borderBottom:
                                                    '1px solid rgba(148, 163, 184, 0.1)',
                                            }}
                                        >
                                            <td style={{ padding: '12px 8px' }}>
                                                {tx.date}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px 8px',
                                                    color: '#10b981',
                                                    fontWeight: '600',
                                                }}
                                            >
                                                {tx.ticker}
                                            </td>
                                            <td style={{ padding: '12px 8px' }}>
                                                <span
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        background:
                                                            tx.action === 'Buy'
                                                                ? 'rgba(16, 185, 129, 0.2)'
                                                                : 'rgba(239, 68, 68, 0.2)',
                                                        color:
                                                            tx.action === 'Buy'
                                                                ? '#10b981'
                                                                : '#ef4444',
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                    }}
                                                >
                                                    {tx.action}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px 8px',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                {tx.shares}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px 8px',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                €{tx.price.toFixed(2)}
                                            </td>
                                            <td
                                                style={{
                                                    padding: '12px 8px',
                                                    textAlign: 'right',
                                                    fontWeight: '600',
                                                }}
                                            >
                                                €
                                                {(tx.shares * tx.price).toFixed(
                                                    2
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Cash Tab */}
            {activeTab === 'cash' && (
                <div style={{ display: 'grid', gap: '24px' }}>
                    {/* Add Cash */}
                    <div
                        style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                margin: '0 0 16px 0',
                            }}
                        >
                            Add Cash
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-end',
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        display: 'block',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Currency
                                </label>
                                <select
                                    value={newCash.currency}
                                    onChange={(e) =>
                                        setNewCash({
                                            ...newCash,
                                            currency: e.target.value,
                                        })
                                    }
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        color: '#f8fafc',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <option value='PLN'>PLN</option>
                                    <option value='EUR'>EUR</option>
                                    <option value='USD'>USD</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        display: 'block',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Amount
                                </label>
                                <input
                                    type='number'
                                    step='0.01'
                                    placeholder='0.00'
                                    value={newCash.amount}
                                    onChange={(e) =>
                                        setNewCash({
                                            ...newCash,
                                            amount: e.target.value,
                                        })
                                    }
                                    style={{
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        color: '#f8fafc',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                        width: '150px',
                                    }}
                                />
                            </div>
                            <button
                                onClick={addCash}
                                style={{
                                    padding: '10px 24px',
                                    background:
                                        'linear-gradient(90deg, #3b82f6, #2563eb)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    fontWeight: '600',
                                }}
                            >
                                + Add Cash
                            </button>
                        </div>
                    </div>

                    {/* Cash Balances */}
                    <div
                        style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                margin: '0 0 16px 0',
                            }}
                        >
                            Cash Balances
                        </p>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                            }}
                        >
                            {cash.map((c) => {
                                let inPLN = c.amount;
                                if (c.currency === 'EUR')
                                    inPLN = c.amount * EXCHANGE_RATES.EUR_PLN;
                                if (c.currency === 'USD')
                                    inPLN = c.amount * EXCHANGE_RATES.USD_PLN;
                                return (
                                    <div
                                        key={c.currency}
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.5)',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            border: '1px solid rgba(148, 163, 184, 0.1)',
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontSize: '12px',
                                                color: '#64748b',
                                                margin: '0 0 8px 0',
                                            }}
                                        >
                                            {c.currency}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: '28px',
                                                fontWeight: '700',
                                                margin: '0 0 4px 0',
                                                color: '#f8fafc',
                                            }}
                                        >
                                            {c.currency === 'PLN'
                                                ? 'zł'
                                                : c.currency === 'EUR'
                                                ? '€'
                                                : '$'}
                                            {c.amount.toLocaleString('pl-PL', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </p>
                                        {c.currency !== 'PLN' && (
                                            <p
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#64748b',
                                                    margin: 0,
                                                }}
                                            >
                                                ≈ {formatPLN(inPLN)}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div
                            style={{
                                marginTop: '24px',
                                padding: '20px',
                                background:
                                    'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))',
                                borderRadius: '12px',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    margin: '0 0 8px 0',
                                }}
                            >
                                Total Cash (in PLN)
                            </p>
                            <p
                                style={{
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    margin: 0,
                                    color: '#10b981',
                                }}
                            >
                                {formatPLN(totalCashPLN)}
                            </p>
                        </div>
                    </div>

                    {/* Exchange Rates */}
                    <div
                        style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                margin: '0 0 16px 0',
                            }}
                        >
                            Exchange Rates
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                gap: '24px',
                                fontSize: '14px',
                            }}
                        >
                            <div>
                                <span style={{ color: '#64748b' }}>
                                    EUR/PLN:{' '}
                                </span>
                                <span
                                    style={{
                                        color: '#f8fafc',
                                        fontWeight: '600',
                                    }}
                                >
                                    {EXCHANGE_RATES.EUR_PLN}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>
                                    USD/PLN:{' '}
                                </span>
                                <span
                                    style={{
                                        color: '#f8fafc',
                                        fontWeight: '600',
                                    }}
                                >
                                    {EXCHANGE_RATES.USD_PLN}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>
                                    EUR/USD:{' '}
                                </span>
                                <span
                                    style={{
                                        color: '#f8fafc',
                                        fontWeight: '600',
                                    }}
                                >
                                    {EXCHANGE_RATES.EUR_USD}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Goal Tab */}
            {activeTab === 'goal' && (
                <div style={{ display: 'grid', gap: '24px' }}>
                    <div
                        style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '24px',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    margin: 0,
                                }}
                            >
                                Investment Goal
                            </p>
                            {!editingGoal && (
                                <button
                                    onClick={() => {
                                        setEditingGoal(true);
                                        setTempGoal({ ...goal });
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#334155',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#f8fafc',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    Edit Goal
                                </button>
                            )}
                        </div>

                        {editingGoal ? (
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'flex-end',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            fontSize: '11px',
                                            color: '#64748b',
                                            display: 'block',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Target Amount (PLN)
                                    </label>
                                    <input
                                        type='number'
                                        value={tempGoal.amount}
                                        onChange={(e) =>
                                            setTempGoal({
                                                ...tempGoal,
                                                amount:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            })
                                        }
                                        style={{
                                            background: '#0f172a',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            padding: '10px 12px',
                                            color: '#f8fafc',
                                            fontSize: '13px',
                                            fontFamily: 'inherit',
                                            width: '180px',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            fontSize: '11px',
                                            color: '#64748b',
                                            display: 'block',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Target Year
                                    </label>
                                    <input
                                        type='number'
                                        value={tempGoal.targetYear}
                                        onChange={(e) =>
                                            setTempGoal({
                                                ...tempGoal,
                                                targetYear:
                                                    parseInt(e.target.value) ||
                                                    2050,
                                            })
                                        }
                                        style={{
                                            background: '#0f172a',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            padding: '10px 12px',
                                            color: '#f8fafc',
                                            fontSize: '13px',
                                            fontFamily: 'inherit',
                                            width: '100px',
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setGoal({ ...tempGoal });
                                        setEditingGoal(false);
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        background:
                                            'linear-gradient(90deg, #10b981, #059669)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        fontWeight: '600',
                                    }}
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingGoal(false)}
                                    style={{
                                        padding: '10px 20px',
                                        background: '#334155',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#f8fafc',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '24px',
                                }}
                            >
                                <div>
                                    <p
                                        style={{
                                            fontSize: '12px',
                                            color: '#64748b',
                                            margin: '0 0 8px 0',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        Target
                                    </p>
                                    <p
                                        style={{
                                            fontSize: '36px',
                                            fontWeight: '700',
                                            margin: 0,
                                            color: '#3b82f6',
                                        }}
                                    >
                                        {formatPLN(goal.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        style={{
                                            fontSize: '12px',
                                            color: '#64748b',
                                            margin: '0 0 8px 0',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        Target Year
                                    </p>
                                    <p
                                        style={{
                                            fontSize: '36px',
                                            fontWeight: '700',
                                            margin: 0,
                                            color: '#f8fafc',
                                        }}
                                    >
                                        {goal.targetYear}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        style={{
                                            fontSize: '12px',
                                            color: '#64748b',
                                            margin: '0 0 8px 0',
                                            textTransform: 'uppercase',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        Years Remaining
                                    </p>
                                    <p
                                        style={{
                                            fontSize: '36px',
                                            fontWeight: '700',
                                            margin: 0,
                                            color: '#f59e0b',
                                        }}
                                    >
                                        {goal.targetYear - 2025}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress Card */}
                    <div
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))',
                            borderRadius: '16px',
                            padding: '32px',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '24px',
                            }}
                        >
                            <div>
                                <p
                                    style={{
                                        fontSize: '14px',
                                        color: '#94a3b8',
                                        margin: '0 0 8px 0',
                                    }}
                                >
                                    Current Progress
                                </p>
                                <p
                                    style={{
                                        fontSize: '48px',
                                        fontWeight: '700',
                                        margin: 0,
                                        color: '#10b981',
                                    }}
                                >
                                    {goalProgress.toFixed(2)}%
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p
                                    style={{
                                        fontSize: '14px',
                                        color: '#94a3b8',
                                        margin: '0 0 8px 0',
                                    }}
                                >
                                    Net Worth
                                </p>
                                <p
                                    style={{
                                        fontSize: '32px',
                                        fontWeight: '700',
                                        margin: 0,
                                        color: '#f8fafc',
                                    }}
                                >
                                    {formatPLN(totalNetWorth)}
                                </p>
                            </div>
                        </div>
                        <div
                            style={{
                                height: '16px',
                                background: 'rgba(148, 163, 184, 0.2)',
                                borderRadius: '8px',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    width: `${Math.min(goalProgress, 100)}%`,
                                    background:
                                        'linear-gradient(90deg, #10b981, #3b82f6)',
                                    borderRadius: '8px',
                                    transition: 'width 0.5s ease',
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '12px',
                                fontSize: '13px',
                            }}
                        >
                            <span style={{ color: '#10b981' }}>
                                {formatPLN(totalNetWorth)}
                            </span>
                            <span style={{ color: '#64748b' }}>
                                {formatPLN(goal.amount - totalNetWorth)} to go
                            </span>
                            <span style={{ color: '#3b82f6' }}>
                                {formatPLN(goal.amount)}
                            </span>
                        </div>
                    </div>

                    {/* Projection */}
                    <div
                        style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid rgba(148, 163, 184, 0.1)',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                margin: '0 0 8px 0',
                            }}
                        >
                            Projection to Goal
                        </p>
                        <p
                            style={{
                                fontSize: '12px',
                                color: '#64748b',
                                margin: '0 0 24px 0',
                            }}
                        >
                            Assuming 7% annual return and zł1,500 monthly
                            contributions
                        </p>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width='100%' height='100%'>
                                <AreaChart data={projectionData}>
                                    <defs>
                                        <linearGradient
                                            id='colorProjection'
                                            x1='0'
                                            y1='0'
                                            x2='0'
                                            y2='1'
                                        >
                                            <stop
                                                offset='5%'
                                                stopColor='#10b981'
                                                stopOpacity={0.4}
                                            />
                                            <stop
                                                offset='95%'
                                                stopColor='#10b981'
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey='year'
                                        stroke='#64748b'
                                        fontSize={11}
                                        tickLine={false}
                                        interval={4}
                                    />
                                    <YAxis
                                        stroke='#64748b'
                                        fontSize={11}
                                        tickLine={false}
                                        tickFormatter={(v) =>
                                            `${(v / 1000000).toFixed(1)}M`
                                        }
                                        width={50}
                                    />
                                    <Tooltip
                                        formatter={(value, name) => [
                                            formatPLN(value),
                                            name === 'value'
                                                ? 'Projected'
                                                : 'Goal',
                                        ]}
                                        contentStyle={{
                                            background: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Area
                                        type='monotone'
                                        dataKey='value'
                                        stroke='#10b981'
                                        strokeWidth={2}
                                        fill='url(#colorProjection)'
                                        name='Projected Value'
                                    />
                                    <Line
                                        type='monotone'
                                        dataKey='goal'
                                        stroke='#3b82f6'
                                        strokeDasharray='8 4'
                                        strokeWidth={2}
                                        dot={false}
                                        name='Goal'
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div
                style={{
                    marginTop: '32px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#475569',
                }}
            >
                Investment Tracker • Data is simulated • Not financial advice
            </div>

            {/* Export Success Toast */}
            {exportSuccess && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                        animation: 'slideIn 0.3s ease',
                    }}
                >
                    ✓ Export successful!
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <div
                        style={{
                            background: '#1e293b',
                            borderRadius: '16px',
                            padding: '32px',
                            width: '90%',
                            maxWidth: '500px',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '24px',
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: '20px',
                                    fontWeight: '600',
                                }}
                            >
                                Export Data
                            </h2>
                            <button
                                onClick={() => setShowExportModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    padding: '0',
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <p
                            style={{
                                fontSize: '13px',
                                color: '#94a3b8',
                                marginBottom: '24px',
                            }}
                        >
                            Export your portfolio data for backup or transfer to
                            another device.
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}
                        >
                            <button
                                onClick={exportToJSON}
                                style={{
                                    padding: '16px 20px',
                                    background:
                                        'linear-gradient(90deg, #10b981, #059669)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    fontWeight: '600',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <div>Full Backup (JSON)</div>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            opacity: 0.8,
                                            fontWeight: '400',
                                            marginTop: '4px',
                                        }}
                                    >
                                        All data • Can be imported back
                                    </div>
                                </div>
                                <span style={{ fontSize: '20px' }}>→</span>
                            </button>

                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    textAlign: 'center',
                                    padding: '8px 0',
                                }}
                            >
                                — or export as CSV —
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '8px',
                                }}
                            >
                                <button
                                    onClick={() => exportToCSV('holdings')}
                                    style={{
                                        padding: '12px',
                                        background: '#334155',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                        color: '#e2e8f0',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    Holdings
                                </button>
                                <button
                                    onClick={() => exportToCSV('transactions')}
                                    style={{
                                        padding: '12px',
                                        background: '#334155',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                        color: '#e2e8f0',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    Transactions
                                </button>
                                <button
                                    onClick={() => exportToCSV('cash')}
                                    style={{
                                        padding: '12px',
                                        background: '#334155',
                                        border: '1px solid #475569',
                                        borderRadius: '8px',
                                        color: '#e2e8f0',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    Cash
                                </button>
                            </div>
                        </div>

                        <div
                            style={{
                                marginTop: '24px',
                                padding: '12px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '11px',
                                    color: '#94a3b8',
                                    margin: 0,
                                }}
                            >
                                💡 <strong>Tip:</strong> Use JSON for full
                                backups. CSV files are useful for spreadsheet
                                analysis but can't be imported back.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <div
                        style={{
                            background: '#1e293b',
                            borderRadius: '16px',
                            padding: '32px',
                            width: '90%',
                            maxWidth: '550px',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '24px',
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: '20px',
                                    fontWeight: '600',
                                }}
                            >
                                Import Data
                            </h2>
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportData('');
                                    setImportError('');
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    padding: '0',
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <p
                            style={{
                                fontSize: '13px',
                                color: '#94a3b8',
                                marginBottom: '24px',
                            }}
                        >
                            Import portfolio data from a previously exported
                            JSON file. This will replace all current data.
                        </p>

                        {/* File Upload */}
                        <div
                            style={{
                                border: '2px dashed #475569',
                                borderRadius: '12px',
                                padding: '24px',
                                textAlign: 'center',
                                marginBottom: '16px',
                                background: 'rgba(15, 23, 42, 0.5)',
                            }}
                        >
                            <input
                                type='file'
                                accept='.json'
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                id='file-upload'
                            />
                            <label
                                htmlFor='file-upload'
                                style={{
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    fontSize: '13px',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '32px',
                                        marginBottom: '8px',
                                    }}
                                >
                                    📁
                                </div>
                                <div
                                    style={{
                                        color: '#10b981',
                                        fontWeight: '600',
                                        marginBottom: '4px',
                                    }}
                                >
                                    Click to upload JSON file
                                </div>
                                <div style={{ fontSize: '11px' }}>
                                    or paste JSON below
                                </div>
                            </label>
                        </div>

                        {/* Text Area */}
                        <textarea
                            value={importData}
                            onChange={(e) => {
                                setImportData(e.target.value);
                                setImportError('');
                            }}
                            placeholder='Paste your JSON data here...'
                            style={{
                                width: '100%',
                                height: '150px',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '12px',
                                color: '#e2e8f0',
                                fontSize: '12px',
                                fontFamily: "'JetBrains Mono', monospace",
                                resize: 'vertical',
                                boxSizing: 'border-box',
                            }}
                        />

                        {/* Error Message */}
                        {importError && (
                            <div
                                style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    fontSize: '12px',
                                }}
                            >
                                ⚠️ {importError}
                            </div>
                        )}

                        {/* Warning */}
                        <div
                            style={{
                                marginTop: '16px',
                                padding: '12px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: '11px',
                                    color: '#f59e0b',
                                    margin: 0,
                                }}
                            >
                                ⚠️ <strong>Warning:</strong> Importing will
                                replace all your current holdings, transactions,
                                cash, and goal settings.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '24px',
                            }}
                        >
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportData('');
                                    setImportError('');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#334155',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#e2e8f0',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!importData.trim()}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: importData.trim()
                                        ? 'linear-gradient(90deg, #10b981, #059669)'
                                        : '#334155',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '13px',
                                    cursor: importData.trim()
                                        ? 'pointer'
                                        : 'not-allowed',
                                    fontFamily: 'inherit',
                                    fontWeight: '600',
                                    opacity: importData.trim() ? 1 : 0.5,
                                }}
                            >
                                Import Data
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
