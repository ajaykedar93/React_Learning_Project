import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  WalletCards,
  Landmark,
  HandCoins,
  IndianRupee,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://express-project-learning-new.onrender.com";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => today().slice(0, 7);

const getWeekStart = (date) => {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getMonthWeeks = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(year, monthNumber - 1, 1);
  const last = new Date(year, monthNumber, 0);

  const weeks = [];
  let cursor = getWeekStart(first);

  while (cursor <= last) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + 6);

    const monthStart = new Date(year, monthNumber - 1, 1);
    const monthEnd = new Date(year, monthNumber, 0);

    const visibleStart =
      start < monthStart ? monthStart : start;
    const visibleEnd =
      end > monthEnd ? monthEnd : end;

    weeks.push({
      start: visibleStart.toISOString().slice(0, 10),
      end: visibleEnd.toISOString().slice(0, 10),
      label: `${formatDate(visibleStart)} – ${formatDate(visibleEnd)}`,
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
};

const sumAmount = (rows = []) =>
  rows.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

const normalizeRows = (result) => {
  const rows =
    result?.data ||
    result?.rows ||
    result ||
    [];

  return Array.isArray(rows) ? rows : [];
};

const Performance = () => {
  const [month, setMonth] = useState(currentMonth());
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headers = () => ({
    "Content-Type": "application/json",
    ...(getToken()
      ? { Authorization: `Bearer ${getToken()}` }
      : {}),
  });

  const loadPerformance = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/performance?month=${encodeURIComponent(month)}`,
        {
          method: "GET",
          headers: headers(),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to load performance."
        );
      }

      setPerformance(result.data || result || {});
    } catch (err) {
      console.error("Performance GET error:", err);
      setError(
        err.message || "Failed to load performance details."
      );
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, [month]);

  const monthLabel = useMemo(() => {
    const [year, m] = month.split("-").map(Number);

    return new Date(year, m - 1, 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  const weeks = useMemo(
    () => getMonthWeeks(month),
    [month]
  );

  const apiWeeks = useMemo(() => {
    if (!performance) return [];

    const candidates =
      performance.weeks ||
      performance.weekly ||
      performance.weekly_details ||
      performance.weeklyDetails;

    return Array.isArray(candidates) ? candidates : [];
  }, [performance]);

  const getWeekData = (week, index) => {
    const apiWeek =
      apiWeeks.find(
        (item) =>
          item.start_date === week.start ||
          item.start === week.start ||
          item.week_start === week.start
      ) || apiWeeks[index];

    const expenses =
      apiWeek?.expenses ||
      apiWeek?.expense_details ||
      [];

    const loans =
      apiWeek?.loans ||
      apiWeek?.loan_details ||
      [];

    const borrows =
      apiWeek?.borrows ||
      apiWeek?.borrow_details ||
      [];

    const payments =
      apiWeek?.payments ||
      apiWeek?.payment_details ||
      [];

    const received =
      apiWeek?.received_payments ||
      payments.filter(
        (item) =>
          String(item.status || "").toLowerCase() ===
          "received"
      );

    const pending =
      apiWeek?.pending_payments ||
      payments.filter(
        (item) =>
          String(item.status || "").toLowerCase() ===
          "pending"
      );

    const expenseTotal =
      apiWeek?.expense_total ??
      apiWeek?.total_expense ??
      sumAmount(expenses);

    const loanTotal =
      apiWeek?.loan_total ??
      apiWeek?.total_loan ??
      sumAmount(loans);

    const borrowTotal =
      apiWeek?.borrow_total ??
      apiWeek?.total_borrow ??
      sumAmount(borrows);

    const receivedTotal =
      apiWeek?.received_total ??
      apiWeek?.total_received ??
      sumAmount(received);

    const pendingTotal =
      apiWeek?.pending_total ??
      apiWeek?.total_pending ??
      sumAmount(pending);

    const income =
      apiWeek?.income ??
      apiWeek?.total_income ??
      receivedTotal;

    const outflow =
      apiWeek?.outflow ??
      expenseTotal +
        loanTotal +
        borrowTotal;

    const net =
      apiWeek?.net ??
      apiWeek?.net_profit_loss ??
      income - outflow;

    return {
      ...apiWeek,
      ...week,
      expenses,
      loans,
      borrows,
      payments,
      received,
      pending,
      expenseTotal: Number(expenseTotal || 0),
      loanTotal: Number(loanTotal || 0),
      borrowTotal: Number(borrowTotal || 0),
      receivedTotal: Number(receivedTotal || 0),
      pendingTotal: Number(pendingTotal || 0),
      income: Number(income || 0),
      outflow: Number(outflow || 0),
      net: Number(net || 0),
    };
  };

  const weeklyData = useMemo(
    () => weeks.map(getWeekData),
    [weeks, apiWeeks]
  );

  const totals = useMemo(
    () =>
      weeklyData.reduce(
        (acc, week) => {
          acc.expense += week.expenseTotal;
          acc.loan += week.loanTotal;
          acc.borrow += week.borrowTotal;
          acc.received += week.receivedTotal;
          acc.pending += week.pendingTotal;
          acc.income += week.income;
          acc.outflow += week.outflow;
          acc.net += week.net;
          return acc;
        },
        {
          expense: 0,
          loan: 0,
          borrow: 0,
          received: 0,
          pending: 0,
          income: 0,
          outflow: 0,
          net: 0,
        }
      ),
    [weeklyData]
  );

  const pieSegments = useMemo(() => {
    const data = [
      { label: "Expenses", value: totals.expense },
      { label: "Loans", value: totals.loan },
      { label: "Borrow", value: totals.borrow },
      { label: "Received", value: totals.received },
      { label: "Pending", value: totals.pending },
    ];

    const total = data.reduce(
      (sum, item) => sum + item.value,
      0
    );

    let current = 0;

    const segments = data.map((item) => {
      const start =
        total > 0 ? (current / total) * 360 : 0;

      current += item.value;

      const end =
        total > 0 ? (current / total) * 360 : 0;

      return {
        ...item,
        start,
        end,
        percentage:
          total > 0 ? (item.value / total) * 100 : 0,
      };
    });

    return { segments, total };
  }, [totals]);

  const conicGradient = useMemo(() => {
    const colors = [
      "#22d3ee",
      "#8b5cf6",
      "#f59e0b",
      "#10b981",
      "#ef4444",
    ];

    let cursor = 0;

    const parts = pieSegments.segments.map(
      (segment, index) => {
        const start = cursor;
        cursor += segment.percentage;
        return `${colors[index]} ${start}% ${cursor}%`;
      }
    );

    return parts.length
      ? `conic-gradient(${parts.join(", ")})`
      : "rgba(255,255,255,.08)";
  }, [pieSegments]);

  return (
    <div className="performance-page">
      <style>{styles}</style>

      <header className="performance-header">
        <div>
          <div className="performance-title">
            <TrendingUp size={22} />
            <h1>Performance</h1>
          </div>

          <p>
            Weekly financial performance and selected-month
            activity for {monthLabel}.
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
            onClick={loadPerformance}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      {error && (
        <div className="notice error">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-card">
          <RefreshCw className="spin" size={28} />
          <span>Loading performance...</span>
        </div>
      ) : (
        <>
          <section className="top-stats">
            <div className="stat-card">
              <div className="stat-icon income">
                <WalletCards size={19} />
              </div>
              <span>Total Income</span>
              <strong>{money(totals.income)}</strong>
            </div>

            <div className="stat-card">
              <div className="stat-icon expense">
                <TrendingDown size={19} />
              </div>
              <span>Total Expense</span>
              <strong>{money(totals.expense)}</strong>
            </div>

            <div className="stat-card">
              <div className="stat-icon received">
                <CheckCircle2 size={19} />
              </div>
              <span>Payment Received</span>
              <strong>{money(totals.received)}</strong>
            </div>

            <div className="stat-card">
              <div className="stat-icon pending">
                <Clock3 size={19} />
              </div>
              <span>Payment Pending</span>
              <strong>{money(totals.pending)}</strong>
            </div>
          </section>

          <section className="performance-grid">
            <div className="chart-card">
              <div className="card-heading">
                <div>
                  <h2>Monthly Performance</h2>
                  <p>
                    Combined weekly activity for{" "}
                    {monthLabel}.
                  </p>
                </div>
              </div>

              <div className="chart-layout">
                <div
                  className="pie-chart"
                  style={{
                    background: conicGradient,
                  }}
                >
                  <div className="pie-center">
                    <strong>
                      {money(pieSegments.total)}
                    </strong>
                    <span>Total Activity</span>
                  </div>
                </div>

                <div className="legend">
                  {pieSegments.segments.map(
                    (segment, index) => (
                      <div
                        className="legend-row"
                        key={segment.label}
                      >
                        <span
                          className="legend-dot"
                          style={{
                            background: [
                              "#22d3ee",
                              "#8b5cf6",
                              "#f59e0b",
                              "#10b981",
                              "#ef4444",
                            ][index],
                          }}
                        />

                        <span>{segment.label}</span>

                        <strong>
                          {money(segment.value)}
                        </strong>

                        <small>
                          {segment.percentage.toFixed(1)}%
                        </small>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="result-card">
              <div className="result-icon">
                {totals.net >= 0 ? (
                  <TrendingUp size={22} />
                ) : (
                  <TrendingDown size={22} />
                )}
              </div>

              <span>Monthly Net Result</span>

              <strong
                className={
                  totals.net >= 0 ? "profit" : "loss"
                }
              >
                {money(totals.net)}
              </strong>

              <p>
                {totals.net >= 0
                  ? "Positive performance after tracked outflows."
                  : "Negative performance based on tracked income and outflows."}
              </p>

              <div className="result-lines">
                <div>
                  <span>Income</span>
                  <strong>{money(totals.income)}</strong>
                </div>

                <div>
                  <span>Outflow</span>
                  <strong>{money(totals.outflow)}</strong>
                </div>

                <div>
                  <span>Loans</span>
                  <strong>{money(totals.loan)}</strong>
                </div>

                <div>
                  <span>Borrow</span>
                  <strong>{money(totals.borrow)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="weekly-section">
            <div className="section-heading">
              <div>
                <h2>Weekly Details</h2>
                <p>
                  Expenses, loans, borrow activity and payment
                  status week by week.
                </p>
              </div>
            </div>

            <div className="weekly-grid">
              {weeklyData.map((week, index) => (
                <article
                  className="week-card"
                  key={`${week.start}-${index}`}
                >
                  <div className="week-header">
                    <div>
                      <span>Week {index + 1}</span>
                      <h3>{week.label}</h3>
                    </div>

                    <div
                      className={`week-result ${
                        week.net >= 0
                          ? "positive"
                          : "negative"
                      }`}
                    >
                      {week.net >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {money(week.net)}
                    </div>
                  </div>

                  <div className="week-metrics">
                    <div>
                      <span>Expense</span>
                      <strong>
                        {money(week.expenseTotal)}
                      </strong>
                    </div>

                    <div>
                      <span>Loan</span>
                      <strong>
                        {money(week.loanTotal)}
                      </strong>
                    </div>

                    <div>
                      <span>Borrow</span>
                      <strong>
                        {money(week.borrowTotal)}
                      </strong>
                    </div>

                    <div>
                      <span>Received</span>
                      <strong>
                        {money(week.receivedTotal)}
                      </strong>
                    </div>

                    <div>
                      <span>Pending</span>
                      <strong>
                        {money(week.pendingTotal)}
                      </strong>
                    </div>

                    <div>
                      <span>Outflow</span>
                      <strong>
                        {money(week.outflow)}
                      </strong>
                    </div>
                  </div>

                  <div className="week-status">
                    {week.pendingTotal > 0 ? (
                      <span className="pending-status">
                        <Clock3 size={13} />
                        Pending payments exist
                      </span>
                    ) : (
                      <span className="received-status">
                        <CheckCircle2 size={13} />
                        No pending payment amount
                      </span>
                    )}

                    {week.loanTotal > 0 && (
                      <span className="loan-status">
                        <Landmark size={13} />
                        Loan activity
                      </span>
                    )}

                    {week.borrowTotal > 0 && (
                      <span className="borrow-status">
                        <HandCoins size={13} />
                        Borrow activity
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="monthly-total">
            <div className="monthly-total-icon">
              <IndianRupee size={21} />
            </div>

            <div>
              <span>Selected Month Total</span>
              <strong>{money(totals.income)}</strong>
            </div>

            <div className="monthly-total-item">
              <span>Expenses</span>
              <strong>{money(totals.expense)}</strong>
            </div>

            <div className="monthly-total-item">
              <span>Loans + Borrow</span>
              <strong>
                {money(totals.loan + totals.borrow)}
              </strong>
            </div>

            <div className="monthly-total-item">
              <span>Received / Pending</span>
              <strong>
                {money(totals.received)} /{" "}
                {money(totals.pending)}
              </strong>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const styles = `
.performance-page {
  width: 100%;
  min-height: 100%;
  padding: 18px;
  color: #fff;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.performance-header,
.performance-title,
.header-actions,
.card-heading,
.chart-layout,
.legend-row,
.result-lines div,
.week-header,
.week-result,
.week-status,
.monthly-total {
  display: flex;
  align-items: center;
}

.performance-header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.performance-title {
  gap: 9px;
}

.performance-title h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
}

.performance-header p,
.card-heading p,
.section-heading p,
.result-card p {
  margin: 5px 0 0;
  color: rgba(255,255,255,.5);
  font-size: .76rem;
  line-height: 1.45;
}

.header-actions {
  gap: 8px;
}

.month-picker,
.refresh-button {
  height: 40px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 11px;
  background: rgba(255,255,255,.05);
  color: #fff;
}

.month-picker {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
}

.month-picker input {
  width: 125px;
  color: #fff;
  background: transparent;
  border: 0;
  outline: 0;
  font-size: .76rem;
  font-weight: 650;
}

.refresh-button {
  width: 40px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.refresh-button:hover {
  transform: translateY(-1px);
  border-color: rgba(103,232,249,.35);
}

.notice {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 11px;
  color: #fecaca;
  background: rgba(239,68,68,.09);
  border: 1px solid rgba(239,68,68,.2);
  font-size: .76rem;
}

.notice button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.loading-card {
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  color: rgba(255,255,255,.45);
  font-size: .75rem;
}

.top-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card,
.chart-card,
.result-card,
.week-card,
.monthly-total {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0,0,0,.14);
}

.stat-card {
  padding: 15px;
}

.stat-icon {
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  border-radius: 10px;
}

.stat-icon.income {
  color: #67e8f9;
  background: rgba(34,211,238,.1);
}

.stat-icon.expense {
  color: #fca5a5;
  background: rgba(239,68,68,.1);
}

.stat-icon.received {
  color: #6ee7b7;
  background: rgba(16,185,129,.1);
}

.stat-icon.pending {
  color: #fcd34d;
  background: rgba(245,158,11,.1);
}

.stat-card span {
  display: block;
  margin-top: 10px;
  color: rgba(255,255,255,.5);
  font-size: .69rem;
}

.stat-card strong {
  display: block;
  margin-top: 4px;
  font-size: 1rem;
  overflow-wrap: anywhere;
}

.performance-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, .75fr);
  gap: 12px;
  margin-bottom: 12px;
}

