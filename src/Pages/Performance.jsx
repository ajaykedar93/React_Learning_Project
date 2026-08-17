import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  WalletCards,
  Landmark,
  HandCoins,
  CheckCircle2,
  Clock3,
  AlertCircle,
  IndianRupee,
  Activity,
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

const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => today().slice(0, 7);

/* Amount display:
   2000      -> ₹2,000
   2000.70   -> ₹2,000.70
   No unnecessary .00 is shown.
*/
const money = (value) => {
  const number = Number(value || 0);
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(number)}`;
};

const numberValue = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};

const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const monthLabelFromValue = (value) => {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const getMonthWeeks = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  const ranges = [
    [1, 7],
    [8, 14],
    [15, 21],
    [22, 28],
    [29, lastDay],
  ];

  return ranges
    .filter(([start]) => start <= lastDay)
    .map(([start, end], index) => ({
      week: index + 1,
      start: `${month}-${String(start).padStart(2, "0")}`,
      end: `${month}-${String(end).padStart(2, "0")}`,
      label: `${formatDate(`${month}-${String(start).padStart(2, "0")}`)} – ${formatDate(
        `${month}-${String(end).padStart(2, "0")}`
      )}`,
    }));
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const getField = (object, keys, fallback = 0) => {
  for (const key of keys) {
    if (
      object &&
      object[key] !== undefined &&
      object[key] !== null
    ) {
      return object[key];
    }
  }
  return fallback;
};

const Performance = () => {
  const [month, setMonth] = useState(currentMonth());
  const [performance, setPerformance] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [pieData, setPieData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const headers = () => {
    const token = getToken();

    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    };
  };

  const apiGet = async (url) => {
    const response = await fetch(url, {
      method: "GET",
      headers: headers(),
    });

    let result = {};
    try {
      result = await response.json();
    } catch {
      throw new Error("Server returned an invalid response.");
    }

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message ||
          `Request failed with status ${response.status}`
      );
    }

    return result;
  };

  const loadAll = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      setError("");

      const encodedMonth = encodeURIComponent(month);
      const year = month.slice(0, 4);

      const [main, monthly, pie] = await Promise.all([
        apiGet(
          `${API_BASE_URL}/api/performance?month=${encodedMonth}`
        ),
        apiGet(
          `${API_BASE_URL}/api/performance/monthly?year=${encodeURIComponent(
            year
          )}`
        ),
        apiGet(
          `${API_BASE_URL}/api/performance/pie?month=${encodedMonth}`
        ),
      ]);

      setPerformance(main?.data || main || {});
      setMonthlyData(monthly?.data || monthly || {});
      setPieData(pie?.data || pie || {});
    } catch (err) {
      console.error("Performance GET error:", err);
      setError(
        err?.message ||
          "Unable to load performance details."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll(true);
  }, [month]);

  const monthLabel = useMemo(
    () => monthLabelFromValue(month),
    [month]
  );

  const apiWeeks = useMemo(() => {
    return safeArray(
      performance?.weekly ||
        performance?.weeks ||
        performance?.weekly_details
    );
  }, [performance]);

  const weeklyData = useMemo(() => {
    if (!apiWeeks.length) return [];

    const monthWeeks = getMonthWeeks(month);

    return monthWeeks.map((range) => {
      const item =
        apiWeeks.find(
          (row) =>
            Number(row.week) === range.week ||
            row.start_date === range.start ||
            row.start === range.start ||
            row.week_start === range.start
        ) || null;

      if (!item) return null;

      const expenseDetails = safeArray(
        getField(item, [
          "expenses",
          "expense_details",
          "expenseDetails",
        ], [])
      );

      const loanDetails = safeArray(
        getField(item, [
          "loans",
          "loan_details",
          "loanDetails",
        ], [])
      );

      const borrowDetails = safeArray(
        getField(item, [
          "borrows",
          "borrow_details",
          "borrowDetails",
        ], [])
      );

      const payments = safeArray(
        getField(item, [
          "payments",
          "payment_details",
          "paymentDetails",
        ], [])
      );

      const receivedDetails = safeArray(
        getField(
          item,
          ["received_payments", "receivedPayments"],
          payments.filter(
            (p) =>
              String(p.status || "").toLowerCase() ===
              "received"
          )
        )
      );

      const pendingDetails = safeArray(
        getField(
          item,
          ["pending_payments", "pendingPayments"],
          payments.filter(
            (p) =>
              String(p.status || "").toLowerCase() ===
              "pending"
          )
        )
      );

      const expenseTotal = numberValue(
        getField(item, [
          "expense_total",
          "total_expense",
          "expenses",
        ], 0)
      );

      const loanTotal = numberValue(
        getField(item, [
          "loan_total",
          "total_loan",
          "loans",
        ], 0)
      );

      const borrowTotal = numberValue(
        getField(item, [
          "borrow_total",
          "total_borrow",
          "borrow",
        ], 0)
      );

      const receivedTotal = numberValue(
        getField(item, [
          "received_total",
          "total_received",
          "received_payment",
        ], 0)
      );

      const pendingTotal = numberValue(
        getField(item, [
          "pending_total",
          "total_pending",
          "pending_payment",
        ], 0)
      );

      const income = numberValue(
        getField(item, [
          "income",
          "total_income",
        ], receivedTotal)
      );

      const outflow = numberValue(
        getField(item, [
          "outflow",
          "total_outgoing",
        ], expenseTotal + loanTotal + borrowTotal)
      );

      const net = numberValue(
        getField(item, [
          "net",
          "net_profit_loss",
        ], income - outflow)
      );

      const status =
        item.status ||
        (income === 0 && outflow === 0
          ? "No Activity"
          : net > 0
          ? "Profit"
          : net < 0
          ? "Loss"
          : "Break Even");

      const hasActivity =
        income !== 0 ||
        outflow !== 0 ||
        expenseTotal !== 0 ||
        loanTotal !== 0 ||
        borrowTotal !== 0 ||
        receivedTotal !== 0 ||
        pendingTotal !== 0 ||
        payments.length > 0 ||
        expenseDetails.length > 0 ||
        loanDetails.length > 0 ||
        borrowDetails.length > 0 ||
        receivedDetails.length > 0 ||
        pendingDetails.length > 0 ||
        String(status).toLowerCase() !== "no activity";

      return hasActivity
        ? {
        ...range,
        ...item,
        expenseDetails,
        loanDetails,
        borrowDetails,
        payments,
        receivedDetails,
        pendingDetails,
        expenseTotal,
        loanTotal,
        borrowTotal,
        receivedTotal,
        pendingTotal,
        income,
        outflow,
        net,
        status,
      }
        : null;
    }).filter(Boolean);
  }, [month, apiWeeks]);

  const totals = useMemo(() => {
    const apiTotals = performance?.totals;

    if (apiTotals) {
      return {
        income: numberValue(
          getField(apiTotals, [
            "total_income",
            "income",
          ])
        ),
        expense: numberValue(
          getField(apiTotals, [
            "expenses",
            "expense",
          ])
        ),
        loan: numberValue(
          getField(apiTotals, [
            "total_loans",
            "loans",
            "loan",
          ])
        ),
        borrow: numberValue(
          getField(apiTotals, [
            "borrow_repayment",
            "borrow",
          ])
        ),
        received: numberValue(
          getField(apiTotals, [
            "received_payment",
            "received",
          ])
        ),
        pending: numberValue(
          getField(apiTotals, [
            "pending_payment",
            "pending",
          ])
        ),
        overdue: numberValue(
          getField(apiTotals, ["overdue_payment", "overdue"])
        ),
        lost: numberValue(
          getField(apiTotals, ["lost_payment", "lost"])
        ),
        outflow: numberValue(
          getField(apiTotals, [
            "total_outgoing",
            "outflow",
          ])
        ),
        net: numberValue(apiTotals.net),
        status: apiTotals.status || "No Activity",
      };
    }

    const result = weeklyData.reduce(
      (acc, row) => {
        acc.income += row.income;
        acc.expense += row.expenseTotal;
        acc.loan += row.loanTotal;
        acc.borrow += row.borrowTotal;
        acc.received += row.receivedTotal;
        acc.pending += row.pendingTotal;
        acc.outflow += row.outflow;
        acc.net += row.net;
        return acc;
      },
      {
        income: 0,
        expense: 0,
        loan: 0,
        borrow: 0,
        received: 0,
        pending: 0,
        overdue: 0,
        lost: 0,
        outflow: 0,
        net: 0,
      }
    );

    result.status =
      result.income === 0 && result.outflow === 0
        ? "No Activity"
        : result.net > 0
        ? "Profit"
        : result.net < 0
        ? "Loss"
        : "Break Even";

    return result;
  }, [performance, weeklyData]);

  const pieSegments = useMemo(() => {
    const apiPie = safeArray(
      pieData?.pie ||
        pieData?.data ||
        pieData?.chart
    );

    const fallback = [
      { label: "Expenses", value: totals.expense },
      { label: "Loans", value: totals.loan },
      { label: "Borrow", value: totals.borrow },
      { label: "Received", value: totals.received },
      { label: "Pending", value: totals.pending },
    ];

    const source =
      apiPie.length >= 5
        ? apiPie.slice(0, 5).map((item) => ({
            label: item.label,
            value: numberValue(
              item.value ?? item.amount
            ),
          }))
        : fallback;

    const total = source.reduce(
      (sum, item) => sum + item.value,
      0
    );

    let cursor = 0;

    const colors = [
      "#8b5cf6",
      "#06b6d4",
      "#f59e0b",
      "#10b981",
      "#ef4444",
    ];

    const segments = source.map((item, index) => {
      const percentage =
        total > 0 ? (item.value / total) * 100 : 0;

      const start = cursor;
      cursor += percentage;

      return {
        ...item,
        percentage,
        start,
        end: cursor,
        color: colors[index],
      };
    });

    return {
      total,
      segments,
      gradient:
        total > 0
          ? `conic-gradient(${segments
              .map(
                (item) =>
                  `${item.color} ${item.start}% ${item.end}%`
              )
              .join(", ")})`
          : "rgba(255,255,255,.08)",
    };
  }, [pieData, totals]);

  const yearlyMonths = useMemo(() => {
    const rows = safeArray(
      monthlyData?.months ||
        monthlyData?.monthly ||
        monthlyData?.data
    );

    return rows.filter((row) => {
      const loans =
        numberValue(row.loans) ||
        numberValue(row.loan_emi) +
          numberValue(row.loan_repayment);

      const hasAmount =
        numberValue(row.income) !== 0 ||
        numberValue(row.expenses) !== 0 ||
        loans !== 0 ||
        numberValue(row.borrow_repayment) !== 0 ||
        numberValue(row.net) !== 0;

      const hasDetails =
        safeArray(row.details).length > 0 ||
        safeArray(row.transactions).length > 0 ||
        safeArray(row.expenses_details).length > 0 ||
        safeArray(row.loan_details).length > 0 ||
        safeArray(row.borrow_details).length > 0;

      return (
        hasAmount ||
        hasDetails ||
        String(row.status || "").toLowerCase() !== "no activity"
      );
    });
  }, [monthlyData]);

  const yearlyTotal = useMemo(() => {
    const apiTotals = monthlyData?.totals;

    if (apiTotals) {
      return {
        income: numberValue(
          apiTotals.income
        ),
        expenses: numberValue(
          apiTotals.expenses
        ),
        loans: numberValue(
          apiTotals.loans ??
            apiTotals.loan_emi +
              apiTotals.loan_repayment
        ),
        borrow: numberValue(
          apiTotals.borrow_repayment
        ),
        net: numberValue(apiTotals.net),
      };
    }

    return yearlyMonths.reduce(
      (acc, row) => {
        acc.income += numberValue(row.income);
        acc.expenses += numberValue(row.expenses);
        acc.loans += numberValue(
          row.loans ??
            numberValue(row.loan_emi) +
              numberValue(row.loan_repayment)
        );
        acc.borrow += numberValue(
          row.borrow_repayment
        );
        acc.net += numberValue(row.net);
        return acc;
      },
      {
        income: 0,
        expenses: 0,
        loans: 0,
        borrow: 0,
        net: 0,
      }
    );
  }, [monthlyData, yearlyMonths]);

  const hasYearlyActivity =
    yearlyMonths.length > 0 ||
    yearlyTotal.income !== 0 ||
    yearlyTotal.expenses !== 0 ||
    yearlyTotal.loans !== 0 ||
    yearlyTotal.borrow !== 0 ||
    yearlyTotal.net !== 0;

  const hasWeeklyActivity = weeklyData.length > 0;

  const renderStatus = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "profit") {
      return (
        <span className="status profit">
          <TrendingUp size={13} />
          Profit
        </span>
      );
    }

    if (value === "loss") {
      return (
        <span className="status loss">
          <TrendingDown size={13} />
          Loss
        </span>
      );
    }

    if (value === "break even") {
      return (
        <span className="status neutral">
          <Activity size={13} />
          Break Even
        </span>
      );
    }

    return (
      <span className="status neutral">
        <Activity size={13} />
        No Activity
      </span>
    );
  };

  return (
    <main className="performance-page">
      <style>{styles}</style>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Activity size={15} />
            Financial Dashboard
          </div>

          <div className="title-row">
            <div className="title-icon">
              <TrendingUp size={24} />
            </div>

            <div>
              <h1>Performance</h1>
              <p>
                Weekly financial performance and selected-month
                activity for <strong>{monthLabel}</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="controls">
          <label className="month-control">
            <CalendarDays size={17} />
            <input
              type="month"
              value={month}
              onChange={(e) =>
                e.target.value && setMonth(e.target.value)
              }
            />
          </label>

          <button
            className="refresh-btn"
            onClick={() => loadAll(false)}
            disabled={refreshing}
            title="Refresh performance"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "spin" : ""}
            />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="error-box">
          <div>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>

          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <RefreshCw size={30} className="spin" />
          <strong>Loading performance...</strong>
          <span>Getting selected-month financial details.</span>
        </div>
      ) : (
        <>
          <section className="summary-grid">
            <SummaryCard
              icon={<WalletCards />}
              label="Total Income"
              value={money(totals.income)}
              tone="income"
            />

            <SummaryCard
              icon={<TrendingDown />}
              label="Expenses"
              value={money(totals.expense)}
              tone="expense"
            />

            <SummaryCard
              icon={<Landmark />}
              label="Loans"
              value={money(totals.loan)}
              tone="loan"
            />

            <SummaryCard
              icon={<HandCoins />}
              label="Borrow"
              value={money(totals.borrow)}
              tone="borrow"
            />

            <SummaryCard
              icon={<CheckCircle2 />}
              label="Received"
              value={money(totals.received)}
              tone="received"
            />

            <SummaryCard
              icon={<Clock3 />}
              label="Pending"
              value={money(totals.pending)}
              tone="pending"
            />
          </section>

          <section className="main-grid">
            <article className="panel pie-panel">
              <PanelHeader
                title="Monthly Performance"
                subtitle={`Combined weekly activity for ${monthLabel}.`}
              />

              <div className="pie-layout">
                <div
                  className="pie"
                  style={{
                    background: pieSegments.gradient,
                  }}
                >
                  <div className="pie-hole">
                    <strong>
                      {money(pieSegments.total)}
                    </strong>
                    <span>Total Activity</span>
                  </div>
                </div>

                <div className="legend">
                  {pieSegments.segments.map((item) => (
                    <div className="legend-item" key={item.label}>
                      <span
                        className="dot"
                        style={{ background: item.color }}
                      />

                      <div className="legend-name">
                        <strong>{item.label}</strong>
                        <span>
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>

                      <b>{money(item.value)}</b>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="panel result-panel">
              <PanelHeader
                title="Selected Month Result"
                subtitle="Income minus tracked outflows."
              />

              <div className="result-main">
                <div
                  className={`result-icon ${
                    totals.net >= 0 ? "positive" : "negative"
                  }`}
                >
                  {totals.net >= 0 ? (
                    <TrendingUp size={23} />
                  ) : (
                    <TrendingDown size={23} />
                  )}
                </div>

                <span>Net Result</span>

                <strong
                  className={
                    totals.net >= 0 ? "positive-text" : "negative-text"
                  }
                >
                  {money(totals.net)}
                </strong>

                {renderStatus(totals.status)}
              </div>

              <div className="result-list">
                <ResultRow
                  label="Income"
                  value={money(totals.income)}
                />
                <ResultRow
                  label="Outflow"
                  value={money(totals.outflow)}
                />
                <ResultRow
                  label="Expenses"
                  value={money(totals.expense)}
                />
                <ResultRow
                  label="Loans"
                  value={money(totals.loan)}
                />
                <ResultRow
                  label="Borrow"
                  value={money(totals.borrow)}
                />
                <ResultRow
                  label="Pending"
                  value={money(totals.pending)}
                />
              </div>
            </article>
          </section>

          {hasWeeklyActivity && (
          <section className="section-block">
            <div className="section-heading">
              <div>
                <div className="section-kicker">
                  WEEKLY BREAKDOWN
                </div>
                <h2>Weekly Financial Activity</h2>
                <p>
                  Complete selected-month activity grouped into
                  weeks 1–7, 8–14, 15–21, 22–28 and 29–month end.
                </p>
              </div>

              <div className="section-badge">
                {weeklyData.length} weeks
              </div>
            </div>

            <div className="week-grid">
              {weeklyData.map((week) => (
                <article className="week-card" key={week.week}>
                  <div className="week-top">
                    <div>
                      <span className="week-number">
                        WEEK {week.week}
                      </span>
                      <h3>
                        {formatDate(week.start)} –{" "}
                        {formatDate(week.end)}
                      </h3>
                    </div>

                    <div
                      className={`net-pill ${
                        week.net >= 0 ? "up" : "down"
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

                  <div className="week-stats">
                    <MiniMetric
                      label="Expenses"
                      value={money(week.expenseTotal)}
                    />
                    <MiniMetric
                      label="Loans"
                      value={money(week.loanTotal)}
                    />
                    <MiniMetric
                      label="Borrow"
                      value={money(week.borrowTotal)}
                    />
                    <MiniMetric
                      label="Received"
                      value={money(week.receivedTotal)}
                    />
                    <MiniMetric
                      label="Pending"
                      value={money(week.pendingTotal)}
                    />
                    <MiniMetric
                      label="Outflow"
                      value={money(week.outflow)}
                    />
                  </div>

                  <div className="week-footer">
                    {week.pendingTotal > 0 ? (
                      <span className="tag pending-tag">
                        <Clock3 size={13} />
                        Pending
                      </span>
                    ) : (
                      <span className="tag received-tag">
                        <CheckCircle2 size={13} />
                        No Pending
                      </span>
                    )}

                    {week.loanTotal > 0 && (
                      <span className="tag loan-tag">
                        <Landmark size={13} />
                        Loan Activity
                      </span>
                    )}

                    {week.borrowTotal > 0 && (
                      <span className="tag borrow-tag">
                        <HandCoins size={13} />
                        Borrow Activity
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
          )}

          {hasYearlyActivity && (
          <section className="section-block">
            <div className="section-heading">
              <div>
                <div className="section-kicker">
                  {month.slice(0, 4)} OVERVIEW
                </div>
                <h2>Yearly Monthly Performance</h2>
                <p>
                  Monthly financial activity for the selected year.
                </p>
              </div>
            </div>

            <div className="year-summary">
              <YearMetric
                label="Income"
                value={money(yearlyTotal.income)}
                tone="income"
              />
              <YearMetric
                label="Expenses"
                value={money(yearlyTotal.expenses)}
                tone="expense"
              />
              <YearMetric
                label="Loans"
                value={money(yearlyTotal.loans)}
                tone="loan"
              />
              <YearMetric
                label="Borrow"
                value={money(yearlyTotal.borrow)}
                tone="borrow"
              />
              <YearMetric
                label="Net"
                value={money(yearlyTotal.net)}
                tone={
                  yearlyTotal.net >= 0
                    ? "received"
                    : "expense"
                }
              />
            </div>

            <div className="monthly-table-wrap">
              <div className="monthly-table">
                <div className="table-row table-head">
                  <span>Month</span>
                  <span>Income</span>
                  <span>Expenses</span>
                  <span>Loans</span>
                  <span>Borrow</span>
                  <span>Net</span>
                  <span>Status</span>
                </div>

                {yearlyMonths.map((row, index) => {
                  const loans =
                    numberValue(row.loans) ||
                    numberValue(row.loan_emi) +
                      numberValue(row.loan_repayment);

                  const net = numberValue(row.net);

                  return (
                    <div
                      className="table-row"
                      key={`${row.month_name}-${index}`}
                    >
                      <span className="month-name">
                        {row.month_name}
                      </span>
                      <span>{money(row.income)}</span>
                      <span>{money(row.expenses)}</span>
                      <span>{money(loans)}</span>
                      <span>
                        {money(row.borrow_repayment)}
                      </span>
                      <span
                        className={
                          net >= 0
                            ? "positive-text"
                            : "negative-text"
                        }
                      >
                        {money(net)}
                      </span>
                      <span>
                        {renderStatus(row.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          )}

          <section className="bottom-summary">
            <div className="bottom-icon">
              <IndianRupee size={20} />
            </div>

            <div className="bottom-main">
              <span>Selected Month</span>
              <strong>{monthLabel}</strong>
            </div>

            <BottomMetric
              label="Total Income"
              value={money(totals.income)}
            />

            <BottomMetric
              label="Total Outflow"
              value={money(totals.outflow)}
            />

            <BottomMetric
              label="Net Result"
              value={money(totals.net)}
              positive={totals.net >= 0}
            />
          </section>
        </>
      )}
    </main>
  );
};

const SummaryCard = ({ icon, label, value, tone }) => (
  <article className={`summary-card ${tone}`}>
    <div className="summary-icon">{icon}</div>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

const PanelHeader = ({ title, subtitle }) => (
  <div className="panel-header">
    <div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  </div>
);

const ResultRow = ({ label, value }) => (
  <div className="result-row">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const MiniMetric = ({ label, value }) => (
  <div className="mini-metric">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const YearMetric = ({ label, value, tone }) => (
  <div className={`year-metric ${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const BottomMetric = ({ label, value, positive }) => (
  <div className="bottom-metric">
    <span>{label}</span>
    <strong className={positive === false ? "negative-text" : ""}>
      {value}
    </strong>
  </div>
);

const styles = `
* {
  box-sizing: border-box;
}

.performance-page {
  width: 100%;
  min-height: 100%;
  padding: 20px;
  color: #f8fafc;
  background:
    radial-gradient(circle at 15% 0%, rgba(124,58,237,.13), transparent 30%),
    radial-gradient(circle at 90% 10%, rgba(6,182,212,.09), transparent 28%),
    #070b16;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.hero {
  max-width: 1500px;
  margin: 0 auto 18px;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 20px;
  background: rgba(15,23,42,.82);
  box-shadow: 0 18px 55px rgba(0,0,0,.2);
  backdrop-filter: blur(18px);
}

.hero-copy {
  min-width: 0;
}

.eyebrow,
.section-kicker {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #a78bfa;
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .12em;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 7px;
}

.title-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  flex: 0 0 46px;
  color: #c4b5fd;
  border: 1px solid rgba(139,92,246,.25);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(139,92,246,.22), rgba(6,182,212,.09));
}

h1,
h2,
h3,
p {
  margin: 0;
}

.title-row h1 {
  font-size: clamp(1.25rem, 2vw, 1.65rem);
  font-weight: 850;
  letter-spacing: -.03em;
}

.title-row p {
  margin-top: 4px;
  color: rgba(226,232,240,.58);
  font-size: .76rem;
  line-height: 1.5;
}

.title-row p strong {
  color: #ddd6fe;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.month-control,
.refresh-btn {
  height: 42px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  color: #f8fafc;
  background: rgba(255,255,255,.055);
}

.month-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
}

.month-control input {
  width: 125px;
  color: #fff;
  background: transparent;
  border: 0;
  outline: 0;
  font: inherit;
  font-size: .75rem;
  font-weight: 700;
}

.month-control input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: .75;
}

.refresh-btn {
  padding: 0 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  font-size: .72rem;
  font-weight: 750;
  transition: .2s ease;
}

.refresh-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(167,139,250,.45);
  background: rgba(139,92,246,.12);
}

.refresh-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.error-box {
  max-width: 1500px;
  margin: 0 auto 14px;
  padding: 11px 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #fecaca;
  border: 1px solid rgba(239,68,68,.25);
  border-radius: 12px;
  background: rgba(239,68,68,.08);
  font-size: .72rem;
}

.error-box > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-box button {
  border: 0;
  color: inherit;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}

.loading {
  min-height: 360px;
  max-width: 1500px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: rgba(226,232,240,.5);
}

.loading strong {
  color: #e2e8f0;
  font-size: .82rem;
}

.loading span {
  font-size: .67rem;
}

.spin {
  animation: spin 1s linear infinite;
}

.summary-grid,
.main-grid,
.section-block,
.bottom-summary {
  max-width: 1500px;
  margin-left: auto;
  margin-right: auto;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.summary-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 16px;
  background: rgba(15,23,42,.76);
  box-shadow: 0 12px 32px rgba(0,0,0,.13);
  transition: .22s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  border-color: rgba(167,139,250,.3);
  box-shadow: 0 16px 36px rgba(0,0,0,.2);
}

.summary-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
}

.summary-icon svg {
  width: 18px;
  height: 18px;
}

.summary-card > span {
  display: block;
  margin-top: 10px;
  color: rgba(226,232,240,.48);
  font-size: .63rem;
  font-weight: 650;
}

.summary-card > strong {
  display: block;
  margin-top: 4px;
  font-size: .94rem;
  overflow-wrap: anywhere;
}

.summary-card.income .summary-icon {
  color: #67e8f9;
  background: rgba(6,182,212,.11);
}

.summary-card.expense .summary-icon {
  color: #fca5a5;
  background: rgba(239,68,68,.11);
}

.summary-card.loan .summary-icon {
  color: #c4b5fd;
  background: rgba(139,92,246,.13);
}

.summary-card.borrow .summary-icon {
  color: #fbbf24;
  background: rgba(245,158,11,.11);
}

.summary-card.received .summary-icon {
  color: #6ee7b7;
  background: rgba(16,185,129,.11);
}

.summary-card.pending .summary-icon {
  color: #fcd34d;
  background: rgba(245,158,11,.11);
}

.main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(300px, .75fr);
  gap: 12px;
  margin-bottom: 16px;
}

.panel {
  min-width: 0;
  padding: 17px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  background: rgba(15,23,42,.76);
  box-shadow: 0 16px 40px rgba(0,0,0,.14);
}

.panel-header h2,
.section-heading h2 {
  font-size: .92rem;
  font-weight: 850;
  letter-spacing: -.01em;
}

.panel-header p,
.section-heading p {
  margin-top: 4px;
  color: rgba(226,232,240,.47);
  font-size: .68rem;
  line-height: 1.5;
}

.pie-layout {
  min-height: 275px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 42px;
}

.pie {
  width: 205px;
  height: 205px;
  flex: 0 0 205px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  box-shadow:
    0 0 0 8px rgba(255,255,255,.025),
    0 15px 45px rgba(0,0,0,.2);
}

.pie-hole {
  width: 118px;
  height: 118px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 50%;
  text-align: center;
  background: #0b1120;
  border: 1px solid rgba(255,255,255,.06);
}

.pie-hole strong {
  max-width: 100px;
  font-size: .85rem;
  overflow-wrap: anywhere;
}

.pie-hole span {
  margin-top: 4px;
  color: rgba(226,232,240,.4);
  font-size: .58rem;
}

.legend {
  width: min(100%, 350px);
  display: grid;
  gap: 8px;
}

.legend-item {
  display: grid;
  grid-template-columns: 9px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid rgba(255,255,255,.055);
  border-radius: 10px;
  background: rgba(255,255,255,.025);
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.legend-name {
  min-width: 0;
}

.legend-name strong {
  display: block;
  font-size: .68rem;
}

.legend-name span {
  display: block;
  margin-top: 2px;
  color: rgba(226,232,240,.38);
  font-size: .57rem;
}

.legend-item > b {
  font-size: .68rem;
  white-space: nowrap;
}

.result-main {
  margin-top: 18px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 14px;
  background: linear-gradient(
    145deg,
    rgba(139,92,246,.09),
    rgba(6,182,212,.04)
  );
}

.result-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
}

.result-icon.positive {
  color: #6ee7b7;
  background: rgba(16,185,129,.12);
}

.result-icon.negative {
  color: #fca5a5;
  background: rgba(239,68,68,.12);
}

.result-main > span {
  display: block;
  margin-top: 13px;
  color: rgba(226,232,240,.45);
  font-size: .65rem;
}

.result-main > strong {
  display: block;
  margin-top: 4px;
  font-size: 1.45rem;
}

.positive-text {
  color: #6ee7b7 !important;
}

.negative-text {
  color: #fca5a5 !important;
}

.status {
  width: fit-content;
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 8px;
  font-size: .58rem;
  font-weight: 800;
}

.status.profit {
  color: #6ee7b7;
  background: rgba(16,185,129,.1);
}

.status.loss {
  color: #fca5a5;
  background: rgba(239,68,68,.1);
}

.status.neutral {
  color: #cbd5e1;
  background: rgba(148,163,184,.09);
}

.result-list {
  margin-top: 13px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,.055);
}

.result-row:last-child {
  border-bottom: 0;
}

.result-row span {
  color: rgba(226,232,240,.43);
  font-size: .63rem;
}

.result-row strong {
  font-size: .65rem;
}

.section-block {
  margin-bottom: 16px;
}

.section-heading {
  margin-bottom: 10px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.section-kicker {
  margin-bottom: 4px;
}

.section-badge {
  padding: 6px 9px;
  color: #c4b5fd;
  border: 1px solid rgba(139,92,246,.2);
  border-radius: 8px;
  background: rgba(139,92,246,.08);
  font-size: .6rem;
  font-weight: 800;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.week-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 16px;
  background: rgba(15,23,42,.76);
  transition: .2s ease;
}

.week-card:hover {
  transform: translateY(-2px);
  border-color: rgba(139,92,246,.28);
}

.week-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 11px;
  border-bottom: 1px solid rgba(255,255,255,.055);
}

.week-number {
  color: #a78bfa;
  font-size: .57rem;
  font-weight: 850;
  letter-spacing: .1em;
}

.week-top h3 {
  margin-top: 4px;
  font-size: .72rem;
}

.net-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: .6rem;
  font-weight: 800;
  white-space: nowrap;
}

