import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  HandCoins,
  Landmark,
  Loader2,
  PieChart,
  RefreshCw,
  Receipt,
  Wallet,
  X,
} from "lucide-react";

/*
  ExportDetails.jsx
  ------------------------------------------------------------
  Backend expected:
    GET /api/export-details/data?period=month&month=YYYY-MM
    GET /api/export-details/data?period=week&month=YYYY-MM&week=1..4

    GET /api/export-details?format=pdf&period=month&month=YYYY-MM
    GET /api/export-details?format=excel&period=month&month=YYYY-MM
    GET /api/export-details?format=text&period=month&month=YYYY-MM

  This page uses the exportDetailsapi.js supplied for this project.
  It does NOT use the old /json, /pdf, /excel, /text endpoints.

  Browser download:
    The page downloads the returned Blob with an <a download> element.
    In normal browsers this goes to the browser's configured Downloads
    location. A web page cannot silently choose an arbitrary local folder.

  Android/iOS WebView:
    The same Blob download is started. If the WebView does not implement
    downloads, the native WebView wrapper must handle download requests.
*/

const API_BASE_URL = (
  (typeof import.meta !== "undefined" && import.meta.env &&
    (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL)) ||
  (typeof process !== "undefined" && process.env &&
    (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL)) ||
  (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://express-project-learning-new.onrender.com")
).replace(/\/$/, "");

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

/*
  AUTH BRIDGE
  ------------------------------------------------------------------
  Uses the SAME user already logged in by the existing application.
  The login page is not changed.

  Supported existing storage styles:
    token / accessToken
    user / currentUser / loggedInUser / authUser
    userId / user_id / currentUserId / loggedInUserId

  The API receives both:
    Authorization: Bearer <token>   (when a token exists)
    x-user-id: <logged-in user id>   (when an id exists)

  Cookies/sessions are also enabled on every request with
  credentials: "include".
*/

const readStorage = (storage, keys) => {
  for (const key of keys) {
    try {
      const value = storage.getItem(key);
      if (value !== null && value !== "") return value;
    } catch {
      // Storage can be unavailable in some WebViews/private modes.
    }
  }
  return "";
};

const parseStoredObject = (value) => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const validUserId = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? String(id) : "";
};

const getLoggedInUserId = () => {
  const directKeys = [
    "userId",
    "user_id",
    "currentUserId",
    "loggedInUserId",
    "authUserId",
    "userid",
  ];

  const objectKeys = [
    "user",
    "currentUser",
    "loggedInUser",
    "authUser",
    "profile",
    "current_user",
    "auth_user",
  ];

  // Direct numeric ID.
  const directValues = [
    ...directKeys.map((key) => readStorage(localStorage, [key])),
    ...directKeys.map((key) => readStorage(sessionStorage, [key])),
  ];

  for (const value of directValues) {
    const id = validUserId(value);
    if (id) return id;
  }

  // User object saved by the login page.
  const storedObjects = [
    ...objectKeys.map((key) => readStorage(localStorage, [key])),
    ...objectKeys.map((key) => readStorage(sessionStorage, [key])),
  ];

  for (const value of storedObjects) {
    const user = parseStoredObject(value);
    if (!user) continue;

    const id =
      validUserId(user.id) ||
      validUserId(user.userId) ||
      validUserId(user.user_id);

    if (id) return id;
  }

  return "";
};

const getToken = () =>
  readStorage(localStorage, [
    "token",
    "accessToken",
    "authToken",
    "jwt",
    "access_token",
  ]) ||
  readStorage(sessionStorage, [
    "token",
    "accessToken",
    "authToken",
    "jwt",
    "access_token",
  ]);


