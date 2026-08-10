import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Filter,
  Edit2,
  Save,
  X,
  Trash2,
  Plus,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_ROOT =
  import.meta.env.VITE_API_BASE?.trim() ||
 "https://express-project-learning-new.onrender.com";

const API_BASE = `${API_ROOT.replace(/\/$/, '')}/api/personal-loans`;

const Loans = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [addError, setAddError] = useState('');

  const effectiveUserId = user?.id ?? user?.user_id;

  const [newLoan, setNewLoan] = useState({
    name: '',
    amount: '',
    emi: '',
    emiDate: new Date().toISOString().split('T')[0],
    totalEmi: '',
    remainingEmi: '',
    totalAmountPaid: ''
  });

  // =====================================================
  // HELPERS
  // =====================================================

  const showFeedback = (type, message) => {
    setFeedback({ type, message });

    clearTimeout(window.loanFeedbackTimer);

    window.loanFeedbackTimer = setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  // Keep user-entered decimal precision:
  // 40000 -> ₹40,000
  // 40000.40 -> ₹40,000.40
  const currency = (value) => {
    if (value === null || value === undefined || value === '') {
      return '₹0';
    }

    const raw = String(value).trim().replace(/,/g, '');
    const numeric = Number(raw);

    if (!Number.isFinite(numeric)) return '₹0';

    const decimalPart = raw.includes('.') ? raw.split('.')[1] : '';
    const decimals = Math.min(decimalPart.length, 2);

    return `₹${numeric.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  };

  // Use this for values that are calculated in JavaScript.
  // It avoids floating-point display artifacts while still
  // showing decimals when they actually exist.
  const currencyCalculated = (value) => {
    const numeric = Number(value) || 0;
    const rounded = Math.round((numeric + Number.EPSILON) * 100) / 100;
    const hasDecimal = !Number.isInteger(rounded);

    return `₹${rounded.toLocaleString('en-IN', {
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';

    return new Date(
      `${String(value).slice(0, 10)}T00:00:00`
    ).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateLoanAmounts = (
    totalAmount,
    emiAmount,
    totalEmi,
    remainingEmi
  ) => {
    const total = Number(totalAmount) || 0;
    const emi = Number(emiAmount) || 0;
    const installments = Number(totalEmi) || 0;
    const remaining = Number(remainingEmi) || 0;
    const paidInstallments = Math.max(0, installments - remaining);
    const paid = Math.min(total, paidInstallments * emi);

    return {
      paid,
      remaining: Math.max(0, total - paid)
    };
  };

  const parseResponse = async (response, action) => {
    const text = await response.text();
    const normalizedText = text.replace(/^\uFEFF/, '').trim();

    let result;

    try {
      result = normalizedText
        ? JSON.parse(normalizedText)
        : {};
    } catch {
      const contentType =
        response.headers.get('content-type') ||
        'unknown content type';

      throw new Error(
        `${action}: Server returned invalid JSON (${contentType})`
      );
    }

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || `${action} failed`
      );
    }

    return result;
  };

  // =====================================================
  // GET LOANS
  // =====================================================

  const fetchLoans = async () => {
    if (!effectiveUserId) {
      setLoading(false);

      showFeedback(
        'error',
        'User ID not found. Please login again.'
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/${encodeURIComponent(
          effectiveUserId
        )}`
      );

      const result = await parseResponse(
        response,
        'Get loans'
      );

      setLoans(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error('Get loans:', error);

      showFeedback(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [effectiveUserId]);

  // =====================================================
  // ADD LOAN
  // =====================================================

  const handleAddLoan = async () => {
    setAddError('');

    if (!effectiveUserId) {
      setAddError('User ID not found. Please login again.');
      return;
    }

    const name = newLoan.name.trim();
    const amount = Number(newLoan.amount);
    const emi = Number(newLoan.emi);
    const totalEmi = Number(newLoan.totalEmi);

    const remainingEmi =
      newLoan.remainingEmi === ''
        ? totalEmi
        : Number(newLoan.remainingEmi);

    const { paid: totalAmountPaid } = calculateLoanAmounts(
      amount,
      emi,
      totalEmi,
      remainingEmi
    );

    if (!name) {
      setAddError('Bank / Loan App name is required');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setAddError('Enter a valid total amount');
      return;
    }

    if (!Number.isFinite(emi) || emi <= 0) {
      setAddError('Enter a valid EMI amount');
      return;
    }

    if (!newLoan.emiDate) {
      setAddError('EMI date is required');
      return;
    }

    if (!Number.isInteger(totalEmi) || totalEmi <= 0) {
      setAddError('Enter a valid total EMI');
      return;
    }

    if (
      !Number.isInteger(remainingEmi) ||
      remainingEmi < 0 ||
      remainingEmi > totalEmi
    ) {
      setAddError('Remaining EMI must be between 0 and Total EMI');
      return;
    }

    if (
      !Number.isFinite(totalAmountPaid) ||
      totalAmountPaid < 0 ||
      totalAmountPaid > amount
    ) {
      setAddError('Paid amount must be between 0 and Total Amount');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: Number(effectiveUserId),
          loan_name: name,
          total_amount: amount,
          emi_amount: emi,
          emi_date: newLoan.emiDate,
          total_emi: totalEmi,
          remaining_emi: remainingEmi,
          total_amount_paid: totalAmountPaid
        })
      });

      await parseResponse(
        response,
        'Save loan'
      );

      await fetchLoans();

      setShowAddModal(false);

      setNewLoan({
        name: '',
        amount: '',
        emi: '',
        emiDate: new Date()
          .toISOString()
          .split('T')[0],
        totalEmi: '',
        remainingEmi: '',
        totalAmountPaid: ''
      });

      showFeedback(
        'success',
        'Loan saved successfully'
      );
    } catch (error) {
      console.error('Save loan:', error);
      setAddError(error.message || 'Unable to save this loan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const startEdit = (loan) => {
    setEditingId(loan.id);

    setEditData({
      name: loan.loan_name || '',
      // Keep database numeric strings exactly as returned.
      // This preserves 40000 vs 40000.40 inside Edit.
      amount:
        loan.total_amount === null ||
        loan.total_amount === undefined
          ? ''
          : String(loan.total_amount),
      emi:
        loan.emi_amount === null ||
        loan.emi_amount === undefined
          ? ''
          : String(loan.emi_amount),
      emiDate: String(loan.emi_date).slice(0, 10),
      totalEmi:
        loan.total_emi === null ||
        loan.total_emi === undefined
          ? ''
          : String(loan.total_emi),
      remainingEmi:
        loan.remaining_emi === null ||
        loan.remaining_emi === undefined
          ? ''
          : String(loan.remaining_emi),
      totalAmountPaid:
        loan.total_amount_paid === null ||
        loan.total_amount_paid === undefined
          ? ''
          : String(loan.total_amount_paid)
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const saveEdit = async (id) => {
    const name =
      String(editData.name || '').trim();

    const amount = Number(editData.amount);
    const emi = Number(editData.emi);
    const totalEmi = Number(editData.totalEmi);
    const remainingEmi =
      Number(editData.remainingEmi);
    const { paid: totalAmountPaid } = calculateLoanAmounts(
      amount,
      emi,
      totalEmi,
      remainingEmi
    );

    if (!name) {
      showFeedback(
        'error',
        'Loan name is required'
      );
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showFeedback(
        'error',
        'Invalid total amount'
      );
      return;
    }

    if (!Number.isFinite(emi) || emi <= 0) {
      showFeedback(
        'error',
        'Invalid EMI amount'
      );
      return;
    }

    if (!editData.emiDate) {
      showFeedback(
        'error',
        'EMI date is required'
      );
      return;
    }

    if (!Number.isInteger(totalEmi) || totalEmi <= 0) {
      showFeedback(
        'error',
        'Invalid total EMI'
      );
      return;
    }

    if (
      !Number.isInteger(remainingEmi) ||
      remainingEmi < 0 ||
      remainingEmi > totalEmi
    ) {
      showFeedback(
        'error',
        'Invalid remaining EMI'
      );
      return;
    }

    if (
      !Number.isFinite(totalAmountPaid) ||
      totalAmountPaid < 0 ||
      totalAmountPaid > amount
    ) {
      showFeedback(
        'error',
        'Invalid paid amount'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: Number(effectiveUserId),
            loan_name: name,
            total_amount: amount,
            emi_amount: emi,
            emi_date: editData.emiDate,
            total_emi: totalEmi,
            remaining_emi: remainingEmi,
            total_amount_paid: totalAmountPaid
          })
        }
      );

      await parseResponse(
        response,
        'Update loan'
      );

      cancelEdit();

      await fetchLoans();

      showFeedback(
        'success',
        'Loan updated successfully'
      );
    } catch (error) {
      console.error('Update loan:', error);

      showFeedback(
        'error',
        error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // PAY EMI
  // =====================================================

  const payEMI = async (loan) => {
    const currentRemainingEmi = Number(loan.remaining_emi || 0);

    if (currentRemainingEmi <= 0) {
      showFeedback(
        'error',
        'All EMIs are already paid'
      );
      return;
    }

    try {
      setSaving(true);

      // One click represents exactly one EMI payment.
      const remainingEmi = currentRemainingEmi - 1;
      const { paid: totalAmountPaid } = calculateLoanAmounts(
        loan.total_amount,
        loan.emi_amount,
        loan.total_emi,
        remainingEmi
      );

      const response = await fetch(
        `${API_BASE}/${loan.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: Number(effectiveUserId),
            loan_name: loan.loan_name,
            total_amount: Number(loan.total_amount),
            emi_amount: Number(loan.emi_amount),
            emi_date: String(loan.emi_date).slice(0, 10),
            total_emi: Number(loan.total_emi),
            remaining_emi: remainingEmi,
            total_amount_paid: totalAmountPaid
          })
        }
      );

      await parseResponse(
        response,
        'Save EMI payment'
      );

      await fetchLoans();

      showFeedback(
        'success',
        `EMI paid: ${currency(loan.emi_amount)}`
      );
    } catch (error) {
      console.error('Pay EMI:', error);

      showFeedback(
        'error',
        error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const deleteLoan = async () => {
    if (!deleteId) return;

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}/${deleteId}?user_id=${encodeURIComponent(
          effectiveUserId
        )}`,
        {
          method: 'DELETE'
        }
      );

      await parseResponse(
        response,
        'Delete loan'
      );

      setDeleteId(null);

      await fetchLoans();

      showFeedback(
        'success',
        'Loan deleted successfully'
      );
    } catch (error) {
      console.error('Delete loan:', error);

      showFeedback(
        'error',
        error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredLoans = useMemo(() => {
    const query =
      searchQuery.toLowerCase().trim();

    if (!query) return loans;

    // Same-name search: every loan whose bank / loan-app name
    // contains the searched name is shown below immediately.
    return loans.filter((loan) =>
      String(loan.loan_name || '')
        .toLowerCase()
        .includes(query)
    );
  }, [loans, searchQuery]);

  const exactNameCount = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return 0;

    return loans.filter(
      (loan) =>
        String(loan.loan_name || '')
          .trim()
          .toLowerCase() === query
    ).length;
  }, [loans, searchQuery]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalAmount = loans.reduce(
    (sum, loan) =>
      sum + Number(loan.total_amount || 0),
    0
  );

  const getPaidAmount = (loan) =>
    calculateLoanAmounts(
      loan.total_amount,
      loan.emi_amount,
      loan.total_emi,
      loan.remaining_emi
    ).paid;

  const getRemainingAmount = (loan) =>
    calculateLoanAmounts(
      loan.total_amount,
      loan.emi_amount,
      loan.total_emi,
      loan.remaining_emi
    ).remaining;

  const totalPaid = loans.reduce(
    (sum, loan) => sum + getPaidAmount(loan),
    0
  );

  const totalRemaining = loans.reduce(
    (sum, loan) => sum + getRemainingAmount(loan),
    0
  );

  const totalEMI = loans.reduce(
    (sum, loan) =>
      sum + Number(loan.emi_amount || 0),
    0
  );

  // =====================================================
  // ALL-TIME CHART / DETAILS
  // =====================================================

  // Money-based pie chart values use the same unit:
  // Total EMI amount, Total Paid amount, Total Remaining amount.
  // Total EMI count is shown separately because a count cannot
  // be meaningfully combined with rupee amounts in one pie chart.
  const totalEmiAmount = loans.reduce(
    (sum, loan) =>
      sum +
      Number(loan.emi_amount || 0) *
        Number(loan.total_emi || 0),
    0
  );

  const totalRemainingEmi = loans.reduce(
    (sum, loan) =>
      sum + Number(loan.remaining_emi || 0),
    0
  );

  const totalEmiCount = loans.reduce(
    (sum, loan) =>
      sum + Number(loan.total_emi || 0),
    0
  );

  const paidChartAmount = Math.min(
    totalEmiAmount,
    Math.max(0, totalPaid)
  );

  const remainingChartAmount = Math.max(
    0,
    totalEmiAmount - paidChartAmount
  );

  const chartTotal =
    paidChartAmount + remainingChartAmount;

  const paidPercent =
    chartTotal > 0
      ? (paidChartAmount / chartTotal) * 100
      : 0;

  const remainingPercent =
    chartTotal > 0
      ? (remainingChartAmount / chartTotal) * 100
      : 0;

  return (
    <>
      <style>{`

        .loans-container {
          width: 100%;
        }

        .glass-card {
          width: 100%;
          box-sizing: border-box;
          background: linear-gradient(
            145deg,
            rgba(255,255,255,.10),
            rgba(255,255,255,.04)
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(196,181,253,.25);
          border-radius: 20px;
          padding: 1.2rem;
          box-shadow: 0 14px 36px rgba(0,0,0,.22);
        }

        .loan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .loan-title {
          margin: 0;
          color: #F43F5E;
          font-size: .9rem;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .summary {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          font-size: .67rem;
          color: rgba(255,255,255,.55);
        }

        .summary span {
          white-space: nowrap;
        }

        .search-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          min-width: 0;
          flex-wrap: wrap;
        }

        .search-input {
          width: 312px;
          max-width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 9px;
          color: white;
          padding: 10px 12px;
          outline: none;
          font-size: .72rem;
          min-width: 0;
        }

        .search-result-count {
          color: rgba(255,255,255,.48);
          font-size: .62rem;
          white-space: nowrap;
        }

        .search-input:focus {
          border-color: #8B5CF6;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
        }

        table {
          width: 100%;
          min-width: 1150px;
          border-collapse: collapse;
          font-size: .72rem;
        }

        th {
          padding: 10px;
          color: rgba(255,255,255,.62);
          border-bottom: 1px solid rgba(255,255,255,.12);
          white-space: nowrap;
          font-weight: 700;
        }

        td {
          padding: 14px 10px;
          border-bottom: 1px solid rgba(255,255,255,.06);
          white-space: nowrap;
        }

        tbody tr:hover {
          background: rgba(124,58,237,.08);
        }

        .name {
          color: #fff;
          font-weight: 600;
        }

        .amount {
          color: #FCA5A5;
          font-weight: 700;
          text-align: right;
        }

        .emi {
          color: #FCD34D;
          font-weight: 700;
          text-align: right;
        }

        .paid {
          color: #6EE7B7;
          font-weight: 700;
          text-align: right;
        }

        .remaining {
          color: #FB7185;
          font-weight: 700;
          text-align: right;
        }

        .count {
          text-align: center;
          color: #A78BFA;
          font-weight: 700;
        }

        .date {
          color: rgba(255,255,255,.65);
        }

        .actions {
          text-align: center;
        }

        .btn {
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.07);
          color: white;
          border-radius: 8px;
          padding: 6px 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 2px;
        }

        .btn:hover {
          background: rgba(124,58,237,.25);
        }

        .btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .btn-add {
          color: #C4B5FD;
          background: rgba(124,58,237,.18);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
        }

        .btn-pay {
          color: #6EE7B7;
          background: rgba(16,185,129,.12);
        }

        .btn-delete {
          color: #FCA5A5;
          background: rgba(239,68,68,.12);
        }

        .input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          color: white;
          border-radius: 7px;
          padding: 7px;
          outline: none;
          font-size: .7rem;
        }

        .input:focus {
          border-color: #8B5CF6;
        }

        .feedback {
          margin: 10px auto;
          width: min(100%,420px);
          padding: 8px;
          border-radius: 9px;
          text-align: center;
          font-size: .7rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }

        .feedback.success {
          color: #6EE7B7;
          background: rgba(16,185,129,.12);
        }

        .feedback.error {
          color: #FCA5A5;
          background: rgba(239,68,68,.12);
        }

        .empty {
          text-align: center;
          color: rgba(255,255,255,.4);
          padding: 30px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(5,5,15,.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding:
            max(12px, env(safe-area-inset-top))
            max(12px, env(safe-area-inset-right))
            max(12px, env(safe-area-inset-bottom))
            max(12px, env(safe-area-inset-left));
          box-sizing: border-box;
          overflow: hidden;
        }

        .modal {
          width: min(560px, 100%);
          max-width: 560px;
          max-height:
            calc(
              100dvh -
              max(24px, env(safe-area-inset-top)) -
              max(24px, env(safe-area-inset-bottom))
            );
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          box-sizing: border-box;
          background: linear-gradient(
            145deg,
            #312e81,
            #1e293b
          );
          border: 1px solid rgba(221,214,254,.45);
          border-radius: 22px;
          padding: 25px;
          position: relative;
          box-shadow: 0 25px 80px rgba(0,0,0,.5);
        }

        .close {
          position: absolute;
          top: 15px;
          right: 15px;
          border: 1px solid rgba(255,255,255,.25);
          background: rgba(255,255,255,.1);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        .modal h2 {
          color: white;
          font-size: 1.1rem;
          margin: 0 45px 20px 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .full {
          grid-column: 1 / -1;
        }

        label {
          color: rgba(255,255,255,.75);
          font-size: .62rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .modal .input {
          background: rgba(255,255,255,.1);
          border-color: rgba(255,255,255,.2);
          padding: 9px 10px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
        }

        .modal-actions button {
          border-radius: 9px;
          padding: 9px 17px;
          cursor: pointer;
          font-weight: 700;
          border: 1px solid rgba(255,255,255,.12);
        }

        .cancel {
          background: rgba(255,255,255,.07);
          color: white;
        }

        .save {
          background: linear-gradient(
            135deg,
            #8B5CF6,
            #6366F1
          );
          color: white;
        }

        .confirm {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,.65);
          padding: 20px;
        }

        .confirm-box {
          background: #202033;
          border: 1px solid rgba(245,158,11,.3);
          border-radius: 15px;
          padding: 22px;
          width: min(360px,100%);
          text-align: center;
        }

        .confirm-box p {
          color: white;
          font-size: .75rem;
          margin: 12px 0 18px;
        }

        /* =================================================
           ALL-TIME EMI CHART
        ================================================= */

        .all-time-section {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,.10);
        }

        .all-time-title {
          margin: 0 0 14px;
          color: #fff;
          font-size: .9rem;
          font-weight: 700;
        }

        .all-time-subtitle {
          margin: -7px 0 16px;
          color: rgba(255,255,255,.45);
          font-size: .64rem;
        }

        .all-time-grid {
          display: grid;
          grid-template-columns: minmax(260px, 330px) minmax(0, 1fr);
          gap: 22px;
          align-items: center;
        }

        .pie-area {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 250px;
        }

        .pie-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          width: 100%;
        }

        .emi-pie {
          width: 205px;
          height: 205px;
          flex: 0 0 auto;
          border-radius: 50%;
          background:
            conic-gradient(
              #8B5CF6 0% var(--paid-percent),
              #FB7185 var(--paid-percent) 100%
            );
          position: relative;
          display: grid;
          place-items: center;
          box-shadow:
            0 0 0 8px rgba(139,92,246,.06),
            0 18px 45px rgba(0,0,0,.22);
        }

        .emi-pie::after {
          content: '';
          width: 126px;
          height: 126px;
          border-radius: 50%;
          background: #202033;
          position: absolute;
          box-shadow: inset 0 0 20px rgba(0,0,0,.18);
        }

        .pie-center {
          position: relative;
          z-index: 1;
          text-align: center;
          color: #fff;
          max-width: 105px;
        }

        .pie-center strong {
          display: block;
          font-size: .9rem;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        .pie-center span {
          display: block;
          margin-top: 4px;
          color: rgba(255,255,255,.55);
          font-size: .58rem;
          line-height: 1.3;
        }

        .pie-legend {
          display: grid;
          gap: 10px;
          min-width: 145px;
          max-width: 175px;
        }

        .pie-legend-item {
          padding: 10px 11px;
          border-radius: 11px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.035);
        }

        .pie-legend-head {
          display: flex;
          align-items: center;
          gap: 7px;
          color: rgba(255,255,255,.68);
          font-size: .62rem;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .pie-legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex: 0 0 9px;
        }

        .pie-paid-dot {
          background: #8B5CF6;
          box-shadow: 0 0 9px rgba(139,92,246,.55);
        }

        .pie-remaining-dot {
          background: #FB7185;
          box-shadow: 0 0 9px rgba(251,113,133,.45);
        }

        .pie-legend-value {
          color: #fff;
          font-size: .78rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .pie-legend-percent {
          color: rgba(255,255,255,.42);
          font-size: .56rem;
          margin-top: 2px;
        }

        .chart-details {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .chart-stat {
          min-width: 0;
          padding: 13px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 13px;
          background: rgba(255,255,255,.035);
          transition: transform .18s ease, border-color .18s ease;
        }

        .chart-stat:hover {
          transform: translateY(-2px);
          border-color: rgba(139,92,246,.32);
        }

        .chart-stat-label {
          display: block;
          color: rgba(255,255,255,.52);
          font-size: .61rem;
          margin-bottom: 5px;
        }

        .chart-stat-value {
          display: block;
          color: #fff;
          font-size: .82rem;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .chart-stat-sub {
          display: block;
          color: rgba(255,255,255,.40);
          font-size: .57rem;
          margin-top: 4px;
          line-height: 1.35;
        }

        .chart-stat.highlight-paid {
          border-color: rgba(139,92,246,.24);
          background: rgba(139,92,246,.07);
        }

        .chart-stat.highlight-remaining {
          border-color: rgba(251,113,133,.24);
          background: rgba(251,113,133,.06);
        }

        .chart-stat.highlight-total {
          border-color: rgba(255,255,255,.16);
          background: rgba(255,255,255,.055);
        }

        .chart-legend {
          grid-column: 1 / -1;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          color: rgba(255,255,255,.52);
          font-size: .59rem;
          margin-top: 1px;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .legend-paid {
          background: #8B5CF6;
        }

        .legend-remaining {
          background: #FB7185;
        }

        .all-time-empty {
          color: rgba(255,255,255,.42);
          font-size: .68rem;
          text-align: center;
          padding: 20px;
        }

        @media(max-width:900px) and (min-width:701px) {
          .glass-card {
            padding: .9rem;
          }

          .table-wrap {
            overflow-x: auto;
          }

          .all-time-grid {
            grid-template-columns: minmax(190px, 250px) 1fr;
          }

          .chart-details {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media(max-width:700px) {
          .glass-card {
            padding: .7rem;
            border-radius: 16px;
          }

          .loan-header {
            align-items: flex-start;
          }

          .loan-title {
            width: 100%;
          }

          .summary {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 7px;
          }

          .summary span {
            white-space: normal;
            overflow-wrap: anywhere;
          }

          .summary .btn-add {
            width: 100%;
            justify-content: center;
            grid-column: 1 / -1;
          }

          .search-row {
            align-items: stretch;
          }

          .search-input {
            width: calc(100% - 23px);
            flex: 1 1 220px;
          }

          .search-result-count {
            width: 100%;
            padding-left: 23px;
          }

          /* On phones the wide desktop table becomes stacked loan cards.
             Nothing is cut, hidden, or horizontally scrolled. */
          .table-wrap {
            overflow: visible;
          }

          table,
          thead,
          tbody,
          tr,
          th,
          td {
            display: block;
            width: 100%;
            box-sizing: border-box;
          }

          table {
            min-width: 0;
          }

          thead {
            display: none;
          }

          tbody {
            display: grid;
            gap: 10px;
          }

          tbody tr {
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 14px;
            background: rgba(255,255,255,.035);
            padding: 8px;
          }

          tbody tr:hover {
            background: rgba(124,58,237,.08);
          }

          tbody td {
            display: grid;
            grid-template-columns: minmax(105px, 42%) minmax(0, 58%);
            gap: 8px;
            align-items: center;
            padding: 7px 4px;
            border-bottom: 1px solid rgba(255,255,255,.06);
            white-space: normal;
            overflow-wrap: anywhere;
            text-align: left !important;
          }

          tbody td::before {
            color: rgba(255,255,255,.48);
            font-size: .61rem;
            font-weight: 700;
          }

          tbody td:nth-child(1)::before { content: 'Bank / Loan App'; }
          tbody td:nth-child(2)::before { content: 'Total Amount'; }
          tbody td:nth-child(3)::before { content: 'EMI Amount'; }
          tbody td:nth-child(4)::before { content: 'EMI Date'; }
          tbody td:nth-child(5)::before { content: 'Total EMI'; }
          tbody td:nth-child(6)::before { content: 'Remaining EMI'; }
          tbody td:nth-child(7)::before { content: 'Total Paid'; }
          tbody td:nth-child(8)::before { content: 'Total Remaining'; }
          tbody td:nth-child(9)::before { content: 'Actions'; }

          tbody td:last-child {
            border-bottom: 0;
          }

          tbody td > * {
            min-width: 0;
            max-width: 100%;
          }

          .amount,
          .emi,
          .paid,
          .remaining,
          .count,
          .actions {
            text-align: left;
          }

          .actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-start;
            gap: 4px;
          }

          .actions .btn {
            margin: 0;
          }

          .input {
            min-width: 0;
            font-size: .72rem;
          }

          .all-time-section {
            margin-top: 12px;
            padding-top: 14px;
          }

          .all-time-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .pie-area {
            min-height: 0;
          }

          .pie-wrap {
            gap: 12px;
          }

          .emi-pie {
            width: 165px;
            height: 165px;
          }

          .emi-pie::after {
            width: 102px;
            height: 102px;
          }

          .pie-legend {
            min-width: 0;
            width: min(170px, 45%);
          }

          .pie-legend-item {
            padding: 9px;
          }

          .chart-details {
            grid-template-columns: 1fr;
          }

          .chart-stat {
            min-width: 0;
          }

          .chart-stat-value,
          .chart-stat-sub,
          .chart-stat-label {
            overflow-wrap: anywhere;
          }

          .chart-legend {
            grid-column: auto;
          }

          .modal-overlay {
            align-items: flex-start;
            justify-content: center;
            padding:
              max(12px, env(safe-area-inset-top))
              max(10px, env(safe-area-inset-right))
              max(12px, env(safe-area-inset-bottom))
              max(10px, env(safe-area-inset-left));
            overflow: hidden;
          }

          .modal {
            width: 100%;
            max-height:
              calc(
                100dvh -
                max(24px, env(safe-area-inset-top)) -
                max(24px, env(safe-area-inset-bottom))
              );
            border-radius: 18px;
            padding: 20px 14px
              max(20px, env(safe-area-inset-bottom));
          }

          .modal h2 {
            padding-top: 2px;
            margin-bottom: 16px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .full {
            grid-column: auto;
          }

          .modal-actions {
            position: sticky;
            bottom: 0;
            z-index: 2;
            padding-top: 10px;
            padding-bottom: max(4px, env(safe-area-inset-bottom));
            background: linear-gradient(
              to bottom,
              rgba(30,41,59,0),
              #1e293b 22%
            );
          }

          .modal-actions button {
            flex: 1;
            min-height: 42px;
          }
        }

        @media(max-width:430px) {
          .pie-wrap {
            flex-direction: column;
            width: 100%;
          }

          .pie-legend {
            width: min(100%, 250px);
            grid-template-columns: 1fr 1fr;
          }

          .pie-legend-item {
            min-width: 0;
          }
        }

        @media(max-width:360px) {
          .summary {
            grid-template-columns: 1fr;
          }

          .summary .btn-add {
            grid-column: auto;
          }

          tbody td {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .pie-center strong {
            font-size: .78rem;
          }
        }

      `}</style>

      <div className="loans-container">

        <div className="glass-card">

          {/* HEADER */}

          <div className="loan-header">

            <h3 className="loan-title">
              <Building2 size={18} />
              Loan Details
            </h3>

            <div className="summary">

              <span>
                Total: {currency(totalAmount)}
              </span>

              <span>
                Paid: {currencyCalculated(totalPaid)}
              </span>

              <span>
                Remaining: {currencyCalculated(totalRemaining)}
              </span>

              <span>
                EMI: {currencyCalculated(totalEMI)}
              </span>

              <button
                type="button"
                className="btn btn-add"
                onClick={() => {
                  setAddError('');
                  setShowAddModal(true);
                }}
              >
                <Plus size={13} />
                Add Loan
              </button>

            </div>

          </div>

          {/* SEARCH */}

          <div className="search-row">

            <Filter
              size={15}
              color="rgba(255,255,255,.4)"
            />

            <input
              className="search-input"
              placeholder="Search bank / loan app..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />

            {searchQuery.trim() && (
              <span className="search-result-count">
                {filteredLoans.length} found
                {exactNameCount > 0
                  ? ` • ${exactNameCount} exact`
                  : ''}
              </span>
            )}

          </div>

          {/* FEEDBACK */}

          {feedback && (
            <div
              className={`feedback ${feedback.type}`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle size={14} />
              ) : (
                <XCircle size={14} />
              )}

              {feedback.message}
            </div>
          )}

          {/* TABLE */}

          <div className="table-wrap">

            <table>

              <thead>

                <tr>

                  <th style={{ textAlign: 'left' }}>
                    Bank / Loan App<br />
                    Name
                  </th>

                  <th style={{ textAlign: 'right' }}>
                    Total Amount
                  </th>

                  <th style={{ textAlign: 'right' }}>
                    EMI Amount
                  </th>

                  <th style={{ textAlign: 'left' }}>
                    EMI Date
                  </th>

                  <th>
                    Total EMI
                  </th>

                  <th>
                    Remaining EMI
                  </th>

                  <th style={{ textAlign: 'right' }}>
                    Total Amount<br />
                    Paid
                  </th>

                  <th style={{ textAlign: 'right' }}>
                    Total Amount<br />
                    Remaining
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>
                    <td
                      colSpan="9"
                      className="empty"
                    >
                      Loading loans...
                    </td>
                  </tr>

                ) : filteredLoans.length === 0 ? (

                  <tr>
                    <td
                      colSpan="9"
                      className="empty"
                    >
                      No loans found.
                    </td>
                  </tr>

                ) : (

                  filteredLoans.map((loan) => {

                    const editing =
                      editingId === loan.id;

                    return (
                      <tr key={loan.id}>

                        {/* NAME */}

                        <td>

                          {editing ? (

                            <input
                              className="input"
                              value={editData.name}
                              onChange={(e) =>
                                handleEditChange(
                                  'name',
                                  e.target.value
                                )
                              }
                            />

                          ) : (

                            <span className="name">
                              {loan.loan_name}
                            </span>

                          )}

                        </td>

                        {/* TOTAL */}

                        <td className="amount">

                          {editing ? (

                            <input
                              className="input"
                              type="number"
                              min="0"
                              value={editData.amount}
                              onChange={(e) =>
                                handleEditChange(
                                  'amount',
                                  e.target.value
                                )
                              }
                            />

                          ) : (
                            currency(
                              loan.total_amount
                            )
                          )}

                        </td>

                        {/* EMI */}

                        <td className="emi">

                          {editing ? (

                            <input
                              className="input"
                              type="number"
                              min="0"
                              value={editData.emi}
                              onChange={(e) =>
                                handleEditChange(
                                  'emi',
                                  e.target.value
                                )
                              }
                            />

                          ) : (
                            currency(
                              loan.emi_amount
                            )
                          )}

                        </td>

                        {/* DATE */}

                        <td className="date">

                          {editing ? (

                            <input
                              className="input"
                              type="date"
                              value={editData.emiDate}
                              onChange={(e) =>
                                handleEditChange(
                                  'emiDate',
                                  e.target.value
                                )
                              }
                            />

                          ) : (
                            formatDate(
                              loan.emi_date
                            )
                          )}

                        </td>

                        {/* TOTAL EMI */}

                        <td className="count">

                          {editing ? (

                            <input
                              className="input"
                              type="number"
                              min="1"
                              value={editData.totalEmi}
                              onChange={(e) =>
                                handleEditChange(
                                  'totalEmi',
                                  e.target.value
                                )
                              }
                            />

                          ) : (
                            loan.total_emi
                          )}

                        </td>

                        {/* REMAINING EMI */}

                        <td className="count">

                          {editing ? (

                            <input
                              className="input"
                              type="number"
                              min="0"
                              value={editData.remainingEmi}
                              onChange={(e) =>
                                handleEditChange(
                                  'remainingEmi',
                                  e.target.value
                                )
                              }
                            />

                          ) : (
                            loan.remaining_emi
                          )}

                        </td>

                        {/* PAID */}

                        <td className="paid">

                          {editing ? (

                            <input
                              className="input"
                              type="number"
                              min="0"
                              value={calculateLoanAmounts(
                                editData.amount,
                                editData.emi,
                                editData.totalEmi,
                                editData.remainingEmi
                              ).paid}
                              readOnly
                            />

                          ) : (
                            currencyCalculated(getPaidAmount(loan))
                          )}

                        </td>

                        {/* REMAINING */}

                        <td className="remaining">

                          {currencyCalculated(getRemainingAmount(loan))}

                        </td>

                        {/* ACTIONS */}

                        <td className="actions">

                          {editing ? (

                            <>
                              <button
                                type="button"
                                className="btn btn-pay"
                                disabled={saving}
                                onClick={() =>
                                  saveEdit(loan.id)
                                }
                                title="Save"
                              >
                                <Save size={13} />
                              </button>

                              <button
                                type="button"
                                className="btn btn-delete"
                                disabled={saving}
                                onClick={cancelEdit}
                                title="Cancel"
                              >
                                <X size={13} />
                              </button>
                            </>

                          ) : (

                            <>

                              {/* PAY EMI */}

                              <button
                                type="button"
                                className="btn btn-pay"
                                disabled={
                                  saving ||
                                  Number(
                                    loan.remaining_emi
                                  ) <= 0
                                }
                                onClick={() =>
                                  payEMI(loan)
                                }
                                title="Pay EMI"
                              >
                                <CreditCard size={13} />
                              </button>

                              {/* EDIT */}

                              <button
                                type="button"
                                className="btn"
                                disabled={saving}
                                onClick={() =>
                                  startEdit(loan)
                                }
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                className="btn btn-delete"
                                disabled={saving}
                                onClick={() =>
                                  setDeleteId(
                                    loan.id
                                  )
                                }
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>

                            </>

                          )}

                        </td>

                      </tr>
                    );
                  })

                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* =================================================
            ALL-TIME EMI CHART & DETAILS
        ================================================= */}

        <div className="glass-card all-time-section">

          <h3 className="all-time-title">
            All-Time EMI Details
          </h3>

          <p className="all-time-subtitle">
            Paid EMI amount vs remaining EMI amount across all saved loans.
          </p>

          {loans.length === 0 ? (

            <div className="all-time-empty">
              No loan data available for chart.
            </div>

          ) : (

            <div className="all-time-grid">

              <div className="pie-area">

                <div className="pie-wrap">

                  <div
                    className="emi-pie"
                    style={{
                      '--paid-percent': `${paidPercent}%`
                    }}
                    aria-label={`Paid ${paidPercent.toFixed(1)} percent and remaining ${remainingPercent.toFixed(1)} percent`}
                  >
                    <div className="pie-center">
                      <strong>
                        {currencyCalculated(totalEmiAmount)}
                      </strong>
                      <span>
                        Total EMI Amount
                      </span>
                    </div>
                  </div>

                  <div className="pie-legend">

                    <div className="pie-legend-item">
                      <div className="pie-legend-head">
                        <span className="pie-legend-dot pie-paid-dot" />
                        Total Paid Amount
                      </div>
                      <div className="pie-legend-value">
                        {currencyCalculated(paidChartAmount)}
                      </div>
                      <div className="pie-legend-percent">
                        {paidPercent.toFixed(1)}% paid
                      </div>
                    </div>

                    <div className="pie-legend-item">
                      <div className="pie-legend-head">
                        <span className="pie-legend-dot pie-remaining-dot" />
                        EMI Remaining Amount
                      </div>
                      <div className="pie-legend-value">
                        {currencyCalculated(remainingChartAmount)}
                      </div>
                      <div className="pie-legend-percent">
                        {remainingPercent.toFixed(1)}% remaining
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              <div className="chart-details">

                <div className="chart-stat highlight-total">
                  <span className="chart-stat-label">
                    Total EMI Amount
                  </span>
                  <span className="chart-stat-value">
                    {currencyCalculated(totalEmiAmount)}
                  </span>
                  <span className="chart-stat-sub">
                    EMI amount × total EMIs
                  </span>
                </div>

                <div className="chart-stat highlight-paid">
                  <span className="chart-stat-label">
                    Total Paid Amount
                  </span>
                  <span className="chart-stat-value">
                    {currencyCalculated(paidChartAmount)}
                  </span>
                  <span className="chart-stat-sub">
                    {paidPercent.toFixed(1)}% completed
                  </span>
                </div>

                <div className="chart-stat highlight-remaining">
                  <span className="chart-stat-label">
                    EMI Remaining Amount
                  </span>
                  <span className="chart-stat-value">
                    {currencyCalculated(remainingChartAmount)}
                  </span>
                  <span className="chart-stat-sub">
                    {remainingPercent.toFixed(1)}% pending
                  </span>
                </div>

                <div className="chart-stat">
                  <span className="chart-stat-label">
                    Total EMIs
                  </span>
                  <span className="chart-stat-value">
                    {totalEmiCount}
                  </span>
                  <span className="chart-stat-sub">
                    All-time EMI count
                  </span>
                </div>

                <div className="chart-stat">
                  <span className="chart-stat-label">
                    Remaining EMIs
                  </span>
                  <span className="chart-stat-value">
                    {totalRemainingEmi}
                  </span>
                  <span className="chart-stat-sub">
                    Across all active loans
                  </span>
                </div>

                <div className="chart-stat">
                  <span className="chart-stat-label">
                    Loan Accounts
                  </span>
                  <span className="chart-stat-value">
                    {loans.length}
                  </span>
                  <span className="chart-stat-sub">
                    Total saved loan records
                  </span>
                </div>

                <div className="chart-legend">

                  <span className="legend-item">
                    <span className="legend-dot legend-paid" />
                    Paid Amount
                  </span>

                  <span className="legend-item">
                    <span className="legend-dot legend-remaining" />
                    EMI Remaining Amount
                  </span>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

      {/* =================================================
          ADD LOAN MODAL
      ================================================= */}

      {showAddModal && (

        <div
          className="modal-overlay"
          onClick={() => {
            if (!saving) {
              setShowAddModal(false);
            }
          }}
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="close"
              disabled={saving}
              onClick={() =>
                setShowAddModal(false)
              }
            >
              <X size={16} />
            </button>

            <h2>
              Add New Loan
            </h2>

            <div className="form-grid">

              {/* NAME */}

              <div className="form-group full">

                <label>
                  Bank / Loan App Name
                </label>

                <input
                  className="input"
                  placeholder="HDFC Bank / Moneyview"
                  value={newLoan.name}
                  onChange={(e) =>
                    setNewLoan({
                      ...newLoan,
                      name: e.target.value
                    })
                  }
                />

              </div>

              {/* TOTAL */}

              <div className="form-group">

                <label>
                  Total Amount
                </label>

                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="50000"
                  value={newLoan.amount}
                  onChange={(e) =>
                    setNewLoan({
                      ...newLoan,
                      amount: e.target.value
                    })
                  }
                />

              </div>

              {/* EMI */}

              <div className="form-group">

                <label>
                  EMI Amount
                </label>

                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="2000"
                  value={newLoan.emi}
                  onChange={(e) =>
                    setNewLoan({
                      ...newLoan,
                      emi: e.target.value
                    })
                  }
                />

              </div>

              {/* DATE */}

              <div className="form-group">

                <label>
                  EMI Date
                </label>

                <input
                  className="input"
                  type="date"
                  value={newLoan.emiDate}
                  onChange={(e) =>
                    setNewLoan({
                      ...newLoan,
                      emiDate: e.target.value
                    })
                  }
                />

              </div>

              {/* TOTAL EMI */}

              <div className="form-group">

                <label>
                  Total EMI
                </label>

                <input
                  className="input"
                  type="number"
                  min="1"
                  placeholder="20"
                  value={newLoan.totalEmi}
                  onChange={(e) =>
                    setNewLoan({
                      ...newLoan,
                      totalEmi: e.target.value
                    })
                  }
                />

              </div>

              {/* REMAINING EMI */}

              <div className="form-group">

                <label>
                  Remaining EMI
                </label>

                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="20"
                  value={newLoan.remainingEmi}
                  onChange={(e) =>
                    setNewLoan({
                      ...newLoan,
                      remainingEmi:
                        e.target.value
                    })
                  }
                />

              </div>

              {/* PAID */}

              <div className="form-group">

                <label>
                  Total Amount Paid (Auto)
                </label>

                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={calculateLoanAmounts(
                    newLoan.amount,
                    newLoan.emi,
                    newLoan.totalEmi,
                    newLoan.remainingEmi === ''
                      ? newLoan.totalEmi
                      : newLoan.remainingEmi
                  ).paid}
                  readOnly
                />

              </div>

            </div>

            <div className="modal-actions">

              <button
                type="button"
                className="cancel"
                disabled={saving}
                onClick={() =>
                  setShowAddModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="save"
                disabled={saving}
                onClick={handleAddLoan}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Loan'}
              </button>

            </div>

            {addError && (
              <div className="feedback error modal-feedback" role="alert">
                <XCircle size={14} />
                {addError}
              </div>
            )}

          </div>

        </div>

      )}

      {/* =================================================
          DELETE CONFIRMATION
      ================================================= */}

      {deleteId && (

        <div className="confirm">

          <div className="confirm-box">

            <AlertTriangle
              size={23}
              color="#FCD34D"
            />

            <p>
              Are you sure you want to
              delete this loan?
            </p>

            <button
              type="button"
              className="btn"
              disabled={saving}
              onClick={() =>
                setDeleteId(null)
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-delete"
              disabled={saving}
              onClick={deleteLoan}
            >
              {saving
                ? 'Deleting...'
                : 'Delete'}
            </button>

          </div>

        </div>

      )}

    </>
  );
};

export default Loans;
