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

const Overview = ({ navigationTarget }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [messageSection, setMessageSection] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
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
  // NAVBAR SECTION NAVIGATION
  // =============================================
  useEffect(() => {
    if (!navigationTarget) return;

    const tabMap = {
      'financial-review': 'overview',
      'expenses': 'expenses',
      'loans': 'loans',
      'payments': 'payments',
      'performance': 'performance',
      'summary': 'summary'
    };

    const targetTab = tabMap[navigationTarget];
    if (!targetTab) return;

    setActiveTab(targetTab);

    let attempts = 0;
    const findAndScroll = () => {
      attempts += 1;

      const targets = Array.from(
        document.querySelectorAll(`[data-overview-section="${navigationTarget}"]`)
      );

      const target = targets.find((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          element.getBoundingClientRect().height > 0;
      });

      if (!target) {
        if (attempts < 15) setTimeout(findAndScroll, 80);
        return;
      }

      const navbar = document.querySelector('.navbar');
      const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 70;
      const extra = window.innerWidth <= 480 ? 18 : window.innerWidth <= 768 ? 22 : 24;

      const top = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - navbarHeight - extra
      );

      window.scrollTo({ top, behavior: 'smooth' });
      target.classList.add('section-nav-highlight');
      setTimeout(() => target.classList.remove('section-nav-highlight'), 1200);
    };

    const timer = setTimeout(findAndScroll, 60);
    return () => clearTimeout(timer);
  }, [navigationTarget, activeTab]);

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
  const API_SERVER = (
    import.meta.env.VITE_API_URL ||
    'https://express-project-learning-new.onrender.com'
  ).replace(/\/$/, '');

  const API_BASE = `${API_SERVER}/api/personal-overview`;

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

  const fetchAllData = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    setNoDataMessage(null);

    try {
      const monthNum = getMonthNumber(selectedMonth);
      const year = getYear(selectedMonth);

      await Promise.all([
        fetchFinancialReview(),
        fetchExpenses(monthNum, year),
        fetchExpensePie(monthNum, year),
        fetchLoans(monthNum, year),
        fetchPayments(monthNum, year),
        fetchMonthlyPerformance(monthNum, year),
        fetchWeeklyPerformance(selectedWeek),
        fetchSummary(),
        fetchSummaryPie()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('overview', 'Failed to refresh data. Please try again.');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // =============================================
  // API CALLS
  // =============================================

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
        await fetchAllData({ silent: true });
      }
    } catch (err) {
      showError('overview', 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

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
        await fetchAllData({ silent: true });
      }
    } catch (err) {
      showError('expenses', isEditing ? 'Failed to update expense' : 'Failed to add expense');
    } finally {
      setSaving(false);
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
        const response = await fetch(`${API_BASE}/expenses/delete/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          showSuccess('expenses', 'Expense deleted!');
          await fetchAllData({ silent: true });
        }
      } catch (err) {
        showError('expenses', 'Failed to delete expense');
      }
    });
  };

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
        await fetchAllData({ silent: true });
      }
    } catch (err) {
      showError('loans', isEditing ? 'Failed to update loan' : 'Failed to add loan');
    } finally {
      setSaving(false);
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
        const response = await fetch(`${API_BASE}/loans/delete/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          showSuccess('loans', 'Loan deleted!');
          await fetchAllData({ silent: true });
        }
      } catch (err) {
        showError('loans', 'Failed to delete loan');
      }
    });
  };

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
        await fetchAllData({ silent: true });
      }
    } catch (err) {
      showError('payments', isEditing ? 'Failed to update payment' : 'Failed to add payment');
    } finally {
      setSaving(false);
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
      const response = await fetch(`${API_BASE}/payments/status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (result.success) {
        showSuccess('payments', 'Payment status updated!');
        await fetchAllData({ silent: true });
      }
    } catch (err) {
      showError('payments', 'Failed to update payment status');
    }
  };

  const deletePayment = async (id) => {
    askForConfirmation('payments', 'Delete this payment record?', async () => {
      try {
        const response = await fetch(`${API_BASE}/payments/delete/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          showSuccess('payments', 'Payment deleted!');
          await fetchAllData({ silent: true });
        }
      } catch (err) {
        showError('payments', 'Failed to delete payment');
      }
    });
  };

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
            <Plus size={15} /> Add
          </button>
        )}
        {isEditing ? (
          <>
            <button className="btn-glass btn-save" onClick={onSave} disabled={saving}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn-glass btn-cancel" onClick={onCancel}>
              <X size={15} /> Cancel
            </button>
          </>
        ) : onEdit ? (
          <button className="btn-glass btn-edit" onClick={onEdit}>
            <Edit2 size={15} /> Edit
          </button>
        ) : null}
      </div>
    </div>
  );

  const renderSectionFeedback = (section) => (
    <>
      {messageSection === section && error && <div className="section-feedback error-feedback">⚠️ {error}</div>}
      {messageSection === section && successMessage && <div className="section-feedback success-feedback">✅ {successMessage}</div>}
      {confirmDialog?.section === section && (
        <div className="section-confirm-backdrop">
          <div className="section-confirm-dialog">
            <AlertTriangle size={24} color="#FCD34D" />
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
  // PIE CHART COMPONENT - INCREASED SIZE
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
      return { ...item, startAngle, angle, color: colors?.[index % colors.length] || '#7C3AED' };
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
        <div className="pie-chart-wrapper">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {pieSegments.map((seg, i) => (
              <path 
                key={i} 
                d={describeArc(100, 100, 85, seg.startAngle, seg.startAngle + seg.angle)} 
                fill={seg.color} 
                className="pie-segment"
                stroke="#06060f" 
                strokeWidth="2.5"
              />
            ))}
            <circle cx="100" cy="100" r="45" fill="#06060f" />
            <text x="100" y="93" textAnchor="middle" fill="white" fontSize="15" fontWeight="800">
              {formatCurrency(totalValue)}
            </text>
            <text x="100" y="113" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="600">
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
              <span className="legend-percentage">{Math.round((item.amount / totalValue) * 100)}%</span>
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
        
        .section-nav-highlight { animation: sectionNavHighlight 1.2s ease; }
        @keyframes sectionNavHighlight {
          0% { outline: 2px solid rgba(167,139,250,0); outline-offset: 8px; }
          25% { outline: 2px solid rgba(167,139,250,0.9); outline-offset: 8px; }
          100% { outline: 2px solid rgba(167,139,250,0); outline-offset: 8px; }
        }
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
          gap: 1.2rem;
        }
        .loading-spinner {
          width: 55px;
          height: 55px;
          border: 4px solid rgba(124,58,237,0.2);
          border-top-color: #7C3AED;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .loading-container p {
          font-size: 1rem;
          color: rgba(255,255,255,0.6);
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
          margin-bottom: 1.2rem;
        }
        .app-header h1 {
          font-size: clamp(1.3rem, 3.5vw, 1.9rem);
          font-weight: 800;
          background: linear-gradient(135deg, #FFFFFF, #A78BFA);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .app-header p {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
          margin-top: 0.1rem;
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
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 9px;
          color: #fff;
          padding: 0.5rem 0.9rem;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-height: 36px;
          justify-content: center;
          white-space: nowrap;
        }
        .btn-glass:hover {
          background: rgba(124,58,237,0.25);
          border-color: rgba(196,181,253,0.5);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124,58,237,0.12);
        }
        .btn-glass:active { transform: scale(0.95); }

        .btn-glass.btn-edit { 
          background: rgba(124,58,237,0.12); 
          border-color: rgba(124,58,237,0.22); 
          color: #A78BFA; 
        }
        .btn-glass.btn-edit:hover { background: rgba(124,58,237,0.22); }

        .btn-glass.btn-save { 
          background: rgba(16,185,129,0.12); 
          border-color: rgba(16,185,129,0.22); 
          color: #6EE7B7; 
        }
        .btn-glass.btn-save:hover { background: rgba(16,185,129,0.22); }

        .btn-glass.btn-cancel { 
          background: rgba(239,68,68,0.12); 
          border-color: rgba(239,68,68,0.22); 
          color: #FCA5A5; 
        }
        .btn-glass.btn-cancel:hover { background: rgba(239,68,68,0.22); }

        .btn-glass.btn-add { 
          background: rgba(245,158,11,0.12); 
          border-color: rgba(245,158,11,0.25); 
          color: #FCD34D; 
        }
        .btn-glass.btn-add:hover { background: rgba(245,158,11,0.22); }

        .btn-glass.btn-danger { 
          background: rgba(239,68,68,0.10); 
          border-color: rgba(239,68,68,0.18); 
          color: #FCA5A5; 
        }
        .btn-glass.btn-danger:hover { background: rgba(239,68,68,0.20); }

        .btn-glass.btn-success { 
          background: rgba(16,185,129,0.10); 
          border-color: rgba(16,185,129,0.18); 
          color: #6EE7B7; 
        }
        .btn-glass.btn-success:hover { background: rgba(16,185,129,0.20); }

        .btn-glass.btn-refresh {
          background: rgba(124,58,237,0.10);
          border-color: rgba(124,58,237,0.18);
          color: #A78BFA;
          padding: 0.5rem 1rem;
        }
        .btn-glass.btn-refresh:hover { background: rgba(124,58,237,0.20); }

        /* ============================================
           TABS - INCREASED SIZE
           ============================================ */
        .tabs {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .tab {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 14px;
          padding: 0.8rem 1.6rem;
          font-size: 1rem;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 52px;
        }

        .tab:hover { 
          background: rgba(255,255,255,0.08); 
          transform: translateY(-1px);
        }

        .tab.active {
          background: linear-gradient(135deg, rgba(124,58,237,0.35), rgba(79,107,255,0.2));
          border-color: rgba(167,139,250,0.6);
          color: #FFFFFF;
          box-shadow: 0 6px 24px rgba(124,58,237,0.18);
        }

        .tab svg {
          width: 20px;
          height: 20px;
        }

        .tab.active svg {
          color: #C4B5FD;
          filter: drop-shadow(0 0 8px rgba(196,181,253,0.4));
        }

        /* ============================================
           CARDS
           ============================================ */
        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035));
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(196,181,253,0.2);
          border-radius: 16px;
          padding: 1rem;
          transition: all 0.3s ease;
          margin-bottom: 0.8rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .glass-card:hover {
          border-color: rgba(167,139,250,0.35);
          box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        }
        .glass-card.editing {
          border-color: rgba(124,58,237,0.35);
          box-shadow: 0 0 24px rgba(124,58,237,0.08);
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
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .section-header h3 {
          font-size: 0.95rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #D8C7FF;
          text-shadow: 0 0 12px rgba(196,181,253,0.2);
        }
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
        .grid-auto { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem; }

        /* ============================================
           NUMBER BOX
           ============================================ */
        .number-box {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          padding: 0.7rem;
          text-align: center;
          transition: all 0.25s ease;
        }
        .number-box:hover {
          background: rgba(124,58,237,0.12);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        .number-box .label {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .number-box .value {
          font-size: clamp(1.2rem, 2.5vw, 1.7rem);
          font-weight: 800;
          margin: 0.2rem 0;
        }
        .number-box .sub {
          font-size: 0.55rem;
          color: rgba(255,255,255,0.45);
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
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 0.8rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .form-group label {
          font-size: 0.65rem;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-group input, .form-group textarea {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 0.45rem 0.6rem;
          color: #fff;
          font-size: 0.8rem;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
        }
        .form-group select {
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 0.45rem 0.6rem;
          font-size: 0.8rem;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }
        .form-group select:hover {
          background: #f5f3ff;
          border-color: #8b5cf6;
        }
        .form-group select:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.2);
        }
        .form-group select option {
          background: #ffffff;
          color: #111827;
        }
        .form-group input:focus, .form-group textarea:focus {
          border-color: rgba(124,58,237,0.4);
          box-shadow: 0 0 16px rgba(124,58,237,0.06);
        }
        .form-group input::placeholder, .form-group textarea::placeholder {
          color: rgba(255,255,255,0.25);
        }
        .category-picker { position: relative; }
        .category-options {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 0.2rem);
          z-index: 9999;
          max-height: 220px;
          overflow-y: auto;
          padding: 0.3rem;
          background: rgba(22,22,40,0.98);
          border: 1px solid rgba(167,139,250,0.3);
          border-radius: 10px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.35);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .category-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.6rem;
          border: 1px solid transparent;
          border-radius: 7px;
          background: transparent;
          color: rgba(255,255,255,0.7);
          font-family: inherit;
          font-size: 0.75rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .category-option:hover {
          background: rgba(124,58,237,0.25);
          color: #E9D5FF;
        }
        .category-new-option { color: #6EE7B7; border-top: 1px solid rgba(255,255,255,0.06); }
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
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          padding: 0.7rem 0.8rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.6rem;
          transition: all 0.2s ease;
        }
        .list-item:hover {
          background: linear-gradient(135deg, rgba(124,58,237,0.10), rgba(79,107,255,0.05));
          border-color: rgba(167,139,250,0.25);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        .list-item .info { flex: 1; min-width: 0; }
        .list-item .info .name { font-size: 0.85rem; font-weight: 700; color: #fff; }
        .list-item .info .detail { display: flex; align-items: center; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.25rem; font-size: 0.7rem; color: rgba(255,255,255,0.6); }
        .date-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          background: rgba(79,107,255,0.12);
          border: 1px solid rgba(125,160,255,0.18);
          color: #BFDBFE;
          font-size: 0.65rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .list-note { color: rgba(255,255,255,0.6); overflow-wrap: anywhere; }
        .list-item .amount { font-size: 0.9rem; font-weight: 800; white-space: nowrap; }
        .list-item .actions { display: flex; gap: 0.3rem; flex-shrink: 0; }

        /* ============================================
           BADGE / STATUS
           ============================================ */
        .badge {
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-pending { background: rgba(245,158,11,0.12); color: #FCD34D; }
        .badge-received { background: rgba(16,185,129,0.12); color: #6EE7B7; }
        .badge-overdue { background: rgba(239,68,68,0.12); color: #FCA5A5; }
        .badge-borrow { background: rgba(245,158,11,0.12); color: #FCD34D; }
        .badge-loan { background: rgba(124,58,237,0.12); color: #A78BFA; }

        /* ============================================
           PIE CHART - INCREASED SIZE
           ============================================ */
        .pie-chart-container {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1.5rem;
          padding: 0.2rem 0;
        }

        .pie-chart-wrapper {
          flex: 0 0 auto;
          width: 200px;
          height: 200px;
        }

        .pie-chart-wrapper svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .pie-legend {
          flex: 1;
          min-width: 160px;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .legend-item {
          display: grid;
          grid-template-columns: 14px minmax(0, 1fr) max-content max-content;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          padding: 0.25rem 0;
        }

        .legend-color {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .legend-label {
          color: rgba(255,255,255,0.75);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .legend-value {
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
        }

        .legend-percentage {
          color: rgba(255,255,255,0.4);
          font-size: 0.7rem;
          white-space: nowrap;
          text-align: right;
        }

        .empty-chart {
          text-align: center;
          color: rgba(255,255,255,0.3);
          padding: 1.5rem;
          font-size: 0.9rem;
        }

        /* ============================================
           NO DATA
           ============================================ */
        .no-data-container {
          text-align: center;
          padding: 2rem;
          color: rgba(255,255,255,0.35);
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
          padding: 0.5rem 1rem;
        }
        .month-selector select {
          outline: none;
          flex: 1;
          min-width: 130px;
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 0.4rem 0.6rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }
        .month-selector select:hover {
          background: #f5f3ff;
          border-color: #8b5cf6;
        }
        .month-selector select:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.2);
        }

        /* ============================================
           MESSAGES
           ============================================ */
        .section-feedback {
          width: 100%;
          margin: 0.5rem 0 0.8rem;
          padding: 0.5rem 0.8rem;
          border-radius: 9px;
          text-align: center;
          font-size: 0.8rem;
          animation: slideDown 0.25s ease;
        }
        .error-feedback {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.2);
          color: #FCA5A5;
        }
        .success-feedback {
          background: rgba(16,185,129,0.10);
          border: 1px solid rgba(16,185,129,0.18);
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
          width: min(92%, 340px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: #202033;
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: 12px;
          box-shadow: 0 10px 28px rgba(0,0,0,0.3);
          text-align: center;
        }
        .section-confirm-dialog p {
          margin: 0;
          color: rgba(255,255,255,0.8);
          font-size: 0.8rem;
        }
        .section-confirm-actions {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ============================================
           RESPONSIVE
           ============================================ */
        @media (max-width: 1024px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
          .grid-3 { grid-template-columns: repeat(2, 1fr); }
          .tab {
            padding: 0.6rem 1.2rem;
            font-size: 0.85rem;
            min-height: 44px;
          }
          .tab svg {
            width: 18px;
            height: 18px;
          }
          .pie-chart-wrapper {
            width: 170px;
            height: 170px;
          }
        }

        @media (max-width: 768px) {
          .overview-container { padding: 12px; }
          .grid-4 { grid-template-columns: repeat(2, 1fr); gap: 0.4rem; }
          .grid-3 { grid-template-columns: repeat(2, 1fr); gap: 0.4rem; }
          .grid-2 { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .app-header h1 { font-size: clamp(1rem, 3vw, 1.3rem); }
          .app-header p { font-size: 0.7rem; }
          
          .tabs { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 0.4rem;
          }
          .tab { 
            width: 100%; 
            padding: 0.5rem 0.4rem; 
            font-size: 0.75rem; 
            justify-content: center;
            min-height: 40px;
          }
          .tab svg {
            width: 16px;
            height: 16px;
          }
          
          .list-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; }
          .list-item .amount { font-size: clamp(0.7rem, 1.5vw, 0.8rem); }

          .pie-chart-container {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .pie-chart-wrapper {
            width: 160px;
            height: 160px;
          }

          .pie-legend {
            width: 100%;
            min-width: 0;
          }

          .legend-item {
            grid-template-columns: 12px minmax(0, 1fr) max-content max-content;
            font-size: 0.75rem;
            gap: 0.35rem;
          }
        }

        @media (max-width: 480px) {
          .overview-container { padding: 8px; }
          .glass-card { padding: 0.7rem; border-radius: 12px; }
          .grid-4 { grid-template-columns: repeat(2, 1fr); gap: 0.3rem; }
          .grid-3 { grid-template-columns: 1fr; gap: 0.3rem; }
          .number-box { padding: 0.5rem; border-radius: 10px; }
          .number-box .value { font-size: clamp(0.9rem, 3.5vw, 1.1rem); }
          .number-box .label { font-size: 0.55rem; }
          .section-header h3 { font-size: 0.8rem; }
          .btn-glass { font-size: 0.7rem; padding: 0.35rem 0.6rem; min-height: 32px; }
          
          .tabs { 
            grid-template-columns: repeat(2, 1fr); 
            gap: 0.3rem; 
          }
          .tab { 
            font-size: 0.65rem; 
            padding: 0.4rem 0.3rem;
            min-height: 36px;
          }
          .tab svg {
            width: 14px;
            height: 14px;
          }
          
          .list-item { padding: 0.5rem 0.6rem; border-radius: 10px; }
          .list-item .info .name { font-size: 0.75rem; }
          .list-item .info .detail { font-size: 0.6rem; }
          .list-item .amount { font-size: 0.8rem; }

          .pie-chart-wrapper {
            width: 140px;
            height: 140px;
          }

          .pie-legend {
            gap: 0.3rem;
          }

          .legend-item {
            grid-template-columns: 10px minmax(0, 1fr) max-content max-content;
            font-size: 0.7rem;
            gap: 0.3rem;
            padding: 0.15rem 0;
          }

          .legend-color {
            width: 10px;
            height: 10px;
          }

          .legend-percentage {
            font-size: 0.65rem;
          }

          .month-selector { padding: 0.3rem 0.6rem; gap: 0.5rem; }
          .month-selector select { min-width: 110px; font-size: 0.7rem; padding: 0.3rem 0.5rem; }
          .month-selector span { font-size: 0.65rem; }
          .month-selector span:last-child { font-size: 0.6rem; }
        }

        @media (max-width: 360px) {
          .overview-container { padding: 4px; }
          .glass-card { padding: 0.5rem; border-radius: 10px; }
          .grid-4 { grid-template-columns: 1fr 1fr; gap: 0.25rem; }
          .number-box { padding: 0.4rem; }
          .number-box .value { font-size: 0.85rem; }
          .number-box .label { font-size: 0.5rem; }
          
          .tabs { 
            grid-template-columns: 1fr 1fr; 
          }
          .tab { 
            font-size: 0.55rem; 
            padding: 0.35rem 0.2rem;
            min-height: 32px;
          }
          .tab svg {
            width: 12px;
            height: 12px;
          }

          .pie-chart-wrapper {
            width: 120px;
            height: 120px;
          }

          .legend-item {
            font-size: 0.6rem;
            grid-template-columns: 8px minmax(0, 1fr) max-content max-content;
            gap: 0.2rem;
          }

          .legend-color {
            width: 8px;
            height: 8px;
          }
        }

        /* Scrollbar */
        .overview-container::-webkit-scrollbar,
        .category-options::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .overview-container::-webkit-scrollbar-track,
        .category-options::-webkit-scrollbar-track {
          background: rgba(15,23,42,0.2);
        }
        .overview-container::-webkit-scrollbar-thumb,
        .category-options::-webkit-scrollbar-thumb {
          background: rgba(124,58,237,0.25);
          border-radius: 4px;
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
          <button
            className="btn-glass btn-refresh"
            onClick={() => {
              if (refreshing) return;
              fetchAllData({ silent: true }).then(() => showSuccess('overview', 'Refreshed!'));
            }}
            disabled={refreshing}
          >
            <RefreshCw size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* ============================================
          MONTH SELECTOR
          ============================================ */}
      <div className="glass-card" style={{ padding: '0.4rem 0.6rem' }}>
        <div className="month-selector">
          <Calendar size={18} color="#A78BFA" />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Select Month:</span>
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
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>
            {selectedMonth}
          </span>
        </div>
      </div>

      {/* ============================================
          TABS - INCREASED SIZE
          ============================================ */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <PieChart size={20} /> Overview
        </button>
        <button className={`tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
          <CreditCard size={20} /> Expenses
        </button>
        <button className={`tab ${activeTab === 'loans' ? 'active' : ''}`} onClick={() => setActiveTab('loans')}>
          <HandCoins size={20} /> Loans
        </button>
        <button className={`tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          <Wallet size={20} /> Payments
        </button>
        <button className={`tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
          <TrendingUp size={20} /> Performance
        </button>
        <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          <BarChart3 size={20} /> Summary
        </button>
      </div>

      {/* ============================================
          OVERVIEW TAB
          ============================================ */}
      {activeTab === 'overview' && (
        <div data-overview-section="financial-review">
          {/* Financial Review */}
          <div className={`glass-card ${editingSection === 'Financial Review' ? 'editing' : ''}`}>
            <SectionHeader
              title={`Financial Review (${selectedMonth})`}
              icon={<Briefcase size={17} />}
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
                  <input className="edit-input" type="text" value={financialReview.total_business || ''} onChange={(e) => handleFinancialChange('total_business', e.target.value)} placeholder="0" style={{ fontSize: '1.1rem', fontWeight: 800, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.2rem 0.4rem', color: '#fff', width: '100%' }} />
                ) : (
                  <div className="value purple">{formatNumber(financialReview.total_business)}</div>
                )}
                <div className="sub">Active Businesses</div>
              </div>
              <div className="number-box">
                <div className="label">Total Works</div>
                {editingSection === 'Financial Review' ? (
                  <input className="edit-input" type="text" value={financialReview.total_works || ''} onChange={(e) => handleFinancialChange('total_works', e.target.value)} placeholder="0" style={{ fontSize: '1.1rem', fontWeight: 800, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.2rem 0.4rem', color: '#fff', width: '100%' }} />
                ) : (
                  <div className="value blue">{formatNumber(financialReview.total_works)}</div>
                )}
                <div className="sub">Ongoing Projects</div>
              </div>
              <div className="number-box">
                <div className="label">Business Payment</div>
                {editingSection === 'Financial Review' ? (
                  <input className="edit-input" type="text" value={financialReview.business_payment || ''} onChange={(e) => handleFinancialChange('business_payment', e.target.value)} placeholder="0" style={{ fontSize: '1.1rem', fontWeight: 800, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.2rem 0.4rem', color: '#fff', width: '100%' }} />
                ) : (
                  <div className="value green">{formatCurrency(financialReview.business_payment)}</div>
                )}
                <div className="sub">Total Received</div>
              </div>
              <div className="number-box">
                <div className="label">Work Payment</div>
                {editingSection === 'Financial Review' ? (
                  <input className="edit-input" type="text" value={financialReview.work_payment || ''} onChange={(e) => handleFinancialChange('work_payment', e.target.value)} placeholder="0" style={{ fontSize: '1.1rem', fontWeight: 800, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.2rem 0.4rem', color: '#fff', width: '100%' }} />
                ) : (
                  <div className="value gold">{formatCurrency(financialReview.work_payment)}</div>
                )}
                <div className="sub">Total Earned</div>
              </div>
            </div>
            <div className="grid-4" style={{ marginTop: '0.5rem' }}>
              <div className="number-box" style={{ background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.12)' }}>
                <div className="label">Total Savings</div>
                <div className="value green">{formatCurrency(selectedMonthSavings)}</div>
                <div className="sub">Selected month only</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.12)' }}>
                <div className="label">Total Expenses</div>
                <div className="value red">{formatCurrency(selectedMonthExpenses)}</div>
                <div className="sub">Selected month only</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.12)' }}>
                <div className="label">Total Borrow</div>
                <div className="value orange">{formatCurrency(selectedMonthBorrow)}</div>
                <div className="sub">Selected month only</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(124,58,237,0.04)', borderColor: 'rgba(124,58,237,0.12)' }}>
                <div className="label">Total Loan EMI</div>
                <div className="value purple">{formatCurrency(selectedMonthLoanEmi)}</div>
                <div className="sub">Selected month only</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid-4">
            <div className="number-box" style={{ background: 'rgba(16,185,129,0.04)' }}>
              <div className="label">Total Income</div>
              <div className="value green">{formatCurrency(selectedMonthIncome)}</div>
            </div>
            <div className="number-box" style={{ background: 'rgba(239,68,68,0.04)' }}>
              <div className="label">Total Expenses</div>
              <div className="value red">{formatCurrency(selectedMonthExpenses)}</div>
            </div>
            <div className="number-box" style={{ background: 'rgba(245,158,11,0.04)' }}>
              <div className="label">Pending Payments</div>
              <div className="value orange">{formatCurrency(pendingPayments)}</div>
            </div>
            <div className="number-box" style={{ background: 'rgba(124,58,237,0.04)' }}>
              <div className="label">Net Profit</div>
              <div className="value purple">{formatCurrency(selectedMonthIncome - selectedMonthExpenses)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          EXPENSES TAB
          ============================================ */}
      {activeTab === 'expenses' && (
        <div data-overview-section="expenses">
          {showExpenseForm && (
            <div className="form-container">
              <h4 style={{ marginBottom: '0.5rem', color: '#A78BFA', fontSize: '0.9rem' }}>{editingExpenseId !== null ? 'Edit Expense' : 'Add New Expense'}</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <div className="category-picker">
                    <input
                      type="text"
                      value={newExpense.category}
                      onFocus={() => setExpenseCategoryOpen(true)}
                      onBlur={() => setTimeout(() => setExpenseCategoryOpen(false), 150)}
                      onChange={(e) => handleExpenseChange('category', e.target.value)}
                      placeholder="Select or type a category"
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
              icon={<CreditCard size={17} color="#7C3AED" />}
              onAdd={() => {
                cancelExpenseForm();
                setNewExpense({ category: '', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' });
                setShowExpenseForm(true);
              }}
            />
            {renderSectionFeedback('expenses')}
            
            {expensePieData.length > 0 && (
              <div style={{ marginBottom: '0.8rem' }}>
                <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Category Breakdown
                </h4>
                <PieChartComponent 
                  data={expensePieData} 
                  total={expensePieData.reduce((sum, d) => sum + d.amount, 0)}
                  colors={['#F59E0B','#10B981','#7C3AED','#4F6BFF','#2EA8FF','#F43F5E','#8B5CF6']}
                />
              </div>
            )}

            <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Expense Records
            </h4>
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
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-glass btn-danger" onClick={() => deleteExpense(exp.id)} style={{ padding: '0.15rem 0.4rem' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          LOANS TAB
          ============================================ */}
      {activeTab === 'loans' && (
        <div data-overview-section="loans">
          {showLoanForm && (
            <div className="form-container">
              <h4 style={{ marginBottom: '0.5rem', color: '#A78BFA', fontSize: '0.9rem' }}>{editingLoanId !== null ? 'Edit Loan/Borrow' : 'Add New Loan/Borrow'}</h4>
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
              icon={<HandCoins size={17} color="#F43F5E" />}
              onAdd={() => {
                cancelLoanForm();
                setNewLoan({ name: '', amount: '', emi: '', loan_date: new Date().toISOString().split('T')[0], type: 'Borrow', notes: '' });
                setShowLoanForm(true);
              }}
            />
            {renderSectionFeedback('loans')}
            
            <div className="grid-3" style={{ marginBottom: '0.8rem' }}>
              <div className="number-box" style={{ background: 'rgba(245,158,11,0.04)' }}>
                <div className="label">Total Borrow</div>
                <div className="value orange">{formatCurrency(totalBorrow)}</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(124,58,237,0.04)' }}>
                <div className="label">Total Loans</div>
                <div className="value purple">{formatCurrency(totalLoans)}</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(16,185,129,0.04)' }}>
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
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-glass btn-danger" onClick={() => deleteLoan(loan.id)} style={{ padding: '0.15rem 0.4rem' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          PAYMENTS TAB
          ============================================ */}
      {activeTab === 'payments' && (
        <div data-overview-section="payments">
          {showPaymentForm && (
            <div className="form-container">
              <h4 style={{ marginBottom: '0.5rem', color: '#A78BFA', fontSize: '0.9rem' }}>{editingPaymentId !== null ? 'Edit Payment' : 'Add New Payment'}</h4>
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
              icon={<Wallet size={17} color="#F59E0B" />}
              onAdd={() => {
                cancelPaymentForm();
                setNewPayment({ person_name: '', amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '', status: 'pending' });
                setShowPaymentForm(true);
              }}
            />
            {renderSectionFeedback('payments')}
            
            <div className="grid-3" style={{ marginBottom: '0.8rem' }}>
              <div className="number-box" style={{ background: 'rgba(245,158,11,0.04)' }}>
                <div className="label">Total Pending</div>
                <div className="value orange">{formatCurrency(pendingPayments)}</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(16,185,129,0.04)' }}>
                <div className="label">Total Received</div>
                <div className="value green">{formatCurrency(payments.filter(p => p.status === 'received').reduce((sum, p) => sum + parseFloat(p.amount), 0))}</div>
              </div>
              <div className="number-box" style={{ background: 'rgba(239,68,68,0.04)' }}>
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
                        <Edit2 size={13} />
                      </button>
                      {payment.status !== 'received' && (
                        <button className="btn-glass btn-success" onClick={() => updatePaymentStatus(payment.id, 'received')} style={{ padding: '0.15rem 0.4rem', fontSize: '0.5rem' }}>
                          <CheckCircle size={13} />
                        </button>
                      )}
                      <button className="btn-glass btn-danger" onClick={() => deletePayment(payment.id)} style={{ padding: '0.15rem 0.4rem' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          PERFORMANCE TAB
          ============================================ */}
      {activeTab === 'performance' && (
        <div data-overview-section="performance">
          <div className="glass-card" style={{ padding: '0.4rem 0.6rem', marginBottom: '0.8rem' }}>
            <div className="week-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', padding: '0.4rem 0.6rem' }}>
              <Calendar size={17} color="#4F6BFF" />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Select Week:</span>
              <select
                value={selectedWeek.key}
                onChange={(e) => {
                  const week = getWeeksForMonth(selectedMonth).find(item => item.key === e.target.value);
                  if (week) setSelectedWeek(week);
                }}
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '8px', background: '#fff', color: '#111827', border: '1px solid #d1d5db', outline: 'none' }}
              >
                {getWeeksForMonth(selectedMonth).map((week, index) => (
                  <option key={week.key} value={week.key}>Week {index + 1}: {week.label}</option>
                ))}
              </select>
            </div>
          </div>

          {weeklyPerformance ? (
            <div className="glass-card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.8rem', color: '#4F6BFF' }}>
                <Calendar size={17} /> Weekly Performance ({formatDate(weeklyPerformance.week_start)} to {formatDate(weeklyPerformance.week_end)})
              </h3>
              <div className="grid-4">
                <div className="number-box"><div className="label">Total Income</div><div className="value green">{formatCurrency(weeklyPerformance.totalIncome)}</div></div>
                <div className="number-box"><div className="label">Total Expenses</div><div className="value red">{formatCurrency(weeklyPerformance.totalExpenses)}</div></div>
                <div className="number-box"><div className="label">Total Savings</div><div className="value purple">{formatCurrency(weeklyPerformance.totalSavings)}</div></div>
                <div className="number-box"><div className="label">Highest Expense Day</div><div className="value orange">{weeklyPerformance.highestExpenseDay?.day || '-'}</div></div>
              </div>
              {weeklyPerformance.pieData && weeklyPerformance.pieData.length > 0 && (
                <div style={{ marginTop: '0.8rem' }}>
                  <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Weekly Expense Breakdown
                  </h4>
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
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.8rem', color: '#7C3AED' }}>
                <BarChart3 size={17} /> Monthly Performance ({monthlyPerformance.monthName} {monthlyPerformance.year})
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
                  <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Monthly Expense Breakdown
                  </h4>
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
        </div>
      )}

      {/* ============================================
          SUMMARY TAB
          ============================================ */}
      {activeTab === 'summary' && (
        <div data-overview-section="summary">
          {summary ? (
            <>
              <div className="glass-card">
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.8rem', color: '#FBBF24' }}>
                  <Trophy size={17} /> All-Time Summary
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
                  <div className="number-box" style={{ background: netTotalSavings >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)' }}>
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
                  <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Income vs Expenses vs Savings
                  </h4>
                  <PieChartComponent 
                    data={summaryPieData}
                    total={summaryPieData.reduce((sum, d) => sum + d.amount, 0)}
                    colors={['#10B981','#F43F5E','#F59E0B']}
                  />
                </div>
              )}

              {summary.monthlyTrends && summary.monthlyTrends.length > 0 && (
                <div className="glass-card">
                  <h4 style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Monthly Trends
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.3rem' }}>
                    {summary.monthlyTrends.map((trend, index) => (
                      <div key={index} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '0.5rem 0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{trend.monthName} {trend.year}</span>
                          <span style={{ fontSize: '0.65rem', color: trend.savings >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
                            {trend.savings >= 0 ? '▲' : '▼'} {formatCurrency(trend.savings)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem' }}>
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
        </div>
      )}

    </div>
  );
};

export default Overview;