const apiFetch = async (path, options = {}) => {
  const url = `${API_BASE_URL}${path}`;

  try {
    return await fetch(url, {
      ...options,
      credentials: "include",
      mode: "cors",
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to fetch API: ${url}. ${
        error?.message || "Network request failed."
      }. Check the backend URL, Render service status, and CORS configuration.`
    );
  }
};

const authHeaders = () => {
  const token = getToken();
  const userId = getLoggedInUserId();

  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Important: this connects the export API to the SAME logged-in user.
  if (userId) {
    headers["x-user-id"] = userId;
  }

  return headers;
};

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatAmount = (value) => {
  const n = num(value);
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(2)));
};

const money = (value) => `₹${formatAmount(value)}`;

const moneyCompact = (value) => `₹${formatAmount(value)}`;

const dateLabel = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const dateTimeLabel = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const safe = (value) =>
  value === undefined || value === null || value === ""
    ? "-"
    : String(value);

const monthTitle = (month) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return month;
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const lastDayOfMonth = (month) => {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m, 0).getDate();
};

const getWeekRange = (month, week) => {
  const last = lastDayOfMonth(month);
  const starts = [1, 8, 15, 22];
  const ends = [7, 14, 21, last];
  const index = Math.max(1, Math.min(4, Number(week))) - 1;
  return {
    start: starts[index],
    end: ends[index],
  };
};

const normalizeData = (payload) => {
  const source = payload?.data || payload || {};
  const tables = source.tables || {};

  return {
    ...source,
    user: source.user || {},
    period: source.period || {},
    summary: source.summary || {},
    tables: {
      personal_business_work: tables.personal_business_work || [],
      personal_expenses: tables.personal_expenses || [],
      personal_loans_borrow: tables.personal_loans_borrow || [],
      personal_loan_emi_payments:
        tables.personal_loan_emi_payments || [],
      personal_payments: tables.personal_payments || [],
      personal_overview: tables.personal_overview || [],
    },
  };
};

const buildCategoryTotals = (expenses) => {
  const map = {};
  expenses.forEach((row) => {
    const category = safe(row.category) === "-" ? "Uncategorized" : safe(row.category);
    map[category] = num(map[category]) + num(row.amount);
  });
  return Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
};

const calculateLocalSummary = (data) => {
  const summary = data.summary || {};
  const expenses = data.tables.personal_expenses || [];
  const payments = data.tables.personal_payments || [];
  const repayments = data.tables.personal_loan_emi_payments || [];
  const loans = data.tables.personal_loans_borrow || [];
  const work = data.tables.personal_business_work || [];

  const totalExpenses = expenses.reduce((s, r) => s + num(r.amount), 0);

  const received = payments
    .filter((r) => String(r.status).toLowerCase() === "received")
    .reduce((s, r) => s + num(r.amount), 0);

  const pending = payments
    .filter((r) => String(r.status).toLowerCase() === "pending")
    .reduce((s, r) => s + num(r.amount), 0);

  const overdue = payments
    .filter((r) => String(r.status).toLowerCase() === "overdue")
    .reduce((s, r) => s + num(r.amount), 0);

  const lost = payments
    .filter((r) => String(r.status).toLowerCase() === "lost")
    .reduce((s, r) => s + num(r.amount), 0);

  const emi = repayments
    .filter((r) => String(r.payment_type).toLowerCase() === "emi")
    .reduce((s, r) => s + num(r.amount), 0);

  const loanRepayment = repayments
    .filter((r) => String(r.payment_type).toLowerCase() === "loan repayment")
    .reduce((s, r) => s + num(r.amount), 0);

  const borrowRepayment = repayments
    .filter((r) => String(r.payment_type).toLowerCase() === "borrow repayment")
    .reduce((s, r) => s + num(r.amount), 0);

  const totalOutgoing =
    num(summary.outgoing) ||
    totalExpenses + emi + loanRepayment + borrowRepayment;

  const income = num(summary.income) || received;
  const net =
    Number.isFinite(Number(summary.net))
      ? num(summary.net)
      : income - totalOutgoing;

  return {
    income,
    expenses: num(summary.expenseTotal) || totalExpenses,
    emi: num(summary.emiTotal) || emi,
    loanRepayment: num(summary.loanRepayment) || loanRepayment,
    borrowRepayment:
      num(summary.borrowRepayment) || borrowRepayment,
    outgoing: totalOutgoing,
    net,
    savings:
      Number.isFinite(Number(summary.savings))
        ? num(summary.savings)
        : Math.max(net, 0),
    loss:
      Number.isFinite(Number(summary.loss))
        ? num(summary.loss)
        : Math.max(-net, 0),
    pending: num(summary.pending) || pending,
    overdue: num(summary.overdue) || overdue,
    lost: num(summary.lost) || lost,
    received,
    activeLoan:
      num(summary.activeLoanTotal) ||
      loans
        .filter(
          (r) =>
            String(r.type).toLowerCase() === "loan" &&
            String(r.status).toLowerCase() === "active"
        )
        .reduce((s, r) => s + num(r.amount), 0),
    activeBorrow:
      num(summary.activeBorrowTotal) ||
      loans
        .filter(
          (r) =>
            String(r.type).toLowerCase() === "borrow" &&
            String(r.status).toLowerCase() === "active"
        )
        .reduce((s, r) => s + num(r.amount), 0),
    businessTotal:
      num(summary.businessTotal) ||
      work
        .filter((r) => String(r.type).toLowerCase() === "business")
        .reduce((s, r) => s + num(r.amount), 0),
    workTotal:
      num(summary.workTotal) ||
      work
        .filter((r) => String(r.type).toLowerCase() === "work")
        .reduce((s, r) => s + num(r.amount), 0),
  };
};

const filterRowsByWeek = (rows, dateFields, month, week) => {
  const { start, end } = getWeekRange(month, week);
  const startDate = `${month}-${String(start).padStart(2, "0")}`;
  const endDate = `${month}-${String(end).padStart(2, "0")}`;

  return rows.filter((row) => {
    for (const field of dateFields) {
      if (!row[field]) continue;
      const value = String(row[field]).slice(0, 10);
      if (value >= startDate && value <= endDate) return true;
    }
    return false;
  });
};

const calculateWeeklyRows = (data, month) => {
  const weeks = [];
  const last = lastDayOfMonth(month);

  for (let week = 1; week <= 4; week += 1) {
    const { start, end } = getWeekRange(month, week);

    const expenses = filterRowsByWeek(
      data.tables.personal_expenses,
      ["expense_date", "created_at"],
      month,
      week
    );

    const payments = filterRowsByWeek(
      data.tables.personal_payments,
      ["payment_date", "created_at", "received_at"],
      month,
      week
    );

    const repayments = filterRowsByWeek(
      data.tables.personal_loan_emi_payments,
      ["payment_date", "created_at"],
      month,
      week
    );

    const income = payments
      .filter((r) => String(r.status).toLowerCase() === "received")
      .reduce((s, r) => s + num(r.amount), 0);

    const expenseTotal = expenses.reduce((s, r) => s + num(r.amount), 0);

    const loanEmi = repayments
      .filter((r) => String(r.payment_type).toLowerCase() === "emi")
      .reduce((s, r) => s + num(r.amount), 0);

    const loanRepayment = repayments
      .filter((r) => String(r.payment_type).toLowerCase() === "loan repayment")
      .reduce((s, r) => s + num(r.amount), 0);

    const borrowRepayment = repayments
      .filter((r) => String(r.payment_type).toLowerCase() === "borrow repayment")
      .reduce((s, r) => s + num(r.amount), 0);

    const outgoing =
      expenseTotal + loanEmi + loanRepayment + borrowRepayment;

    const net = income - outgoing;

    const hasActivity =
      expenses.length ||
      payments.length ||
      repayments.length;

    weeks.push({
      week,
      start,
      end,
      income,
      expenses: expenseTotal,
      loanEmi,
      loanRepayment,
      borrowRepayment,
      outgoing,
      net,
      status: !hasActivity
        ? "No Activity"
        : net >= 0
          ? "Positive"
          : "Negative",
      hasActivity: Boolean(hasActivity),
    });
  }

  // Prevent an impossible day range in unusual month data.
  if (last < 22) {
    weeks[3].end = last;
  }

  return weeks;
};

const formatFilename = (disposition, fallback) => {
  const match = disposition?.match(
    /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i
  );

  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  return fallback;
};

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    link.remove();
    window.URL.revokeObjectURL(url);
  }, 1500);
};

const ExportDetails = () => {
  const [month, setMonth] = useState(getCurrentMonth());
  const [period, setPeriod] = useState("month");
  const [week, setWeek] = useState("1");

  const [data, setData] = useState(normalizeData({}));
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const currentUserId = getLoggedInUserId();
      const currentToken = getToken();

      // A valid login can be cookie/session based, so do not block the
      // request when both browser storage values are empty.
      setAuthReady(Boolean(currentUserId || currentToken));

      const params = new URLSearchParams({
        period,
        month,
      });

      if (period === "week") {
        params.set("week", week);
      }

      const response = await apiFetch(
        `/api/export-details/data?${params.toString()}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        if (response.status === 401) {
          throw new Error(
            "Login session was not attached to this request. Please refresh the page after login. If the error continues, your existing login must expose the logged-in user ID/token to this page."
          );
        }

        throw new Error(
          result.message || `Failed to load ${period} report.`
        );
      }

      setData(normalizeData(result));
    } catch (err) {
      console.error("Export details GET error:", err);
      setError(err.message || "Failed to load report details.");
      setData(normalizeData({}));
    } finally {
      setLoading(false);
    }
  }, [month, period, week]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const summary = useMemo(
    () => calculateLocalSummary(data),
    [data]
  );

  const expenses = data.tables.personal_expenses;
  const payments = data.tables.personal_payments;
  const loans = data.tables.personal_loans_borrow;
  const repayments = data.tables.personal_loan_emi_payments;
  const businessWork = data.tables.personal_business_work;
  const overviewRows = data.tables.personal_overview;

  const categoryTotals = useMemo(
    () => buildCategoryTotals(expenses),
    [expenses]
  );

  const weeklyRows = useMemo(
    () => calculateWeeklyRows(data, month),
    [data, month]
  );

  const selectedWeekRow = useMemo(
    () =>
      weeklyRows.find(
        (row) => Number(row.week) === Number(week)
      ) || weeklyRows[0],
    [weeklyRows, week]
  );

  const visibleWeeklyRows =
    period === "week"
      ? [selectedWeekRow]
      : weeklyRows;

  const activeRecords =
    expenses.length +
    payments.length +
    loans.length +
    repayments.length +
    businessWork.length;

  const reportTitle =
    period === "week"
      ? `Week ${week} • ${monthTitle(month)}`
      : monthTitle(month);


  const downloadFile = async (format) => {
    const key = `${period}-${format}`;

    try {
      setExporting(key);
      setError("");
      setMessage("");

      const params = new URLSearchParams({
        format,
        period,
        month,
      });

      if (period === "week") {
        params.set("week", week);
      }

      const response = await apiFetch(
        `/api/export-details?${params.toString()}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error(
            "Login session was not attached to the download request. Please refresh after login."
          );
        }

        throw new Error(
          result.message ||
            `Failed to download ${format.toUpperCase()} file.`
        );
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("The server returned an empty file.");
      }

      const extension =
        format === "excel" ? "xlsx" : format === "pdf" ? "pdf" : "txt";

      const fallback =
        `Personal_Summary_${period}_${month}` +
        (period === "week" ? `_Week_${week}` : "") +
        `.${extension}`;

      const filename = formatFilename(
        response.headers.get("Content-Disposition"),
        fallback
      );

      downloadBlob(blob, filename);

      setMessage(
        `${format.toUpperCase()} ${period} report downloaded successfully.`
      );
    } catch (err) {
      console.error("Export error:", err);
      setError(
        err.message ||
          `Unable to download ${format.toUpperCase()} report.`
      );
    } finally {
      setExporting("");
    }
  };

  const downloadJson = () => {
    try {
      const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json;charset=utf-8" }
      );

      downloadBlob(
        blob,
        `Personal_Data_${period}_${month}${
          period === "week" ? `_Week_${week}` : ""
        }.json`
      );

      setMessage("JSON backup downloaded successfully.");
    } catch (err) {
      setError(err.message || "Unable to download JSON backup.");
    }
  };

  const resetCurrent = () => {
    setMonth(getCurrentMonth());
    setPeriod("month");
    setWeek("1");
  };

  return (
    <div className="export-page">
      <style>{styles}</style>

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Download size={21} />
          </div>

          <div className="brand-copy">
            <div className="brand-title-row">
              <h1>Financial Export</h1>
              <span className="live-pill">SECURE</span>
            </div>
            <p>
              Complete monthly and weekly reports • PDF • Excel • Text
            </p>
          </div>
        </div>

        <div className="top-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={resetCurrent}
          >
            <CalendarDays size={15} />
            Current
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={loadDetails}
            disabled={loading}
            title="Refresh report"
          >
            <RefreshCw
              size={17}
              className={loading ? "spin" : ""}
            />
          </button>
        </div>
      </header>

      {error && (
        <Notice
          type="error"
          text={error}
          onClose={() => setError("")}
        />
      )}

      {message && (
        <Notice
          type="success"
          text={message}
          onClose={() => setMessage("")}
        />
      )}

      <section className="control-panel">
        <div className="control-heading">
          <span className="eyebrow">REPORT CONTROL</span>
          <h2>Select your report</h2>
          <p>
            Choose any month. Select Monthly for the complete month or
            Weekly for one specific week.
          </p>
        </div>

        <div className="controls-grid">
          <label className="field-card">
            <span>Report period</span>
            <div className="select-wrap">
              <CalendarDays size={16} />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="month">Monthly Summary</option>
                <option value="week">Weekly Summary</option>
              </select>
              <ChevronDown size={15} />
            </div>
          </label>

          <label className="field-card">
            <span>Select month</span>
            <div className="month-wrap">
              <CalendarDays size={16} />
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          </label>

          {period === "week" ? (
            <label className="field-card">
              <span>Select week</span>
              <div className="select-wrap">
                <BarChart3 size={16} />
                <select
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                >
                  <option value="1">Week 1 • 1–7</option>
                  <option value="2">Week 2 • 8–14</option>
                  <option value="3">Week 3 • 15–21</option>
                  <option value="4">
                    Week 4 • 22–month end
                  </option>
                </select>
                <ChevronDown size={15} />
              </div>
            </label>
          ) : (
            <div className="period-preview">
              <span>Selected report</span>
              <strong>{monthTitle(month)}</strong>
              <small>Complete month</small>
            </div>
          )}
        </div>

        <div className="selected-period">
          <div>
            <span>Selected</span>
            <strong>{reportTitle}</strong>
          </div>
          <div className="selected-status">
            <span>Records</span>
            <strong>{activeRecords}</strong>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading-card">
          <div className="loader-ring">
            <Loader2 size={30} className="spin" />
          </div>
          <strong>Loading financial details</strong>
          <span>
            Fetching {period === "week" ? "weekly" : "monthly"} data from
            your authenticated API.
          </span>
        </div>
      ) : (
        <>
          <section className="summary-grid">
            <SummaryCard
              label="Received / Income"
              value={summary.income}
              icon={ArrowDownToLine}
              tone="green"
            />
            <SummaryCard
              label="Expenses"
              value={summary.expenses}
              icon={Receipt}
              tone="red"
            />
            <SummaryCard
              label="EMI"
              value={summary.emi}
              icon={Landmark}
              tone="purple"
            />
            <SummaryCard
              label="Loan Repayment"
              value={summary.loanRepayment}
              icon={Landmark}
              tone="violet"
            />
            <SummaryCard
              label="Borrow Repayment"
              value={summary.borrowRepayment}
              icon={HandCoins}
              tone="amber"
            />
            <SummaryCard
              label="Total Outgoing"
              value={summary.outgoing}
              icon={ArrowUpFromLine}
              tone="orange"
            />
            <SummaryCard
              label="Net Result"
              value={summary.net}
              icon={Wallet}
              tone={summary.net >= 0 ? "green" : "red"}
            />
            <SummaryCard
              label="Pending"
              value={summary.pending}
              icon={Receipt}
              tone="blue"
            />
          </section>

          <section className="main-grid">
            <div className="content-card">
              <SectionHeader
                eyebrow="DOWNLOAD"
                title={`Download ${period === "week" ? "Weekly" : "Monthly"} Report`}
                text="Choose any format. The server generates the complete selected report."
              />

              <div className="format-grid">
                <DownloadCard
                  type="pdf"
                  title="Professional PDF"
                  text="A4-ready report with summary, tables, transactions and all available details."
                  icon={FileText}
                  exporting={exporting}
                  onClick={() => downloadFile("pdf")}
                  tone="pdf"
                />

                <DownloadCard
                  type="excel"
                  title="Professional Excel"
                  text="Workbook with separate sheets for summary, expenses, loans, payments and other records."
                  icon={FileSpreadsheet}
                  exporting={exporting}
                  onClick={() => downloadFile("excel")}
                  tone="excel"
                />

                <DownloadCard
                  type="text"
                  title="Complete Text"
                  text="Plain-text backup containing the selected period and complete available records."
                  icon={FileText}
                  exporting={exporting}
                  onClick={() => downloadFile("text")}
                  tone="text"
                />
              </div>
            </div>

            <div className="content-card report-status-card">
              <SectionHeader
                eyebrow="REPORT STATUS"
                title="Selected period"
                text="Live values from the current API response."
              />

              <div className="status-box">
                <div className="status-icon">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <strong>{reportTitle}</strong>
                  <span>
                    {data.period?.startDate
                      ? `${dateLabel(data.period.startDate)} → ${dateLabel(
                          new Date(
                            `${data.period.endDateExclusive}T00:00:00`
                          ).getTime() - 86400000
                        )}`
                      : "Selected period"}
                  </span>
                </div>
              </div>

              <div className="mini-stats">
                <MiniStat
                  label="Business"
                  value={moneyCompact(summary.businessTotal)}
                />
                <MiniStat
                  label="Work"
                  value={moneyCompact(summary.workTotal)}
                />
                <MiniStat
                  label="Active Loan"
                  value={moneyCompact(summary.activeLoan)}
                />
                <MiniStat
                  label="Active Borrow"
                  value={moneyCompact(summary.activeBorrow)}
                />
              </div>

              <button
                type="button"
                className="preview-button"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye size={16} />
                Open report preview
              </button>
            </div>
          </section>

          <section className="content-card">
            <SectionHeader
              eyebrow="PERFORMANCE"
              title={
                period === "week"
                  ? `Week ${week} Performance`
                  : `Monthly Performance • ${monthTitle(month)}`
              }
              text={
                period === "week"
                  ? "Only the selected week is shown."
                  : "Weeks with no activity remain visible but contain no financial details."
              }
            />

            <PerformanceTable rows={visibleWeeklyRows} />
          </section>

          <section className="two-column">
            <div className="content-card">
              <SectionHeader
                eyebrow="DISTRIBUTION"
                title="Expense Categories"
                text="Selected period expense distribution."
              />

              {categoryTotals.length === 0 ? (
                <EmptyState text="No expense details available for this period." />
              ) : (
                <div className="category-list">
                  {categoryTotals.map((item) => {
                    const total =
                      categoryTotals.reduce(
                        (s, row) => s + num(row.total),
                        0
                      );
                    const pct =
                      total > 0
                        ? (num(item.total) / total) * 100
                        : 0;

                    return (
                      <div
                        className="category-row"
                        key={item.category}
                      >
                        <div className="category-top">
                          <span>{item.category}</span>
                          <strong>{money(item.total)}</strong>
                        </div>
                        <div className="progress">
                          <span
                            style={{
                              width: `${Math.min(100, pct)}%`,
                            }}
                          />
                        </div>
                        <small>{pct.toFixed(1)}%</small>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="content-card">
              <SectionHeader
                eyebrow="QUICK BACKUP"
                title="Data Backup"
                text="Save the exact JSON response locally for technical backup."
              />

              <div className="backup-box">
                <div className="backup-icon">
                  <PieChart size={22} />
                </div>
                <div>
                  <strong>JSON backup</strong>
                  <span>
                    Includes the selected period, summary and all API
                    tables returned for the user.
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={downloadJson}
              >
                <Download size={15} />
                Download JSON
              </button>
            </div>
          </section>

          <section className="content-card">
            <SectionHeader
              eyebrow="DATA COVERAGE"
              title="Included records"
              text="Only records returned for the selected month/week are counted."
            />

            <div className="coverage-grid">
              <Coverage label="Business / Work" value={businessWork.length} />
              <Coverage label="Expenses" value={expenses.length} />
              <Coverage label="Payments" value={payments.length} />
              <Coverage label="Loans / Borrow" value={loans.length} />
              <Coverage label="Repayments" value={repayments.length} />
              <Coverage label="Overview Rows" value={overviewRows.length} />
            </div>
          </section>
        </>
      )}

      {previewOpen && (
        <PreviewModal
          data={data}
          summary={summary}
          reportTitle={reportTitle}
          period={period}
          week={week}
          weeklyRows={visibleWeeklyRows}
          categoryTotals={categoryTotals}
          onClose={() => setPreviewOpen(false)}
          onDownload={(format) => downloadFile(format)}
        />
      )}
    </div>
  );
};

const Notice = ({ type, text, onClose }) => (
  <div className={`notice ${type}`}>
    {type === "error" ? (
      <AlertCircle size={17} />
    ) : (
      <CheckCircle2 size={17} />
    )}
    <span>{text}</span>
    <button type="button" onClick={onClose} aria-label="Close">
      <X size={16} />
    </button>
  </div>
);

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  tone,
}) => (
  <div className={`summary-card ${tone}`}>
    <div className="summary-icon">
      <Icon size={18} />
    </div>
    <div className="summary-content">
      <span>{label}</span>
      <strong>{money(value)}</strong>
    </div>
  </div>
);

const SectionHeader = ({
  eyebrow,
  title,
  text,
}) => (
  <div className="section-header">
    <div>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  </div>
);

const DownloadCard = ({
  type,
  title,
  text,
  icon: Icon,
  exporting,
  onClick,
  tone,
}) => {
  const busy = exporting.endsWith(`-${type}`);

  return (
    <article className={`download-card ${tone}`}>
      <div className="download-card-top">
        <div className="format-icon">
          <Icon size={21} />
        </div>
        <span className="format-badge">
          {type === "excel" ? "XLSX" : type.toUpperCase()}
        </span>
      </div>

      <div className="download-copy">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>

      <button
        type="button"
        className="download-action"
        onClick={onClick}
        disabled={Boolean(exporting)}
      >
        {busy ? (
          <Loader2 size={15} className="spin" />
        ) : (
          <Download size={15} />
        )}
        {busy ? "Preparing..." : `Download ${type === "excel" ? "Excel" : type.toUpperCase()}`}
      </button>
    </article>
  );
};

const MiniStat = ({ label, value }) => (
  <div className="mini-stat">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const Coverage = ({ label, value }) => (
  <div className="coverage-card">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const PerformanceTable = ({ rows }) => {
  if (!rows?.length) {
    return <EmptyState text="No weekly performance available." />;
  }

  return (
    <div className="table-scroll">
      <table className="performance-table">
        <thead>
          <tr>
            <th>Week</th>
            <th>Period</th>
            <th>Income</th>
            <th>Expenses</th>
            <th>EMI</th>
            <th>Loan</th>
            <th>Borrow</th>
            <th>Outgoing</th>
            <th>Net</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.week}
              className={!row.hasActivity ? "no-activity" : ""}
            >
              <td>
                <strong>Week {row.week}</strong>
              </td>
              <td>
                {row.start}–{row.end}
              </td>
              <td>{money(row.income)}</td>
              <td>{money(row.expenses)}</td>
              <td>{money(row.loanEmi)}</td>
              <td>{money(row.loanRepayment)}</td>
              <td>{money(row.borrowRepayment)}</td>
              <td>{money(row.outgoing)}</td>
              <td
                className={
                  row.net >= 0
                    ? "positive-value"
                    : "negative-value"
                }
              >
                {money(row.net)}
              </td>
              <td>
                <span
                  className={`status-tag ${
                    row.hasActivity
                      ? row.net >= 0
                        ? "positive"
                        : "negative"
                      : "neutral"
                  }`}
                >
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const EmptyState = ({ text }) => (
  <div className="empty-state">
    <Receipt size={20} />
    <span>{text}</span>
  </div>
);

const PreviewModal = ({
  data,
  summary,
  reportTitle,
  period,
  week,
  weeklyRows,
  categoryTotals,
  onClose,
  onDownload,
}) => {
  const user = data.user || {};
  const expenses = data.tables?.personal_expenses || [];
  const payments = data.tables?.personal_payments || [];
  const loans = data.tables?.personal_loans_borrow || [];
  const repayments =
    data.tables?.personal_loan_emi_payments || [];
  const work = data.tables?.personal_business_work || [];

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="preview-modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow dark">REPORT PREVIEW</span>
            <h2>{reportTitle}</h2>
            <p>
              {safe(user.full_name)} •{" "}
              {period === "week"
                ? `Week ${week}`
                : "Monthly Summary"}
            </p>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => onDownload("pdf")}
            >
              <FileText size={15} />
              PDF
            </button>
            <button
              type="button"
              onClick={() => onDownload("excel")}
            >
              <FileSpreadsheet size={15} />
              Excel
            </button>
            <button
              type="button"
              className="close-modal"
              onClick={onClose}
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="preview-body">
          <div className="document-header">
            <div className="document-logo">₹</div>
            <div>
              <h1>Personal Financial Report</h1>
              <p>{reportTitle}</p>
            </div>
          </div>

          <div className="owner-grid">
            <DocumentField label="Name" value={user.full_name} />
            <DocumentField label="Profession" value={user.profession} />
            <DocumentField label="Username" value={user.username} />
            <DocumentField label="Email" value={user.email_address} />
          </div>

          <div className="preview-section">
            <h3>Financial Summary</h3>
            <div className="document-metrics">
              <DocumentMetric label="Income" value={money(summary.income)} />
              <DocumentMetric label="Expenses" value={money(summary.expenses)} />
              <DocumentMetric label="EMI" value={money(summary.emi)} />
              <DocumentMetric label="Loan Repayment" value={money(summary.loanRepayment)} />
              <DocumentMetric label="Borrow Repayment" value={money(summary.borrowRepayment)} />
              <DocumentMetric label="Outgoing" value={money(summary.outgoing)} />
              <DocumentMetric label="Net Result" value={money(summary.net)} />
              <DocumentMetric label="Pending" value={money(summary.pending)} />
            </div>
          </div>

          <div className="preview-section">
            <h3>Weekly Performance</h3>
            <PerformanceTable rows={weeklyRows} />
          </div>

          <div className="preview-section">
            <h3>Expense Categories</h3>
            <SimpleTable
              headers={["Category", "Amount"]}
              rows={categoryTotals.map((row) => [
                row.category,
                money(row.total),
              ])}
              empty="No expense categories."
            />
          </div>

          <div className="preview-section">
            <h3>Business / Work</h3>
            <SimpleTable
              headers={["Type", "Name", "Amount", "Status", "Start", "End"]}
              rows={work.map((row) => [
                safe(row.type),
                safe(row.name),
                money(row.amount),
                safe(row.status),
                dateLabel(row.start_date),
                dateLabel(row.end_date),
              ])}
              empty="No business or work records."
            />
          </div>

          <div className="preview-section">
            <h3>Expenses</h3>
            <SimpleTable
              headers={["Category", "Amount", "Date", "Notes"]}
              rows={expenses.map((row) => [
                safe(row.category),
                money(row.amount),
                dateLabel(row.expense_date),
                safe(row.notes),
              ])}
              empty="No expenses."
            />
          </div>

          <div className="preview-section">
            <h3>Loans / Borrow</h3>
            <SimpleTable
              headers={[
                "Type",
                "Name",
                "Amount",
                "EMI",
                "Status",
                "Start",
                "Return / End",
              ]}
              rows={loans.map((row) => [
                safe(row.type),
                safe(row.name),
                money(row.amount),
                money(row.emi),
                safe(row.status),
                dateLabel(row.start_date),
                dateLabel(row.return_date || row.end_date),
              ])}
              empty="No loans or borrow records."
            />
          </div>

          <div className="preview-section">
            <h3>Repayments</h3>
            <SimpleTable
              headers={[
                "Loan",
                "Type",
                "Amount",
                "Date",
                "Notes",
              ]}
              rows={repayments.map((row) => [
                safe(row.loan_name),
                safe(row.payment_type),
                money(row.amount),
                dateLabel(row.payment_date),
                safe(row.notes),
              ])}
              empty="No repayments."
            />
          </div>

          <div className="preview-section">
            <h3>Payments</h3>
            <SimpleTable
              headers={[
                "Person",
                "Category",
                "Amount",
                "Date",
                "Status",
              ]}
              rows={payments.map((row) => [
                safe(row.person_name),
                safe(row.category),
                money(row.amount),
                dateLabel(row.payment_date),
                safe(row.status),
              ])}
              empty="No payments."
            />
          </div>

          <div className="preview-footer">
            <span>Personal Dashboard</span>
            <span>Generated {dateTimeLabel(new Date())}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentField = ({ label, value }) => (
  <div className="document-field">
    <span>{label}</span>
    <strong>{safe(value)}</strong>
  </div>
);

const DocumentMetric = ({ label, value }) => (
  <div className="document-metric">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const SimpleTable = ({ headers, rows, empty }) => {
  if (!rows.length) {
    return <EmptyState text={empty} />;
  }

  return (
    <div className="table-scroll light">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((value, index) => (
                <td key={index}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = `
:root {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

.export-page {
  min-height: 100%;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  padding: clamp(10px, 2vw, 24px);
  color: #f8fafc;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background:
    radial-gradient(circle at 8% 0%, rgba(79,70,229,.17), transparent 30%),
    radial-gradient(circle at 95% 10%, rgba(6,182,212,.12), transparent 26%),
    #070b14;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.brand {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 11px;
}

.brand-icon {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  display: grid;
  place-items: center;
  color: #c4b5fd;
  background: linear-gradient(135deg, rgba(99,102,241,.24), rgba(6,182,212,.14));
  border: 1px solid rgba(196,181,253,.18);
  border-radius: 13px;
  box-shadow: 0 10px 28px rgba(79,70,229,.15);
}

.brand-copy {
  min-width: 0;
}

.brand-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.brand h1 {
  margin: 0;
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  letter-spacing: -.03em;
}

.brand p {
  margin: 4px 0 0;
  color: rgba(255,255,255,.46);
  font-size: .68rem;
}

.live-pill {
  padding: 3px 6px;
  color: #a7f3d0;
  background: rgba(16,185,129,.09);
  border: 1px solid rgba(16,185,129,.17);
  border-radius: 999px;
  font-size: .46rem;
  font-weight: 900;
  letter-spacing: .08em;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.ghost-button,
.icon-button,
.preview-button,
.secondary-button,
.modal-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #f8fafc;
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.09);
  cursor: pointer;
  transition: .18s ease;
}

.ghost-button {
  min-height: 38px;
  padding: 0 11px;
  border-radius: 10px;
  font-size: .62rem;
  font-weight: 800;
}

.icon-button {
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

.ghost-button:hover,
.icon-button:hover,
.preview-button:hover,
.secondary-button:hover,
.modal-actions button:hover {
  border-color: rgba(103,232,249,.30);
  background: rgba(255,255,255,.08);
  transform: translateY(-1px);
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
  transform: none !important;
}

.control-panel,
.content-card,
.loading-card {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 17px;
  background: rgba(255,255,255,.035);
  box-shadow: 0 18px 45px rgba(0,0,0,.14);
}

.control-panel {
  padding: clamp(14px, 2vw, 20px);
  margin-bottom: 12px;
}

.control-heading h2,
.section-header h2 {
  margin: 4px 0 3px;
  font-size: clamp(.95rem, 1.7vw, 1.12rem);
}

.control-heading p,
.section-header p {
  margin: 0;
  max-width: 720px;
  color: rgba(255,255,255,.43);
  font-size: .65rem;
  line-height: 1.55;
}

.eyebrow {
  display: block;
  color: rgba(255,255,255,.36);
  font-size: .54rem;
  font-weight: 900;
  letter-spacing: .13em;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 9px;
  margin-top: 14px;
}

.field-card,
.period-preview {
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 11px;
  background: rgba(255,255,255,.025);
}

.field-card > span,
.period-preview > span {
  display: block;
  margin-bottom: 6px;
  color: rgba(255,255,255,.38);
  font-size: .55rem;
  font-weight: 750;
}

.select-wrap,
.month-wrap {
  height: 36px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px;
  color: #c4b5fd;
  background: rgba(0,0,0,.13);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 8px;
}

.select-wrap select,
.month-wrap input {
  width: 100%;
  min-width: 0;
  color: #fff;
  background: transparent;
  border: 0;
  outline: 0;
  font: inherit;
  font-size: .65rem;
}

.select-wrap select option {
  color: #111827;
  background: #fff;
}

.period-preview strong {
  display: block;
  color: #fff;
  font-size: .74rem;
}

.period-preview small {
  display: block;
  margin-top: 3px;
  color: rgba(255,255,255,.33);
  font-size: .54rem;
}

.selected-period {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(79,70,229,.10), rgba(6,182,212,.05));
  border: 1px solid rgba(129,140,248,.13);
}

.selected-period span,
.selected-status span {
  display: block;
  color: rgba(255,255,255,.35);
  font-size: .51rem;
}

.selected-period strong,
.selected-status strong {
  display: block;
  margin-top: 3px;
  color: #e0e7ff;
  font-size: .67rem;
}

.selected-status {
  text-align: right;
}

.notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
  border-radius: 10px;
  font-size: .64rem;
}

.notice span {
  flex: 1;
}

.notice button {
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.notice.error {
  color: #fecaca;
  background: rgba(239,68,68,.09);
  border: 1px solid rgba(239,68,68,.18);
}

.notice.success {
  color: #a7f3d0;
  background: rgba(16,185,129,.08);
  border: 1px solid rgba(16,185,129,.18);
}

.loading-card {
  min-height: 300px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  text-align: center;
}

.loading-card strong {
  font-size: .78rem;
}

.loading-card span {
  color: rgba(255,255,255,.35);
  font-size: .60rem;
}

.loader-ring {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  color: #a78bfa;
  background: rgba(139,92,246,.08);
  border: 1px solid rgba(139,92,246,.15);
  border-radius: 15px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0,1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.summary-card {
  min-width: 0;
  padding: 11px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 13px;
  background: rgba(255,255,255,.035);
  transition: .18s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,.13);
}

.summary-icon {
  width: 35px;
  height: 35px;
  flex: 0 0 35px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(255,255,255,.055);
}

.summary-content {
  min-width: 0;
}

.summary-content span {
  display: block;
  color: rgba(255,255,255,.37);
  font-size: .51rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-content strong {
  display: block;
  margin-top: 4px;
  color: #f8fafc;
  font-size: .68rem;
  overflow-wrap: anywhere;
}

.summary-card.green .summary-icon { color: #6ee7b7; }
.summary-card.red .summary-icon { color: #fca5a5; }
.summary-card.purple .summary-icon { color: #c4b5fd; }
.summary-card.violet .summary-icon { color: #a78bfa; }
.summary-card.amber .summary-icon { color: #fcd34d; }
.summary-card.orange .summary-icon { color: #fb923c; }
.summary-card.blue .summary-icon { color: #67e8f9; }

.main-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 12px;
}

.content-card {
  min-width: 0;
  padding: clamp(13px, 2vw, 17px);
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 9px;
}

.download-card {
  min-width: 0;
  padding: 13px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 13px;
  background: rgba(255,255,255,.025);
  transition: .18s ease;
}

.download-card:hover {
  transform: translateY(-2px);
  border-color: rgba(103,232,249,.23);
  box-shadow: 0 12px 35px rgba(0,0,0,.15);
}

.download-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.format-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: rgba(255,255,255,.055);
}

.format-badge {
  padding: 4px 7px;
  border-radius: 6px;
  color: rgba(255,255,255,.45);
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.07);
  font-size: .48rem;
  font-weight: 900;
}

.download-card.pdf .format-icon { color: #fca5a5; }
.download-card.excel .format-icon { color: #6ee7b7; }
.download-card.text .format-icon { color: #67e8f9; }

.download-copy {
  min-height: 90px;
  margin-top: 11px;
}

.download-copy h3 {
  margin: 0;
  font-size: .76rem;
}

.download-copy p {
  margin: 5px 0 0;
  color: rgba(255,255,255,.38);
  font-size: .59rem;
  line-height: 1.55;
}

.download-action,
.secondary-button {
  width: 100%;
  min-height: 35px;
  border-radius: 9px;
  font-size: .59rem;
  font-weight: 850;
}

.download-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #fff;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.09);
  cursor: pointer;
}

.download-action:hover {
  background: rgba(255,255,255,.09);
  border-color: rgba(103,232,249,.30);
}

.status-box,
.backup-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 11px;
  background: rgba(255,255,255,.025);
}

.status-icon,
.backup-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  color: #6ee7b7;
  background: rgba(16,185,129,.08);
  border-radius: 10px;
}

.status-box strong,
.backup-box strong {
  display: block;
  font-size: .70rem;
}

.status-box span,
.backup-box span {
  display: block;
  margin-top: 3px;
  color: rgba(255,255,255,.36);
  font-size: .56rem;
  line-height: 1.4;
}

.mini-stats {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 7px;
  margin-top: 8px;
}

.mini-stat {
  padding: 9px;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 9px;
  background: rgba(255,255,255,.018);
}

.mini-stat span {
  display: block;
  color: rgba(255,255,255,.34);
  font-size: .51rem;
}

.mini-stat strong {
  display: block;
  margin-top: 4px;
  font-size: .66rem;
}

.preview-button,
.secondary-button {
  margin-top: 9px;
}

.preview-button {
  width: 100%;
  min-height: 36px;
  border-radius: 9px;
  font-size: .59rem;
  font-weight: 850;
}

.secondary-button {
  color: #fff;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.09);
  cursor: pointer;
}

.two-column {
  display: grid;
  grid-template-columns: 1.2fr .8fr;
  gap: 12px;
}

.category-list {
  display: grid;
  gap: 11px;
}

.category-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: rgba(255,255,255,.65);
  font-size: .60rem;
}

.category-top strong {
  color: #f8fafc;
  font-size: .62rem;
}

.progress {
  height: 7px;
  margin-top: 5px;
  overflow: hidden;
  background: rgba(255,255,255,.07);
  border-radius: 99px;
}

.progress span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #06b6d4);
  border-radius: inherit;
  transition: width .4s ease;
}

.category-row small {
  display: block;
  margin-top: 3px;
  color: rgba(255,255,255,.30);
  font-size: .50rem;
}

.backup-box {
  margin-bottom: 10px;
}

.backup-icon {
  color: #67e8f9;
  background: rgba(6,182,212,.08);
}

.coverage-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0,1fr));
  gap: 8px;
}

.coverage-card {
  padding: 11px;
  text-align: center;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 10px;
  background: rgba(255,255,255,.022);
}

.coverage-card span {
  display: block;
  color: rgba(255,255,255,.33);
  font-size: .52rem;
}

.coverage-card strong {
  display: block;
  margin-top: 4px;
  font-size: .90rem;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 10px;
  background: rgba(255,255,255,.015);
}

.table-scroll table {
  width: 100%;
  min-width: 930px;
  border-collapse: collapse;
  font-size: .57rem;
}

.table-scroll th,
.table-scroll td {
  padding: 8px 9px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid rgba(255,255,255,.055);
}

.table-scroll th {
  color: rgba(255,255,255,.45);
  background: rgba(255,255,255,.035);
  font-weight: 850;
}

.table-scroll td {
  color: rgba(255,255,255,.66);
}

.table-scroll tr:last-child td {
  border-bottom: 0;
}

.no-activity td {
  color: rgba(255,255,255,.23);
}

.positive-value {
  color: #6ee7b7 !important;
}

.negative-value {
  color: #fca5a5 !important;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 7px;
  border-radius: 99px;
  font-size: .48rem;
  font-weight: 850;
}

.status-tag.positive {
  color: #a7f3d0;
  background: rgba(16,185,129,.08);
}

.status-tag.negative {
  color: #fecaca;
  background: rgba(239,68,68,.08);
}

.status-tag.neutral {
  color: rgba(255,255,255,.34);
  background: rgba(255,255,255,.05);
}

.empty-state {
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255,255,255,.30);
  font-size: .61rem;
  border: 1px dashed rgba(255,255,255,.08);
  border-radius: 10px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: rgba(2,6,23,.82);
  backdrop-filter: blur(10px);
}

.preview-modal {
  width: min(1180px, 100%);
  max-height: calc(100vh - 28px);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.11);
  border-radius: 17px;
  background: #f8fafc;
  box-shadow: 0 35px 100px rgba(0,0,0,.58);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 15px;
  color: #fff;
  background: #0f172a;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.modal-head h2 {
  margin: 4px 0 2px;
  font-size: .88rem;
}

.modal-head p {
  margin: 0;
  color: rgba(255,255,255,.38);
  font-size: .58rem;
}

.eyebrow.dark {
  color: #94a3b8;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.modal-actions button {
  min-height: 33px;
  padding: 0 9px;
  border-radius: 8px;
  font-size: .57rem;
  font-weight: 800;
}

.modal-actions .close-modal {
  width: 33px;
  padding: 0;
}

.preview-body {
  max-height: calc(100vh - 91px);
  overflow: auto;
  padding: clamp(15px, 3vw, 28px);
  color: #1e293b;
  background: #f8fafc;
}

.document-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 2px solid #e2e8f0;
}

.document-logo {
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg,#4f46e5,#0891b2);
  border-radius: 11px;
  font-size: 1.1rem;
  font-weight: 900;
}

.document-header h1 {
  margin: 0;
  font-size: 1.05rem;
}

.document-header p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: .62rem;
}

