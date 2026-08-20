import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  DollarSign,
  PieChart,
  PiggyBank,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";

/*
  ============================================================
  Performance.jsx
  ============================================================

  Frontend endpoint mapping for the supplied performance API:

    GET /api/performance?month=1%20Aug%202026
    GET /api/performance/widgets?month=1%20Aug%202026

  Change API_ROOT only if your app.use() mount is different.

  The JSX follows the response structure:
    data.month
    data.summary
    data.income_breakdown
    data.expense_breakdown
    data.loan_borrow_summary
    data.payment_summary
    data.recent_transactions
    data.quick_stats

  Important:
  This page does not invent database columns.
  It reads the API response fields only.
*/

const API_ROOT = "http://localhost:5000/api";
const DASHBOARD_ENDPOINT = `${API_ROOT}/performance`;
const WIDGETS_ENDPOINT = `${API_ROOT}/performance/widgets`;

const formatMonthQuery = (date) =>
  `${date.getDate()} ${date.toLocaleString("en-US", {
    month: "short",
  })} ${date.getFullYear()}`;

const formatMonthLabel = (date) =>
  date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return String(value);

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const number = (value) =>
  new Intl.NumberFormat("en-IN").format(
    Number(value) || 0
  );

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const safeObject = (value) =>
  value && typeof value === "object" ? value : {};