.chart-card,
.result-card {
  padding: 16px;
}

.card-heading h2,
.section-heading h2 {
  margin: 0;
  font-size: .9rem;
  font-weight: 800;
}

.chart-layout {
  justify-content: center;
  gap: 35px;
  min-height: 250px;
}

.pie-chart {
  width: 190px;
  height: 190px;
  flex: 0 0 190px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  box-shadow: 0 0 0 8px rgba(255,255,255,.025);
  animation: chart-in .7s ease;
}

.pie-center {
  width: 112px;
  height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 50%;
  background: #0f172a;
  text-align: center;
}

.pie-center strong {
  max-width: 95px;
  font-size: .78rem;
  overflow-wrap: anywhere;
}

.pie-center span {
  margin-top: 4px;
  color: rgba(255,255,255,.42);
  font-size: .57rem;
}

.legend {
  min-width: 240px;
  display: grid;
  gap: 10px;
}

.legend-row {
  gap: 7px;
  min-width: 0;
}

.legend-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
}

.legend-row > span:not(.legend-dot) {
  flex: 1;
  color: rgba(255,255,255,.58);
  font-size: .67rem;
}

.legend-row strong {
  font-size: .68rem;
  white-space: nowrap;
}

.legend-row small {
  width: 42px;
  color: rgba(255,255,255,.35);
  font-size: .57rem;
  text-align: right;
}

