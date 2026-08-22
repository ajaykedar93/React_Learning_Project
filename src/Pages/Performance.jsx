import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle, ArrowDownRight, ArrowUpRight, BarChart3, Building2,
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CreditCard,
  DollarSign, PieChart, PiggyBank, RefreshCw, TrendingDown, TrendingUp,
  Trophy, Users, Wallet, X, Zap
} from "lucide-react";

/*
  Performance Dashboard
  API contract:
    GET  /api/performance?month=1 Aug 2026
    GET  /api/performance/widgets?month=1 Aug 2026
  Authorization:
    Bearer token from localStorage: token OR accessToken

  Vite:
    VITE_API_URL=http://localhost:5000/api

  The page intentionally uses the two existing Performance APIs only.
*/

const API_ROOT = (import.meta.env?.VITE_API_URL || "https://express-project-learning-new.onrender.com/api").replace(/\/$/, "");
const PERFORMANCE_URL = `${API_ROOT}/performance`;
const WIDGETS_URL = `${API_ROOT}/performance/widgets`;

const EMPTY_WIDGETS = {
  top_expenses: [],
  upcoming_emis: [],
  overdue_payments: [],
};

const n = (v) => Number(v) || 0;
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === "object" ? v : {});

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n(value));

const monthQuery = (date) =>
  `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}`;

const monthLabel = (date) =>
  date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const dateOnly = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const clamp = (value, min = 0, max = 100) =>
  Math.min(Math.max(n(value), min), max);