.net-pill.up {
  color: #6ee7b7;
  background: rgba(16,185,129,.09);
}

.net-pill.down {
  color: #fca5a5;
  background: rgba(239,68,68,.09);
}

.week-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  padding: 12px 0;
}

.mini-metric {
  min-width: 0;
  padding: 9px;
  border-radius: 10px;
  background: rgba(255,255,255,.025);
}

.mini-metric span {
  display: block;
  color: rgba(226,232,240,.38);
  font-size: .55rem;
}

.mini-metric strong {
  display: block;
  margin-top: 4px;
  font-size: .64rem;
  overflow-wrap: anywhere;
}

.week-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 7px;
  border-radius: 7px;
  font-size: .55rem;
  font-weight: 700;
}

.pending-tag {
  color: #fcd34d;
  background: rgba(245,158,11,.08);
}

.received-tag {
  color: #6ee7b7;
  background: rgba(16,185,129,.08);
}

.loan-tag {
  color: #c4b5fd;
  background: rgba(139,92,246,.08);
}

.borrow-tag {
  color: #67e8f9;
  background: rgba(6,182,212,.08);
}

.year-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.year-metric {
  padding: 12px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
  background: rgba(15,23,42,.7);
}

.year-metric span {
  color: rgba(226,232,240,.42);
  font-size: .58rem;
}

