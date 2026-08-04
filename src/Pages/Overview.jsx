import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, Activity,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Calendar,
  Target, Zap, Star, Trophy, AlertTriangle, Clock, Filter,
  Download, Share2, MoreVertical, Eye, EyeOff, RefreshCw,
  IndianRupee, Banknote, LineChart, CandlestickChart, Wallet,
  CreditCard, Fuel, PiggyBank, HandCoins, Building2, Landmark,
  Receipt, BanknoteIcon, Plus, Minus, CheckCircle, XCircle,
  Clock as ClockIcon, Users, ShoppingBag, Truck, Home,
  Car, Utensils, Music, Film, Coffee, Gift, Heart, Edit2, Save, X,
  ChevronDown, ChevronUp
} from 'lucide-react';

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Get current month as default
  const getCurrentMonth = () => {
    const months = ['January 2024', 'February 2024', 'March 2024', 'April 2024', 'May 2024', 'June 2024', 'July 2024', 'August 2024', 'September 2024', 'October 2024', 'November 2024', 'December 2024'];
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthStr = `${months[month]} ${year}`;
    return monthStr;
  };
  
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeButton, setActiveButton] = useState(null);
  const [overviewId, setOverviewId] = useState(null);
  const [userId] = useState(1);
  
  // Section-wise editing
  const [editingSection, setEditingSection] = useState(null);
  const sectionRefs = useRef({});

  // =============================================
  // FORMAT FUNCTIONS - Clean number display
  // =============================================
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    const num = parseFloat(amount);
    if (Number.isInteger(num)) {
      return `₹${num.toLocaleString('en-IN')}`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return parseFloat(num).toLocaleString('en-IN');
  };

  const formatCompactCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    const num = parseFloat(amount);
    if (Number.isInteger(num)) {
      return `₹${num.toLocaleString('en-IN')}`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // =============================================
  // STATE FOR ALL DATA
  // =============================================
  const [financialReview, setFinancialReview] = useState({
    totalBusiness: 2,
    totalWorks: 1,
    totalBusinessPayment: 8942000,
    totalWorkPayment: 1247000
  });

  const [paymentExpenses, setPaymentExpenses] = useState({
    totalPayment: 1875000,
    totalExpenses: 842300,
    petrolExpense: 125800,
    otherExpense: 7900
  });

  const [borrowData, setBorrowData] = useState({
    totalBorrow: 550000,
    totalLoans: 1280000,
    totalSavings: 420000,
    totalRemainingPayment: 860000
  });

  // Portfolio Distribution - All time totals
  const [portfolioData, setPortfolioData] = useState({
    totalBorrow: 550000,
    totalPaid: 420000,
    totalWork: 1247000,
    totalBusiness: 8942000,
    totalExpense: 842300,
    totalIncome: 10189000,
    netProfit: 9346700
  });

  // Monthly Performance - Current month
  const [monthlyPerformance, setMonthlyPerformance] = useState({
    totalWork: 1247,
    businessPayment: 8942000,
    totalExpense: 842300,
    totalBorrow: 550000,
    otherExpense: 125800,
    totalBalance: 2530000,
    netProfit: 9346700,
    profitLoss: '+32.1%'
  });

  // All Months Data for Bar Chart
  const [allMonthsData, setAllMonthsData] = useState([
    { month: 'Jan', profit: 125000, loss: 25000, net: 100000 },
    { month: 'Feb', profit: 95000, loss: 45000, net: 50000 },
    { month: 'Mar', profit: 210000, loss: 30000, net: 180000 },
    { month: 'Apr', profit: 185000, loss: 55000, net: 130000 },
    { month: 'May', profit: 285000, loss: 15000, net: 270000 },
    { month: 'Jun', profit: 150000, loss: 40000, net: 110000 },
    { month: 'Jul', profit: 320000, loss: 20000, net: 300000 },
    { month: 'Aug', profit: 280000, loss: 35000, net: 245000 },
    { month: 'Sep', profit: 190000, loss: 28000, net: 162000 },
    { month: 'Oct', profit: 230000, loss: 32000, net: 198000 },
    { month: 'Nov', profit: 260000, loss: 18000, net: 242000 },
    { month: 'Dec', profit: 310000, loss: 22000, net: 288000 }
  ]);

  const [monthlyExpenses, setMonthlyExpenses] = useState({
    'July 2024': {
      totalExpense: 28500,
      petrol: 5200,
      food: 3800,
      shopping: 4500,
      transport: 2200,
      utilities: 3100,
      entertainment: 1800,
      other: 7900
    },
    'August 2024': {
      totalExpense: 32000,
      petrol: 5800,
      food: 4200,
      shopping: 5100,
      transport: 2500,
      utilities: 3400,
      entertainment: 2100,
      other: 8900
    }
  });

  const [productsBought, setProductsBought] = useState([
    { name: 'Laptop', price: 45000, date: '20 July 2024', category: 'Electronics' },
    { name: 'Office Chair', price: 8500, date: '15 July 2024', category: 'Furniture' },
    { name: 'Desk Lamp', price: 1200, date: '10 July 2024', category: 'Accessories' },
  ]);

  // =============================================
  // FETCH DATA
  // =============================================
  useEffect(() => {
    fetchOverviewData();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Update monthly performance when values change
  useEffect(() => {
    updateMonthlyPerformance();
  }, [financialReview, paymentExpenses, borrowData, selectedMonth]);

  const updateMonthlyPerformance = () => {
    const totalIncome = financialReview.totalBusinessPayment + financialReview.totalWorkPayment;
    const totalExpense = paymentExpenses.totalExpenses + paymentExpenses.petrolExpense + paymentExpenses.otherExpense;
    const netProfit = totalIncome - totalExpense - borrowData.totalBorrow;
    const profitLossPercent = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;

    setMonthlyPerformance({
      totalWork: financialReview.totalWorks,
      businessPayment: financialReview.totalBusinessPayment,
      totalExpense: totalExpense,
      totalBorrow: borrowData.totalBorrow,
      otherExpense: paymentExpenses.otherExpense,
      totalBalance: financialReview.totalBusinessPayment + financialReview.totalWorkPayment - totalExpense,
      netProfit: netProfit,
      profitLoss: `${profitLossPercent >= 0 ? '+' : ''}${profitLossPercent}%`
    });

    // Update portfolio data
    setPortfolioData({
      totalBorrow: borrowData.totalBorrow,
      totalPaid: borrowData.totalSavings,
      totalWork: financialReview.totalWorkPayment,
      totalBusiness: financialReview.totalBusinessPayment,
      totalExpense: totalExpense,
      totalIncome: totalIncome,
      netProfit: netProfit
    });
  };

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/personal-overview/user/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        setOverviewId(data.id);
        
        setFinancialReview({
          totalBusiness: data.total_business || 0,
          totalWorks: data.total_works || 0,
          totalBusinessPayment: parseFloat(data.total_business_payment) || 0,
          totalWorkPayment: parseFloat(data.total_work_payment) || 0
        });

        setPaymentExpenses({
          totalPayment: parseFloat(data.total_payment) || 0,
          totalExpenses: parseFloat(data.total_expenses) || 0,
          petrolExpense: parseFloat(data.petrol_expense) || 0,
          otherExpense: parseFloat(data.other_expense) || 0
        });

        setBorrowData({
          totalBorrow: parseFloat(data.total_borrow) || 0,
          totalLoans: parseFloat(data.total_loans) || 0,
          totalSavings: parseFloat(data.total_savings) || 0,
          totalRemainingPayment: parseFloat(data.remaining_payment) || 0
        });

        if (data.month_year) setSelectedMonth(data.month_year);
        if (data.monthly_expenses) {
          try {
            const parsed = typeof data.monthly_expenses === 'string' ? JSON.parse(data.monthly_expenses) : data.monthly_expenses;
            setMonthlyExpenses(parsed);
          } catch (e) {}
        }
        if (data.products_data) {
          try {
            const parsed = typeof data.products_data === 'string' ? JSON.parse(data.products_data) : data.products_data;
            if (parsed.length) setProductsBought(parsed);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
      setError('Failed to load data. Using default values.');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // SAVE SECTION DATA
  // =============================================
  const saveSectionData = async (section) => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        user_id: userId,
        total_business: financialReview.totalBusiness,
        total_works: financialReview.totalWorks,
        total_business_payment: financialReview.totalBusinessPayment,
        total_work_payment: financialReview.totalWorkPayment,
        total_payment: paymentExpenses.totalPayment,
        total_expenses: paymentExpenses.totalExpenses,
        petrol_expense: paymentExpenses.petrolExpense,
        other_expense: paymentExpenses.otherExpense,
        total_borrow: borrowData.totalBorrow,
        total_loans: borrowData.totalLoans,
        total_savings: borrowData.totalSavings,
        remaining_payment: borrowData.totalRemainingPayment,
        month_year: selectedMonth,
        monthly_expenses: monthlyExpenses,
        products_data: productsBought,
        top_performers: {
          biggestExpense: getTopPerformers().biggestExpense,
          biggestSaving: getTopPerformers().biggestSaving,
          pendingAmount: getTopPerformers().pendingAmount,
          duePayment: getTopPerformers().duePayment
        }
      };

      let response;
      let url;

      if (overviewId) {
        url = `http://localhost:5000/api/personal-overview/update/${overviewId}`;
        response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        url = 'http://localhost:5000/api/personal-overview/add';
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        if (result.data) setOverviewId(result.data.id);
        setSuccessMessage(`✅ ${section} saved successfully!`);
        setEditingSection(null);
        updateMonthlyPerformance();
      } else {
        throw new Error(result.message || 'Failed to save');
      }
    } catch (err) {
      console.error('Error saving:', err);
      setError(err.message || 'Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  // =============================================
  // SECTION EDIT TOGGLE
  // =============================================
  const toggleSectionEdit = (section) => {
    if (editingSection === section) {
      setEditingSection(null);
    } else {
      setEditingSection(section);
      setTimeout(() => {
        if (sectionRefs.current[section]) {
          sectionRefs.current[section].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  };

  // =============================================
  // TOP PERFORMERS
  // =============================================
  const getTopPerformers = () => {
    const currentMonthData = monthlyExpenses[selectedMonth] || monthlyExpenses['July 2024'];
    const categories = [
      { name: 'Petrol', amount: currentMonthData.petrol || 0 },
      { name: 'Food', amount: currentMonthData.food || 0 },
      { name: 'Shopping', amount: currentMonthData.shopping || 0 },
      { name: 'Transport', amount: currentMonthData.transport || 0 },
      { name: 'Utilities', amount: currentMonthData.utilities || 0 },
      { name: 'Entertainment', amount: currentMonthData.entertainment || 0 },
      { name: 'Other', amount: currentMonthData.other || 0 }
    ];
    
    const biggest = categories.reduce((max, cat) => cat.amount > max.amount ? cat : max, categories[0]);
    const totalExpense = currentMonthData.totalExpense || 0;
    const savings = Math.max(0, 50000 - totalExpense);
    const pendingTotal = 0;
    const dueTotal = 0;
    
    return {
      biggestExpense: `${biggest.name} - ₹${formatNumber(biggest.amount)}`,
      biggestSaving: `Saved ₹${formatNumber(savings)} this month`,
      pendingAmount: `₹${formatNumber(pendingTotal)} pending from 0 people`,
      duePayment: `₹${formatNumber(dueTotal)} due to pay`
    };
  };

  const topPerformers = getTopPerformers();

  // =============================================
  // EXPENSE CATEGORIES
  // =============================================
  const getExpenseCategories = () => {
    const currentMonthData = monthlyExpenses[selectedMonth] || monthlyExpenses['July 2024'];
    return [
      { name: 'Petrol', amount: currentMonthData.petrol || 0, icon: Fuel, color: '#F59E0B' },
      { name: 'Food', amount: currentMonthData.food || 0, icon: Utensils, color: '#10B981' },
      { name: 'Shopping', amount: currentMonthData.shopping || 0, icon: ShoppingBag, color: '#7C3AED' },
      { name: 'Transport', amount: currentMonthData.transport || 0, icon: Truck, color: '#4F6BFF' },
      { name: 'Utilities', amount: currentMonthData.utilities || 0, icon: Home, color: '#2EA8FF' },
      { name: 'Entertainment', amount: currentMonthData.entertainment || 0, icon: Film, color: '#F43F5E' },
      { name: 'Other', amount: currentMonthData.other || 0, icon: Coffee, color: '#8B5CF6' },
    ];
  };

  const expenseCategories = getExpenseCategories();

  // =============================================
  // EDIT HANDLERS
  // =============================================
  const handleFinancialReviewChange = (field, value) => {
    setFinancialReview(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handlePaymentExpensesChange = (field, value) => {
    setPaymentExpenses(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleBorrowDataChange = (field, value) => {
    setBorrowData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handlePortfolioChange = (field, value) => {
    setPortfolioData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleMonthlyPerformanceChange = (field, value) => {
    setMonthlyPerformance(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...productsBought];
    updated[index] = { ...updated[index], [field]: value };
    setProductsBought(updated);
  };

  const handleMonthlyExpenseChange = (category, value) => {
    const newExpenses = { ...monthlyExpenses };
    if (newExpenses[selectedMonth]) {
      newExpenses[selectedMonth][category] = parseFloat(value) || 0;
      const totals = newExpenses[selectedMonth];
      newExpenses[selectedMonth].totalExpense = 
        (totals.petrol || 0) + (totals.food || 0) + (totals.shopping || 0) + 
        (totals.transport || 0) + (totals.utilities || 0) + (totals.entertainment || 0) + 
        (totals.other || 0);
      setMonthlyExpenses(newExpenses);
    }
  };

  // =============================================
  // PIE CHART DATA - All Time Totals
  // =============================================
  const pieChartData = [
    { label: 'Total Borrow', value: portfolioData.totalBorrow, color: '#F43F5E', amount: `₹${formatNumber(portfolioData.totalBorrow)}` },
    { label: 'Total Paid', value: portfolioData.totalPaid, color: '#10B981', amount: `₹${formatNumber(portfolioData.totalPaid)}` },
    { label: 'Total Work', value: portfolioData.totalWork, color: '#7C3AED', amount: `₹${formatNumber(portfolioData.totalWork)}` },
    { label: 'Total Business', value: portfolioData.totalBusiness, color: '#4F6BFF', amount: `₹${formatNumber(portfolioData.totalBusiness)}` },
    { label: 'Total Expense', value: portfolioData.totalExpense, color: '#F59E0B', amount: `₹${formatNumber(portfolioData.totalExpense)}` }
  ];

  const totalPie = pieChartData.reduce((sum, item) => sum + item.value, 0);
  let cumulativeAngle = 0;
  const pieSegments = pieChartData.map(item => {
    const angle = (item.value / totalPie) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...item, startAngle, angle };
  });

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

  // =============================================
  // BAR CHART DATA - Monthly Performance
  // =============================================
  const maxBarValue = Math.max(...allMonthsData.map(d => Math.max(d.profit, d.loss, d.net)));

  const months = ['January 2024', 'February 2024', 'March 2024', 'April 2024', 'May 2024', 'June 2024', 'July 2024', 'August 2024', 'September 2024', 'October 2024', 'November 2024', 'December 2024'];

  const handleButtonClick = (name) => {
    setActiveButton(name);
    setTimeout(() => setActiveButton(null), 300);
  };

  // =============================================
  // SECTION HEADER COMPONENT
  // =============================================
  const SectionHeader = ({ title, icon, section, onEdit, isEditing, onSave, onCancel, saving }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.5rem',
      marginBottom: '1rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)'
    }}>
      <h3 style={{ 
        fontSize: '0.9rem', 
        fontWeight: '700', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        color: '#A78BFA'
      }}>
        {icon} {title}
      </h3>
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        {isEditing ? (
          <>
            <button 
              className="glass-btn" 
              onClick={onSave}
              disabled={saving}
              style={{
                background: 'rgba(16,185,129,0.15)',
                borderColor: 'rgba(16,185,129,0.3)',
                color: '#6EE7B7',
                padding: '0.25rem 0.6rem',
                fontSize: '0.65rem'
              }}
            >
              <Save size={12} /> Save
            </button>
            <button 
              className="glass-btn" 
              onClick={onCancel}
              style={{
                background: 'rgba(239,68,68,0.15)',
                borderColor: 'rgba(239,68,68,0.3)',
                color: '#FCA5A5',
                padding: '0.25rem 0.6rem',
                fontSize: '0.65rem'
              }}
            >
              <X size={12} /> Cancel
            </button>
          </>
        ) : (
          <button 
            className="glass-btn" 
            onClick={onEdit}
            style={{
              background: 'rgba(124,58,237,0.12)',
              borderColor: 'rgba(124,58,237,0.2)',
              color: '#A78BFA',
              padding: '0.25rem 0.6rem',
              fontSize: '0.65rem'
            }}
          >
            <Edit2 size={12} /> Edit
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: '#06060f'
      }}>
        <div style={{ color: '#A78BFA', fontSize: '1.2rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; background: #06060f; color: white; }

        .overview-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #06060f 0%, #0a0a1f 50%, #0f0f2e 100%);
          padding: 1.5rem;
          scroll-behavior: smooth;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          transition: all 0.4s ease;
          padding: 1.25rem;
          scroll-margin-top: 1rem;
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .glass-card.editing {
          border-color: rgba(124,58,237,0.4);
          box-shadow: 0 0 40px rgba(124,58,237,0.1);
        }

        .glass-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .glass-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .glass-btn:active {
          transform: scale(0.95);
        }

        .status-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          font-size: 0.6rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-pending {
          background: rgba(245, 158, 11, 0.15);
          color: #FCD34D;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-received {
          background: rgba(16, 185, 129, 0.15);
          color: #6EE7B7;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .number-box {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.25rem;
          text-align: center;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .number-box:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(124, 58, 237, 0.3);
          box-shadow: 0 12px 30px rgba(124, 58, 237, 0.15);
        }

        .number-box .value {
          font-size: 2.2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #A78BFA, #7C3AED);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .edit-input {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 0.4rem 0.6rem;
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          width: 100%;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.3s ease;
        }

        .edit-input:focus {
          border-color: rgba(124, 58, 237, 0.5);
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .edit-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .progress-bar {
          height: 4px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .progress-bar .fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #7C3AED, #A78BFA);
          transition: width 0.6s ease;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          padding: 0.6rem 0.9rem;
          color: #fca5a5;
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }

        .success-message {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 10px;
          padding: 0.6rem 0.9rem;
          color: #6EE7B7;
          font-size: 0.8rem;
          margin-bottom: 1rem;
          text-align: center;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-in {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }

        .pie-segment { transition: all 0.3s ease; cursor: pointer; }
        .pie-segment:hover { filter: brightness(1.3); }
        .bar-rect { transition: all 0.3s ease; cursor: pointer; }
        .bar-rect:hover { filter: brightness(1.3); }

        @media (max-width: 1024px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
          .overview-container { padding: 1rem; }
          .chart-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 768px) {
          .overview-container { padding: 0.75rem; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; }
          .grid-3 { grid-template-columns: 1fr 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .glass-card { padding: 0.75rem; }
          .number-box .value { font-size: 1.6rem; }
          .number-box { padding: 0.8rem; }
          .chart-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 480px) {
          .overview-container { padding: 0.5rem; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; gap: 0.4rem !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .glass-card { padding: 0.6rem; border-radius: 14px; }
          .number-box { padding: 0.6rem; }
          .number-box .value { font-size: 1.3rem; }
          .status-badge { font-size: 0.5rem; padding: 0.15rem 0.4rem; }
          .edit-input { font-size: 0.7rem; padding: 0.3rem 0.4rem; }
          .chart-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="overview-container" style={{ maxWidth: '1500px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #FFFFFF, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Financial Overview
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>
              Track your business, expenses & performance • Click Edit on any section to modify
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="glass-btn" onClick={() => handleButtonClick('refresh')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="glass-btn" onClick={() => handleButtonClick('download')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* =============================================
            SECTION 1: FINANCIAL REVIEW
            ✅ ADDED: id="financial-review"
        ============================================= */}
        <div 
          id="financial-review"
          ref={el => sectionRefs.current['Financial Review'] = el}
          className={`glass-card ${editingSection === 'Financial Review' ? 'editing' : ''}`}
          style={{ marginBottom: '0.75rem' }}
        >
          <SectionHeader
            title="Financial Review"
            icon={<PieChart size={16} />}
            section="Financial Review"
            isEditing={editingSection === 'Financial Review'}
            onEdit={() => toggleSectionEdit('Financial Review')}
            onSave={() => saveSectionData('Financial Review')}
            onCancel={() => setEditingSection(null)}
            saving={saving}
          />
          
          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            <div className="number-box">
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Total Business</div>
              {editingSection === 'Financial Review' ? (
                <input className="edit-input" type="number" value={financialReview.totalBusiness} onChange={(e) => handleFinancialReviewChange('totalBusiness', e.target.value)} style={{ fontSize: '1.5rem', fontWeight: '800', textAlign: 'center' }} />
              ) : (
                <div className="value">{formatNumber(financialReview.totalBusiness)}</div>
              )}
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>Active Businesses</div>
            </div>
            <div className="number-box">
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Total Works</div>
              {editingSection === 'Financial Review' ? (
                <input className="edit-input" type="number" value={financialReview.totalWorks} onChange={(e) => handleFinancialReviewChange('totalWorks', e.target.value)} style={{ fontSize: '1.5rem', fontWeight: '800', textAlign: 'center' }} />
              ) : (
                <div className="value">{formatNumber(financialReview.totalWorks)}</div>
              )}
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>Ongoing Projects</div>
            </div>
            <div className="number-box">
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Business Payment</div>
              {editingSection === 'Financial Review' ? (
                <input className="edit-input" type="number" value={financialReview.totalBusinessPayment} onChange={(e) => handleFinancialReviewChange('totalBusinessPayment', e.target.value)} style={{ fontSize: '1.5rem', fontWeight: '800', textAlign: 'center' }} />
              ) : (
                <div className="value" style={{ background: 'linear-gradient(135deg, #6EE7B7, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatCurrency(financialReview.totalBusinessPayment)}</div>
              )}
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>Total Received</div>
            </div>
            <div className="number-box">
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Work Payment</div>
              {editingSection === 'Financial Review' ? (
                <input className="edit-input" type="number" value={financialReview.totalWorkPayment} onChange={(e) => handleFinancialReviewChange('totalWorkPayment', e.target.value)} style={{ fontSize: '1.5rem', fontWeight: '800', textAlign: 'center' }} />
              ) : (
                <div className="value" style={{ background: 'linear-gradient(135deg, #FCD34D, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatCurrency(financialReview.totalWorkPayment)}</div>
              )}
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>Total Earned</div>
            </div>
          </div>
        </div>

        {/* =============================================
            SECTION 2: PAYMENT & EXPENSES + BORROW & LOANS
            ✅ ADDED: id="payment-expenses" and id="borrow-loans"
        ============================================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
          
          {/* Payment & Expenses */}
          <div 
            id="payment-expenses"
            ref={el => sectionRefs.current['Payment & Expenses'] = el}
            className={`glass-card ${editingSection === 'Payment & Expenses' ? 'editing' : ''}`}
          >
            <SectionHeader
              title="Payment & Expenses"
              icon={<CreditCard size={16} color="#7C3AED" />}
              section="Payment & Expenses"
              isEditing={editingSection === 'Payment & Expenses'}
              onEdit={() => toggleSectionEdit('Payment & Expenses')}
              onSave={() => saveSectionData('Payment & Expenses')}
              onCancel={() => setEditingSection(null)}
              saving={saving}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div className="number-box" style={{ padding: '0.8rem' }}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Total Payment</div>
                {editingSection === 'Payment & Expenses' ? (
                  <input className="edit-input" type="number" value={paymentExpenses.totalPayment} onChange={(e) => handlePaymentExpensesChange('totalPayment', e.target.value)} style={{ fontSize: '1rem', fontWeight: '800', textAlign: 'center' }} />
                ) : (
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#6EE7B7' }}>{formatCurrency(paymentExpenses.totalPayment)}</div>
                )}
              </div>
              <div className="number-box" style={{ padding: '0.8rem' }}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Total Expenses</div>
                {editingSection === 'Payment & Expenses' ? (
                  <input className="edit-input" type="number" value={paymentExpenses.totalExpenses} onChange={(e) => handlePaymentExpensesChange('totalExpenses', e.target.value)} style={{ fontSize: '1rem', fontWeight: '800', textAlign: 'center' }} />
                ) : (
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FCA5A5' }}>{formatCurrency(paymentExpenses.totalExpenses)}</div>
                )}
              </div>
              <div className="number-box" style={{ padding: '0.8rem' }}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Petrol</div>
                {editingSection === 'Payment & Expenses' ? (
                  <input className="edit-input" type="number" value={paymentExpenses.petrolExpense} onChange={(e) => handlePaymentExpensesChange('petrolExpense', e.target.value)} style={{ fontSize: '1rem', fontWeight: '800', textAlign: 'center' }} />
                ) : (
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FCD34D' }}>{formatCurrency(paymentExpenses.petrolExpense)}</div>
                )}
              </div>
              <div className="number-box" style={{ padding: '0.8rem' }}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Other Expenses</div>
                {editingSection === 'Payment & Expenses' ? (
                  <input className="edit-input" type="number" value={paymentExpenses.otherExpense} onChange={(e) => handlePaymentExpensesChange('otherExpense', e.target.value)} style={{ fontSize: '1rem', fontWeight: '800', textAlign: 'center' }} />
                ) : (
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#A78BFA' }}>{formatCurrency(paymentExpenses.otherExpense)}</div>
                )}
              </div>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.2rem' }}>
                <span>Expense Usage</span>
                <span>{paymentExpenses.totalExpenses > 0 ? '85%' : '0%'}</span>
              </div>
              <div className="progress-bar">
                <div className="fill" style={{ width: paymentExpenses.totalExpenses > 0 ? '85%' : '0%' }} />
              </div>
            </div>
          </div>

          {/* Borrow & Loans */}
          <div 
            id="borrow-loans"
            ref={el => sectionRefs.current['Borrow & Loans'] = el}
            className={`glass-card ${editingSection === 'Borrow & Loans' ? 'editing' : ''}`}
          >
            <SectionHeader
              title="Borrow & Loans"
              icon={<HandCoins size={16} color="#F43F5E" />}
              section="Borrow & Loans"
              isEditing={editingSection === 'Borrow & Loans'}
              onEdit={() => toggleSectionEdit('Borrow & Loans')}
              onSave={() => saveSectionData('Borrow & Loans')}
              onCancel={() => setEditingSection(null)}
              saving={saving}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div className="number-box" style={{ padding: '0.8rem' }}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Total Borrow</div>
                {editingSection === 'Borrow & Loans' ? (
                  <input className="edit-input" type="number" value={borrowData.totalBorrow} onChange={(e) => handleBorrowDataChange('totalBorrow', e.target.value)} style={{ fontSize: '1rem', fontWeight: '800', textAlign: 'center' }} />
                ) : (
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FCA5A5' }}>{formatCurrency(borrowData.totalBorrow)}</div>
                )}
              </div>
              <div className="number-box" style={{ padding: '0.8rem' }}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Total Loans</div>
                {editingSection === 'Borrow & Loans' ? (
                  <input className="edit-input" type="number" value={borrowData.totalLoans} onChange={(e) => handleBorrowDataChange('totalLoans', e.target.value)} style={{ fontSize: '1rem', fontWeight: '800', textAlign: 'center' }} />
                ) : (
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FF5A6E' }}>{formatCurrency(borrowData.totalLoans)}</div>
                )}
              </div>
              <div className="number-box" style={{ padding: '0.8rem' }}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Total Savings</div>
                {editingSection === 'Borrow & Loans' ? (
                  <input className="edit-input" type="number" value={borrowData.totalSavings} onChange={(e) => handleBorrowDataChange('totalSavings', e.target.value)} style={{ fontSize: '1rem', fontWeight: '800', textAlign: 'center' }} />
                ) : (
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#6EE7B7' }}>{formatCurrency(borrowData.totalSavings)}</div>
                )}
              </div>
              <div className="number-box" style={{ padding: '0.8rem' }}>
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Remaining Payment</div>
                {editingSection === 'Borrow & Loans' ? (
                  <input className="edit-input" type="number" value={borrowData.totalRemainingPayment} onChange={(e) => handleBorrowDataChange('totalRemainingPayment', e.target.value)} style={{ fontSize: '1rem', fontWeight: '800', textAlign: 'center' }} />
                ) : (
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FCD34D' }}>{formatCurrency(borrowData.totalRemainingPayment)}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =============================================
            SECTION 3: MONTHLY EXPENSES
            ✅ ADDED: id="monthly-expenses"
        ============================================= */}
        <div 
          id="monthly-expenses"
          ref={el => sectionRefs.current['Monthly Expenses'] = el}
          className={`glass-card ${editingSection === 'Monthly Expenses' ? 'editing' : ''}`}
          style={{ marginBottom: '0.75rem' }}
        >
          <SectionHeader
            title="Monthly Expenses"
            icon={<Calendar size={16} color="#2EA8FF" />}
            section="Monthly Expenses"
            isEditing={editingSection === 'Monthly Expenses'}
            onEdit={() => toggleSectionEdit('Monthly Expenses')}
            onSave={() => saveSectionData('Monthly Expenses')}
            onCancel={() => setEditingSection(null)}
            saving={saving}
          />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                color: 'white',
                padding: '0.3rem 0.8rem',
                fontSize: '0.7rem',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {months.map(month => (
                <option key={month} value={month} style={{ background: '#0a0a1f' }}>{month}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.4rem' }}>
            {expenseCategories.map((cat, i) => (
              <div key={i} className="number-box" style={{ padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <cat.icon size={14} color={cat.color} />
                  <div>
                    <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>{cat.name}</div>
                    {editingSection === 'Monthly Expenses' ? (
                      <input className="edit-input" type="number" value={cat.amount} onChange={(e) => handleMonthlyExpenseChange(cat.name.toLowerCase(), e.target.value)} style={{ fontSize: '0.8rem', fontWeight: '700', textAlign: 'center', width: '70px' }} />
                    ) : (
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>{formatCurrency(cat.amount)}</div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                  {Math.round((cat.amount / monthlyExpenses[selectedMonth]?.totalExpense || 1) * 100)}%
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '0.6rem', padding: '0.6rem', background: 'rgba(124,58,237,0.08)', borderRadius: '10px', border: '1px solid rgba(124,58,237,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Total Month Expense</span>
              <span style={{ fontSize: '1rem', fontWeight: '800', color: '#A78BFA' }}>
                {formatCurrency(monthlyExpenses[selectedMonth]?.totalExpense || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* =============================================
            SECTION 4: TOP PERFORMERS
            ✅ ADDED: id="top-performers"
        ============================================= */}
        <div 
          id="top-performers"
          ref={el => sectionRefs.current['Top Performers'] = el}
          className="glass-card"
          style={{ marginBottom: '0.75rem' }}
        >
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FBBF24' }}>
            <Trophy size={18} /> Top Performers
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
            <div className="number-box" style={{ padding: '0.8rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>💸 Biggest Expense</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#FCA5A5', marginTop: '0.1rem' }}>{topPerformers.biggestExpense}</div>
            </div>
            <div className="number-box" style={{ padding: '0.8rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>💰 Biggest Saving</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6EE7B7', marginTop: '0.1rem' }}>{topPerformers.biggestSaving}</div>
            </div>
            <div className="number-box" style={{ padding: '0.8rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>⏳ Pending Amount</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#FCD34D', marginTop: '0.1rem' }}>{topPerformers.pendingAmount}</div>
            </div>
            <div className="number-box" style={{ padding: '0.8rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>📅 Due Payment</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#FF5A6E', marginTop: '0.1rem' }}>{topPerformers.duePayment}</div>
            </div>
          </div>
        </div>

        {/* =============================================
            SECTION 5: PRODUCTS BOUGHT
            ✅ ADDED: id="products-bought"
        ============================================= */}
        <div 
          id="products-bought"
          ref={el => sectionRefs.current['Products Bought'] = el}
          className={`glass-card ${editingSection === 'Products Bought' ? 'editing' : ''}`}
        >
          <SectionHeader
            title="Products Bought"
            icon={<ShoppingBag size={16} color="#7C3AED" />}
            section="Products Bought"
            isEditing={editingSection === 'Products Bought'}
            onEdit={() => toggleSectionEdit('Products Bought')}
            onSave={() => saveSectionData('Products Bought')}
            onCancel={() => setEditingSection(null)}
            saving={saving}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem' }}>
            {productsBought.map((product, index) => (
              <div key={index} className="number-box" style={{ padding: '0.8rem', textAlign: 'left' }}>
                {editingSection === 'Products Bought' ? (
                  <>
                    <input className="edit-input" value={product.name} onChange={(e) => handleProductChange(index, 'name', e.target.value)} style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }} placeholder="Product" />
                    <input className="edit-input" type="number" value={product.price} onChange={(e) => handleProductChange(index, 'price', parseFloat(e.target.value))} style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }} placeholder="Price" />
                    <input className="edit-input" value={product.date} onChange={(e) => handleProductChange(index, 'date', e.target.value)} style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }} placeholder="Date" />
                    <input className="edit-input" value={product.category} onChange={(e) => handleProductChange(index, 'category', e.target.value)} style={{ fontSize: '0.65rem' }} placeholder="Category" />
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'white' }}>{product.name}</div>
                      <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)' }}>{product.category}</div>
                      <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem' }}>📅 {product.date}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#FCD34D' }}>{formatCurrency(product.price)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* =============================================
            CHART SECTION: PIE + BAR
            ✅ ADDED: id="portfolio-distribution" and id="monthly-performance"
        ============================================= */}
        <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
          
          {/* Portfolio Distribution - Pie Chart (All Time) */}
          <div 
            id="portfolio-distribution"
            className="glass-card"
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7C3AED' }}>
              <PieChart size={18} /> Portfolio Distribution (All Time)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flexShrink: 0 }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  {pieSegments.map((seg, i) => (
                    <path key={i} d={describeArc(70, 70, 60, seg.startAngle, seg.startAngle + seg.angle)} fill={seg.color} className="pie-segment" stroke="#06060f" strokeWidth="2" />
                  ))}
                  <circle cx="70" cy="70" r="35" fill="#06060f" />
                  <text x="70" y="62" textAnchor="middle" fill="white" fontSize="12" fontWeight="800">{formatCurrency(totalPie)}</text>
                  <text x="70" y="78" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontWeight="600">Total</text>
                </svg>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {pieChartData.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${item.color}20` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color }} />
                      <span style={{ fontSize: '0.6rem', fontWeight: '600', color: 'white' }}>{item.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'white' }}>{((item.value / totalPie) * 100).toFixed(1)}%</div>
                      <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)' }}>{item.amount}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar Chart - Monthly Performance */}
          <div 
            id="monthly-performance"
            className="glass-card"
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4F6BFF' }}>
              <BarChart3 size={18} /> Monthly Performance
            </h3>
            <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((line, i) => (
                  <line key={i} x1="40" y1={170 - (line / 100) * 140} x2="580" y2={170 - (line / 100) * 140} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                {/* Bars */}
                {allMonthsData.map((item, i) => {
                  const maxVal = Math.max(...allMonthsData.map(d => d.net));
                  const barH = (item.net / maxVal) * 130;
                  const x = 50 + i * 45;
                  const y = 170 - barH;
                  const color = item.net >= 0 ? '#10B981' : '#F43F5E';
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width="30" height={barH} rx="4" fill={color} className="bar-rect" opacity="0.85" />
                      <text x={x + 15} y={168} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontWeight="600">{item.month}</text>
                      <text x={x + 15} y={y - 4} textAnchor="middle" fill="white" fontSize="7" fontWeight="700">{formatCurrency(item.net)}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
              <span>📈 Net Profit/Loss by Month</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#10B981' }} /> Profit
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#F43F5E' }} /> Loss
              </span>
            </div>
          </div>
        </div>

        {/* =============================================
            Monthly Performance Summary
            ✅ ADDED: id="monthly-summary"
        ============================================= */}
        <div 
          id="monthly-summary"
          className="glass-card"
          style={{ marginTop: '0.75rem' }}
        >
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#A78BFA' }}>
            <TrendingUp size={18} /> Monthly Performance Summary ({selectedMonth})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
            <div className="number-box" style={{ padding: '0.8rem' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Total Work</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#7C3AED' }}>{formatNumber(monthlyPerformance.totalWork)}</div>
            </div>
            <div className="number-box" style={{ padding: '0.8rem' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Business Payment</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#10B981' }}>{formatCurrency(monthlyPerformance.businessPayment)}</div>
            </div>
            <div className="number-box" style={{ padding: '0.8rem' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Total Expense</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#FCA5A5' }}>{formatCurrency(monthlyPerformance.totalExpense)}</div>
            </div>
            <div className="number-box" style={{ padding: '0.8rem' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Total Borrow</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#FCD34D' }}>{formatCurrency(monthlyPerformance.totalBorrow)}</div>
            </div>
            <div className="number-box" style={{ padding: '0.8rem' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Net Profit</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: monthlyPerformance.netProfit >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
                {formatCurrency(monthlyPerformance.netProfit)}
                <span style={{ fontSize: '0.65rem', marginLeft: '0.3rem', color: monthlyPerformance.netProfit >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
                  {monthlyPerformance.profitLoss}
                </span>
              </div>
            </div>
            <div className="number-box" style={{ padding: '0.8rem' }}>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)' }}>Total Balance</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#6EE7B7' }}>{formatCurrency(monthlyPerformance.totalBalance)}</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Overview;