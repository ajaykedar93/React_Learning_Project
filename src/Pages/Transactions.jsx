import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Clock as ClockIcon, Filter, 
  Plus, X, Edit2, Save, Trash2, RefreshCw, 
  CheckCircle, AlertCircle, Eye, EyeOff
} from 'lucide-react';

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
  // =============================================
  const [userId] = useState(1);
  const API_BASE = 'http://localhost:5000/api/personal-transactions';
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        color: '#A78BFA'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(124,58,237,0.2)',
            borderTopColor: '#7C3AED',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading transactions...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .transactions-container {
          width: 100%;
        }

        .transactions-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.045));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(196,181,253,0.25);
          border-radius: 20px;
          transition: all 0.3s ease;
          padding: 1.25rem;
          margin-bottom: 0.75rem;
          box-shadow: 0 14px 36px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
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
          padding: 0.3rem 0.7rem;
          font-size: 0.7rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .glass-btn:hover {
          background: rgba(124, 58, 237, 0.3);
          border-color: rgba(196, 181, 253, 0.62);
          transform: translateY(-2px);
        }

        .glass-btn:active {
          transform: scale(0.95);
        }

        .glass-btn.success {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
          color: #6EE7B7;
        }

        .glass-btn.success:hover {
          background: rgba(16, 185, 129, 0.25);
        }

        .glass-btn.danger {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #FCA5A5;
        }

        .glass-btn.danger:hover {
          background: rgba(239, 68, 68, 0.25);
        }

        .glass-btn.primary {
          background: rgba(124, 58, 237, 0.15);
          border-color: rgba(124, 58, 237, 0.3);
          color: #A78BFA;
        }

        .glass-btn.primary:hover {
          background: rgba(124, 58, 237, 0.25);
        }

        .edit-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 0.3rem 0.5rem;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 500;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.3s ease;
          width: 100%;
        }

        .edit-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .edit-input:focus {
          border-color: rgba(124, 58, 237, 0.5);
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.1);
          background: rgba(255, 255, 255, 0.15);
        }

        /* ============================================
           FIXED DROPDOWN STYLES - VISIBLE TEXT
           ============================================ */
        .edit-select {
          background: #ffffff !important;
          border: 1px solid #c4b5fd;
          border-radius: 8px;
          padding: 0.3rem 0.5rem;
          color: #111827 !important;
          font-size: 0.75rem;
          font-weight: 500;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          width: 100%;
          appearance: auto;
          -webkit-appearance: menulist;
          color-scheme: light;
          -webkit-text-fill-color: #111827;
          font-weight: 700;
        }

        .transactions-container .edit-select option {
          background: #ffffff !important;
          color: #111827 !important;
          padding: 0.3rem;
        }

        .transactions-container .edit-select option:checked {
          background: #7c3aed !important;
          color: #ffffff !important;
        }

        .edit-select:hover {
          background: #f5f3ff !important;
          border-color: #7c3aed;
        }

        .edit-select:focus {
          background: #ffffff !important;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
          outline: none;
        }

        /* Modal Dropdown Styles */
        .modal-select {
          background: #ffffff !important;
          border: 1px solid #c4b5fd;
          border-radius: 8px;
          padding: 0.4rem 0.6rem;
          color: #111827 !important;
          font-size: 0.75rem;
          font-family: inherit;
          outline: none;
          transition: all 0.3s ease;
          width: 100%;
          appearance: auto;
          -webkit-appearance: menulist;
          color-scheme: light;
          -webkit-text-fill-color: #111827;
          font-weight: 700;
          cursor: pointer;
        }

        .transactions-container .modal-select option {
          background: #ffffff !important;
          color: #111827 !important;
          padding: 0.3rem;
        }

        .transactions-container .modal-select option:checked {
          background: #7c3aed !important;
          color: #ffffff !important;
        }

        .modal-select:hover {
          background: #f5f3ff !important;
          border-color: #7c3aed;
        }

        .modal-select:focus {
          background: #ffffff !important;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
          outline: none;
        }

        .transactions-table th {
          color: rgba(255,255,255,0.75) !important;
          border-bottom-color: rgba(196,181,253,0.25) !important;
        }

        .transactions-table tbody tr:hover {
          background: rgba(124,58,237,0.12) !important;
        }

        .transactions-table {
          min-width: 820px;
        }

        .transactions-table td {
          vertical-align: middle;
          font-size: 0.72rem !important;
          line-height: 1.35;
        }

        .transactions-table td .edit-input,
        .transactions-table td .edit-select {
          font-size: 0.72rem !important;
          min-height: 36px;
        }

        .transactions-table td .status-badge,
        .transactions-table td .type-badge {
          font-size: 0.68rem;
        }

        .transactions-table td:last-child {
          min-width: 190px;
        }

        .transactions-table td:last-child .glass-btn {
          min-width: 82px;
          white-space: nowrap;
          justify-content: center;
        }

        .transaction-notes-cell {
          min-width: 180px;
          max-width: 260px;
          overflow-wrap: anywhere;
          color: rgba(255,255,255,0.72);
        }

        .summary-label {
          color: rgba(255,255,255,0.72) !important;
          font-size: 0.62rem !important;
        }

        .transaction-filter-select {
          width: 140px !important;
          max-width: 140px !important;
          min-height: 38px;
          font-size: 0.78rem;
        }

        .status-badge {
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-size: 0.55rem;
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

        .type-badge {
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          font-size: 0.55rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .type-give {
          background: rgba(239, 68, 68, 0.15);
          color: #FCA5A5;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .type-take {
          background: rgba(16, 185, 129, 0.15);
          color: #6EE7B7;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .error-message {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          padding: 0.5rem 0.8rem;
          color: #FCA5A5;
          font-size: 0.8rem;
          margin-bottom: 0.75rem;
          width: min(100%, 440px);
          margin-left: auto;
          margin-right: auto;
          text-align: center;
        }

        .success-message {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 10px;
          padding: 0.5rem 0.8rem;
          color: #6EE7B7;
          font-size: 0.8rem;
          margin-bottom: 0.75rem;
          text-align: center;
          animation: slideDown 0.3s ease;
          width: min(100%, 440px);
          margin-left: auto;
          margin-right: auto;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: linear-gradient(145deg, rgba(35,38,76,0.98), rgba(25,28,58,0.98));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(196,181,253,0.35);
          border-radius: 20px;
          padding: 1.5rem;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #A78BFA;
        }

        .modal-close {
          background: rgba(239, 68, 68, 0.15);
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          color: #FCA5A5;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .modal-close:hover {
          background: rgba(239, 68, 68, 0.25);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
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
          color: rgba(255, 255, 255, 0.72);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-group input,
        .form-group textarea {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 0.4rem 0.6rem;
          color: #ffffff;
          font-size: 0.75rem;
          font-family: inherit;
          outline: none;
          transition: all 0.3s ease;
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .form-group input:focus,
        .form-group textarea:focus {
          border-color: rgba(124, 58, 237, 0.5);
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.1);
          background: rgba(255, 255, 255, 0.15);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 60px;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          justify-content: flex-end;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.68);
          font-size: 0.7rem;
          flex: 0 0 38%;
        }

        .detail-value {
          font-weight: 600;
          font-size: 0.8rem;
          color: #ffffff;
          flex: 1;
          min-width: 0;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .view-modal-actions { justify-content: center; }
        .delete-modal-actions { justify-content: center; }

        @media (max-width: 768px) {
          .glass-card { padding: 0.75rem; }
          .transactions-table { font-size: 0.65rem; }
          .form-row { grid-template-columns: 1fr; }
          .modal-content { padding: 1rem; max-width: 95%; }
          .transactions-table-wrap { margin: 0 -0.2rem; }
          .transactions-table td:last-child { min-width: 190px; }
          .transactions-table td { font-size: 0.68rem !important; }
          .transactions-table td .edit-input,
          .transactions-table td .edit-select { font-size: 0.68rem !important; }
          .transaction-filter-select {
            width: 128px !important;
            max-width: 128px !important;
            min-height: 36px;
            font-size: 0.72rem;
          }
        }

        @media (max-width: 480px) {
          .glass-card { padding: 0.6rem; border-radius: 14px; }
          .transactions-table { font-size: 0.55rem; }
          .edit-input, .edit-select { font-size: 0.6rem; padding: 0.2rem 0.3rem; }
          .modal-content { padding: 0.8rem; }
          .glass-btn { min-height: 32px; }
        }
      `}</style>

      <div id="transactions" className="transactions-container">
        {/* Summary Cards */}
        {summary && (
          <div className="glass-card" style={{ padding: '0.8rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.5rem'
            }}>
              <div className="glass-card" style={{ padding: '0.6rem', textAlign: 'center', background: 'rgba(245,158,11,0.05)' }}>
                <div className="summary-label" style={{ fontSize: '0.5rem' }}>Pending</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FCD34D' }}>
                  {formatCurrency(summary.summary?.totalPending || 0)}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '0.6rem', textAlign: 'center', background: 'rgba(16,185,129,0.05)' }}>
                <div className="summary-label" style={{ fontSize: '0.5rem' }}>Received</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#6EE7B7' }}>
                  {formatCurrency(summary.summary?.totalReceived || 0)}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '0.6rem', textAlign: 'center', background: 'rgba(239,68,68,0.05)' }}>
                <div className="summary-label" style={{ fontSize: '0.5rem' }}>Give</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FCA5A5' }}>
                  {formatCurrency(summary.summary?.totalGive || 0)}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '0.6rem', textAlign: 'center', background: 'rgba(124,58,237,0.05)' }}>
                <div className="summary-label" style={{ fontSize: '0.5rem' }}>Take</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#A78BFA' }}>
                  {formatCurrency(summary.summary?.totalTake || 0)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Transactions Card */}
        <div className="glass-card">
          {error && <div className="error-message">⚠️ {error}</div>}
          {successMessage && <div className="success-message">✅ {successMessage}</div>}

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#F59E0B'
            }}>
              <ClockIcon size={18} /> Transactions
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="glass-btn primary" onClick={() => setShowAddModal(true)}>
                <Plus size={14} /> Add
              </button>
              <button className="glass-btn" onClick={() => { fetchTransactions(); fetchSummary(); }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.8rem',
            alignItems: 'center'
          }}>
            <Filter size={14} color="rgba(255,255,255,0.3)" />
            <input
              className="edit-input"
              placeholder="Search by name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '200px', flex: '1', minWidth: '120px' }}
            />
            <select
              className="edit-select transaction-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ maxWidth: '140px' }}
            >
              <option value="all">All Types</option>
              <option value="Give">Give</option>
              <option value="Take">Take</option>
            </select>
            <select
              className="edit-select transaction-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ maxWidth: '140px' }}
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
            </select>
          </div>

          {/* Transactions Table */}
          <div className="transactions-table-wrap">
            <table className="transactions-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.75rem',
              minWidth: '820px'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Name</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Date</th>
                  <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Notes</th>
                  <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>
                      <div>📋 No transactions found</div>
                      <div style={{ fontSize: '0.6rem', marginTop: '0.3rem' }}>Click "Add" to create your first transaction</div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isEditing = editingId === tx.id;
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        
                        <td style={{ padding: '0.4rem 0.5rem' }}>
                          {isEditing ? (
                            <input className="edit-input" value={editData.person_name} onChange={(e) => setEditData(prev => ({ ...prev, person_name: e.target.value }))} style={{ fontSize: '0.7rem' }} />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {tx.type === 'Give' ? <ArrowUpRight size={12} color="#FCA5A5" /> : <ArrowDownRight size={12} color="#6EE7B7" />}
                              <span style={{ fontWeight: '600', color: 'white' }}>{tx.person_name}</span>
                            </div>
                          )}
                        </td>
                        
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                          {isEditing ? (
                            <input className="edit-input" type="number" value={editData.amount} onChange={(e) => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} style={{ fontSize: '0.7rem', width: '80px' }} />
                          ) : (
                            <span style={{ fontWeight: '700', color: tx.type === 'Give' ? '#FCA5A5' : '#6EE7B7' }}>
                              {tx.type === 'Give' ? '−' : '+'}{formatCurrency(tx.amount)}
                            </span>
                          )}
                        </td>
                        
                        <td style={{ padding: '0.4rem 0.5rem' }}>
                          {isEditing ? (
                            <input className="edit-input" type="date" value={editData.transaction_date} onChange={(e) => setEditData(prev => ({ ...prev, transaction_date: e.target.value }))} style={{ fontSize: '0.7rem' }} />
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>{formatDate(tx.transaction_date)}</span>
                          )}
                        </td>
                        
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                          {isEditing ? (
                            <select className="edit-select" value={editData.status} onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))} style={{ fontSize: '0.65rem' }}>
                              <option value="Received">Received</option>
                              <option value="Pending">Pending</option>
                            </select>
                          ) : (
                            <span className={`status-badge ${tx.status === 'Received' ? 'status-received' : 'status-pending'}`}>
                              {tx.status}
                            </span>
                          )}
                        </td>
                        
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                          {isEditing ? (
                            <select className="edit-select" value={editData.type} onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value }))} style={{ fontSize: '0.65rem' }}>
                              <option value="Give">Give</option>
                              <option value="Take">Take</option>
                            </select>
                          ) : (
                            <span className={`type-badge ${tx.type === 'Give' ? 'type-give' : 'type-take'}`}>
                              {tx.type}
                            </span>
                          )}
                        </td>

                        <td className="transaction-notes-cell" style={{ padding: '0.4rem 0.5rem' }}>
                          {isEditing ? (
                            <input
                              className="edit-input"
                              type="text"
                              value={editData.notes || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Add notes"
                              style={{ fontSize: '0.7rem', minWidth: '160px' }}
                            />
                          ) : (
                            tx.notes || '—'
                          )}
                        </td>
                        
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                              <button className="glass-btn success" onClick={() => handleSave(tx.id)} disabled={saving} style={{ padding: '0.3rem 0.55rem', fontSize: '0.65rem' }}>
                                <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button className="glass-btn danger" onClick={handleCancel} style={{ padding: '0.3rem 0.55rem', fontSize: '0.65rem' }}>
                                <X size={12} /> Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                              <button className="glass-btn" onClick={() => handleView(tx)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>
                                <Eye size={12} />
                              </button>
                              <button className="glass-btn primary" onClick={() => handleEdit(tx)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>
                                <Edit2 size={12} />
                              </button>
                              <button className="glass-btn danger" onClick={() => { setDeleteId(tx.id); setShowDeleteModal(true); }} style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>
                                <Trash2 size={12} />
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
            marginTop: '0.8rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.3)'
          }}>
            <span>Total: {filteredTransactions.length} transactions</span>
            <span>Updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ============================================
          ADD MODAL
          ============================================ */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 className="modal-title">
                <Plus size={18} /> Add Transaction
              </h4>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Person Name *</label>
                <input
                  type="text"
                  value={newTransaction.person_name}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, person_name: e.target.value }))}
                  placeholder="Enter name"
                />
              </div>
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0"
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newTransaction.transaction_date}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, transaction_date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  className="modal-select"
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="Give">Give</option>
                  <option value="Take">Take</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  className="modal-select"
                  value={newTransaction.status}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="form-actions">
              <button className="glass-btn danger" onClick={() => setShowAddModal(false)}>
                <X size={14} /> Cancel
              </button>
              <button className="glass-btn success" onClick={handleAddTransaction} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          VIEW MODAL
          ============================================ */}
      {showViewModal && viewTransaction && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 className="modal-title">
                <Eye size={18} /> Transaction Details
              </h4>
            </div>

            <div className="detail-row">
              <span className="detail-label">Person Name</span>
              <span className="detail-value">{viewTransaction.person_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount</span>
              <span className="detail-value" style={{ color: viewTransaction.type === 'Give' ? '#FCA5A5' : '#6EE7B7' }}>
                {viewTransaction.type === 'Give' ? '−' : '+'}{formatCurrency(viewTransaction.amount)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(viewTransaction.transaction_date)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type</span>
              <span className="detail-value">
                <span className={`type-badge ${viewTransaction.type === 'Give' ? 'type-give' : 'type-take'}`}>
                  {viewTransaction.type}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className="detail-value">
                <span className={`status-badge ${viewTransaction.status === 'Received' ? 'status-received' : 'status-pending'}`}>
                  {viewTransaction.status}
                </span>
              </span>
            </div>
            {viewTransaction.notes && (
              <div className="detail-row">
                <span className="detail-label">Notes</span>
                <span className="detail-value" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                  {viewTransaction.notes}
                </span>
              </div>
            )}
            <div className="detail-row" style={{ borderBottom: 'none' }}>
              <span className="detail-label">Created</span>
              <span className="detail-value" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                {formatDate(viewTransaction.created_at)}
              </span>
            </div>

            <div className="form-actions view-modal-actions">
              <button className="glass-btn" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          DELETE MODAL
          ============================================ */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 className="modal-title" style={{ color: '#FCA5A5' }}>
                <AlertCircle size={18} /> Delete Transaction
              </h4>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Are you sure you want to delete this transaction?
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                This action cannot be undone.
              </p>
            </div>

            <div className="form-actions delete-modal-actions">
              <button className="glass-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="glass-btn danger" onClick={handleDelete} disabled={saving}>
                <Trash2 size={14} /> {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Transactions;