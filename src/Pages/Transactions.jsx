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
        color: '#4338ca'
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
        * { box-sizing: border-box; }

        .transactions-container {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          padding: 8px;
          color: #172033;
          font-family: 'Plus Jakarta Sans', Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .transactions-container button,
        .transactions-container input,
        .transactions-container select,
        .transactions-container textarea {
          font: inherit;
        }

        .glass-card {
          background: linear-gradient(145deg, rgba(224,242,254,.92), rgba(237,233,254,.94), rgba(252,231,243,.88)) !important;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(99,102,241,0.14);
          border-radius: 18px;
          transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
          padding: 1.1rem;
          margin-bottom: .8rem;
          box-shadow: 0 10px 30px rgba(51,65,85,.10), inset 0 1px 0 rgba(255,255,255,.95);
          overflow: hidden;
        }

        .glass-card:hover {
          transform: translateY(-2px);
          border-color: rgba(79,70,229,.24);
          box-shadow: 0 16px 36px rgba(51,65,85,.14), inset 0 1px 0 #fff;
        }

        .glass-btn {
          appearance: none;
          -webkit-appearance: none;
          background: rgba(255,255,255,.82) !important;
          border: 1px solid rgba(79,70,229,.16) !important;
          border-radius: 10px;
          color: #26324a !important;
          cursor: pointer;
          transition: transform .14s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
          padding: .42rem .72rem;
          font-size: .72rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: .32rem;
          min-height: 34px;
          box-shadow: 0 4px 12px rgba(51,65,85,.08);
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .glass-btn:hover {
          background: #eef2ff !important;
          border-color: rgba(79,70,229,.35) !important;
          transform: translateY(-1px);
          box-shadow: 0 7px 16px rgba(79,70,229,.14);
        }

        .glass-btn:active {
          transform: translateY(1px) scale(.96) !important;
          box-shadow: 0 2px 6px rgba(51,65,85,.12);
        }

        .glass-btn:disabled {
          opacity: .58;
          cursor: not-allowed;
          transform: none !important;
        }

        .glass-btn.success {
          background: linear-gradient(135deg,#ecfdf5,#d1fae5) !important;
          border-color: #86efac !important;
          color: #047857 !important;
        }

        .glass-btn.danger {
          background: linear-gradient(135deg,#fff1f2,#ffe4e6) !important;
          border-color: #fda4af !important;
          color: #be123c !important;
        }

        .glass-btn.primary {
          background: linear-gradient(135deg,#eef2ff,#e0e7ff) !important;
          border-color: #a5b4fc !important;
          color: #4338ca !important;
        }

        .edit-input,
        .modal-select,
        .edit-select {
          width: 100%;
          min-width: 0;
          background: rgba(255,255,255,.94) !important;
          border: 1px solid #dbe3f0 !important;
          border-radius: 9px;
          padding: .42rem .58rem;
          color: #172033 !important;
          -webkit-text-fill-color: #172033 !important;
          font-size: .74rem;
          font-weight: 600;
          outline: none;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
          box-shadow: inset 0 1px 2px rgba(15,23,42,.03);
        }

        .edit-input::placeholder,
        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #94a3b8 !important;
          -webkit-text-fill-color: #94a3b8 !important;
        }

        .edit-input:focus,
        .modal-select:focus,
        .edit-select:focus,
        .form-group input:focus,
        .form-group textarea:focus {
          border-color: #818cf8 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
          background: #fff !important;
        }

        .edit-select option,
        .modal-select option {
          background: #fff !important;
          color: #172033 !important;
        }

        .transactions-table-wrap {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: rgba(255,255,255,.72);
        }

        .transactions-table {
          width: 100%;
          min-width: 820px;
          border-collapse: separate;
          border-spacing: 0;
          color: #172033;
        }

        .transactions-table th {
          color: #64748b !important;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0 !important;
          white-space: nowrap;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .transactions-table td {
          vertical-align: middle;
          color: #334155 !important;
          font-size: .72rem !important;
          line-height: 1.4;
          border-bottom: 1px solid #edf2f7;
        }

        .transactions-table tbody tr {
          transition: background .16s ease, transform .16s ease;
        }

        .transactions-table tbody tr:hover {
          background: #f8faff !important;
        }

        .transactions-table td:last-child {
          min-width: 170px;
        }

        .transactions-table td .edit-input,
        .transactions-table td .edit-select {
          min-height: 36px;
        }

        .transactions-table td span {
          color: #334155 !important;
        }

        .transactions-table td .type-badge,
        .transactions-table td .status-badge {
          color: inherit !important;
        }

        .transaction-notes-cell {
          min-width: 160px;
          max-width: 280px;
          overflow-wrap: anywhere;
          color: #64748b !important;
        }

        .summary-label {
          color: #64748b !important;
          font-size: .62rem !important;
          font-weight: 700;
        }

        .status-badge,
        .type-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: .22rem .52rem;
          border-radius: 999px;
          font-size: .62rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .status-pending {
          background: #fff7ed !important;
          color: #c2410c !important;
          border: 1px solid #fed7aa;
        }

        .status-received {
          background: #ecfdf5 !important;
          color: #047857 !important;
          border: 1px solid #a7f3d0;
        }

        .type-give {
          background: #fff1f2 !important;
          color: #be123c !important;
          border: 1px solid #fecdd3;
        }

        .type-take {
          background: #ecfdf5 !important;
          color: #047857 !important;
          border: 1px solid #a7f3d0;
        }

        .error-message {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 11px;
          padding: .65rem .85rem;
          color: #be123c;
          font-size: .78rem;
          margin-bottom: .75rem;
          width: min(100%, 520px);
          margin-inline: auto;
          text-align: center;
        }

        .success-message {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 11px;
          padding: .65rem .85rem;
          color: #047857;
          font-size: .78rem;
          margin-bottom: .75rem;
          text-align: center;
          width: min(100%, 520px);
          margin-inline: auto;
          animation: slideDown .25s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Centered, mobile-safe modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          justify-content: center;
          align-items: center;
          padding:
            max(16px, env(safe-area-inset-top))
            max(16px, env(safe-area-inset-right))
            max(16px, env(safe-area-inset-bottom))
            max(16px, env(safe-area-inset-left));
          background: rgba(15,23,42,.42);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: fadeIn .2s ease;
          overscroll-behavior: contain;
        }

        .modal-content {
          width: min(520px, 100%);
          max-width: 520px;
          max-height: min(88dvh, 720px);
          overflow-y: auto;
          overscroll-behavior: contain;
          background: linear-gradient(145deg,#e0f2fe 0%,#ede9fe 55%,#fce7f3 100%) !important;
          border: 1px solid #dbe5f1;
          border-radius: 20px;
          padding: 1.25rem;
          box-shadow: 0 24px 70px rgba(15,23,42,.22), 0 4px 18px rgba(79,70,229,.10);
          animation: modalIn .22s ease;
          color: #172033;
          scrollbar-width: thin;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-title {
          font-size: 1.05rem;
          font-weight: 800;
          margin: 0;
          display: flex;
          align-items: center;
          gap: .45rem;
          color: #4338ca !important;
        }

        .modal-close {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 50%;
          border: 1px solid #fecdd3;
          background: #fff1f2;
          color: #be123c;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .14s ease, background .18s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .modal-close:hover { background: #ffe4e6; }
        .modal-close:active { transform: scale(.92); }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: .7rem;
          margin-bottom: .7rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: .3rem;
          min-width: 0;
        }

        .form-group label {
          font-size: .64rem;
          font-weight: 800;
          color: #64748b !important;
          text-transform: uppercase;
          letter-spacing: .45px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          min-width: 0;
          background: #fff !important;
          border: 1px solid #dbe3f0 !important;
          border-radius: 9px;
          padding: .52rem .65rem;
          color: #172033 !important;
          -webkit-text-fill-color: #172033 !important;
          font-size: .76rem;
          outline: none;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 70px;
        }

        .form-actions {
          display: flex;
          gap: .55rem;
          margin-top: 1rem;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          padding: .62rem 0;
          border-bottom: 1px solid #edf2f7;
        }

        .detail-label {
          color: #64748b !important;
          font-size: .7rem;
          flex: 0 0 38%;
          font-weight: 700;
        }

        .detail-value {
          font-weight: 700;
          font-size: .8rem;
          color: #172033 !important;
          flex: 1;
          min-width: 0;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .view-modal-actions,
        .delete-modal-actions {
          justify-content: center;
        }

        /* Keep all summary text readable on the fresh light cards */
        .transactions-container .summary-label + div {
          text-shadow: none;
        }

        @media (max-width: 900px) {
          .transactions-container { padding: 6px; }
          .glass-card { padding: .85rem; }
        }

        @media (max-width: 768px) {
          .transactions-container { padding: 4px; }
          .glass-card { border-radius: 15px; padding: .72rem; }
          .form-row { grid-template-columns: 1fr; }
          .transactions-table-wrap { border-radius: 12px; }
          .modal-content {
            width: min(94vw, 520px);
            max-height: 84dvh;
            padding: 1rem;
            border-radius: 17px;
          }
          .form-actions {
            justify-content: stretch;
          }
          .form-actions .glass-btn {
            flex: 1 1 120px;
          }
        }

        @media (max-width: 480px) {
          .transactions-container { padding: 2px; }
          .glass-card { padding: .58rem; border-radius: 13px; }
          .glass-btn { min-height: 34px; padding: .38rem .58rem; font-size: .68rem; }
          .transaction-filter-select { width: 100% !important; max-width: none !important; }
          .modal-overlay {
            padding:
              max(12px, env(safe-area-inset-top))
              max(12px, env(safe-area-inset-right))
              max(12px, env(safe-area-inset-bottom))
              max(12px, env(safe-area-inset-left));
          }
          .modal-content {
            width: 100%;
            max-height: 82dvh;
            padding: .85rem;
            border-radius: 15px;
          }
          .modal-title { font-size: .95rem; }
          .detail-row { gap: .7rem; }
          .detail-label { flex-basis: 42%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .glass-card,
          .glass-btn,
          .modal-content,
          .modal-overlay {
            transition: none !important;
            animation: none !important;
          }
        }
`}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* FINAL MOBILE READABILITY + RESPONSIVE FIX */
        #transactions.transactions-container {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          padding-bottom: 145px !important;
          overflow: visible !important;
        }
        #transactions.transactions-container .transactions-table tbody tr {
          color: #172033 !important;
        }
        #transactions.transactions-container .transactions-table tbody tr td {
          color: #172033 !important;
          -webkit-text-fill-color: #172033 !important;
        }
        #transactions.transactions-container .transactions-table tbody tr td:nth-child(2) span {
          -webkit-text-fill-color: currentColor !important;
        }
        #transactions.transactions-container .transactions-table tbody tr td:nth-child(3) span,
        #transactions.transactions-container .transaction-notes-cell {
          color: #475569 !important;
          -webkit-text-fill-color: #475569 !important;
        }
        @media (max-width: 768px) {
          #transactions.transactions-container { padding: 6px 6px 150px !important; }
          #transactions.transactions-container .transactions-table-wrap {
            overflow: visible !important;
            border: 0 !important;
            background: transparent !important;
          }
          #transactions.transactions-container .transactions-table {
            display: block !important; width: 100% !important; min-width: 0 !important;
          }
          #transactions.transactions-container .transactions-table thead { display: none !important; }
          #transactions.transactions-container .transactions-table tbody { display: block !important; width: 100% !important; }
          #transactions.transactions-container .transactions-table tbody tr {
            display: block !important; width: 100% !important;
            margin: 0 0 12px !important; padding: 8px 10px !important;
            border: 1px solid rgba(99,102,241,.20) !important;
            border-radius: 16px !important;
            background: linear-gradient(145deg,#ffffff,#eef2ff) !important;
            box-shadow: 0 8px 24px rgba(30,41,59,.10) !important;
          }
          #transactions.transactions-container .transactions-table tbody tr td {
            display: grid !important;
            grid-template-columns: 72px minmax(0,1fr) !important;
            align-items: center !important;
            width: 100% !important; min-width: 0 !important; max-width: none !important;
            min-height: 38px !important; padding: 7px 2px !important; gap: 8px !important;
            text-align: right !important;
            border-bottom: 1px solid rgba(148,163,184,.16) !important;
          }
          #transactions.transactions-container .transactions-table tbody tr td:last-child { border-bottom: 0 !important; }
          #transactions.transactions-container .transactions-table tbody tr td::before {
            display: block !important; width: auto !important; min-width: 0 !important;
            color: #64748b !important; -webkit-text-fill-color: #64748b !important;
            font-size: 10px !important; font-weight: 800 !important;
            text-transform: uppercase !important; letter-spacing: .35px !important;
            text-align: left !important;
          }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(1)::before { content: 'Name'; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(2)::before { content: 'Amount'; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(3)::before { content: 'Date'; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(4)::before { content: 'Status'; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(5)::before { content: 'Type'; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(6)::before { content: 'Notes'; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(7)::before { content: 'Actions'; }
          #transactions.transactions-container .transactions-table tbody tr td > div {
            min-width: 0 !important; max-width: 100% !important; overflow-wrap: anywhere !important;
          }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(1) span {
            color: #172033 !important; -webkit-text-fill-color: #172033 !important; font-weight: 800 !important;
          }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(7) > div {
            display: flex !important; justify-content: flex-end !important; flex-wrap: wrap !important; gap: 6px !important;
          }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(7) .glass-btn {
            width: 38px !important; min-width: 38px !important; height: 36px !important; padding: 0 !important;
          }
          #transactions.transactions-container .status-badge,
          #transactions.transactions-container .type-badge {
            justify-self: end !important; min-width: 78px !important; min-height: 28px !important;
            padding: 5px 10px !important; font-size: 11px !important; font-weight: 800 !important;
            border-radius: 999px !important;
          }
        }
        @media (max-width: 480px) {
          #transactions.transactions-container { padding: 4px 4px 155px !important; }
          #transactions.transactions-container .transactions-table tbody tr { padding: 8px !important; border-radius: 15px !important; }
          #transactions.transactions-container .transactions-table tbody tr td {
            grid-template-columns: 62px minmax(0,1fr) !important; min-height: 40px !important; gap: 7px !important;
          }
          #transactions.transactions-container .transactions-table tbody tr td::before { font-size: 9px !important; }
          #transactions.transactions-container .status-badge,
          #transactions.transactions-container .type-badge { min-width: 72px !important; min-height: 27px !important; font-size: 10px !important; }
        }
        @media (max-width: 360px) {
          #transactions.transactions-container .transactions-table tbody tr td { grid-template-columns: 58px minmax(0,1fr) !important; }
        }
      `}</style>
      <style>{`
        /* =====================================================
           SITE-MATCHING DARK GLASS THEME
           Matches Dashboard / Overview / Loans / Trading
        ===================================================== */
        #transactions.transactions-container {
          background: transparent !important;
          color: #F8FAFC !important;
          font-family: 'Plus Jakarta Sans', Inter, system-ui, sans-serif !important;
        }

        #transactions.transactions-container .glass-card {
          background: linear-gradient(145deg, rgba(39,39,70,.92), rgba(28,29,58,.88)) !important;
          border: 1px solid rgba(167,139,250,.24) !important;
          color: #F8FAFC !important;
          box-shadow: 0 14px 35px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.06) !important;
          backdrop-filter: blur(18px) !important;
          -webkit-backdrop-filter: blur(18px) !important;
        }

        #transactions.transactions-container .glass-card:hover {
          background: linear-gradient(145deg, rgba(48,47,82,.96), rgba(31,32,64,.92)) !important;
          border-color: rgba(167,139,250,.42) !important;
          box-shadow: 0 18px 42px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.08) !important;
        }

        #transactions.transactions-container h1,
        #transactions.transactions-container h2,
        #transactions.transactions-container h3,
        #transactions.transactions-container h4,
        #transactions.transactions-container strong {
          color: #F8FAFC !important;
        }

        #transactions.transactions-container h3 {
          color: #C4B5FD !important;
        }

        #transactions.transactions-container .summary-label {
          color: rgba(226,232,240,.68) !important;
        }

        #transactions.transactions-container .summary-value-pending {
          color: #FBBF24 !important;
        }
        #transactions.transactions-container .summary-value-received {
          color: #6EE7B7 !important;
        }
        #transactions.transactions-container .summary-value-give {
          color: #FDA4AF !important;
        }
        #transactions.transactions-container .summary-value-take {
          color: #93C5FD !important;
        }

        #transactions.transactions-container .transactions-table-wrap {
          background: rgba(18,19,40,.72) !important;
          border: 1px solid rgba(167,139,250,.18) !important;
          border-radius: 14px !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04) !important;
        }

        #transactions.transactions-container .transactions-table {
          color: #F8FAFC !important;
        }

        #transactions.transactions-container .transactions-table th {
          background: linear-gradient(135deg, rgba(67,56,202,.28), rgba(124,58,237,.20)) !important;
          color: #DDD6FE !important;
          border-bottom: 1px solid rgba(167,139,250,.20) !important;
        }

        #transactions.transactions-container .transactions-table td,
        #transactions.transactions-container .transactions-table td span,
        #transactions.transactions-container .transactions-table td div {
          color: rgba(248,250,252,.88) !important;
          border-bottom-color: rgba(148,163,184,.10) !important;
        }

        #transactions.transactions-container .transactions-table tbody tr:hover {
          background: rgba(124,58,237,.10) !important;
        }

        #transactions.transactions-container .transaction-notes-cell {
          color: rgba(226,232,240,.62) !important;
        }

        #transactions.transactions-container input,
        #transactions.transactions-container textarea,
        #transactions.transactions-container select,
        #transactions.transactions-container .edit-input,
        #transactions.transactions-container .edit-select {
          background: rgba(255,255,255,.075) !important;
          color: #F8FAFC !important;
          -webkit-text-fill-color: #F8FAFC !important;
          border: 1px solid rgba(196,181,253,.22) !important;
          box-shadow: none !important;
        }

        #transactions.transactions-container input::placeholder,
        #transactions.transactions-container textarea::placeholder {
          color: rgba(226,232,240,.48) !important;
          -webkit-text-fill-color: rgba(226,232,240,.48) !important;
        }

        #transactions.transactions-container input:focus,
        #transactions.transactions-container textarea:focus,
        #transactions.transactions-container select:focus,
        #transactions.transactions-container .edit-input:focus,
        #transactions.transactions-container .edit-select:focus {
          background: rgba(124,58,237,.12) !important;
          border-color: #8B5CF6 !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,.14) !important;
        }

        #transactions.transactions-container option {
          background: #20213F !important;
          color: #F8FAFC !important;
        }

        #transactions.transactions-container .glass-btn {
          background: rgba(255,255,255,.075) !important;
          color: #EDE9FE !important;
          border: 1px solid rgba(196,181,253,.22) !important;
          box-shadow: 0 5px 16px rgba(0,0,0,.16) !important;
        }

        #transactions.transactions-container .glass-btn:hover {
          background: rgba(124,58,237,.24) !important;
          color: #FFFFFF !important;
          border-color: rgba(167,139,250,.50) !important;
        }

        #transactions.transactions-container .glass-btn.primary {
          background: linear-gradient(135deg,#7C3AED,#4F46E5) !important;
          color: #FFFFFF !important;
          border-color: rgba(196,181,253,.38) !important;
          box-shadow: 0 7px 18px rgba(79,70,229,.28) !important;
        }

        #transactions.transactions-container .glass-btn.success {
          background: rgba(16,185,129,.14) !important;
          color: #6EE7B7 !important;
          border-color: rgba(16,185,129,.32) !important;
        }

        #transactions.transactions-container .glass-btn.danger {
          background: rgba(239,68,68,.14) !important;
          color: #FCA5A5 !important;
          border-color: rgba(239,68,68,.32) !important;
        }

        #transactions.transactions-container .type-give {
          background: rgba(239,68,68,.14) !important;
          color: #FDA4AF !important;
          border-color: rgba(239,68,68,.28) !important;
        }
        #transactions.transactions-container .type-take {
          background: rgba(16,185,129,.14) !important;
          color: #6EE7B7 !important;
          border-color: rgba(16,185,129,.28) !important;
        }
        #transactions.transactions-container .status-pending {
          background: rgba(245,158,11,.14) !important;
          color: #FCD34D !important;
          border-color: rgba(245,158,11,.28) !important;
        }
        #transactions.transactions-container .status-received {
          background: rgba(16,185,129,.14) !important;
          color: #6EE7B7 !important;
          border-color: rgba(16,185,129,.28) !important;
        }

        #transactions.transactions-container .error-message {
          background: rgba(239,68,68,.13) !important;
          color: #FCA5A5 !important;
          border-color: rgba(239,68,68,.30) !important;
        }
        #transactions.transactions-container .success-message {
          background: rgba(16,185,129,.12) !important;
          color: #6EE7B7 !important;
          border-color: rgba(16,185,129,.28) !important;
        }

        /* Modals */
        .transactions-container + .modal-overlay,
        .modal-overlay {
          background: rgba(4,5,16,.70) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
        }

        .modal-overlay .modal-content {
          background: linear-gradient(145deg,#292947,#1E1F3A) !important;
          color: #F8FAFC !important;
          border: 1px solid rgba(167,139,250,.30) !important;
          box-shadow: 0 24px 70px rgba(0,0,0,.42) !important;
        }

        .modal-overlay .modal-title,
        .modal-overlay .detail-value {
          color: #F8FAFC !important;
        }

        .modal-overlay .detail-label,
        .modal-overlay .form-group label {
          color: rgba(226,232,240,.68) !important;
        }

        .modal-overlay .form-group input,
        .modal-overlay .form-group textarea,
        .modal-overlay .modal-select {
          background: rgba(255,255,255,.075) !important;
          color: #F8FAFC !important;
          -webkit-text-fill-color: #F8FAFC !important;
          border-color: rgba(196,181,253,.22) !important;
        }

        .modal-overlay .form-group input::placeholder,
        .modal-overlay .form-group textarea::placeholder {
          color: rgba(226,232,240,.45) !important;
          -webkit-text-fill-color: rgba(226,232,240,.45) !important;
        }

        .modal-overlay .modal-close {
          background: rgba(239,68,68,.14) !important;
          color: #FCA5A5 !important;
          border-color: rgba(239,68,68,.25) !important;
        }

        @media (max-width: 768px) {
          #transactions.transactions-container .glass-card {
            border-radius: 15px !important;
          }
        }
      `}</style>
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

        /* FINAL LIGHT THEME OVERRIDES
           Scoped strongly so parent/global dark CSS cannot override this page. */
        #transactions.transactions-container {
          background: transparent !important;
          color: #172033 !important;
        }

        #transactions.transactions-container .glass-card {
          background: linear-gradient(145deg, #e0f2fe 0%, #ede9fe 48%, #fce7f3 100%) !important;
          color: #172033 !important;
          border-color: rgba(99,102,241,.28) !important;
          box-shadow: 0 14px 35px rgba(79,70,229,.13), inset 0 1px 0 rgba(255,255,255,.75) !important;
        }

        #transactions.transactions-container .glass-card:hover {
          background: linear-gradient(145deg, #dbeafe 0%, #e9d5ff 52%, #fbcfe8 100%) !important;
          border-color: #818cf8 !important;
        }

        #transactions.transactions-container .transactions-table-wrap {
          background: rgba(255,255,255,.48) !important;
          border-color: rgba(99,102,241,.20) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.65) !important;
        }

        #transactions.transactions-container .transactions-table th {
          background: linear-gradient(135deg,#dbeafe,#ede9fe) !important;
          color: #3730a3 !important;
          border-bottom-color: rgba(79,70,229,.20) !important;
        }

        #transactions.transactions-container .transactions-table td {
          color: #334155 !important;
        }

        #transactions.transactions-container .transactions-table tbody tr:hover {
          background: linear-gradient(90deg,rgba(219,234,254,.72),rgba(237,233,254,.72)) !important;
        }

        #transactions.transactions-container .edit-input,
        #transactions.transactions-container .edit-select {
          background: #ffffff !important;
          color: #172033 !important;
          -webkit-text-fill-color: #172033 !important;
          border-color: #cbd5e1 !important;
        }

        #transactions.transactions-container .edit-input:focus,
        #transactions.transactions-container .edit-select:focus {
          background: #ffffff !important;
          border-color: #6366f1 !important;
        }

        #transactions.transactions-container .glass-btn {
          color: #3730a3 !important;
          background: linear-gradient(135deg,#ffffffcc,#e0e7ffcc) !important;
          border-color: rgba(79,70,229,.24) !important;
        }

        #transactions.transactions-container .glass-btn.primary {
          background: linear-gradient(135deg,#c4b5fd,#93c5fd) !important;
          color: #312e81 !important;
          border-color: #818cf8 !important;
          box-shadow: 0 6px 16px rgba(79,70,229,.20) !important;
        }

        #transactions.transactions-container .glass-btn.success {
          background: linear-gradient(135deg,#bbf7d0,#99f6e4) !important;
          color: #065f46 !important;
          border-color: #34d399 !important;
        }

        #transactions.transactions-container .glass-btn.danger {
          background: linear-gradient(135deg,#fecdd3,#fda4af) !important;
          color: #9f1239 !important;
          border-color: #fb7185 !important;
        }

        #transactions.transactions-container .summary-label {
          color: #64748b !important;
        }

        #transactions.transactions-container h3,
        #transactions.transactions-container h3 * {
          color: #4338ca !important;
        }

        /* Summary values */
        #transactions.transactions-container .summary-value-pending {
          color: #c2410c !important;
        }

        #transactions.transactions-container .summary-value-received {
          color: #047857 !important;
        }

        #transactions.transactions-container .summary-value-give {
          color: #be123c !important;
        }

        #transactions.transactions-container .summary-value-take {
          color: #4338ca !important;
        }

        /* Modal always stays bright and readable */
        .transactions-container + .modal-overlay,
        .modal-overlay {
          background: rgba(15, 23, 42, .42) !important;
        }

        .modal-overlay .modal-content {
          background: linear-gradient(145deg, #e0f2fe 0%, #ede9fe 55%, #fce7f3 100%) !important;
          color: #172033 !important;
          border-color: #dbe5f1 !important;
        }

        .modal-overlay .modal-title {
          color: #4338ca !important;
        }

        .modal-overlay .form-group label,
        .modal-overlay .detail-label {
          color: #64748b !important;
        }

        .modal-overlay .form-group input,
        .modal-overlay .form-group textarea,
        .modal-overlay .modal-select {
          background: #ffffff !important;
          color: #172033 !important;
          -webkit-text-fill-color: #172033 !important;
          border-color: #cbd5e1 !important;
        }

        .modal-overlay .detail-value {
          color: #172033 !important;
        }


        /* =====================================================
           SINGLE-COLOR THEME
           One blue family only. Green/red are reserved for
           transaction/status meaning.
        ===================================================== */

        #transactions.transactions-container {
          background: transparent !important;
          color: #111827 !important;
        }

        #transactions.transactions-container .glass-card {
          background: #dbeafe !important;
          color: #111827 !important;
          border: 1px solid #93c5fd !important;
          box-shadow: 0 12px 30px rgba(30,64,175,.12) !important;
        }

        #transactions.transactions-container .glass-card:hover {
          background: #bfdbfe !important;
          border-color: #60a5fa !important;
        }

        #transactions.transactions-container .transactions-table-wrap {
          background: #eff6ff !important;
          border: 1px solid #93c5fd !important;
        }

        #transactions.transactions-container .transactions-table th {
          background: #bfdbfe !important;
          color: #111827 !important;
          border-bottom: 1px solid #93c5fd !important;
        }

        #transactions.transactions-container .transactions-table td,
        #transactions.transactions-container .transactions-table td span,
        #transactions.transactions-container .transactions-table td div {
          color: #111827 !important;
        }

        #transactions.transactions-container .transactions-table tbody tr:hover {
          background: #dbeafe !important;
        }

        #transactions.transactions-container .summary-label {
          color: #111827 !important;
        }

        #transactions.transactions-container .edit-input,
        #transactions.transactions-container .edit-select,
        #transactions.transactions-container input,
        #transactions.transactions-container select,
        #transactions.transactions-container textarea {
          background: #eff6ff !important;
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
          border: 1px solid #93c5fd !important;
        }

        #transactions.transactions-container .edit-input:focus,
        #transactions.transactions-container .edit-select:focus,
        #transactions.transactions-container input:focus,
        #transactions.transactions-container select:focus,
        #transactions.transactions-container textarea:focus {
          background: #ffffff !important;
          color: #111827 !important;
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,.22) !important;
          outline: none !important;
        }

        #transactions.transactions-container input::placeholder,
        #transactions.transactions-container textarea::placeholder {
          color: #475569 !important;
          -webkit-text-fill-color: #475569 !important;
          opacity: 1 !important;
        }

        #transactions.transactions-container .glass-btn {
          background: #bfdbfe !important;
          color: #111827 !important;
          border: 1px solid #60a5fa !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        #transactions.transactions-container .glass-btn:hover {
          background: #93c5fd !important;
          color: #111827 !important;
          border-color: #2563eb !important;
        }

        #transactions.transactions-container .glass-btn:focus-visible {
          outline: 3px solid rgba(37,99,235,.30) !important;
          outline-offset: 2px !important;
        }

        #transactions.transactions-container .glass-btn.primary {
          background: #93c5fd !important;
          color: #111827 !important;
          border-color: #2563eb !important;
        }

        #transactions.transactions-container .glass-btn.success {
          background: #bbf7d0 !important;
          color: #166534 !important;
          border-color: #4ade80 !important;
        }

        #transactions.transactions-container .glass-btn.danger {
          background: #fecaca !important;
          color: #991b1b !important;
          border-color: #f87171 !important;
        }

        /* Meaning/status colors */
        #transactions.transactions-container .type-give {
          background: #fecaca !important;
          color: #991b1b !important;
          border-color: #f87171 !important;
        }

        #transactions.transactions-container .type-take {
          background: #bbf7d0 !important;
          color: #166534 !important;
          border-color: #4ade80 !important;
        }

        #transactions.transactions-container .status-pending {
          background: #fecaca !important;
          color: #991b1b !important;
          border-color: #f87171 !important;
        }

        #transactions.transactions-container .status-received {
          background: #bbf7d0 !important;
          color: #166534 !important;
          border-color: #4ade80 !important;
        }

        /* Error/success messages */
        #transactions.transactions-container .error-message {
          background: #fecaca !important;
          color: #991b1b !important;
          border-color: #f87171 !important;
        }

        #transactions.transactions-container .success-message {
          background: #bbf7d0 !important;
          color: #166534 !important;
          border-color: #4ade80 !important;
        }

        /* =====================================================
           POPUPS
        ===================================================== */

        .modal-overlay {
          background: rgba(15,23,42,.48) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
        }

        .modal-overlay .modal-content {
          background: #dbeafe !important;
          color: #111827 !important;
          border: 1px solid #93c5fd !important;
          box-shadow: 0 24px 65px rgba(30,64,175,.24) !important;
        }

        .modal-overlay .modal-title,
        .modal-overlay .detail-value {
          color: #111827 !important;
        }

        .modal-overlay .detail-label,
        .modal-overlay .form-group label {
          color: #1e293b !important;
        }

        .modal-overlay .form-group input,
        .modal-overlay .form-group textarea,
        .modal-overlay .modal-select {
          background: #eff6ff !important;
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
          border: 1px solid #93c5fd !important;
        }

        .modal-overlay .form-group input:focus,
        .modal-overlay .form-group textarea:focus,
        .modal-overlay .modal-select:focus {
          background: #ffffff !important;
          color: #111827 !important;
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,.22) !important;
          outline: none !important;
        }

        .modal-overlay .glass-btn {
          opacity: 1 !important;
          visibility: visible !important;
        }

        .modal-overlay .modal-close {
          background: #bfdbfe !important;
          color: #111827 !important;
          border-color: #60a5fa !important;
        }

        .modal-overlay .modal-close:hover {
          background: #93c5fd !important;
          color: #111827 !important;
        }

        /* Select dropdown text */
        #transactions.transactions-container option,
        .modal-overlay option {
          background: #eff6ff !important;
          color: #111827 !important;
        }

        /* All focus states stay visible */
        #transactions.transactions-container button:focus-visible,
        #transactions.transactions-container input:focus-visible,
        #transactions.transactions-container select:focus-visible,
        #transactions.transactions-container textarea:focus-visible,
        .modal-overlay button:focus-visible,
        .modal-overlay input:focus-visible,
        .modal-overlay select:focus-visible,
        .modal-overlay textarea:focus-visible {
          outline: 3px solid rgba(37,99,235,.30) !important;
          outline-offset: 2px !important;
        }


        /* =====================================================
           FINAL PROFESSIONAL MODALS
        ===================================================== */

        .modal-overlay {
          position: fixed !important;
          inset: 0 !important;
          z-index: 99999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding:
            max(20px, env(safe-area-inset-top))
            max(20px, env(safe-area-inset-right))
            max(20px, env(safe-area-inset-bottom))
            max(20px, env(safe-area-inset-left)) !important;
          background: rgba(15,23,42,.58) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          overflow: auto !important;
          box-sizing: border-box !important;
        }

        .modal-content {
          position: relative !important;
          width: min(560px, 100%) !important;
          max-width: 560px !important;
          max-height: min(86dvh, 720px) !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
          margin: auto !important;
          padding: 26px !important;
          border-radius: 22px !important;
          background: #dbeafe !important;
          border: 1px solid #60a5fa !important;
          color: #111827 !important;
          box-shadow:
            0 28px 80px rgba(15,23,42,.30),
            0 8px 24px rgba(37,99,235,.16) !important;
        }

        /* Every popup child remains readable */
        .modal-content,
        .modal-content * {
          box-sizing: border-box;
        }

        .modal-content h2,
        .modal-content h3,
        .modal-content .modal-title {
          color: #111827 !important;
        }

        .modal-content .form-group label,
        .modal-content .detail-label {
          color: #334155 !important;
          font-weight: 800 !important;
        }

        .modal-content .detail-row {
          display: grid !important;
          grid-template-columns: minmax(105px, 35%) minmax(0, 65%) !important;
          align-items: center !important;
          gap: 16px !important;
          padding: 13px 4px !important;
          border-bottom: 1px solid rgba(37,99,235,.13) !important;
        }

        .modal-content .detail-value {
          color: #111827 !important;
          font-weight: 800 !important;
          text-align: right !important;
          min-width: 0 !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
          line-height: 1.45 !important;
        }

        .modal-content .detail-value .type-badge,
        .modal-content .detail-value .status-badge {
          display: inline-flex !important;
          float: right !important;
        }

        .modal-content input,
        .modal-content textarea,
        .modal-content select {
          min-height: 42px !important;
          background: #eff6ff !important;
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
          border: 1px solid #60a5fa !important;
          border-radius: 10px !important;
          padding: 9px 11px !important;
          outline: none !important;
        }

        .modal-content input:focus,
        .modal-content textarea:focus,
        .modal-content select:focus {
          background: #ffffff !important;
          color: #111827 !important;
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,.22) !important;
        }

        /* Reliable visible close icon */
        .modal-content .modal-close,
        .modal-content button[aria-label="Close"],
        .modal-content button[title="Close"] {
          position: absolute !important;
          top: 16px !important;
          right: 16px !important;
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          min-height: 40px !important;
          padding: 0 !important;
          margin: 0 !important;
          border-radius: 50% !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 20 !important;
          background: #bfdbfe !important;
          border: 1px solid #3b82f6 !important;
          color: #111827 !important;
          opacity: 1 !important;
          visibility: visible !important;
          cursor: pointer !important;
        }

        .modal-content .modal-close svg,
        .modal-content button[aria-label="Close"] svg,
        .modal-content button[title="Close"] svg {
          width: 20px !important;
          height: 20px !important;
          min-width: 20px !important;
          min-height: 20px !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          color: #111827 !important;
          stroke: #111827 !important;
          stroke-width: 2.5 !important;
        }

        .modal-content .modal-close:hover,
        .modal-content button[aria-label="Close"]:hover,
        .modal-content button[title="Close"]:hover {
          background: #93c5fd !important;
          transform: scale(1.04);
        }

        .modal-content .modal-close:active,
        .modal-content button[aria-label="Close"]:active,
        .modal-content button[title="Close"]:active {
          transform: scale(.92);
        }

        .modal-content .form-actions {
          display: flex !important;
          justify-content: flex-end !important;
          gap: 10px !important;
          margin-top: 18px !important;
          padding-top: 14px !important;
          border-top: 1px solid rgba(37,99,235,.13) !important;
        }

        .modal-content .form-actions .glass-btn {
          min-width: 112px !important;
          min-height: 42px !important;
        }

        /* Mobile: centered, safe top/bottom, fully scrollable */
        @media (max-width: 600px) {
          .modal-overlay {
            align-items: center !important;
            padding:
              max(12px, env(safe-area-inset-top))
              max(12px, env(safe-area-inset-right))
              max(12px, env(safe-area-inset-bottom))
              max(12px, env(safe-area-inset-left)) !important;
          }

          .modal-content {
            width: 100% !important;
            max-width: 100% !important;
            max-height: 88dvh !important;
            padding: 22px 16px !important;
            border-radius: 18px !important;
          }

          .modal-content .modal-close {
            top: 12px !important;
            right: 12px !important;
            width: 38px !important;
            height: 38px !important;
            min-width: 38px !important;
            min-height: 38px !important;
          }

          .modal-content .modal-title {
            padding-right: 48px !important;
            font-size: .98rem !important;
          }

          .modal-content .detail-row {
            grid-template-columns: minmax(90px, 38%) minmax(0, 62%) !important;
            gap: 10px !important;
            padding: 11px 2px !important;
          }

          .modal-content .detail-value {
            text-align: right !important;
          }

          .modal-content .form-actions {
            position: sticky !important;
            bottom: 0 !important;
            background: #dbeafe !important;
            padding-bottom: max(6px, env(safe-area-inset-bottom)) !important;
            z-index: 10 !important;
          }
        }

        @media (max-width: 380px) {
          .modal-content .detail-row {
            grid-template-columns: 1fr !important;
            gap: 4px !important;
          }

          .modal-content .detail-value {
            text-align: left !important;
          }

          .modal-content .detail-value .type-badge,
          .modal-content .detail-value .status-badge {
            float: none !important;
          }

          .modal-content .form-actions {
            flex-direction: column !important;
          }

          .modal-content .form-actions .glass-btn {
            width: 100% !important;
          }
        }


        /* =====================================================
           POPUP TYPOGRAPHY + BUTTONS
           All popup text and button text: bold + black.
        ===================================================== */

        .modal-overlay .modal-content,
        .modal-overlay .modal-content * {
          font-weight: 700 !important;
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
        }

        .modal-overlay .modal-title,
        .modal-overlay .modal-content h1,
        .modal-overlay .modal-content h2,
        .modal-overlay .modal-content h3,
        .modal-overlay .modal-content h4,
        .modal-overlay .modal-content h5,
        .modal-overlay .modal-content h6 {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          font-weight: 800 !important;
        }

        .modal-overlay .modal-content label,
        .modal-overlay .modal-content p,
        .modal-overlay .modal-content span,
        .modal-overlay .modal-content div,
        .modal-overlay .modal-content td,
        .modal-overlay .modal-content th,
        .modal-overlay .modal-content input,
        .modal-overlay .modal-content textarea,
        .modal-overlay .modal-content select,
        .modal-overlay .modal-content option {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          font-weight: 700 !important;
        }

        .modal-overlay .modal-content input::placeholder,
        .modal-overlay .modal-content textarea::placeholder {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          opacity: .65 !important;
          font-weight: 700 !important;
        }

        /* Every popup button */
        .modal-overlay .modal-content button,
        .modal-overlay .modal-content .glass-btn,
        .modal-overlay .modal-content .modal-close {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          font-weight: 800 !important;
          text-shadow: none !important;
        }

        .modal-overlay .modal-content button svg,
        .modal-overlay .modal-content .glass-btn svg,
        .modal-overlay .modal-content .modal-close svg {
          color: #000000 !important;
          stroke: #000000 !important;
          fill: none !important;
          opacity: 1 !important;
        }

        .modal-overlay .modal-content button:hover {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
        }

        .modal-overlay .modal-content button:focus-visible {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          outline: 3px solid rgba(37,99,235,.35) !important;
          outline-offset: 2px !important;
        }

        /* Keep status/type backgrounds, but text remains black + bold */
        .modal-overlay .modal-content .type-give,
        .modal-overlay .modal-content .type-take,
        .modal-overlay .modal-content .status-pending,
        .modal-overlay .modal-content .status-received {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          font-weight: 800 !important;
        }

      `}</style>

      <style>{`
        /* =========================================================
           FINAL RESPONSIVE + PROFESSIONAL UI LAYER
           Keeps the existing design, but makes every control,
           badge, status, action and modal mobile-safe.
        ========================================================= */

        #transactions.transactions-container {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow: visible;
          padding:
            8px
            max(8px, env(safe-area-inset-right))
            calc(8px + env(safe-area-inset-bottom))
            max(8px, env(safe-area-inset-left));
        }

        #transactions.transactions-container *,
        #transactions.transactions-container *::before,
        #transactions.transactions-container *::after {
          box-sizing: border-box;
        }

        #transactions.transactions-container .glass-card {
          min-width: 0;
          overflow: visible;
        }

        #transactions.transactions-container .glass-btn {
          min-height: 36px;
          min-width: 38px;
          padding: 7px 11px;
          line-height: 1;
          white-space: nowrap;
          touch-action: manipulation;
        }

        #transactions.transactions-container .status-badge,
        #transactions.transactions-container .type-badge {
          min-height: 24px;
          min-width: 62px;
          padding: 4px 9px;
          border-radius: 999px;
          font-size: 11px;
          line-height: 1.15;
          text-align: center;
          vertical-align: middle;
        }

        #transactions.transactions-container .summary-label {
          line-height: 1.25;
          white-space: normal;
        }

        #transactions.transactions-container .transaction-filter-select {
          min-width: 120px;
          max-width: 150px !important;
        }

        #transactions.transactions-container .transactions-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }

        #transactions.transactions-container .transactions-table {
          width: 100%;
          min-width: 820px;
        }

        /* Better desktop action spacing */
        #transactions.transactions-container .transactions-table td:last-child > div {
          flex-wrap: wrap;
          align-items: center;
        }

        /* ------------------------- Tablet ------------------------- */
        @media (max-width: 900px) {
          #transactions.transactions-container {
            padding: 7px;
          }

          #transactions.transactions-container .glass-card {
            border-radius: 16px;
            padding: 0.9rem;
          }

          #transactions.transactions-container .transactions-table {
            min-width: 760px;
          }

          #transactions.transactions-container .transactions-table td:last-child {
            min-width: 165px;
          }
        }

        /* ------------------------- Mobile ------------------------- */
        @media (max-width: 768px) {
          #transactions.transactions-container {
            padding: 5px;
          }

          #transactions.transactions-container .glass-card {
            border-radius: 14px;
            padding: 0.75rem;
            margin-bottom: 0.6rem;
          }

          /* Summary cards */
          #transactions.transactions-container .glass-card > div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 7px !important;
          }

          #transactions.transactions-container .glass-card > div[style*="gridTemplateColumns"] .glass-card {
            min-height: 66px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          /* Main header */
          #transactions.transactions-container .glass-card > div[style*="justify-content: space-between"] {
            align-items: stretch !important;
          }

          #transactions.transactions-container .glass-card > div[style*="justify-content: space-between"] > div {
            width: 100%;
            justify-content: flex-start !important;
          }

          #transactions.transactions-container .glass-card > div[style*="justify-content: space-between"] > div .glass-btn {
            flex: 1 1 0;
          }

          /* Filters */
          #transactions.transactions-container .transaction-filter-select {
            width: calc(50% - 4px) !important;
            max-width: none !important;
            min-width: 0 !important;
            flex: 1 1 0;
          }

          #transactions.transactions-container .edit-input[placeholder="Search by name or notes..."] {
            width: 100%;
            max-width: none !important;
            min-width: 0 !important;
            flex: 1 1 100% !important;
          }

          /* Mobile table becomes stacked transaction cards.
             No horizontal scrolling is required. */
          #transactions.transactions-container .transactions-table-wrap {
            overflow: visible;
            border: 0 !important;
            background: transparent !important;
          }

          #transactions.transactions-container .transactions-table {
            width: 100% !important;
            min-width: 0 !important;
            display: block;
            border-spacing: 0;
          }

          #transactions.transactions-container .transactions-table thead {
            display: none;
          }

          #transactions.transactions-container .transactions-table tbody {
            display: block;
            width: 100%;
          }

          #transactions.transactions-container .transactions-table tbody tr {
            display: block;
            width: 100%;
            margin: 0 0 10px;
            padding: 8px;
            border: 1px solid rgba(167,139,250,.22) !important;
            border-radius: 13px;
            background: rgba(255,255,255,.045) !important;
            box-shadow: 0 8px 22px rgba(0,0,0,.14);
          }

          #transactions.transactions-container .transactions-table tbody tr:hover {
            background: rgba(124,58,237,.10) !important;
          }

          #transactions.transactions-container .transactions-table tbody tr td {
            display: flex !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            padding: 7px 4px !important;
            margin: 0;
            gap: 10px;
            align-items: center;
            justify-content: space-between;
            text-align: right !important;
            border-bottom: 1px solid rgba(148,163,184,.10) !important;
          }

          #transactions.transactions-container .transactions-table tbody tr td:last-child {
            border-bottom: 0 !important;
            min-width: 0 !important;
          }

          #transactions.transactions-container .transactions-table tbody tr td::before {
            flex: 0 0 76px;
            width: 76px;
            color: rgba(226,232,240,.56) !important;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .35px;
            text-align: left;
          }

          #transactions.transactions-container .transactions-table tbody tr td:nth-child(1)::before { content: "Name"; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(2)::before { content: "Amount"; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(3)::before { content: "Date"; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(4)::before { content: "Status"; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(5)::before { content: "Type"; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(6)::before { content: "Notes"; }
          #transactions.transactions-container .transactions-table tbody tr td:nth-child(7)::before { content: "Actions"; }

          #transactions.transactions-container .transactions-table tbody tr td > div {
            min-width: 0;
            max-width: calc(100% - 86px);
          }

          #transactions.transactions-container .transaction-notes-cell {
            min-width: 0 !important;
            max-width: none !important;
            overflow-wrap: anywhere;
          }

          #transactions.transactions-container .transactions-table td .edit-input,
          #transactions.transactions-container .transactions-table td .edit-select {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            min-height: 36px;
            font-size: 12px !important;
          }

          #transactions.transactions-container .transactions-table td:last-child > div {
            width: 100%;
            max-width: 100%;
            display: flex;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 6px !important;
          }

          #transactions.transactions-container .transactions-table td:last-child .glass-btn {
            min-width: 42px !important;
            min-height: 36px;
            padding: 7px 9px !important;
          }

          #transactions.transactions-container .transactions-table td:last-child .glass-btn svg {
            width: 14px;
            height: 14px;
          }

          /* Badges stay readable and never clip */
          #transactions.transactions-container .status-badge,
          #transactions.transactions-container .type-badge {
            flex: 0 0 auto;
            min-width: 72px;
            max-width: 100%;
            min-height: 26px;
            padding: 5px 10px;
            font-size: 10px;
          }

          /* Footer line */
          #transactions.transactions-container .transactions-table-wrap + div {
            flex-direction: column !important;
            align-items: flex-start !important;
            font-size: 10px !important;
          }

          /* Modals */
          #transactions.transactions-container ~ .modal-overlay,
          .modal-overlay {
            padding:
              max(10px, env(safe-area-inset-top))
              max(10px, env(safe-area-inset-right))
              max(10px, env(safe-area-inset-bottom))
              max(10px, env(safe-area-inset-left));
          }

          .modal-overlay .modal-content {
            width: 100% !important;
            max-width: 560px !important;
            max-height: min(88dvh, 760px) !important;
            padding: 1rem !important;
            border-radius: 17px !important;
            overflow-y: auto;
            overscroll-behavior: contain;
          }

          .modal-overlay .form-row {
            grid-template-columns: 1fr !important;
            gap: 9px !important;
          }

          .modal-overlay .form-actions {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px !important;
          }

          .modal-overlay .form-actions .glass-btn {
            width: 100% !important;
            min-height: 42px;
          }

          .modal-overlay .detail-row {
            display: grid !important;
            grid-template-columns: minmax(82px, 34%) minmax(0, 66%) !important;
            gap: 8px !important;
            align-items: start !important;
          }

          .modal-overlay .detail-value {
            min-width: 0;
            overflow-wrap: anywhere;
          }
        }

        /* ------------------------- Small phones ------------------------- */
        @media (max-width: 480px) {
          #transactions.transactions-container {
            padding: 3px;
          }

          #transactions.transactions-container .glass-card {
            padding: 0.6rem;
            border-radius: 12px;
          }

          #transactions.transactions-container .glass-card > div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr 1fr !important;
            gap: 5px !important;
          }

          #transactions.transactions-container .summary-label {
            font-size: 9px !important;
          }

          #transactions.transactions-container .summary-value-pending,
          #transactions.transactions-container .summary-value-received,
          #transactions.transactions-container .summary-value-give,
          #transactions.transactions-container .summary-value-take {
            font-size: 14px !important;
          }

          #transactions.transactions-container .glass-btn {
            min-height: 38px;
            padding: 7px 9px;
            font-size: 11px;
          }

          #transactions.transactions-container .glass-btn svg {
            width: 13px;
            height: 13px;
          }

          #transactions.transactions-container .transactions-table tbody tr {
            padding: 6px;
            border-radius: 11px;
          }

          #transactions.transactions-container .transactions-table tbody tr td {
            padding: 6px 2px !important;
            gap: 7px;
          }

          #transactions.transactions-container .transactions-table tbody tr td::before {
            flex-basis: 64px;
            width: 64px;
            font-size: 9px;
          }

          #transactions.transactions-container .transactions-table tbody tr td > div {
            max-width: calc(100% - 71px);
          }

          #transactions.transactions-container .status-badge,
          #transactions.transactions-container .type-badge {
            min-width: 62px;
            min-height: 24px;
            padding: 4px 7px;
            font-size: 9px;
          }

          #transactions.transactions-container .transactions-table td:last-child > div {
            gap: 4px !important;
          }

          #transactions.transactions-container .transactions-table td:last-child .glass-btn {
            min-width: 38px !important;
            min-height: 36px;
            padding: 7px !important;
          }

          .modal-overlay .modal-content {
            padding: .85rem !important;
            border-radius: 14px !important;
          }

          .modal-overlay .form-actions {
            grid-template-columns: 1fr !important;
          }

          .modal-overlay .detail-row {
            grid-template-columns: 1fr !important;
          }

          .modal-overlay .detail-label,
          .modal-overlay .detail-value {
            text-align: left !important;
          }

          .modal-overlay .detail-value {
            margin-top: -2px;
          }
        }

        @media (max-width: 360px) {
          #transactions.transactions-container .glass-card > div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }

          #transactions.transactions-container .glass-card > div[style*="justify-content: space-between"] > div {
            flex-direction: column;
          }

          #transactions.transactions-container .glass-card > div[style*="justify-content: space-between"] > div .glass-btn {
            width: 100%;
            flex: 1 1 auto;
          }

          #transactions.transactions-container .transaction-filter-select {
            width: 100% !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          #transactions.transactions-container *,
          #transactions.transactions-container *::before,
          #transactions.transactions-container *::after,
          .modal-overlay,
          .modal-overlay .modal-content {
            animation: none !important;
            transition: none !important;
          }
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
                <div className="summary-value-pending" style={{ fontSize: '1rem', fontWeight: 800 }}>
                  {formatCurrency(summary.summary?.totalPending || 0)}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '0.6rem', textAlign: 'center', background: 'rgba(16,185,129,0.05)' }}>
                <div className="summary-label" style={{ fontSize: '0.5rem' }}>Received</div>
                <div className="summary-value-received" style={{ fontSize: '1rem', fontWeight: 800 }}>
                  {formatCurrency(summary.summary?.totalReceived || 0)}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '0.6rem', textAlign: 'center', background: 'rgba(239,68,68,0.05)' }}>
                <div className="summary-label" style={{ fontSize: '0.5rem' }}>Give</div>
                <div className="summary-value-give" style={{ fontSize: '1rem', fontWeight: 800 }}>
                  {formatCurrency(summary.summary?.totalGive || 0)}
                </div>
              </div>
              <div className="glass-card" style={{ padding: '0.6rem', textAlign: 'center', background: 'rgba(124,58,237,0.05)' }}>
                <div className="summary-label" style={{ fontSize: '0.5rem' }}>Take</div>
                <div className="summary-value-take" style={{ fontSize: '1rem', fontWeight: 800 }}>
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
              <ClockIcon size={18} color="#4f46e5" /> Transactions
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
              <h4 className="modal-title" style={{ color: '#be123c' }}>
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