export default function Performance() {
  const [selectedMonth, setSelectedMonth] =
    useState(new Date());

  const [dashboardData, setDashboardData] =
    useState(null);

  const [widgets, setWidgets] = useState({
    top_expenses: [],
    upcoming_emis: [],
    overdue_payments: [],
  });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [toast, setToast] =
    useState(null);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    "";

  const axiosConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),
    [token]
  );

  const showToast = useCallback(
    (type, message) => {
      setToast({
        type,
        message,
      });

      clearTimeout(
        window.__performanceToast
      );

      window.__performanceToast =
        setTimeout(() => {
          setToast(null);
        }, 2600);
    },
    []
  );

  const fetchPerformance = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        setError("");

        const month =
          formatMonthQuery(selectedMonth);

        const dashboardResponse =
          await axios.get(
            DASHBOARD_ENDPOINT,
            {
              ...axiosConfig,
              params: { month },
            }
          );

        const dashboardPayload =
          dashboardResponse.data;

        if (
          !dashboardPayload?.success
        ) {
          throw new Error(
            dashboardPayload?.error ||
              "Failed to load performance data."
          );
        }

        setDashboardData(
          dashboardPayload.data || null
        );

        // Optional widgets endpoint intentionally not required
        // for the main Performance page.
      } catch (err) {
        console.error(
          "Performance API error:",
          err
        );

        const message =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Could not load performance.";

        setError(message);
        showToast("error", message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [
      selectedMonth,
      axiosConfig,
      showToast,
    ]
  );

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  useEffect(() => {
    const timer = setInterval(
      () => fetchPerformance(true),
      60000
    );

    return () =>
      clearInterval(timer);
  }, [fetchPerformance]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchPerformance();
    setRefreshing(false);

    showToast(
      "success",
      "Performance refreshed."
    );
  };

  const previousMonth = () => {
    setSelectedMonth((old) => {
      const d = new Date(old);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const nextMonth = () => {
    setSelectedMonth((old) => {
      const d = new Date(old);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const currentMonth = () =>
    setSelectedMonth(new Date());

  const summary = safeObject(
    dashboardData?.summary
  );

  const income =
    safeObject(
      dashboardData?.income_breakdown
    );

  const expenses =
    safeObject(
      dashboardData?.expense_breakdown
    );

  const debt =
    safeObject(
      dashboardData?.loan_borrow_summary
    );

  const payments =
    safeObject(
      dashboardData?.payment_summary
    );

  const recent =
    safeArray(
      dashboardData?.recent_transactions
    );

  const activeLoans =
    safeArray(debt.active_loans);

  const activeBorrows =
    safeArray(debt.active_borrows);

  const categories =
    safeArray(expenses.categories);

  const weekly =
    safeArray(expenses.weekly);

  const paymentTotals =
    safeObject(payments.totals);

  const paymentBreakdown =
    safeObject(payments.breakdown);

  const savingsStatus =
    summary.savings_status ||
    "break_even";

  return (
    <>
      <style>{styles}</style>

      <main className="performance-page">
        <div className="performance-shell">

          {/* HEADER */}
          <header className="performance-header">

            <div className="performance-header-top">

              <div className="performance-brand">

                <div className="performance-brand-icon">
                  <PieChart size={23} />
                </div>

                <div>
                  <h1>Performance</h1>

                  <p>
                    Complete financial
                    performance dashboard
                  </p>
                </div>
              </div>

              <div className="performance-actions">

                <button
                  className="performance-head-btn"
                  onClick={
                    currentMonth
                  }
                >
                  <CalendarDays size={15} />
                  <span>Current</span>
                </button>

                <button
                  className="performance-head-btn"
                  onClick={refresh}
                  disabled={refreshing}
                >
                  <RefreshCw
                    size={15}
                    className={
                      refreshing
                        ? "performance-spin"
                        : ""
                    }
                  />

                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="performance-month-row">

              <div>
                <span className="performance-period-label">
                  SELECTED MONTH
                </span>

                <strong className="performance-period-value">
                  {formatMonthLabel(
                    selectedMonth
                  )}
                </strong>
              </div>

              <div className="performance-month-control">

                <button
                  onClick={
                    previousMonth
                  }
                >
                  <ChevronLeft size={17} />
                </button>

                <div>
                  <CalendarDays size={14} />
                  <span>
                    {formatMonthQuery(
                      selectedMonth
                    )}
                  </span>
                </div>

                <button
                  onClick={nextMonth}
                >
                  <ChevronRight
                    size={17}
                  />
                </button>
              </div>
            </div>
          </header>

          {/* ERROR */}
          {error && (
            <div className="performance-error">

              <AlertCircle size={18} />

              <div>
                <strong>
                  Performance API Error
                </strong>

                <span>
                  {error}
                </span>
              </div>

              <button
                onClick={() =>
                  setError("")
                }
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* LOADING */}
          {loading && !dashboardData ? (
            <section className="performance-loading">
              <div className="performance-loading-icon">
                <RefreshCw
                  size={27}
                  className="performance-spin"
                />
              </div>

              <strong>
                Loading Performance
              </strong>

              <span>
                Preparing your monthly
                financial dashboard...
              </span>
            </section>
          ) : null}

          {dashboardData ? (
            <>
              {/* SUMMARY */}
              <section className="performance-summary-grid">

                <SummaryCard
                  icon={<Wallet />}
                  title="Total Income"
                  value={currency(
                    summary.total_income
                  )}
                  subtitle={`Work ${currency(
                    summary.total_work
                  )}`}
                  tone="income"
                />

                <SummaryCard
                  icon={<TrendingDown />}
                  title="Total Expenses"
                  value={currency(
                    summary.total_expenses
                  )}
                  subtitle={`${number(
                    summary.expense_count
                  )} transactions`}
                  tone="expense"
                />

                <SummaryCard
                  icon={<DollarSign />}
                  title="Total Borrow"
                  value={currency(
                    summary.total_borrow
                  )}
                  subtitle={`${number(
                    summary.borrow_count
                  )} records`}
                  tone="borrow"
                />

                <SummaryCard
                  icon={<CreditCard />}
                  title="EMI Paid"
                  value={currency(
                    summary.total_emi_paid
                  )}
                  subtitle={`${number(
                    summary.emi_count
                  )} payments`}
                  tone="emi"
                />

                <SummaryCard
                  icon={<PiggyBank />}
                  title="Total Savings"
                  value={currency(
                    summary.total_savings
                  )}
                  subtitle={
                    summary.savings_status_message ||
                    "Break Even"
                  }
                  tone={
                    savingsStatus === "profit"
                      ? "profit"
                      : savingsStatus === "loss"
                      ? "loss"
                      : "break"
                  }
                  rate={
                    summary.savings_rate
                  }
                />
              </section>

              {/* SAVINGS */}
              <section
                className={`performance-savings ${savingsStatus}`}
              >

                <div className="performance-savings-main">

                  <div className="performance-savings-icon">
                    {savingsStatus ===
                    "profit" ? (
                      <Trophy size={23} />
                    ) : savingsStatus ===
                      "loss" ? (
                      <AlertCircle
                        size={23}
                      />
                    ) : (
                      <PiggyBank
                        size={23}
                      />
                    )}
                  </div>

                  <div>
                    <span>
                      MONTHLY SAVINGS STATUS
                    </span>

                    <h2>
                      {summary.savings_status_message ||
                        "⚖️ Break Even"}
                    </h2>

                    <p>
                      Total Savings =
                      Income − Expenses −
                      EMI Paid
                    </p>
                  </div>
                </div>

                <div className="performance-savings-rate">
                  <div>
                    <span>
                      SAVINGS RATE
                    </span>

                    <strong>
                      {Number(
                        summary.savings_rate ||
                          0
                      ).toFixed(1)}
                      %
                    </strong>
                  </div>

                  <div className="performance-ring">

                    <svg
                      viewBox="0 0 42 42"
                    >
                      <circle
                        cx="21"
                        cy="21"
                        r="16"
                        fill="none"
                        stroke="rgba(255,255,255,.18)"
                        strokeWidth="4"
                      />

                      <circle
                        cx="21"
                        cy="21"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min(
                          Math.abs(
                            Number(
                              summary.savings_rate ||
                                0
                            )
                          ),
                          100
                        )} 100`}
                        transform="rotate(-90 21 21)"
                      />
                    </svg>

                    <strong>
                      {Math.abs(
                        Number(
                          summary.savings_rate ||
                            0
                        )
                      ).toFixed(0)}
                      %
                    </strong>
                  </div>
                </div>
              </section>

              {/* INCOME + EXPENSE */}
              <section className="performance-pie-grid">
                <PieChartCard
                  title="Income Distribution"
                  subtitle="Work vs Business"
                  parts={[
                    { label: "Work", value: Number(income.work_payment) || 0, color: "#10b981" },
                    { label: "Business", value: Number(income.business_payment) || 0, color: "#6366f1" },
                  ]}
                />

                <PieChartCard
                  title="Expense Distribution"
                  subtitle="Category distribution"
                  parts={categories.slice(0, 6).map((category, index) => ({
                    label: category.category_name,
                    value: Number(category.total_amount) || 0,
                    color:
                      category.color ||
                      ["#ef4444", "#f97316", "#eab308", "#06b6d4", "#8b5cf6", "#ec4899"][index % 6],
                  }))}
                />

                <PieChartCard
                  title="Payment Status"
                  subtitle="Received / Pending / Overdue / Lost"
                  parts={[
                    { label: "Received", value: Number(paymentTotals.received) || 0, color: "#10b981" },
                    { label: "Pending", value: Number(paymentTotals.pending) || 0, color: "#f59e0b" },
                    { label: "Overdue", value: Number(paymentTotals.overdue) || 0, color: "#ef4444" },
                    { label: "Lost", value: Number(paymentTotals.lost) || 0, color: "#475569" },
                  ]}
                />
              </section>

              <section className="performance-two-column">

                <Panel
                  title="Income Breakdown"
                  subtitle="Work and Business"
                  icon={
                    <ArrowUpRight />
                  }
                  tone="green"
                >
                  <ProgressRow
                    name="Work Payment"
                    icon="💼"
                    total={
                      income.work_payment
                    }
                    percentage={
                      income.work_percentage
                    }
                    color="#10b981"
                  />

                  <ProgressRow
                    name="Business Payment"
                    icon="🏢"
                    total={
                      income.business_payment
                    }
                    percentage={
                      income.business_percentage
                    }
                    color="#6366f1"
                  />

                  <Divider />

                  <InfoRow
                    label="Total Income"
                    value={currency(
                      summary.total_income
                    )}
                    tone="green"
                  />

                  <InfoRow
                    label="Total Work Count"
                    value={number(
                      income.total_work_count
                    )}
                  />

                  <InfoRow
                    label="Total Business Count"
                    value={number(
                      income.total_business_count
                    )}
                  />
                </Panel>

                <Panel
                  title="Expense Breakdown"
                  subtitle="Category-wise spending"
                  icon={
                    <ArrowDownRight />
                  }
                  tone="red"
                >
                  <div className="performance-scroll">

                    {categories.length > 0 ? (
                      categories.map(
                        (category) => (
                          <ProgressRow
                            key={
                              category.category_id
                            }
                            name={
                              category.category_name
                            }
                            icon={
                              category.icon ||
                              "📊"
                            }
                            total={
                              category.total_amount
                            }
                            percentage={
                              category.percentage
                            }
                            color={
                              category.color ||
                              "#ef4444"
                            }
                          />
                        )
                      )
                    ) : (
                      <EmptyState
                        text="No expenses this month"
                      />
                    )}
                  </div>

                  <Divider />

                  <InfoRow
                    label="Total Expenses"
                    value={currency(
                      summary.total_expenses
                    )}
                    tone="red"
                  />
                </Panel>
              </section>

              {/* WEEKLY */}
              <Panel
                title="Weekly Expenses"
                subtitle="1–7, 8–14, 15–21, 22–end"
                icon={<BarChart3 />}
                tone="blue"
                className="performance-section"
              >
                <div className="performance-week-grid">

                  {weekly.map(
                    (week) => (
                      <div
                        className="performance-week"
                        key={
                          week.week_number
                        }
                      >
                        <div>
                          <span>
                            {week.week_label}
                          </span>

                          <BarChart3
                            size={14}
                          />
                        </div>

                        <strong>
                          {currency(
                            week.total_amount
                          )}
                        </strong>

                        <small>
                          {number(
                            week.expense_count
                          )}{" "}
                          items
                        </small>

                        <div className="performance-week-track">
                          <div
                            style={{
                              width: `${Math.min(
                                Number(
                                  week.percentage ||
                                    0
                                ),
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <em>
                          {Number(
                            week.percentage ||
                              0
                          ).toFixed(1)}
                          %
                        </em>
                      </div>
                    )
                  )}
                </div>
              </Panel>

              {/* LOANS + BORROWS */}
              <section className="performance-two-column performance-section">

                <Panel
                  title="Active Loans"
                  subtitle={`${number(
                    activeLoans.length
                  )} active records`}
                  icon={<Building2 />}
                  tone="purple"
                >
                  {activeLoans.length > 0 ? (
                    <div className="performance-stack">
                      {activeLoans.map(
                        (loan) => (
                          <DebtRow
                            key={
                              loan.id
                            }
                            type="loan"
                            title={
                              loan.bank_name ||
                              "Loan"
                            }
                            amount={
                              loan.total_loan_amount
                            }
                            secondary={`Paid ${currency(
                              loan.total_paid
                            )}`}
                            meta={`${number(
                              loan.remaining_emis
                            )} EMIs left • ${currency(
                              loan.emi_amount
                            )}/mo`}
                            timing={
                              Number(
                                loan.days_until_next_emi
                              ) > 0
                                ? `${number(
                                    loan.days_until_next_emi
                                  )} days`
                                : "Due today"
                            }
                          />
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      text="No active loans"
                    />
                  )}

                  {Number(
                    debt.total_remaining_loan_amount
                  ) > 0 && (
                    <>
                      <Divider />

                      <InfoRow
                        label="Total Remaining Loan"
                        value={currency(
                          debt.total_remaining_loan_amount
                        )}
                        tone="purple"
                      />
                    </>
                  )}
                </Panel>

                <Panel
                  title="Active Borrows"
                  subtitle={`${number(
                    activeBorrows.length
                  )} active records`}
                  icon={<Users />}
                  tone="orange"
                >
                  {activeBorrows.length >
                  0 ? (
                    <div className="performance-stack">
                      {activeBorrows.map(
                        (borrow) => (
                          <DebtRow
                            key={
                              borrow.id
                            }
                            type="borrow"
                            title={
                              borrow.person_name ||
                              "Borrow"
                            }
                            amount={
                              borrow.remaining_amount
                            }
                            secondary={`of ${currency(
                              borrow.borrow_amount
                            )}`}
                            meta={`Due ${formatDate(
                              borrow.return_date
                            )}`}
                            timing={
                              Number(
                                borrow.days_remaining
                              ) > 0
                                ? `${number(
                                    borrow.days_remaining
                                  )} days left`
                                : "Overdue"
                            }
                          />
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      text="No active borrows"
                    />
                  )}

                  {Number(
                    debt.total_remaining_borrow_amount
                  ) > 0 && (
                    <>
                      <Divider />

                      <InfoRow
                        label="Total Remaining Borrow"
                        value={currency(
                          debt.total_remaining_borrow_amount
                        )}
                        tone="orange"
                      />
                    </>
                  )}
                </Panel>
              </section>

              {/* PAYMENT SUMMARY */}
              <Panel
                title="Payment Summary"
                subtitle="Received, pending, overdue and lost"
                icon={<Wallet />}
                tone="cyan"
                className="performance-section"
              >
                <div className="performance-payment-grid">

                  <PaymentCard
                    title="Received"
                    value={
                      paymentTotals.received
                    }
                    count={
                      paymentBreakdown
                        .received
                        ?.count
                    }
                    tone="received"
                  />

                  <PaymentCard
                    title="Pending"
                    value={
                      paymentTotals.pending
                    }
                    count={
                      paymentBreakdown
                        .pending
                        ?.count
                    }
                    tone="pending"
                  />

                  <PaymentCard
                    title="Overdue"
                    value={
                      paymentTotals.overdue
                    }
                    count={
                      paymentBreakdown
                        .overdue
                        ?.count
                    }
                    tone="overdue"
                  />

                  <PaymentCard
                    title="Lost"
                    value={
                      paymentTotals.lost
                    }
                    count={
                      paymentBreakdown
                        .lost
                        ?.count
                    }
                    tone="lost"
                  />
                </div>
              </Panel>

              {/* WIDGET DATA */}
              <section className="performance-two-column performance-section">

                <Panel
                  title="Top Expenses"
                  subtitle="Top 5 categories"
                  icon={<TrendingDown />}
                  tone="red"
                >
                  {safeArray(
                    widgets.top_expenses
                  ).length > 0 ? (
                    <div className="performance-stack">
                      {widgets.top_expenses.map(
                        (item, index) => (
                          <div
                            className="performance-mini-row"
                            key={`${item.category_name}-${index}`}
                          >
                            <span>
                              {item.icon ||
                                "📊"}
                            </span>

                            <div>
                              <strong>
                                {
                                  item.category_name
                                }
                              </strong>
                            </div>

                            <b>
                              {currency(
                                item.total_amount
                              )}
                            </b>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      text="No top expense data"
                    />
                  )}
                </Panel>

                <Panel
                  title="Upcoming EMIs"
                  subtitle="Next 5 installments"
                  icon={<Clock3 />}
                  tone="purple"
                >
                  {safeArray(
                    widgets.upcoming_emis
                  ).length > 0 ? (
                    <div className="performance-stack">
                      {widgets.upcoming_emis.map(
                        (emi) => (
                          <div
                            className="performance-mini-row"
                            key={emi.id}
                          >
                            <span className="performance-mini-icon purple">
                              <CreditCard
                                size={13}
                              />
                            </span>

                            <div>
                              <strong>
                                {
                                  emi.bank_name
                                }
                              </strong>

                              <small>
                                {formatDate(
                                  emi.next_emi_date
                                )}
                              </small>
                            </div>

                            <b>
                              {currency(
                                emi.emi_amount
                              )}
                            </b>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      text="No upcoming EMIs"
                    />
                  )}
                </Panel>

                <Panel
                  title="Overdue Payments"
                  subtitle="Payments requiring attention"
                  icon={<AlertCircle />}
                  tone="red"
                >
                  {safeArray(
                    widgets.overdue_payments
                  ).length > 0 ? (
                    <div className="performance-stack">
                      {widgets.overdue_payments.map(
                        (payment) => (
                          <div
                            className="performance-mini-row"
                            key={payment.id}
                          >
                            <span className="performance-mini-icon red">
                              <AlertCircle
                                size={13}
                              />
                            </span>

                            <div>
                              <strong>
                                {
                                  payment.person_name
                                }
                              </strong>

                              <small>
                                {number(
                                  payment.days_overdue
                                )}{" "}
                                days overdue
                              </small>
                            </div>

                            <b>
                              {currency(
                                payment.amount
                              )}
                            </b>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      text="No overdue payments"
                    />
                  )}
                </Panel>
              </section>

              {/* RECENT TRANSACTIONS */}
              <Panel
                title="Recent Transactions"
                subtitle="Latest 10 transactions"
                icon={<Clock3 />}
                tone="blue"
                className="performance-section"
              >
                {recent.length > 0 ? (
                  <div className="performance-transactions">
                    {recent.map(
                      (transaction) => (
                        <Transaction
                          key={`${transaction.type}-${transaction.id}`}
                          transaction={
                            transaction
                          }
                        />
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState
                    text="No transactions this month"
                  />
                )}
              </Panel>
            </>
          ) : null}
        </div>
      </main>

      {toast && (
        <div className="performance-toast-wrap">
          <div
            className={`performance-toast ${toast.type}`}
          >
            {toast.type ===
            "success" ? (
              <CheckCircle2
                size={18}
              />
            ) : (
              <AlertCircle
                size={18}
              />
            )}

            <div>
              <strong>
                {toast.type ===
                "success"
                  ? "Success"
                  : "Error"}
              </strong>

              <span>
                {toast.message}
              </span>
            </div>

            <button
              onClick={() =>
                setToast(null)
              }
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  subtitle,
  tone,
  rate,
}) {
  return (
    <div
      className={`performance-summary-card ${tone}`}
    >
      <div className="performance-summary-top">
        <div>
          <span>{title}</span>
          <strong>{value}</strong>
          <small>{subtitle}</small>
        </div>

        <div className="performance-summary-icon">
          {icon}
        </div>
      </div>

      {rate !== undefined && (
        <div className="performance-summary-rate">
          <TrendingUp size={11} />
          {Number(rate || 0).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

function PieChartCard({ title, subtitle, parts }) {
  const total = parts.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  let cursor = 0;

  const segments = parts
    .filter((item) => (Number(item.value) || 0) > 0)
    .map((item) => {
      const start = cursor;
      const percent = total > 0 ? (Number(item.value) / total) * 100 : 0;
      cursor += percent;
      return `${item.color} ${start}% ${cursor}%`;
    });

  const background =
    segments.length > 0
      ? `conic-gradient(${segments.join(", ")})`
      : "#e2e8f0";

  return (
    <section className="performance-pie-card">
      <div className="performance-pie-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="performance-pie-icon">
          <PieChart size={16} />
        </div>
      </div>

      <div className="performance-pie-content">
        <div className="performance-pie" style={{ background }}>
          <div className="performance-pie-center">
            <strong>{currency(total)}</strong>
            <span>Total</span>
          </div>
        </div>

        <div className="performance-pie-legend">
          {parts.length === 0 ? (
            <EmptyState text="No data available" />
          ) : (
            parts.map((item) => {
              const value = Number(item.value) || 0;
              const percent = total > 0 ? (value / total) * 100 : 0;

              return (
                <div className="performance-legend-row" key={item.label}>
                  <span
                    className="performance-legend-dot"
                    style={{ background: item.color }}
                  />
                  <div>
                    <strong>{item.label}</strong>
                    <small>{percent.toFixed(1)}%</small>
                  </div>
                  <b>{currency(value)}</b>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  tone,
  children,
  className = "",
}) {
  return (
    <section
      className={`performance-panel ${className}`}
    >
      <div className="performance-panel-heading">
        <div
          className={`performance-panel-icon ${tone}`}
        >
          {icon}
        </div>

        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="performance-panel-content">
        {children}
      </div>
    </section>
  );
}

function ProgressRow({
  name,
  icon,
  total,
  percentage,
  color,
}) {
  const width = Math.min(
    Math.max(
      Number(percentage) || 0,
      0
    ),
    100
  );

  return (
    <div className="performance-progress">
      <div className="performance-progress-icon">
        {icon || "📊"}
      </div>

      <div className="performance-progress-main">
        <div className="performance-progress-top">
          <span>{name}</span>
          <strong>
            {currency(total)}
          </strong>
        </div>

        <div className="performance-progress-track">
          <div
            style={{
              width: `${width}%`,
              background: color,
            }}
          />
        </div>

        <small>
          {width.toFixed(1)}%
        </small>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  tone = "",
}) {
  return (
    <div className="performance-info-row">
      <span>{label}</span>
      <strong
        className={
          tone
            ? `performance-${tone}`
            : ""
        }
      >
        {value}
      </strong>
    </div>
  );
}

function Divider() {
  return (
    <div className="performance-divider" />
  );
}

function DebtRow({
  type,
  title,
  amount,
  secondary,
  meta,
  timing,
}) {
  return (
    <div
      className={`performance-debt ${type}`}
    >
      <div className="performance-debt-icon">
        {type === "loan" ? (
          <CreditCard size={16} />
        ) : (
          <Users size={16} />
        )}
      </div>

      <div className="performance-debt-main">
        <strong>{title}</strong>

        <span>
          {meta}
        </span>

        <small
          className={
            timing === "Due today" ||
            timing === "Overdue"
              ? "danger"
              : "success"
          }
        >
          {timing}
        </small>
      </div>

      <div className="performance-debt-amount">
        <strong>
          {currency(amount)}
        </strong>

        <small>
          {secondary}
        </small>
      </div>
    </div>
  );
}

function PaymentCard({
  title,
  value,
  count,
  tone,
}) {
  return (
    <div
      className={`performance-payment-card ${tone}`}
    >
      <span>{title}</span>

      <strong>
        {currency(value)}
      </strong>

      <small>
        {number(count)}{" "}
        {Number(count) === 1
          ? "payment"
          : "payments"}
      </small>
    </div>
  );
}

function Transaction({
  transaction,
}) {
  const expense =
    transaction.type ===
    "expense";

  return (
    <div className="performance-transaction">
      <div
        className={`performance-transaction-icon ${
          expense ? "expense" : "income"
        }`}
      >
        {expense ? (
          <ArrowDownRight size={15} />
        ) : (
          <ArrowUpRight size={15} />
        )}
      </div>

      <div className="performance-transaction-main">
        <strong>
          {transaction.name ||
            transaction.description ||
            "Unknown"}
        </strong>

        <span>
          {transaction.display_date ||
            formatDate(
              transaction.transaction_date
            )}

          <i>•</i>

          {transaction.type}
        </span>
      </div>

      <strong
        className={
          expense
            ? "performance-expense"
            : "performance-income"
        }
      >
        {expense ? "-" : "+"}
        {currency(
          transaction.amount
        )}
      </strong>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="performance-empty">
      <ActivityIcon />
      <span>{text}</span>
    </div>
  );
}

function ActivityIcon() {
  return (
    <div className="performance-empty-icon">
      <Zap size={16} />
    </div>
  );
}

const styles = `
*{box-sizing:border-box}
body{margin:0;background:#f5f7fb}
.performance-page{
  min-height:100vh;
  padding:14px;
  color:#172033;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:
    radial-gradient(circle at 3% 0%,rgba(79,70,229,.10),transparent 28%),
    radial-gradient(circle at 97% 6%,rgba(14,165,233,.08),transparent 24%),
    linear-gradient(135deg,#f8fafc,#eef2ff 52%,#f8fafc);
}
.performance-shell{width:min(1240px,100%);margin:auto}

/* HEADER */
.performance-header{
  position:sticky;top:8px;z-index:30;
  padding:16px;border-radius:21px;margin-bottom:10px;
  color:#fff;overflow:hidden;
  background:
    radial-gradient(circle at 100% 0%,rgba(255,255,255,.14),transparent 30%),
    linear-gradient(135deg,#1e1b4b,#4338ca 52%,#7c3aed);
  box-shadow:0 20px 50px rgba(49,46,129,.22);
}
.performance-header:after{
  content:"";position:absolute;right:-120px;top:-180px;width:310px;height:310px;
  border-radius:999px;background:rgba(255,255,255,.07)
}
.performance-header-top{
  position:relative;z-index:1;
  display:flex;align-items:center;justify-content:space-between;gap:12px
}
.performance-brand{display:flex;align-items:center;gap:10px;min-width:0}
.performance-brand-icon{
  width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;border-radius:13px;
  background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18)
}
.performance-brand h1{margin:0;font-size:24px;font-weight:950;letter-spacing:-.045em}
.performance-brand p{margin:3px 0 0;color:#d9ddf7;font-size:9px}
.performance-actions{display:flex;gap:6px}
.performance-head-btn{
  height:37px;padding:0 11px;border-radius:10px;
  display:flex;align-items:center;gap:5px;
  border:1px solid rgba(255,255,255,.15);
  background:rgba(255,255,255,.09);color:#fff;
  font-size:9px;font-weight:900;cursor:pointer
}
.performance-head-btn:hover{background:rgba(255,255,255,.16);transform:translateY(-1px)}
.performance-head-btn:disabled{opacity:.6}
.performance-month-row{
  position:relative;z-index:1;
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.13)
}
.performance-period-label{display:block;color:#aeb8db;font-size:7px;letter-spacing:.12em;font-weight:900}
.performance-period-value{display:block;margin-top:3px;font-size:13px;font-weight:900}
.performance-month-control{display:flex;align-items:center;gap:5px}
.performance-month-control>button{
  width:35px;height:35px;border:0;border-radius:9px;
  display:grid;place-items:center;color:#fff;background:rgba(255,255,255,.10);cursor:pointer
}
.performance-month-control>button:hover{background:rgba(255,255,255,.18)}
.performance-month-control>div{
  min-width:160px;height:35px;padding:0 9px;border-radius:9px;
  display:flex;align-items:center;justify-content:center;gap:6px;
  background:rgba(255,255,255,.10);font-size:9px;font-weight:900
}

/* ERROR */
.performance-error{
  display:flex;align-items:flex-start;gap:8px;padding:11px 12px;margin-bottom:10px;
  border:1px solid #fecdd3;border-radius:12px;background:#fff1f2;color:#9f1239
}
.performance-error>div{flex:1;min-width:0}.performance-error strong{display:block;font-size:10px}.performance-error span{display:block;margin-top:2px;font-size:9px;overflow-wrap:anywhere}
.performance-error button{width:27px;height:27px;border:0;border-radius:7px;background:#ffe4e6;color:#be123c;display:grid;place-items:center;cursor:pointer}

/* SUMMARY */
.performance-summary-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:9px}
.performance-summary-card{
  position:relative;min-width:0;padding:13px;border-radius:15px;background:#fff;border:1px solid #e2e8f0;
  box-shadow:0 8px 24px rgba(15,23,42,.055);overflow:hidden;transition:.2s
}
.performance-summary-card:hover{transform:translateY(-3px);box-shadow:0 15px 34px rgba(15,23,42,.09)}
.performance-summary-card:after{content:"";position:absolute;width:85px;height:85px;right:-42px;top:-42px;border-radius:50%;opacity:.16;background:currentColor}
.performance-summary-top{position:relative;z-index:1;display:flex;justify-content:space-between;gap:7px}
.performance-summary-card>div>span{display:block;color:#64748b;font-size:7px;text-transform:uppercase;letter-spacing:.06em;font-weight:900}
.performance-summary-card>div>strong{display:block;margin-top:5px;color:#111827;font-size:17px;font-weight:950;letter-spacing:-.035em;overflow-wrap:anywhere}
.performance-summary-card>div>small{display:block;margin-top:3px;color:#94a3b8;font-size:7px;overflow-wrap:anywhere}
.performance-summary-icon{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:grid;place-items:center}
.performance-summary-card.income{color:#10b981}.performance-summary-card.income .performance-summary-icon{background:#d1fae5;color:#047857}
.performance-summary-card.expense{color:#ef4444}.performance-summary-card.expense .performance-summary-icon{background:#fee2e2;color:#dc2626}
.performance-summary-card.borrow{color:#f97316}.performance-summary-card.borrow .performance-summary-icon{background:#ffedd5;color:#c2410c}
.performance-summary-card.emi{color:#8b5cf6}.performance-summary-card.emi .performance-summary-icon{background:#ede9fe;color:#6d28d9}
.performance-summary-card.profit{color:#10b981}.performance-summary-card.profit .performance-summary-icon{background:#d1fae5;color:#047857}
.performance-summary-card.loss{color:#ef4444}.performance-summary-card.loss .performance-summary-icon{background:#fee2e2;color:#dc2626}
.performance-summary-card.break{color:#f59e0b}.performance-summary-card.break .performance-summary-icon{background:#fef3c7;color:#b45309}
.performance-summary-rate{position:relative;z-index:1;display:flex;align-items:center;gap:3px;margin-top:5px;color:#059669;font-size:8px;font-weight:900}

/* PIE CHARTS */
.performance-pie-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:9px}
.performance-pie-card{padding:13px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 8px 25px rgba(15,23,42,.055);transition:.2s}
.performance-pie-card:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(15,23,42,.08)}
.performance-pie-header{display:flex;align-items:center;justify-content:space-between;gap:7px;margin-bottom:10px}
.performance-pie-header h3{margin:0;font-size:12px;font-weight:950}
.performance-pie-header p{margin:2px 0 0;color:#94a3b8;font-size:7px}
.performance-pie-icon{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:#eef2ff;color:#4f46e5}
.performance-pie-content{display:grid;grid-template-columns:95px minmax(0,1fr);align-items:center;gap:10px}
.performance-pie{width:92px;height:92px;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 1px rgba(15,23,42,.05)}
.performance-pie-center{width:58px;height:58px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 5px 16px rgba(15,23,42,.08)}
.performance-pie-center strong{color:#172033;font-size:8px;font-weight:950;max-width:52px;overflow-wrap:anywhere}
.performance-pie-center span{color:#94a3b8;font-size:6px;margin-top:2px}
.performance-pie-legend{min-width:0;display:grid;gap:5px}
.performance-legend-row{display:grid;grid-template-columns:7px minmax(0,1fr) auto;align-items:center;gap:5px}
.performance-legend-dot{width:7px;height:7px;border-radius:50%}
.performance-legend-row div{min-width:0}
.performance-legend-row strong{display:block;color:#334155;font-size:7px;font-weight:850;overflow-wrap:anywhere}
.performance-legend-row small{color:#94a3b8;font-size:6px}
.performance-legend-row b{color:#172033;font-size:7px;white-space:nowrap}

/* SAVINGS */
.performance-savings{
  display:flex;align-items:center;justify-content:space-between;gap:15px;
  padding:15px 16px;border-radius:16px;margin-bottom:9px;color:#fff;
  box-shadow:0 13px 35px rgba(15,23,42,.14)
}
.performance-savings.profit{background:linear-gradient(135deg,#065f46,#059669)}
.performance-savings.loss{background:linear-gradient(135deg,#991b1b,#dc2626)}
.performance-savings.break_even{background:linear-gradient(135deg,#92400e,#d97706)}
.performance-savings-main{display:flex;align-items:center;gap:10px;min-width:0}
.performance-savings-icon{
  width:40px;height:40px;flex:0 0 40px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.13)
}
.performance-savings-main>div>span,.performance-savings-rate span{display:block;color:rgba(255,255,255,.65);font-size:7px;letter-spacing:.11em;font-weight:900}
.performance-savings-main h2{margin:3px 0 0;font-size:16px;font-weight:950;overflow-wrap:anywhere}
.performance-savings-main p{margin:3px 0 0;color:rgba(255,255,255,.70);font-size:8px}
.performance-savings-rate{display:flex;align-items:center;gap:9px}.performance-savings-rate strong{display:block;margin-top:3px;font-size:20px;font-weight:950}
.performance-ring{position:relative;width:52px;height:52px;display:grid;place-items:center}.performance-ring svg{position:absolute;inset:0;width:100%;height:100%}.performance-ring strong{position:relative;font-size:9px}

/* PANELS */
.performance-two-column{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-bottom:9px}
.performance-section{margin-bottom:9px}
.performance-panel{padding:13px;border-radius:16px;background:rgba(255,255,255,.97);border:1px solid #e2e8f0;box-shadow:0 8px 25px rgba(15,23,42,.055)}
.performance-panel-heading{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.performance-panel-icon{
  width:34px;height:34px;flex:0 0 34px;display:grid;place-items:center;border-radius:10px
}
.performance-panel-icon.green{background:#d1fae5;color:#047857}.performance-panel-icon.red{background:#fee2e2;color:#dc2626}
.performance-panel-icon.blue{background:#dbeafe;color:#2563eb}.performance-panel-icon.purple{background:#ede9fe;color:#6d28d9}
.performance-panel-icon.orange{background:#ffedd5;color:#c2410c}.performance-panel-icon.cyan{background:#cffafe;color:#0e7490}
.performance-panel-heading h3{margin:0;font-size:12px;font-weight:950}.performance-panel-heading p{margin:2px 0 0;color:#94a3b8;font-size:7px;overflow-wrap:anywhere}
.performance-progress{display:flex;gap:8px;padding:7px 0}.performance-progress-icon{width:28px;height:28px;flex:0 0 28px;display:grid;place-items:center;border-radius:8px;background:#f8fafc;font-size:13px}
.performance-progress-main{flex:1;min-width:0}.performance-progress-top{display:flex;justify-content:space-between;gap:7px}.performance-progress-top span{color:#475569;font-size:8px;font-weight:800;overflow-wrap:anywhere}.performance-progress-top strong{color:#172033;font-size:9px;white-space:nowrap}.performance-progress-track{height:6px;margin-top:4px;border-radius:99px;background:#edf1f6;overflow:hidden}.performance-progress-track>div{height:100%;border-radius:inherit;transition:width .6s ease}.performance-progress-main small{display:block;margin-top:3px;color:#94a3b8;font-size:7px}
.performance-scroll{max-height:230px;overflow:auto;padding-right:2px}.performance-divider{height:1px;background:#e8edf3;margin:5px 0}
.performance-info-row{display:flex;justify-content:space-between;align-items:center;gap:9px;padding:5px 0}.performance-info-row span{color:#64748b;font-size:8px;font-weight:700}.performance-info-row strong{color:#172033;font-size:9px;font-weight:900;overflow-wrap:anywhere}.performance-green{color:#059669!important}.performance-red{color:#dc2626!important}.performance-purple{color:#7c3aed!important}.performance-orange{color:#ea580c!important}

/* WEEK */
.performance-week-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.performance-week{padding:10px;border-radius:12px;background:linear-gradient(145deg,#f8fbff,#eef2ff);border:1px solid #dce4f3;transition:.2s}.performance-week:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(37,99,235,.08)}.performance-week>div:first-child{display:flex;justify-content:space-between;align-items:center;color:#2563eb;font-size:7px;font-weight:900}.performance-week>strong{display:block;margin-top:5px;color:#dc2626;font-size:14px;font-weight:950}.performance-week>small{display:block;margin-top:2px;color:#94a3b8;font-size:7px}.performance-week-track{height:5px;margin-top:7px;border-radius:99px;background:#dbe4f2;overflow:hidden}.performance-week-track>div{height:100%;border-radius:99px;background:linear-gradient(90deg,#2563eb,#6366f1);transition:width .6s ease}.performance-week em{display:block;margin-top:3px;color:#64748b;font-size:6px;font-style:normal}

/* DEBT */
.performance-stack{display:grid;gap:6px}.performance-debt{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px;border-radius:11px}.performance-debt.loan{background:#faf7ff;border:1px solid #e9d5ff}.performance-debt.borrow{background:#fffaf5;border:1px solid #fed7aa}.performance-debt-icon{width:30px;height:30px;display:grid;place-items:center;border-radius:8px}.performance-debt.loan .performance-debt-icon{background:#ede9fe;color:#7c3aed}.performance-debt.borrow .performance-debt-icon{background:#ffedd5;color:#ea580c}.performance-debt-main{min-width:0}.performance-debt-main strong{display:block;font-size:9px;font-weight:900;overflow-wrap:anywhere}.performance-debt-main span{display:block;margin-top:2px;color:#64748b;font-size:7px;overflow-wrap:anywhere}.performance-debt-main small{display:block;margin-top:2px;font-size:7px;font-weight:850}.performance-debt-main small.success{color:#059669}.performance-debt-main small.danger{color:#dc2626}.performance-debt-amount{text-align:right}.performance-debt-amount strong{display:block;font-size:9px;font-weight:950}.performance-debt.loan .performance-debt-amount strong{color:#7c3aed}.performance-debt.borrow .performance-debt-amount strong{color:#ea580c}.performance-debt-amount small{display:block;margin-top:2px;color:#94a3b8;font-size:6px}

/* PAYMENT */
.performance-payment-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.performance-payment-card{padding:11px;border-radius:12px}.performance-payment-card>span{display:block;font-size:8px;font-weight:900}.performance-payment-card>strong{display:block;margin-top:5px;font-size:14px;font-weight:950}.performance-payment-card>small{display:block;margin-top:2px;color:#64748b;font-size:7px}.performance-payment-card.received{background:linear-gradient(145deg,#ecfdf5,#d1fae5);border:1px solid #86efac;color:#047857}.performance-payment-card.pending{background:linear-gradient(145deg,#fffbeb,#fef3c7);border:1px solid #fcd34d;color:#b45309}.performance-payment-card.overdue{background:linear-gradient(145deg,#fff1f2,#ffe4e6);border:1px solid #fda4af;color:#b91c1c}.performance-payment-card.lost{background:linear-gradient(145deg,#f8fafc,#e2e8f0);border:1px solid #cbd5e1;color:#475569}

/* WIDGETS */
.performance-mini-row{display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:8px;padding:8px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb}.performance-mini-row>span:first-child{width:28px;height:28px;border-radius:8px;background:#eef2ff;display:grid;place-items:center}.performance-mini-row>div{min-width:0}.performance-mini-row strong{display:block;font-size:8px;font-weight:900;overflow-wrap:anywhere}.performance-mini-row small{display:block;margin-top:2px;color:#94a3b8;font-size:6px}.performance-mini-row>b{font-size:9px;white-space:nowrap}.performance-mini-icon{width:28px!important;height:28px!important;display:grid;place-items:center;border-radius:8px}.performance-mini-icon.purple{color:#7c3aed;background:#ede9fe}.performance-mini-icon.red{color:#dc2626;background:#fee2e2}

/* TRANSACTIONS */
.performance-transactions{display:grid;gap:5px}.performance-transaction{display:flex;align-items:center;gap:8px;padding:8px;border-radius:11px;background:#f8fafc;border:1px solid #e5e7eb;transition:.2s}.performance-transaction:hover{background:#fff;border-color:#c7d2fe;transform:translateY(-1px)}.performance-transaction-icon{width:29px;height:29px;flex:0 0 29px;display:grid;place-items:center;border-radius:8px}.performance-transaction-icon.expense{color:#dc2626;background:#fee2e2}.performance-transaction-icon.income{color:#059669;background:#d1fae5}.performance-transaction-main{flex:1;min-width:0}.performance-transaction-main strong{display:block;font-size:8px;font-weight:850;overflow-wrap:anywhere}.performance-transaction-main span{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;color:#94a3b8;font-size:6px}.performance-transaction-main i{font-style:normal;color:#cbd5e1}.performance-income{color:#059669;font-size:9px}.performance-expense{color:#dc2626;font-size:9px}

/* EMPTY */
.performance-empty{min-height:65px;display:flex;align-items:center;justify-content:center;gap:6px;border:1px dashed #d5dce7;border-radius:10px;background:#f8fafc;color:#94a3b8;font-size:8px}.performance-empty-icon{width:25px;height:25px;border-radius:7px;background:#eef2ff;color:#6366f1;display:grid;place-items:center}

/* LOADING */
.performance-loading{min-height:60vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 10px 30px rgba(15,23,42,.05)}.performance-loading-icon{width:55px;height:55px;border-radius:15px;background:#eef2ff;color:#4f46e5;display:grid;place-items:center}.performance-loading strong{font-size:14px}.performance-loading span{font-size:8px;color:#94a3b8}

/* TOAST */
.performance-toast-wrap{position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;pointer-events:none;padding:14px}.performance-toast{width:min(360px,calc(100vw - 28px));display:flex;align-items:flex-start;gap:8px;padding:12px;border-radius:13px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 20px 60px rgba(15,23,42,.18);pointer-events:auto;animation:performanceToastIn .18s ease}.performance-toast.success{border-left:4px solid #10b981;color:#059669}.performance-toast.error{border-left:4px solid #ef4444;color:#dc2626}.performance-toast>div{flex:1;min-width:0}.performance-toast strong{display:block;color:#172033;font-size:10px}.performance-toast span{display:block;margin-top:3px;color:#64748b;font-size:8px;line-height:1.4;overflow-wrap:anywhere}.performance-toast>button{width:26px;height:26px;border:0;border-radius:7px;background:#f1f5f9;color:#64748b;display:grid;place-items:center;cursor:pointer}

.performance-spin{animation:performanceSpin .8s linear infinite}
@keyframes performanceSpin{to{transform:rotate(360deg)}}
@keyframes performanceToastIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}

/* TABLET */
@media(max-width:1050px){
  .performance-summary-grid{grid-template-columns:repeat(3,1fr)}
  .performance-week-grid{grid-template-columns:repeat(2,1fr)}
}

/* MOBILE */
@media(max-width:700px){
  .performance-pie-grid{grid-template-columns:1fr;gap:7px}
  .performance-pie-content{grid-template-columns:105px minmax(0,1fr)}
}
@media(max-width:700px){
  .performance-page{padding:7px;padding-bottom:calc(12px + env(safe-area-inset-bottom))}
  .performance-header{top:4px;padding:12px;border-radius:17px}
  .performance-brand-icon{width:39px;height:39px;flex-basis:39px}
  .performance-brand h1{font-size:19px}
  .performance-brand p{display:none}
  .performance-head-btn{width:37px;padding:0;justify-content:center}
  .performance-head-btn span{display:none}
  .performance-month-row{flex-direction:column;align-items:stretch}
  .performance-month-control{width:100%}
  .performance-month-center{flex:1;min-width:0}
  .performance-summary-grid{grid-template-columns:repeat(2,1fr);gap:6px}
  .performance-summary-card{padding:10px;border-radius:13px}
  .performance-summary-card>div>strong{font-size:15px}
  .performance-summary-icon{width:30px;height:30px;flex-basis:30px}
  .performance-two-column{grid-template-columns:1fr;gap:7px}
  .performance-panel{padding:11px;border-radius:13px}
  .performance-savings{align-items:flex-start;flex-direction:column;padding:13px;border-radius:14px}
  .performance-savings-rate{width:100%;justify-content:space-between}
  .performance-week-grid{grid-template-columns:repeat(2,1fr);gap:6px}
  .performance-payment-grid{grid-template-columns:repeat(2,1fr);gap:6px}
  .performance-debt{grid-template-columns:auto minmax(0,1fr);align-items:start}
  .performance-debt-amount{grid-column:2;text-align:left}
}

@media(max-width:380px){
  .performance-week{padding:8px}
  .performance-payment-card{padding:9px}
  .performance-payment-card>strong{font-size:13px}
}
`;

