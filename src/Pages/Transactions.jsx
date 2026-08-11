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
      <div className="transactions-page" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at 12% 8%, rgba(124,58,237,.12), transparent 34%), radial-gradient(circle at 88% 18%, rgba(79,70,229,.10), transparent 36%), linear-gradient(135deg, #0f1026 0%, #171735 52%, #101126 100%)'
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
    <div className="transactions-page">
      <style>{`
        /* =========================================================
           GLOBAL RESET
           ========================================================= */
        .transactions-page {
          width: 100%;
          min-height: 100vh;
          background: radial-gradient(circle at 12% 8%, rgba(124,58,237,.10), transparent 34%),
                      radial-gradient(circle at 88% 18%, rgba(79,70,229,.08), transparent 36%),
                      linear-gradient(145deg, #0a0b1e 0%, #12122e 40%, #0e0f24 100%);
          padding: 14px;
          box-sizing: border-box;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-x: hidden;
        }

        .transactions-page * {
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
          background: linear-gradient(145deg, rgba(30,30,65,.92), rgba(20,20,50,.88));
          border: 1px solid rgba(167,139,250,.18);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.05);
          backdrop-filter: blur(16px) saturate(130%);
          -webkit-backdrop-filter: blur(16px) saturate(130%);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .glass-card:hover {
          border-color: rgba(167,139,250,.35);
          box-shadow: 0 12px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08);
        }

        /* =========================================================
           GLASS SELECT
           ========================================================= */
        .glass-select {
          position: relative;
          width: 100%;
          z-index: 30;
        }

        .glass-select-trigger {
          width: 100%;
          min-height: 38px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background: rgba(15,23,42,.70);
          color: #F8FAFC;
          border: 1px solid rgba(167,139,250,.20);
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .glass-select-trigger:hover {
          background: rgba(30,30,60,.85);
          border-color: rgba(167,139,250,.40);
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
          font-size: 14px;
          transition: transform 0.25s ease;
        }

        .glass-select.is-open .glass-select-chevron {
          transform: rotate(180deg);
        }

        .glass-select-menu {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 4px);
          width: 100%;
          max-height: 200px;
          overflow-y: auto;
          padding: 4px;
          background: rgba(20,21,48,.98);
          border: 1px solid rgba(167,139,250,.25);
          border-radius: 10px;
          box-shadow: 0 16px 48px rgba(0,0,0,.50);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 100000;
        }

        .glass-select-option {
          width: 100%;
          min-height: 36px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background: transparent;
          color: #E2E8F0;
          border: 0;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .glass-select-option:hover {
          background: rgba(124,58,237,.20);
          color: #FFFFFF;
        }

        .glass-select-option.selected {
          background: rgba(124,58,237,.28);
          color: #FFFFFF;
        }

        .glass-select-check {
          color: #C4B5FD;
          font-weight: 900;
        }

        /* =========================================================
           PROFESSIONAL GLASS BUTTONS
           ========================================================= */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 36px;
          padding: 0 16px;
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,.10);
          text-shadow: 0 1px 2px rgba(0,0,0,.20);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          letter-spacing: 0.3px;
        }

        .btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,.12), transparent 50%);
          pointer-events: none;
          border-radius: inherit;
        }

        .btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 28px rgba(0,0,0,.35);
        }

        .btn:active {
          transform: translateY(0) scale(.97);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        /* Yellow - View/Add */
        .btn-yellow {
          background: linear-gradient(135deg, #D97706, #F59E0B);
          border-color: rgba(245,158,11,.35);
          color: #FFFFFF;
          box-shadow: 0 4px 18px rgba(245,158,11,.25);
        }

        .btn-yellow:hover {
          background: linear-gradient(135deg, #B45309, #FBBF24);
          border-color: rgba(245,158,11,.55);
          box-shadow: 0 6px 28px rgba(245,158,11,.35);
        }

        /* Green - Edit/Save */
        .btn-green {
          background: linear-gradient(135deg, #059669, #10B981);
          border-color: rgba(16,185,129,.35);
          color: #FFFFFF;
          box-shadow: 0 4px 18px rgba(16,185,129,.25);
        }

        .btn-green:hover {
          background: linear-gradient(135deg, #047857, #34D399);
          border-color: rgba(16,185,129,.55);
          box-shadow: 0 6px 28px rgba(16,185,129,.35);
        }

        /* Red - Delete/Cancel */
        .btn-red {
          background: linear-gradient(135deg, #DC2626, #EF4444);
          border-color: rgba(239,68,68,.35);
          color: #FFFFFF;
          box-shadow: 0 4px 18px rgba(239,68,68,.25);
        }

        .btn-red:hover {
          background: linear-gradient(135deg, #B91C1C, #F87171);
          border-color: rgba(239,68,68,.55);
          box-shadow: 0 6px 28px rgba(239,68,68,.35);
        }

        /* Purple - Primary */
        .btn-purple {
          background: linear-gradient(135deg, #7C3AED, #4F46E5);
          border-color: rgba(196,181,253,.35);
          color: #FFFFFF;
          box-shadow: 0 4px 18px rgba(124,58,237,.25);
        }

        .btn-purple:hover {
          background: linear-gradient(135deg, #8B5CF6, #6366F1);
          border-color: rgba(196,181,253,.55);
          box-shadow: 0 6px 28px rgba(124,58,237,.35);
        }

        /* Outline - Glass */
        .btn-outline {
          background: rgba(255,255,255,.06);
          border-color: rgba(167,139,250,.20);
          color: #C4B5FD;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .btn-outline:hover {
          background: rgba(167,139,250,.15);
          border-color: rgba(167,139,250,.45);
          color: #FFFFFF;
        }

        /* Size variants */
        .btn-sm {
          min-height: 32px;
          padding: 0 12px;
          font-size: 0.7rem;
          border-radius: 8px;
        }

        .btn-xs {
          min-height: 28px;
          padding: 0 10px;
          font-size: 0.65rem;
          border-radius: 7px;
          gap: 4px;
        }

        .btn-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          padding: 0;
          border-radius: 10px;
        }

        .btn-icon svg {
          width: 18px;
          height: 18px;
        }

        .btn-icon.btn-xs {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 9px;
        }

        .btn-icon.btn-xs svg {
          width: 17px;
          height: 17px;
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
          border: 1px solid transparent;
        }

        .badge-pending {
          background: rgba(245,158,11,.15);
          color: #FCD34D;
          border-color: rgba(245,158,11,.25);
        }

        .badge-received {
          background: rgba(16,185,129,.15);
          color: #6EE7B7;
          border-color: rgba(16,185,129,.25);
        }

        .badge-give {
          background: rgba(239,68,68,.15);
          color: #FDA4AF;
          border-color: rgba(239,68,68,.25);
        }

        .badge-take {
          background: rgba(16,185,129,.15);
          color: #6EE7B7;
          border-color: rgba(16,185,129,.25);
        }

        /* =========================================================
           SUMMARY CARDS
           ========================================================= */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }

        .summary-item {
          background: rgba(15,23,42,.45);
          border: 1px solid rgba(167,139,250,.10);
          border-radius: 12px;
          padding: 10px 14px;
          text-align: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .summary-item:hover {
          border-color: rgba(167,139,250,.25);
          background: rgba(20,30,55,.55);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,.20);
        }

        .summary-label {
          font-size: 0.55rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94A3B8;
          margin-bottom: 2px;
        }

        .summary-value {
          font-size: 1.1rem;
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
          background: rgba(10,15,35,.40);
          border: 1px solid rgba(167,139,250,.08);
        }

        .table {
          width: 100%;
          min-width: 820px;
          border-collapse: collapse;
          font-size: 0.75rem;
        }

        .table thead th {
          padding: 8px 10px;
          text-align: left;
          font-weight: 700;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94A3B8;
          border-bottom: 1px solid rgba(167,139,250,.08);
          background: rgba(15,20,45,.50);
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .table thead th:last-child { text-align: center; }
        .table thead th:nth-child(2) { text-align: right; }
        .table thead th:nth-child(4),
        .table thead th:nth-child(5) { text-align: center; }

        .table tbody tr {
          transition: background 0.2s ease;
          border-bottom: 1px solid rgba(167,139,250,.05);
        }

        .table tbody tr:hover {
          background: rgba(124,58,237,.05);
        }

        .table tbody td {
          padding: 8px 10px;
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
          gap: 6px;
          font-weight: 600;
          color: #F8FAFC;
        }

        .table .name-cell .icon-give { color: #FB7185; }
        .table .name-cell .icon-take { color: #34D399; }

        .table .amount-give { color: #FB7185; font-weight: 700; }
        .table .amount-take { color: #34D399; font-weight: 700; }

        .table .date-cell {
          color: #94A3B8;
          font-size: 0.65rem;
        }

        .table .notes-cell {
          color: #94A3B8;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .table .actions-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        /* =========================================================
           MODALS - Professional Glass
           ========================================================= */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(4,5,16,.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          animation: fadeInUp 0.25s ease;
        }

        .modal {
          width: min(500px, 100%);
          max-height: calc(100vh - 32px);
          overflow-y: auto;
          padding: 24px 28px;
          background: linear-gradient(145deg, rgba(35,35,70,.98), rgba(25,25,55,.96));
          border: 1px solid rgba(167,139,250,.28);
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06);
          animation: fadeInUp 0.3s ease;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(167,139,250,.10);
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 8px;
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
          border: 1px solid rgba(239,68,68,.20);
          border-radius: 8px;
          color: #FCA5A5;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .modal-close:hover {
          background: rgba(239,68,68,.22);
          border-color: rgba(239,68,68,.45);
          transform: scale(1.05);
        }

        .modal-body {
          color: #E2E8F0;
        }

        /* Form */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group.full { grid-column: 1 / -1; }

        .form-label {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94A3B8;
        }

        .form-input {
          width: 100%;
          min-height: 38px;
          padding: 0 12px;
          background: rgba(15,23,42,.70);
          border: 1px solid rgba(167,139,250,.18);
          border-radius: 8px;
          color: #F8FAFC;
          font-size: 0.75rem;
          font-weight: 600;
          transition: all 0.25s ease;
          outline: none;
        }

        .form-input::placeholder {
          color: #64748B;
        }

        .form-input:focus {
          border-color: #8B5CF6;
          box-shadow: 0 0 0 3px rgba(139,92,246,.12);
          background: rgba(20,25,55,.85);
        }

        .form-input.textarea {
          min-height: 60px;
          padding: 8px 12px;
          resize: vertical;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(167,139,250,.08);
        }

        /* Detail Rows */
        .detail-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 14px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(167,139,250,.06);
        }

        .detail-row:last-child { border-bottom: 0; }

        .detail-label {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #94A3B8;
        }

        .detail-value {
          font-size: 0.8rem;
          font-weight: 600;
          color: #F8FAFC;
          text-align: right;
          word-break: break-word;
        }

        .detail-value .badge {
          font-size: 0.55rem;
        }

        /* Delete Modal */
        .delete-icon {
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 6px;
        }

        .delete-text {
          text-align: center;
          color: #E2E8F0;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .delete-sub {
          text-align: center;
          color: #94A3B8;
          font-size: 0.65rem;
          margin-top: 4px;
        }

        /* =========================================================
           RESPONSIVE
           ========================================================= */
        @media (max-width: 992px) {
          .transactions-page { padding: 10px; }
        }

        @media (max-width: 768px) {
          .transactions-page { padding: 6px; }

          .glass-card { padding: 0.8rem; border-radius: 14px; }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }

          .summary-item { padding: 8px 10px; }
          .summary-value { font-size: 0.95rem; }

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
            margin-bottom: 8px;
            padding: 10px 12px;
            background: linear-gradient(145deg, rgba(30,30,65,.94), rgba(20,20,50,.90));
            border: 1px solid rgba(167,139,250,.15);
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,.20);
          }

          .table tbody td {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid rgba(167,139,250,.05);
          }

          .table tbody td:last-child { border-bottom: 0; }

          .table tbody td::before {
            content: attr(data-label);
            font-size: 0.55rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #94A3B8;
            flex: 0 0 64px;
          }

          .table tbody td .name-cell {
            flex: 1;
            justify-content: flex-end;
          }

          .table tbody td:nth-child(2),
          .table tbody td:nth-child(4),
          .table tbody td:nth-child(5),
          .table tbody td:last-child {
            text-align: right;
          }

          .table .notes-cell {
            max-width: none;
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
          }

          .table .actions-cell {
            justify-content: flex-end;
          }

          .btn-icon.btn-xs {
            width: 34px;
            height: 34px;
            min-width: 34px;
          }

          .btn-icon.btn-xs svg {
            width: 16px;
            height: 16px;
          }

          .modal {
            padding: 18px 16px;
            border-radius: 16px;
            max-height: calc(100vh - 16px);
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .detail-row {
            grid-template-columns: 1fr;
            gap: 2px;
            padding: 6px 0;
          }

          .detail-value { text-align: left; }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions .btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .transactions-page { padding: 4px; }

          .glass-card { padding: 0.6rem; border-radius: 12px; }

          .summary-grid {
            grid-template-columns: 1fr 1fr;
            gap: 4px;
          }

          .summary-item { padding: 6px 8px; }
          .summary-value { font-size: 0.85rem; }
          .summary-label { font-size: 0.5rem; }

          .table tbody tr { padding: 8px 10px; border-radius: 10px; }
          .table tbody td { font-size: 0.68rem; padding: 4px 0; }
          .table tbody td::before { flex: 0 0 54px; font-size: 0.5rem; }

          .btn { 
            font-size: 0.7rem; 
            min-height: 32px; 
            padding: 0 12px; 
          }
          
          .btn-icon { 
            width: 34px; 
            height: 34px; 
            min-width: 34px; 
          }
          
          .btn-icon.btn-xs { 
            width: 32px; 
            height: 32px; 
            min-width: 32px; 
          }
          
          .btn-icon.btn-xs svg {
            width: 15px;
            height: 15px;
          }

          .modal { padding: 14px 12px; border-radius: 14px; }
          .modal-title { font-size: 0.9rem; }

          .badge { font-size: 0.5rem; padding: 2px 8px; }
        }

        @media (max-width: 360px) {
          .summary-grid { grid-template-columns: 1fr; }
        }

        /* Scrollbar */
        .modal::-webkit-scrollbar,
        .table-wrap::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        .modal::-webkit-scrollbar-track,
        .table-wrap::-webkit-scrollbar-track {
          background: rgba(15,23,42,.25);
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
            background: 'rgba(239,68,68,.10)',
            border: '1px solid rgba(239,68,68,.20)',
            borderRadius: '8px',
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
            background: 'rgba(16,185,129,.10)',
            border: '1px solid rgba(16,185,129,.20)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#6EE7B7',
            fontSize: '0.75rem',
            marginBottom: '10px',
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
          gap: '8px',
          marginBottom: '12px'
        }}>
          <h3 style={{
            fontSize: '0.9rem',
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
            <button className="btn btn-yellow" onClick={() => setShowAddModal(true)}>
              <Plus size={15} /> Add
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => { fetchTransactions(); fetchSummary(); }}>
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
            className="form-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: '1', minWidth: '120px', maxWidth: '240px', minHeight: '34px' }}
          />
          <GlassSelect
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'Give', label: 'Give' },
              { value: 'Take', label: 'Take' }
            ]}
            style={{ maxWidth: '110px', minWidth: '90px' }}
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
            style={{ maxWidth: '110px', minWidth: '90px' }}
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '28px 0', color: '#64748B' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📋</div>
                    <div style={{ fontSize: '0.8rem' }}>No transactions found</div>
                    <div style={{ fontSize: '0.65rem', marginTop: '2px', color: '#475569' }}>Click "Add" to create one</div>
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
                            style={{ minHeight: '30px', fontSize: '0.7rem' }}
                          />
                        ) : (
                          <div className="name-cell">
                            {tx.type === 'Give' 
                              ? <ArrowUpRight size={13} className="icon-give" /> 
                              : <ArrowDownRight size={13} className="icon-take" />}
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
                            style={{ minHeight: '30px', fontSize: '0.7rem', width: '70px' }}
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
                            style={{ minHeight: '30px', fontSize: '0.65rem' }}
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
                            style={{ minWidth: '80px' }}
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
                            style={{ minWidth: '70px' }}
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
                            placeholder="Notes"
                            style={{ minHeight: '30px', fontSize: '0.65rem' }}
                          />
                        ) : (
                          tx.notes || '—'
                        )}
                      </td>
                      <td data-label="Actions">
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-green btn-xs" onClick={() => handleSave(tx.id)} disabled={saving}>
                              <Save size={13} /> {saving ? 'Saving' : 'Save'}
                            </button>
                            <button className="btn btn-red btn-xs" onClick={handleCancel}>
                              <X size={13} /> Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="actions-cell">
                            <button className="btn btn-yellow btn-icon btn-xs" onClick={() => handleView(tx)} title="View">
                              <Eye size={17} />
                            </button>
                            <button className="btn btn-green btn-icon btn-xs" onClick={() => handleEdit(tx)} title="Edit">
                              <Edit2 size={17} />
                            </button>
                            <button className="btn btn-red btn-icon btn-xs" onClick={() => { setDeleteId(tx.id); setShowDeleteModal(true); }} title="Delete">
                              <Trash2 size={17} />
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
          borderTop: '1px solid rgba(167,139,250,.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '4px',
          fontSize: '0.6rem',
          color: '#64748B'
        }}>
          <span>Total: {filteredTransactions.length} transactions</span>
          <span>Updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* =========================================================
          ADD MODAL - Yellow Add, Red Cancel
          ========================================================= */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">
                <Plus size={18} className="icon" /> Add Transaction
              </h4>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={17} />
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
                <button className="btn btn-red" onClick={() => setShowAddModal(false)}>
                  <X size={14} /> Cancel
                </button>
                <button className="btn btn-yellow" onClick={handleAddTransaction} disabled={saving}>
                  <Plus size={14} /> {saving ? 'Saving...' : 'Add Transaction'}
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h4 className="modal-title">
                <Eye size={18} className="icon" /> Transaction Details
              </h4>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <X size={17} />
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
                    <span className="detail-value" style={{ color: '#94A3B8', fontWeight: 400, fontSize: '0.75rem' }}>
                      {viewTransaction.notes}
                    </span>
                  </div>
                )}
                {viewTransaction.created_at && (
                  <div className="detail-row">
                    <span className="detail-label">Created</span>
                    <span className="detail-value" style={{ color: '#64748B', fontSize: '0.65rem', fontWeight: 400 }}>
                      {formatDateFull(viewTransaction.created_at)}
                    </span>
                  </div>
                )}
              </div>
              <div className="form-actions" style={{ borderTop: '1px solid rgba(167,139,250,.06)', marginTop: '10px', paddingTop: '10px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowViewModal(false)}>
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header" style={{ borderBottom: '0', marginBottom: '0', paddingBottom: '0' }}>
              <h4 className="modal-title" style={{ color: '#FDA4AF' }}>
                <AlertCircle size={18} color="#FB7185" /> Delete Transaction
              </h4>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-icon">⚠️</div>
              <div className="delete-text">Are you sure you want to delete this transaction?</div>
              <div className="delete-sub">This action cannot be undone.</div>
              <div className="form-actions" style={{ borderTop: '1px solid rgba(167,139,250,.06)', marginTop: '14px', paddingTop: '12px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-red" onClick={handleDelete} disabled={saving}>
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