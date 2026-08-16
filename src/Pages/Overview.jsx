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
  profitLoss: 0,
  upcomingRepayments: [],
};

const numberValue = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numberValue(value));

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

  const source = {
    totalWorks: firstNumber(data, [
      "totalWorks",
      "total_works",
      "workCount",
      "work_count",
    ]),
    totalBusiness: firstNumber(data, [
      "totalBusiness",
      "total_business",
      "businessCount",
      "business_count",
    ]),
    workPayments: firstNumber(data, [
      "workPayments",
      "work_payments",
      "totalWorkPayments",
      "total_work_payments",
    ]),
    businessPayments: firstNumber(data, [
      "businessPayments",
      "business_payments",
      "totalBusinessPayments",
      "total_business_payments",
    ]),
    expenses: firstNumber(data, [
      "expenses",
      "monthlyExpenses",
      "monthly_expenses",
      "totalExpenses",
      "total_expenses",
    ]),
    borrow: firstNumber(data, [
      "borrow",
      "totalBorrow",
      "total_borrow",
      "borrowed",
    ]),
    loan: firstNumber(data, [
      "loan",
      "totalLoan",
      "total_loan",
      "lent",
    ]),
    savings: firstNumber(data, [
      "savings",
      "totalSavings",
      "total_savings",
    ]),
    otherIncome: firstNumber(data, [
      "otherIncome",
      "other_income",
      "otherIncomeTotal",
      "other_income_total",
    ]),
    profitLoss: firstNumber(data, [
      "profitLoss",
      "profit_loss",
      "profit",
      "netProfit",
      "net_profit",
    ]),
    upcomingRepayments:
      data.upcomingRepayments ||
      data.upcoming_repayments ||
      data.remainingRepayments ||
      data.remaining_repayments ||
      [],
  };

  if (!source.profitLoss) {
    source.profitLoss =
      source.workPayments +
      source.businessPayments +
      source.otherIncome -
      source.expenses;
  }

  return source;
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

const Card = ({ icon, title, value, subtitle, positive }) => (
  <div className="overview-card">
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
        )}`,
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

      setData(normalizeOverview(result));
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

  const totalIncome = useMemo(
    () =>
      data.workPayments +
      data.businessPayments +
      data.otherIncome,
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
          subtitle="Selected month"
        />
        <Card
          icon={<Landmark size={20} />}
          title="Total Business"
          value={data.totalBusiness}
          subtitle="Selected month"
        />
        <Card
          icon={<ArrowUpCircle size={20} />}
          title="Work Payments"
          value={money(data.workPayments)}
          subtitle="Received"
        />
        <Card
          icon={<IndianRupee size={20} />}
          title="Business Payments"
          value={money(data.businessPayments)}
          subtitle="Received"
        />
        <Card
          icon={<CreditCard size={20} />}
          title="Monthly Expenses"
          value={money(data.expenses)}
          subtitle="Total expenses"
        />
        <Card
          icon={<ArrowDownCircle size={20} />}
          title="Borrow"
          value={money(data.borrow)}
          subtitle="Borrowed amount"
        />
        <Card
          icon={<Wallet size={20} />}
          title="Loan"
          value={money(data.loan)}
          subtitle="Loan amount"
        />
        <Card
          icon={<Wallet size={20} />}
          title="Savings"
          value={money(data.savings)}
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
    </div>
  );
};

const styles = `
  .overview-page {
    width: 100%;
    min-height: 100%;
    padding: 18px;
    color: #fff;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .overview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .overview-heading {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .overview-heading h1 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 800;
  }

  .overview-header p {
    margin: 5px 0 0;
    color: rgba(255,255,255,.58);
    font-size: .78rem;
  }

  .overview-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .month-picker,
  .refresh-btn {
    height: 40px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.055);
    color: #fff;
    border-radius: 11px;
  }

  .month-picker {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 10px;
  }

  .month-picker input {
    color: #fff;
    background: transparent;
    border: 0;
    outline: 0;
    font-size: .78rem;
    font-weight: 600;
  }

  .refresh-btn {
    width: 40px;
    display: grid;
    place-items: center;
    cursor: pointer;
  }

  .refresh-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .overview-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    margin-bottom: 15px;
    border-radius: 10px;
    color: #fecaca;
    background: rgba(239,68,68,.1);
    border: 1px solid rgba(239,68,68,.2);
    font-size: .78rem;
    flex-wrap: wrap;
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .overview-card,
  .summary-panel,
  .repayment-panel {
    background: rgba(255,255,255,.045);
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 16px;
    box-shadow: 0 12px 30px rgba(0,0,0,.14);
  }

  .overview-card {
    padding: 15px;
  }

  .overview-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .overview-icon {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: rgba(124,58,237,.13);
    color: #c4b5fd;
  }

  .overview-title {
    margin-top: 13px;
    color: rgba(255,255,255,.6);
    font-size: .72rem;
    font-weight: 600;
  }

  .overview-value {
    margin-top: 5px;
    font-size: 1.12rem;
    font-weight: 800;
    word-break: break-word;
  }

  .overview-subtitle {
    margin-top: 4px;
    color: rgba(255,255,255,.38);
    font-size: .64rem;
  }

  .status-positive,
  .status-negative,
  .due-badge {
    padding: 4px 7px;
    border-radius: 7px;
    font-size: .58rem;
    font-weight: 700;
  }

  .status-positive {
    color: #6ee7b7;
    background: rgba(16,185,129,.1);
  }

  .status-negative {
    color: #fca5a5;
    background: rgba(239,68,68,.1);
  }

  .summary-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
  }

  .summary-panel,
  .repayment-panel {
    padding: 16px;
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 13px;
    font-size: .8rem;
    font-weight: 750;
    color: #ddd6fe;
  }

  .summary-line,
  .summary-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,.055);
    font-size: .73rem;
  }

  .summary-line span {
    color: rgba(255,255,255,.55);
  }

  .summary-total {
    border-bottom: 0;
    padding-bottom: 0;
    font-weight: 800;
  }

  .profit { color: #6ee7b7; }
  .loss { color: #fca5a5; }

  .repayment-panel {
    margin-top: 12px;
  }

  .repayment-table-wrap {
    overflow-x: auto;
  }

  .repayment-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 620px;
  }

  .repayment-table th {
    color: rgba(255,255,255,.42);
    font-size: .63rem;
    font-weight: 700;
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }

  .repayment-table td {
    padding: 10px 8px;
    font-size: .7rem;
    border-bottom: 1px solid rgba(255,255,255,.045);
  }

  .due-badge {
    color: #fcd34d;
    background: rgba(245,158,11,.1);
  }

  .empty-repayments {
    padding: 18px 5px 4px;
    text-align: center;
    color: rgba(255,255,255,.42);
    font-size: .72rem;
  }

  .overview-loading {
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    color: rgba(255,255,255,.65);
    font-size: .8rem;
  }

  .spin {
    animation: overview-spin 1s linear infinite;
  }

  @keyframes overview-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1000px) {
    .overview-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 680px) {
    .overview-page { padding: 10px; }
    .overview-header {
      align-items: flex-start;
      flex-direction: column;
    }
    .overview-actions { width: 100%; }
    .month-picker { flex: 1; }
    .month-picker input { width: 100%; }
    .overview-grid,
    .summary-row {
      grid-template-columns: 1fr;
    }
    .overview-card { padding: 13px; }
  }
`;

export default Overview;