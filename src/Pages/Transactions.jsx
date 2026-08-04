import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Clock as ClockIcon, Filter, Plus, X, Edit2, Save, Trash2 } from 'lucide-react';

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [transactions, setTransactions] = useState([
    { id: 1, name: 'Rahul Sharma', amount: 15000, date: '2024-07-25', status: 'Pending', type: 'give' },
    { id: 2, name: 'Priya Patel', amount: 8500, date: '2024-07-20', status: 'Received', type: 'take' },
    { id: 3, name: 'Amit Kumar', amount: 22000, date: '2024-07-15', status: 'Pending', type: 'give' },
    { id: 4, name: 'Sneha Reddy', amount: 5000, date: '2024-07-10', status: 'Received', type: 'take' },
    { id: 5, name: 'Vikram Singh', amount: 12000, date: '2024-07-05', status: 'Pending', type: 'give' },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const totalPending = transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = transactions.filter(t => t.status === 'Received').reduce((sum, t) => sum + t.amount, 0);

  const handleEdit = (tx) => {
    setEditingId(tx.id);
    setEditData({ ...tx });
  };

  const handleSave = (id) => {
    setTransactions(transactions.map(t => t.id === id ? editData : t));
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <style>{`
        .transactions-container {
          width: 100%;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          transition: all 0.3s ease;
          padding: 1.25rem;
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .glass-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 0.3rem 0.7rem;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .glass-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
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

        .edit-input {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 0.3rem 0.5rem;
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.3s ease;
          width: 100%;
        }

        .edit-input:focus {
          border-color: rgba(124, 58, 237, 0.5);
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .edit-select {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 0.3rem 0.5rem;
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          width: 100%;
        }

        .edit-select option {
          background: #0a0a1f;
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

        @media (max-width: 768px) {
          .glass-card { padding: 0.75rem; }
          .transactions-table { font-size: 0.65rem; }
        }

        @media (max-width: 480px) {
          .glass-card { padding: 0.6rem; border-radius: 14px; }
          .transactions-table { font-size: 0.55rem; }
          .edit-input, .edit-select { font-size: 0.6rem; padding: 0.2rem 0.3rem; }
        }
      `}</style>

      {/* ✅ ADDED: id="transactions" for navbar navigation */}
      <div id="transactions" className="transactions-container">
        <div className="glass-card">
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
              <ClockIcon size={18} /> Transactions (Give / Take)
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                <span className="status-badge status-received">Received: ₹{totalReceived.toLocaleString()}</span>
                <span className="status-badge status-pending">Pending: ₹{totalPending.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={14} color="rgba(255,255,255,0.3)" />
              <input
                className="edit-input"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ maxWidth: '250px' }}
              />
            </div>
          </div>

          {/* Transactions List */}
          <div style={{ overflowX: 'auto' }}>
            <table className="transactions-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Name</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Date</th>
                  <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Type</th>
                  <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isEditing = editingId === tx.id;
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      
                      <td style={{ padding: '0.4rem 0.5rem' }}>
                        {isEditing ? (
                          <input className="edit-input" value={editData.name} onChange={(e) => handleChange('name', e.target.value)} style={{ fontSize: '0.7rem' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {tx.type === 'give' ? <ArrowUpRight size={12} color="#FCA5A5" /> : <ArrowDownRight size={12} color="#6EE7B7" />}
                            <span style={{ fontWeight: '600', color: 'white' }}>{tx.name}</span>
                          </div>
                        )}
                      </td>
                      
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                        {isEditing ? (
                          <input className="edit-input" type="number" value={editData.amount} onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)} style={{ fontSize: '0.7rem', width: '80px' }} />
                        ) : (
                          <span style={{ fontWeight: '700', color: tx.type === 'give' ? '#FCA5A5' : '#6EE7B7' }}>
                            {tx.type === 'give' ? '−' : '+'}₹{tx.amount.toLocaleString()}
                          </span>
                        )}
                      </td>
                      
                      <td style={{ padding: '0.4rem 0.5rem' }}>
                        {isEditing ? (
                          <input className="edit-input" type="date" value={editData.date} onChange={(e) => handleChange('date', e.target.value)} style={{ fontSize: '0.7rem' }} />
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>{formatDate(tx.date)}</span>
                        )}
                      </td>
                      
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                        {isEditing ? (
                          <select className="edit-select" value={editData.status} onChange={(e) => handleChange('status', e.target.value)} style={{ fontSize: '0.65rem' }}>
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
                          <select className="edit-select" value={editData.type} onChange={(e) => handleChange('type', e.target.value)} style={{ fontSize: '0.65rem' }}>
                            <option value="give">Give</option>
                            <option value="take">Take</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>
                            {tx.type === 'give' ? 'Give' : 'Take'}
                          </span>
                        )}
                      </td>
                      
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                            <button className="glass-btn success" onClick={() => handleSave(tx.id)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>
                              <Save size={12} />
                            </button>
                            <button className="glass-btn danger" onClick={handleCancel} style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button className="glass-btn" onClick={() => handleEdit(tx)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>
                            <Edit2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Transactions;