export default function Performance() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [data, setData] = useState(null);
  const [widgets, setWidgets] = useState(EMPTY_WIDGETS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    "";

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__performanceToastTimer);
    window.__performanceToastTimer = window.setTimeout(
      () => setToast(null),
      2800
    );
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");

      try {
        if (!token) {
          throw new Error("Login token not found. Please login again.");
        }

        const params = { month: monthQuery(selectedMonth) };

        const [performanceResponse, widgetResponse] = await Promise.all([
          axios.get(PERFORMANCE_URL, { params, headers }),
          axios.get(WIDGETS_URL, { params, headers }),
        ]);

        const performancePayload = performanceResponse?.data;
        const widgetPayload = widgetResponse?.data;

        if (!performancePayload?.success || !performancePayload?.data) {
          setData(null);
          setWidgets(EMPTY_WIDGETS);
          throw new Error(
            performancePayload?.error ||
            performancePayload?.message ||
            "Performance data is unavailable."
          );
        }

        setData(performancePayload.data);

        setWidgets(
          widgetPayload?.success && widgetPayload?.data
            ? {
                top_expenses: arr(widgetPayload.data.top_expenses),
                upcoming_emis: arr(widgetPayload.data.upcoming_emis),
                overdue_payments: arr(widgetPayload.data.overdue_payments),
              }
            : EMPTY_WIDGETS
        );
      } catch (err) {
        console.error("Performance dashboard API error:", err);

        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load performance data.";

        setError(message);

        if (err?.response?.status === 401 || err?.response?.status === 403) {
          notify("error", "Session expired. Please login again.");
        } else if (!silent) {
          notify("error", message);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [headers, notify, selectedMonth, token]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => load(true), 60000);
    return () => clearInterval(timer);
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    if (!error) notify("success", "Performance refreshed.");
  };

  const moveMonth = (delta) => {
    setSelectedMonth((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const summary = obj(data?.summary);
  const income = obj(data?.income_breakdown);
  const expenses = obj(data?.expense_breakdown);
  const debt = obj(data?.loan_borrow_summary);
  const payments = obj(data?.payment_summary);
  const quick = obj(data?.quick_stats);

  const categories = arr(expenses.categories);
  const weekly = arr(expenses.weekly);
  const activeLoans = arr(debt.active_loans);
  const activeBorrows = arr(debt.active_borrows);

  const paymentTotals = obj(payments.totals);
  const paymentBreakdown = obj(payments.breakdown);

  const totalIncome = n(income.work_payment) + n(income.business_payment);
  const totalExpenses = n(expenses.total) || n(summary.total_expenses);
  const totalEmi = n(debt.total_emi_paid) || n(summary.total_emi_paid);
  const savings = totalIncome - totalExpenses - totalEmi;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  const savingsStatus =
    savings > 0 ? "profit" : savings < 0 ? "loss" : "break_even";

  const paymentReceivedCount = n(paymentBreakdown.received?.count);
  const paymentPendingCount = n(paymentBreakdown.pending?.count);
  const paymentOverdueCount = n(paymentBreakdown.overdue?.count);
  const paymentLostCount = n(paymentBreakdown.lost?.count);

  const monthlyDetails = [
    { label: "Work Payment", value: money(income.work_payment), meta: `${n(income.total_work_count)} records`, tone: "green" },
    { label: "Business Payment", value: money(income.business_payment), meta: `${n(income.total_business_count)} records`, tone: "blue" },
    { label: "Total Income", value: money(totalIncome), meta: "Work + Business", tone: "indigo" },
    { label: "Total Expenses", value: money(totalExpenses), meta: `${n(summary.expense_count)} transactions`, tone: "red" },
    { label: "Total Borrow", value: money(summary.total_borrow), meta: `${n(summary.borrow_count)} records`, tone: "orange" },
    { label: "Total Loan", value: money(summary.total_loan), meta: `${n(summary.loan_count)} records`, tone: "purple" },
    { label: "EMI Paid", value: money(totalEmi), meta: `${n(summary.emi_count)} payments`, tone: "cyan" },
    { label: "Monthly Savings", value: money(savings), meta: `${savingsRate.toFixed(1)}% rate`, tone: savingsStatus === "loss" ? "red" : "green" },
    { label: "Received Payments", value: `${paymentReceivedCount}`, meta: money(paymentTotals.received), tone: "green" },
    { label: "Pending Payments", value: `${paymentPendingCount}`, meta: money(paymentTotals.pending), tone: "orange" },
    { label: "Overdue Payments", value: `${paymentOverdueCount}`, meta: money(paymentTotals.overdue), tone: "red" },
    { label: "Lost Payments", value: `${paymentLostCount}`, meta: money(paymentTotals.lost), tone: "slate" },
    { label: "Remaining Loan", value: money(debt.total_remaining_loan_amount), meta: `${n(debt.total_remaining_emis)} EMIs left`, tone: "purple" },
    { label: "Remaining Borrow", value: money(debt.total_remaining_borrow_amount), meta: "Active borrow balance", tone: "orange" },
    { label: "Total Debt Remaining", value: money(debt.total_debt_remaining), meta: "Loan + Borrow", tone: "slate" },
    { label: "Savings Result", value: savings > 0 ? "Profit" : savings < 0 ? "Loss" : "Break Even", meta: money(Math.abs(savings)), tone: savings > 0 ? "green" : savings < 0 ? "red" : "orange" },
  ];

  const allTimeSavings =
    n(quick.all_time_income) -
    n(quick.all_time_expenses) -
    n(quick.all_time_emi_paid);

  const incomeParts = [
    { label: "Work", value: n(income.work_payment), color: "#10b981" },
    { label: "Business", value: n(income.business_payment), color: "#6366f1" },
  ];

  const expenseParts = categories.slice(0, 7).map((item, i) => ({
    label: item.category_name || "Category",
    value: n(item.total_amount),
    color:
      item.color ||
      ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"][i % 7],
  }));

  const paymentParts = [
    { label: "Received", value: n(paymentTotals.received), color: "#10b981" },
    { label: "Pending", value: n(paymentTotals.pending), color: "#f59e0b" },
    { label: "Overdue", value: n(paymentTotals.overdue), color: "#ef4444" },
    { label: "Lost", value: n(paymentTotals.lost), color: "#64748b" },
  ];

  if (loading && !data) {
    return (
      <>
        <style>{styles}</style>
        <main className="pd-page">
          <div className="pd-loading">
            <div className="pd-loading-logo"><RefreshCw size={25} className="pd-spin" /></div>
            <strong>Loading Performance</strong>
            <span>Preparing your financial dashboard…</span>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <main className="pd-page">
        <div className="pd-shell">

          <header className="pd-header">
            <div className="pd-header-main">
              <div className="pd-title-wrap">
                <div className="pd-logo"><PieChart size={22} /></div>
                <div>
                  <h1>Performance</h1>
                  <p>Monthly financial overview</p>
                </div>
              </div>

              <div className="pd-actions">
                <button className="pd-action" onClick={() => setSelectedMonth(new Date())}>
                  <CalendarDays size={14} />
                  <span>Current</span>
                </button>
                <button className="pd-action" onClick={refresh} disabled={refreshing}>
                  <RefreshCw size={14} className={refreshing ? "pd-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="pd-monthbar">
              <div>
                <small>SELECTED MONTH</small>
                <strong>{monthLabel(selectedMonth)}</strong>
              </div>

              <div className="pd-month-control">
                <button onClick={() => moveMonth(-1)} aria-label="Previous month">
                  <ChevronLeft size={17} />
                </button>
                <div>
                  <CalendarDays size={14} />
                  <span>{monthQuery(selectedMonth)}</span>
                </div>
                <button onClick={() => moveMonth(1)} aria-label="Next month">
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </header>

          {error && (
            <div className="pd-error">
              <AlertCircle size={17} />
              <div>
                <strong>Performance API Error</strong>
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")}><X size={14} /></button>
            </div>
          )}

          {!data ? (
            <EmptyState month={monthLabel(selectedMonth)} onRefresh={refresh} />
          ) : (
            <>
              <section className="pd-kpis">
                <KPI icon={<Wallet />} title="Total Income" value={money(totalIncome)} meta={`Work ${money(income.work_payment)}`} tone="green" />
                <KPI icon={<TrendingDown />} title="Expenses" value={money(totalExpenses)} meta={`${n(summary.expense_count)} transactions`} tone="red" />
                <KPI icon={<Users />} title="Borrow" value={money(summary.total_borrow)} meta={`${n(summary.borrow_count)} records`} tone="orange" />
                <KPI icon={<CreditCard />} title="Loan" value={money(summary.total_loan)} meta={`${n(summary.loan_count)} records`} tone="blue" />
                <KPI icon={<DollarSign />} title="EMI Paid" value={money(totalEmi)} meta={`${n(summary.emi_count)} payments`} tone="purple" />
                <KPI icon={<PiggyBank />} title="Savings" value={money(savings)} meta={`${savingsRate.toFixed(1)}% rate`} tone={savingsStatus === "profit" ? "green" : savingsStatus === "loss" ? "red" : "orange"} />
              </section>

              <section className={`pd-savings ${savingsStatus}`}>
                <div className="pd-savings-left">
                  <div className="pd-savings-icon">
                    {savingsStatus === "profit" ? <Trophy size={21} /> : savingsStatus === "loss" ? <AlertCircle size={21} /> : <PiggyBank size={21} />}
                  </div>
                  <div>
                    <small>MONTHLY SAVINGS STATUS</small>
                    <h2>{savings > 0 ? `Profit: ${money(savings)}` : savings < 0 ? `Loss: ${money(Math.abs(savings))}` : "Break Even"}</h2>
                    <p>Income − Expenses − EMI Paid</p>
                  </div>
                </div>
                <div className="pd-savings-rate">
                  <div>
                    <small>SAVINGS RATE</small>
                    <strong>{savingsRate.toFixed(1)}%</strong>
                  </div>
                  <Ring percent={Math.abs(savingsRate)} />
                </div>
              </section>

              <Panel
                className="pd-section pd-month-details"
                icon={<CalendarDays />}
                title="Total Month Details"
                subtitle={`${monthLabel(selectedMonth)} — complete monthly summary`}
                tone="blue"
              >
                <div className="pd-month-details-grid">
                  {monthlyDetails.map((item) => (
                    <div
                      className={`pd-month-detail-card ${item.tone}`}
                      key={item.label}
                    >
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <small>{item.meta}</small>
                    </div>
                  ))}
                </div>
              </Panel>

              <section className="pd-pies">
                <PieCard title="Income Distribution" subtitle="Work vs Business" parts={incomeParts} />
                <PieCard title="Expense Distribution" subtitle="Top categories" parts={expenseParts} />
                <PieCard title="Payment Status" subtitle="Monthly collection status" parts={paymentParts} />
              </section>

              <section className="pd-grid-2">
                <Panel icon={<ArrowUpRight />} title="Income Breakdown" subtitle="Work and Business" tone="green">
                  <ProgressRow name="Work Payment" icon="💼" value={income.work_payment} percent={income.work_percentage} color="#10b981" />
                  <ProgressRow name="Business Payment" icon="🏢" value={income.business_payment} percent={income.business_percentage} color="#6366f1" />
                  <Divider />
                  <InfoRow label="Total Work Count" value={n(income.total_work_count)} />
                  <InfoRow label="Total Business Count" value={n(income.total_business_count)} />
                </Panel>

                <Panel icon={<ArrowDownRight />} title="Expense Breakdown" subtitle="Category-wise" tone="red">
                  {categories.length ? categories.map((item) => (
                    <ProgressRow
                      key={item.category_id}
                      name={item.category_name}
                      icon={item.icon || "📊"}
                      value={item.total_amount}
                      percent={item.percentage}
                      color={item.color || "#ef4444"}
                    />
                  )) : <Empty text="No expenses this month" />}
                  <Divider />
                  <InfoRow label="Total Expenses" value={money(totalExpenses)} danger />
                </Panel>
              </section>

              <Panel className="pd-section" icon={<BarChart3 />} title="Weekly Expenses" subtitle="Week 1–4">
                <div className="pd-week-grid">
                  {[1, 2, 3, 4].map((weekNo) => {
                    const week = weekly.find((x) => n(x.week_number) === weekNo) || {};
                    return (
                      <div className="pd-week" key={weekNo}>
                        <div><span>Week {weekNo}</span><BarChart3 size={14} /></div>
                        <strong>{money(week.total_amount)}</strong>
                        <small>{n(week.expense_count)} transactions</small>
                        <div className="pd-track"><i style={{ width: `${clamp(week.percentage)}%` }} /></div>
                        <em>{n(week.percentage).toFixed(1)}%</em>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <section className="pd-grid-2 pd-section">
                <Panel icon={<Building2 />} title="Active Loans" subtitle={`${activeLoans.length} active`} tone="purple">
                  {activeLoans.length ? activeLoans.map((loan) => (
                    <DebtRow
                      key={loan.id}
                      type="loan"
                      title={loan.bank_name || "Loan"}
                      amount={loan.total_loan_amount}
                      secondary={`Paid ${money(loan.total_paid)}`}
                      meta={`${n(loan.remaining_emis)} EMIs left • ${money(loan.emi_amount)}/mo`}
                      timing={n(loan.days_until_next_emi) > 0 ? `${n(loan.days_until_next_emi)} days` : "Due today"}
                    />
                  )) : <Empty text="No active loans" />}
                  <Divider />
                  <InfoRow label="Remaining Loan" value={money(debt.total_remaining_loan_amount)} purple />
                </Panel>

                <Panel icon={<Users />} title="Active Borrows" subtitle={`${activeBorrows.length} active`} tone="orange">
                  {activeBorrows.length ? activeBorrows.map((borrow) => (
                    <DebtRow
                      key={borrow.id}
                      type="borrow"
                      title={borrow.person_name || "Borrow"}
                      amount={borrow.remaining_amount}
                      secondary={`of ${money(borrow.borrow_amount)}`}
                      meta={`Due ${dateOnly(borrow.return_date)}`}
                      timing={n(borrow.days_remaining) > 0 ? `${n(borrow.days_remaining)} days left` : "Overdue"}
                    />
                  )) : <Empty text="No active borrows" />}
                  <Divider />
                  <InfoRow label="Remaining Borrow" value={money(debt.total_remaining_borrow_amount)} orange />
                </Panel>
              </section>

              <section className="pd-debt-total">
                <div className="main">
                  <small>TOTAL DEBT REMAINING</small>
                  <strong>{money(debt.total_debt_remaining)}</strong>
                </div>
                <div><small>Remaining Loan</small><b>{money(debt.total_remaining_loan_amount)}</b></div>
                <div><small>Remaining Borrow</small><b>{money(debt.total_remaining_borrow_amount)}</b></div>
              </section>

              <Panel className="pd-section" icon={<Wallet />} title="Payment Summary" subtitle="Monthly status totals" tone="cyan">
                <div className="pd-payment-grid">
                  <PaymentCard title="Received" value={paymentTotals.received} count={paymentBreakdown.received?.count} tone="received" />
                  <PaymentCard title="Pending" value={paymentTotals.pending} count={paymentBreakdown.pending?.count} tone="pending" />
                  <PaymentCard title="Overdue" value={paymentTotals.overdue} count={paymentBreakdown.overdue?.count} tone="overdue" />
                  <PaymentCard title="Lost" value={paymentTotals.lost} count={paymentBreakdown.lost?.count} tone="lost" />
                </div>
              </Panel>

              <section className="pd-grid-2 pd-section">
                <Panel icon={<TrendingUp />} title="All-Time Quick Stats" subtitle="Lifetime totals" tone="purple">
                  <div className="pd-quick-grid">
                    <Quick title="Income" value={money(quick.all_time_income)} />
                    <Quick title="Expenses" value={money(quick.all_time_expenses)} />
                    <Quick title="Borrow" value={money(quick.all_time_borrow)} />
                    <Quick title="Loan" value={money(quick.all_time_loan)} />
                    <Quick title="EMI Paid" value={money(quick.all_time_emi_paid)} />
                    <Quick title="Received" value={money(quick.all_time_received)} />
                    <Quick title="Savings" value={money(allTimeSavings)} highlight />
                  </div>
                </Panel>

                <Panel icon={<Zap />} title="Performance Widgets" subtitle="Current account data" tone="blue">
                  <WidgetGroup title="Top Expenses" items={widgets.top_expenses} empty="No top expense data">
                    {(item, i) => <WidgetRow key={`${item.category_name}-${i}`} icon={item.icon || "📊"} title={item.category_name} value={money(item.total_amount)} />}
                  </WidgetGroup>
                  <WidgetGroup title="Upcoming EMIs" items={widgets.upcoming_emis} empty="No upcoming EMIs">
                    {(item) => <WidgetRow key={item.id} icon="💳" title={item.bank_name || "Loan"} subtitle={dateOnly(item.next_emi_date)} value={money(item.emi_amount)} />}
                  </WidgetGroup>
                  <WidgetGroup title="Overdue Payments" items={widgets.overdue_payments} empty="No overdue payments">
                    {(item) => <WidgetRow key={item.id} icon="⚠️" title={item.person_name || "Payment"} subtitle={`${n(item.days_overdue)} days overdue`} value={money(item.amount)} />}
                  </WidgetGroup>
                </Panel>
              </section>

            </>
          )}
        </div>
      </main>

      {toast && (
        <div className="pd-toast-wrap">
          <div className={`pd-toast ${toast.type}`}>
            {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <div><strong>{toast.type === "success" ? "Success" : "Error"}</strong><span>{toast.message}</span></div>
            <button onClick={() => setToast(null)}><X size={14} /></button>
          </div>
        </div>
      )}
    </>
  );
}

function KPI({ icon, title, value, meta, tone }) {
  return (
    <article className={`pd-kpi ${tone}`}>
      <div>
        <small>{title}</small>
        <strong>{value}</strong>
        <span>{meta}</span>
      </div>
      <div className="pd-kpi-icon">{icon}</div>
    </article>
  );
}

function Panel({ icon, title, subtitle, tone = "blue", className = "", children }) {
  return (
    <section className={`pd-panel ${className}`}>
      <div className="pd-panel-head">
        <div className={`pd-panel-icon ${tone}`}>{icon}</div>
        <div><h3>{title}</h3><p>{subtitle}</p></div>
      </div>
      {children}
    </section>
  );
}

function PieCard({ title, subtitle, parts }) {
  const valid = parts.filter((x) => n(x.value) > 0);
  const total = valid.reduce((sum, x) => sum + n(x.value), 0);
  let cursor = 0;

  const gradient = valid.length
    ? `conic-gradient(${valid.map((x) => {
        const start = cursor;
        cursor += (n(x.value) / total) * 100;
        return `${x.color} ${start}% ${cursor}%`;
      }).join(",")})`
    : "#e2e8f0";

  return (
    <section className="pd-pie-card">
      <div className="pd-pie-head">
        <div><h3>{title}</h3><p>{subtitle}</p></div>
        <PieChart size={16} />
      </div>
      <div className="pd-pie-body">
        <div className="pd-pie" style={{ background: gradient }}>
          <div className="pd-pie-center"><strong>{money(total)}</strong><span>Total</span></div>
        </div>
        <div className="pd-legend">
          {parts.length ? parts.map((item) => {
            const percent = total ? (n(item.value) / total) * 100 : 0;
            return (
              <div className="pd-legend-row" key={item.label}>
                <i style={{ background: item.color }} />
                <div><strong>{item.label}</strong><span>{percent.toFixed(1)}%</span></div>
                <b>{money(item.value)}</b>
              </div>
            );
          }) : <Empty text="No data" />}
        </div>
      </div>
    </section>
  );
}

function Ring({ percent }) {
  const safe = clamp(percent);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="pd-ring">
      <svg viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={radius} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="4" />
        <circle cx="21" cy="21" r={radius} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${(safe / 100) * circumference} ${circumference}`}
          transform="rotate(-90 21 21)" />
      </svg>
      <b>{safe.toFixed(0)}%</b>
    </div>
  );
}

function ProgressRow({ name, icon, value, percent, color }) {
  const width = clamp(percent);
  return (
    <div className="pd-progress">
      <div className="pd-progress-icon">{icon}</div>
      <div className="pd-progress-main">
        <div><span>{name}</span><b>{money(value)}</b></div>
        <div className="pd-track"><i style={{ width: `${width}%`, background: color }} /></div>
        <small>{width.toFixed(1)}%</small>
      </div>
    </div>
  );
}

function InfoRow({ label, value, danger, purple, orange }) {
  return (
    <div className="pd-info">
      <span>{label}</span>
      <b className={danger ? "danger" : purple ? "purple" : orange ? "orange" : ""}>{value}</b>
    </div>
  );
}

function DebtRow({ type, title, amount, secondary, meta, timing }) {
  const urgent = timing === "Due today" || timing === "Overdue";
  return (
    <div className={`pd-debt ${type}`}>
      <div className="pd-debt-icon">{type === "loan" ? <CreditCard size={15} /> : <Users size={15} />}</div>
      <div className="pd-debt-main">
        <strong>{title}</strong>
        <span>{meta}</span>
        <small className={urgent ? "urgent" : "safe"}>{timing}</small>
      </div>
      <div className="pd-debt-amount"><b>{money(amount)}</b><span>{secondary}</span></div>
    </div>
  );
}

function PaymentCard({ title, value, count, tone }) {
  return (
    <div className={`pd-payment ${tone}`}>
      <small>{title}</small>

      <div className="pd-payment-count">
        <strong>{n(count)}</strong>
        <span>{n(count) === 1 ? "Payment" : "Payments"}</span>
      </div>

      <b className="pd-payment-amount">
        {money(value)}
      </b>
    </div>
  );
}

function Quick({ title, value, highlight }) {
  return <div className={`pd-quick ${highlight ? "highlight" : ""}`}><small>{title}</small><strong>{value}</strong></div>;
}

function WidgetGroup({ title, items, empty, children }) {
  return (
    <div className="pd-widget-group">
      <h4>{title}</h4>
      {items.length ? <div className="pd-widget-list">{items.map(children)}</div> : <Empty text={empty} />}
    </div>
  );
}

function WidgetRow({ icon, title, subtitle, value }) {
  return (
    <div className="pd-widget-row">
      <div className="pd-widget-icon">{icon}</div>
      <div><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</div>
      <b>{value}</b>
    </div>
  );
}

function Divider() { return <div className="pd-divider" />; }

function Empty({ text }) {
  return <div className="pd-empty"><Zap size={14} /><span>{text}</span></div>;
}

function EmptyState({ month, onRefresh }) {
  return (
    <section className="pd-empty-page">
      <div className="pd-empty-icon"><PieChart size={28} /></div>
      <h2>No Performance Data</h2>
      <p>No records are available for <strong>{month}</strong>.</p>
      <span>Add income, expenses, payments, loans or borrow records, then refresh.</span>
      <button onClick={onRefresh}><RefreshCw size={14} /> Refresh Data</button>
    </section>
  );
}

const styles = `
*{box-sizing:border-box}
body{margin:0;background:#f5f7fb}
button{font:inherit}
.pd-page{width:100%;min-height:100vh;padding:12px;overflow-x:hidden;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 0 0,rgba(79,70,229,.09),transparent 27%),radial-gradient(circle at 100% 0,rgba(14,165,233,.08),transparent 25%),#f6f8fc}
.pd-shell{width:min(1280px,100%);margin:auto;min-width:0}.pd-shell>*{min-width:0;max-width:100%}
.pd-header{position:sticky;top:8px;z-index:30;margin-bottom:10px;padding:15px;border-radius:19px;color:#fff;background:linear-gradient(135deg,#17144b,#4338ca 55%,#7c3aed);box-shadow:0 18px 48px rgba(49,46,129,.22)}
.pd-header-main,.pd-monthbar{display:flex;align-items:center;justify-content:space-between;gap:12px}
.pd-title-wrap{display:flex;align-items:center;gap:10px;min-width:0}.pd-logo{width:43px;height:43px;flex:0 0 43px;display:grid;place-items:center;border-radius:13px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.16)}
.pd-title-wrap h1{margin:0;font-size:23px;line-height:1;font-weight:950;letter-spacing:-.04em}.pd-title-wrap p{margin:4px 0 0;color:#d8dcf5;font-size:9px}
.pd-actions{display:flex;gap:6px}.pd-action{height:36px;padding:0 11px;border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;background:rgba(255,255,255,.09);display:flex;align-items:center;gap:5px;font-size:9px;font-weight:900;cursor:pointer}.pd-action:hover{background:rgba(255,255,255,.17)}.pd-action:disabled{opacity:.6}
.pd-monthbar{margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.14)}.pd-monthbar small{display:block;color:#aeb7da;font-size:7px;letter-spacing:.12em;font-weight:900}.pd-monthbar strong{display:block;margin-top:3px;font-size:13px}
.pd-month-control{display:flex;align-items:center;gap:5px}.pd-month-control button{width:34px;height:34px;border:0;border-radius:9px;background:rgba(255,255,255,.1);color:#fff;display:grid;place-items:center;cursor:pointer}.pd-month-control>div{min-width:165px;height:34px;padding:0 9px;border-radius:9px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;gap:6px;font-size:9px;font-weight:900}
.pd-error{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;margin-bottom:9px;border:1px solid #fecdd3;border-radius:12px;background:#fff1f2;color:#9f1239}.pd-error>div{flex:1;min-width:0}.pd-error strong,.pd-error span{display:block}.pd-error strong{font-size:10px}.pd-error span{margin-top:2px;font-size:9px;overflow-wrap:anywhere}.pd-error button{width:26px;height:26px;border:0;border-radius:7px;background:#ffe4e6;color:#be123c;display:grid;place-items:center}
.pd-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:9px}.pd-kpi{min-width:0;padding:12px;border:1px solid #e2e8f0;border-radius:15px;background:#fff;box-shadow:0 7px 22px rgba(15,23,42,.05);display:flex;justify-content:space-between;gap:7px}.pd-kpi:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(15,23,42,.08)}.pd-kpi small{display:block;color:#64748b;font-size:7px;text-transform:uppercase;font-weight:900}.pd-kpi strong{display:block;margin-top:5px;font-size:16px;font-weight:950;overflow-wrap:anywhere}.pd-kpi span{display:block;margin-top:3px;color:#94a3b8;font-size:7px}.pd-kpi-icon{width:32px;height:32px;flex:0 0 32px;border-radius:9px;display:grid;place-items:center}.pd-kpi.green .pd-kpi-icon{background:#d1fae5;color:#047857}.pd-kpi.red .pd-kpi-icon{background:#fee2e2;color:#dc2626}.pd-kpi.orange .pd-kpi-icon{background:#ffedd5;color:#c2410c}.pd-kpi.blue .pd-kpi-icon{background:#dbeafe;color:#2563eb}.pd-kpi.purple .pd-kpi-icon{background:#ede9fe;color:#6d28d9}
.pd-savings{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 16px;margin-bottom:9px;border-radius:16px;color:#fff;box-shadow:0 13px 35px rgba(15,23,42,.13)}.pd-savings.profit{background:linear-gradient(135deg,#065f46,#059669)}.pd-savings.loss{background:linear-gradient(135deg,#991b1b,#dc2626)}.pd-savings.break_even{background:linear-gradient(135deg,#92400e,#d97706)}.pd-savings-left{display:flex;align-items:center;gap:10px}.pd-savings-icon{width:40px;height:40px;flex:0 0 40px;border-radius:11px;background:rgba(255,255,255,.13);display:grid;place-items:center}.pd-savings small{display:block;color:rgba(255,255,255,.65);font-size:7px;letter-spacing:.1em;font-weight:900}.pd-savings h2{margin:3px 0 0;font-size:16px}.pd-savings p{margin:3px 0 0;color:rgba(255,255,255,.7);font-size:8px}.pd-savings-rate{display:flex;align-items:center;gap:10px}.pd-savings-rate strong{display:block;margin-top:3px;font-size:20px}.pd-ring{position:relative;width:52px;height:52px;display:grid;place-items:center}.pd-ring svg{position:absolute;width:100%;height:100%;inset:0}.pd-ring b{position:relative;font-size:9px}
.pd-pies{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:10px}.pd-pie-card,.pd-panel{padding:14px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;box-shadow:0 7px 24px rgba(15,23,42,.05)}.pd-pie-head,.pd-panel-head{display:flex;align-items:center;gap:8px}.pd-pie-head{justify-content:space-between;color:#4f46e5}.pd-pie-head h3,.pd-panel-head h3{margin:0;font-size:12px}.pd-pie-head p,.pd-panel-head p{margin:2px 0 0;color:#94a3b8;font-size:7px}.pd-pie-body{display:grid;grid-template-columns:150px minmax(0,1fr);gap:14px;align-items:center;margin-top:12px}.pd-pie{width:138px;height:138px;border-radius:50%;display:grid;place-items:center;box-shadow:0 8px 24px rgba(15,23,42,.08)}.pd-pie-center{width:84px;height:84px;border-radius:50%;background:#fff;box-shadow:0 7px 18px rgba(15,23,42,.10);display:flex;align-items:center;justify-content:center;flex-direction:column}.pd-pie-center strong{font-size:11px;line-height:1.15;max-width:72px;text-align:center;overflow-wrap:anywhere}.pd-pie-center span{margin-top:3px;color:#94a3b8;font-size:7px}.pd-legend{display:grid;gap:7px;min-width:0}.pd-legend-row{display:grid;grid-template-columns:8px minmax(0,1fr) auto;gap:6px;align-items:center}.pd-legend-row i{width:8px;height:8px;border-radius:50%}.pd-legend-row div{min-width:0}.pd-legend-row strong,.pd-legend-row span{display:block}.pd-legend-row strong{font-size:8px;overflow-wrap:anywhere}.pd-legend-row span{color:#94a3b8;font-size:6px}.pd-legend-row b{font-size:8px;white-space:nowrap}
.pd-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.pd-section{margin-bottom:9px}.pd-panel-head{margin-bottom:10px}.pd-panel-icon{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:grid;place-items:center}.pd-panel-icon.green{background:#d1fae5;color:#047857}.pd-panel-icon.red{background:#fee2e2;color:#dc2626}.pd-panel-icon.blue{background:#dbeafe;color:#2563eb}.pd-panel-icon.purple{background:#ede9fe;color:#6d28d9}.pd-panel-icon.orange{background:#ffedd5;color:#c2410c}.pd-panel-icon.cyan{background:#cffafe;color:#0e7490}
.pd-progress{display:flex;gap:8px;padding:7px 0}.pd-progress-icon{width:28px;height:28px;flex:0 0 28px;border-radius:8px;background:#f8fafc;display:grid;place-items:center}.pd-progress-main{flex:1;min-width:0}.pd-progress-main>div:first-child{display:flex;justify-content:space-between;gap:7px}.pd-progress-main span{font-size:8px;color:#475569;font-weight:800;overflow-wrap:anywhere}.pd-progress-main b{font-size:9px;white-space:nowrap}.pd-track{height:6px;margin-top:4px;border-radius:99px;background:#edf1f6;overflow:hidden}.pd-track i{display:block;height:100%;border-radius:99px}.pd-progress-main small{display:block;margin-top:3px;color:#94a3b8;font-size:7px}
.pd-divider{height:1px;background:#e8edf3;margin:5px 0}.pd-info{display:flex;justify-content:space-between;gap:8px;padding:5px 0}.pd-info span{color:#64748b;font-size:8px}.pd-info b{font-size:9px}.pd-info .danger{color:#dc2626}.pd-info .purple{color:#7c3aed}.pd-info .orange{color:#ea580c}
.pd-week-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.pd-week{padding:10px;border:1px solid #dce4f3;border-radius:12px;background:linear-gradient(145deg,#f8fbff,#eef2ff)}.pd-week>div:first-child{display:flex;justify-content:space-between;color:#2563eb;font-size:7px;font-weight:900}.pd-week>strong{display:block;margin-top:5px;font-size:14px}.pd-week small{display:block;margin-top:2px;color:#94a3b8;font-size:7px}.pd-week .pd-track{margin-top:7px}.pd-week em{display:block;margin-top:3px;color:#64748b;font-size:6px;font-style:normal}
.pd-debt{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px;margin-bottom:6px;border-radius:11px}.pd-debt.loan{background:#faf7ff;border:1px solid #e9d5ff}.pd-debt.borrow{background:#fffaf5;border:1px solid #fed7aa}.pd-debt-icon{width:30px;height:30px;border-radius:8px;display:grid;place-items:center}.pd-debt.loan .pd-debt-icon{background:#ede9fe;color:#7c3aed}.pd-debt.borrow .pd-debt-icon{background:#ffedd5;color:#ea580c}.pd-debt-main{min-width:0}.pd-debt-main strong,.pd-debt-main span,.pd-debt-main small{display:block}.pd-debt-main strong{font-size:9px;overflow-wrap:anywhere}.pd-debt-main span{margin-top:2px;color:#64748b;font-size:7px;overflow-wrap:anywhere}.pd-debt-main small{margin-top:2px;font-size:7px}.pd-debt-main .safe{color:#059669}.pd-debt-main .urgent{color:#dc2626}.pd-debt-amount{text-align:right}.pd-debt-amount b{font-size:9px}.pd-debt-amount span{display:block;margin-top:2px;color:#94a3b8;font-size:6px}
.pd-debt-total{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:8px;margin-bottom:9px;padding:13px 15px;border-radius:15px;color:#fff;background:linear-gradient(135deg,#111827,#334155)}.pd-debt-total>div{padding:0 9px;border-left:1px solid rgba(255,255,255,.12)}.pd-debt-total .main{border-left:0}.pd-debt-total small{display:block;color:#94a3b8;font-size:7px}.pd-debt-total strong{display:block;margin-top:4px;font-size:17px}.pd-debt-total b{display:block;margin-top:4px;font-size:10px}
.pd-payment-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.pd-payment{min-width:0;min-height:108px;padding:13px 14px;border-radius:12px;display:flex;flex-direction:column;justify-content:flex-start}.pd-payment small{display:block;font-size:10px;font-weight:900;letter-spacing:.03em;line-height:1.2}.pd-payment-count{display:flex;align-items:baseline;gap:5px;margin-top:7px}.pd-payment-count strong{font-size:20px;line-height:1;font-weight:850}.pd-payment-count span{font-size:9px;color:#64748b}.pd-payment-amount{display:block;margin-top:14px;font-size:24px;line-height:1.05;font-weight:950;letter-spacing:-.02em;overflow-wrap:anywhere}.pd-payment.received{background:#ecfdf5;border:1px solid #86efac;color:#047857}.pd-payment.pending{background:#fffbeb;border:1px solid #fcd34d;color:#b45309}.pd-payment.overdue{background:#fff1f2;border:1px solid #fda4af;color:#b91c1c}.pd-payment.lost{background:#f8fafc;border:1px solid #cbd5e1;color:#475569}
.pd-quick-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.pd-quick{padding:10px;border:1px solid #e2e8f0;border-radius:11px;background:#f8fafc}.pd-quick small{display:block;color:#64748b;font-size:7px}.pd-quick strong{display:block;margin-top:4px;font-size:10px;overflow-wrap:anywhere}.pd-quick.highlight{border-color:#c7d2fe;background:#eef2ff}.pd-quick.highlight strong{color:#4f46e5}
.pd-widget-group h4{margin:7px 0 6px;color:#475569;font-size:9px}.pd-widget-group:first-child h4{margin-top:0}.pd-widget-list{display:grid;gap:6px}.pd-widget-row{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:7px;padding:7px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc}.pd-widget-icon{width:28px;height:28px;border-radius:8px;background:#eef2ff;display:grid;place-items:center}.pd-widget-row div{min-width:0}.pd-widget-row strong,.pd-widget-row small{display:block}.pd-widget-row strong{font-size:8px;overflow-wrap:anywhere}.pd-widget-row small{margin-top:2px;color:#94a3b8;font-size:6px}.pd-widget-row>b{font-size:8px;white-space:nowrap}
.pd-transaction{display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid #edf1f5}.pd-transaction:last-child{border-bottom:0}.pd-transaction-icon{width:30px;height:30px;border-radius:9px;display:grid;place-items:center}.pd-transaction-icon.expense{background:#fee2e2;color:#dc2626}.pd-transaction-icon.income{background:#d1fae5;color:#047857}.pd-transaction-main{min-width:0}.pd-transaction-main strong,.pd-transaction-main span{display:block}.pd-transaction-main strong{font-size:8px;overflow-wrap:anywhere}.pd-transaction-main span{margin-top:2px;color:#94a3b8;font-size:6px}.pd-transaction-main i{font-style:normal;margin:0 3px}.amount-income{color:#059669;font-size:9px}.amount-expense{color:#dc2626;font-size:9px}
.pd-empty{min-height:54px;display:flex;align-items:center;justify-content:center;gap:6px;border:1px dashed #d5dce7;border-radius:10px;background:#f8fafc;color:#94a3b8;font-size:8px}.pd-empty-page{min-height:55vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:1px solid #e2e8f0;border-radius:18px;background:#fff;box-shadow:0 8px 25px rgba(15,23,42,.05)}.pd-empty-icon{width:62px;height:62px;display:grid;place-items:center;border-radius:18px;color:#4f46e5;background:#eef2ff}.pd-empty-page h2{margin:13px 0 0;font-size:18px}.pd-empty-page p{margin:5px 0 0;color:#475569;font-size:10px}.pd-empty-page p strong{color:#4f46e5}.pd-empty-page>span{max-width:430px;margin-top:5px;color:#94a3b8;font-size:8px}.pd-empty-page button{height:36px;margin-top:14px;padding:0 12px;border:0;border-radius:9px;color:#fff;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;gap:6px;font-size:9px;font-weight:900;cursor:pointer}
.pd-loading{min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;border:1px solid #e2e8f0;border-radius:18px;background:#fff}.pd-loading-logo{width:56px;height:56px;display:grid;place-items:center;border-radius:16px;color:#4f46e5;background:#eef2ff}.pd-loading strong{font-size:14px}.pd-loading span{color:#94a3b8;font-size:9px}
.pd-toast-wrap{position:fixed;inset:0;z-index:5000;display:flex;align-items:flex-start;justify-content:center;padding:18px;pointer-events:none}.pd-toast{width:min(380px,calc(100vw - 28px));display:flex;align-items:flex-start;gap:8px;padding:12px;border:1px solid #e2e8f0;border-radius:13px;background:#fff;box-shadow:0 20px 60px rgba(15,23,42,.18);pointer-events:auto}.pd-toast.success{border-left:4px solid #10b981;color:#059669}.pd-toast.error{border-left:4px solid #ef4444;color:#dc2626}.pd-toast>div{flex:1;min-width:0}.pd-toast strong,.pd-toast span{display:block}.pd-toast strong{color:#172033;font-size:10px}.pd-toast span{margin-top:3px;color:#64748b;font-size:8px;overflow-wrap:anywhere}.pd-toast button{width:25px;height:25px;border:0;border-radius:7px;background:#f1f5f9;color:#64748b;display:grid;place-items:center}
.pd-spin{animation:pdspin .8s linear infinite}@keyframes pdspin{to{transform:rotate(360deg)}}
.pd-month-details-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
.pd-month-detail-card{min-width:0;padding:10px;border:1px solid #e2e8f0;border-radius:11px;background:#f8fafc}
.pd-month-detail-card>span,.pd-month-detail-card>small{display:block}
.pd-month-detail-card>span{font-size:7px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:.04em;overflow-wrap:anywhere}
.pd-month-detail-card>strong{display:block;margin-top:5px;font-size:13px;line-height:1.15;overflow-wrap:anywhere}
.pd-month-detail-card>small{margin-top:3px;color:#94a3b8;font-size:6px;overflow-wrap:anywhere}
.pd-month-detail-card.green{background:#ecfdf5;border-color:#a7f3d0}
.pd-month-detail-card.blue{background:#eff6ff;border-color:#bfdbfe}
.pd-month-detail-card.indigo{background:#eef2ff;border-color:#c7d2fe}
.pd-month-detail-card.red{background:#fff1f2;border-color:#fecdd3}
.pd-month-detail-card.orange{background:#fff7ed;border-color:#fed7aa}
.pd-month-detail-card.purple{background:#faf5ff;border-color:#e9d5ff}
.pd-month-detail-card.cyan{background:#ecfeff;border-color:#a5f3fc}
.pd-month-detail-card.slate{background:#f8fafc;border-color:#cbd5e1}
.pd-payment b{display:block;margin-top:6px;font-size:10px;overflow-wrap:anywhere}
@media(max-width:650px){
  .pd-month-details-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
  .pd-month-detail-card{padding:8px;border-radius:9px}
  .pd-month-detail-card>span{font-size:6px}
  .pd-month-detail-card>strong{margin-top:4px;font-size:10px}
  .pd-month-detail-card>small{margin-top:2px;font-size:5.5px}
  .pd-payment{
    min-height:94px;
    padding:11px;
    border-radius:10px;
  }
  .pd-payment small{
    font-size:9px;
    line-height:1.2;
  }
  .pd-payment-count{
    margin-top:6px;
    gap:4px;
  }
  .pd-payment-count strong{
    font-size:20px;
  }
  .pd-payment-count span{
    font-size:8px;
  }
  .pd-payment-amount{
    margin-top:11px;
    font-size:23px;
    line-height:1.05;
  }
}
@media(max-width:1100px){
  .pd-kpis{grid-template-columns:repeat(3,1fr)}
  .pd-pies{grid-template-columns:repeat(2,minmax(0,1fr))}
}

@media(max-width:800px){
  .pd-pies{grid-template-columns:1fr}
  .pd-week-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pd-pie-body{grid-template-columns:92px minmax(0,1fr);gap:8px}
  .pd-pie{width:86px;height:86px}
  .pd-pie-center{width:55px;height:55px}
}

@media(max-width:650px){
  .pd-page{
    width:100%;
    min-height:100%;
    padding:6px 6px calc(30px + env(safe-area-inset-bottom));
    overflow-x:hidden;
  }

  /* Compact mobile blue header: no large sticky overlay */
  .pd-header{
    position:relative;
    top:auto;
    z-index:1;
    margin-bottom:7px;
    padding:9px;
    border-radius:13px;
    box-shadow:0 9px 22px rgba(49,46,129,.16);
  }

  .pd-header-main{
    align-items:center;
    gap:7px;
  }

  .pd-title-wrap{
    gap:7px;
    min-width:0;
  }

  .pd-logo{
    width:32px;
    height:32px;
    flex-basis:32px;
    border-radius:9px;
  }

  .pd-logo svg{
    width:17px;
    height:17px;
  }

  .pd-title-wrap h1{
    font-size:16px;
    letter-spacing:-.025em;
  }

  .pd-title-wrap p{
    display:none;
  }

  .pd-actions{
    gap:4px;
    flex:0 0 auto;
  }

  .pd-action{
    width:31px;
    height:31px;
    padding:0;
    justify-content:center;
    border-radius:8px;
  }

  .pd-action svg{
    width:13px;
    height:13px;
  }

  .pd-action span{
    display:none;
  }

  .pd-monthbar{
    margin-top:7px;
    padding-top:7px;
    align-items:center;
    flex-direction:row;
    gap:7px;
  }

  .pd-monthbar > div:first-child{
    min-width:0;
    flex:1;
  }

  .pd-monthbar small{
    font-size:8px;
  }

  .pd-monthbar strong{
    margin-top:2px;
    font-size:12px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }

  .pd-month-control{
    width:auto;
    flex:0 0 auto;
    gap:3px;
  }

  .pd-month-control button{
    width:28px;
    height:28px;
    border-radius:7px;
  }

  .pd-month-control > div{
    min-width:0;
    width:126px;
    height:30px;
    padding:0 7px;
    border-radius:7px;
    font-size:9px;
    white-space:nowrap;
    overflow:hidden;
  }

  /* Smaller KPI cards so all six fit naturally on mobile */
  .pd-kpis{
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:5px;
    margin-bottom:6px;
  }

  .pd-kpi{
    padding:7px;
    border-radius:10px;
    gap:5px;
  }

  .pd-kpi small{
    font-size:8px;
    line-height:1.2;
  }

  .pd-kpi strong{
    margin-top:5px;
    font-size:15px;
    line-height:1.2;
  }

  .pd-kpi span{
    margin-top:3px;
    font-size:8px;
    line-height:1.2;
  }

  .pd-kpi-icon{
    width:25px;
    height:25px;
    flex-basis:25px;
    border-radius:7px;
  }

  .pd-kpi-icon svg{
    width:13px;
    height:13px;
  }

  /* Compact blue/green savings banner */
  .pd-savings{
    align-items:center;
    flex-direction:row;
    gap:7px;
    padding:8px 9px;
    margin-bottom:6px;
    border-radius:11px;
  }

  .pd-savings-left{
    min-width:0;
    gap:7px;
    flex:1;
  }

  .pd-savings-icon{
    width:30px;
    height:30px;
    flex-basis:30px;
    border-radius:8px;
  }

  .pd-savings-icon svg{
    width:15px;
    height:15px;
  }

  .pd-savings small{
    font-size:7px;
  }

  .pd-savings h2{
    margin-top:3px;
    font-size:14px;
    line-height:1.25;
  }

  .pd-savings p{
    margin-top:3px;
    font-size:8px;
  }

  .pd-savings-rate{
    width:auto;
    flex:0 0 auto;
    gap:5px;
  }

  .pd-savings-rate strong{
    font-size:16px;
  }

  .pd-ring{
    width:34px;
    height:34px;
  }

  .pd-ring b{
    font-size:8px;
  }

  /* Charts/cards */
  .pd-pies{
    grid-template-columns:1fr;
    gap:6px;
    margin-bottom:6px;
  }

  .pd-pie-card,
  .pd-panel{
    padding:8px;
    border-radius:11px;
  }

  .pd-pie-head h3,
  .pd-panel-head h3{
    font-size:12px;
  }

  .pd-pie-head p,
  .pd-panel-head p{
    font-size:8px;
  }

  .pd-panel-icon{
    width:27px;
    height:27px;
    flex-basis:27px;
    border-radius:8px;
  }

  .pd-panel-icon svg{
    width:13px;
    height:13px;
  }

  .pd-pie-body{
    grid-template-columns:132px minmax(0,1fr);
    gap:10px;
    margin-top:8px;
  }

  .pd-pie{
    width:120px;
    height:120px;
  }

  .pd-pie-center{
    width:72px;
    height:72px;
  }

  .pd-pie-center strong{
    font-size:12px;
    max-width:70px;
    text-align:center;
  }

  .pd-pie-center span{
    font-size:8px;
  }

  .pd-legend{
    gap:4px;
  }

  .pd-legend-row{
    grid-template-columns:6px minmax(0,1fr) auto;
    gap:4px;
  }

  .pd-legend-row i{
    width:6px;
    height:6px;
  }

  .pd-legend-row strong{
    font-size:8px;
  }

  .pd-legend-row span{
    font-size:7px;
  }

  .pd-legend-row b{
    font-size:8px;
  }

  /* Single column content; nothing gets squeezed/cut */
  .pd-grid-2{
    grid-template-columns:1fr;
    gap:6px;
  }

  .pd-section{
    margin-bottom:6px;
  }

  .pd-progress{
    padding:5px 0;
    gap:6px;
  }

  .pd-progress-icon{
    width:24px;
    height:24px;
    flex-basis:24px;
    border-radius:7px;
    font-size:12px;
  }

  .pd-progress-main span{
    font-size:9px;
  }

  .pd-progress-main b{
    font-size:10px;
  }

  .pd-progress-main small{
    font-size:8px;
  }

  .pd-track{
    height:5px;
  }

  .pd-info{
    padding:4px 0;
  }

  .pd-info span{
    font-size:9px;
  }

  .pd-info b{
    font-size:8px;
    white-space:nowrap;
  }

  .pd-week-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:5px;
  }

  .pd-week{
    padding:7px;
    border-radius:9px;
  }

  .pd-week>strong{
    font-size:14px;
  }

  .pd-week small{
    font-size:8px;
  }

  .pd-week em{
    font-size:7px;
  }

  .pd-debt{
    grid-template-columns:25px minmax(0,1fr) !important;
    align-items:start;
    gap:6px;
    padding:7px;
    margin-bottom:4px;
  }

  .pd-debt-icon{
    width:25px;
    height:25px;
    border-radius:7px;
  }

  .pd-debt-icon svg{
    width:12px;
    height:12px;
  }

  .pd-debt-main strong{
    font-size:9px;
  }

  .pd-debt-main span{
    font-size:8px;
  }

  .pd-debt-main small{
    font-size:8px;
  }

  .pd-debt-amount{
    grid-column:2 !important;
    text-align:left !important;
    margin-top:1px;
  }

  .pd-debt-amount b{
    font-size:10px;
  }

  .pd-debt-amount span{
    font-size:7px;
  }

  .pd-debt-total{
    grid-template-columns:1fr 1fr;
    gap:5px;
    padding:9px 10px;
    margin-bottom:6px;
    border-radius:10px;
  }

  .pd-debt-total .main{
    grid-column:1/-1;
    padding-bottom:6px;
    border-left:0;
    border-bottom:1px solid rgba(255,255,255,.12);
  }

  .pd-debt-total>div{
    padding:3px 5px;
    border-left:0;
  }

  .pd-debt-total small{
    font-size:7px;
  }

  .pd-debt-total strong{
    font-size:16px;
  }

  .pd-debt-total b{
    font-size:10px;
  }

  .pd-payment-grid,
  .pd-quick-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:5px;
  }

  .pd-payment{
    padding:8px;
    border-radius:9px;
  }

  .pd-payment small{
    font-size:6px;
  }

  .pd-payment strong{
    margin-top:4px;
    font-size:10px;
  }

  .pd-payment span{
    font-size:6px;
  }

  .pd-quick{
    padding:7px;
    border-radius:9px;
  }

  .pd-quick small{
    font-size:8px;
  }

  .pd-quick strong{
    font-size:11px;
    margin-top:4px;
  }

  .pd-widget-group h4{
    margin:6px 0 5px;
    font-size:9px;
  }

  .pd-widget-row{
    grid-template-columns:24px minmax(0,1fr) auto;
    gap:5px;
    padding:6px;
    border-radius:8px;
  }

  .pd-widget-icon{
    width:24px;
    height:24px;
    border-radius:6px;
    font-size:11px;
  }

  .pd-widget-row strong{
    font-size:8px;
  }

  .pd-widget-row small{
    font-size:7px;
  }

  .pd-widget-row>b{
    font-size:8px;
  }

  .pd-transaction{
    grid-template-columns:27px minmax(0,1fr) auto;
    gap:6px;
    padding:7px 0;
  }

  .pd-transaction-icon{
    width:26px;
    height:26px;
    border-radius:7px;
  }

  .pd-transaction-icon svg{
    width:12px;
    height:12px;
  }

  .pd-transaction-main strong{
    font-size:7px;
  }

  .pd-transaction-main span{
    font-size:5px;
  }

  .amount-income,
  .amount-expense{
    font-size:9px;
    white-space:nowrap;
  }

  .pd-empty{
    min-height:42px;
    font-size:7px;
  }

  .pd-empty-page{
    min-height:50vh;
    padding:18px 12px;
  }

  .pd-loading{
    min-height:55vh;
  }

  .pd-toast-wrap{
    padding:10px;
  }
}

@media(max-width:380px){
  .pd-page{padding-left:5px;padding-right:5px}
  .pd-month-control > div{width:104px}
  .pd-kpi strong{font-size:10px}
  .pd-pie-body{grid-template-columns:80px minmax(0,1fr)}
  .pd-pie{width:74px;height:74px}
  .pd-pie-center{width:47px;height:47px}
  .pd-week-grid{grid-template-columns:1fr 1fr}
}

@media(max-width:460px){
  .pd-pie-body{grid-template-columns:1fr;justify-items:center;gap:9px}
  .pd-pie{width:132px;height:132px}
  .pd-pie-center{width:78px;height:78px}
  .pd-legend{width:100%}
}

@media(max-width:420px){
  .pd-payment-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:6px;
  }
  .pd-payment{
    min-height:98px;
    padding:11px;
  }
  .pd-payment small{
    font-size:8px;
  }
  .pd-payment-count strong{
    font-size:18px;
  }
  .pd-payment-count span{
    font-size:7px;
  }
  .pd-payment-amount{
    font-size:21px;
    margin-top:12px;
  }
}

@media(max-width:650px){
  .pd-page{font-size:14px}
  .pd-empty{font-size:9px}
  .pd-loading strong{font-size:16px}
  .pd-loading span{font-size:10px}
  .pd-empty-page h2{font-size:20px}
  .pd-empty-page p{font-size:11px}
  .pd-empty-page>span{font-size:9px}
  .pd-empty-page button{font-size:10px}
  .pd-toast strong{font-size:12px}
  .pd-toast span{font-size:10px}
  .pd-month-detail-card>span{font-size:8px}
  .pd-month-detail-card>strong{font-size:13px}
  .pd-month-detail-card>small{font-size:7px}
}

/* ===== FINAL MOBILE / CHART / CARD POLISH ===== */

/* All important dashboard text stays readable and bold on small screens. */
.pd-page,
.pd-page button,
.pd-page input,
.pd-page select {
  -webkit-font-smoothing: antialiased;
}

.pd-kpi strong,
.pd-kpi small,
.pd-kpi span,
.pd-savings h2,
.pd-savings strong,
.pd-month-detail-card > span,
.pd-month-detail-card > strong,
.pd-month-detail-card > small,
.pd-pie-head h3,
.pd-pie-head p,
.pd-legend-row strong,
.pd-legend-row span,
.pd-legend-row b,
.pd-progress-main span,
.pd-progress-main b,
.pd-progress-main small,
.pd-info span,
.pd-info b,
.pd-week span,
.pd-week strong,
.pd-week small,
.pd-week em,
.pd-debt-main strong,
.pd-debt-main span,
.pd-debt-main small,
.pd-debt-amount b,
.pd-debt-amount span,
.pd-payment small,
.pd-payment-count strong,
.pd-payment-count span,
.pd-payment-amount,
.pd-quick small,
.pd-quick strong,
.pd-widget-group h4,
.pd-widget-row strong,
.pd-widget-row small,
.pd-widget-row > b {
  font-weight: 800;
}

/* Pie charts are intentionally large and never collapse into tiny circles. */
.pd-pie-body {
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 18px;
}

.pd-pie {
  width: 178px;
  height: 178px;
}

.pd-pie-center {
  width: 108px;
  height: 108px;
}

.pd-pie-center strong {
  font-size: 16px;
  font-weight: 950;
  color: #111827;
  max-width: 92px;
}

.pd-pie-center span {
  font-size: 10px;
  font-weight: 800;
  color: #475569;
}

.pd-legend {
  gap: 10px;
}

.pd-legend-row {
  min-height: 30px;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: 8px;
}

.pd-legend-row i {
  width: 10px;
  height: 10px;
}

.pd-legend-row strong {
  font-size: 12px;
  font-weight: 900;
  color: #111827;
}

.pd-legend-row span {
  margin-top: 2px;
  font-size: 10px;
  font-weight: 800;
  color: #64748b;
}

.pd-legend-row b {
  font-size: 12px;
  font-weight: 950;
  color: #111827;
  white-space: nowrap;
}

/* Every widget row is an independent card with visible separation. */
.pd-widget-list {
  display: grid;
  gap: 10px;
}

.pd-widget-row {
  min-height: 58px;
  padding: 10px 12px;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, .055);
}

.pd-widget-row:hover {
  border-color: #94a3b8;
  box-shadow: 0 7px 18px rgba(15, 23, 42, .09);
}

.pd-widget-row strong {
  font-size: 11px;
  font-weight: 950;
  color: #111827;
}

.pd-widget-row small {
  margin-top: 3px;
  font-size: 9px;
  font-weight: 750;
  color: #64748b;
}

.pd-widget-row > b {
  font-size: 12px;
  font-weight: 950;
  color: #111827;
}

@media (max-width: 800px) {
  .pd-pie-body {
    grid-template-columns: 190px minmax(0, 1fr);
    gap: 16px;
  }

  .pd-pie {
    width: 178px;
    height: 178px;
  }

  .pd-pie-center {
    width: 108px;
    height: 108px;
  }

  .pd-pie-center strong {
    font-size: 16px;
  }

  .pd-legend-row strong {
    font-size: 12px;
  }

  .pd-legend-row b {
    font-size: 12px;
  }
}

@media (max-width: 650px) {
  /* Bigger mobile text throughout the page. */
  .pd-kpi {
    padding: 10px;
    min-height: 88px;
  }

  .pd-kpi small {
    font-size: 9px;
    font-weight: 900;
  }

  .pd-kpi strong {
    font-size: 17px;
    font-weight: 950;
  }

  .pd-kpi span {
    font-size: 9px;
    font-weight: 800;
  }

  .pd-month-detail-card {
    padding: 10px;
    min-height: 78px;
  }

  .pd-month-detail-card > span {
    font-size: 8px;
    font-weight: 900;
  }

  .pd-month-detail-card > strong {
    font-size: 14px;
    font-weight: 950;
  }

  .pd-month-detail-card > small {
    font-size: 8px;
    font-weight: 750;
  }

  .pd-panel {
    padding: 11px;
  }

  .pd-panel-head h3,
  .pd-pie-head h3 {
    font-size: 14px;
    font-weight: 950;
  }

  .pd-panel-head p,
  .pd-pie-head p {
    font-size: 9px;
    font-weight: 750;
  }

  /* Large pie chart on mobile, with large center value. */
  .pd-pie-body {
    grid-template-columns: 190px minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    min-height: 198px;
  }

  .pd-pie {
    width: 180px;
    height: 180px;
  }

  .pd-pie-center {
    width: 110px;
    height: 110px;
  }

  .pd-pie-center strong {
    font-size: 17px;
    font-weight: 950;
  }

  .pd-pie-center span {
    font-size: 10px;
    font-weight: 850;
  }

  .pd-legend {
    gap: 9px;
  }

  .pd-legend-row {
    min-height: 32px;
  }

  .pd-legend-row strong {
    font-size: 11px;
    font-weight: 950;
  }

  .pd-legend-row span {
    font-size: 9px;
    font-weight: 800;
  }

  .pd-legend-row b {
    font-size: 11px;
    font-weight: 950;
  }

  .pd-progress-main span,
  .pd-progress-main b {
    font-size: 10px;
    font-weight: 900;
  }

  .pd-progress-main small {
    font-size: 8px;
    font-weight: 800;
  }

  .pd-info span {
    font-size: 9px;
    font-weight: 800;
  }

  .pd-info b {
    font-size: 10px;
    font-weight: 950;
  }

  .pd-week {
    padding: 11px;
  }

  .pd-week span {
    font-size: 9px;
    font-weight: 900;
  }

  .pd-week strong {
    font-size: 15px;
    font-weight: 950;
  }

  .pd-week small {
    font-size: 8px;
    font-weight: 750;
  }

  .pd-debt-main strong {
    font-size: 11px;
    font-weight: 950;
  }

  .pd-debt-main span,
  .pd-debt-main small {
    font-size: 8px;
    font-weight: 800;
  }

  .pd-debt-amount b {
    font-size: 11px;
    font-weight: 950;
  }

  .pd-debt-amount span {
    font-size: 8px;
    font-weight: 750;
  }

  .pd-payment {
    min-height: 112px;
    padding: 12px;
  }

  .pd-payment small {
    font-size: 10px;
    font-weight: 950;
  }

  .pd-payment-count strong {
    font-size: 22px;
    font-weight: 950;
  }

  .pd-payment-count span {
    font-size: 9px;
    font-weight: 800;
  }

  .pd-payment-amount {
    font-size: 24px;
    font-weight: 950;
  }

  .pd-quick {
    padding: 11px;
  }

  .pd-quick small {
    font-size: 8px;
    font-weight: 850;
  }

  .pd-quick strong {
    font-size: 12px;
    font-weight: 950;
  }

  /* Separate widget cards; never merge/touch each other. */
  .pd-widget-list {
    gap: 10px;
  }

  .pd-widget-row {
    min-height: 62px;
    padding: 11px 12px;
    border: 1.5px solid #111827;
    border-radius: 13px;
    box-shadow: 0 5px 14px rgba(15, 23, 42, .07);
  }

  .pd-widget-row strong {
    font-size: 12px;
    font-weight: 950;
  }

  .pd-widget-row small {
    font-size: 9px;
    font-weight: 800;
  }

  .pd-widget-row > b {
    font-size: 13px;
    font-weight: 950;
  }

  .pd-widget-group h4 {
    margin: 10px 0 7px;
    font-size: 10px;
    font-weight: 950;
    color: #111827;
  }

  /* Avoid horizontal overflow caused by the intentionally large charts. */
  .pd-pie-card {
    overflow: hidden;
  }
}

@media (max-width: 430px) {
  .pd-pie-body {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 14px;
    min-height: 0;
  }

  .pd-pie {
    width: 190px;
    height: 190px;
  }

  .pd-pie-center {
    width: 114px;
    height: 114px;
  }

  .pd-pie-center strong {
    font-size: 18px;
  }

  .pd-legend {
    width: 100%;
  }

  .pd-legend-row {
    width: 100%;
  }

  .pd-legend-row strong {
    font-size: 12px;
  }

  .pd-legend-row b {
    font-size: 12px;
  }
}

`;

export { PERFORMANCE_URL, WIDGETS_URL };
