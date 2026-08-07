import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Briefcase, Activity,
  BarChart3, PieChart, Calendar, Trophy, RefreshCw,
  CreditCard, Fuel, PiggyBank, HandCoins, Building2,
  ShoppingBag, Truck, Home, Car, Utensils, Film, Coffee,
  Edit2, Save, X, Plus, Trash2, Eye, EyeOff, Search,
  Filter, Download, Share2, MoreVertical, Clock, AlertTriangle,
  CheckCircle, XCircle, Users, Wallet, Landmark, Receipt
} from 'lucide-react';

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [messageSection, setMessageSection] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [sectionLoading, setSectionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [noDataMessage, setNoDataMessage] = useState(null);
  
  // =============================================
  // USER & DATE
  // =============================================
  const [userId] = useState(1);
  
  const getCurrentMonth = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };
  
  const getMonthNumber = (monthName) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months.indexOf(monthName.split(' ')[0]) + 1;
  };
  
  const getYear = (monthName) => parseInt(monthName.split(' ')[1]);

  const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatWeekDate = (date) => date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const getWeekRange = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return {
      key: `${toDateKey(start)}_${toDateKey(end)}`,
      start: toDateKey(start),
      end: toDateKey(end),
      label: `${formatWeekDate(start)} to ${formatWeekDate(end)}`
    };
  };

  const getWeeksForMonth = (monthName) => {
    const year = getYear(monthName);
    const monthIndex = getMonthNumber(monthName) - 1;
    const firstSunday = new Date(year, monthIndex, 1);

    while (firstSunday.getDay() !== 0) {
      firstSunday.setDate(firstSunday.getDate() + 1);
    }

    const weeks = [];
    const weekStart = new Date(firstSunday);
    while (weekStart.getMonth() === monthIndex) {
      weeks.push(getWeekRange(weekStart));
      weekStart.setDate(weekStart.getDate() + 7);
    }
    return weeks;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekRange(new Date()));
  const [overviewId, setOverviewId] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const sectionRefs = useRef({});

  // =============================================
  // FORMAT FUNCTIONS
  // =============================================
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return parseFloat(num).toLocaleString('en-IN');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // =============================================
  // STATE - Matches Backend Schema
  // =============================================
  
  // Financial Review
  const [financialReview, setFinancialReview] = useState({
    total_business: 0,
    total_works: 0,
    business_payment: 0,
    work_payment: 0,
    total_payment: 0,
    total_expenses: 0,
    total_borrow: 0,
    total_loans: 0,
    total_savings: 0
  });

  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [expensePieData, setExpensePieData] = useState([]);

  // Loans
  const [loans, setLoans] = useState([]);
  const [totalBorrow, setTotalBorrow] = useState(0);
  const [totalLoans, setTotalLoans] = useState(0);

  // Payments
  const [payments, setPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState(0);

  // Performance
  const [weeklyPerformance, setWeeklyPerformance] = useState(null);
  const [monthlyPerformance, setMonthlyPerformance] = useState(null);

  // Summary
  const [summary, setSummary] = useState(null);
  const [summaryPieData, setSummaryPieData] = useState([]);

  // New Expense Form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseCategoryOpen, setExpenseCategoryOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // New Loan Form
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [newLoan, setNewLoan] = useState({
    name: '',
    amount: '',
    emi: '',
    loan_date: new Date().toISOString().split('T')[0],
    type: 'Borrow',
    notes: ''
  });

  // New Payment Form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [newPayment, setNewPayment] = useState({
    person_name: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'pending'
  });

  // =============================================
  // API BASE URL
  // =============================================
  const API_BASE = 'http://localhost:5000/api/personal-overview';

  // =============================================
  // FETCH ALL DATA
  // =============================================
  useEffect(() => {
    fetchAllData();
  }, [selectedMonth, selectedYear, selectedWeek]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const showSuccess = (section, message) => {
    setError(null);
    setMessageSection(section);
    setSuccessMessage(message);
  };

  const showError = (section, message) => {
    setSuccessMessage(null);
    setMessageSection(section);
    setError(message);
  };

  const askForConfirmation = (section, message, onConfirm) => {
    setConfirmDialog({ section, message, onConfirm });
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    setNoDataMessage(null);

    try {
      const monthNum = getMonthNumber(selectedMonth);
      const year = getYear(selectedMonth);

      await fetchFinancialReview();
      await fetchExpenses(monthNum, year);
      await fetchExpensePie(monthNum, year);
      await fetchLoans(monthNum, year);
      await fetchPayments(monthNum, year);
      await fetchMonthlyPerformance(monthNum, year);
      await fetchWeeklyPerformance(selectedWeek);
      await fetchSummary();
      await fetchSummaryPie();

    } catch (err) {
      console.error('Error fetching data:', err);
      showError('overview', 'Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // API CALLS - NO month/year in payloads
  // =============================================

  // 1. Financial Review
  const fetchFinancialReview = async () => {
    try {
      const response = await fetch(`${API_BASE}/review/${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setFinancialReview(result.data);
          setOverviewId(result.data.id);
        } else {
          setNoDataMessage('No financial data found. Add your first entry!');
        }
      }
    } catch (err) {
      console.error('Fetch review error:', err);
    }
  };

  const saveFinancialReview = async () => {
    try {
      setSaving(true);
      setSectionLoading('overview');
      const payload = {
        user_id: userId,
        total_business: financialReview.total_business || 0,
        total_works: financialReview.total_works || 0,
        business_payment: financialReview.business_payment || 0,
        work_payment: financialReview.work_payment || 0
      };

      const response = await fetch(`${API_BASE}/review/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('overview', 'Financial review saved!');
        setEditingSection(null);
        await fetchAllData();
      }
    } catch (err) {
      showError('overview', 'Failed to save review');
    } finally {
      setSaving(false);
      setSectionLoading(null);
    }
  };

  // 2. Expenses
  const fetchExpenses = async (month, year) => {
    try {
      const response = await fetch(`${API_BASE}/expenses/${userId}?month=${month}&year=${year}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setExpenses(result.data || []);
          setExpenseCategories(result.categoryBreakdown || {});
          if (result.data.length === 0) {
            setNoDataMessage('No expenses found. Add your first expense!');
          }
        }
      }
    } catch (err) {
      console.error('Fetch expenses error:', err);
    }
  };

  const fetchExpensePie = async (month, year) => {
    try {
      const response = await fetch(`${API_BASE}/expenses/pie/${userId}?month=${month}&year=${year}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setExpensePieData(result.data || []);
        }
      }
    } catch (err) {
      console.error('Fetch expense pie error:', err);
    }
  };

  const saveExpense = async () => {
    const isEditing = editingExpenseId !== null;
    if (!newExpense.category || !newExpense.amount) {
      showError('expenses', 'Category and amount are required');
      return;
    }

    try {
      setSaving(true);
      setSectionLoading('expenses');
      const payload = {
        user_id: userId,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        expense_date: newExpense.expense_date,
        notes: newExpense.notes
      };

      const response = await fetch(isEditing ? `${API_BASE}/expenses/update/${editingExpenseId}` : `${API_BASE}/expenses/add`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('expenses', isEditing ? 'Expense updated!' : 'Expense added!');
        setShowExpenseForm(false);
        setEditingExpenseId(null);
        setNewExpense({ category: '', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' });
        await fetchAllData();
      }
    } catch (err) {
      showError('expenses', isEditing ? 'Failed to update expense' : 'Failed to add expense');
    } finally {
      setSaving(false);
      setSectionLoading(null);
    }
  };

  const editExpense = (expense) => {
    setNewExpense({ category: expense.category || '', amount: expense.amount ?? '', expense_date: expense.expense_date || new Date().toISOString().split('T')[0], notes: expense.notes || '' });
    setEditingExpenseId(expense.id);
    setShowExpenseForm(true);
  };

  const cancelExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpenseId(null);
  };

  const deleteExpense = async (id) => {
    askForConfirmation('expenses', 'Delete this expense?', async () => {
      try {
        setSectionLoading('expenses');
        const response = await fetch(`${API_BASE}/expenses/delete/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          showSuccess('expenses', 'Expense deleted!');
          await fetchAllData();
        }
      } catch (err) {
        showError('expenses', 'Failed to delete expense');
      } finally {
        setSectionLoading(null);
      }
    });
  };

  // 3. Loans
  const fetchLoans = async (month, year) => {
    try {
      const response = await fetch(`${API_BASE}/loans/${userId}?month=${month}&year=${year}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLoans(result.data || []);
          setTotalBorrow(result.totalBorrow || 0);
          setTotalLoans(result.totalLoans || 0);
          if (result.data.length === 0) {
            setNoDataMessage('No loans found. Add your first loan!');
          }
        }
      }
    } catch (err) {
      console.error('Fetch loans error:', err);
    }
  };

  const saveLoan = async () => {
    const isEditing = editingLoanId !== null;
    if (!newLoan.name || !newLoan.amount || !newLoan.type) {
      showError('loans', 'Name, amount, and type are required');
      return;
    }

    try {
      setSaving(true);
      setSectionLoading('loans');
      const payload = {
        user_id: userId,
        name: newLoan.name,
        amount: parseFloat(newLoan.amount),
        emi: parseFloat(newLoan.emi) || 0,
        loan_date: newLoan.loan_date,
        type: newLoan.type,
        notes: newLoan.notes
      };

      const response = await fetch(isEditing ? `${API_BASE}/loans/update/${editingLoanId}` : `${API_BASE}/loans/add`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('loans', isEditing ? 'Loan updated!' : `${newLoan.type} added!`);
        setShowLoanForm(false);
        setEditingLoanId(null);
        setNewLoan({ name: '', amount: '', emi: '', loan_date: new Date().toISOString().split('T')[0], type: 'Borrow', notes: '' });
        await fetchAllData();
      }
    } catch (err) {
      showError('loans', isEditing ? 'Failed to update loan' : 'Failed to add loan');
    } finally {
      setSaving(false);
      setSectionLoading(null);
    }
  };

  const editLoan = (loan) => {
    setNewLoan({ name: loan.name || '', amount: loan.amount ?? '', emi: loan.emi ?? '', loan_date: loan.loan_date || new Date().toISOString().split('T')[0], type: loan.type || 'Borrow', notes: loan.notes || '' });
    setEditingLoanId(loan.id);
    setShowLoanForm(true);
  };

  const cancelLoanForm = () => {
    setShowLoanForm(false);
    setEditingLoanId(null);
  };

  const deleteLoan = async (id) => {
    askForConfirmation('loans', 'Delete this loan record?', async () => {
      try {
        setSectionLoading('loans');
        const response = await fetch(`${API_BASE}/loans/delete/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          showSuccess('loans', 'Loan deleted!');
          await fetchAllData();
        }
      } catch (err) {
        showError('loans', 'Failed to delete loan');
      } finally {
        setSectionLoading(null);
      }
    });
  };

  // 4. Payments
  const fetchPayments = async (month, year) => {
    try {
      const response = await fetch(`${API_BASE}/payments/${userId}?month=${month}&year=${year}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPayments(result.data || []);
          setPendingPayments(result.totalPending || 0);
          if (result.data.length === 0) {
            setNoDataMessage('No payments found. Add your first payment!');
          }
        }
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
    }
  };

  const savePayment = async () => {
    const isEditing = editingPaymentId !== null;
    if (!newPayment.person_name || !newPayment.amount) {
      showError('payments', 'Person name and amount are required');
      return;
    }

    try {
      setSaving(true);
      setSectionLoading('payments');
      const payload = {
        user_id: userId,
        person_name: newPayment.person_name,
        amount: parseFloat(newPayment.amount),
        payment_date: newPayment.payment_date,
        notes: newPayment.notes,
        status: newPayment.status
      };

      const response = await fetch(isEditing ? `${API_BASE}/payments/update/${editingPaymentId}` : `${API_BASE}/payments/add`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('payments', isEditing ? 'Payment updated!' : 'Payment added!');
        setShowPaymentForm(false);
        setEditingPaymentId(null);
        setNewPayment({ person_name: '', amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '', status: 'pending' });
        await fetchAllData();
      }
    } catch (err) {
      showError('payments', isEditing ? 'Failed to update payment' : 'Failed to add payment');
    } finally {
      setSaving(false);
      setSectionLoading(null);
    }
  };

  const editPayment = (payment) => {
    setNewPayment({ person_name: payment.person_name || '', amount: payment.amount ?? '', payment_date: payment.payment_date || new Date().toISOString().split('T')[0], notes: payment.notes || '', status: payment.status || 'pending' });
    setEditingPaymentId(payment.id);
    setShowPaymentForm(true);
  };

  const cancelPaymentForm = () => {
    setShowPaymentForm(false);
    setEditingPaymentId(null);
  };

  const updatePaymentStatus = async (id, status) => {
    try {
      setSectionLoading('payments');
      const response = await fetch(`${API_BASE}/payments/status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (result.success) {
        showSuccess('payments', 'Payment status updated!');
        await fetchAllData();
      }
    } catch (err) {
      showError('payments', 'Failed to update payment status');
    } finally {
      setSectionLoading(null);
    }
  };

  const deletePayment = async (id) => {
    askForConfirmation('payments', 'Delete this payment record?', async () => {
      try {
        setSectionLoading('payments');
        const response = await fetch(`${API_BASE}/payments/delete/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          showSuccess('payments', 'Payment deleted!');
          await fetchAllData();
        }
      } catch (err) {
        showError('payments', 'Failed to delete payment');
      } finally {
        setSectionLoading(null);
      }
    });
  };

  // 5. Performance
  const fetchWeeklyPerformance = async (week) => {
    try {
      setWeeklyPerformance(null);
      const params = new URLSearchParams({
        week_start: week.start,
        week_end: week.end
      });
      const response = await fetch(`${API_BASE}/performance/weekly/${userId}?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWeeklyPerformance(result.data || null);
        }
      }
    } catch (err) {
      console.error('Fetch weekly performance error:', err);
    }
  };

  const fetchMonthlyPerformance = async (month, year) => {
    try {
      const response = await fetch(`${API_BASE}/performance/monthly/${userId}?month=${month}&year=${year}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMonthlyPerformance(result.data);
        }
      }
    } catch (err) {
      console.error('Fetch monthly performance error:', err);
    }
  };

  // 6. Summary
  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/summary/${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSummary(result.data);
        }
      }
    } catch (err) {
      console.error('Fetch summary error:', err);
    }
  };

  const fetchSummaryPie = async () => {
    try {
      const response = await fetch(`${API_BASE}/summary/pie/${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSummaryPieData(result.data || []);
        }
      }
    } catch (err) {
      console.error('Fetch summary pie error:', err);
    }
  };

  // =============================================
  // HANDLE CHANGES
  // =============================================
  const handleFinancialChange = (field, value) => {
    if (value === '') {
      setFinancialReview(prev => ({ ...prev, [field]: '' }));
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setFinancialReview(prev => ({ ...prev, [field]: num }));
      }
    }
  };

  const handleExpenseChange = (field, value) => {
    setNewExpense(prev => ({ ...prev, [field]: value }));
  };

  const getExpenseCategoryOptions = () => {
    const savedCategories = Object.keys(expenseCategories || {});
    const defaultCategories = ['Petrol', 'Food', 'Travel', 'Shopping', 'Utilities', 'Entertainment', 'Other'];
    return [...new Set([...savedCategories, ...defaultCategories])];
  };

  const handleLoanChange = (field, value) => {
    setNewLoan(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field, value) => {
    setNewPayment(prev => ({ ...prev, [field]: value }));
  };

  // =============================================
  // SECTION HEADER
  // =============================================
  const SectionHeader = ({ title, icon, onEdit, isEditing, onSave, onCancel, saving, onAdd }) => (
    <div className="section-header">
      <h3>{icon} {title}</h3>
      <div className="section-actions">
        {onAdd && !isEditing && (
          <button className="btn-glass btn-add" onClick={onAdd}>
            <Plus size={14} /> Add
          </button>
        )}
        {isEditing ? (
          <>
            <button className="btn-glass btn-save" onClick={onSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn-glass btn-cancel" onClick={onCancel}>
              <X size={14} /> Cancel
            </button>
          </>
        ) : onEdit ? (
          <button className="btn-glass btn-edit" onClick={onEdit}>
            <Edit2 size={14} /> Edit
          </button>
        ) : null}
      </div>
    </div>
  );

  const renderSectionFeedback = (section) => (
    <>
      {sectionLoading === section && (
        <div className="section-loading" role="status" aria-live="polite">
          <span className="section-spinner"></span>
          <span>Processing...</span>
        </div>
      )}
      {messageSection === section && error && <div className="section-feedback error-feedback">⚠️ {error}</div>}
      {messageSection === section && successMessage && <div className="section-feedback success-feedback">✅ {successMessage}</div>}
      {confirmDialog?.section === section && (
        <div className="section-confirm-backdrop">
          <div className="section-confirm-dialog">
            <AlertTriangle size={22} color="#FCD34D" />
            <p>{confirmDialog.message}</p>
            <div className="section-confirm-actions">
              <button className="btn-glass btn-danger" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="btn-glass btn-save" onClick={async () => {
                const action = confirmDialog.onConfirm;
                setConfirmDialog(null);
                await action();
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // =============================================
  // PIE CHART COMPONENT
  // =============================================
  const PieChartComponent = ({ data, total, colors }) => {
    const totalValue = total || data.reduce((sum, d) => sum + d.amount, 0);
    if (!data || data.length === 0) {
      return <div className="empty-chart">📊 No data available</div>;
    }

    let cumulativeAngle = 0;
    const pieSegments = data.map((item, index) => {
      const angle = (item.amount / totalValue) * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angle;
      return { ...item, startAngle, angle, color: colors?.[index] || '#7C3AED' };
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

    return (
      <div className="pie-chart-container">
        <div className="pie-chart">
          <svg width="180" height="180" viewBox="0 0 180 180">
            {pieSegments.map((seg, i) => (
              <path 
                key={i} 
                d={describeArc(90, 90, 75, seg.startAngle, seg.startAngle + seg.angle)} 
                fill={seg.color} 
                className="pie-segment"
                stroke="#06060f" 
                strokeWidth="2"
              />
            ))}
            <circle cx="90" cy="90" r="40" fill="#06060f" />
            <text x="90" y="85" textAnchor="middle" fill="white" fontSize="14" fontWeight="800">
              {formatCurrency(totalValue)}
            </text>
            <text x="90" y="102" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontWeight="600">
              Total
            </text>
          </svg>
        </div>
        <div className="pie-legend">
          {pieSegments.map((item, i) => (
            <div key={i} className="legend-item">
              <span className="legend-color" style={{ background: item.color }}></span>
              <span className="legend-label">{item.category || item.label}</span>
              <span className="legend-value">{formatCurrency(item.amount)}</span>
              <span className="legend-percentage">{item.percentage || Math.round((item.amount / totalValue) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =============================================
  // NO DATA COMPONENT
  // =============================================
  const NoDataMessage = ({ message }) => (
    <div className="no-data-container">
      <div className="no-data-icon">📋</div>
      <p className="no-data-text">{message || 'No data found. Start adding your financial records!'}</p>
    </div>
  );

  // =============================================
  // RENDER
  // =============================================
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your financial data...</p>
      </div>
    );
  }

  const allTimeSummary = summary?.summary || {};
  const allTimeIncome = Number(allTimeSummary.totalIncome) || 0;
  const allTimeExpenses = Number(allTimeSummary.totalExpenses) || 0;
  const netTotalSavings = allTimeIncome - allTimeExpenses;
  const selectedMonthIncome = Number(monthlyPerformance?.totalIncome) || 0;
  const selectedMonthExpenses = Number(monthlyPerformance?.totalExpenses) || expenses.reduce((total, expense) => total + (Number(expense.amount) || 0), 0);
  const selectedMonthSavings = Number(monthlyPerformance?.totalSavings) || 0;
  const selectedMonthBorrow = Number(monthlyPerformance?.totalBorrow) || totalBorrow;
  const selectedMonthLoanEmi = loans
    .filter(loan => String(loan.type).toLowerCase() === 'loan')
    .reduce((total, loan) => total + (Number(loan.emi) || 0), 0);

  return (
    <div className="overview-container">
      <style>{`
        /* ============================================
           GLOBAL STYLES
           ============================================ */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .overview-container {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          background: linear-gradient(135deg, #11152b 0%, #181b3a 48%, #20224a 100%);
          padding: 20px;
          color: #ffffff;
        }

        /* ============================================
           LOADING
           ============================================ */
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #06060f;
          gap: 1rem;
        }
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(124,58,237,0.2);
          border-top-color: #7C3AED;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ============================================
           HEADER
           ============================================ */
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .app-header h1 {
          font-size: clamp(1.2rem, 4vw, 1.8rem);
          font-weight: 800;
          background: linear-gradient(135deg, #FFFFFF, #A78BFA);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .app-header p {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
          margin-top: 0.2rem;
        }
        .header-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        /* ============================================
           BUTTONS - Glass Effect
           ============================================ */
        .btn-glass {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 10px;
          color: #fff;
          padding: 0.4rem 0.8rem;
          font-size: 0.7rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          min-height: 32px;
          justify-content: center;
          white-space: nowrap;
        }
        .btn-glass:hover {
          background: rgba(124,58,237,0.28);
          border-color: rgba(196,181,253,0.55);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124,58,237,0.15);
        }
        .btn-glass:active { transform: scale(0.95); }

        .btn-glass.btn-edit { 
          background: rgba(124,58,237,0.15); 
          border-color: rgba(124,58,237,0.25); 
          color: #A78BFA; 
        }
        .btn-glass.btn-edit:hover { background: rgba(124,58,237,0.25); }

        .btn-glass.btn-save { 
          background: rgba(16,185,129,0.15); 
          border-color: rgba(16,185,129,0.25); 
          color: #6EE7B7; 
        }
        .btn-glass.btn-save:hover { background: rgba(16,185,129,0.25); }

        .btn-glass.btn-cancel { 
          background: rgba(239,68,68,0.15); 
          border-color: rgba(239,68,68,0.25); 
          color: #FCA5A5; 
        }
        .btn-glass.btn-cancel:hover { background: rgba(239,68,68,0.25); }

        .btn-glass.btn-add { 
          background: rgba(245,158,11,0.14); 
          border-color: rgba(245,158,11,0.3); 
          color: #FCD34D; 
        }
        .btn-glass.btn-add:hover { background: rgba(124,58,237,0.28); border-color: rgba(167,139,250,0.55); color: #E9D5FF; }

        .btn-glass.btn-danger { 
          background: rgba(239,68,68,0.12); 
          border-color: rgba(239,68,68,0.2); 
          color: #FCA5A5; 
        }
        .btn-glass.btn-danger:hover { background: rgba(239,68,68,0.22); }

        .btn-glass.btn-success { 
          background: rgba(16,185,129,0.12); 
          border-color: rgba(16,185,129,0.2); 
          color: #6EE7B7; 
        }
        .btn-glass.btn-success:hover { background: rgba(16,185,129,0.22); }

        .btn-glass.btn-refresh {
          background: rgba(124,58,237,0.12);
          border-color: rgba(124,58,237,0.2);
          color: #A78BFA;
          padding: 0.5rem 1rem;
        }
        .btn-glass.btn-refresh:hover { background: rgba(124,58,237,0.22); }
        .btn-glass:focus-visible, .tab:focus-visible {
          outline: 2px solid #A78BFA;
          outline-offset: 2px;
        }

        /* ============================================
           CARDS
           ============================================ */
        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.045));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(196,181,253,0.28);
          border-radius: 16px;
          padding: 1rem;
          transition: all 0.4s ease;
          margin-bottom: 0.75rem;
          box-shadow: 0 12px 32px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .glass-card:hover {
          background: linear-gradient(145deg, rgba(255,255,255,0.14), rgba(124,58,237,0.08));
          border-color: rgba(167,139,250,0.45);
          box-shadow: 0 16px 38px rgba(0,0,0,0.22), 0 0 24px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .glass-card.editing {
          border-color: rgba(124,58,237,0.4);
          box-shadow: 0 0 30px rgba(124,58,237,0.1);
        }

        /* ============================================
           SECTION HEADER
           ============================================ */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.8rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .section-header h3 {
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #D8C7FF;
          text-shadow: 0 0 14px rgba(196,181,253,0.25);
        }
        .section-header h3 svg { filter: drop-shadow(0 0 6px currentColor); }
        .section-actions {
          display: flex;
          gap: 0.3rem;
        }

        /* ============================================
           GRID
           ============================================ */
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
        .grid-auto { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.5rem; }

        /* ============================================
           NUMBER BOX
           ============================================ */
        .number-box {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 12px;
          padding: 0.8rem;
          text-align: center;
          transition: all 0.3s ease;
        }
        .number-box:hover {
          background: rgba(124,58,237,0.16);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        .number-box .label {
          font-size: 0.55rem;
          color: rgba(255,255,255,0.72);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .number-box .value {
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          font-weight: 800;
          margin: 0.2rem 0;
        }
        .number-box .sub {
          font-size: 0.5rem;
          color: rgba(255,255,255,0.58);
        }
        .number-box .value.green { color: #6EE7B7; }
        .number-box .value.red { color: #FCA5A5; }
        .number-box .value.gold { color: #FCD34D; }
        .number-box .value.purple { color: #A78BFA; }
        .number-box .value.blue { color: #4F6BFF; }
        .number-box .value.orange { color: #F59E0B; }

        /* ============================================
           FORM
           ============================================ */
        .form-container {
          position: relative;
          z-index: 20;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 0.75rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .form-group label {
          font-size: 0.6rem;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-group input, .form-group textarea {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0.4rem 0.6rem;
          color: #fff;
          font-size: 0.75rem;
          font-family: inherit;
          outline: none;
          transition: all 0.3s ease;
        }
        .form-group select, .month-selector select, .week-selector select {
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 0.4rem 0.6rem;
          font-size: 0.75rem;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }
        .form-group select:hover, .month-selector select:hover, .week-selector select:hover {
          background: #f5f3ff;
          border-color: #8b5cf6;
        }
        .form-group select:focus, .month-selector select:focus, .week-selector select:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.25);
        }
        .form-group select option, .month-selector select option, .week-selector select option {
          background: #ffffff;
          color: #111827;
        }
        .form-group select option:checked, .month-selector select option:checked, .week-selector select option:checked {
          background: #7c3aed;
          color: #ffffff;
        }
        .form-group select option:hover, .month-selector select option:hover, .week-selector select option:hover {
          background: #ede9fe;
          color: #5b21b6;
        }
        .form-group input:focus, .form-group textarea:focus {
          border-color: rgba(124,58,237,0.5);
          box-shadow: 0 0 20px rgba(124,58,237,0.1);
        }
        .form-group input::placeholder, .form-group textarea::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .category-picker { position: relative; }
        .category-picker > input { width: 100%; }
        .category-options {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 0.3rem);
          z-index: 10;
          max-height: min(280px, 45vh);
          overflow-y: auto;
          padding: 0.3rem;
          background: rgba(22,22,40,0.98);
          border: 1px solid rgba(167,139,250,0.35);
          border-radius: 10px;
          box-shadow: 0 14px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .category-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.6rem;
          border: 1px solid transparent;
          border-radius: 7px;
          background: transparent;
          color: rgba(255,255,255,0.78);
          font-family: inherit;
          font-size: 0.7rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .category-option:hover, .category-option:focus-visible {
          background: rgba(124,58,237,0.28);
          border-color: rgba(167,139,250,0.45);
          color: #E9D5FF;
          outline: none;
        }
        .category-new-option { color: #6EE7B7; border-top: 1px solid rgba(255,255,255,0.08); border-radius: 0 0 7px 7px; }
        .form-group textarea {
          resize: vertical;
          min-height: 40px;
        }
        .form-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
          justify-content: flex-end;
        }

        /* ============================================
           LIST ITEMS
           ============================================ */
        .list-item {
          background: linear-gradient(135deg, rgba(255,255,255,0.11), rgba(255,255,255,0.055));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 14px;
          padding: 0.75rem 0.9rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .list-item:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.14), rgba(79,107,255,0.07));
          border-color: rgba(167,139,250,0.35);
          box-shadow: 0 10px 28px rgba(0,0,0,0.18);
          transform: translateY(-2px);
        }
        .list-item .info { flex: 1; min-width: 0; }
        .list-item .info .name { font-size: 0.82rem; font-weight: 700; color: #fff; letter-spacing: 0.01em; }
        .list-item .info .detail { display: flex; align-items: center; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem; font-size: 0.65rem; color: rgba(255,255,255,0.74); }
        .date-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.22rem 0.48rem;
          border-radius: 999px;
          background: rgba(79,107,255,0.16);
          border: 1px solid rgba(125,160,255,0.24);
          color: #BFDBFE;
          font-size: 0.6rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .list-note { color: rgba(255,255,255,0.76); overflow-wrap: anywhere; }
        .list-item .amount { font-size: 0.9rem; font-weight: 800; white-space: nowrap; }
        .list-item .actions { display: flex; gap: 0.3rem; flex-shrink: 0; }

        /* ============================================
           BADGE / STATUS
           ============================================ */
        .badge {
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-size: 0.55rem;
          font-weight: 600;
        }
        .badge-pending { background: rgba(245,158,11,0.15); color: #FCD34D; }
        .badge-received { background: rgba(16,185,129,0.15); color: #6EE7B7; }
        .badge-overdue { background: rgba(239,68,68,0.15); color: #FCA5A5; }
        .badge-borrow { background: rgba(245,158,11,0.15); color: #FCD34D; }
        .badge-loan { background: rgba(124,58,237,0.15); color: #A78BFA; }

        /* ============================================
           PIE CHART
           ============================================ */
        .pie-chart-container {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: center;
          justify-content: center;
        }
        .pie-chart { flex-shrink: 0; }
        .pie-legend { display: flex; flex-direction: column; gap: 0.3rem; min-width: 120px; }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.65rem;
        }
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .legend-label { color: rgba(255,255,255,0.7); flex: 1; }
        .legend-value { font-weight: 600; color: #fff; }
        .legend-percentage { color: rgba(255,255,255,0.4); font-size: 0.6rem; }
        .empty-chart {
          text-align: center;
          color: rgba(255,255,255,0.3);
          padding: 1rem;
          font-size: 0.8rem;
        }

        /* ============================================
           NO DATA
           ============================================ */
        .no-data-container {
          text-align: center;
          padding: 2rem;
          color: rgba(255,255,255,0.4);
        }
        .no-data-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .no-data-text {
          font-size: 0.85rem;
        }

        /* ============================================
           MONTH SELECTOR
           ============================================ */
        .month-selector {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          flex-wrap: wrap;
          padding: 0.6rem 1rem;
        }
        .month-selector select {
          outline: none;
          flex: 1;
          min-width: 140px;
        }

        /* ============================================
           TABS
           ============================================ */
        .tabs {
          display: flex;
          gap: 0.3rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }
        .tab {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 10px;
          padding: 0.4rem 1rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255,255,255,0.72);
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
        }
        .tab:hover { background: rgba(255,255,255,0.06); }
        .tab.active {
          background: linear-gradient(135deg, rgba(124,58,237,0.38), rgba(79,107,255,0.2));
          border-color: rgba(167,139,250,0.7);
          color: #FFFFFF;
          box-shadow: 0 8px 22px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .tab.active svg { color: #C4B5FD; filter: drop-shadow(0 0 5px rgba(196,181,253,0.55)); }

        /* ============================================
           MESSAGES
           ============================================ */
        .error-message {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          padding: 0.5rem 0.8rem;
          color: #FCA5A5;
          font-size: 0.8rem;
          margin-bottom: 0.75rem;
        }
        .success-message {
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 10px;
          padding: 0.5rem 0.8rem;
          color: #6EE7B7;
          font-size: 0.8rem;
          margin-bottom: 0.75rem;
          text-align: center;
          animation: slideDown 0.3s ease;
        }
        .section-feedback {
          width: min(92%, 420px);
          margin: 0.6rem auto 0.8rem;
          padding: 0.55rem 0.8rem;
          border-radius: 10px;
          text-align: center;
          font-size: 0.75rem;
          animation: slideDown 0.3s ease;
        }
        .section-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          width: min(92%, 420px);
          margin: 0.6rem auto 0.8rem;
          padding: 0.6rem 0.8rem;
          border: 1px solid rgba(167,139,250,0.28);
          border-radius: 10px;
          background: rgba(124,58,237,0.12);
          color: #DDD6FE;
          font-size: 0.72rem;
        }
        .section-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(196,181,253,0.28);
          border-top-color: #C4B5FD;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          flex-shrink: 0;
        }
        .error-feedback {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #FCA5A5;
        }
        .success-feedback {
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.25);
          color: #6EE7B7;
        }
        .section-confirm-backdrop {
          position: relative;
          display: flex;
          justify-content: center;
          padding: 0.8rem 0;
          z-index: 2;
        }
        .section-confirm-dialog {
          width: min(92%, 360px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.55rem;
          padding: 1rem;
          background: #202033;
          border: 1px solid rgba(245,158,11,0.35);
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.35);
          text-align: center;
        }
        .section-confirm-dialog p {
          margin: 0;
          color: rgba(255,255,255,0.85);
          font-size: 0.75rem;
        }
        .section-confirm-actions {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 1024px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
          .grid-3 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .overview-container { padding: 12px; }
          .grid-4 { grid-template-columns: 1fr 1fr; }
          .grid-3 { grid-template-columns: 1fr 1fr; }
          .grid-2 { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .app-header h1 { font-size: 1.2rem; }
          .pie-chart-container { flex-direction: column; align-items: center; }
          .month-selector { flex-direction: column; align-items: stretch; }
          .tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .tab { width: 100%; padding: 0.55rem 0.35rem; }
          .list-item { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; }
          .list-item .amount { font-size: 0.8rem; }
        }
        @media (max-width: 480px) {
          .overview-container { padding: 8px; }
          .grid-4 { grid-template-columns: 1fr 1fr; gap: 0.3rem; }
          .grid-3 { grid-template-columns: 1fr; }
          .glass-card { padding: 0.6rem; border-radius: 12px; }
          .number-box { padding: 0.5rem; }
          .number-box .value { font-size: 1rem; }
          .tabs { gap: 0.35rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .tab { padding: 0.5rem 0.25rem; font-size: 0.6rem; }
          .section-header h3 { font-size: 0.7rem; }
          .list-item { grid-template-columns: minmax(0, 1fr) auto; padding: 0.65rem 0.7rem; gap: 0.45rem; }
          .list-item .info { grid-column: 1 / -1; }
          .list-item .amount { grid-column: 1; grid-row: 2; }
          .list-item .actions { grid-column: 2; grid-row: 2; }
          .list-item .info .name { font-size: 0.75rem; }
          .list-note { max-width: none; }
          .section-actions { width: 100%; justify-content: flex-end; }
        }
      `}</style>

      {/* ============================================
          HEADER
          ============================================ */}
      <header className="app-header">
        <div>
          <h1>📊 Financial Overview</h1>
          <p>Track your business, expenses, loans & performance</p>
        </div>
        <div className="header-actions">
          <button className="btn-glass btn-refresh" onClick={() => { fetchAllData(); showSuccess('overview', 'Refreshed!'); }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </header>

      {noDataMessage && <div className="no-data-container"><div className="no-data-icon">📋</div><p className="no-data-text">{noDataMessage}</p></div>}

      {/* ============================================
          MONTH SELECTOR
          ============================================ */}
      <div className="glass-card" style={{ padding: '0.5rem' }}>
        <div className="month-selector">
          <Calendar size={18} color="#A78BFA" />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Select Month:</span>
          <select 
            value={selectedMonth}
            onChange={(e) => {
              const month = e.target.value;
              const isCurrentMonth = month === getCurrentMonth();
              const weeks = getWeeksForMonth(month);
              const currentWeek = getWeekRange(new Date());
              const matchingCurrentWeek = weeks.find(week => week.key === currentWeek.key);

              setSelectedMonth(month);
              setSelectedYear(getYear(month));
              setSelectedWeek(isCurrentMonth && matchingCurrentWeek ? matchingCurrentWeek : weeks[0]);
            }}
          >
            {['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December']
              .map(month => {
                const year = new Date().getFullYear();
                const monthYearStr = `${month} ${year}`;
                return <option key={monthYearStr} value={monthYearStr}>{monthYearStr}</option>;
              })}
          </select>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>
            Showing data for {selectedMonth}
          </span>
        </div>
      </div>

      {/* ============================================
          TABS
          ============================================ */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <PieChart size={14} /> Overview
        </button>
        <button className={`tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
          <CreditCard size={14} /> Expenses
        </button>
        <button className={`tab ${activeTab === 'loans' ? 'active' : ''}`} onClick={() => setActiveTab('loans')}>
          <HandCoins size={14} /> Loans
        </button>
        <button className={`tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          <Wallet size={14} /> Payments
        </button>
        <button className={`tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
          <TrendingUp size={14} /> Performance
        </button>
        <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          <BarChart3 size={14} /> Summary
        </button>
      </div>

      {/* ============================================
          OVERVIEW TAB
          ============================================ */}
      {activeTab === 'overview' && (
        <>
          {/* Financial Review */}
          <div className={`glass-card ${editingSection === 'Financial Review' ? 'editing' : ''}`}>
            <SectionHeader
              title={`Financial Review (${selectedMonth})`}
              icon={<Briefcase size={16} />}
              isEditing={editingSection === 'Financial Review'}
              onEdit={() => setEditingSection('Financial Review')}
              onSave={saveFinancialReview}
              onCancel={() => setEditingSection(null)}
              saving={saving}
            />
            {renderSectionFeedback('overview')}
            <div className="grid-4">
              <div className="number-box">
                <div className="label">Total Business</div>
                {editingSection === 'Financial Review' ? (
                  <input className="edit-input" type="text" value={financialReview.total_business || ''} onChange={(e) => handleFinancialChange('total_business', e.target.value)} placeholder="0" style={{ fontSize: '1.2rem', fontWeight: 800, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.2rem 0.4rem', color: '#fff', width: '100%' }} />
                ) : (
                  <div className="value purple">{formatNumber(financialReview.total_business)}</div>
                )}
                <div className="sub">Active Businesses</div>
              </div>
              <div className="number-box">
                <div className="label">Total Works</div>
                {editingSection === 'Financial Review' ? (
                  <input className="edit-input" type="text" value={financialReview.total_works || ''} onChange={(e) => handleFinancialChange('total_works', e.target.value)} placeholder="0" style={{ fontSize: '1.2rem', fontWeight: 800, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.2rem 0.4rem', color: '#fff', width: '100%' }} />
                ) : (
                  <div className="value blue">{formatNumber(financialReview.total_works)}</div>
                )}
                <div className="sub">Ongoing Projects</div>
              </div>
              <div className="number-box">
                <div className="label">Business Payment</div>
                {editingSection === 'Financial Review' ? (
                  <input className="edit-input" type="text" value={financialReview.business_payment || ''} onChange={(e) => handleFinancialChange('business_payment', e.target.value)} placeholder="0" style={{ fontSize: '1.2rem', fontWeight: 800, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.2rem 0.4rem', color: '#fff', width: '100%' }} />
                ) : (
                  <div className="value green">{formatCurrency(financialReview.business_payment)}</div>
                )}
                <div className="sub">Total Received</div>
              </div>
              <div className="number-box">
                <div className="label">Work Payment</div>
                {editingSection === 'Financial Review' ? (
                  <input className="edit-input" type="text" value={financialReview.work_payment || ''} onChange={(e) => handleFinancialChange('work_payment', e.target.value)} placeholder="0" style={{ fontSize: '1.2rem', fontWeight: 800, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.2rem 0.4rem', color: '#fff', width: '100%' }} />
                ) : (
                  <div className="value gold">{formatCurrency(financialReview.work_payment)}</div>
                )}
                <div className="sub">Total Earned</div>
              </div>
            </div>
            <div className="grid-4" style={{ marginTop: '0.5rem' }}>
              <div className="number-box" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
                <div className="label">Total Savings</div>
                <div className="value green">{formatCurrency(selectedMonthSavings)}</div>
                <div className="sub">Selected month only</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <div className="label">Total Expenses</div>
                <div className="value red">{formatCurrency(selectedMonthExpenses)}</div>
                <div className="sub">Selected month only</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
                <div className="label">Total Borrow</div>
                <div className="value orange">{formatCurrency(selectedMonthBorrow)}</div>
                <div className="sub">Selected month only</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.2)' }}>
                <div className="label">Total Loan EMI</div>
                <div className="value purple">{formatCurrency(selectedMonthLoanEmi)}</div>
                <div className="sub">Selected month only</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid-4">
            <div className="number-box" style={{ background: 'rgba(16,185,129,0.05)' }}>
              <div className="label">Total Income</div>
              <div className="value green">{formatCurrency(selectedMonthIncome)}</div>
            </div>
            <div className="number-box" style={{ background: 'rgba(239,68,68,0.05)' }}>
              <div className="label">Total Expenses</div>
              <div className="value red">{formatCurrency(selectedMonthExpenses)}</div>
            </div>
            <div className="number-box" style={{ background: 'rgba(245,158,11,0.05)' }}>
              <div className="label">Pending Payments</div>
              <div className="value orange">{formatCurrency(pendingPayments)}</div>
            </div>
            <div className="number-box" style={{ background: 'rgba(124,58,237,0.05)' }}>
              <div className="label">Net Profit</div>
              <div className="value purple">{formatCurrency(selectedMonthIncome - selectedMonthExpenses)}</div>
            </div>
          </div>
        </>
      )}

      {/* ============================================
          EXPENSES TAB
          ============================================ */}
      {activeTab === 'expenses' && (
        <>
          {showExpenseForm && (
            <div className="form-container">
              <h4 style={{ marginBottom: '0.5rem', color: '#A78BFA' }}>{editingExpenseId !== null ? 'Edit Expense' : 'Add New Expense'}</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Category / New Category *</label>
                  <div className="category-picker">
                    <input
                      type="text"
                      value={newExpense.category}
                      onFocus={() => setExpenseCategoryOpen(true)}
                      onBlur={() => setTimeout(() => setExpenseCategoryOpen(false), 150)}
                      onChange={(e) => handleExpenseChange('category', e.target.value)}
                      placeholder="Select or type a category"
                      aria-label="Expense category"
                    />
                    {expenseCategoryOpen && (
                      <div className="category-options">
                        {getExpenseCategoryOptions()
                          .filter(category => category.toLowerCase().includes(newExpense.category.toLowerCase()))
                          .map(category => (
                            <button
                              type="button"
                              className="category-option"
                              key={category}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                handleExpenseChange('category', category);
                                setExpenseCategoryOpen(false);
                              }}
                            >
                              <CreditCard size={13} /> {category}
                            </button>
                          ))}
                        {newExpense.category.trim() && !getExpenseCategoryOptions().some(category => category.toLowerCase() === newExpense.category.trim().toLowerCase()) && (
                          <button
                            type="button"
                            className="category-option category-new-option"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setExpenseCategoryOpen(false)}
                          >
                            <Plus size={13} /> Use “{newExpense.category.trim()}”
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="text" value={newExpense.amount} onChange={(e) => handleExpenseChange('amount', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={newExpense.expense_date} onChange={(e) => handleExpenseChange('expense_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" value={newExpense.notes} onChange={(e) => handleExpenseChange('notes', e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-glass btn-save" onClick={saveExpense} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn-glass btn-cancel" onClick={cancelExpenseForm}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          <div className="glass-card">
            <SectionHeader
              title={`Expenses (${selectedMonth})`}
              icon={<CreditCard size={16} color="#7C3AED" />}
              onAdd={() => {
                cancelExpenseForm();
                setNewExpense({ category: '', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' });
                setShowExpenseForm(true);
              }}
            />
            {renderSectionFeedback('expenses')}
            
            {expensePieData.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Category Breakdown</h4>
                <PieChartComponent 
                  data={expensePieData} 
                  total={expensePieData.reduce((sum, d) => sum + d.amount, 0)}
                  colors={['#F59E0B','#10B981','#7C3AED','#4F6BFF','#2EA8FF','#F43F5E','#8B5CF6']}
                />
              </div>
            )}

            <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Expense Records</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {expenses.length === 0 ? (
                <NoDataMessage message="No expenses found. Click Add to create your first expense!" />
              ) : (
                expenses.map((exp, index) => (
                  <div key={index} className="list-item">
                    <div className="info">
                      <div className="name">{exp.category}</div>
                      <div className="detail">
                        <span className="date-badge"><Calendar size={11} /> {formatDate(exp.expense_date)}</span>
                        {exp.notes && <span className="list-note">{exp.notes}</span>}
                      </div>
                    </div>
                    <div className="amount red">{formatCurrency(exp.amount)}</div>
                    <div className="actions">
                      <button className="btn-glass btn-edit" onClick={() => editExpense(exp)} style={{ padding: '0.15rem 0.4rem' }}>
                        <Edit2 size={12} />
                      </button>
                      <button className="btn-glass btn-danger" onClick={() => deleteExpense(exp.id)} style={{ padding: '0.15rem 0.4rem' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ============================================
          LOANS TAB
          ============================================ */}
      {activeTab === 'loans' && (
        <>
          {showLoanForm && (
            <div className="form-container">
              <h4 style={{ marginBottom: '0.5rem', color: '#A78BFA' }}>{editingLoanId !== null ? 'Edit Loan/Borrow' : 'Add New Loan/Borrow'}</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" value={newLoan.name} onChange={(e) => handleLoanChange('name', e.target.value)} placeholder="Person/Bank name" />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select value={newLoan.type} onChange={(e) => handleLoanChange('type', e.target.value)}>
                    <option value="Borrow">Borrow</option>
                    <option value="Loan">Loan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="text" value={newLoan.amount} onChange={(e) => handleLoanChange('amount', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>EMI</label>
                  <input type="text" value={newLoan.emi} onChange={(e) => handleLoanChange('emi', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={newLoan.loan_date} onChange={(e) => handleLoanChange('loan_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" value={newLoan.notes} onChange={(e) => handleLoanChange('notes', e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-glass btn-save" onClick={saveLoan} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn-glass btn-cancel" onClick={cancelLoanForm}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          <div className="glass-card">
            <SectionHeader
              title={`Loans & Borrows (${selectedMonth})`}
              icon={<HandCoins size={16} color="#F43F5E" />}
              onAdd={() => {
                cancelLoanForm();
                setNewLoan({ name: '', amount: '', emi: '', loan_date: new Date().toISOString().split('T')[0], type: 'Borrow', notes: '' });
                setShowLoanForm(true);
              }}
            />
            {renderSectionFeedback('loans')}
            
            <div className="grid-3" style={{ marginBottom: '0.8rem' }}>
              <div className="number-box" style={{ background: 'rgba(245,158,11,0.05)' }}>
                <div className="label">Total Borrow</div>
                <div className="value orange">{formatCurrency(totalBorrow)}</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(124,58,237,0.05)' }}>
                <div className="label">Total Loans</div>
                <div className="value purple">{formatCurrency(totalLoans)}</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(16,185,129,0.05)' }}>
                <div className="label">Total</div>
                <div className="value green">{formatCurrency(totalBorrow + totalLoans)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {loans.length === 0 ? (
                <NoDataMessage message="No loans found. Click Add to create your first loan!" />
              ) : (
                loans.map((loan, index) => (
                  <div key={index} className="list-item">
                    <div className="info">
                      <div className="name">{loan.name}</div>
                      <div className="detail">
                        <span className={`badge ${loan.type === 'Borrow' ? 'badge-borrow' : 'badge-loan'}`}>{loan.type}</span>
                        {loan.emi > 0 && <span>EMI: {formatCurrency(loan.emi)}</span>}
                        <span className="date-badge"><Calendar size={11} /> {formatDate(loan.loan_date)}</span>
                      </div>
                    </div>
                    <div className="amount" style={{ color: loan.type === 'Borrow' ? '#FCD34D' : '#A78BFA' }}>
                      {formatCurrency(loan.amount)}
                    </div>
                    <div className="actions">
                      <button className="btn-glass btn-edit" onClick={() => editLoan(loan)} style={{ padding: '0.15rem 0.4rem' }}>
                        <Edit2 size={12} />
                      </button>
                      <button className="btn-glass btn-danger" onClick={() => deleteLoan(loan.id)} style={{ padding: '0.15rem 0.4rem' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ============================================
          PAYMENTS TAB
          ============================================ */}
      {activeTab === 'payments' && (
        <>
          {showPaymentForm && (
            <div className="form-container">
              <h4 style={{ marginBottom: '0.5rem', color: '#A78BFA' }}>{editingPaymentId !== null ? 'Edit Payment' : 'Add New Payment'}</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Person Name *</label>
                  <input type="text" value={newPayment.person_name} onChange={(e) => handlePaymentChange('person_name', e.target.value)} placeholder="Name" />
                </div>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="text" value={newPayment.amount} onChange={(e) => handlePaymentChange('amount', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={newPayment.payment_date} onChange={(e) => handlePaymentChange('payment_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={newPayment.status} onChange={(e) => handlePaymentChange('status', e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" value={newPayment.notes} onChange={(e) => handlePaymentChange('notes', e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-glass btn-save" onClick={savePayment} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn-glass btn-cancel" onClick={cancelPaymentForm}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          <div className="glass-card">
            <SectionHeader
              title={`Remaining Payments (${selectedMonth})`}
              icon={<Wallet size={16} color="#F59E0B" />}
              onAdd={() => {
                cancelPaymentForm();
                setNewPayment({ person_name: '', amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '', status: 'pending' });
                setShowPaymentForm(true);
              }}
            />
            {renderSectionFeedback('payments')}
            
            <div className="grid-3" style={{ marginBottom: '0.8rem' }}>
              <div className="number-box" style={{ background: 'rgba(245,158,11,0.05)' }}>
                <div className="label">Total Pending</div>
                <div className="value orange">{formatCurrency(pendingPayments)}</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(16,185,129,0.05)' }}>
                <div className="label">Total Received</div>
                <div className="value green">{formatCurrency(payments.filter(p => p.status === 'received').reduce((sum, p) => sum + parseFloat(p.amount), 0))}</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(239,68,68,0.05)' }}>
                <div className="label">Overdue</div>
                <div className="value red">{formatCurrency(payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + parseFloat(p.amount), 0))}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {payments.length === 0 ? (
                <NoDataMessage message="No payments found. Click Add to create your first payment!" />
              ) : (
                payments.map((payment, index) => (
                  <div key={index} className="list-item">
                    <div className="info">
                      <div className="name">{payment.person_name}</div>
                      <div className="detail">
                        <span className={`badge badge-${payment.status}`}>{payment.status}</span>
                        <span className="date-badge"><Calendar size={11} /> {formatDate(payment.payment_date)}</span>
                        {payment.notes && <span className="list-note">{payment.notes}</span>}
                      </div>
                    </div>
                    <div className="amount gold">{formatCurrency(payment.amount)}</div>
                    <div className="actions">
                      <button className="btn-glass btn-edit" onClick={() => editPayment(payment)} style={{ padding: '0.15rem 0.4rem' }}>
                        <Edit2 size={12} />
                      </button>
                      {payment.status !== 'received' && (
                        <button className="btn-glass btn-success" onClick={() => updatePaymentStatus(payment.id, 'received')} style={{ padding: '0.15rem 0.4rem', fontSize: '0.5rem' }}>
                          <CheckCircle size={12} />
                        </button>
                      )}a
                      <button className="btn-glass btn-danger" onClick={() => deletePayment(payment.id)} style={{ padding: '0.15rem 0.4rem' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ============================================
          PERFORMANCE TAB
          ============================================ */}
      {activeTab === 'performance' && (
        <>
          <div className="glass-card" style={{ padding: '0.5rem', marginBottom: '0.75rem' }}>
            <div className="week-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', padding: '0.6rem 1rem' }}>
              <Calendar size={18} color="#4F6BFF" />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Select Week:</span>
              <select
                value={selectedWeek.key}
                onChange={(e) => {
                  const week = getWeeksForMonth(selectedMonth).find(item => item.key === e.target.value);
                  if (week) setSelectedWeek(week);
                }}
              >
                {getWeeksForMonth(selectedMonth).map((week, index) => (
                  <option key={week.key} value={week.key}>Week {index + 1}: {week.label}</option>
                ))}
              </select>
            </div>
          </div>

          {weeklyPerformance ? (
            <div className="glass-card">
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.8rem', color: '#4F6BFF' }}>
                <Calendar size={16} /> Weekly Performance ({formatDate(weeklyPerformance.week_start)} to {formatDate(weeklyPerformance.week_end)})
              </h3>
              <div className="grid-4">
                <div className="number-box"><div className="label">Total Income</div><div className="value green">{formatCurrency(weeklyPerformance.totalIncome)}</div></div>
                <div className="number-box"><div className="label">Total Expenses</div><div className="value red">{formatCurrency(weeklyPerformance.totalExpenses)}</div></div>
                <div className="number-box"><div className="label">Total Savings</div><div className="value purple">{formatCurrency(weeklyPerformance.totalSavings)}</div></div>
                <div className="number-box"><div className="label">Highest Expense Day</div><div className="value orange">{weeklyPerformance.highestExpenseDay?.day || '-'}</div></div>
              </div>
              {weeklyPerformance.pieData && weeklyPerformance.pieData.length > 0 && (
                <div style={{ marginTop: '0.8rem' }}>
                  <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Weekly Expense Breakdown</h4>
                  <PieChartComponent 
                    data={weeklyPerformance.pieData.map(d => ({ category: d.category, amount: d.amount }))}
                    total={weeklyPerformance.totalExpenses}
                    colors={['#F59E0B','#10B981','#7C3AED','#4F6BFF','#2EA8FF','#F43F5E','#8B5CF6']}
                  />
                </div>
              )}
            </div>
          ) : (
            <NoDataMessage message={`No details found for ${selectedWeek.label}`} />
          )}

          {monthlyPerformance ? (
            <div className="glass-card">
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.8rem', color: '#7C3AED' }}>
                <BarChart3 size={16} /> Monthly Performance ({monthlyPerformance.monthName} {monthlyPerformance.year})
              </h3>
              <div className="grid-4">
                <div className="number-box"><div className="label">Total Income</div><div className="value green">{formatCurrency(monthlyPerformance.totalIncome)}</div></div>
                <div className="number-box"><div className="label">Total Expenses</div><div className="value red">{formatCurrency(monthlyPerformance.totalExpenses)}</div></div>
                <div className="number-box"><div className="label">Net Profit</div><div className="value purple">{formatCurrency(monthlyPerformance.netProfit)}</div></div>
                <div className="number-box"><div className="label">Total Savings</div><div className="value gold">{formatCurrency(monthlyPerformance.totalSavings)}</div></div>
              </div>
              <div className="grid-3" style={{ marginTop: '0.5rem' }}>
                <div className="number-box"><div className="label">Total Borrow</div><div className="value orange">{formatCurrency(monthlyPerformance.totalBorrow)}</div></div>
                <div className="number-box"><div className="label">Total Loans</div><div className="value purple">{formatCurrency(monthlyPerformance.totalLoans)}</div></div>
                <div className="number-box"><div className="label">Profit Margin</div><div className="value" style={{ color: monthlyPerformance.incomeVsExpense?.isProfitable ? '#6EE7B7' : '#FCA5A5' }}>
                  {monthlyPerformance.incomeVsExpense?.profitMargin || 0}%
                </div></div>
              </div>
              {monthlyPerformance.pieData && monthlyPerformance.pieData.length > 0 && (
                <div style={{ marginTop: '0.8rem' }}>
                  <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Monthly Expense Breakdown</h4>
                  <PieChartComponent 
                    data={monthlyPerformance.pieData}
                    total={monthlyPerformance.totalExpenses}
                    colors={['#F59E0B','#10B981','#7C3AED','#4F6BFF','#2EA8FF','#F43F5E','#8B5CF6']}
                  />
                </div>
              )}
            </div>
          ) : (
            <NoDataMessage message="No monthly performance data available" />
          )}
        </>
      )}

      {/* ============================================
          SUMMARY TAB
          ============================================ */}
      {activeTab === 'summary' && (
        <>
          {summary ? (
            <>
              <div className="glass-card">
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.8rem', color: '#FBBF24' }}>
                  <Trophy size={16} /> All-Time Summary
                </h3>
                <div className="grid-3">
                  <div className="number-box">
                    <div className="label">All-Time Total Income</div>
                    <div className="value green">{formatCurrency(allTimeIncome)}</div>
                  </div>
                  <div className="number-box">
                    <div className="label">All-Time Total Expenses</div>
                    <div className="value red">{formatCurrency(allTimeExpenses)}</div>
                  </div>
                  <div className="number-box" style={{ background: netTotalSavings >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
                    <div className="label">Net Total Savings</div>
                    <div className={`value ${netTotalSavings >= 0 ? 'green' : 'red'}`}>
                      {netTotalSavings >= 0 ? '+' : '−'}{formatCurrency(Math.abs(netTotalSavings))}
                    </div>
                    <div className="sub">Income − Expenses</div>
                  </div>
                </div>
                <div className="grid-4" style={{ marginTop: '0.5rem' }}>
                  <div className="number-box"><div className="label">Total Business</div><div className="value purple">{formatNumber(summary.summary?.totalBusiness)}</div></div>
                  <div className="number-box"><div className="label">Total Works</div><div className="value blue">{formatNumber(summary.summary?.totalWorks)}</div></div>
                  <div className="number-box"><div className="label">Total Borrow</div><div className="value orange">{formatCurrency(summary.summary?.totalBorrow)}</div></div>
                  <div className="number-box"><div className="label">Total Loans</div><div className="value purple">{formatCurrency(summary.summary?.totalLoans)}</div></div>
                </div>
              </div>

              {summaryPieData && summaryPieData.length > 0 && (
                <div className="glass-card">
                  <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Income vs Expenses vs Savings</h4>
                  <PieChartComponent 
                    data={summaryPieData}
                    total={summaryPieData.reduce((sum, d) => sum + d.amount, 0)}
                    colors={['#10B981','#F43F5E','#F59E0B']}
                  />
                </div>
              )}

              {summary.monthlyTrends && summary.monthlyTrends.length > 0 && (
                <div className="glass-card">
                  <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Monthly Trends</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.3rem' }}>
                    {summary.monthlyTrends.map((trend, index) => (
                      <div key={index} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{trend.monthName} {trend.year}</span>
                          <span style={{ fontSize: '0.6rem', color: trend.savings >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
                            {trend.savings >= 0 ? '▲' : '▼'} {formatCurrency(trend.savings)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6rem' }}>
                          <span style={{ color: '#6EE7B7' }}>Income: {formatCurrency(trend.income)}</span>
                          <span style={{ color: '#FCA5A5' }}>Exp: {formatCurrency(trend.expenses)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <NoDataMessage message="No summary data available. Start adding your financial records!" />
          )}
        </>
      )}

    </div>
  );
};

export default Overview;
