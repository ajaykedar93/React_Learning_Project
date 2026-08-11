import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Clock as ClockIcon, Filter, 
  Plus, X, Edit2, Save, Trash2, RefreshCw, 
  CheckCircle, AlertCircle, Eye, EyeOff, User, Calendar, 
  IndianRupee, Tag, FileText, DollarSign
} from 'lucide-react';

// =========================================================
// PROFESSIONAL GLASS SELECT
// =========================================================
const GlassSelect = ({ value, onChange, options, className = '', disabled = false, style = {}, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, []);

  const selected = options.find((option) => String(option.value) === String(value)) || options[0];

  return (
    <div
      ref={ref}
      className={`glass-select ${open ? 'is-open' : ''} ${className}`}
      style={style}
    >
      <button
        type="button"
        className="glass-select-trigger"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="glass-select-value">{selected?.label ?? ''}</span>
        <span className="glass-select-chevron">⌄</span>
      </button>

      {open && !disabled && (
        <div className="glass-select-menu" role="listbox">
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              key={String(option.value)}
              className={`glass-select-option ${
                String(option.value) === String(value) ? 'selected' : ''
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {String(option.value) === String(value) && <span className="glass-select-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Transactions = () => {
  // =============================================
  // STATE
  // =============================================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    person_name: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    type: 'Give',
    status: 'Pending',
    notes: ''
  });

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTransaction, setViewTransaction] = useState(null);
  
  // USER & API
  const [userId] = useState(1);
  const API_BASE = "https://express-project-learning-new.onrender.com/api/personal-transactions";

  // =============================================
  // FORMAT FUNCTIONS
  // =============================================
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateFull = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // =============================================
  // FETCH DATA
  // =============================================
  useEffect(() => {
    fetchTransactions(true);
    fetchSummary();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchTransactions = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/${userId}`);
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || `Transactions API returned ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(`Failed to load transactions: ${err.message}`);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/summary/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSummary(result.data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  // =============================================
  // ADD TRANSACTION
  // =============================================
  const handleAddTransaction = async () => {
    if (!newTransaction.person_name || !newTransaction.amount) {
      setError('Person name and amount are required');
      return;
    }

    if (parseFloat(newTransaction.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        user_id: userId,
        person_name: newTransaction.person_name,
        amount: parseFloat(newTransaction.amount),
        transaction_date: newTransaction.transaction_date,
        type: newTransaction.type,
        status: newTransaction.status,
        notes: newTransaction.notes
      };

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('✅ Transaction added successfully!');
        setShowAddModal(false);
        setNewTransaction({
          person_name: '',
          amount: '',
          transaction_date: new Date().toISOString().split('T')[0],
          type: 'Give',
          status: 'Pending',
          notes: ''
        });
        await fetchTransactions();
        await fetchSummary();
      } else {
        throw new Error(result.message || 'Failed to add transaction');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // =============================================
  // UPDATE TRANSACTION
  // =============================================
  const handleEdit = (tx) => {
    setEditingId(tx.id);
    setEditData({ ...tx });
  };

  const handleSave = async (id) => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        person_name: editData.person_name,
        amount: parseFloat(editData.amount),
        transaction_date: editData.transaction_date,
        type: editData.type,
        status: editData.status,
        notes: editData.notes || ''
      };

      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('✅ Transaction updated successfully!');
        setEditingId(null);
        await fetchTransactions();
        await fetchSummary();
      } else {
        throw new Error(result.message || 'Failed to update transaction');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  // =============================================
  // DELETE TRANSACTION
  // =============================================
  const handleDelete = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_BASE}/${deleteId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('✅ Transaction deleted successfully!');
        setShowDeleteModal(false);
        setDeleteId(null);
        await fetchTransactions();
        await fetchSummary();
      } else {
        throw new Error(result.message || 'Failed to delete transaction');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // =============================================
  // VIEW TRANSACTION
  // =============================================
  const handleView = (tx) => {
    setViewTransaction(tx);
    setShowViewModal(true);
  };

  // =============================================
  // FILTER TRANSACTIONS
  // =============================================
  const getFilteredTransactions = () => {
    let filtered = transactions;

    if (searchQuery) {
      filtered = filtered.filter(tx =>
        tx.person_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  // =============================================
  // RENDER
  // =============================================
  if (loading) {
    return (
      <div className="transactions-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        background: 'linear-gradient(135deg, #0f1026 0%, #171735 52%, #101126 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(124,58,237,0.15)',
            borderTopColor: '#7C3AED',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1.5rem'
          }}></div>
          <p style={{ color: '#A5B4FC', fontSize: '0.9rem', fontWeight: '600' }}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-wrapper">
      <style>{`
        /* =========================================================
           GLOBAL RESET & BASE
           ========================================================= */
        .transactions-wrapper {
          width: 100%;
          max-width: 100%;
          min-height: 100vh;
          background: radial-gradient(circle at 12% 8%, rgba(124,58,237,.12), transparent 34%),
                      radial-gradient(circle at 88% 18%, rgba(79,70,229,.10), transparent 36%),
                      linear-gradient(135deg, #0f1026 0%, #171735 52%, #101126 100%);
          padding: 12px;
          box-sizing: border-box;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-x: hidden;
        }

        .transactions-wrapper * {
          box-sizing: border-box;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* =========================================================
           GLASS CARDS
           ========================================================= */
        .glass-card {
          background: linear-gradient(145deg, rgba(39,39,70,.92), rgba(28,29,58,.88));
          border: 1px solid rgba(167,139,250,.22);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.06);
          backdrop-filter: blur(16px) saturate(130%);
          -webkit-backdrop-filter: blur(16px) saturate(130%);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .glass-card:hover {
          border-color: rgba(167,139,250,.38);
          box-shadow: 0 12px 40px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.08);
        }

        /* =========================================================
           GLASS SELECT (Custom Dropdown)
           ========================================================= */
        .glass-select {
          position: relative;
          width: 100%;
          z-index: 30;
        }

        .glass-select-trigger {
          width: 100%;
          min-height: 40px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: rgba(15,23,42,.78);
          color: #F8FAFC;
          border: 1px solid rgba(167,139,250,.25);
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .glass-select-trigger:hover {
          background: rgba(30,30,60,.92);
          border-color: rgba(167,139,250,.45);
        }

        .glass-select.is-open .glass-select-trigger {
          border-color: #8B5CF6;
          box-shadow: 0 0 0 3px rgba(139,92,246,.15);
        }

        .glass-select-value {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #F8FAFC;
        }

        .glass-select-chevron {
          color: #C4B5FD;
          font-size: 16px;
          transition: transform 0.25s ease;
        }

        .glass-select.is-open .glass-select-chevron {
          transform: rotate(180deg);
        }

        .glass-select-menu {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 6px);
          width: 100%;
          max-height: 220px;
          overflow-y: auto;
          padding: 4px;
          background: rgba(20,21,48,.98);
          border: 1px solid rgba(167,139,250,.30);
          border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 100000;
        }

        .glass-select-option {
          width: 100%;
          min-height: 38px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: transparent;
          color: #E2E8F0;
          border: 0;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .glass-select-option:hover {
          background: rgba(124,58,237,.25);
          color: #FFFFFF;
        }

        .glass-select-option.selected {
          background: rgba(124,58,237,.30);
          color: #FFFFFF;
        }

        .glass-select-check {
          color: #C4B5FD;
          font-weight: 900;
        }

        /* =========================================================
           BUTTONS
           ========================================================= */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid rgba(167,139,250,.25);
          background: rgba(255,255,255,.06);
          color: #F8FAFC;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn:hover {
          background: rgba(255,255,255,.12);
          border-color: rgba(167,139,250,.45);
          transform: translateY(-1px);
        }

        .btn:active {
          transform: translateY(1px) scale(.98);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7C3AED, #4F46E5);
          border-color: rgba(196,181,253,.40);
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(124,58,237,.25);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #8B5CF6, #6366F1);
          border-color: rgba(196,181,253,.55);
          box-shadow: 0 6px 24px rgba(124,58,237,.35);
        }

        .btn-success {
          background: rgba(16,185,129,.18);
          border-color: rgba(16,185,129,.30);
          color: #6EE7B7;
        }

        .btn-success:hover {
          background: rgba(16,185,129,.28);
          border-color: rgba(16,185,129,.45);
        }

        .btn-danger {
          background: rgba(239,68,68,.16);
          border-color: rgba(239,68,68,.30);
          color: #FCA5A5;
        }

        .btn-danger:hover {
          background: rgba(239,68,68,.26);
          border-color: rgba(239,68,68,.45);
        }

        .btn-outline {
          background: transparent;
          border-color: rgba(167,139,250,.20);
          color: #C4B5FD;
        }

        .btn-outline:hover {
          background: rgba(167,139,250,.10);
          border-color: rgba(167,139,250,.40);
        }

        .btn-sm {
          min-height: 32px;
          padding: 0 10px;
          font-size: 0.68rem;
        }

        .btn-icon {
          width: 34px;
          height: 34px;
          min-width: 34px;
          padding: 0;
          border-radius: 8px;
        }

        /* =========================================================
           BADGES
           ========================================================= */
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 3px 12px;
          border-radius: 999px;
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.3px;
          white-space: nowrap;
          text-transform: uppercase;
        }

        .badge-pending {
          background: rgba(245,158,11,.15);
          color: #FCD34D;
          border: 1px solid rgba(245,158,11,.30);
        }

        .badge-received {
          background: rgba(16,185,129,.15);
          color: #6EE7B7;
          border: 1px solid rgba(16,185,129,.30);
        }

        .badge-give {
          background: rgba(239,68,68,.15);
          color: #FDA4AF;
          border: 1px solid rgba(239,68,68,.28);
        }

        .badge-take {
          background: rgba(16,185,129,.15);
          color: #6EE7B7;
          border: 1px solid rgba(16,185,129,.28);
        }

        /* =========================================================
           SUMMARY CARDS
           ========================================================= */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }

        .summary-item {
          background: rgba(15,23,42,.50);
          border: 1px solid rgba(167,139,250,.12);
          border-radius: 12px;
          padding: 12px 16px;
          text-align: center;
          transition: all 0.25s ease;
        }

        .summary-item:hover {
          border-color: rgba(167,139,250,.28);
          background: rgba(20,30,55,.60);
        }

        .summary-label {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94A3B8;
          margin-bottom: 4px;
        }

        .summary-value {
          font-size: 1.15rem;
          font-weight: 800;
        }

        .summary-value.pending { color: #FBBF24; }
        .summary-value.received { color: #34D399; }
        .summary-value.give { color: #FB7185; }
        .summary-value.take { color: #A78BFA; }

        /* =========================================================
           TABLE
           ========================================================= */
        .table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 12px;
          background: rgba(15,23,42,.45);
          border: 1px solid rgba(167,139,250,.12);
        }

        .table {
          width: 100%;
          min-width: 820px;
          border-collapse: collapse;
          font-size: 0.75rem;
        }

        .table thead th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 700;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #94A3B8;
          border-bottom: 1px solid rgba(167,139,250,.10);
          background: rgba(20,25,50,.50);
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .table thead th:last-child { text-align: center; }
        .table thead th:nth-child(2) { text-align: right; }
        .table thead th:nth-child(4),
        .table thead th:nth-child(5) { text-align: center; }

        .table tbody tr {
          transition: background 0.15s ease;
          border-bottom: 1px solid rgba(167,139,250,.06);
        }

        .table tbody tr:hover {
          background: rgba(124,58,237,.06);
        }

        .table tbody td {
          padding: 10px 12px;
          vertical-align: middle;
          color: #E2E8F0;
          font-size: 0.75rem;
        }

        .table tbody td:last-child { text-align: center; }
        .table tbody td:nth-child(2) { text-align: right; }
        .table tbody td:nth-child(4),
        .table tbody td:nth-child(5) { text-align: center; }

        .table .name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #F8FAFC;
        }

        .table .name-cell .icon-give { color: #FB7185; }
        .table .name-cell .icon-take { color: #34D399; }

        .table .amount-give { color: #FB7185; font-weight: 700; }
        .table .amount-take { color: #34D399; font-weight: 700; }

        .table .date-cell {
          color: #94A3B8;
          font-size: 0.7rem;
        }

        .table .notes-cell {
          color: #94A3B8;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .table .actions-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        /* =========================================================
           MODALS
           ========================================================= */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(4,5,16,.72);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: fadeInUp 0.25s ease;
        }

        .modal {
          width: min(520px, 100%);
          max-height: calc(100vh - 32px);
          overflow-y: auto;
          padding: 24px 28px;
          background: linear-gradient(145deg, rgba(39,39,70,.98), rgba(28,29,58,.96));
          border: 1px solid rgba(167,139,250,.28);
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,.50), inset 0 1px 0 rgba(255,255,255,.06);
          animation: fadeInUp 0.3s ease;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(167,139,250,.12);
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1rem;
          font-weight: 700;
          color: #F8FAFC;
          margin: 0;
        }

        .modal-title .icon { color: #A78BFA; }

        .modal-close {
          width: 34px;
          height: 34px;
          min-width: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239,68,68,.12);
          border: 1px solid rgba(239,68,68,.25);
          border-radius: 8px;
          color: #FCA5A5;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: rgba(239,68,68,.22);
          border-color: rgba(239,68,68,.45);
        }

        .modal-body {
          color: #E2E8F0;
        }

        /* Form */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group.full { grid-column: 1 / -1; }

        .form-label {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #94A3B8;
        }

        .form-input {
          width: 100%;
          min-height: 42px;
          padding: 0 12px;
          background: rgba(15,23,42,.78);
          border: 1px solid rgba(167,139,250,.22);
          border-radius: 10px;
          color: #F8FAFC;
          font-size: 0.78rem;
          font-weight: 600;
          transition: all 0.2s ease;
          outline: none;
        }

        .form-input::placeholder {
          color: #64748B;
        }

        .form-input:focus {
          border-color: #8B5CF6;
          box-shadow: 0 0 0 3px rgba(139,92,246,.14);
          background: rgba(20,25,55,.90);
        }

        .form-input.textarea {
          min-height: 70px;
          padding: 10px 12px;
          resize: vertical;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(167,139,250,.10);
        }

        /* View Modal Detail Rows */
        .detail-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(167,139,250,.07);
        }

        .detail-row:last-child { border-bottom: 0; }

        .detail-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #94A3B8;
        }

        .detail-value {
          font-size: 0.82rem;
          font-weight: 600;
          color: #F8FAFC;
          text-align: right;
          word-break: break-word;
        }

        .detail-value .badge {
          font-size: 0.6rem;
        }

        /* Delete Modal */
        .delete-icon {
          font-size: 2.8rem;
          text-align: center;
          margin-bottom: 8px;
        }

        .delete-text {
          text-align: center;
          color: #E2E8F0;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .delete-sub {
          text-align: center;
          color: #94A3B8;
          font-size: 0.7rem;
          margin-top: 4px;
        }

        /* =========================================================
           RESPONSIVE
           ========================================================= */
        @media (max-width: 768px) {
          .transactions-wrapper {
            padding: 8px;
          }

          .glass-card {
            padding: 0.9rem;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .summary-value {
            font-size: 1rem;
          }

          /* Mobile Table -> Cards */
          .table-wrap {
            background: transparent;
            border: 0;
            overflow: visible;
          }

          .table {
            min-width: 0;
            display: block;
          }

          .table thead { display: none; }

          .table tbody {
            display: block;
            width: 100%;
          }

          .table tbody tr {
            display: block;
            width: 100%;
            margin-bottom: 10px;
            padding: 12px 14px;
            background: linear-gradient(145deg, rgba(39,39,70,.94), rgba(28,29,58,.90));
            border: 1px solid rgba(167,139,250,.18);
            border-radius: 14px;
            box-shadow: 0 6px 20px rgba(0,0,0,.20);
          }

          .table tbody tr:hover {
            background: linear-gradient(145deg, rgba(48,46,88,.96), rgba(32,31,67,.94));
          }

          .table tbody td {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid rgba(167,139,250,.06);
          }

          .table tbody td:last-child {
            border-bottom: 0;
          }

          .table tbody td::before {
            content: attr(data-label);
            font-size: 0.6rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #94A3B8;
            flex: 0 0 70px;
          }

          .table tbody td .name-cell {
            flex: 1;
            justify-content: flex-end;
          }

          .table tbody td:nth-child(2) { text-align: right; }
          .table tbody td:nth-child(4),
          .table tbody td:nth-child(5) { text-align: right; }
          .table tbody td:last-child { text-align: right; }

          .table .notes-cell {
            max-width: none;
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
          }

          .table .actions-cell {
            justify-content: flex-end;
          }

          /* Modal */
          .modal {
            padding: 18px 16px;
            border-radius: 16px;
            max-height: calc(100vh - 16px);
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .detail-row {
            grid-template-columns: 1fr;
            gap: 4px;
            padding: 8px 0;
          }

          .detail-value {
            text-align: left;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions .btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .transactions-wrapper {
            padding: 4px;
          }

          .glass-card {
            padding: 0.7rem;
            border-radius: 14px;
          }

          .summary-grid {
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }

          .summary-item {
            padding: 8px 12px;
          }

          .summary-value {
            font-size: 0.9rem;
          }

          .table tbody tr {
            padding: 10px 12px;
            border-radius: 12px;
          }

          .table tbody td {
            font-size: 0.7rem;
            padding: 5px 0;
          }

          .table tbody td::before {
            flex: 0 0 60px;
            font-size: 0.55rem;
          }

          .modal {
            padding: 14px 12px;
          }

          .modal-title {
            font-size: 0.9rem;
          }

          .btn {
            font-size: 0.7rem;
            min-height: 34px;
            padding: 0 10px;
          }

          .btn-icon {
            width: 32px;
            height: 32px;
            min-width: 32px;
          }
        }

        @media (max-width: 360px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }

        /* =========================================================
           SCROLLBAR STYLING
           ========================================================= */
        .modal::-webkit-scrollbar,
        .table-wrap::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        .modal::-webkit-scrollbar-track,
        .table-wrap::-webkit-scrollbar-track {
          background: rgba(15,23,42,.30);
        }

        .modal::-webkit-scrollbar-thumb,
        .table-wrap::-webkit-scrollbar-thumb {
          background: rgba(124,58,237,.30);
          border-radius: 4px;
        }

        .modal::-webkit-scrollbar-thumb:hover,
        .table-wrap::-webkit-scrollbar-thumb:hover {
          background: rgba(124,58,237,.50);
        }
      `}</style>

      {/* =========================================================
          SUMMARY CARDS
          ========================================================= */}
      {summary && (
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-label">Pending</div>
            <div className="summary-value pending">{formatCurrency(summary.summary?.totalPending || 0)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Received</div>
            <div className="summary-value received">{formatCurrency(summary.summary?.totalReceived || 0)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Give</div>
            <div className="summary-value give">{formatCurrency(summary.summary?.totalGive || 0)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Take</div>
            <div className="summary-value take">{formatCurrency(summary.summary?.totalTake || 0)}</div>
          </div>
        </div>
      )}

      {/* =========================================================
          MAIN CARD
          ========================================================= */}
      <div className="glass-card">
        {/* Error / Success */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,.12)',
            border: '1px solid rgba(239,68,68,.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#FCA5A5',
            fontSize: '0.8rem',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}
        {successMessage && (
          <div style={{
            background: 'rgba(16,185,129,.12)',
            border: '1px solid rgba(16,185,129,.25)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#6EE7B7',
            fontSize: '0.8rem',
            marginBottom: '12px',
            textAlign: 'center',
            animation: 'slideDown 0.3s ease'
          }}>
            ✅ {successMessage}
          </div>
        )}

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '14px'
        }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#F8FAFC',
            margin: 0
          }}>
            <ClockIcon size={18} color="#A78BFA" /> Transactions
          </h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add
            </button>
            <button className="btn btn-outline" onClick={() => { fetchTransactions(); fetchSummary(); }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '14px',
          alignItems: 'center'
        }}>
          <Filter size={14} color="#94A3B8" />
          <input
            className="form-input"
            placeholder="Search by name or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: '1', minWidth: '140px', maxWidth: '280px' }}
          />
          <GlassSelect
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'Give', label: 'Give' },
              { value: 'Take', label: 'Take' }
            ]}
            style={{ maxWidth: '130px', minWidth: '100px' }}
            ariaLabel="Filter by type"
          />
          <GlassSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Received', label: 'Received' }
            ]}
            style={{ maxWidth: '130px', minWidth: '100px' }}
            ariaLabel="Filter by status"
          />
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Type</th>
                <th>Notes</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px 0', color: '#64748B' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📋</div>
                    <div>No transactions found</div>
                    <div style={{ fontSize: '0.7rem', marginTop: '2px', color: '#475569' }}>Click "Add" to create your first transaction</div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isEditing = editingId === tx.id;
                  return (
                    <tr key={tx.id}>
                      <td data-label="Name">
                        {isEditing ? (
                          <input
                            className="form-input"
                            value={editData.person_name}
                            onChange={(e) => setEditData(prev => ({ ...prev, person_name: e.target.value }))}
                            style={{ minHeight: '34px', fontSize: '0.7rem' }}
                          />
                        ) : (
                          <div className="name-cell">
                            {tx.type === 'Give' 
                              ? <ArrowUpRight size={14} className="icon-give" /> 
                              : <ArrowDownRight size={14} className="icon-take" />}
                            <span>{tx.person_name}</span>
                          </div>
                        )}
                      </td>
                      <td data-label="Amount">
                        {isEditing ? (
                          <input
                            className="form-input"
                            type="number"
                            value={editData.amount}
                            onChange={(e) => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            style={{ minHeight: '34px', fontSize: '0.7rem', width: '80px' }}
                          />
                        ) : (
                          <span className={tx.type === 'Give' ? 'amount-give' : 'amount-take'}>
                            {tx.type === 'Give' ? '−' : '+'}{formatCurrency(tx.amount)}
                          </span>
                        )}
                      </td>
                      <td data-label="Date">
                        {isEditing ? (
                          <input
                            className="form-input"
                            type="date"
                            value={editData.transaction_date}
                            onChange={(e) => setEditData(prev => ({ ...prev, transaction_date: e.target.value }))}
                            style={{ minHeight: '34px', fontSize: '0.7rem' }}
                          />
                        ) : (
                          <span className="date-cell">{formatDate(tx.transaction_date)}</span>
                        )}
                      </td>
                      <td data-label="Status">
                        {isEditing ? (
                          <GlassSelect
                            value={editData.status}
                            onChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                            options={[
                              { value: 'Received', label: 'Received' },
                              { value: 'Pending', label: 'Pending' }
                            ]}
                            style={{ minWidth: '90px' }}
                            ariaLabel="Edit status"
                          />
                        ) : (
                          <span className={`badge ${tx.status === 'Received' ? 'badge-received' : 'badge-pending'}`}>
                            {tx.status}
                          </span>
                        )}
                      </td>
                      <td data-label="Type">
                        {isEditing ? (
                          <GlassSelect
                            value={editData.type}
                            onChange={(value) => setEditData(prev => ({ ...prev, type: value }))}
                            options={[
                              { value: 'Give', label: 'Give' },
                              { value: 'Take', label: 'Take' }
                            ]}
                            style={{ minWidth: '80px' }}
                            ariaLabel="Edit type"
                          />
                        ) : (
                          <span className={`badge ${tx.type === 'Give' ? 'badge-give' : 'badge-take'}`}>
                            {tx.type}
                          </span>
                        )}
                      </td>
                      <td data-label="Notes" className="notes-cell">
                        {isEditing ? (
                          <input
                            className="form-input"
                            value={editData.notes || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add notes"
                            style={{ minHeight: '34px', fontSize: '0.7rem' }}
                          />
                        ) : (
                          tx.notes || '—'
                        )}
                      </td>
                      <td data-label="Actions">
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleSave(tx.id)} disabled={saving}>
                              <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={handleCancel}>
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="actions-cell">
                            <button className="btn btn-outline btn-icon btn-sm" onClick={() => handleView(tx)} title="View">
                              <Eye size={13} />
                            </button>
                            <button className="btn btn-outline btn-icon btn-sm" onClick={() => handleEdit(tx)} title="Edit">
                              <Edit2 size={13} />
                            </button>
                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => { setDeleteId(tx.id); setShowDeleteModal(true); }} title="Delete">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(167,139,250,.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          fontSize: '0.65rem',
          color: '#64748B'
        }}>
          <span>Total: {filteredTransactions.length} transactions</span>
          <span>Updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* =========================================================
          ADD MODAL
          ========================================================= */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">
                <Plus size={18} className="icon" /> Add Transaction
              </h4>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Person Name *</label>
                  <input
                    className="form-input"
                    type="text"
                    value={newTransaction.person_name}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, person_name: e.target.value }))}
                    placeholder="Enter name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    className="form-input"
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={newTransaction.transaction_date}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, transaction_date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <GlassSelect
                    value={newTransaction.type}
                    onChange={(value) => setNewTransaction(prev => ({ ...prev, type: value }))}
                    options={[
                      { value: 'Give', label: 'Give' },
                      { value: 'Take', label: 'Take' }
                    ]}
                    ariaLabel="Transaction type"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <GlassSelect
                    value={newTransaction.status}
                    onChange={(value) => setNewTransaction(prev => ({ ...prev, status: value }))}
                    options={[
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Received', label: 'Received' }
                    ]}
                    ariaLabel="Transaction status"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    className="form-input"
                    type="text"
                    value={newTransaction.notes}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  <X size={14} /> Cancel
                </button>
                <button className="btn btn-success" onClick={handleAddTransaction} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Add Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW MODAL
          ========================================================= */}
      {showViewModal && viewTransaction && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h4 className="modal-title">
                <Eye size={18} className="icon" /> Transaction Details
              </h4>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-list">
                <div className="detail-row">
                  <span className="detail-label">Person</span>
                  <span className="detail-value">{viewTransaction.person_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value" style={{ 
                    color: viewTransaction.type === 'Give' ? '#FB7185' : '#34D399',
                    fontWeight: 800
                  }}>
                    {viewTransaction.type === 'Give' ? '−' : '+'}{formatCurrency(viewTransaction.amount)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{formatDateFull(viewTransaction.transaction_date)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">
                    <span className={`badge ${viewTransaction.type === 'Give' ? 'badge-give' : 'badge-take'}`}>
                      {viewTransaction.type}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    <span className={`badge ${viewTransaction.status === 'Received' ? 'badge-received' : 'badge-pending'}`}>
                      {viewTransaction.status}
                    </span>
                  </span>
                </div>
                {viewTransaction.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Notes</span>
                    <span className="detail-value" style={{ color: '#94A3B8', fontWeight: 400 }}>
                      {viewTransaction.notes}
                    </span>
                  </div>
                )}
                {viewTransaction.created_at && (
                  <div className="detail-row">
                    <span className="detail-label">Created</span>
                    <span className="detail-value" style={{ color: '#64748B', fontSize: '0.7rem', fontWeight: 400 }}>
                      {formatDateFull(viewTransaction.created_at)}
                    </span>
                  </div>
                )}
              </div>
              <div className="form-actions" style={{ borderTop: '1px solid rgba(167,139,250,.08)', marginTop: '12px', paddingTop: '12px' }}>
                <button className="btn btn-outline" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          DELETE MODAL
          ========================================================= */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ borderBottom: '0', marginBottom: '0', paddingBottom: '0' }}>
              <h4 className="modal-title" style={{ color: '#FDA4AF' }}>
                <AlertCircle size={18} color="#FB7185" /> Delete Transaction
              </h4>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-icon">⚠️</div>
              <div className="delete-text">Are you sure you want to delete this transaction?</div>
              <div className="delete-sub">This action cannot be undone.</div>
              <div className="form-actions" style={{ borderTop: '1px solid rgba(167,139,250,.08)', marginTop: '16px', paddingTop: '14px' }}>
                <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                  <Trash2 size={14} /> {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;