.year-metric strong {
  display: block;
  margin-top: 4px;
  font-size: .76rem;
}

.year-metric.income strong {
  color: #67e8f9;
}

.year-metric.expense strong {
  color: #fca5a5;
}

.year-metric.loan strong {
  color: #c4b5fd;
}

.year-metric.borrow strong {
  color: #fbbf24;
}

.year-metric.received strong {
  color: #6ee7b7;
}

.monthly-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px;
  background: rgba(15,23,42,.7);
}

.monthly-table {
  min-width: 900px;
}

.table-row {
  min-height: 48px;
  display: grid;
  grid-template-columns: 1.35fr repeat(6, minmax(100px, 1fr));
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  border-bottom: 1px solid rgba(255,255,255,.055);
}

.table-row:last-child {
  border-bottom: 0;
}

.table-row > span {
  color: rgba(226,232,240,.68);
  font-size: .63rem;
}

.table-row > span:not(:first-child) {
  text-align: right;
}

.table-row.table-head {
  min-height: 40px;
  background: rgba(255,255,255,.025);
}

.table-head > span {
  color: rgba(226,232,240,.4);
  font-size: .56rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.table-row .month-name {
  color: #e2e8f0;
  font-weight: 750;
}

.table-row .status {
  margin: 0 0 0 auto;
}

.bottom-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(139,92,246,.18);
  border-radius: 16px;
  background:
    linear-gradient(100deg, rgba(139,92,246,.11), rgba(6,182,212,.045)),
    rgba(15,23,42,.8);
}

