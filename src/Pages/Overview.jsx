import React, { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  Landmark,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock3,
  IndianRupee,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://express-project-learning-new.onrender.com";

const EMPTY = {
  totalWorks: 0,
  totalBusiness: 0,
  workPayments: 0,
  businessPayments: 0,
  expenses: 0,
  borrow: 0,
  loan: 0,
  savings: 0,
  otherIncome: 0,
  incomeTotal: 0,
  profitLoss: 0,
  upcomingRepayments: [],
};

const numberValue = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const money = (value) => {
  const n = numberValue(value);
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;

  if (Number.isInteger(rounded)) {
    return `₹${new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(rounded)}`;
  }

  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded)}`;
};

const firstNumber = (obj, keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) {
      return numberValue(obj[key]);
    }
  }
  return 0;
};

const normalizeOverview = (raw) => {
  const data = raw?.data || raw?.overview || raw || {};
  const business = data.business || {};
  const work = data.work || {};
  const income = data.income || {};
  const expenses = data.expenses || {};
  const loan = data.loan || {};
  const borrow = data.borrow || {};
  const savings = data.savings || {};
  const otherIncome = data.other_income || {};

  return {
    totalWorks: firstNumber(work, ["total", "totalWorks", "total_works"]),
    totalBusiness: firstNumber(business, ["total", "totalBusiness", "total_business"]),
    workPayments: firstNumber(work, ["payment", "workPayments", "work_payment"]),
    businessPayments: firstNumber(business, ["payment", "businessPayments", "business_payment"]),
    expenses: firstNumber(expenses, ["total"]),
    borrow: firstNumber(borrow, ["total_amount", "totalAmount", "total"]),
    loan: firstNumber(loan, ["total_amount", "totalAmount", "total"]),
    savings: firstNumber(savings, ["total"]),
    otherIncome: firstNumber(otherIncome, ["received", "total", "amount"]),
    incomeTotal: firstNumber(income, ["total"]),
    profitLoss: firstNumber(savings, ["total", "profitLoss", "profit_loss"]),
    upcomingRepayments: [],
  };
};

// =============================================
// AUTH HELPER - Get token from storage
// =============================================
const getAuthToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    null
  );
};

// =============================================
// API HELPER - Fetch with authentication
// =============================================
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};

const Card = ({ icon, title, value, subtitle, positive, tone = "purple" }) => (
  <div className={`overview-card overview-card-${tone}`}>
    <div className="overview-card-top">
      <div className="overview-icon">{icon}</div>
      {positive !== undefined && (
        <span className={positive ? "status-positive" : "status-negative"}>
          {positive ? "Positive" : "Negative"}
        </span>
      )}
    </div>
    <div className="overview-title">{title}</div>
    <div className="overview-value">{value}</div>
    {subtitle && <div className="overview-subtitle">{subtitle}</div>}
  </div>
);

const Overview = () => {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showManualModal, setShowManualModal] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    totalWorks: 0,
    totalBusiness: 0,
    workPayments: 0,
    businessPayments: 0,
  });

  const loadOverview = async (selectedMonth = month) => {
    try {
      setError("");
      setRefreshing(true);

      // Check if token exists before making request
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/overview?month=${encodeURIComponent(
          selectedMonth
        )}&t=${Date.now()}`,
        {
          method: "GET",
        }
      );

      const contentType = response.headers.get("content-type") || "";

      if (response.status === 401) {
        // Token expired or invalid - redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!contentType.includes("application/json")) {
        throw new Error("Server returned a non-JSON response.");
      }

      const result = await response.json();

      if (!result.success && result.success !== undefined) {
        throw new Error(result.message || "Failed to load overview.");
      }

      const normalized = normalizeOverview(result);

      try {
        const upcomingResponse = await fetchWithAuth(
          `${API_BASE_URL}/api/overview/upcoming?t=${Date.now()}`,
          { method: "GET" }
        );
        const upcomingContentType =
          upcomingResponse.headers.get("content-type") || "";

        if (
          upcomingResponse.ok &&
          upcomingContentType.includes("application/json")
        ) {
          const upcomingResult = await upcomingResponse.json();
          normalized.upcomingRepayments = Array.isArray(upcomingResult.data)
            ? upcomingResult.data
            : [];
        }
      } catch (upcomingError) {
        console.warn("Upcoming repayment API error:", upcomingError);
      }

      setData(normalized);
    } catch (err) {
      console.error("Overview API error:", err);
      setError(err.message || "Failed to load overview.");
      setData(EMPTY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview(month);
  }, [month]);

  const openManualModal = () => {
    setManualForm({
      totalWorks: data.totalWorks,
      totalBusiness: data.totalBusiness,
      workPayments: data.workPayments,
      businessPayments: data.businessPayments,
    });
    setError("");
    setShowManualModal(true);
  };

  const updateManualField = (field, value) => {
    setManualForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveManualOverview = async () => {
    try {
      setSavingManual(true);
      setError("");

      const values = {
        total_business: Number(manualForm.totalBusiness),
        total_works: Number(manualForm.totalWorks),
        business_payment: Number(manualForm.businessPayments),
        work_payment: Number(manualForm.workPayments),
      };

      if (
        !Number.isInteger(values.total_business) ||
        values.total_business < 0 ||
        !Number.isInteger(values.total_works) ||
        values.total_works < 0
      ) {
        throw new Error("Total Business and Total Work must be valid whole numbers.");
      }

      if (
        !Number.isFinite(values.business_payment) ||
        values.business_payment < 0 ||
        !Number.isFinite(values.work_payment) ||
        values.work_payment < 0
      ) {
        throw new Error("Business and Work Payment must be valid non-negative amounts.");
      }

      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/overview/month`,
        {
          method: "PUT",
          body: JSON.stringify({
            month,
            ...values,
          }),
        }
      );

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : {};

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            result.error ||
            `Failed to save manual overview. HTTP ${response.status}`
        );
      }

      setData((prev) => ({
        ...prev,
        totalWorks: values.total_works,
        totalBusiness: values.total_business,
        workPayments: values.work_payment,
        businessPayments: values.business_payment,
      }));
      setShowManualModal(false);
      await loadOverview(month);
    } catch (err) {
      console.error("Manual overview save error:", err);
      setError(err.message || "Failed to save manual overview.");
    } finally {
      setSavingManual(false);
    }
  };

  const totalIncome = useMemo(
    () =>
      data.incomeTotal > 0
        ? data.incomeTotal
        : data.workPayments + data.businessPayments + data.otherIncome,
    [data]
  );

  const totalDebt = data.borrow + data.loan;

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString("en-IN");
  };

  if (loading) {
    return (
      <div className="overview-loading">
        <RefreshCw className="spin" size={30} />
        <span>Loading Overview...</span>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="overview-page">
      <style>{styles}</style>

      <div className="overview-header">
        <div>
          <div className="overview-heading">
            <BriefcaseBusiness size={22} />
            <h1>Overview</h1>
          </div>
          <p>Business, work and personal financial overview</p>
        </div>

        <div className="overview-actions">
          <label className="month-picker">
            <CalendarDays size={17} />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>

          <button
            className="manual-btn"
            onClick={openManualModal}
            disabled={refreshing}
            title="Edit manual monthly values"
          >
            Edit
          </button>

          <button
            className="refresh-btn"
            onClick={() => loadOverview(month)}
            disabled={refreshing}
            title="Refresh"
          >
            <RefreshCw className={refreshing ? "spin" : ""} size={17} />
          </button>
        </div>
      </div>

      {error && (
        <div className="overview-error">
          <AlertCircle size={17} />
          <span>{error}</span>
          {error.includes("login") && (
            <button
              onClick={() => window.location.href = "/login"}
              style={{
                marginLeft: "auto",
                padding: "4px 12px",
                background: "rgba(124,58,237,0.3)",
                border: "1px solid rgba(124,58,237,0.4)",
                borderRadius: "6px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.7rem",
              }}
            >
              Login Again
            </button>
          )}
        </div>
      )}

      <section className="overview-grid">
        <Card
          icon={<BriefcaseBusiness size={20} />}
          title="Total Work"
          value={data.totalWorks}
          tone="blue"
          subtitle="Selected month"
        />
        <Card
          icon={<Landmark size={20} />}
          title="Total Business"
          value={data.totalBusiness}
          tone="violet"
          subtitle="Selected month"
        />
        <Card
          icon={<ArrowUpCircle size={20} />}
          title="Work Payments"
          value={money(data.workPayments)}
          tone="cyan"
          subtitle="Received"
        />
        <Card
          icon={<IndianRupee size={20} />}
          title="Business Payments"
          value={money(data.businessPayments)}
          tone="green"
          subtitle="Received"
        />
        <Card
          icon={<CreditCard size={20} />}
          title="Monthly Expenses"
          value={money(data.expenses)}
          tone="orange"
          subtitle="Total expenses"
        />
        <Card
          icon={<ArrowDownCircle size={20} />}
          title="Borrow"
          value={money(data.borrow)}
          tone="red"
          subtitle="Borrowed amount"
        />
        <Card
          icon={<Wallet size={20} />}
          title="Loan"
          value={money(data.loan)}
          tone="amber"
          subtitle="Loan amount"
        />
        <Card
          icon={<Wallet size={20} />}
          title="Savings"
          value={money(data.savings)}
          tone="emerald"
          subtitle="Current savings"
        />
      </section>

      <section className="summary-row">
        <div className="summary-panel">
          <div className="panel-title">
            <TrendingUp size={18} />
            Income Summary
          </div>
          <div className="summary-line">
            <span>Work Payments</span>
            <strong>{money(data.workPayments)}</strong>
          </div>
          <div className="summary-line">
            <span>Business Payments</span>
            <strong>{money(data.businessPayments)}</strong>
          </div>
          <div className="summary-line">
            <span>Other Income</span>
            <strong>{money(data.otherIncome)}</strong>
          </div>
          <div className="summary-total">
            <span>Total Income</span>
            <strong>{money(totalIncome)}</strong>
          </div>
        </div>

        <div className="summary-panel">
          <div className="panel-title">
            <TrendingDown size={18} />
            Financial Status
          </div>
          <div className="summary-line">
            <span>Expenses</span>
            <strong>{money(data.expenses)}</strong>
          </div>
          <div className="summary-line">
            <span>Borrow + Loan</span>
            <strong>{money(totalDebt)}</strong>
          </div>
          <div className="summary-line">
            <span>Savings</span>
            <strong>{money(data.savings)}</strong>
          </div>
          <div className="summary-total">
            <span>Profit / Loss</span>
            <strong className={data.profitLoss >= 0 ? "profit" : "loss"}>
              {money(data.profitLoss)}
            </strong>
          </div>
        </div>
      </section>

      <section className="repayment-panel">
        <div className="panel-title">
          <Clock3 size={18} />
          Remaining Upcoming Loan / Borrow Repayments
        </div>

        {data.upcomingRepayments.length === 0 ? (
          <div className="empty-repayments">
            No upcoming repayments for the selected month.
          </div>
        ) : (
          <div className="repayment-table-wrap">
            <table className="repayment-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.upcomingRepayments.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{item.type || item.loan_type || "-"}</td>
                    <td>
                      {item.name ||
                        item.person_name ||
                        item.title ||
                        "-"}
                    </td>
                    <td>
                      {money(
                        item.remaining_amount ??
                          item.remainingAmount ??
                          item.amount
                      )}
                    </td>
                    <td>
                      {formatDate(item.due_date || item.dueDate)}
                    </td>
                    <td>
                      <span className="due-badge">
                        {item.status || "Upcoming"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showManualModal && (
        <div
          className="manual-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !savingManual) {
              setShowManualModal(false);
            }
          }}
        >
          <div className="manual-modal" role="dialog" aria-modal="true">
            <div className="manual-modal-header">
              <div>
                <h2>Monthly Overview</h2>
                <p>Enter only the 4 manual values for {month}.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => !savingManual && setShowManualModal(false)}
                disabled={savingManual}
              >
                ×
              </button>
            </div>

            <div className="manual-form-grid">
              <label>
                <span>Total Work</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={manualForm.totalWorks}
                  onChange={(e) =>
                    updateManualField("totalWorks", e.target.value)
                  }
                />
              </label>

              <label>
                <span>Total Business</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={manualForm.totalBusiness}
                  onChange={(e) =>
                    updateManualField("totalBusiness", e.target.value)
                  }
                />
              </label>

              <label>
                <span>Work Payment</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualForm.workPayments}
                  onChange={(e) =>
                    updateManualField("workPayments", e.target.value)
                  }
                />
              </label>

              <label>
                <span>Business Payment</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualForm.businessPayments}
                  onChange={(e) =>
                    updateManualField("businessPayments", e.target.value)
                  }
                />
              </label>
            </div>

            <div className="manual-auto-note">
              Expenses, Borrow, Loan, Savings, Other Income, Profit/Loss and
              Upcoming Repayments are fetched/calculated automatically.
            </div>

            <div className="manual-modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setShowManualModal(false)}
                disabled={savingManual}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-save-btn"
                onClick={saveManualOverview}
                disabled={savingManual}
              >
                {savingManual ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = `
  .overview-page {
    width: 100%;
    min-height: 100%;
    box-sizing: border-box;
    padding: clamp(14px, 2vw, 26px);
    color: #f8fafc;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background:
      radial-gradient(circle at 10% 0%, rgba(124,58,237,.16), transparent 32%),
      radial-gradient(circle at 90% 10%, rgba(14,165,233,.11), transparent 28%);
  }

  .overview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 20px;
  }

  .overview-heading {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .overview-heading svg {
    color: #a78bfa;
    filter: drop-shadow(0 0 9px rgba(139,92,246,.42));
  }

  .overview-heading h1 {
    margin: 0;
    font-size: clamp(1.25rem, 2vw, 1.55rem);
    font-weight: 850;
    letter-spacing: -.02em;
  }

  .overview-header p {
    margin: 6px 0 0;
    color: rgba(226,232,240,.58);
    font-size: .78rem;
  }

  .overview-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .month-picker,
  .refresh-btn,
  .manual-btn {
    height: 40px;
    box-sizing: border-box;
    border-radius: 11px;
    transition: .2s ease;
  }

  .month-picker {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 11px;
    border: 1px solid rgba(148,163,184,.18);
    background: rgba(15,23,42,.72);
    color: #fff;
    box-shadow: inset 0 1px rgba(255,255,255,.04);
  }

  .month-picker:focus-within {
    border-color: rgba(139,92,246,.65);
    box-shadow: 0 0 0 3px rgba(139,92,246,.11);
  }

  .month-picker svg {
    color: #a78bfa;
    flex: 0 0 auto;
  }

  .month-picker input {
    min-width: 128px;
    color: #fff;
    background: transparent;
    border: 0;
    outline: 0;
    font-size: .78rem;
    font-weight: 700;
  }

  .refresh-btn {
    width: 40px;
    display: grid;
    place-items: center;
    cursor: pointer;
    border: 1px solid rgba(148,163,184,.18);
    background: rgba(15,23,42,.72);
    color: #cbd5e1;
  }

  .refresh-btn:hover {
    color: #fff;
    border-color: rgba(139,92,246,.55);
    background: rgba(124,58,237,.18);
    transform: translateY(-1px);
  }

  .manual-btn {
    padding: 0 13px;
    border: 1px solid rgba(139,92,246,.42);
    background: linear-gradient(135deg, rgba(124,58,237,.28), rgba(99,102,241,.16));
    color: #ede9fe;
    cursor: pointer;
    font-size: .72rem;
    font-weight: 800;
    box-shadow: 0 7px 20px rgba(124,58,237,.12);
  }

  .manual-btn:hover {
    color: #fff;
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    border-color: #a78bfa;
    transform: translateY(-1px);
    box-shadow: 0 10px 25px rgba(124,58,237,.28);
  }

  .overview-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    margin-bottom: 15px;
    border-radius: 11px;
    color: #fecaca;
    background: linear-gradient(135deg, rgba(239,68,68,.13), rgba(127,29,29,.08));
    border: 1px solid rgba(248,113,113,.25);
    font-size: .78rem;
    flex-wrap: wrap;
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .overview-card,
  .summary-panel,
  .repayment-panel {
    position: relative;
    overflow: hidden;
    background: linear-gradient(145deg, rgba(15,23,42,.91), rgba(17,24,39,.78));
    border: 1px solid rgba(148,163,184,.14);
    border-radius: 17px;
    box-shadow:
      0 15px 36px rgba(0,0,0,.18),
      inset 0 1px rgba(255,255,255,.035);
    backdrop-filter: blur(12px);
  }

  .overview-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 2px;
    background: var(--tone);
    opacity: .9;
  }

  .overview-card::after {
    content: "";
    position: absolute;
    width: 110px;
    height: 110px;
    right: -55px;
    top: -55px;
    border-radius: 50%;
    background: var(--tone);
    opacity: .07;
    filter: blur(2px);
    pointer-events: none;
  }

  .overview-card {
    --tone: #8b5cf6;
    padding: 16px;
    min-width: 0;
    transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
  }

  .overview-card:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--tone) 42%, transparent);
    box-shadow:
      0 20px 42px rgba(0,0,0,.24),
      0 0 25px color-mix(in srgb, var(--tone) 11%, transparent),
      inset 0 1px rgba(255,255,255,.05);
  }

  .overview-card-blue { --tone: #38bdf8; }
  .overview-card-violet { --tone: #a78bfa; }
  .overview-card-cyan { --tone: #22d3ee; }
  .overview-card-green { --tone: #34d399; }
  .overview-card-orange { --tone: #fb923c; }
  .overview-card-red { --tone: #fb7185; }
  .overview-card-amber { --tone: #fbbf24; }
  .overview-card-emerald { --tone: #10b981; }

  .overview-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .overview-icon {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 13%, transparent);
    border: 1px solid color-mix(in srgb, var(--tone) 18%, transparent);
    box-shadow: 0 6px 18px color-mix(in srgb, var(--tone) 9%, transparent);
  }

  .overview-title {
    margin-top: 14px;
    color: rgba(226,232,240,.64);
    font-size: .72rem;
    font-weight: 650;
  }

  .overview-value {
    margin-top: 5px;
    color: #f8fafc;
    font-size: clamp(1.05rem, 1.6vw, 1.28rem);
    font-weight: 850;
    letter-spacing: -.02em;
    word-break: break-word;
  }

  .overview-subtitle {
    margin-top: 5px;
    color: rgba(148,163,184,.56);
    font-size: .63rem;
  }

  .status-positive,
  .status-negative,
  .due-badge {
    padding: 4px 7px;
    border-radius: 7px;
    font-size: .58rem;
    font-weight: 750;
  }

  .status-positive {
    color: #6ee7b7;
    background: rgba(16,185,129,.11);
    border: 1px solid rgba(52,211,153,.13);
  }

  .status-negative {
    color: #fda4af;
    background: rgba(244,63,94,.1);
    border: 1px solid rgba(251,113,133,.14);
  }

  .summary-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 14px;
  }

  .summary-panel,
  .repayment-panel {
    padding: 17px;
  }

  .summary-panel::before,
  .repayment-panel::before {
    content: "";
    display: block;
    width: 48px;
    height: 2px;
    margin-bottom: 12px;
    border-radius: 5px;
    background: linear-gradient(90deg, #8b5cf6, transparent);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 13px;
    font-size: .82rem;
    font-weight: 800;
    color: #e9d5ff;
  }

  .panel-title svg {
    color: #a78bfa;
  }

  .summary-line,
  .summary-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(148,163,184,.08);
    font-size: .73rem;
  }

  .summary-line span {
    color: rgba(226,232,240,.55);
  }

  .summary-line strong {
    color: #e2e8f0;
    font-weight: 750;
  }

  .summary-total {
    border-bottom: 0;
    padding-bottom: 0;
    font-weight: 850;
  }

  .profit { color: #34d399; }
  .loss { color: #fb7185; }

  .repayment-panel {
    margin-top: 14px;
  }

  .repayment-table-wrap {
    overflow-x: auto;
    border: 1px solid rgba(148,163,184,.09);
    border-radius: 11px;
  }

  .repayment-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 620px;
  }

  .repayment-table th {
    color: rgba(203,213,225,.48);
    background: rgba(255,255,255,.025);
    font-size: .63rem;
    font-weight: 750;
    text-align: left;
    padding: 9px;
    border-bottom: 1px solid rgba(148,163,184,.09);
  }

  .repayment-table td {
    padding: 10px 9px;
    color: #dbe4ef;
    font-size: .7rem;
    border-bottom: 1px solid rgba(148,163,184,.055);
  }

  .repayment-table tbody tr {
    transition: background .18s ease;
  }

  .repayment-table tbody tr:hover {
    background: rgba(139,92,246,.055);
  }

  .due-badge {
    color: #fcd34d;
    background: rgba(245,158,11,.1);
    border: 1px solid rgba(251,191,36,.13);
  }

  .empty-repayments {
    padding: 22px 5px 5px;
    text-align: center;
    color: rgba(148,163,184,.48);
    font-size: .72rem;
  }

  .overview-loading {
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    color: rgba(203,213,225,.65);
    font-size: .8rem;
  }

  .spin {
    animation: overview-spin 1s linear infinite;
  }

  @keyframes overview-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .manual-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 15px;
    background: rgba(2,6,23,.72);
    backdrop-filter: blur(7px);
  }

  .manual-modal {
    width: min(500px, calc(100vw - 30px));
    max-height: calc(100vh - 30px);
    overflow-y: auto;
    box-sizing: border-box;
    padding: 19px;
    color: #fff;
    background: linear-gradient(145deg, #111827, #0f172a);
    border: 1px solid rgba(167,139,250,.22);
    border-radius: 17px;
    box-shadow: 0 30px 90px rgba(0,0,0,.58), 0 0 45px rgba(124,58,237,.1);
  }

  .manual-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .manual-modal-header h2 {
    margin: 0;
    font-size: .98rem;
    font-weight: 850;
  }

  .manual-modal-header p {
    margin: 5px 0 0;
    color: rgba(203,213,225,.5);
    font-size: .67rem;
  }

  .modal-close {
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 8px;
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.7);
    font-size: 19px;
    cursor: pointer;
    transition: .18s ease;
  }

  .modal-close:hover {
    background: rgba(244,63,94,.14);
    color: #fda4af;
  }

  .manual-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 11px;
  }

  .manual-form-grid label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .manual-form-grid label span {
    color: rgba(226,232,240,.62);
    font-size: .68rem;
    font-weight: 700;
  }

  .manual-form-grid input {
    width: 100%;
    box-sizing: border-box;
    height: 40px;
    padding: 0 10px;
    border: 1px solid rgba(148,163,184,.14);
    border-radius: 9px;
    outline: 0;
    color: #fff;
    background: rgba(255,255,255,.045);
    font-size: .75rem;
    transition: .18s ease;
  }

  .manual-form-grid input:focus {
    border-color: #8b5cf6;
    background: rgba(124,58,237,.06);
    box-shadow: 0 0 0 3px rgba(139,92,246,.11);
  }

  .manual-auto-note {
    margin-top: 13px;
    padding: 10px;
    border-radius: 9px;
    color: rgba(203,213,225,.53);
    background: linear-gradient(135deg, rgba(124,58,237,.09), rgba(14,165,233,.05));
    border: 1px solid rgba(139,92,246,.13);
    font-size: .64rem;
    line-height: 1.5;
  }

  .manual-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 15px;
  }

  .modal-cancel-btn,
  .modal-save-btn {
    min-height: 37px;
    padding: 0 15px;
    border-radius: 9px;
    font-size: .68rem;
    font-weight: 800;
    cursor: pointer;
    transition: .18s ease;
  }

  .modal-cancel-btn {
    color: rgba(226,232,240,.75);
    background: rgba(255,255,255,.055);
    border: 1px solid rgba(148,163,184,.12);
  }

  .modal-cancel-btn:hover {
    background: rgba(255,255,255,.09);
  }

  .modal-save-btn {
    color: #fff;
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    border: 1px solid rgba(167,139,250,.6);
    box-shadow: 0 8px 22px rgba(124,58,237,.22);
  }

  .modal-save-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 11px 27px rgba(124,58,237,.3);
  }

  .modal-cancel-btn:disabled,
  .modal-save-btn:disabled,
  .manual-btn:disabled,
  .refresh-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 1100px) {
    .overview-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .overview-page {
      padding: 11px;
    }

    .overview-header {
      align-items: stretch;
      flex-direction: column;
    }

    .overview-actions {
      width: 100%;
    }

    .month-picker {
      flex: 1;
      min-width: 0;
    }

    .month-picker input {
      width: 100%;
      min-width: 0;
    }

    .overview-grid,
    .summary-row {
      grid-template-columns: 1fr;
    }

    .overview-card {
      padding: 14px;
    }

    .manual-form-grid {
      grid-template-columns: 1fr;
    }

    .manual-modal {
      width: min(500px, calc(100vw - 20px));
      padding: 15px;
    }

    .manual-modal-actions {
      width: 100%;
    }

    .modal-cancel-btn,
    .modal-save-btn {
      flex: 1;
    }
  }

  @media (max-width: 430px) {
    .overview-page {
      padding: 8px;
    }

    .overview-actions {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
    }

    .overview-heading h1 {
      font-size: 1.2rem;
    }

    .overview-header p {
      font-size: .7rem;
    }

    .manual-btn {
      padding: 0 10px;
    }

    .overview-card {
      border-radius: 14px;
    }

    .summary-panel,
    .repayment-panel {
      padding: 14px;
      border-radius: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .overview-card,
    .manual-btn,
    .refresh-btn,
    .modal-save-btn,
    .modal-cancel-btn {
      transition: none;
    }

    .spin {
      animation: none;
    }
  }
`;


export default Overview;