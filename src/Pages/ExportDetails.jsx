import React, { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  CalendarDays,
  Eye,
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileJson,
  BarChart3,
  Wallet,
  Receipt,
  Landmark,
  HandCoins,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://express-project-learning-new.onrender.com";

const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => today().slice(0, 7);

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

const numberValue = (value) => Number(value || 0);

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return 0;
};

const ExportDetails = () => {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const monthLabel = useMemo(() => {
    const [year, m] = month.split("-").map(Number);
    if (!year || !m) return month;
    return new Date(year, m - 1, 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError("");

      // Exact API available in the supplied backend:
      // GET /api/export-details/json?month=YYYY-MM
      const response = await fetch(
        `${API_BASE_URL}/api/export-details/json?month=${encodeURIComponent(month)}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to load export details."
        );
      }

      setData(result.data || {});
    } catch (err) {
      console.error("Export details GET error:", err);
      setError(err.message || "Failed to load export details.");
      setData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [month]);

  const user = data.user || {};
  const summary = data.summary || {};
  const overview = data.overview || {};

  const weekly = data.weekly || data.weeks || [];
  const expenses = data.expenses || [];
  const payments = data.payments || [];
  const loans = data.loans || [];
  const repayments = data.repayments || [];
  const expenseCategories = data.expenseCategories || [];
  const chart = data.chart || [];

  const summaryCards = [
    {
      label: "Total Income",
      value: money(summary.total_income),
      icon: ArrowDownToLine,
      className: "income",
    },
    {
      label: "Total Expenses",
      value: money(summary.total_expenses),
      icon: Receipt,
      className: "expense",
    },
    {
      label: "Loan / EMI",
      value: money(
        numberValue(summary.total_emi) +
          numberValue(summary.total_loan_repayment)
      ),
      icon: Landmark,
      className: "loan",
    },
    {
      label: "Borrow Repayment",
      value: money(summary.total_borrow_repayment),
      icon: HandCoins,
      className: "borrow",
    },
    {
      label: "Total Outgoing",
      value: money(summary.total_outgoing),
      icon: ArrowUpFromLine,
      className: "outgoing",
    },
    {
      label: "Net Result",
      value: money(summary.net),
      icon: Wallet,
      className: summary.net >= 0 ? "income" : "expense",
    },
  ];

  const endpointMap = {
    pdf: `/api/export-details/pdf?month=${encodeURIComponent(month)}`,
    excel: `/api/export-details/excel?month=${encodeURIComponent(month)}`,
    text: `/api/export-details/text?month=${encodeURIComponent(month)}`,
    overviewPdf: `/api/export-details/overview/pdf?month=${encodeURIComponent(month)}`,
    overviewExcel: `/api/export-details/overview/excel?month=${encodeURIComponent(month)}`,
    overviewText: `/api/export-details/overview/text?month=${encodeURIComponent(month)}`,
  };

  const downloadFile = async (type, label) => {
    try {
      setExporting(type);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}${endpointMap[type]}`,
        {
          method: "GET",
          headers: authHeaders(),
        }
      );

      if (!response.ok) {
        let errorMessage = `Failed to download ${label}.`;
        try {
          const result = await response.json();
          errorMessage = result.message || errorMessage;
        } catch {
          // Non-JSON response.
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");

      let filename = `Personal_Report_${month}`;
      const match = disposition?.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );

      if (match?.[1]) {
        filename = match[1].replace(/['"]/g, "");
      } else {
        const extension =
          type.toLowerCase().includes("excel")
            ? "xlsx"
            : type.toLowerCase().includes("pdf")
              ? "pdf"
              : "txt";
        filename += `.${extension}`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage(`${label} downloaded successfully.`);
    } catch (err) {
      console.error(`${type} export error:`, err);
      setError(err.message || `Unable to download ${label}.`);
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

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Personal_Report_${month}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage("JSON preview data downloaded successfully.");
    } catch (err) {
      setError(err.message || "Unable to download JSON.");
    }
  };

  const printPreview = () => window.print();

  const actionCards = [
    {
      key: "pdf",
      title: "Full Professional PDF",
      description:
        "Complete monthly report with profile, summary, overview, categories, weekly performance, payments, expenses, loans and repayments.",
      icon: FileText,
      className: "pdf",
      button: "Download PDF",
      onClick: () => downloadFile("pdf", "Full PDF report"),
    },
    {
      key: "excel",
      title: "Full Professional Excel",
      description:
        "Complete workbook with separate professional worksheets for all financial records and summary data.",
      icon: FileSpreadsheet,
      className: "excel",
      button: "Download Excel",
      onClick: () => downloadFile("excel", "Full Excel report"),
    },
    {
      key: "text",
      title: "Full Text Report",
      description:
        "Clean plain-text backup containing the complete selected-month report.",
      icon: FileText,
      className: "text",
      button: "Download TXT",
      onClick: () => downloadFile("text", "Full text report"),
    },
    {
      key: "overviewPdf",
      title: "Overview PDF",
      description:
        "Short management-style overview with business, work, monthly result and outstanding payment status.",
      icon: BarChart3,
      className: "overview",
      button: "Download PDF",
      onClick: () => downloadFile("overviewPdf", "Overview PDF"),
    },
    {
      key: "overviewExcel",
      title: "Overview Excel",
      description:
        "Compact overview worksheet containing profile, business, work and monthly financial results.",
      icon: FileSpreadsheet,
      className: "overviewExcel",
      button: "Download Excel",
      onClick: () => downloadFile("overviewExcel", "Overview Excel"),
    },
    {
      key: "overviewText",
      title: "Overview Text",
      description:
        "Simple overview backup containing key financial results and payment status.",
      icon: FileText,
      className: "overviewText",
      button: "Download TXT",
      onClick: () => downloadFile("overviewText", "Overview text"),
    },
  ];

  return (
    <div className="export-page">
      <style>{styles}</style>

      <header className="topbar">
        <div className="title-area">
          <div className="title-icon">
            <Download size={22} />
          </div>
          <div>
            <h1>Export Details</h1>
            <p>
              Professional reports and complete financial exports
            </p>
          </div>
        </div>

        <div className="toolbar">
          <label className="month-control">
            <CalendarDays size={17} />
            <span>Month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>

          <button
            className="icon-button"
            onClick={loadDetails}
            title="Refresh report"
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "spin" : ""}
            />
          </button>
        </div>
      </header>

      {error && (
        <div className="notice error">
          <AlertCircle size={17} />
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {message && (
        <div className="notice success">
          <CheckCircle2 size={17} />
          <span>{message}</span>
          <button onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="report-heading">
        <div>
          <span className="eyebrow">SELECTED REPORT PERIOD</span>
          <h2>{monthLabel}</h2>
          <p>
            Select a month and download the complete report or a
            compact overview in PDF, Excel or text format.
          </p>
        </div>

        <div className="heading-status">
          <span>Status</span>
          <strong>{summary.status || "No Activity"}</strong>
        </div>
      </section>

      {loading ? (
        <div className="loading-card">
          <RefreshCw size={28} className="spin" />
          <strong>Loading report details...</strong>
          <span>Fetching the selected month from the API.</span>
        </div>
      ) : (
        <>
          <section className="summary-grid">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div className={`summary-card ${card.className}`} key={card.label}>
                  <div className="summary-icon">
                    <Icon size={18} />
                  </div>
                  <div className="summary-info">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="profile-card">
            <div className="section-title">
              <div>
                <span className="eyebrow">REPORT OWNER</span>
                <h2>Profile & Overview</h2>
              </div>
            </div>

            <div className="profile-grid">
              <div className="profile-main">
                <div className="avatar">
                  {(user.full_name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{user.full_name || "User"}</h3>
                  <p>
                    {user.profession || "Personal Dashboard"}
                  </p>
                  <small>
                    {user.username
                      ? `@${user.username}`
                      : user.email_address || "-"}
                  </small>
                </div>
              </div>

              <div className="detail-list">
                <div>
                  <span>Email</span>
                  <strong>{user.email_address || "-"}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{user.phone1 || "-"}</strong>
                </div>
                <div>
                  <span>Business</span>
                  <strong>{overview.total_business ?? 0}</strong>
                </div>
                <div>
                  <span>Works</span>
                  <strong>{overview.total_works ?? 0}</strong>
                </div>
                <div>
                  <span>Business Payment</span>
                  <strong>{money(overview.business_payment)}</strong>
                </div>
                <div>
                  <span>Work Payment</span>
                  <strong>{money(overview.work_payment)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="section-block">
            <div className="section-title">
              <div>
                <span className="eyebrow">COMPLETE REPORT</span>
                <h2>Download All Details</h2>
                <p>
                  These buttons use the same authenticated APIs from
                  your Express export router.
                </p>
              </div>
            </div>

            <div className="action-grid">
              {actionCards.slice(0, 3).map((card) => (
                <ActionCard
                  key={card.key}
                  card={card}
                  exporting={exporting}
                />
              ))}
            </div>
          </section>

          <section className="section-block">
            <div className="section-title">
              <div>
                <span className="eyebrow">QUICK MANAGEMENT EXPORT</span>
                <h2>Overview Downloads</h2>
                <p>
                  Shorter files for sharing, review and quick backup.
                </p>
              </div>
            </div>

            <div className="action-grid">
              {actionCards.slice(3).map((card) => (
                <ActionCard
                  key={card.key}
                  card={card}
                  exporting={exporting}
                />
              ))}
            </div>
          </section>

          <section className="section-block">
            <div className="section-title">
              <div>
                <span className="eyebrow">LOCAL PREVIEW</span>
                <h2>Preview & JSON Backup</h2>
                <p>
                  Preview the current API data before downloading.
                </p>
              </div>
            </div>

            <div className="utility-grid">
              <button
                className="utility-card"
                onClick={() => setPreviewOpen(true)}
              >
                <div className="utility-icon purple">
                  <Eye size={20} />
                </div>
                <div>
                  <strong>Open Professional Preview</strong>
                  <span>View report layout and weekly details.</span>
                </div>
              </button>

              <button
                className="utility-card"
                onClick={downloadJson}
              >
                <div className="utility-icon blue">
                  <FileJson size={20} />
                </div>
                <div>
                  <strong>Download JSON Backup</strong>
                  <span>
                    Save the exact JSON data returned by the API.
                  </span>
                </div>
              </button>
            </div>
          </section>

          <section className="section-block">
            <div className="section-title">
              <div>
                <span className="eyebrow">DATA COVERAGE</span>
                <h2>Included Records</h2>
              </div>
            </div>

            <div className="coverage-grid">
              <Coverage label="Weekly Performance" value={weekly.length} />
              <Coverage label="Expense Records" value={expenses.length} />
              <Coverage label="Payment Records" value={payments.length} />
              <Coverage label="Loan / Borrow Records" value={loans.length} />
              <Coverage label="Repayment Records" value={repayments.length} />
              <Coverage
                label="Expense Categories"
                value={expenseCategories.length}
              />
            </div>
          </section>
        </>
      )}

      {previewOpen && (
        <PreviewModal
          monthLabel={monthLabel}
          month={month}
          user={user}
          summary={summary}
          overview={overview}
          weekly={weekly}
          expenses={expenses}
          payments={payments}
          loans={loans}
          repayments={repayments}
          expenseCategories={expenseCategories}
          chart={chart}
          onClose={() => setPreviewOpen(false)}
          onPrint={printPreview}
        />
      )}
    </div>
  );
};

const ActionCard = ({ card, exporting }) => {
  const Icon = card.icon;
  const busy = exporting === card.key;

  return (
    <div className={`action-card ${card.className}`}>
      <div className="action-top">
        <div className="action-icon">
          <Icon size={21} />
        </div>
        <span className="file-badge">
          {card.key.toLowerCase().includes("excel")
            ? "XLSX"
            : card.key.toLowerCase().includes("pdf")
              ? "PDF"
              : "TXT"}
        </span>
      </div>

      <div className="action-content">
        <h3>{card.title}</h3>
        <p>{card.description}</p>
      </div>

      <button
        className="download-button"
        onClick={card.onClick}
        disabled={Boolean(exporting)}
      >
        {busy ? (
          <RefreshCw size={15} className="spin" />
        ) : (
          <Download size={15} />
        )}
        {busy ? "Preparing..." : card.button}
      </button>
    </div>
  );
};

const Coverage = ({ label, value }) => (
  <div className="coverage-card">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const PreviewModal = ({
  monthLabel,
  month,
  user,
  summary,
  overview,
  weekly,
  expenses,
  payments,
  loans,
  repayments,
  expenseCategories,
  chart,
  onClose,
  onPrint,
}) => {
  const safe = (value) =>
    value === undefined || value === null || value === ""
      ? "-"
      : String(value);

  return (
    <div className="preview-backdrop" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="preview-modal">
        <div className="preview-toolbar">
          <div>
            <span className="eyebrow dark">REPORT PREVIEW</span>
            <h2>Personal Financial Report</h2>
            <p>
              {user.full_name || "User"} • {monthLabel}
            </p>
          </div>

          <div className="preview-buttons">
            <button onClick={onPrint}>
              <Printer size={15} />
              Print
            </button>
            <button className="close-button" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="preview-body">
          <div className="document-header">
            <div className="document-mark">₹</div>
            <div>
              <h1>Personal Financial Report</h1>
              <p>{monthLabel}</p>
            </div>
          </div>

          <div className="document-owner">
            <div>
              <span>Name</span>
              <strong>{safe(user.full_name)}</strong>
            </div>
            <div>
              <span>Profession</span>
              <strong>{safe(user.profession)}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{safe(user.email_address)}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{safe(user.phone1)}</strong>
            </div>
          </div>

          <PreviewSection title="Monthly Financial Summary">
            <div className="document-cards">
              <DocMetric label="Income" value={money(summary.total_income)} />
              <DocMetric label="Expenses" value={money(summary.total_expenses)} />
              <DocMetric label="EMI / Loan" value={money(
                numberValue(summary.total_emi) +
                numberValue(summary.total_loan_repayment)
              )} />
              <DocMetric label="Borrow Repayment" value={money(summary.total_borrow_repayment)} />
              <DocMetric label="Total Outgoing" value={money(summary.total_outgoing)} />
              <DocMetric label="Net" value={money(summary.net)} />
              <DocMetric label="Savings" value={money(summary.savings)} />
              <DocMetric label="Loss" value={money(summary.loss)} />
              <DocMetric label="Status" value={safe(summary.status)} />
            </div>
          </PreviewSection>

          <PreviewSection title="Overview">
            <div className="simple-table">
              <Row label="Total Business" value={safe(overview.total_business)} />
              <Row label="Total Works" value={safe(overview.total_works)} />
              <Row label="Business Payment" value={money(overview.business_payment)} />
              <Row label="Work Payment" value={money(overview.work_payment)} />
              <Row label="Pending" value={money(summary.pending)} />
              <Row label="Overdue" value={money(summary.overdue)} />
              <Row label="Lost" value={money(summary.lost)} />
            </div>
          </PreviewSection>

          <PreviewSection title="Financial Distribution">
            {chart.length === 0 ? (
              <p className="muted">No chart data available.</p>
            ) : (
              <div className="distribution-list">
                {chart.map((item, index) => {
                  const total = chart.reduce(
                    (sum, row) => sum + numberValue(row.value),
                    0
                  );
                  const percentage =
                    total > 0
                      ? (numberValue(item.value) / total) * 100
                      : 0;

                  return (
                    <div className="distribution-row" key={index}>
                      <div className="distribution-label">
                        <span>{safe(item.label)}</span>
                        <strong>{money(item.value)}</strong>
                      </div>
                      <div className="bar">
                        <div style={{ width: `${percentage}%` }} />
                      </div>
                      <small>{percentage.toFixed(1)}%</small>
                    </div>
                  );
                })}
              </div>
            )}
          </PreviewSection>

          <PreviewSection title="Weekly Performance">
            <Table
              headers={[
                "Week",
                "Income",
                "Expenses",
                "Loan / EMI",
                "Borrow",
                "Outgoing",
                "Net",
                "Status",
              ]}
              rows={weekly.map((row) => [
                `Week ${row.week}`,
                money(row.income),
                money(row.expenses),
                money(
                  numberValue(row.loan_emi) +
                    numberValue(row.loan_repayment)
                ),
                money(row.borrow_repayment),
                money(row.outgoing),
                money(row.net),
                safe(row.status),
              ])}
              empty="No weekly records available."
            />
          </PreviewSection>

          <PreviewSection title="Expense Categories">
            <Table
              headers={["Category", "Total"]}
              rows={expenseCategories.map((row) => [
                safe(row.category),
                money(row.total),
              ])}
              empty="No expense categories."
            />
          </PreviewSection>

          <PreviewSection title="Payments">
            <Table
              headers={[
                "Person",
                "Category",
                "Amount",
                "Date",
                "Received",
                "Status",
              ]}
              rows={payments.map((row) => [
                safe(row.person_name),
                safe(row.category),
                money(row.amount),
                safe(row.payment_date),
                row.received_at
                  ? String(row.received_at).slice(0, 10)
                  : "-",
                safe(row.status),
              ])}
              empty="No payments."
            />
          </PreviewSection>

          <PreviewSection title="Expenses">
            <Table
              headers={["Category", "Amount", "Date", "Notes"]}
              rows={expenses.map((row) => [
                safe(row.category),
                money(row.amount),
                safe(row.expense_date),
                safe(row.notes),
              ])}
              empty="No expenses."
            />
          </PreviewSection>

          <PreviewSection title="Loans & Borrow">
            <Table
              headers={[
                "Name",
                "Type",
                "Amount",
                "EMI",
                "Start",
                "Due",
                "Status",
              ]}
              rows={loans.map((row) => [
                safe(row.name),
                safe(row.type),
                money(row.amount),
                money(row.emi),
                safe(row.start_date),
                safe(
                  row.type === "Loan"
                    ? row.end_date
                    : row.return_date
                ),
                safe(row.status),
              ])}
              empty="No loans or borrow records."
            />
          </PreviewSection>

          <PreviewSection title="Repayments">
            <Table
              headers={[
                "Loan ID",
                "Amount",
                "Date",
                "Type",
                "Notes",
              ]}
              rows={repayments.map((row) => [
                safe(row.loan_id),
                money(row.amount),
                safe(row.payment_date),
                safe(row.payment_type),
                safe(row.notes),
              ])}
              empty="No repayments."
            />
          </PreviewSection>

          <div className="document-footer">
            <span>Personal Dashboard Export</span>
            <span>Month: {month}</span>
            <span>
              Generated: {new Date().toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviewSection = ({ title, children }) => (
  <section className="preview-section">
    <h3>{title}</h3>
    {children}
  </section>
);

const DocMetric = ({ label, value }) => (
  <div className="doc-metric">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const Row = ({ label, value }) => (
  <div className="simple-row">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const Table = ({ headers, rows, empty }) => {
  if (!rows.length) {
    return <p className="muted">{empty}</p>;
  }

  return (
    <div className="table-scroll">
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
* {
  box-sizing: border-box;
}

.export-page {
  width: 100%;
  min-height: 100%;
  padding: 18px;
  color: #f8fafc;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}

.title-area,
.toolbar,
.month-control,
.report-heading,
.action-top,
.utility-card,
.profile-main,
.section-title {
  display: flex;
  align-items: center;
}

.title-area {
  gap: 11px;
  min-width: 0;
}

.title-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  color: #67e8f9;
  background: rgba(34, 211, 238, .10);
  border: 1px solid rgba(103, 232, 249, .15);
  border-radius: 13px;
}

.title-area h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 850;
  letter-spacing: -.02em;
}

.title-area p {
  margin: 4px 0 0;
  color: rgba(255,255,255,.48);
  font-size: .73rem;
}

.toolbar {
  gap: 8px;
}

.month-control {
  height: 40px;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 11px;
  background: rgba(255,255,255,.045);
}

.month-control span {
  color: rgba(255,255,255,.45);
  font-size: .65rem;
}

.month-control input {
  width: 125px;
  color: #fff;
  background: transparent;
  border: 0;
  outline: 0;
  font-size: .75rem;
}

.icon-button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 11px;
  cursor: pointer;
}

.icon-button:hover {
  border-color: rgba(103,232,249,.30);
}

.icon-button:disabled {
  opacity: .55;
}

.report-heading {
  justify-content: space-between;
  gap: 15px;
  padding: 18px;
  margin-bottom: 12px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 16px;
  background: rgba(255,255,255,.035);
}

.eyebrow {
  display: block;
  color: rgba(255,255,255,.38);
  font-size: .58rem;
  font-weight: 850;
  letter-spacing: .12em;
}

.report-heading h2 {
  margin: 5px 0 4px;
  font-size: 1.25rem;
}

.report-heading p {
  max-width: 650px;
  margin: 0;
  color: rgba(255,255,255,.48);
  font-size: .70rem;
  line-height: 1.5;
}

.heading-status {
  min-width: 125px;
  padding: 11px 13px;
  text-align: right;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 11px;
  background: rgba(255,255,255,.025);
}

.heading-status span {
  display: block;
  color: rgba(255,255,255,.35);
  font-size: .57rem;
}

.heading-status strong {
  display: block;
  margin-top: 4px;
  font-size: .72rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 12px;
}

.summary-card,
.profile-card,
.section-block,
.loading-card {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 16px;
  background: rgba(255,255,255,.035);
  box-shadow: 0 12px 32px rgba(0,0,0,.12);
}

.summary-card {
  min-width: 0;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 9px;
}

.summary-icon {
  width: 37px;
  height: 37px;
  flex: 0 0 37px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(255,255,255,.055);
}

.summary-info {
  min-width: 0;
}

.summary-info span {
  display: block;
  color: rgba(255,255,255,.40);
  font-size: .57rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-info strong {
  display: block;
  margin-top: 4px;
  font-size: .72rem;
  overflow-wrap: anywhere;
}

.income .summary-icon { color: #6ee7b7; }
.expense .summary-icon { color: #fca5a5; }
.loan .summary-icon { color: #c4b5fd; }
.borrow .summary-icon { color: #fcd34d; }
.outgoing .summary-icon { color: #fb7185; }

.profile-card {
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  justify-content: space-between;
  gap: 12px;
}

.section-title h2 {
  margin: 4px 0 0;
  font-size: .95rem;
}

.section-title p {
  margin: 4px 0 0;
  color: rgba(255,255,255,.43);
  font-size: .65rem;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(250px, .75fr) 1.25fr;
  gap: 14px;
  margin-top: 14px;
}

.profile-main {
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
  background: rgba(255,255,255,.025);
}

.avatar {
  width: 47px;
  height: 47px;
  display: grid;
  place-items: center;
  flex: 0 0 47px;
  color: #fff;
  background: linear-gradient(135deg, #4f46e5, #0891b2);
  border-radius: 13px;
  font-weight: 900;
  font-size: 1rem;
}

.profile-main h3 {
  margin: 0;
  font-size: .82rem;
}

.profile-main p {
  margin: 3px 0;
  color: rgba(255,255,255,.45);
  font-size: .65rem;
}

.profile-main small {
  color: rgba(255,255,255,.30);
  font-size: .59rem;
}

.detail-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 8px;
}

.detail-list > div,
.coverage-card {
  padding: 10px;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 10px;
  background: rgba(255,255,255,.022);
}

.detail-list span,
.coverage-card span {
  display: block;
  color: rgba(255,255,255,.36);
  font-size: .57rem;
}

.detail-list strong,
.coverage-card strong {
  display: block;
  margin-top: 4px;
  font-size: .68rem;
  overflow-wrap: anywhere;
}

.section-block {
  padding: 16px;
  margin-bottom: 12px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 10px;
  margin-top: 13px;
}

.action-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 13px;
  background: rgba(255,255,255,.025);
  transition: .18s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  border-color: rgba(103,232,249,.24);
}

.action-top {
  justify-content: space-between;
}

.action-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: rgba(255,255,255,.055);
}

.pdf .action-icon { color: #fca5a5; }
.excel .action-icon { color: #6ee7b7; }
.text .action-icon { color: #67e8f9; }
.overview .action-icon { color: #c4b5fd; }
.overviewExcel .action-icon { color: #34d399; }
.overviewText .action-icon { color: #60a5fa; }

.file-badge {
  padding: 4px 7px;
  color: rgba(255,255,255,.42);
  background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 6px;
  font-size: .50rem;
  font-weight: 850;
}

.action-content {
  min-height: 84px;
  margin-top: 12px;
}

.action-content h3 {
  margin: 0;
  font-size: .77rem;
}

.action-content p {
  margin: 5px 0 0;
  color: rgba(255,255,255,.40);
  font-size: .62rem;
  line-height: 1.5;
}

.download-button {
  width: 100%;
  min-height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #fff;
  background: rgba(255,255,255,.055);
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 9px;
  cursor: pointer;
  font-size: .61rem;
  font-weight: 800;
}

.download-button:hover {
  background: rgba(255,255,255,.09);
  border-color: rgba(103,232,249,.30);
}

.download-button:disabled {
  opacity: .48;
  cursor: not-allowed;
}

.utility-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 10px;
  margin-top: 13px;
}

.utility-card {
  width: 100%;
  gap: 11px;
  padding: 13px;
  text-align: left;
  color: #fff;
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
  cursor: pointer;
}

.utility-card:hover {
  border-color: rgba(103,232,249,.25);
}

.utility-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(255,255,255,.06);
}

.utility-icon.purple { color: #c4b5fd; }
.utility-icon.blue { color: #67e8f9; }

.utility-card strong {
  display: block;
  font-size: .72rem;
}

.utility-card span {
  display: block;
  margin-top: 4px;
  color: rgba(255,255,255,.38);
  font-size: .60rem;
}

.coverage-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0,1fr));
  gap: 8px;
  margin-top: 13px;
}

.coverage-card {
  text-align: center;
}

.coverage-card strong {
  font-size: .92rem;
}

.notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 11px;
  border-radius: 10px;
  font-size: .67rem;
}

.notice span {
  flex: 1;
}

.notice button {
  color: inherit;
  border: 0;
  background: transparent;
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
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  color: rgba(255,255,255,.45);
  font-size: .72rem;
}

.loading-card strong {
  color: rgba(255,255,255,.70);
  font-size: .78rem;
}

.loading-card span {
  color: rgba(255,255,255,.35);
  font-size: .62rem;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.preview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(2,6,23,.80);
  backdrop-filter: blur(9px);
}

.preview-modal {
  width: min(1100px, 100%);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 17px;
  box-shadow: 0 30px 90px rgba(0,0,0,.55);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.preview-toolbar h2 {
  margin: 4px 0 2px;
  font-size: .90rem;
}

.preview-toolbar p {
  margin: 0;
  color: rgba(255,255,255,.40);
  font-size: .61rem;
}

.preview-buttons {
  display: flex;
  gap: 7px;
}

.preview-buttons button {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  color: #fff;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 8px;
  cursor: pointer;
  font-size: .61rem;
  font-weight: 750;
}

.preview-buttons .close-button {
  width: 34px;
  padding: 0;
}

.preview-body {
  max-height: calc(100vh - 95px);
  overflow: auto;
  padding: 25px;
  color: #111827;
  background: #f8fafc;
}

.document-header {
  display: flex;
  align-items: center;
  gap: 11px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e2e8f0;
}

.document-mark {
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  color: #fff;
  background: #4f46e5;
  border-radius: 11px;
  font-size: 1.1rem;
  font-weight: 900;
}

.document-header h1 {
  margin: 0;
  font-size: 1.08rem;
}

.document-header p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: .65rem;
}

.document-owner {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 8px;
  margin: 16px 0;
}

.document-owner > div,
.doc-metric,
.simple-row {
  padding: 9px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.document-owner span,
.doc-metric span {
  display: block;
  color: #64748b;
  font-size: .57rem;
}

.document-owner strong,
.doc-metric strong {
  display: block;
  margin-top: 3px;
  color: #1e293b;
  font-size: .67rem;
  overflow-wrap: anywhere;
}

.preview-section {
  margin-top: 18px;
}

.preview-section h3 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: .78rem;
}

.document-cards {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 8px;
}

.simple-table {
  display: grid;
  gap: 6px;
}

.simple-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.simple-row span {
  color: #64748b;
  font-size: .60rem;
}

.simple-row strong {
  color: #1e293b;
  font-size: .66rem;
  text-align: right;
}

.distribution-list {
  display: grid;
  gap: 10px;
}

.distribution-label {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #475569;
  font-size: .61rem;
}

.distribution-label strong {
  color: #0f172a;
}

.bar {
  height: 7px;
  margin-top: 5px;
  overflow: hidden;
  background: #e2e8f0;
  border-radius: 10px;
}

.bar > div {
  height: 100%;
  background: #4f46e5;
  border-radius: inherit;
}

.distribution-row small {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: .52rem;
}

.table-scroll {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.table-scroll table {
  width: 100%;
  min-width: 650px;
  border-collapse: collapse;
  font-size: .59rem;
}

.table-scroll th,
.table-scroll td {
  padding: 7px 8px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #e2e8f0;
}

.table-scroll th {
  color: #475569;
  background: #f1f5f9;
  font-weight: 850;
}

.table-scroll td {
  color: #334155;
}

.muted {
  margin: 0;
  color: #64748b;
  font-size: .61rem;
}

.document-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 25px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  color: #64748b;
  font-size: .54rem;
}

@media (max-width: 1050px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0,1fr));
  }

  .coverage-grid {
    grid-template-columns: repeat(3, minmax(0,1fr));
  }

  .action-grid {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }
}

@media (max-width: 800px) {
  .export-page {
    padding: 11px;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar {
    width: 100%;
  }

  .month-control {
    flex: 1;
  }

  .month-control input {
    width: 100%;
  }

  .report-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .heading-status {
    width: 100%;
    text-align: left;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }

  .detail-list {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }

  .document-owner {
    grid-template-columns: repeat(2,1fr);
  }
}

@media (max-width: 600px) {
  .summary-grid,
  .action-grid,
  .utility-grid {
    grid-template-columns: 1fr;
  }

  .coverage-grid {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }

  .section-block,
  .profile-card {
    padding: 13px;
  }

  .document-cards {
    grid-template-columns: repeat(2,1fr);
  }

  .preview-body {
    padding: 16px;
  }
}

@media (max-width: 430px) {
  .export-page {
    padding: 8px;
  }

  .title-area h1 {
    font-size: 1.15rem;
  }

  .title-area p {
    font-size: .62rem;
  }

  .detail-list,
  .coverage-grid,
  .document-owner,
  .document-cards {
    grid-template-columns: 1fr;
  }

  .action-card {
    padding: 12px;
  }

  .document-footer {
    flex-direction: column;
  }
}

@media print {
  body {
    background: #fff !important;
  }

  .export-page > *:not(.preview-backdrop) {
    display: none !important;
  }

  .preview-backdrop {
    position: static;
    padding: 0;
    background: #fff;
  }

  .preview-modal {
    width: 100%;
    max-height: none;
    border: 0;
    box-shadow: none;
  }

  .preview-toolbar {
    display: none;
  }

  .preview-body {
    max-height: none;
    overflow: visible;
  }
}
`;

export default ExportDetails;