.bottom-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  color: #c4b5fd;
  border-radius: 11px;
  background: rgba(139,92,246,.12);
}

.bottom-main {
  flex: 1;
  min-width: 150px;
}

.bottom-main span,
.bottom-metric span {
  display: block;
  color: rgba(226,232,240,.42);
  font-size: .58rem;
}

.bottom-main strong,
.bottom-metric strong {
  display: block;
  margin-top: 3px;
  font-size: .74rem;
}

.bottom-metric {
  min-width: 130px;
  padding-left: 14px;
  border-left: 1px solid rgba(255,255,255,.08);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 850px) {
  .performance-page {
    padding: 11px;
  }

  .hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px;
  }

  .controls {
    width: 100%;
  }

  .month-control {
    flex: 1;
  }

  .month-control input {
    width: 100%;
  }

  .refresh-btn {
    min-width: 90px;
  }

  .pie-layout {
    flex-direction: column;
    gap: 20px;
    padding: 18px 0;
  }

  .legend {
    width: 100%;
    max-width: 480px;
  }

  .year-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bottom-summary {
    flex-wrap: wrap;
  }

  .bottom-main {
    min-width: calc(100% - 55px);
  }

  .bottom-metric {
    flex: 1;
  }
}

@media (max-width: 600px) {
  .performance-page {
    padding: 8px;
  }

  .title-icon {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
  }

  .title-row h1 {
    font-size: 1.18rem;
  }

  .title-row p {
    font-size: .68rem;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-card {
    padding: 11px;
  }

  .summary-card > strong {
    font-size: .82rem;
  }

  .week-grid {
    grid-template-columns: 1fr;
  }

  .week-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pie {
    width: 175px;
    height: 175px;
    flex-basis: 175px;
  }

  .pie-hole {
    width: 104px;
    height: 104px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .year-summary {
    grid-template-columns: 1fr 1fr;
  }

  .bottom-summary {
    display: grid;
    grid-template-columns: auto 1fr;
  }

  .bottom-main {
    min-width: 0;
  }

  .bottom-metric {
    min-width: 0;
    padding: 0;
    border-left: 0;
  }

  .bottom-metric strong {
    font-size: .67rem;
  }
}

@media (max-width: 390px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .controls {
    flex-direction: column;
  }

  .month-control,
  .refresh-btn {
    width: 100%;
  }

  .refresh-btn {
    height: 40px;
  }

  .week-top {
    flex-direction: column;
  }

  .net-pill {
    align-self: flex-start;
  }

  .year-summary {
    grid-template-columns: 1fr;
  }
}
`;

export default Performance;