.owner-grid,
.document-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0,1fr));
  gap: 8px;
  margin-top: 14px;
}

.document-field,
.document-metric {
  padding: 9px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.document-field span,
.document-metric span {
  display: block;
  color: #64748b;
  font-size: .52rem;
}

.document-field strong,
.document-metric strong {
  display: block;
  margin-top: 3px;
  color: #0f172a;
  font-size: .65rem;
  overflow-wrap: anywhere;
}

.preview-section {
  margin-top: 18px;
}

.preview-section h3 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: .76rem;
}

.table-scroll.light {
  border-color: #e2e8f0;
  background: #fff;
}

.table-scroll.light table {
  min-width: 650px;
  color: #334155;
}

.table-scroll.light th,
.table-scroll.light td {
  color: #334155;
  border-color: #e2e8f0;
}

.table-scroll.light th {
  color: #475569;
  background: #f1f5f9;
}

.table-scroll.light .empty-state {
  color: #64748b;
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 24px;
  padding-top: 11px;
  color: #64748b;
  border-top: 1px solid #e2e8f0;
  font-size: .52rem;
}

.summary-card,
.content-card,
.control-panel,
.download-card {
  transition:
    transform .22s ease,
    border-color .22s ease,
    box-shadow .22s ease;
}

.summary-card:hover,
.content-card:hover,
.control-panel:hover,
.download-card:hover {
  transform: translateY(-2px);
  border-color: rgba(129, 140, 248, .24);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, .20),
    0 0 24px rgba(99, 102, 241, .06);
}

