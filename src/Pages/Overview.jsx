import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Edit3,
  Save,
  X,
  BriefcaseBusiness,
  Building2,
  WalletCards,
  Receipt,
  HandCoins,
  CreditCard,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

/*
  ============================================================
  Overview.jsx
  ============================================================

  LOGIC

  1. Current month selected by default.
  2. User can select any month.
  3. User manually adds:
       - Total Work
       - Total Business
       - Work Payment
       - Business Payment

  4. Total Payment:
       Work Payment + Business Payment

  5. Expenses:
       Gets selected-month total from Overview API.
       Expense page manages the actual expenses.

  6. Borrow:
       Gets selected-month total Borrow Amount from Overview API.
       LoanBorrow page manages Borrow.

  7. Loan EMI Paid:
       Gets only EMI amounts actually paid in selected month.
       LoanBorrow page manages EMI payments.

  8. Monthly Saving:
       Total Payment - Total Expenses + Total EMI Paid

  IMPORTANT:
  - No total_works column.
  - Uses total_work.
  - No old overview column names.
*/

const API_BASE_URL = "http://localhost:5000/api";

const EMPTY_MANUAL = {
  total_work: 0,
  total_business: 0,
  work_payment: 0,
  business_payment: 0,
};

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("authToken") ||
  "";

const numberValue = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

