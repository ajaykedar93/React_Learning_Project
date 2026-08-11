import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Clock as ClockIcon, Filter, 
  Plus, X, Edit2, Save, Trash2, RefreshCw, 
  AlertCircle, Eye
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
      className={`tx-glass-select ${open ? 'tx-is-open' : ''} ${className}`}
      style={style}
    >
      <button
        type="button"
        className="tx-glass-select-trigger"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="tx-glass-select-value">{selected?.label ?? ''}</span>
        <span className="tx-glass-select-chevron">⌄</span>
      </button>

      {open && !disabled && (
        <div className="tx-glass-select-menu" role="listbox">
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              key={String(option.value)}
              className={`tx-glass-select-option ${
                String(option.value) === String(value) ? 'tx-selected' : ''
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {String(option.value) === String(value) && <span className="tx-glass-select-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Transactions = ({ refreshTrigger }) => {
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
    if (refreshTrigger) {
      fetchTransactions(false);
      fetchSummary();
    }
  }, [refreshTrigger]);

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
      <div className="tx-transactions-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(124,58,237,0.15)',
            borderTopColor: '#7C3AED',
            borderRadius: '50%',
            animation: 'tx-spin 0.8s linear infinite',
            margin: '0 auto 0.8rem'
          }}></div>
          <p style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tx-transactions-container">
      <style>{`
        /* =========================================================
           TRANSACTIONS - ISOLATED STYLES
           All classes prefixed with 'tx-' to avoid conflicts
           ========================================================= */

        @keyframes tx-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes tx-fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes tx-slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tx-transactions-container {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .tx-transactions-container * {
          box-sizing: border-box;
        }

        /* =========================================================
           GLASS CARDS
           ========================================================= */
        .tx-glass-card {
          background: linear-gradient(145deg, rgba(30,30,65,.92), rgba(20,20,50,.88));
          border: 1px solid rgba(167,139,250,.15);
          border-radius: 14px;
          padding: 1rem;
          box-shadow: 0 4px 24px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04);
          backdrop-filter: blur(12px) saturate(130%);
          -webkit-backdrop-filter: blur(12px) saturate(130%);
          transition: border-color 0.25s ease;
        }

        .tx-glass-card:hover {
          border-color: rgba(167,139,250,.28);
        }

        /* =========================================================
           GLASS SELECT
           ========================================================= */
        .tx-glass-select {
          position: relative;
          width: 100%;
          z-index: 30;
        }

        .tx-glass-select-trigger {
          width: 100%;
          min-height: 34px;
          padding: 0 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          background: rgba(15,23,42,.65);
          color: #E2E8F0;
          border: 1px solid rgba(167,139,250,.16);
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .tx-glass-select-trigger:hover {
          background: rgba(30,30,60,.80);
          border-color: rgba(167,139,250,.32);
        }

        .tx-glass-select.tx-is-open .tx-glass-select-trigger {
          border-color: #8B5CF6;
          box-shadow: 0 0 0 3px rgba(139,92,246,.12);
        }

        .tx-glass-select-value {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #E2E8F0;
        }

        .tx-glass-select-chevron {
          color: #94A3B8;
          font-size: 12px;
          transition: transform 0.2s ease;
        }

        .tx-glass-select.tx-is-open .tx-glass-select-chevron {
          transform: rotate(180deg);
        }

        .tx-glass-select-menu {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 4px);
          width: 100%;
          max-height: 180px;
          overflow-y: auto;
          padding: 4px;
          background: rgba(20,21,48,.98);
          border: 1px solid rgba(167,139,250,.22);
          border-radius: 8px;
          box-shadow: 0 12px 40px rgba(0,0,0,.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 100000;
        }

        .tx-glass-select-option {
          width: 100%;
          min-height: 32px;
          padding: 5px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          background: transparent;
          color: #E2E8F0;
          border: 0;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: background 0.12s ease;
        }

        .tx-glass-select-option:hover {
          background: rgba(124,58,237,.18);
          color: #FFFFFF;
        }

        .tx-glass-select-option.tx-selected {
          background: rgba(124,58,237,.24);
          color: #FFFFFF;
        }

        .tx-glass-select-check {
          color: #A78BFA;
          font-weight: 900;
        }

        /* =========================================================
           BUTTONS - DIRECT COLORS WITH GLASS EFFECT
           ========================================================= */
        .tx-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 34px;
          padding: 0 14px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,.12);
          text-shadow: 0 1px 2px rgba(0,0,0,.20);
          position: relative;
          overflow: hidden;
          letter-spacing: 0.2px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .tx-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.10), transparent 50%);
          pointer-events: none;
          border-radius: inherit;
        }

        .tx-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 24px rgba(0,0,0,.30);
        }

        .tx-btn:active {
          transform: translateY(0) scale(.97);
        }

        .tx-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        /* YELLOW */
        .tx-btn-yellow {
          background: #F59E0B;
          border-color: rgba(245,158,11,.35);
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(245,158,11,.25);
        }

        .tx-btn-yellow:hover {
          background: #FBBF24;
          border-color: rgba(245,158,11,.55);
          box-shadow: 0 6px 24px rgba(245,158,11,.35);
        }

        /* GREEN */
        .tx-btn-green {
          background: #10B981;
          border-color: rgba(16,185,129,.35);
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(16,185,129,.25);
        }

        .tx-btn-green:hover {
          background: #34D399;
          border-color: rgba(16,185,129,.55);
          box-shadow: 0 6px 24px rgba(16,185,129,.35);
        }

        /* RED */
        .tx-btn-red {
          background: #EF4444;
          border-color: rgba(239,68,68,.35);
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(239,68,68,.25);
        }

        .tx-btn-red:hover {
          background: #F87171;
          border-color: rgba(239,68,68,.55);
          box-shadow: 0 6px 24px rgba(239,68,68,.35);
        }

        /* PURPLE */
        .tx-btn-purple {
          background: #7C3AED;
          border-color: rgba(124,58,237,.35);
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(124,58,237,.25);
        }

        .tx-btn-purple:hover {
          background: #8B5CF6;
          border-color: rgba(124,58,237,.55);
          box-shadow: 0 6px 24px rgba(124,58,237,.35);
        }

        /* OUTLINE */
        .tx-btn-outline {
          background: rgba(255,255,255,.05);
          border-color: rgba(167,139,250,.16);
          color: #94A3B8;
        }

        .tx-btn-outline:hover {
          background: rgba(167,139,250,.10);
          border-color: rgba(167,139,250,.35);
          color: #C4B5FD;
        }

        /* Sizes */
        .tx-btn-sm {
          min-height: 30px;
          padding: 0 10px;
          font-size: 0.65rem;
          border-radius: 6px;
        }

        .tx-btn-xs {
          min-height: 28px;
          padding: 0 8px;
          font-size: 0.6rem;
          border-radius: 5px;
          gap: 4px;
        }

        /* ICON BUTTONS - ENLARGED */
        .tx-btn-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;
          padding: 0;
          border-radius: 10px;
        }

        .tx-btn-icon svg {
          width: 20px;
          height: 20px;
        }

        .tx-btn-icon.tx-btn-xs {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 9px;
        }

        .tx-btn-icon.tx-btn-xs svg {
          width: 18px;
          height: 18px;
        }

        /* =========================================================
           BADGES
           ========================================================= */
        .tx-badge {
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
          border: 1px solid transparent;
        }

        .tx-badge-pending {
          background: rgba(245,158,11,.14);
          color: #FCD34D;
          border-color: rgba(245,158,11,.22);
        }

        .tx-badge-received {
          background: rgba(16,185,129,.14);
          color: #6EE7B7;
          border-color: rgba(16,185,129,.22);
        }

        .tx-badge-give {
          background: rgba(239,68,68,.14);
          color: #FDA4AF;
          border-color: rgba(239,68,68,.22);
        }

        .tx-badge-take {
          background: rgba(16,185,129,.14);
          color: #6EE7B7;
          border-color: rgba(16,185,129,.22);
        }

        /* =========================================================
           SUMMARY
           ========================================================= */
        .tx-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }

        .tx-summary-item {
          background: rgba(15,23,42,.40);
          border: 1px solid rgba(167,139,250,.08);
          border-radius: 10px;
          padding: 8px 12px;
          text-align: center;
          transition: all 0.25s ease;
        }

        .tx-summary-item:hover {
          border-color: rgba(167,139,250,.20);
          background: rgba(20,30,55,.50);
        }

        .tx-summary-label {
          font-size: 0.55rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #94A3B8;
          margin-bottom: 2px;
        }

        .tx-summary-value {
          font-size: 1.1rem;
          font-weight: 800;
        }

        .tx-summary-value.tx-pending { color: #FBBF24; }
        .tx-summary-value.tx-received { color: #34D399; }
        .tx-summary-value.tx-give { color: #FB7185; }
        .tx-summary-value.tx-take { color: #A78BFA; }

        /* =========================================================
           TABLE
           ========================================================= */
        .tx-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 10px;
          background: rgba(10,15,35,.35);
          border: 1px solid rgba(167,139,250,.06);
        }

        .tx-table {
          width: 100%;
          min-width: 820px;
          border-collapse: collapse;
          font-size: 0.75rem;
        }

        .tx-table thead th {
          padding: 8px 10px;
          text-align: left;
          font-weight: 700;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #94A3B8;
          border-bottom: 1px solid rgba(167,139,250,.06);
          background: rgba(15,20,45,.40);
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .tx-table thead th:last-child { text-align: center; }
        .tx-table thead th:nth-child(2) { text-align: right; }
        .tx-table thead th:nth-child(4),
        .tx-table thead th:nth-child(5) { text-align: center; }

        .tx-table tbody tr {
          transition: background 0.15s ease;
          border-bottom: 1px solid rgba(167,139,250,.04);
        }

        .tx-table tbody tr:hover {
          background: rgba(124,58,237,.04);
        }

        .tx-table tbody td {
          padding: 8px 10px;
          vertical-align: middle;
          color: #E2E8F0;
          font-size: 0.75rem;
        }

        .tx-table tbody td:last-child { text-align: center; }
        .tx-table tbody td:nth-child(2) { text-align: right; }
        .tx-table tbody td:nth-child(4),
        .tx-table tbody td:nth-child(5) { text-align: center; }

        .tx-name-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: #F8FAFC;
        }

        .tx-name-cell .tx-icon-give { color: #FB7185; }
        .tx-name-cell .tx-icon-take { color: #34D399; }

        .tx-amount-give { color: #FB7185; font-weight: 700; }
        .tx-amount-take { color: #34D399; font-weight: 700; }

        .tx-date-cell {
          color: #94A3B8;
          font-size: 0.7rem;
        }

        .tx-notes-cell {
          color: #94A3B8;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tx-actions-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        /* =========================================================
           MODALS
           ========================================================= */
        .tx-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(4,5,16,.78);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          animation: tx-fadeInUp 0.2s ease;
        }

        .tx-modal {
          width: min(500px, 100%);
          max-height: calc(100vh - 32px);
          overflow-y: auto;
          padding: 24px 28px;
          background: linear-gradient(145deg, rgba(35,35,70,.98), rgba(25,25,55,.96));
          border: 1px solid rgba(167,139,250,.22);
          border-radius: 18px;
          box-shadow: 0 20px 56px rgba(0,0,0,.50), inset 0 1px 0 rgba(255,255,255,.05);
          animation: tx-fadeInUp 0.25s ease;
        }

        .tx-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(167,139,250,.08);
        }

        .tx-modal-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
        }

        .tx-modal-title .tx-icon { color: #A78BFA; }

        .tx-modal-close {
          width: 34px;
          height: 34px;
          min-width: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239,68,68,.10);
          border: 1px solid rgba(239,68,68,.18);
          border-radius: 8px;
          color: #FCA5A5;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tx-modal-close:hover {
          background: rgba(239,68,68,.20);
          border-color: rgba(239,68,68,.40);
        }

        .tx-modal-close svg {
          width: 18px;
          height: 18px;
        }

        .tx-modal-body {
          color: #E2E8F0;
        }

        /* Form */
        .tx-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .tx-form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tx-form-group.tx-full { grid-column: 1 / -1; }

        .tx-form-label {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #94A3B8;
        }

        .tx-form-input {
          width: 100%;
          min-height: 36px;
          padding: 0 12px;
          background: rgba(15,23,42,.65);
          border: 1px solid rgba(167,139,250,.14);
          border-radius: 8px;
          color: #F8FAFC;
          font-size: 0.75rem;
          font-weight: 600;
          transition: all 0.2s ease;
          outline: none;
        }

        .tx-form-input::placeholder {
          color: #475569;
        }

        .tx-form-input:focus {
          border-color: #8B5CF6;
          box-shadow: 0 0 0 3px rgba(139,92,246,.10);
          background: rgba(20,25,55,.80);
        }

        .tx-form-input.tx-textarea {
          min-height: 60px;
          padding: 8px 12px;
          resize: vertical;
          font-family: inherit;
        }

        .tx-form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(167,139,250,.06);
        }

        .tx-form-actions .tx-btn {
          min-height: 38px;
          padding: 0 18px;
          font-size: 0.75rem;
        }

        /* Detail Rows */
        .tx-detail-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tx-detail-row {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 14px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(167,139,250,.05);
        }

        .tx-detail-row:last-child { border-bottom: 0; }

        .tx-detail-label {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #94A3B8;
        }

        .tx-detail-value {
          font-size: 0.85rem;
          font-weight: 600;
          color: #FFFFFF;
          text-align: right;
          word-break: break-word;
        }

        .tx-detail-value .tx-badge {
          font-size: 0.6rem;
        }

        /* Delete Modal */
        .tx-delete-icon {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 6px;
        }

        .tx-delete-text {
          text-align: center;
          color: #E2E8F0;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .tx-delete-sub {
          text-align: center;
          color: #94A3B8;
          font-size: 0.7rem;
          margin-top: 4px;
        }

        /* =========================================================
           RESPONSIVE
           ========================================================= */
        @media (max-width: 768px) {
          .tx-glass-card { padding: 0.7rem; border-radius: 12px; }

          .tx-summary-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 5px;
          }

          .tx-summary-item { padding: 6px 10px; }
          .tx-summary-value { font-size: 0.95rem; }

          .tx-table-wrap {
            background: transparent;
            border: 0;
            overflow: visible;
          }

          .tx-table {
            min-width: 0;
            display: block;
          }

          .tx-table thead { display: none; }

          .tx-table tbody {
            display: block;
            width: 100%;
          }

          .tx-table tbody tr {
            display: block;
            width: 100%;
            margin-bottom: 8px;
            padding: 10px 12px;
            background: linear-gradient(145deg, rgba(30,30,65,.94), rgba(20,20,50,.90));
            border: 1px solid rgba(167,139,250,.12);
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,.18);
          }

          .tx-table tbody td {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid rgba(167,139,250,.04);
          }

          .tx-table tbody td:last-child { border-bottom: 0; }

          .tx-table tbody td::before {
            content: attr(data-label);
            font-size: 0.55rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #94A3B8;
            flex: 0 0 60px;
          }

          .tx-table tbody td .tx-name-cell {
            flex: 1;
            justify-content: flex-end;
          }

          .tx-table tbody td:nth-child(2),
          .tx-table tbody td:nth-child(4),
          .tx-table tbody td:nth-child(5),
          .tx-table tbody td:last-child {
            text-align: right;
          }

          .tx-notes-cell {
            max-width: none;
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
          }

          .tx-actions-cell {
            justify-content: flex-end;
          }

          .tx-btn-icon {
            width: 40px;
            height: 40px;
            min-width: 40px;
          }

          .tx-btn-icon svg {
            width: 18px;
            height: 18px;
          }

          .tx-btn-icon.tx-btn-xs {
            width: 38px;
            height: 38px;
            min-width: 38px;
          }

          .tx-btn-icon.tx-btn-xs svg {
            width: 17px;
            height: 17px;
          }

          .tx-modal {
            padding: 16px 18px;
            border-radius: 14px;
          }

          .tx-form-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .tx-detail-row {
            grid-template-columns: 1fr;
            gap: 2px;
            padding: 5px 0;
          }

          .tx-detail-value { text-align: left; }

          .tx-form-actions {
            flex-direction: column-reverse;
          }

          .tx-form-actions .tx-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .tx-glass-card { padding: 0.5rem; border-radius: 10px; }

          .tx-summary-grid {
            grid-template-columns: 1fr 1fr;
            gap: 4px;
          }

          .tx-summary-item { padding: 4px 8px; border-radius: 8px; }
          .tx-summary-value { font-size: 0.85rem; }
          .tx-summary-label { font-size: 0.5rem; }

          .tx-table tbody tr { padding: 8px 10px; border-radius: 8px; }
          .tx-table tbody td { font-size: 0.7rem; padding: 4px 0; }
          .tx-table tbody td::before { flex: 0 0 50px; font-size: 0.5rem; }

          .tx-btn { 
            font-size: 0.7rem; 
            min-height: 30px; 
            padding: 0 10px; 
          }
          
          .tx-btn-icon { 
            width: 38px; 
            height: 38px; 
            min-width: 38px; 
          }
          
          .tx-btn-icon svg {
            width: 17px;
            height: 17px;
          }
          
          .tx-btn-icon.tx-btn-xs { 
            width: 36px; 
            height: 36px; 
            min-width: 36px; 
          }
          
          .tx-btn-icon.tx-btn-xs svg {
            width: 16px;
            height: 16px;
          }

          .tx-modal { 
            padding: 12px 14px; 
            border-radius: 12px; 
          }
          
          .tx-modal-title { 
            font-size: 0.9rem; 
          }

          .tx-badge { 
            font-size: 0.5rem; 
            padding: 2px 8px; 
          }
        }

        @media (max-width: 360px) {
          .tx-summary-grid { grid-template-columns: 1fr; }
        }

        /* Scrollbar */
        .tx-modal::-webkit-scrollbar,
        .tx-table-wrap::-webkit-scrollbar {
          width: 3px;
          height: 3px;
        }

        .tx-modal::-webkit-scrollbar-track,
        .tx-table-wrap::-webkit-scrollbar-track {
          background: rgba(15,23,42,.20);
        }

        .tx-modal::-webkit-scrollbar-thumb,
        .tx-table-wrap::-webkit-scrollbar-thumb {
          background: rgba(124,58,237,.25);
          border-radius: 3px;
        }

        .tx-modal::-webkit-scrollbar-thumb:hover,
        .tx-table-wrap::-webkit-scrollbar-thumb:hover {
          background: rgba(124,58,237,.45);
        }
      `}</style>

      {/* =========================================================
          SUMMARY CARDS
          ========================================================= */}
      {summary && (
        <div className="tx-summary-grid">
          <div className="tx-summary-item">
            <div className="tx-summary-label">Pending</div>
            <div className="tx-summary-value tx-pending">{formatCurrency(summary.summary?.totalPending || 0)}</div>
          </div>
          <div className="tx-summary-item">
            <div className="tx-summary-label">Received</div>
            <div className="tx-summary-value tx-received">{formatCurrency(summary.summary?.totalReceived || 0)}</div>
          </div>
          <div className="tx-summary-item">
            <div className="tx-summary-label">Give</div>
            <div className="tx-summary-value tx-give">{formatCurrency(summary.summary?.totalGive || 0)}</div>
          </div>
          <div className="tx-summary-item">
            <div className="tx-summary-label">Take</div>
            <div className="tx-summary-value tx-take">{formatCurrency(summary.summary?.totalTake || 0)}</div>
          </div>
        </div>
      )}

      {/* =========================================================
          MAIN CARD
          ========================================================= */}
      <div className="tx-glass-card">
        {/* Error / Success */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,.08)',
            border: '1px solid rgba(239,68,68,.16)',
            borderRadius: '7px',
            padding: '8px 12px',
            color: '#FCA5A5',
            fontSize: '0.75rem',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}
        {successMessage && (
          <div style={{
            background: 'rgba(16,185,129,.08)',
            border: '1px solid rgba(16,185,129,.16)',
            borderRadius: '7px',
            padding: '8px 12px',
            color: '#6EE7B7',
            fontSize: '0.75rem',
            marginBottom: '10px',
            textAlign: 'center',
            animation: 'tx-slideDown 0.3s ease'
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
          gap: '8px',
          marginBottom: '12px'
        }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#FFFFFF',
            margin: 0
          }}>
            <ClockIcon size={18} color="#A78BFA" /> Transactions
          </h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button className="tx-btn tx-btn-yellow" onClick={() => setShowAddModal(true)}>
              <Plus size={15} /> Add
            </button>
            <button className="tx-btn tx-btn-outline tx-btn-sm" onClick={() => { fetchTransactions(); fetchSummary(); }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '12px',
          alignItems: 'center'
        }}>
          <Filter size={13} color="#94A3B8" />
          <input
            className="tx-form-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: '1', minWidth: '120px', maxWidth: '220px', minHeight: '34px' }}
          />
          <GlassSelect
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'Give', label: 'Give' },
              { value: 'Take', label: 'Take' }
            ]}
            style={{ maxWidth: '110px', minWidth: '80px' }}
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
            style={{ maxWidth: '110px', minWidth: '80px' }}
            ariaLabel="Filter by status"
          />
        </div>

        {/* Table */}
        <div className="tx-table-wrap">
          <table className="tx-table">
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '28px 0', color: '#475569' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📋</div>
                    <div style={{ fontSize: '0.8rem' }}>No transactions found</div>
                    <div style={{ fontSize: '0.65rem', color: '#334155' }}>Click "Add" to create one</div>
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
                            className="tx-form-input"
                            value={editData.person_name}
                            onChange={(e) => setEditData(prev => ({ ...prev, person_name: e.target.value }))}
                            style={{ minHeight: '32px', fontSize: '0.7rem' }}
                          />
                        ) : (
                          <div className="tx-name-cell">
                            {tx.type === 'Give' 
                              ? <ArrowUpRight size={14} className="tx-icon-give" /> 
                              : <ArrowDownRight size={14} className="tx-icon-take" />}
                            <span>{tx.person_name}</span>
                          </div>
                        )}
                      </td>
                      <td data-label="Amount">
                        {isEditing ? (
                          <input
                            className="tx-form-input"
                            type="number"
                            value={editData.amount}
                            onChange={(e) => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            style={{ minHeight: '32px', fontSize: '0.7rem', width: '80px' }}
                          />
                        ) : (
                          <span className={tx.type === 'Give' ? 'tx-amount-give' : 'tx-amount-take'}>
                            {tx.type === 'Give' ? '−' : '+'}{formatCurrency(tx.amount)}
                          </span>
                        )}
                      </td>
                      <td data-label="Date">
                        {isEditing ? (
                          <input
                            className="tx-form-input"
                            type="date"
                            value={editData.transaction_date}
                            onChange={(e) => setEditData(prev => ({ ...prev, transaction_date: e.target.value }))}
                            style={{ minHeight: '32px', fontSize: '0.65rem' }}
                          />
                        ) : (
                          <span className="tx-date-cell">{formatDate(tx.transaction_date)}</span>
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
                            style={{ minWidth: '80px' }}
                            ariaLabel="Edit status"
                          />
                        ) : (
                          <span className={`tx-badge ${tx.status === 'Received' ? 'tx-badge-received' : 'tx-badge-pending'}`}>
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
                            style={{ minWidth: '70px' }}
                            ariaLabel="Edit type"
                          />
                        ) : (
                          <span className={`tx-badge ${tx.type === 'Give' ? 'tx-badge-give' : 'tx-badge-take'}`}>
                            {tx.type}
                          </span>
                        )}
                      </td>
                      <td data-label="Notes" className="tx-notes-cell">
                        {isEditing ? (
                          <input
                            className="tx-form-input"
                            value={editData.notes || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Notes"
                            style={{ minHeight: '32px', fontSize: '0.65rem' }}
                          />
                        ) : (
                          tx.notes || '—'
                        )}
                      </td>
                      <td data-label="Actions">
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="tx-btn tx-btn-green tx-btn-xs" onClick={() => handleSave(tx.id)} disabled={saving}>
                              <Save size={14} /> {saving ? 'Saving' : 'Save'}
                            </button>
                            <button className="tx-btn tx-btn-red tx-btn-xs" onClick={handleCancel}>
                              <X size={14} /> Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="tx-actions-cell">
                            <button className="tx-btn tx-btn-yellow tx-btn-icon tx-btn-xs" onClick={() => handleView(tx)} title="View">
                              <Eye size={18} />
                            </button>
                            <button className="tx-btn tx-btn-green tx-btn-icon tx-btn-xs" onClick={() => handleEdit(tx)} title="Edit">
                              <Edit2 size={18} />
                            </button>
                            <button className="tx-btn tx-btn-red tx-btn-icon tx-btn-xs" onClick={() => { setDeleteId(tx.id); setShowDeleteModal(true); }} title="Delete">
                              <Trash2 size={18} />
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
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(167,139,250,.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '4px',
          fontSize: '0.6rem',
          color: '#475569'
        }}>
          <span>Total: {filteredTransactions.length} transactions</span>
          <span>Updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* =========================================================
          ADD MODAL
          ========================================================= */}
      {showAddModal && (
        <div className="tx-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tx-modal-header">
              <h4 className="tx-modal-title">
                <Plus size={18} className="tx-icon" /> Add Transaction
              </h4>
              <button className="tx-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="tx-modal-body">
              <div className="tx-form-grid">
                <div className="tx-form-group">
                  <label className="tx-form-label">Person Name *</label>
                  <input
                    className="tx-form-input"
                    type="text"
                    value={newTransaction.person_name}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, person_name: e.target.value }))}
                    placeholder="Enter name"
                  />
                </div>
                <div className="tx-form-group">
                  <label className="tx-form-label">Amount (₹) *</label>
                  <input
                    className="tx-form-input"
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    min="1"
                  />
                </div>
                <div className="tx-form-group">
                  <label className="tx-form-label">Date</label>
                  <input
                    className="tx-form-input"
                    type="date"
                    value={newTransaction.transaction_date}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, transaction_date: e.target.value }))}
                  />
                </div>
                <div className="tx-form-group">
                  <label className="tx-form-label">Type</label>
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
                <div className="tx-form-group">
                  <label className="tx-form-label">Status</label>
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
                <div className="tx-form-group">
                  <label className="tx-form-label">Notes</label>
                  <input
                    className="tx-form-input"
                    type="text"
                    value={newTransaction.notes}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="tx-form-actions">
                <button className="tx-btn tx-btn-red" onClick={() => setShowAddModal(false)}>
                  <X size={15} /> Cancel
                </button>
                <button className="tx-btn tx-btn-yellow" onClick={handleAddTransaction} disabled={saving}>
                  <Plus size={15} /> {saving ? 'Saving...' : 'Add Transaction'}
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
        <div className="tx-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="tx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="tx-modal-header">
              <h4 className="tx-modal-title">
                <Eye size={18} className="tx-icon" /> Transaction Details
              </h4>
              <button className="tx-modal-close" onClick={() => setShowViewModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="tx-modal-body">
              <div className="tx-detail-list">
                <div className="tx-detail-row">
                  <span className="tx-detail-label">Person</span>
                  <span className="tx-detail-value">{viewTransaction.person_name}</span>
                </div>
                <div className="tx-detail-row">
                  <span className="tx-detail-label">Amount</span>
                  <span className="tx-detail-value" style={{ 
                    color: viewTransaction.type === 'Give' ? '#FB7185' : '#34D399',
                    fontWeight: 800
                  }}>
                    {viewTransaction.type === 'Give' ? '−' : '+'}{formatCurrency(viewTransaction.amount)}
                  </span>
                </div>
                <div className="tx-detail-row">
                  <span className="tx-detail-label">Date</span>
                  <span className="tx-detail-value">{formatDateFull(viewTransaction.transaction_date)}</span>
                </div>
                <div className="tx-detail-row">
                  <span className="tx-detail-label">Type</span>
                  <span className="tx-detail-value">
                    <span className={`tx-badge ${viewTransaction.type === 'Give' ? 'tx-badge-give' : 'tx-badge-take'}`}>
                      {viewTransaction.type}
                    </span>
                  </span>
                </div>
                <div className="tx-detail-row">
                  <span className="tx-detail-label">Status</span>
                  <span className="tx-detail-value">
                    <span className={`tx-badge ${viewTransaction.status === 'Received' ? 'tx-badge-received' : 'tx-badge-pending'}`}>
                      {viewTransaction.status}
                    </span>
                  </span>
                </div>
                {viewTransaction.notes && (
                  <div className="tx-detail-row">
                    <span className="tx-detail-label">Notes</span>
                    <span className="tx-detail-value" style={{ color: '#94A3B8', fontWeight: 400, fontSize: '0.8rem' }}>
                      {viewTransaction.notes}
                    </span>
                  </div>
                )}
                {viewTransaction.created_at && (
                  <div className="tx-detail-row">
                    <span className="tx-detail-label">Created</span>
                    <span className="tx-detail-value" style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 400 }}>
                      {formatDateFull(viewTransaction.created_at)}
                    </span>
                  </div>
                )}
              </div>
              <div className="tx-form-actions" style={{ borderTop: '1px solid rgba(167,139,250,.05)', marginTop: '10px', paddingTop: '10px' }}>
                <button className="tx-btn tx-btn-outline tx-btn-sm" onClick={() => setShowViewModal(false)}>
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
        <div className="tx-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="tx-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="tx-modal-header" style={{ borderBottom: '0', marginBottom: '0', paddingBottom: '0' }}>
              <h4 className="tx-modal-title" style={{ color: '#FDA4AF' }}>
                <AlertCircle size={18} color="#FB7185" /> Delete Transaction
              </h4>
              <button className="tx-modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="tx-modal-body">
              <div className="tx-delete-icon">⚠️</div>
              <div className="tx-delete-text">Are you sure you want to delete this transaction?</div>
              <div className="tx-delete-sub">This action cannot be undone.</div>
              <div className="tx-form-actions" style={{ borderTop: '1px solid rgba(167,139,250,.05)', marginTop: '14px', paddingTop: '12px' }}>
                <button className="tx-btn tx-btn-outline tx-btn-sm" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="tx-btn tx-btn-red" onClick={handleDelete} disabled={saving}>
                  <Trash2 size={15} /> {saving ? 'Deleting...' : 'Delete'}
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