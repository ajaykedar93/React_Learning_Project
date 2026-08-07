import React, { useEffect, useState } from 'react';
import { Building2, Filter, Edit2, Save, X, Trash2, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const Loans = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loans, setLoans] = useState([
    { id: 1, name: 'HDFC Bank', amount: 500000, emi: 12500, emiDate: '2024-01-15', remainingEmi: 26, totalEmi: 36 },
    { id: 2, name: 'SBI', amount: 350000, emi: 8500, emiDate: '2024-03-20', remainingEmi: 32, totalEmi: 36 },
    { id: 3, name: 'ICICI Bank', amount: 430000, emi: 10200, emiDate: '2024-05-10', remainingEmi: 30, totalEmi: 36 },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [newLoan, setNewLoan] = useState({
    name: '',
    amount: 0,
    emi: 0,
    emiDate: new Date().toISOString().split('T')[0],
    remainingEmi: 36,
    totalEmi: 36
  });

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
  };

  const handleEdit = (loan) => {
    setEditingId(loan.id);
    setEditData({ ...loan });
  };

  const handleSave = (id) => {
    if (!editData.name?.trim()) {
      showFeedback('error', 'Loan name is required.');
      return;
    }
    setLoans(loans.map(l => l.id === id ? editData : l));
    setEditingId(null);
    showFeedback('success', 'Loan updated successfully.');
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddLoan = () => {
    if (!newLoan.name.trim()) {
      showFeedback('error', 'Loan name is required.');
      return;
    }
    const loan = {
      id: Date.now(),
      ...newLoan,
      amount: parseFloat(newLoan.amount) || 0,
      emi: parseFloat(newLoan.emi) || 0,
      remainingEmi: parseInt(newLoan.remainingEmi) || 36,
      totalEmi: parseInt(newLoan.totalEmi) || 36
    };
    setLoans([...loans, loan]);
    setShowAddModal(false);
    setNewLoan({
      name: '',
      amount: 0,
      emi: 0,
      emiDate: new Date().toISOString().split('T')[0],
      remainingEmi: 36,
      totalEmi: 36
    });
    showFeedback('success', 'Loan added successfully.');
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    setLoans(loans.filter(l => l.id !== confirmDeleteId));
    setConfirmDeleteId(null);
    showFeedback('success', 'Loan deleted successfully.');
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totalLoans = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalEmi = loans.reduce((sum, l) => sum + l.emi, 0);
  const filteredLoans = loans.filter(loan => loan.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  return (
    <>
      <style>{`
        .loans-container {
          width: 100%;
        }

        .glass-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.045));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(196,181,253,0.26);
          border-radius: 20px;
          transition: all 0.3s ease;
          padding: 1.25rem;
          box-shadow: 0 14px 36px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .glass-card:hover {
          background: linear-gradient(145deg, rgba(255,255,255,0.14), rgba(124,58,237,0.08));
          border-color: rgba(196,181,253,0.5);
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .section-feedback {
          width: min(100%, 420px);
          margin: 0 auto 0.8rem;
          padding: 0.55rem 0.8rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          text-align: center;
          font-size: 0.72rem;
          animation: fadeIn 0.25s ease;
        }

        .section-feedback.success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.28);
          color: #6EE7B7;
        }

        .section-feedback.error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.28);
          color: #FCA5A5;
        }

        .loan-confirm-dialog {
          width: min(100%, 360px);
          margin: 0 auto 0.8rem;
          padding: 0.9rem;
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 12px;
          background: rgba(32, 32, 51, 0.98);
          box-shadow: 0 14px 35px rgba(0, 0, 0, 0.35);
          text-align: center;
        }

        .loan-confirm-dialog p {
          margin: 0.5rem 0 0.75rem;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.75rem;
        }

        .loan-confirm-actions {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
        }

        .loan-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .loan-table-wrap table {
          min-width: 720px;
        }

        .loans-table th {
          color: rgba(255,255,255,0.72) !important;
          border-bottom-color: rgba(196,181,253,0.22) !important;
        }

        .loans-table tbody tr:hover {
          background: rgba(124,58,237,0.12) !important;
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
        }

        .glass-btn:hover {
          background: rgba(124, 58, 237, 0.3);
          border-color: rgba(196, 181, 253, 0.6);
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
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.3s ease;
          width: 100%;
        }

        .edit-input:focus {
          border-color: rgba(196, 181, 253, 0.72);
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.1);
          background: rgba(124, 58, 237, 0.16);
        }

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
          background: linear-gradient(145deg, rgba(35,38,76,0.98), rgba(25,28,58,0.98));
          border: 1px solid rgba(196,181,253,0.35);
          border-radius: 24px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
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

        .form-group.full {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
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
          padding: 0.5rem 1.5rem;
          border-radius: 10px;
          border: none;
          font-weight: 700;
          font-size: 0.8rem;
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

        @media (max-width: 768px) {
          .glass-card { padding: 0.75rem; }
          .loans-table { font-size: 0.65rem; }
          .form-grid { grid-template-columns: 1fr; }
          .modal-content { padding: 18px; }
        }

        @media (max-width: 480px) {
          .glass-card { padding: 0.6rem; border-radius: 14px; }
          .loans-table { font-size: 0.55rem; }
          .edit-input { font-size: 0.6rem; padding: 0.2rem 0.3rem; }
        }
      `}</style>

      {/* ✅ ADDED: id="loan-details" for navbar navigation */}
      <div id="loan-details" className="loans-container">
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
              color: '#F43F5E'
            }}>
              <Building2 size={18} /> Loan Details
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                Total: ₹{totalLoans.toLocaleString()} | EMI: ₹{totalEmi.toLocaleString()}
              </span>
              <button className="glass-btn primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Plus size={12} /> Add Loan
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={14} color="rgba(255,255,255,0.3)" />
              <input
                className="edit-input"
                placeholder="Search loans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ maxWidth: '250px' }}
              />
            </div>
          </div>

          {/* Loans List */}
          {feedback && (
            <div className={`section-feedback ${feedback.type}`} role="status" aria-live="polite">
              {feedback.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {feedback.message}
            </div>
          )}

          {confirmDeleteId !== null && (
            <div className="loan-confirm-dialog" role="alertdialog" aria-live="assertive">
              <AlertTriangle size={20} color="#FCD34D" />
              <p>Are you sure you want to delete this loan?</p>
              <div className="loan-confirm-actions">
                <button className="glass-btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                <button className="glass-btn danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          )}

          <div className="loan-table-wrap">
            <table className="loans-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Bank / Name</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Amount</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>EMI</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>EMI Date</th>
                  <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Remaining</th>
                  <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => {
                  const isEditing = editingId === loan.id;
                  return (
                    <tr key={loan.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      
                      <td style={{ padding: '0.4rem 0.5rem' }}>
                        {isEditing ? (
                          <input className="edit-input" value={editData.name} onChange={(e) => handleChange('name', e.target.value)} style={{ fontSize: '0.7rem' }} />
                        ) : (
                          <span style={{ fontWeight: '600', color: 'white' }}>{loan.name}</span>
                        )}
                      </td>
                      
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                        {isEditing ? (
                          <input className="edit-input" type="number" value={editData.amount} onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)} style={{ fontSize: '0.7rem', width: '100px' }} />
                        ) : (
                          <span style={{ fontWeight: '700', color: '#FCA5A5' }}>₹{loan.amount.toLocaleString()}</span>
                        )}
                      </td>
                      
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                        {isEditing ? (
                          <input className="edit-input" type="number" value={editData.emi} onChange={(e) => handleChange('emi', parseFloat(e.target.value) || 0)} style={{ fontSize: '0.7rem', width: '80px' }} />
                        ) : (
                          <span style={{ fontWeight: '600', color: '#FCD34D' }}>₹{loan.emi.toLocaleString()}</span>
                        )}
                      </td>
                      
                      <td style={{ padding: '0.4rem 0.5rem' }}>
                        {isEditing ? (
                          <input className="edit-input" type="date" value={editData.emiDate} onChange={(e) => handleChange('emiDate', e.target.value)} style={{ fontSize: '0.7rem' }} />
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>{formatDate(loan.emiDate)}</span>
                        )}
                      </td>
                      
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', alignItems: 'center' }}>
                            <input className="edit-input" type="number" value={editData.remainingEmi} onChange={(e) => handleChange('remainingEmi', parseInt(e.target.value) || 0)} style={{ fontSize: '0.65rem', width: '50px' }} />
                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>/</span>
                            <input className="edit-input" type="number" value={editData.totalEmi} onChange={(e) => handleChange('totalEmi', parseInt(e.target.value) || 36)} style={{ fontSize: '0.65rem', width: '50px' }} />
                          </div>
                        ) : (
                          <span style={{ fontWeight: '700', color: '#6EE7B7' }}>{loan.remainingEmi} / {loan.totalEmi}</span>
                        )}
                      </td>
                      
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                            <button className="glass-btn success" onClick={() => handleSave(loan.id)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>
                              <Save size={12} />
                            </button>
                            <button className="glass-btn danger" onClick={handleCancel} style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                            <button className="glass-btn" onClick={() => handleEdit(loan)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>
                              <Edit2 size={12} />
                            </button>
                            <button className="glass-btn danger" onClick={() => handleDelete(loan.id)} style={{ padding: '0.15rem 0.4rem', fontSize: '0.55rem' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
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

      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <X size={18} />
            </button>
            
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>Add New Loan</h2>
            
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Bank / Name</label>
                <input className="edit-input" type="text" placeholder="Enter bank name" value={newLoan.name} onChange={(e) => setNewLoan({...newLoan, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Amount</label>
                <input className="edit-input" type="number" placeholder="0" value={newLoan.amount} onChange={(e) => setNewLoan({...newLoan, amount: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="form-group">
                <label className="form-label">EMI Amount</label>
                <input className="edit-input" type="number" placeholder="0" value={newLoan.emi} onChange={(e) => setNewLoan({...newLoan, emi: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="form-group">
                <label className="form-label">EMI Date</label>
                <input className="edit-input" type="date" value={newLoan.emiDate} onChange={(e) => setNewLoan({...newLoan, emiDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Total EMIs</label>
                <input className="edit-input" type="number" placeholder="36" value={newLoan.totalEmi} onChange={(e) => setNewLoan({...newLoan, totalEmi: parseInt(e.target.value) || 36})} />
              </div>
              <div className="form-group full">
                <label className="form-label">Remaining EMIs</label>
                <input className="edit-input" type="number" placeholder="36" value={newLoan.remainingEmi} onChange={(e) => setNewLoan({...newLoan, remainingEmi: parseInt(e.target.value) || 36})} />
              </div>
            </div>

            <div className="form-actions">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleAddLoan}>Add Loan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Loans;