.result-card {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
}

.result-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: #67e8f9;
  background: rgba(34,211,238,.1);
  border-radius: 12px;
}

.result-card > span {
  margin-top: 15px;
  color: rgba(255,255,255,.5);
  font-size: .7rem;
}

.result-card > strong {
  margin-top: 4px;
  font-size: 1.35rem;
}

.result-card > strong.profit {
  color: #6ee7b7;
}

.result-card > strong.loss {
  color: #fca5a5;
}

.result-lines {
  width: 100%;
  display: grid;
  gap: 7px;
  margin-top: 18px;
}

.result-lines div {
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.result-lines span {
  color: rgba(255,255,255,.43);
  font-size: .64rem;
}

.result-lines strong {
  font-size: .67rem;
}

.weekly-section {
  margin-bottom: 12px;
}

.section-heading {
  margin-bottom: 12px;
}

.weekly-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.week-card {
  padding: 14px;
  transition: .2s ease;
}

.week-card:hover {
  transform: translateY(-2px);
  border-color: rgba(103,232,249,.24);
}

.week-header {
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.week-header span {
  color: #67e8f9;
  font-size: .58rem;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.week-header h3 {
  margin: 3px 0 0;
  font-size: .76rem;
  font-weight: 700;
}

.week-result {
  gap: 4px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: .62rem;
  font-weight: 750;
  white-space: nowrap;
}

.week-result.positive {
  color: #6ee7b7;
  background: rgba(16,185,129,.08);
}

.week-result.negative {
  color: #fca5a5;
  background: rgba(239,68,68,.08);
}

.week-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  padding: 12px 0;
}

.week-metrics div {
  min-width: 0;
  padding: 8px;
  border-radius: 9px;
  background: rgba(255,255,255,.025);
}

.week-metrics span {
  display: block;
  color: rgba(255,255,255,.38);
  font-size: .57rem;
}

.week-metrics strong {
  display: block;
  margin-top: 4px;
  font-size: .65rem;
  overflow-wrap: anywhere;
}

.week-status {
  flex-wrap: wrap;
  gap: 6px;
}

.week-status span {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 7px;
  border-radius: 7px;
  font-size: .56rem;
}

.pending-status {
  color: #fcd34d;
  background: rgba(245,158,11,.08);
}

.received-status {
  color: #6ee7b7;
  background: rgba(16,185,129,.08);
}

.loan-status {
  color: #c4b5fd;
  background: rgba(124,58,237,.08);
}

.borrow-status {
  color: #67e8f9;
  background: rgba(34,211,238,.08);
}

.monthly-total {
  flex-wrap: wrap;
  gap: 14px;
  padding: 14px 16px;
}

.monthly-total-icon {
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  color: #67e8f9;
  background: rgba(34,211,238,.1);
  border-radius: 11px;
}

.monthly-total > div:not(.monthly-total-icon) {
  min-width: 120px;
}

.monthly-total > div:nth-child(2) {
  flex: 1;
}

.monthly-total span {
  display: block;
  color: rgba(255,255,255,.4);
  font-size: .6rem;
}

.monthly-total strong {
  display: block;
  margin-top: 3px;
  font-size: .76rem;
}

.monthly-total-item {
  padding-left: 14px;
  border-left: 1px solid rgba(255,255,255,.08);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes chart-in {
  from {
    opacity: 0;
    transform: scale(.85) rotate(-15deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

@media (max-width: 1050px) {
  .top-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .performance-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 800px) {
  .performance-page {
    padding: 10px;
  }

  .performance-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .month-picker {
    flex: 1;
  }

  .month-picker input {
    width: 100%;
  }

  .chart-layout {
    flex-direction: column;
    gap: 20px;
    padding: 10px 0;
  }

  .legend {
    width: 100%;
    min-width: 0;
  }

  .weekly-grid {
    grid-template-columns: 1fr;
  }

  .monthly-total {
    align-items: flex-start;
  }

  .monthly-total-item {
    flex: 1;
  }
}

@media (max-width: 560px) {
  .performance-page {
    padding: 8px;
  }

  .performance-title h1 {
    font-size: 1.15rem;
  }

  .top-stats {
    grid-template-columns: 1fr;
  }

  .pie-chart {
    width: 165px;
    height: 165px;
    flex-basis: 165px;
  }

  .pie-center {
    width: 100px;
    height: 100px;
  }

  .week-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .monthly-total {
    display: grid;
    grid-template-columns: auto 1fr;
  }

  .monthly-total-item {
    padding: 0;
    border-left: 0;
  }
}
`;

export default Performance;
