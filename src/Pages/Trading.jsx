import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Calendar, BarChart3, PieChart,
  DollarSign, Target, Trophy, AlertTriangle, Clock, Filter,
  RefreshCw, Plus, X, Edit2, Save, Trash2,
  Building2, Briefcase, LineChart, CandlestickChart,
  Wallet, ArrowUpRight, ArrowDownRight, Activity,
  CheckCircle, XCircle, Info
} from 'lucide-react';

const Trading = ({ refreshTrigger }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // =============================================
  // TOAST STATE
  // =============================================
  const [toast, setToast] = useState(null);

  // =============================================
  // FILTER STATE - Monthly, Daily, Weekly
  // =============================================
  const [filterType, setFilterType] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [trades, setTrades] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTradeId, setDeleteTradeId] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId] = useState(1);

  // =============================================
  // MARKET DEFINITIONS
  // =============================================
  const INDIAN_BROKERS = ['Groww', 'Dhan', 'Zerodha', 'Lemon', 'Punch', 'Angel One', 'Upstox'];
  const FOREX_BROKERS = ['Xm', 'Vintage', 'Other'];
  const INDIAN_SEGMENTS = ['Stocks', 'Futures', 'Options'];
  const FOREX_SEGMENTS = ['Forex', 'Commodity', 'Metal', 'Currency Pair', 'Index'];

  // =============================================
  // FORM STATE
  // =============================================
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    marketType: 'indian',
    broker: 'Groww',
    segment: 'Stocks',
    name: '',
    type: 'Buy',
    lotSize: '',
    entryPrice: '',
    exitPrice: '',
    brokerage: '',
    status: 'Profit',
    notes: ''
  });

  const indianBrokers = ['Groww', 'Dhan', 'Zerodha', 'Lemon', 'Punch', 'Angel One', 'Upstox'];
  const forexBrokers = ['Xm', 'Vintage', 'Other'];
  const indianSegments = ['Stocks', 'Futures', 'Options'];
  const forexSegments = ['Forex', 'Commodity', 'Metal', 'Currency Pair', 'Index'];
  const tradeTypes = ['Buy', 'Sell'];
  const tradeStatus = ['Profit', 'Loss'];

  // =============================================
  // TOAST FUNCTIONS
  // =============================================
  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, duration });
    setTimeout(() => {
      setToast(null);
    }, duration);
  };

  // =============================================
  // FORMAT FUNCTIONS
  // =============================================
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount, isForex = false) => {
    if (amount === undefined || amount === null || isNaN(amount)) return isForex ? '$0' : '₹0';
    const num = parseFloat(amount);
    const symbol = isForex ? '$' : '₹';
    if (Number.isInteger(num)) {
      return `${symbol}${num}`;
    }
    return `${symbol}${num.toFixed(2)}`;
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return parseFloat(num).toString();
  };

  // =============================================
  // FETCH TRADES
  // =============================================
  useEffect(() => {
    fetchTrades();
  }, [selectedMonth]);

  const fetchTrades = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch(`http://localhost:5000/api/personal-trading/user/${userId}/month/${selectedMonth}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setTrades([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTrades(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch trades');
      }
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Failed to load trades');
      showToast('Failed to load trades', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTrades(true);
    showToast('Trades refreshed successfully', 'success', 2000);
  };

  // =============================================
  // GET DATE RANGE BASED ON FILTER
  // =============================================
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch(filterType) {
      case 'daily':
        const day = new Date(selectedDate);
        startDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        endDate = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
        break;
      case 'weekly':
        const week = new Date(selectedDate);
        const dayOfWeek = week.getDay();
        const diff = week.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(week.getFullYear(), week.getMonth(), diff);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'monthly':
      default:
        const [year, month] = selectedMonth.split('-').map(Number);
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 1);
        break;
    }

    return { startDate, endDate };
  };

  // =============================================
  // FILTER TRADES BY DATE RANGE
  // =============================================
  const getFilteredTrades = () => {
    const { startDate, endDate } = getDateRange();
    
    return trades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate >= startDate && tradeDate < endDate;
    });
  };

  // =============================================
  // SPLIT TRADES BY MARKET
  // =============================================
  const getMarketTrades = (filteredTrades) => {
    const indian = filteredTrades.filter(t => 
      INDIAN_BROKERS.includes(t.broker) || INDIAN_SEGMENTS.includes(t.segment)
    );
    const forex = filteredTrades.filter(t => 
      FOREX_BROKERS.includes(t.broker) || FOREX_SEGMENTS.includes(t.segment)
    );
    return { indian, forex };
  };

  // =============================================
  // CALCULATE MARKET SUMMARY
  // =============================================
  const calculateMarketStats = (marketTrades, isForex = false) => {
    const totalTrades = marketTrades.length;
    const winningTrades = marketTrades.filter(t => parseFloat(t.profit_loss) > 0);
    const losingTrades = marketTrades.filter(t => parseFloat(t.profit_loss) < 0);
    
    const totalGrossProfit = winningTrades.reduce((sum, t) => sum + parseFloat(t.profit_loss), 0);
    const totalGrossLoss = losingTrades.reduce((sum, t) => sum + Math.abs(parseFloat(t.profit_loss)), 0);
    const totalBrokerage = marketTrades.reduce((sum, t) => sum + parseFloat(t.brokerage || 0), 0);
    
    const grossPL = totalGrossProfit - totalGrossLoss;
    const netPL = grossPL - totalBrokerage;
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const avgProfit = winningTrades.length > 0 ? totalGrossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalGrossLoss / losingTrades.length : 0;
    const avgBrokerage = totalTrades > 0 ? totalBrokerage / totalTrades : 0;
    const bestTrade = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => parseFloat(t.profit_loss))) : 0;
    const worstTrade = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => parseFloat(t.profit_loss))) : 0;
    const profitFactor = totalGrossLoss > 0 ? totalGrossProfit / totalGrossLoss : totalGrossProfit > 0 ? Infinity : 0;

    const brokerSummary = {};
    marketTrades.forEach(t => {
      if (!brokerSummary[t.broker]) {
        brokerSummary[t.broker] = { trades: 0, grossProfit: 0, grossLoss: 0, brokerage: 0 };
      }
      brokerSummary[t.broker].trades++;
      if (parseFloat(t.profit_loss) > 0) {
        brokerSummary[t.broker].grossProfit += parseFloat(t.profit_loss);
      } else {
        brokerSummary[t.broker].grossLoss += Math.abs(parseFloat(t.profit_loss));
      }
      brokerSummary[t.broker].brokerage += parseFloat(t.brokerage || 0);
    });

    const segmentSummary = {};
    marketTrades.forEach(t => {
      if (!segmentSummary[t.segment]) {
        segmentSummary[t.segment] = { trades: 0, grossProfit: 0, grossLoss: 0 };
      }
      segmentSummary[t.segment].trades++;
      if (parseFloat(t.profit_loss) > 0) {
        segmentSummary[t.segment].grossProfit += parseFloat(t.profit_loss);
      } else {
        segmentSummary[t.segment].grossLoss += Math.abs(parseFloat(t.profit_loss));
      }
    });

    const dailyPL = {};
    marketTrades.forEach(t => {
      const dateKey = t.date;
      if (!dailyPL[dateKey]) {
        dailyPL[dateKey] = 0;
      }
      dailyPL[dateKey] += parseFloat(t.profit_loss);
    });

    const sortedDates = Object.keys(dailyPL).sort();
    const barData = sortedDates.map(date => ({
      date: date,
      pl: dailyPL[date],
      formattedDate: formatDate(date)
    }));

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalGrossProfit,
      totalGrossLoss,
      totalBrokerage,
      grossPL,
      netPL,
      winRate,
      avgProfit,
      avgLoss,
      avgBrokerage,
      bestTrade,
      worstTrade,
      profitFactor,
      brokerSummary,
      segmentSummary,
      barData,
      trades: marketTrades
    };
  };

  // =============================================
  // GET FILTERED AND CALCULATED DATA
  // =============================================
  const filteredTradesData = getFilteredTrades();
  const { indian: indianTrades, forex: forexTrades } = getMarketTrades(filteredTradesData);
  
  const indianStats = calculateMarketStats(indianTrades, false);
  const forexStats = calculateMarketStats(forexTrades, true);
  
  const combinedStats = {
    totalTrades: indianStats.totalTrades + forexStats.totalTrades,
    netPL: indianStats.netPL + forexStats.netPL,
    totalBrokerage: indianStats.totalBrokerage + forexStats.totalBrokerage,
    winRate: (indianStats.totalTrades + forexStats.totalTrades) > 0 
      ? ((indianStats.winningTrades + forexStats.winningTrades) / (indianStats.totalTrades + forexStats.totalTrades)) * 100 
      : 0,
    winningTrades: indianStats.winningTrades + forexStats.winningTrades,
    losingTrades: indianStats.losingTrades + forexStats.losingTrades,
    totalGrossProfit: indianStats.totalGrossProfit + forexStats.totalGrossProfit,
    totalGrossLoss: indianStats.totalGrossLoss + forexStats.totalGrossLoss
  };

  // =============================================
  // PIE CHART DATA
  // =============================================
  const getPieData = (stats) => {
    return [
      { label: 'Profit', value: stats.totalGrossProfit || 0, color: '#10B981' },
      { label: 'Loss', value: stats.totalGrossLoss || 0, color: '#F43F5E' }
    ];
  };

  const createPieSegments = (pieData) => {
    const total = pieData.reduce((sum, item) => sum + item.value, 0) || 1;
    let cumulativeAngle = 0;
    return pieData.map(item => {
      const angle = (item.value / total) * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angle;
      return { ...item, startAngle, angle };
    });
  };

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  const indianPieData = getPieData(indianStats);
  const forexPieData = getPieData(forexStats);
  const indianPieSegments = createPieSegments(indianPieData);
  const forexPieSegments = createPieSegments(forexPieData);

  // =============================================
  // GET MAX PL FOR BAR CHARTS
  // =============================================
  const maxIndianPL = indianStats.barData.length > 0 ? Math.max(...indianStats.barData.map(d => Math.abs(d.pl))) : 1;
  const maxForexPL = forexStats.barData.length > 0 ? Math.max(...forexStats.barData.map(d => Math.abs(d.pl))) : 1;

  // =============================================
  // ADD TRADE
  // =============================================
  const addTrade = async () => {
    try {
      setSaving(true);
      setError(null);

      const grossPL = (parseFloat(formData.exitPrice) - parseFloat(formData.entryPrice)) * parseFloat(formData.lotSize);
      const brokerage = parseFloat(formData.brokerage) || 0;
      const netPL = grossPL - brokerage;

      const payload = {
        user_id: userId,
        date: formData.date,
        broker: formData.broker,
        segment: formData.segment,
        name: formData.name,
        type: formData.type,
        quantity: parseFloat(formData.lotSize) || 0,
        entry_price: parseFloat(formData.entryPrice) || 0,
        exit_price: parseFloat(formData.exitPrice) || 0,
        profit_loss: netPL,
        brokerage: brokerage,
        gross_profit_loss: grossPL,
        status: formData.status,
        notes: formData.notes
      };

      const response = await fetch('http://localhost:5000/api/personal-trading/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTrades([result.data, ...trades]);
        showToast('✅ Trade added successfully!', 'success');
        setShowAddModal(false);
        resetForm();
      } else {
        throw new Error(result.message || 'Failed to add trade');
      }
    } catch (err) {
      console.error('Error adding trade:', err);
      showToast(err.message || 'Failed to add trade', 'error');
    } finally {
      setSaving(false);
    }
  };

  // =============================================
  // UPDATE TRADE
  // =============================================
  const updateTrade = async () => {
    try {
      setSaving(true);
      setError(null);

      const grossPL = (parseFloat(formData.exitPrice) - parseFloat(formData.entryPrice)) * parseFloat(formData.lotSize);
      const brokerage = parseFloat(formData.brokerage) || 0;
      const netPL = grossPL - brokerage;

      const payload = {
        date: formData.date,
        broker: formData.broker,
        segment: formData.segment,
        name: formData.name,
        type: formData.type,
        quantity: parseFloat(formData.lotSize) || 0,
        entry_price: parseFloat(formData.entryPrice) || 0,
        exit_price: parseFloat(formData.exitPrice) || 0,
        profit_loss: netPL,
        brokerage: brokerage,
        gross_profit_loss: grossPL,
        status: formData.status,
        notes: formData.notes
      };

      const response = await fetch(`http://localhost:5000/api/personal-trading/update/${editingTrade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTrades(trades.map(t => t.id === result.data.id ? result.data : t));
        showToast('✅ Trade updated successfully!', 'success');
        setEditingTrade(null);
        setShowAddModal(false);
        resetForm();
      } else {
        throw new Error(result.message || 'Failed to update trade');
      }
    } catch (err) {
      console.error('Error updating trade:', err);
      showToast(err.message || 'Failed to update trade', 'error');
    } finally {
      setSaving(false);
    }
  };

  // =============================================
  // DELETE TRADE
  // =============================================
  const deleteTrade = async (id) => {
    setDeleteTradeId(id);
  };

  const confirmDeleteTrade = async () => {
    const id = deleteTradeId;
    setDeleteTradeId(null);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/personal-trading/delete/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTrades(trades.filter(t => t.id !== id));
        showToast('✅ Trade deleted successfully!', 'success');
      } else {
        throw new Error(result.message || 'Failed to delete trade');
      }
    } catch (err) {
      console.error('Error deleting trade:', err);
      showToast(err.message || 'Failed to delete trade', 'error');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // RESET FORM
  // =============================================
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      marketType: 'indian',
      broker: 'Groww',
      segment: 'Stocks',
      name: '',
      type: 'Buy',
      lotSize: '',
      entryPrice: '',
      exitPrice: '',
      brokerage: '',
      status: 'Profit',
      notes: ''
    });
  };

  // =============================================
  // EDIT TRADE
  // =============================================
  const handleEdit = (trade) => {
    const marketType = INDIAN_BROKERS.includes(trade.broker) || INDIAN_SEGMENTS.includes(trade.segment) ? 'indian' : 'forex';
    setEditingTrade(trade);
    setFormData({
      date: trade.date,
      marketType: marketType,
      broker: trade.broker,
      segment: trade.segment,
      name: trade.name,
      type: trade.type,
      lotSize: trade.quantity?.toString() || '',
      entryPrice: trade.entry_price?.toString() || '',
      exitPrice: trade.exit_price?.toString() || '',
      brokerage: trade.brokerage?.toString() || '',
      status: parseFloat(trade.profit_loss) > 0 ? 'Profit' : 'Loss',
      notes: trade.notes || ''
    });
    setShowAddModal(true);
  };

  // =============================================
  // HANDLE INPUT CHANGE
  // =============================================
  const handleNumberChange = (field, value) => {
    if (value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value)) {
      setFormData({ ...formData, [field]: value });
    }
  };

  // =============================================
  // HANDLE MARKET TYPE CHANGE
  // =============================================
  const handleMarketTypeChange = (type) => {
    setFormData({
      ...formData,
      marketType: type,
      broker: type === 'indian' ? 'Groww' : 'Xm',
      segment: type === 'indian' ? 'Stocks' : 'Forex'
    });
  };

  // =============================================
  // FILTERED TRADES FOR DISPLAY
  // =============================================
  const displayTrades = filteredTradesData.filter(t => {
    const searchMatch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       t.broker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       t.segment.toLowerCase().includes(searchQuery.toLowerCase());
    return searchMatch;
  });

  // =============================================
  // MONTHS FOR DROPDOWN
  // =============================================
  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleString('default', { month: 'long', year: 'numeric' })
    });
  }

  // =============================================
  // GET DATE LABEL FOR FILTER
  // =============================================
  const getFilterLabel = () => {
    const date = new Date(selectedDate);
    switch(filterType) {
      case 'daily':
        return formatDate(selectedDate);
      case 'weekly': {
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const start = new Date(date.getFullYear(), date.getMonth(), diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${formatDate(start)} - ${formatDate(end)}`;
      }
      case 'monthly':
        return months.find(m => m.value === selectedMonth)?.label || selectedMonth;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '50vh', background: 'transparent'
      }}>
        <div style={{ color: '#A78BFA', fontSize: '1rem' }}>Loading trades...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; background: #06060f; color: white; }

        .trading-container {
          background: linear-gradient(145deg, rgba(17,21,43,0.92), rgba(24,27,58,0.76));
          border: 1px solid rgba(196,181,253,0.2);
          border-radius: 18px;
          padding: 1rem;
        }

        /* =============================================
           TOAST NOTIFICATION STYLES
        ============================================= */
        .toast-container {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          animation: toastSlideDown 0.4s ease;
          max-width: 90%;
          width: 100%;
          pointer-events: none;
        }

        @keyframes toastSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.95); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        @keyframes toastFadeOut {
          from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          to { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.95); }
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 1.2rem;
          border-radius: 12px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.08);
          max-width: 500px;
          margin: 0 auto;
          pointer-events: auto;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .toast.success {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .toast.error {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .toast.info {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .toast-icon {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toast-icon.success { color: #6EE7B7; }
        .toast-icon.error { color: #FCA5A5; }
        .toast-icon.info { color: #93C5FD; }

        .toast-message {
          font-size: 0.8rem;
          font-weight: 500;
          color: white;
          flex: 1;
        }

        .toast-close {
          background: rgba(255,255,255,0.05);
          border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          padding: 0.2rem;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
        }

        .toast-close:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .trade-confirm-dialog {
          width: min(92%, 360px);
          margin: 0 auto 0.75rem;
          padding: 0.9rem;
          text-align: center;
          background: rgba(32,32,51,0.98);
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: 12px;
          box-shadow: 0 14px 35px rgba(0,0,0,0.35);
        }
        .trade-confirm-dialog p { margin: 0.5rem 0 0.75rem; color: rgba(255,255,255,0.85); font-size: 0.75rem; }
        .trade-confirm-actions { display: flex; justify-content: center; gap: 0.4rem; }

        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.045));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(196,181,253,0.24);
          border-radius: 20px;
          transition: all 0.3s ease;
          padding: 1.25rem;
          box-shadow: 0 14px 36px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .glass-card:hover {
          background: linear-gradient(145deg, rgba(255,255,255,0.14), rgba(124,58,237,0.08));
          border-color: rgba(196,181,253,0.52);
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .glass-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }
        .glass-btn:hover {
          background: rgba(124, 58, 237, 0.3);
          border-color: rgba(196, 181, 253, 0.62);
          transform: translateY(-2px);
        }
        .glass-btn:active { transform: scale(0.95); }
        .glass-btn.primary {
          background: rgba(124, 58, 237, 0.15);
          border-color: rgba(124, 58, 237, 0.3);
          color: #A78BFA;
        }
        .glass-btn.primary:hover { background: rgba(124, 58, 237, 0.25); }
        .glass-btn.danger {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #FCA5A5;
        }
        .glass-btn.danger:hover { background: rgba(239, 68, 68, 0.25); }
        .glass-btn.success {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
          color: #6EE7B7;
        }
        .glass-btn.success:hover { background: rgba(16, 185, 129, 0.25); }

        .refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .refresh-btn:hover {
          background: rgba(124, 58, 237, 0.3);
          border-color: rgba(196, 181, 253, 0.62);
          transform: translateY(-2px);
        }
        .refresh-btn:active { transform: scale(0.95); }
        .refresh-btn.spinning .refresh-icon { animation: spin 1s linear infinite; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .stat-box {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 0.8rem;
          text-align: center;
          transition: all 0.3s ease;
        }
        .stat-box:hover {
          background: rgba(124, 58, 237, 0.18);
          border-color: rgba(167, 139, 250, 0.5);
          transform: translateY(-2px);
        }
        .stat-value { font-size: 1.4rem; font-weight: 800; }
        .net-pnl-value { font-size: 1.55rem !important; font-weight: 900; letter-spacing: 0.01em; text-shadow: 0 0 16px currentColor; }
        .stat-label {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.72);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.2rem;
        }

        .edit-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 0.5rem 0.7rem;
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          width: 100%;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.3s ease;
        }
        .edit-input:focus {
          border-color: rgba(196, 181, 253, 0.72);
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.1);
          background: rgba(124, 58, 237, 0.16);
        }
        .edit-input::placeholder { color: rgba(255, 255, 255, 0.3); }

        .edit-select {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 0.5rem 0.7rem;
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          width: 100%;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
        }
        .edit-select option { background: #0a0a1f; }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
          padding: 20px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-content {
          background: linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
        }
        .modal-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .modal-close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-group.full { grid-column: 1 / -1; }
        .form-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.72);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }
        .form-actions button {
          padding: 0.6rem 1.5rem;
          border-radius: 10px;
          border: none;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .form-actions .save-btn {
          background: linear-gradient(135deg, #7C3AED, #6D28D9);
          color: white;
          box-shadow: 0 8px 30px rgba(124, 58, 237, 0.3);
        }
        .form-actions .save-btn:hover {
          box-shadow: 0 12px 40px rgba(124, 58, 237, 0.4);
          transform: scale(1.02);
        }
        .form-actions .cancel-btn {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .form-actions .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .pie-segment {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .pie-segment:hover { filter: brightness(1.3); }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }

        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .gap-1 { gap: 0.5rem; }
        .gap-2 { gap: 1rem; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .w-full { width: 100%; }

        .bar-chart-container {
          display: flex;
          align-items: flex-end;
          height: 120px;
          gap: 4px;
          padding: 0 4px;
          width: 100%;
          overflow-x: auto;
          min-height: 120px;
        }
        .bar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          min-width: 20px;
          max-width: 40px;
        }
        .bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          min-height: 2px;
          transition: all 0.3s ease;
          position: relative;
        }
        .bar:hover {
          opacity: 0.8;
          transform: scaleY(1.02);
          transform-origin: bottom;
        }
        .bar-label {
          font-size: 0.45rem;
          color: rgba(255, 255, 255, 0.3);
          margin-top: 2px;
          text-align: center;
          white-space: nowrap;
          overflow: visible;
          max-width: none;
        }
        .bar-value {
          font-size: 0.45rem;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .segment-item {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 0.5rem;
          text-align: center;
          transition: all 0.3s ease;
        }
        .segment-item:hover {
          background: rgba(124, 58, 237, 0.18);
          border-color: rgba(167, 139, 250, 0.5);
          transform: translateY(-2px);
        }
        .segment-name { font-size: 0.7rem; font-weight: 600; color: white; }
        .segment-trades { font-size: 0.6rem; color: rgba(255, 255, 255, 0.7); }
        .segment-pl { font-size: 0.75rem; font-weight: 700; }

        .market-card {
          border: 1px solid rgba(196,181,253,0.28);
          border-radius: 16px;
          padding: 1rem;
          transition: all 0.3s ease;
        }
        .market-card:hover {
          border-color: rgba(196,181,253,0.62);
        }
        .market-card.indian { border-color: rgba(16, 185, 129, 0.2); }
        .market-card.forex { border-color: rgba(245, 158, 11, 0.2); }

        .market-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 1rem;
          font-weight: 700;
        }
        .market-header.indian { color: #6EE7B7; }
        .market-header.forex { color: #FBBF24; }

        .market-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .market-stat {
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0.4rem;
          text-align: center;
        }
        .market-stat-value { font-size: 0.9rem; font-weight: 700; }
        .market-stat-value.net-pnl-value { font-size: 1.18rem; }
        .market-stat-label {
          font-size: 0.5rem;
          color: rgba(255, 255, 255, 0.72);
          text-transform: uppercase;
        }

        .trade-card-mobile {
          background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.045));
          border: 1px solid rgba(196,181,253,0.28);
          border-radius: 10px;
          padding: 0.6rem;
          margin-bottom: 0.4rem;
        }
        .trade-card-mobile .row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 0.15rem 0;
        }
        .trade-card-mobile .label {
          color: rgba(255, 255, 255, 0.72);
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
          flex: 0 0 38%;
        }
        .trade-card-mobile .value {
          font-weight: 600;
          font-size: 0.65rem;
          flex: 1 1 55%;
          min-width: 0;
          text-align: right;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .trade-card-mobile .net-pnl-inline { font-size: 0.82rem; font-weight: 900; text-shadow: 0 0 10px currentColor; }
        .desktop-table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .desktop-table-wrap table { min-width: 900px; }
        .desktop-table-wrap th { color: rgba(255,255,255,0.72) !important; border-bottom-color: rgba(196,181,253,0.24) !important; }
        .market-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.5rem; }

        .filter-toggle {
          display: flex;
          gap: 0.3rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.2rem;
        }
        .filter-toggle button {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.72);
          padding: 0.3rem 0.7rem;
          border-radius: 8px;
          font-size: 0.65rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .filter-toggle button.active {
          background: rgba(124, 58, 237, 0.38);
          color: #E9D5FF;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 14px rgba(124,58,237,0.18);
        }
        .filter-toggle button:hover {
          color: white;
        }

        .mobile-show { display: none; }

        @media (max-width: 768px) {
          .mobile-show { display: block !important; }
          .desktop-table-wrap { display: none !important; }
          .market-stats { grid-template-columns: repeat(2, 1fr); }
          .market-sections { grid-template-columns: 1fr; }
          .bar-chart-container { height: 80px; gap: 2px; }
          .bar-wrapper { min-width: 12px; }
          .bar-label { font-size: 0.4rem; }
          .bar-value { font-size: 0.35rem; }
          .trade-card-mobile .label { flex-basis: 34%; }
          .trade-card-mobile .value { font-size: 0.68rem; }
          .filter-toggle button { padding: 0.2rem 0.5rem; font-size: 0.55rem; }
        }

        @media (max-width: 1024px) {
          .trading-container { padding: 0; }
          .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .glass-card { padding: 1rem; }
        }

        @media (max-width: 768px) {
          .trading-container { padding: 0; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; gap: 0.4rem !important; }
          .grid-3 { grid-template-columns: 1fr 1fr !important; gap: 0.4rem !important; }
          .grid-2 { grid-template-columns: 1fr !important; gap: 0.4rem !important; }
          .glass-card { padding: 0.75rem; border-radius: 14px; }
          .stat-value { font-size: 1.1rem !important; }
          .stat-label { font-size: 0.55rem !important; }
          .stat-box { padding: 0.5rem; }
          .form-grid { grid-template-columns: 1fr; }
          .modal-content { padding: 16px; max-width: 95%; }
          .modal-close-btn { top: 8px; right: 8px; width: 30px; height: 30px; }
          .glass-btn { padding: 0.3rem 0.6rem; font-size: 0.65rem; }
          .refresh-btn { padding: 0.3rem 0.6rem; font-size: 0.65rem; }
        }

        @media (max-width: 480px) {
          .trading-container { padding: 0; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; gap: 0.3rem !important; }
          .grid-3 { grid-template-columns: 1fr !important; gap: 0.3rem !important; }
          .glass-card { padding: 0.5rem; border-radius: 10px; }
          .stat-value { font-size: 0.9rem !important; }
          .stat-label { font-size: 0.5rem !important; }
          .stat-box { padding: 0.3rem; }
          .modal-content { padding: 12px; max-width: 98%; }
          .form-actions button { padding: 0.4rem 1rem; font-size: 0.75rem; }
          .edit-input { font-size: 0.75rem; padding: 0.3rem 0.5rem; }
          .edit-select { font-size: 0.75rem; padding: 0.3rem 0.5rem; }
        }

        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.5);
        }
      `}</style>

      {/* ✅ ADDED: id="trading-journal" for navbar navigation */}
      <div id="trading-journal" className="trading-container">

        {/* =============================================
            TOAST NOTIFICATION
        ============================================= */}
        {toast && (
          <div className="toast-container" style={{ animation: 'toastSlideDown 0.4s ease' }}>
            <div className={`toast ${toast.type}`}>
              <div className={`toast-icon ${toast.type}`}>
                {toast.type === 'success' && <CheckCircle size={20} />}
                {toast.type === 'error' && <XCircle size={20} />}
                {toast.type === 'info' && <Info size={20} />}
              </div>
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close" onClick={() => setToast(null)}>
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        {deleteTradeId !== null && (
          <div className="trade-confirm-dialog" role="alertdialog" aria-live="assertive">
            <AlertTriangle size={20} color="#FCD34D" style={{ margin: '0 auto' }} />
            <p>Are you sure you want to delete this trade?</p>
            <div className="trade-confirm-actions">
              <button className="glass-btn" onClick={() => setDeleteTradeId(null)}>Cancel</button>
              <button className="glass-btn danger" onClick={confirmDeleteTrade}>Delete</button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', background: 'linear-gradient(135deg, #FFFFFF, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Trading Journal
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.1rem' }}>
              Track Indian & Forex trades with brokerage
            </p>
          </div>
          <div className="flex flex-wrap" style={{ gap: '0.4rem' }}>
            <button 
              className={`refresh-btn ${refreshing ? 'spinning' : ''}`} 
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.65rem' }}
            >
              <RefreshCw size={12} className="refresh-icon" />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              className="glass-btn primary" 
              onClick={() => { resetForm(); setShowAddModal(true); }}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.65rem' }}
            >
              <Plus size={12} /> Add Trade
            </button>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="glass-card" style={{ marginBottom: '0.75rem', padding: '0.75rem' }}>
          <div className="flex justify-between items-center flex-wrap" style={{ gap: '0.5rem' }}>
            <div className="flex items-center" style={{ gap: '0.5rem' }}>
              <Clock size={16} color="#2EA8FF" />
              <div className="filter-toggle">
                <button 
                  className={filterType === 'monthly' ? 'active' : ''}
                  onClick={() => setFilterType('monthly')}
                >
                  📆 Monthly
                </button>
                <button 
                  className={filterType === 'daily' ? 'active' : ''}
                  onClick={() => setFilterType('daily')}
                >
                  📊 Daily
                </button>
                <button 
                  className={filterType === 'weekly' ? 'active' : ''}
                  onClick={() => setFilterType('weekly')}
                >
                  📈 Weekly
                </button>
              </div>
            </div>
            <div className="flex items-center" style={{ gap: '0.5rem' }}>
              <Calendar size={14} color="#2EA8FF" />
              {filterType === 'monthly' ? (
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value} style={{ background: '#0a0a1f' }}>{month.label}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                />
              )}
            </div>
            <div className="flex items-center" style={{ gap: '0.3rem' }}>
              <Filter size={14} color="rgba(255,255,255,0.3)" />
              <input 
                className="edit-input" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '120px', fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}
              />
            </div>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.3rem' }}>
            Showing: {getFilterLabel()}
          </div>
        </div>

        {/* COMBINED SUMMARY STATS */}
        <div className="grid-4" style={{ marginBottom: '0.5rem' }}>
          <div className="stat-box" style={{ padding: '0.5rem' }}>
            <div className="stat-value" style={{ color: '#A78BFA', fontSize: '1.2rem' }}>{combinedStats.totalTrades}</div>
            <div className="stat-label">Total Trades</div>
          </div>
          <div className="stat-box" style={{ padding: '0.5rem' }}>
            <div className="stat-value net-pnl-value" style={{ color: combinedStats.netPL >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
              {formatCurrency(combinedStats.netPL)}
            </div>
            <div className="stat-label">Net P&L</div>
          </div>
          <div className="stat-box" style={{ padding: '0.5rem' }}>
            <div className="stat-value" style={{ color: '#6EE7B7', fontSize: '1.2rem' }}>{combinedStats.winRate.toFixed(1)}%</div>
            <div className="stat-label">Win Rate</div>
          </div>
          <div className="stat-box" style={{ padding: '0.5rem' }}>
            <div className="stat-value" style={{ color: '#FCD34D', fontSize: '1.2rem' }}>
              {formatCurrency(combinedStats.totalBrokerage)}
            </div>
            <div className="stat-label">Total Brokerage</div>
          </div>
        </div>

        {/* INDIAN & FOREX MARKET SECTIONS */}
        <div className="market-sections">
          
          {/* INDIAN MARKET */}
          <div className="glass-card market-card indian" style={{ padding: '0.75rem' }}>
            <div className="market-header indian">
              🇮🇳 Indian Market
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '400' }}>
                ({indianStats.totalTrades} trades)
              </span>
            </div>
            
            <div className="market-stats">
              <div className="market-stat">
                <div className="market-stat-value net-pnl-value" style={{ color: indianStats.netPL >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
                  {formatCurrency(indianStats.netPL, false)}
                </div>
                <div className="market-stat-label">Net P&L</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-value" style={{ color: '#6EE7B7' }}>
                  {indianStats.winRate.toFixed(1)}%
                </div>
                <div className="market-stat-label">Win Rate</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-value" style={{ color: '#FCD34D' }}>
                  {formatCurrency(indianStats.totalBrokerage, false)}
                </div>
                <div className="market-stat-label">Brokerage</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-value">
                  {indianStats.winningTrades}/{indianStats.losingTrades}
                </div>
                <div className="market-stat-label">W/L</div>
              </div>
            </div>

            {/* Indian Pie Chart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ flexShrink: 0 }}>
                <svg width="70" height="70" viewBox="0 0 120 120">
                  {indianPieSegments.map((seg, i) => {
                    if (seg.angle <= 0) return null;
                    return (
                      <path 
                        key={i} 
                        d={describeArc(60, 60, 50, seg.startAngle, seg.startAngle + seg.angle)} 
                        fill={seg.color} 
                        className="pie-segment" 
                        stroke="#06060f" 
                        strokeWidth="2" 
                      />
                    );
                  })}
                  <circle cx="60" cy="60" r="25" fill="#06060f" />
                  <text x="60" y="56" textAnchor="middle" fill="white" fontSize="11" fontWeight="800">
                    {formatCurrency(indianStats.netPL, false)}
                  </text>
                  <text x="60" y="70" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="600">Net</text>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex justify-between" style={{ padding: '0.1rem 0' }}>
                  <span style={{ fontSize: '0.6rem', color: '#6EE7B7' }}>● Profit</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6EE7B7' }}>
                    {formatCurrency(indianStats.totalGrossProfit, false)}
                  </span>
                </div>
                <div className="flex justify-between" style={{ padding: '0.1rem 0' }}>
                  <span style={{ fontSize: '0.6rem', color: '#FCA5A5' }}>● Loss</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#FCA5A5' }}>
                    {formatCurrency(indianStats.totalGrossLoss, false)}
                  </span>
                </div>
                <div className="flex justify-between" style={{ padding: '0.1rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.15rem' }}>
                  <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)' }}>Brokerage</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#FCD34D' }}>
                    {formatCurrency(indianStats.totalBrokerage, false)}
                  </span>
                </div>
              </div>
            </div>

            {/* Indian Bar Chart */}
            {indianStats.barData.length > 0 && (
              <div style={{ marginTop: '0.3rem' }}>
                <div className="bar-chart-container" style={{ height: '60px', minHeight: '60px' }}>
                  {indianStats.barData.map((item, index) => {
                    const heightPercent = maxIndianPL > 0 ? (Math.abs(item.pl) / maxIndianPL) * 100 : 0;
                    const isPositive = item.pl >= 0;
                    const barColor = isPositive ? '#6EE7B7' : '#FCA5A5';
                    const barHeight = Math.max(heightPercent, 2);
                    return (
                      <div key={index} className="bar-wrapper" style={{ minWidth: '15px', maxWidth: '30px' }}>
                        <div className="bar-value" style={{ color: barColor, fontSize: '0.4rem' }}>
                          {formatCurrency(item.pl, false)}
                        </div>
                        <div className="bar" style={{ height: `${barHeight}%`, background: barColor, minHeight: '2px' }} />
                        <div className="bar-label" style={{ fontSize: '0.35rem' }}>{item.formattedDate}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* FOREX MARKET */}
          <div className="glass-card market-card forex" style={{ padding: '0.75rem' }}>
            <div className="market-header forex">
              🌍 Forex Market
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '400' }}>
                ({forexStats.totalTrades} trades)
              </span>
            </div>
            
            <div className="market-stats">
              <div className="market-stat">
                <div className="market-stat-value net-pnl-value" style={{ color: forexStats.netPL >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
                  {formatCurrency(forexStats.netPL, true)}
                </div>
                <div className="market-stat-label">Net P&L</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-value" style={{ color: '#6EE7B7' }}>
                  {forexStats.winRate.toFixed(1)}%
                </div>
                <div className="market-stat-label">Win Rate</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-value" style={{ color: '#FCD34D' }}>
                  {formatCurrency(forexStats.totalBrokerage, true)}
                </div>
                <div className="market-stat-label">Brokerage</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-value">
                  {forexStats.winningTrades}/{forexStats.losingTrades}
                </div>
                <div className="market-stat-label">W/L</div>
              </div>
            </div>

            {/* Forex Pie Chart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ flexShrink: 0 }}>
                <svg width="70" height="70" viewBox="0 0 120 120">
                  {forexPieSegments.map((seg, i) => {
                    if (seg.angle <= 0) return null;
                    return (
                      <path 
                        key={i} 
                        d={describeArc(60, 60, 50, seg.startAngle, seg.startAngle + seg.angle)} 
                        fill={seg.color} 
                        className="pie-segment" 
                        stroke="#06060f" 
                        strokeWidth="2" 
                      />
                    );
                  })}
                  <circle cx="60" cy="60" r="25" fill="#06060f" />
                  <text x="60" y="56" textAnchor="middle" fill="white" fontSize="11" fontWeight="800">
                    {formatCurrency(forexStats.netPL, true)}
                  </text>
                  <text x="60" y="70" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="600">Net</text>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex justify-between" style={{ padding: '0.1rem 0' }}>
                  <span style={{ fontSize: '0.6rem', color: '#6EE7B7' }}>● Profit</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6EE7B7' }}>
                    {formatCurrency(forexStats.totalGrossProfit, true)}
                  </span>
                </div>
                <div className="flex justify-between" style={{ padding: '0.1rem 0' }}>
                  <span style={{ fontSize: '0.6rem', color: '#FCA5A5' }}>● Loss</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#FCA5A5' }}>
                    {formatCurrency(forexStats.totalGrossLoss, true)}
                  </span>
                </div>
                <div className="flex justify-between" style={{ padding: '0.1rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.15rem' }}>
                  <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)' }}>Brokerage</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#FCD34D' }}>
                    {formatCurrency(forexStats.totalBrokerage, true)}
                  </span>
                </div>
              </div>
            </div>

            {/* Forex Bar Chart */}
            {forexStats.barData.length > 0 && (
              <div style={{ marginTop: '0.3rem' }}>
                <div className="bar-chart-container" style={{ height: '60px', minHeight: '60px' }}>
                  {forexStats.barData.map((item, index) => {
                    const heightPercent = maxForexPL > 0 ? (Math.abs(item.pl) / maxForexPL) * 100 : 0;
                    const isPositive = item.pl >= 0;
                    const barColor = isPositive ? '#6EE7B7' : '#FCA5A5';
                    const barHeight = Math.max(heightPercent, 2);
                    return (
                      <div key={index} className="bar-wrapper" style={{ minWidth: '15px', maxWidth: '30px' }}>
                        <div className="bar-value" style={{ color: barColor, fontSize: '0.4rem' }}>
                          {formatCurrency(item.pl, true)}
                        </div>
                        <div className="bar" style={{ height: `${barHeight}%`, background: barColor, minHeight: '2px' }} />
                        <div className="bar-label" style={{ fontSize: '0.35rem' }}>{item.formattedDate}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TRADE LIST */}
        <div className="glass-card" style={{ padding: '0.75rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#F59E0B' }}>
            <Activity size={14} /> Trades ({displayTrades.length})
            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: '400' }}>
              ({filterType === 'monthly' ? 'Monthly' : filterType === 'daily' ? 'Daily' : 'Weekly'} view)
            </span>
          </h3>
          
          {displayTrades.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="desktop-table-wrap" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Market</th>
                      <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Broker</th>
                      <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Lot</th>
                      <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Entry</th>
                      <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Exit</th>
                      <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Gross</th>
                      <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Brokerage</th>
                      <th style={{ textAlign: 'right', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Net P&L</th>
                      <th style={{ textAlign: 'center', padding: '0.3rem 0.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: '0.6rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayTrades.map((trade) => {
                      const isForex = FOREX_BROKERS.includes(trade.broker) || FOREX_SEGMENTS.includes(trade.segment);
                      const isProfit = parseFloat(trade.profit_loss) > 0;
                      const marketLabel = isForex ? '🌍 Forex' : '🇮🇳 Indian';
                      return (
                        <tr key={trade.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                          <td style={{ padding: '0.25rem 0.3rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.6rem' }}>{formatDate(trade.date)}</td>
                          <td style={{ padding: '0.25rem 0.3rem', fontSize: '0.6rem' }}>{marketLabel}</td>
                          <td style={{ padding: '0.25rem 0.3rem', fontWeight: '600', color: 'white', fontSize: '0.65rem' }}>{trade.name}</td>
                          <td style={{ padding: '0.25rem 0.3rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>{trade.broker}</td>
                          <td style={{ padding: '0.25rem 0.3rem', textAlign: 'right', color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>{formatNumber(trade.quantity)}</td>
                          <td style={{ padding: '0.25rem 0.3rem', textAlign: 'right', color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>{formatCurrency(trade.entry_price, isForex)}</td>
                          <td style={{ padding: '0.25rem 0.3rem', textAlign: 'right', color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>{formatCurrency(trade.exit_price, isForex)}</td>
                          <td style={{ padding: '0.25rem 0.3rem', textAlign: 'right', color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem' }}>
                            {formatCurrency(trade.gross_profit_loss || trade.profit_loss, isForex)}
                          </td>
                          <td style={{ padding: '0.25rem 0.3rem', textAlign: 'right', color: '#FCD34D', fontSize: '0.6rem' }}>
                            {formatCurrency(trade.brokerage || 0, isForex)}
                          </td>
                          <td style={{ padding: '0.25rem 0.3rem', textAlign: 'right', fontWeight: '700', color: isProfit ? '#6EE7B7' : '#FCA5A5', fontSize: '0.65rem' }}>
                            <span className="net-pnl-inline" style={{ color: isProfit ? '#6EE7B7' : '#FCA5A5' }}>
                              {formatCurrency(trade.profit_loss, isForex)}
                            </span>
                          </td>
                          <td style={{ padding: '0.25rem 0.3rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'center' }}>
                              <button 
                                className="glass-btn" 
                                onClick={() => handleEdit(trade)}
                                style={{ padding: '0.15rem 0.3rem', fontSize: '0.5rem' }}
                              >
                                <Edit2 size={10} />
                              </button>
                              <button 
                                className="glass-btn danger" 
                                onClick={() => deleteTrade(trade.id)}
                                style={{ padding: '0.15rem 0.3rem', fontSize: '0.5rem' }}
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="mobile-show">
                {displayTrades.map((trade) => {
                  const isForex = FOREX_BROKERS.includes(trade.broker) || FOREX_SEGMENTS.includes(trade.segment);
                  const isProfit = parseFloat(trade.profit_loss) > 0;
                  return (
                    <div key={trade.id} className="trade-card-mobile">
                      <div className="row">
                        <span className="label">Date</span>
                        <span className="value" style={{ color: 'rgba(255,255,255,0.8)' }}>{formatDate(trade.date)}</span>
                      </div>
                      <div className="row">
                        <span className="label">Market</span>
                        <span className="value" style={{ color: isForex ? '#FBBF24' : '#6EE7B7' }}>
                          {isForex ? '🌍 Forex' : '🇮🇳 Indian'}
                        </span>
                      </div>
                      <div className="row">
                        <span className="label">Name</span>
                        <span className="value" style={{ color: 'white' }}>{trade.name}</span>
                      </div>
                      <div className="row">
                        <span className="label">Broker</span>
                        <span className="value" style={{ color: 'rgba(255,255,255,0.6)' }}>{trade.broker}</span>
                      </div>
                      <div className="row">
                        <span className="label">Segment</span>
                        <span className="value" style={{ color: 'rgba(255,255,255,0.6)' }}>{trade.segment}</span>
                      </div>
                      <div className="row">
                        <span className="label">Type</span>
                        <span className="value" style={{ color: trade.type === 'Buy' ? '#6EE7B7' : '#FCA5A5' }}>{trade.type}</span>
                      </div>
                      <div className="row">
                        <span className="label">Lot / Entry / Exit</span>
                        <span className="value" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {formatNumber(trade.quantity)} / {formatCurrency(trade.entry_price, isForex)} / {formatCurrency(trade.exit_price, isForex)}
                        </span>
                      </div>
                      <div className="row">
                        <span className="label">Gross / Brokerage / Net</span>
                        <span className="value" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {formatCurrency(trade.gross_profit_loss || trade.profit_loss, isForex)} / {formatCurrency(trade.brokerage || 0, isForex)} / 
                          <span className="net-pnl-inline" style={{ color: isProfit ? '#6EE7B7' : '#FCA5A5' }}>
                            {formatCurrency(trade.profit_loss, isForex)}
                          </span>
                        </span>
                      </div>
                      <div className="row">
                        <span className="label">Status</span>
                        <span className="value" style={{ color: isProfit ? '#6EE7B7' : '#FCA5A5' }}>{isProfit ? 'Profit' : 'Loss'}</span>
                      </div>
                      {trade.notes && (
                        <div className="row">
                          <span className="label">Notes</span>
                          <span className="value" style={{ color: 'rgba(255,255,255,0.6)' }}>{trade.notes}</span>
                        </div>
                      )}
                      <div className="row" style={{ marginTop: '0.2rem', paddingTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            className="glass-btn" 
                            onClick={() => handleEdit(trade)}
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}
                          >
                            <Edit2 size={10} /> Edit
                          </button>
                          <button 
                            className="glass-btn danger" 
                            onClick={() => deleteTrade(trade.id)}
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}
                          >
                            <Trash2 size={10} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>
              <Activity size={30} style={{ margin: '0 auto 0.3rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.75rem' }}>No trades found for this period</p>
              <p style={{ fontSize: '0.6rem', marginTop: '0.2rem' }}>Click "Add Trade" to start tracking</p>
            </div>
          )}
        </div>

        {/* =============================================
            ADD/EDIT MODAL
        ============================================= */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                <X size={18} />
              </button>
              
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>
                {editingTrade ? 'Edit Trade' : 'Add Trade'}
              </h2>

              {/* Market Type Selector */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button 
                  className={`glass-btn ${formData.marketType === 'indian' ? 'success' : ''}`}
                  onClick={() => handleMarketTypeChange('indian')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  🇮🇳 Indian
                </button>
                <button 
                  className={`glass-btn ${formData.marketType === 'forex' ? 'primary' : ''}`}
                  onClick={() => handleMarketTypeChange('forex')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  🌍 Forex
                </button>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input 
                    className="edit-input" 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Broker</label>
                  <select 
                    className="edit-select" 
                    value={formData.broker} 
                    onChange={(e) => setFormData({...formData, broker: e.target.value})}
                  >
                    {formData.marketType === 'indian' 
                      ? indianBrokers.map(b => <option key={b} value={b}>{b}</option>)
                      : forexBrokers.map(b => <option key={b} value={b}>{b}</option>)
                    }
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Segment</label>
                  <select 
                    className="edit-select" 
                    value={formData.segment} 
                    onChange={(e) => setFormData({...formData, segment: e.target.value})}
                  >
                    {(formData.marketType === 'indian' ? indianSegments : forexSegments).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Trade Name</label>
                  <input 
                    className="edit-input" 
                    type="text" 
                    placeholder={formData.marketType === 'indian' ? "e.g. RELIANCE, NIFTY" : "e.g. EURUSD, GOLD"} 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select 
                    className="edit-select" 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    {tradeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Lot Size</label>
                  <input 
                    className="edit-input" 
                    type="text" 
                    inputMode="decimal"
                    placeholder={formData.marketType === 'indian' ? "Enter lot size" : "Enter lot size (0.01)"} 
                    value={formData.lotSize} 
                    onChange={(e) => handleNumberChange('lotSize', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Entry Price</label>
                  <input 
                    className="edit-input" 
                    type="text" 
                    inputMode="decimal"
                    placeholder="Enter entry price" 
                    value={formData.entryPrice} 
                    onChange={(e) => handleNumberChange('entryPrice', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Exit Price</label>
                  <input 
                    className="edit-input" 
                    type="text" 
                    inputMode="decimal"
                    placeholder="Enter exit price" 
                    value={formData.exitPrice} 
                    onChange={(e) => handleNumberChange('exitPrice', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Brokerage</label>
                  <input 
                    className="edit-input" 
                    type="text" 
                    inputMode="decimal"
                    placeholder={formData.marketType === 'indian' ? "Enter brokerage (₹)" : "Enter brokerage ($)"} 
                    value={formData.brokerage} 
                    onChange={(e) => handleNumberChange('brokerage', e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="edit-select" 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {tradeStatus.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Notes (optional)</label>
                  <input 
                    className="edit-input" 
                    type="text" 
                    placeholder="Add notes..." 
                    value={formData.notes} 
                    onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="cancel-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                <button className="save-btn" onClick={editingTrade ? updateTrade : addTrade} disabled={saving}>
                  {saving ? 'Saving...' : (editingTrade ? 'Update' : 'Add')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default Trading;