import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  WalletCards,
  ReceiptText,
  Landmark,
  HandCoins,
  CheckCircle2,
  Clock3,
  IndianRupee,
} from "lucide-react";

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://express-project-learning-new.onrender.com";

const token = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

const currentMonth = () => new Date().toISOString().slice(0, 7);

const money = (value) => {
  const n = Number(value || 0);
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)}`;
};

const normalize = (result) =>
  result?.data || result?.summary || result || {};

const Summary = () => {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError("");

      const authToken = token();

      if (!authToken) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/summary?month=${encodeURIComponent(month)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to load summary."
        );
      }

      setData(normalize(result));
    } catch (err) {
      console.error("Summary GET error:", err);

      const message =
        err?.name === "TypeError" && /fetch/i.test(err?.message || "")
          ? "Unable to connect to the Summary API. Check that Express is running and the API URL is correct."
          : err.message || "Failed to load summary.";

      setError(message);
      setData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [month]);

  const values = useMemo(() => {
    const root = normalize(data);
    const totals = root?.totals || {};
    const payments = root?.payments || {};
    const expenses = root?.expenses || {};
    const loan = root?.loan || {};
    const borrow = root?.borrow || {};
    const businessWork = root?.business_work || root?.businessWork || {};
    const outstanding = root?.outstanding || {};

    const income = Number(
      totals.total_income ??
        totals.totalIncome ??
        payments.received ??
        root.total_income ??
        root.totalIncome ??
        root.income ??
        0
    );

    const expense = Number(
      totals.total_expense ??
        totals.totalExpense ??
        expenses.total ??
        expenses.amount ??
        root.total_expense ??
        root.totalExpense ??
        0
    );

    const emi = Number(
      totals.total_emi ??
        totals.totalEmi ??
        loan.emi ??
        loan.total_emi ??
        root.total_emi ??
        root.totalEmi ??
        0
    );

    const loanRepayment = Number(
      totals.total_loan_repayment ??
        loan.repayment ??
        root.total_loan_repayment ??
        0
    );

    const borrowRepayment = Number(
      totals.total_borrow_repayment ??
        borrow.repayment ??
        root.total_borrow_repayment ??
        0
    );

    const business = Number(
      businessWork.business_total ??
        root.business_total ??
        0
    );

    const work = Number(
      businessWork.work_total ??
        root.work_total ??
        0
    );

    const pending = Number(
      totals.total_pending ??
        payments.pending ??
        root.total_pending ??
        root.pending_total ??
        0
    );

    const outgoing = Number(
      totals.total_outgoing ??
        totals.totalOutflow ??
        root.total_outgoing ??
        root.total_outflow ??
        expense + emi + loanRepayment + borrowRepayment
    );

    const net = Number(
      totals.net ??
        root.net ??
        totals.net_profit_loss ??
        root.net_profit_loss ??
        income - outgoing
    );

    return {
      income: Number.isFinite(income) ? income : 0,
      expense: Number.isFinite(expense) ? expense : 0,
      emi: Number.isFinite(emi) ? emi : 0,
      loanRepayment: Number.isFinite(loanRepayment) ? loanRepayment : 0,
      borrowRepayment: Number.isFinite(borrowRepayment) ? borrowRepayment : 0,
      business: Number.isFinite(business) ? business : 0,
      work: Number.isFinite(work) ? work : 0,
      pending: Number.isFinite(pending) ? pending : 0,
      outgoing: Number.isFinite(outgoing) ? outgoing : 0,
      net: Number.isFinite(net) ? net : 0,

      receivedCount: Number(payments.received_count || 0),
      pendingCount: Number(payments.pending_count || 0),
      overdueCount: Number(payments.overdue_count || 0),
      lostCount: Number(payments.lost_count || 0),

      activeLoanTotal: Number(outstanding.active_loan_total || 0),
      activeBorrowTotal: Number(outstanding.active_borrow_total || 0),
      activeLoanCount: Number(outstanding.active_loan_count || 0),
      activeBorrowCount: Number(outstanding.active_borrow_count || 0),
      overdueLoanCount: Number(outstanding.overdue_loan_count || 0),
      overdueBorrowCount: Number(outstanding.overdue_borrow_count || 0),

      businessCount: Number(businessWork.business_count || 0),
      workCount: Number(businessWork.work_count || 0),
    };
  }, [data]);

  const monthLabel = useMemo(() => {
    const [year, m] = month.split("-").map(Number);
    return new Date(year, m - 1, 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  const pie = useMemo(() => {
    const parts = [
      ["Income", values.income, "#10b981"],
      ["Expenses", values.expense, "#ef4444"],
      ["EMI", values.emi, "#8b5cf6"],
      ["Loan Repayment", values.loanRepayment, "#22d3ee"],
      ["Borrow Repayment", values.borrowRepayment, "#f59e0b"],
      ["Business", values.business, "#ec4899"],
      ["Work", values.work, "#3b82f6"],
      ["Pending", values.pending, "#64748b"],
    ].filter((item) => item[1] > 0);

    const total = parts.reduce((sum, item) => sum + item[1], 0);
    let cursor = 0;

    const segments = parts.map(([label, value, color]) => {
      const start = total ? (cursor / total) * 100 : 0;
      cursor += value;
      const end = total ? (cursor / total) * 100 : 0;
      return { label, value, color, start, end };
    });

    return {
      total,
      gradient:
        total > 0
          ? `conic-gradient(${segments
              .map((s) => `${s.color} ${s.start}% ${s.end}%`)
              .join(", ")})`
          : "rgba(255,255,255,.08)",
      segments,
    };
  }, [values]);

  return (
    <div className="summary-page">
      <style>{styles}</style>

      <header className="summary-header">
        <div>
          <div className="summary-title">
            <WalletCards size={22} />
            <h1>Summary</h1>
          </div>
          <p>
            Complete monthly income, expense, EMI, loan and
            borrow summary for {monthLabel}.
          </p>
        </div>

        <div className="header-actions">
          <label className="month-picker">
            <CalendarDays size={17} />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>

          <button
            className="refresh-button"
            onClick={loadSummary}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      {error && (
        <div className="notice">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <RefreshCw className="spin" size={28} />
          Loading summary...
        </div>
      ) : (
        <>
          <section className="stats">
            <SummaryCard icon={<CheckCircle2 size={19} />} label="Income / Received" value={money(values.income)} tone="income" />
            <SummaryCard icon={<ReceiptText size={19} />} label="Expenses" value={money(values.expense)} tone="expense" />
            <SummaryCard icon={<Landmark size={19} />} label="EMI" value={money(values.emi)} tone="emi" />
            <SummaryCard icon={<HandCoins size={19} />} label="Loan Repayment" value={money(values.loanRepayment)} tone="loan" />
            <SummaryCard icon={<HandCoins size={19} />} label="Borrow Repayment" value={money(values.borrowRepayment)} tone="borrow" />
            <SummaryCard icon={<WalletCards size={19} />} label="Business" value={money(values.business)} tone="business" />
            <SummaryCard icon={<TrendingUp size={19} />} label="Work" value={money(values.work)} tone="work" />
            <SummaryCard icon={<Clock3 size={19} />} label="Pending" value={money(values.pending)} tone="pending" />
          </section>

          <section className="main-grid">
            <div className="chart-card">
              <div className="heading">
                <div>
                  <h2>Monthly Financial Overview</h2>
                  <p>
                    Professional view of all tracked monthly
                    amounts.
                  </p>
                </div>
              </div>

              <div className="chart-area">
                <div
                  className="pie"
                  style={{ background: pie.gradient }}
                >
                  <div className="pie-center">
                    <strong>{money(pie.total)}</strong>
                    <span>Total tracked</span>
                  </div>
                </div>

                <div className="legend">
                  {pie.segments.map((item) => (
                    <div key={item.label}>
                      <span>
                        <i
                          style={{
                            background: item.color,
                          }}
                        />
                        {item.label}
                      </span>
                      <strong>{money(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="result-card">
              <div className="result-icon">
                {values.net >= 0 ? (
                  <TrendingUp size={22} />
                ) : (
                  <TrendingDown size={22} />
                )}
              </div>

              <span>Net Profit / Loss</span>

              <strong
                className={
                  values.net >= 0 ? "profit" : "loss"
                }
              >
                {money(values.net)}
              </strong>

              <small>
                {values.net >= 0
                  ? "Positive monthly result"
                  : "Negative monthly result"}
              </small>

              <div className="breakdown">
                <div>
                  <span>Total Income</span>
                  <b>{money(values.income)}</b>
                </div>

                <div>
                  <span>Pending Payments</span>
                  <b>{money(values.pending)}</b>
                </div>

                <div>
                  <span>Total Outflow</span>
                  <b>{money(values.outgoing)}</b>
                </div>
              </div>
            </div>
          </section>

          <section className="breakdown-section">
            <div className="heading">
              <div>
                <h2>Monthly Breakdown</h2>
                <p>
                  All totals are for the selected month only.
                </p>
              </div>
            </div>

            <div className="breakdown-grid">
              <div>
                <span>Income / Payments Received</span>
                <strong className="green">
                  {money(values.income)}
                </strong>
              </div>

              <div>
                <span>Pending Payments</span>
                <strong className="green">
                  {money(values.other)}
                </strong>
              </div>

              <div>
                <span>Expenses</span>
                <strong className="red">
                  {money(values.expense)}
                </strong>
              </div>

              <div>
                <span>EMI / Loan Payments</span>
                <strong className="purple">
                  {money(values.emi)}
                </strong>
              </div>

              <div>
                <span>Borrow Repayment</span>
                <strong className="orange">
                  {money(values.borrow)}
                </strong>
              </div>

              <div>
                <span>Loan Repayment</span>
                <strong className="cyan">
                  {money(values.loan)}
                </strong>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <div className="detail-card">
              <div className="detail-heading">
                <div>
                  <h2>Payment Status</h2>
                  <p>Only selected-month payment records.</p>
                </div>
              </div>
              <div className="mini-grid">
                <MiniStat label="Received" value={values.receivedCount} tone="green" />
                <MiniStat label="Pending" value={values.pendingCount} tone="yellow" />
                <MiniStat label="Overdue" value={values.overdueCount} tone="orange" />
                <MiniStat label="Lost" value={values.lostCount} tone="red" />
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-heading">
                <div>
                  <h2>Business & Work</h2>
                  <p>Activity from personal_business_work.</p>
                </div>
              </div>
              <div className="mini-grid">
                <MiniStat label="Business" value={money(values.business)} tone="pink" />
                <MiniStat label="Work" value={money(values.work)} tone="blue" />
                <MiniStat label="Business Records" value={values.businessCount} tone="purple" />
                <MiniStat label="Work Records" value={values.workCount} tone="cyan" />
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-heading">
                <div>
                  <h2>Outstanding Position</h2>
                  <p>Current active loan and borrow position.</p>
                </div>
              </div>
              <div className="mini-grid">
                <MiniStat label="Active Loan" value={money(values.activeLoanTotal)} tone="purple" />
                <MiniStat label="Active Borrow" value={money(values.activeBorrowTotal)} tone="yellow" />
                <MiniStat label="Loan Records" value={values.activeLoanCount} tone="blue" />
                <MiniStat label="Borrow Records" value={values.activeBorrowCount} tone="orange" />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};



const MiniStat = ({ label, value, tone }) => (
  <div className={`mini-stat ${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const SummaryCard = ({ icon, label, value, tone }) => (
  <div className={`card ${tone}`}>
    <div>{icon}</div>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const styles = `
.summary-page {
  width:100%;
  min-height:100%;
  padding:18px;
  color:#fff;
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}

.summary-header,
.summary-title,
.header-actions,
.heading,
.chart-area {
  display:flex;
  align-items:center;
}

.summary-header {
  justify-content:space-between;
  gap:16px;
  margin-bottom:18px;
}

.summary-title {
  gap:9px;
}

.summary-title h1 {
  margin:0;
  font-size:1.35rem;
  font-weight:800;
}

.summary-header p,
.heading p {
  margin:5px 0 0;
  color:rgba(255,255,255,.5);
  font-size:.76rem;
  line-height:1.45;
}

.header-actions {
  gap:8px;
}

.month-picker,
.refresh-button {
  height:40px;
  border:1px solid rgba(255,255,255,.1);
  border-radius:11px;
  background:rgba(255,255,255,.05);
  color:#fff;
}

.month-picker {
  display:flex;
  align-items:center;
  gap:7px;
  padding:0 10px;
}

.month-picker input {
  width:125px;
  color:#fff;
  background:transparent;
  border:0;
  outline:0;
  font-size:.76rem;
}

.refresh-button {
  width:40px;
  display:grid;
  place-items:center;
  cursor:pointer;
}

.stats {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:12px;
  margin-bottom:12px;
}

.card,
.chart-card,
.result-card,
.breakdown-section {
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  border-radius:16px;
  box-shadow:0 12px 30px rgba(0,0,0,.14);
}

.card {
  padding:15px;
}

.card > div {
  width:35px;
  height:35px;
  display:grid;
  place-items:center;
  border-radius:10px;
}

.card.income > div {
  color:#6ee7b7;
  background:rgba(16,185,129,.1);
}

.card.expense > div {
  color:#fca5a5;
  background:rgba(239,68,68,.1);
}

.card.emi > div,
.card.loan > div {
  color:#c4b5fd;
  background:rgba(124,58,237,.1);
}

.card.borrow > div {
  color:#fcd34d;
  background:rgba(245,158,11,.1);
}

.card.pending > div {
  color:#67e8f9;
  background:rgba(34,211,238,.1);
}

.card span {
  display:block;
  margin-top:10px;
  color:rgba(255,255,255,.5);
  font-size:.69rem;
}

.card strong {
  display:block;
  margin-top:4px;
  font-size:1rem;
  overflow-wrap:anywhere;
}

.main-grid {
  display:grid;
  grid-template-columns:minmax(0,1.5fr) minmax(280px,.7fr);
  gap:12px;
  margin-bottom:12px;
}

.chart-card,
.result-card,
.breakdown-section {
  padding:16px;
}

.heading {
  justify-content:space-between;
}

.heading h2 {
  margin:0;
  font-size:.9rem;
  font-weight:800;
}

.chart-area {
  justify-content:center;
  gap:35px;
  min-height:245px;
}

.pie {
  width:185px;
  height:185px;
  flex:0 0 185px;
  display:grid;
  place-items:center;
  border-radius:50%;
  animation:chartIn .6s ease;
}

.pie-center {
  width:110px;
  height:110px;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-direction:column;
  border-radius:50%;
  background:#0f172a;
  text-align:center;
}

.pie-center strong {
  max-width:95px;
  font-size:.75rem;
  overflow-wrap:anywhere;
}

.pie-center span {
  margin-top:4px;
  color:rgba(255,255,255,.4);
  font-size:.57rem;
}

.legend {
  min-width:235px;
  display:grid;
  gap:9px;
}

.legend div {
  display:flex;
  align-items:center;
  gap:8px;
}

.legend span {
  flex:1;
  color:rgba(255,255,255,.55);
  font-size:.67rem;
}

.legend i {
  display:inline-block;
  width:8px;
  height:8px;
  margin-right:6px;
  border-radius:50%;
}

.legend strong {
  font-size:.67rem;
  white-space:nowrap;
}

.result-card {
  display:flex;
  align-items:flex-start;
  flex-direction:column;
}

.result-icon {
  width:42px;
  height:42px;
  display:grid;
  place-items:center;
  color:#67e8f9;
  background:rgba(34,211,238,.1);
  border-radius:12px;
}

.result-card > span {
  margin-top:15px;
  color:rgba(255,255,255,.5);
  font-size:.7rem;
}

.result-card > strong {
  margin-top:4px;
  font-size:1.35rem;
}

.result-card > strong.profit {
  color:#6ee7b7;
}

.result-card > strong.loss {
  color:#fca5a5;
}

.result-card > small {
  margin-top:5px;
  color:rgba(255,255,255,.4);
  font-size:.6rem;
}

.breakdown {
  width:100%;
  display:grid;
  gap:7px;
  margin-top:18px;
}

.breakdown div {
  display:flex;
  justify-content:space-between;
  gap:10px;
  padding:8px 0;
  border-bottom:1px solid rgba(255,255,255,.06);
}

.breakdown span {
  color:rgba(255,255,255,.4);
  font-size:.63rem;
}

.breakdown b {
  font-size:.66rem;
}

.breakdown-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:9px;
  margin-top:13px;
}

.breakdown-grid > div {
  padding:12px;
  border:1px solid rgba(255,255,255,.06);
  border-radius:11px;
  background:rgba(255,255,255,.025);
}

.breakdown-grid span {
  display:block;
  color:rgba(255,255,255,.4);
  font-size:.62rem;
  line-height:1.4;
}

.breakdown-grid strong {
  display:block;
  margin-top:6px;
  font-size:.76rem;
  overflow-wrap:anywhere;
}

.green { color:#6ee7b7; }
.red { color:#fca5a5; }
.purple { color:#c4b5fd; }
.orange { color:#fcd34d; }
.cyan { color:#67e8f9; }

.notice {
  display:flex;
  justify-content:space-between;
  gap:10px;
  padding:10px 12px;
  margin-bottom:12px;
  border-radius:11px;
  color:#fecaca;
  background:rgba(239,68,68,.09);
  border:1px solid rgba(239,68,68,.2);
  font-size:.76rem;
}

.notice button {
  border:0;
  background:transparent;
  color:inherit;
  cursor:pointer;
}

.loading {
  min-height:250px;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-direction:column;
  gap:9px;
  color:rgba(255,255,255,.45);
  font-size:.75rem;
}

.spin {
  animation:spin 1s linear infinite;
}

@keyframes spin {
  from { transform:rotate(0deg); }
  to { transform:rotate(360deg); }
}

@keyframes chartIn {
  from { opacity:0; transform:scale(.85) rotate(-12deg); }
  to { opacity:1; transform:scale(1) rotate(0); }
}

.detail-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:12px;
  margin-top:12px;
}
.detail-card {
  padding:16px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  border-radius:16px;
  box-shadow:0 12px 30px rgba(0,0,0,.14);
  transition:.22s ease;
}
.detail-card:hover {
  transform:translateY(-2px);
  border-color:rgba(139,92,246,.3);
}
.detail-heading h2 { margin:0; font-size:.9rem; font-weight:800; }
.detail-heading p { margin:5px 0 0; color:rgba(255,255,255,.43); font-size:.63rem; }
.mini-grid {
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;
  margin-top:13px;
}
.mini-stat {
  padding:10px;
  border:1px solid rgba(255,255,255,.06);
  border-radius:10px;
  background:rgba(255,255,255,.025);
}
.mini-stat span { display:block; color:rgba(255,255,255,.4); font-size:.56rem; }
.mini-stat strong { display:block; margin-top:4px; font-size:.72rem; overflow-wrap:anywhere; }
.mini-stat.green strong { color:#6ee7b7; }
.mini-stat.yellow strong { color:#fcd34d; }
.mini-stat.orange strong { color:#fb923c; }
.mini-stat.red strong { color:#fca5a5; }
.mini-stat.pink strong { color:#f9a8d4; }
.mini-stat.blue strong { color:#93c5fd; }
.mini-stat.purple strong { color:#c4b5fd; }
.mini-stat.cyan strong { color:#67e8f9; }
.card.business > div { color:#f9a8d4; background:rgba(236,72,153,.1); }
.card.work > div { color:#93c5fd; background:rgba(59,130,246,.1); }
.refresh-button:hover {
  border-color:rgba(139,92,246,.45);
  background:rgba(139,92,246,.12);
  transform:translateY(-1px);
}
.card, .chart-card, .result-card, .breakdown-section, .detail-card {
  transition:transform .22s ease, border-color .22s ease, box-shadow .22s ease;
}

@media (max-width:1050px) {
  .stats {
    grid-template-columns:repeat(2,minmax(0,1fr));
  }

  .main-grid {
    grid-template-columns:1fr;
  }
}

@media (max-width:1050px) {
  .detail-grid { grid-template-columns:1fr; }
}

@media (max-width:750px) {
  .summary-page {
    padding:10px;
  }

  .summary-header {
    align-items:flex-start;
    flex-direction:column;
  }

  .header-actions {
    width:100%;
  }

  .month-picker {
    flex:1;
  }

  .month-picker input {
    width:100%;
  }

  .chart-area {
    flex-direction:column;
    gap:20px;
    padding:10px 0;
  }

  .legend {
    width:100%;
    min-width:0;
  }

  .breakdown-grid {
    grid-template-columns:repeat(2,minmax(0,1fr));
  }

  .detail-grid {
    grid-template-columns:1fr;
  }
}

@media (max-width:520px) {
  .summary-page {
    padding:8px;
  }

  .summary-title h1 {
    font-size:1.15rem;
  }

  .stats {
    grid-template-columns:1fr;
  }

  .pie {
    width:165px;
    height:165px;
    flex-basis:165px;
  }

  .pie-center {
    width:100px;
    height:100px;
  }

  .breakdown-grid {
    grid-template-columns:1fr;
  }

  .mini-grid {
    grid-template-columns:1fr 1fr;
  }
}
`;

export default Summary;