// Used only while editing an input.
// Important: "" must remain "" so the user can delete 0
// and type a new amount/number without the field forcing 0 back.
const editableNumberValue = (value) => {
  if (value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? value : "";
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const getMonthStart = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
};

const getMonthInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const monthTitle = (date) =>
  date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

function StatCard({ icon, iconClass, title, value, subtitle }) {
  return (
    <div className="overview-stat-card">
      <div className="overview-stat-top">
        <div className="overview-stat-title">{title}</div>

        <div className={`overview-stat-icon ${iconClass}`}>
          {icon}
        </div>
      </div>

      <div className="overview-stat-value">
        {value}
      </div>

      {subtitle && (
        <div className="overview-stat-subtitle">
          {subtitle}
        </div>
      )}
    </div>
  );
}

function ManualField({
  label,
  value,
  editing,
  money = false,
  onChange,
}) {
  return (
    <div className="overview-field">
      <label>{label}</label>

      {editing ? (
        <input
          type="number"
          min="0"
          step={money ? "0.01" : "1"}
          inputMode={money ? "decimal" : "numeric"}
          value={value}
          onChange={(e) => onChange(editableNumberValue(e.target.value))}
        />
      ) : (
        <div className="overview-field-value">
          {money ? formatMoney(value) : formatNumber(value)}
        </div>
      )}
    </div>
  );
}

function SummaryBox({ title, value, icon }) {
  return (
    <div className="overview-summary-box">
      <div className="overview-summary-icon">
        {icon}
      </div>

      <div>
        <div className="overview-summary-title">
          {title}
        </div>

        <div className="overview-summary-value">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function Overview() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date()
  );

  const [overview, setOverview] = useState(null);

  const [manual, setManual] = useState(
    EMPTY_MANUAL
  );

  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState(null);

  const token = getToken();

  const axiosConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),
    [token]
  );

  /*
    Professional center notification
  */
  const showToast = useCallback(
    (type, message) => {
      setToast({
        type,
        message,
      });

      clearTimeout(window.__overviewToastTimer);

      window.__overviewToastTimer =
        setTimeout(() => {
          setToast(null);
        }, 2500);
    },
    []
  );

  /*
    GET OVERVIEW
  */
  const loadOverview = useCallback(
    async () => {
      setLoading(true);

      try {
        const month = getMonthStart(
          selectedMonth
        );

        const response = await axios.get(
          `${API_BASE_URL}/overview`,
          {
            ...axiosConfig,
            params: {
              month,
            },
          }
        );

        const responseData =
          response.data?.data ??
          response.data ??
          {};

        setOverview(responseData);

        /*
          API can return manual data inside
          manual_data or directly.
        */
        const manualData =
          responseData.manual_data ??
          responseData.overview ??
          responseData;

        setManual({
          total_work: numberValue(
            manualData?.total_work
          ),

          total_business: numberValue(
            manualData?.total_business
          ),

          work_payment: numberValue(
            manualData?.work_payment
          ),

          business_payment: numberValue(
            manualData?.business_payment
          ),
        });
      } catch (error) {
        console.error(
          "Get overview error:",
          error
        );

        showToast(
          "error",
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Could not load overview"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      selectedMonth,
      axiosConfig,
      showToast,
    ]
  );

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  /*
    GET CALCULATED VALUES FROM API
  */
  const calculated =
    overview?.calculated || {};

  const totalExpenses = numberValue(
    calculated.total_expenses ??
      calculated.expenses_total ??
      overview?.total_expenses
  );

  const totalBorrow = numberValue(
    calculated.total_borrow ??
      calculated.total_borrow_amount ??
      overview?.total_borrow ??
      overview?.total_borrow_amount
  );

  const totalEmiPaid = numberValue(
    calculated.total_emi_paid ??
      calculated.total_loan_emi_paid ??
      overview?.total_emi_paid
  );

  /*
    Manual Total Payment
  */
  const calculatedManualPayment =
    numberValue(manual.work_payment) +
    numberValue(manual.business_payment);

  const totalPayment = numberValue(
    calculated.total_payment ??
      overview?.total_payment ??
      calculatedManualPayment
  );

  /*
    EXACT USER LOGIC

    Monthly Saving
    = Total Payment
      - Total Expenses
      + Total EMI Paid
  */
  const monthlySaving =
    totalPayment -
    totalExpenses +
    totalEmiPaid;

  /*
    MONTH NAVIGATION
  */
  const changeMonth = (amount) => {
    setEditing(false);

    setSelectedMonth((oldDate) => {
      const newDate = new Date(
        oldDate
      );

      newDate.setMonth(
        newDate.getMonth() + amount
      );

      return newDate;
    });
  };

  const selectMonth = (value) => {
    if (!value) return;

    const [year, month] =
      value.split("-");

    const newDate = new Date(
      Number(year),
      Number(month) - 1,
      1
    );

    setEditing(false);
    setSelectedMonth(newDate);
  };

  const currentMonth = () => {
    setEditing(false);
    setSelectedMonth(new Date());
  };

  /*
    SAVE MANUAL OVERVIEW
  */
  const saveOverview = async () => {
    setSaving(true);

    try {
      const payload = {
        month_start:
          getMonthStart(selectedMonth),

        total_work:
          numberValue(
            manual.total_work
          ),

        total_business:
          numberValue(
            manual.total_business
          ),

        work_payment:
          numberValue(
            manual.work_payment
          ),

        business_payment:
          numberValue(
            manual.business_payment
          ),
      };

      await axios.post(
        `${API_BASE_URL}/overview`,
        payload,
        axiosConfig
      );

      setEditing(false);

      await loadOverview();

      showToast(
        "success",
        `${monthTitle(
          selectedMonth
        )} saved successfully`
      );
    } catch (error) {
      console.error(
        "Save overview error:",
        error
      );

      showToast(
        "error",
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Could not save overview"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
    CANCEL EDIT
  */
  const cancelEdit = () => {
    setEditing(false);

    const manualData =
      overview?.manual_data ??
      overview?.overview ??
      overview ??
      {};

    setManual({
      total_work: numberValue(
        manualData?.total_work
      ),

      total_business: numberValue(
        manualData?.total_business
      ),

      work_payment: numberValue(
        manualData?.work_payment
      ),

      business_payment: numberValue(
        manualData?.business_payment
      ),
    });
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f4f7fb;
        }

        .overview-page {
          min-height: 100vh;
          padding: 12px;
          background:
            radial-gradient(
              circle at 0% 0%,
              rgba(38, 91, 170, 0.10),
              transparent 30%
            ),
            radial-gradient(
              circle at 100% 10%,
              rgba(103, 70, 190, 0.08),
              transparent 28%
            ),
            #f4f7fb;
          color: #172033;
        }

        .overview-container {
          width: min(1180px, 100%);
          margin: auto;
        }

        .overview-navbar {
          position: sticky;
          top: 0;
          z-index: 50;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 12px;

          padding: 12px;

          margin-bottom: 12px;

          background: rgba(255,255,255,0.95);

          border: 1px solid #e6ebf2;

          border-radius: 18px;

          box-shadow:
            0 8px 28px rgba(25,40,70,0.08);

          backdrop-filter: blur(12px);
        }

        .overview-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .overview-brand-icon {
          width: 44px;
          height: 44px;

          flex: 0 0 44px;

          display: grid;
          place-items: center;

          border-radius: 14px;

          color: white;

          background:
            linear-gradient(
              135deg,
              #1769aa,
              #5b4bdb
            );

          box-shadow:
            0 8px 20px rgba(45,80,170,0.24);
        }

        .overview-brand h1 {
          margin: 0;

          font-size:
            clamp(18px, 3vw, 25px);

          font-weight: 850;

          letter-spacing: -0.03em;
        }

        .overview-brand p {
          margin: 2px 0 0;

          color: #7b8496;

          font-size: 11px;
        }

        .overview-month-controls {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .overview-icon-button {
          width: 37px;
          height: 37px;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 10px;

          background: #eff2f7;

          color: #344054;

          cursor: pointer;

          transition: 0.2s ease;
        }

        .overview-icon-button:hover {
          background: #e4e9f1;
          transform: translateY(-1px);
        }

        .overview-icon-button:disabled {
          opacity: 0.55;
          cursor: default;
          transform: none;
        }

        .overview-month {
          min-width: 145px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 6px;

          padding: 10px 12px;

          border-radius: 10px;

          background: #eff2f7;

          color: #27344a;

          font-size: 12px;

          font-weight: 800;

          white-space: nowrap;
        }

        .overview-month-input {
          height: 37px;

          border: 0;

          border-radius: 10px;

          padding: 0 7px;

          background: #eff2f7;

          color: #27344a;

          outline: none;

          font-size: 11px;

          font-weight: 700;
        }

        .overview-current-button {
          height: 37px;

          border: 0;

          border-radius: 10px;

          padding: 0 11px;

          background: #e9f2ff;

          color: #1769aa;

          font-size: 11px;

          font-weight: 800;

          cursor: pointer;
        }

        .overview-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 10px;

          margin-bottom: 10px;
        }

        .overview-stat-card {
          min-width: 0;

          padding: 15px;

          background: white;

          border: 1px solid #e6ebf2;

          border-radius: 16px;

          box-shadow:
            0 7px 24px rgba(25,40,70,0.06);
        }

        .overview-stat-top {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 7px;
        }

        .overview-stat-title {
          color: #778195;

          font-size: 10px;

          font-weight: 850;

          letter-spacing: 0.06em;

          text-transform: uppercase;
        }

        .overview-stat-icon {
          width: 36px;
          height: 36px;

          flex: 0 0 36px;

          display: grid;
          place-items: center;

          border-radius: 11px;
        }

        .overview-stat-icon svg {
          width: 17px;
        }

        .overview-stat-icon.blue {
          background: #eaf3ff;
          color: #1769aa;
        }

        .overview-stat-icon.green {
          background: #e9f8f0;
          color: #168451;
        }

        .overview-stat-icon.orange {
          background: #fff3e5;
          color: #c86a12;
        }

        .overview-stat-icon.red {
          background: #fff0f0;
          color: #d04444;
        }

        .overview-stat-icon.violet {
          background: #f0ecff;
          color: #6347c7;
        }

        .overview-stat-value {
          margin-top: 8px;

          font-size:
            clamp(17px, 2.5vw, 26px);

          font-weight: 900;

          letter-spacing: -0.03em;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        .overview-stat-subtitle {
          margin-top: 2px;

          color: #9aa4b5;

          font-size: 9px;
        }

        .overview-section {
          padding: 16px;

          margin-bottom: 10px;

          background: white;

          border: 1px solid #e6ebf2;

          border-radius: 17px;

          box-shadow:
            0 7px 24px rgba(25,40,70,0.06);
        }

        .overview-section-header {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 10px;

          margin-bottom: 13px;
        }

        .overview-section-title {
          display: flex;

          align-items: center;

          gap: 7px;

          margin: 0;

          font-size: 14px;

          font-weight: 850;
        }

        .overview-section-title svg {
          color: #1769aa;
        }

        .overview-section-note {
          color: #8a94a6;

          font-size: 10px;
        }

        .overview-edit-button,
        .overview-save-button,
        .overview-cancel-button {
          min-height: 37px;

          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 6px;

          border: 0;

          border-radius: 10px;

          padding: 0 12px;

          font-size: 11px;

          font-weight: 800;

          cursor: pointer;
        }

        .overview-edit-button {
          color: white;

          background: #172b4d;
        }

        .overview-save-button {
          color: white;

          background: #168451;
        }

        .overview-cancel-button {
          color: #4a5568;

          background: #edf1f6;
        }

        .overview-manual-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 9px;
        }

        .overview-field {
          padding: 12px;

          border: 1px solid #e7ebf2;

          border-radius: 12px;

          background: #f8fafc;
        }

        .overview-field label {
          display: block;

          margin-bottom: 6px;

          color: #697386;

          font-size: 10px;

          font-weight: 800;
        }

        .overview-field input {
          width: 100%;

          height: 38px;

          border: 1px solid #dce2eb;

          border-radius: 9px;

          padding: 0 9px;

          background: white;

          color: #172033;

          outline: none;

          font-size: 13px;
        }

        .overview-field input:focus {
          border-color: #5b8def;

          box-shadow:
            0 0 0 3px rgba(91,141,239,0.12);
        }

        .overview-field-value {
          min-height: 38px;

          display: flex;

          align-items: center;

          font-size: 15px;

          font-weight: 850;
        }

        .overview-summary-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 9px;
        }

        .overview-summary-box {
          display: flex;

          align-items: center;

          gap: 9px;

          padding: 12px;

          border-radius: 12px;

          background: #f8fafc;

          border: 1px solid #e8edf4;
        }

        .overview-summary-icon {
          width: 33px;
          height: 33px;

          flex: 0 0 33px;

          display: grid;
          place-items: center;

          border-radius: 10px;

          background: #eaf3ff;

          color: #1769aa;
        }

        .overview-summary-icon svg {
          width: 15px;
        }

        .overview-summary-title {
          color: #7b8496;

          font-size: 9px;

          font-weight: 750;
        }

        .overview-summary-value {
          margin-top: 3px;

          font-size: 15px;

          font-weight: 850;
        }

        .overview-saving {
          margin-top: 10px;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          padding: 17px;

          border-radius: 15px;

          color: white;

          background:
            linear-gradient(
              135deg,
              #102c43,
              #1d4f66
            );

          box-shadow:
            0 10px 25px rgba(16,44,67,0.16);
        }

        .overview-saving-label {
          display: block;

          color: rgba(255,255,255,0.68);

          font-size: 9px;

          font-weight: 850;

          letter-spacing: 0.12em;
        }

        .overview-saving-value {
          margin-top: 3px;

          font-size:
            clamp(23px, 4vw, 34px);

          font-weight: 900;

          letter-spacing: -0.04em;
        }

        .overview-saving-formula {
          color: rgba(255,255,255,0.72);

          font-size: 10px;

          line-height: 1.7;

          text-align: right;
        }

        .overview-auto-note {
          margin-top: 9px;

          padding: 10px 12px;

          border-radius: 10px;

          color: #667085;

          background: #f4f7fb;

          font-size: 10px;
        }

        .overview-loading {
          min-height: 55vh;

          display: flex;

          align-items: center;

          justify-content: center;

          flex-direction: column;

          gap: 9px;

          color: #667085;

          font-size: 12px;
        }

        .overview-empty {
          min-height: 55vh;

          display: flex;

          align-items: center;

          justify-content: center;

          color: #667085;

          font-size: 12px;
        }

        .overview-toast-container {
          position: fixed;

          z-index: 5000;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%, -50%);

          width:
            min(340px, calc(100vw - 28px));
        }

        .overview-toast {
          display: flex;

          align-items: flex-start;

          gap: 9px;

          padding: 13px;

          border-radius: 13px;

          background: white;

          box-shadow:
            0 20px 60px rgba(15,23,42,0.25);

          border: 1px solid #e5eaf2;

          animation:
            overviewToastIn 0.2s ease;
        }

        .overview-toast.success {
          border-left: 4px solid #168451;
        }

        .overview-toast.error {
          border-left: 4px solid #d04444;
        }

        .overview-toast-content {
          flex: 1;

          min-width: 0;
        }

        .overview-toast-title {
          font-size: 12px;

          font-weight: 850;
        }

        .overview-toast-message {
          margin-top: 3px;

          color: #697386;

          font-size: 10px;

          line-height: 1.45;

          overflow-wrap: anywhere;
        }

        .overview-spin {
          animation:
            overviewSpin 0.9s linear infinite;
        }

        @keyframes overviewSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes overviewToastIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 900px) {
          .overview-grid,
          .overview-manual-grid,
          .overview-summary-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .overview-page {
            padding: 7px;

            padding-bottom:
              env(safe-area-inset-bottom, 10px);
          }

          .overview-navbar {
            flex-direction: column;

            align-items: stretch;

            border-radius: 15px;
          }

          .overview-month-controls {
            justify-content: center;
          }

          .overview-month {
            flex: 1;

            min-width: 0;
          }

          .overview-current-button {
            display: none;
          }

          .overview-stat-card {
            padding: 11px;

            border-radius: 13px;
          }

          .overview-stat-icon {
            width: 31px;
            height: 31px;

            flex-basis: 31px;
          }

          .overview-stat-title {
            font-size: 8px;
          }

          .overview-stat-value {
            font-size: 16px;
          }

          .overview-section {
            padding: 12px;

            border-radius: 14px;
          }

          .overview-manual-grid,
          .overview-summary-grid {
            gap: 6px;
          }

          .overview-field {
            padding: 9px;
          }

          .overview-summary-box {
            padding: 9px;
          }

          .overview-summary-value {
            font-size: 13px;
          }

          .overview-saving {
            flex-direction: column;

            align-items: flex-start;
          }

          .overview-saving-formula {
            text-align: left;
          }
        }

        @media (max-width: 390px) {
          .overview-manual-grid {
            grid-template-columns: 1fr;
          }

          .overview-brand p {
            display: none;
          }

          .overview-stat-title {
            font-size: 8px;
          }
        }
      `}</style>

      <main className="overview-page">
        <div className="overview-container">

          {/* NAVBAR */}
          <header className="overview-navbar">

            <div className="overview-brand">
              <div className="overview-brand-icon">
                <WalletCards size={21} />
              </div>

              <div>
                <h1>Overview</h1>

                <p>
                  Monthly personal finance
                </p>
              </div>
            </div>

            <div className="overview-month-controls">

              <button
                type="button"
                className="overview-icon-button"
                onClick={() =>
                  changeMonth(-1)
                }
                title="Previous month"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="overview-month">
                <CalendarDays size={15} />

                {monthTitle(
                  selectedMonth
                )}
              </div>

              <button
                type="button"
                className="overview-icon-button"
                onClick={() =>
                  changeMonth(1)
                }
                title="Next month"
              >
                <ChevronRight size={18} />
              </button>

              <input
                type="month"
                className="overview-month-input"
                value={getMonthInput(
                  selectedMonth
                )}
                onChange={(e) =>
                  selectMonth(
                    e.target.value
                  )
                }
                title="Select month"
              />

              <button
                type="button"
                className="overview-current-button"
                onClick={currentMonth}
              >
                Current
              </button>

              <button
                type="button"
                className="overview-icon-button"
                onClick={loadOverview}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading
                      ? "overview-spin"
                      : ""
                  }
                />
              </button>
            </div>
          </header>

          {/* LOADING */}
          {loading && !overview ? (
            <div className="overview-section overview-loading">
              <RefreshCw
                size={28}
                className="overview-spin"
              />

              Loading overview...
            </div>
          ) : null}

          {/* EMPTY */}
          {!loading && !overview ? (
            <div className="overview-section overview-empty">
              No overview data available.
            </div>
          ) : null}

          {overview ? (
            <>
              {/* TOP SUMMARY */}
              <section className="overview-grid">

                <StatCard
                  icon={
                    <WalletCards size={17} />
                  }
                  iconClass="green"
                  title="Total Payment"
                  value={formatMoney(
                    totalPayment
                  )}
                  subtitle="Work + Business"
                />

                <StatCard
                  icon={
                    <PiggyBank size={17} />
                  }
                  iconClass={
                    monthlySaving >= 0
                      ? "blue"
                      : "red"
                  }
                  title="Monthly Saving"
                  value={formatMoney(
                    monthlySaving
                  )}
                  subtitle="Selected month"
                />

                <StatCard
                  icon={
                    <Receipt size={17} />
                  }
                  iconClass="red"
                  title="Total Expenses"
                  value={formatMoney(
                    totalExpenses
                  )}
                  subtitle="From Expense page"
                />

                <StatCard
                  icon={
                    <HandCoins size={17} />
                  }
                  iconClass="orange"
                  title="Total Borrow"
                  value={formatMoney(
                    totalBorrow
                  )}
                  subtitle="From Loan/Borrow page"
                />
              </section>

              {/* MANUAL DATA */}
              <section className="overview-section">

                <div className="overview-section-header">

                  <h2 className="overview-section-title">
                    <BriefcaseBusiness
                      size={17}
                    />

                    Work & Business
                  </h2>

                  {!editing ? (
                    <button
                      type="button"
                      className="overview-edit-button"
                      onClick={() =>
                        setEditing(true)
                      }
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                      }}
                    >
                      <button
                        type="button"
                        className="overview-save-button"
                        onClick={
                          saveOverview
                        }
                        disabled={saving}
                      >
                        <Save size={14} />

                        {saving
                          ? "Saving..."
                          : "Save"}
                      </button>

                      <button
                        type="button"
                        className="overview-cancel-button"
                        onClick={
                          cancelEdit
                        }
                        disabled={saving}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="overview-manual-grid">

                  <ManualField
                    label="Total Work"
                    value={
                      manual.total_work
                    }
                    editing={editing}
                    onChange={(value) =>
                      setManual({
                        ...manual,
                        total_work:
                          value,
                      })
                    }
                  />

                  <ManualField
                    label="Total Business"
                    value={
                      manual.total_business
                    }
                    editing={editing}
                    onChange={(value) =>
                      setManual({
                        ...manual,
                        total_business:
                          value,
                      })
                    }
                  />

                  <ManualField
                    label="Work Payment"
                    value={
                      manual.work_payment
                    }
                    editing={editing}
                    money
                    onChange={(value) =>
                      setManual({
                        ...manual,
                        work_payment:
                          value,
                      })
                    }
                  />

                  <ManualField
                    label="Business Payment"
                    value={
                      manual.business_payment
                    }
                    editing={editing}
                    money
                    onChange={(value) =>
                      setManual({
                        ...manual,
                        business_payment:
                          value,
                      })
                    }
                  />
                </div>
              </section>

              {/* TOTAL PAYMENT */}
              <section className="overview-section">

                <div className="overview-section-header">

                  <h2 className="overview-section-title">
                    <WalletCards
                      size={17}
                    />

                    Total Payment
                  </h2>

                  <span className="overview-section-note">
                    Work + Business
                  </span>
                </div>

                <div className="overview-summary-grid">

                  <SummaryBox
                    icon={
                      <BriefcaseBusiness
                        size={15}
                      />
                    }
                    title="Work Payment"
                    value={formatMoney(
                      manual.work_payment
                    )}
                  />

                  <SummaryBox
                    icon={
                      <Building2
                        size={15}
                      />
                    }
                    title="Business Payment"
                    value={formatMoney(
                      manual.business_payment
                    )}
                  />

                  <SummaryBox
                    icon={
                      <WalletCards
                        size={15}
                      />
                    }
                    title="Total Payment"
                    value={formatMoney(
                      totalPayment
                    )}
                  />

                  <SummaryBox
                    icon={
                      <CreditCard
                        size={15}
                      />
                    }
                    title="Loan EMI Paid"
                    value={formatMoney(
                      totalEmiPaid
                    )}
                  />
                </div>
              </section>

              {/* AUTOMATIC DATA */}
              <section className="overview-section">

                <div className="overview-section-header">

                  <h2 className="overview-section-title">
                    <Receipt size={17} />

                    Automatic Monthly Totals
                  </h2>

                  <span className="overview-section-note">
                    Separate pages / APIs
                  </span>
                </div>

                <div className="overview-summary-grid">

                  <SummaryBox
                    icon={
                      <Receipt size={15} />
                    }
                    title="Total Expenses"
                    value={formatMoney(
                      totalExpenses
                    )}
                  />

                  <SummaryBox
                    icon={
                      <HandCoins
                        size={15}
                      />
                    }
                    title="Total Borrow"
                    value={formatMoney(
                      totalBorrow
                    )}
                  />

                  <SummaryBox
                    icon={
                      <CreditCard
                        size={15}
                      />
                    }
                    title="Loan EMI Paid"
                    value={formatMoney(
                      totalEmiPaid
                    )}
                  />

                  <SummaryBox
                    icon={
                      <WalletCards
                        size={15}
                      />
                    }
                    title="Total Payment"
                    value={formatMoney(
                      totalPayment
                    )}
                  />
                </div>

                <div className="overview-auto-note">
                  Expenses are received from the
                  Expense page/API. Borrow and EMI
                  Paid are received from the
                  Loan & Borrow page/API.
                  Overview does not manually add
                  these transactions.
                </div>

                {/* MONTHLY SAVING */}
                <div className="overview-saving">

                  <div>
                    <span className="overview-saving-label">
                      MONTHLY SAVING
                    </span>

                    <div className="overview-saving-value">
                      {formatMoney(
                        monthlySaving
                      )}
                    </div>
                  </div>

                  <div className="overview-saving-formula">
                    Total Payment
                    <br />
                    − Total Expenses
                    <br />
                    + Total EMI Paid
                  </div>
                </div>
              </section>

              {/* WORK / BUSINESS COUNTS */}
              <section className="overview-grid">

                <StatCard
                  icon={
                    <BriefcaseBusiness
                      size={17}
                    />
                  }
                  iconClass="blue"
                  title="Total Work"
                  value={formatNumber(
                    manual.total_work
                  )}
                  subtitle="Manual monthly value"
                />

                <StatCard
                  icon={
                    <Building2
                      size={17}
                    />
                  }
                  iconClass="violet"
                  title="Total Business"
                  value={formatNumber(
                    manual.total_business
                  )}
                  subtitle="Manual monthly value"
                />

                <StatCard
                  icon={
                    <CreditCard
                      size={17}
                    />
                  }
                  iconClass="violet"
                  title="Loan EMI Paid"
                  value={formatMoney(
                    totalEmiPaid
                  )}
                  subtitle="Actually paid this month"
                />

                <StatCard
                  icon={
                    <HandCoins
                      size={17}
                    />
                  }
                  iconClass="orange"
                  title="Borrow Amount"
                  value={formatMoney(
                    totalBorrow
                  )}
                  subtitle="Selected month"
                />
              </section>
            </>
          ) : null}
        </div>
      </main>

      {/* PROFESSIONAL CENTER ALERT */}
      {toast ? (
        <div className="overview-toast-container">
          <div
            className={`overview-toast ${toast.type}`}
          >
            {toast.type === "success" ? (
              <CheckCircle2
                size={19}
                color="#168451"
              />
            ) : (
              <AlertCircle
                size={19}
                color="#d04444"
              />
            )}

            <div className="overview-toast-content">

              <div className="overview-toast-title">
                {toast.type ===
                "success"
                  ? "Success"
                  : "Error"}
              </div>

              <div className="overview-toast-message">
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              className="overview-icon-button"
              style={{
                width: "27px",
                height: "27px",
              }}
              onClick={() =>
                setToast(null)
              }
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}