.download-action {
  position: relative;
  overflow: hidden;
}

.download-action::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 20%,
    rgba(255,255,255,.14) 50%,
    transparent 80%
  );
  transform: translateX(-120%);
  transition: transform .45s ease;
}

.download-action:hover::after {
  transform: translateX(120%);
}

.select-wrap:focus-within,
.month-wrap:focus-within {
  border-color: rgba(167, 139, 250, .65);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, .10);
}

.select-wrap select option,
.select-wrap select optgroup {
  background: #ffffff;
  color: #111827;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(4, minmax(0,1fr));
  }

  .coverage-grid {
    grid-template-columns: repeat(3, minmax(0,1fr));
  }

  .main-grid,
  .two-column {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .controls-grid {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }

  .format-grid {
    grid-template-columns: 1fr;
  }

  .download-copy {
    min-height: auto;
  }

  .owner-grid,
  .document-metrics {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }
}

@media (max-width: 680px) {
  .export-page {
    padding:
      max(8px, env(safe-area-inset-top))
      max(8px, env(safe-area-inset-right))
      max(10px, env(safe-area-inset-bottom))
      max(8px, env(safe-area-inset-left));
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .top-actions {
    width: 100%;
  }

  .ghost-button {
    flex: 1;
  }

  .controls-grid {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }

  .coverage-grid {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }

  .selected-period {
    align-items: flex-start;
  }

  .modal-backdrop {
    padding: 7px;
  }

  .modal-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .modal-actions {
    width: 100%;
  }

  .modal-actions button:not(.close-modal) {
    flex: 1;
  }
}

@media (max-width: 430px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .coverage-grid {
    grid-template-columns: 1fr 1fr;
  }

  .owner-grid,
  .document-metrics {
    grid-template-columns: 1fr;
  }

  .brand p {
    max-width: 270px;
  }

  .selected-period {
    flex-direction: column;
  }

  .selected-status {
    width: 100%;
    text-align: left;
  }

  .modal-actions .close-modal {
    flex: 0 0 33px;
  }
}
`;

export default ExportDetails;