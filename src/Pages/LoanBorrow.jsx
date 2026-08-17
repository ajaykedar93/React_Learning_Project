import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  IndianRupee,
  Landmark,
  HandCoins,
  Clock3,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://express-project-learning-new.onrender.com";

const PAGE_SIZE = 10;

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

const today = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

// Display dates everywhere in the details as: 1 Jan 2026
const formatDisplayDate = (date) => {
  if (!date) return "-";

  const raw = String(date).slice(0, 10);
  const [year, month, day] = raw.split("-").map(Number);

  if (!year || !month || !day) return date;

  const d = new Date(year, month - 1, day);

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const monthValue = () => today().slice(0, 7);

const daysBetween = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.ceil((b - a) / 86400000));
};

const remainingText = (date) => {
  if (!date) return "-";

  const days = daysBetween(today(), date);

  if (date < today()) {
    const overdue = daysBetween(date, today());
    return `${overdue} day${overdue === 1 ? "" : "s"} overdue`;
  }

  if (days === 0) return "Due today";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} remaining`;

  const months = Math.floor(days / 30);
  const leftDays = days % 30;

  return `${months} month${months === 1 ? "" : "s"}${
    leftDays ? ` ${leftDays} day${leftDays === 1 ? "" : "s"}` : ""
  } remaining`;
};

const normalizeRows = (result) => {
  const rows =
    result?.data?.rows ||
    result?.data?.loans ||
    result?.data?.borrow ||
    result?.data ||
    result?.loans ||
    result?.borrow ||
    result?.rows ||
    result ||
    [];

  return Array.isArray(rows) ? rows : [];
};

const normalizeDateForInput = (value) => {
  if (!value) return "";
  const raw = String(value);
  return raw.includes("T") ? raw.slice(0, 10) : raw.slice(0, 10);
};

const normalizeType = (value) => {
  const type = String(value || "").trim().toLowerCase();
  return type === "loan" ? "Loan" : "Borrow";
};

const LoanBorrow = () => {
  const [month, setMonth] = useState(monthValue());
  const [typeFilter, setTypeFilter] = useState("All");
  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = React.useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    type: "Borrow",
    name: "",
    amount: "",
    loanDate: today(),
    returnDate: "",
    emi: "",
    notes: "",
  });

  const headers = () => ({
    "Content-Type": "application/json",
    ...(getToken()
      ? { Authorization: `Bearer ${getToken()}` }
      : {}),
  });

  const showToast = (type, text) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, text });
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setToast(null);

      const response = await fetch(
        `${API_BASE_URL}/api/loan-borrow?month=${encodeURIComponent(month)}&t=${Date.now()}`,
        {
          method: "GET",
          headers: headers(),
        }
      );

      const rawText = await response.text();
      let result = {};

      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          rawText || `Server returned HTTP ${response.status}.`
        );
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
          result.error ||
          `Failed to load loan and borrow details. HTTP ${response.status}.`
        );
      }

      const normalized = normalizeRows(result);
      setRows(normalized);
      setPage(1);
    } catch (err) {
      console.error("Loan/Borrow GET error:", err);
      showToast("error", err.message || "Failed to load loan and borrow details.");
      // Keep the last successfully loaded details visible on a transient GET error.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month]);

  const resetForm = () => {
    setForm({
      type: "Borrow",
      name: "",
      amount: "",
      loanDate: today(),
      returnDate: "",
      emi: "",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      type: "Borrow",
      name: "",
      amount: "",
      loanDate: today(),
      returnDate: "",
      emi: "",
      notes: "",
    });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id ?? item.loan_id ?? item.borrow_id);

    setForm({
      type: normalizeType(item.type ?? item.loan_type ?? item.entry_type),
      name:
        item.name ??
        item.person_name ??
        item.personName ??
        item.loan_name ??
        "",
      amount: String(item.amount ?? item.loan_amount ?? ""),
      loanDate: normalizeDateForInput(
        item.loan_date ??
        item.start_date ??
        item.loanDate ??
        item.startDate
      ) || today(),
      returnDate: normalizeDateForInput(
        item.return_date ??
        item.end_date ??
        item.returnDate ??
        item.endDate
      ),
      emi: String(item.emi ?? item.emi_amount ?? item.monthly_payment ?? ""),
      notes: item.notes ?? item.description ?? "",
    });

    setToast(null);
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!form.name.trim()) {
      showToast("error", "Please enter the person or loan name.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("error", "Please enter a valid amount.");
      return;
    }

    if (!form.loanDate) {
      showToast(
        "error",
        form.type === "Loan"
          ? "Please select loan start date."
          : "Please select borrow date."
      );
      return;
    }

    if (!form.returnDate) {
      showToast(
        "error",
        form.type === "Loan"
          ? "Please select loan end date."
          : "Please select return date."
      );
      return;
    }

    if (form.returnDate < form.loanDate) {
      showToast("error", "Return/end date cannot be before the start date.");
      return;
    }

    try {
      setSaving(true);

      const isEdit = Boolean(editingId);

      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/loan-borrow/${editingId}`
          : `${API_BASE_URL}/api/loan-borrow`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: headers(),
          body: JSON.stringify({
            type: form.type,
            name: form.name.trim(),
            amount,
            loan_date: form.loanDate,
            return_date: form.returnDate,
            emi: Number(form.emi || 0),
            notes: form.notes.trim() || null,
            month,
          }),
        }
      );

      const rawText = await response.text();
      let result = {};

      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          rawText || `Server returned HTTP ${response.status}.`
        );
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
          result.error ||
          `Failed to ${isEdit ? "update" : "add"} entry.`
        );
      }

      showToast(
        "success",
        isEdit
          ? "Loan/Borrow updated successfully."
          : "Loan/Borrow added successfully."
      );

      resetForm();
      await loadData();
    } catch (err) {
      console.error("Loan/Borrow save error:", err);
      showToast("error", err.message || "Unable to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (id) => setDeleteId(id);

  const deleteItem = async () => {
    const id = deleteId;
    if (!id) return;

    setDeleteId(null);

    try {

      const response = await fetch(
        `${API_BASE_URL}/api/loan-borrow/${id}`,
        {
          method: "DELETE",
          headers: headers(),
        }
      );

      const rawText = await response.text();
      let result = {};

      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          rawText || `Server returned HTTP ${response.status}.`
        );
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
          result.error ||
          "Failed to delete entry."
        );
      }

      showToast("success", "Entry deleted successfully.");
      await loadData();
    } catch (err) {
      console.error("Loan/Borrow delete error:", err);
      showToast("error", err.message || "Unable to delete entry.");
    }
  };

  const filteredRows = useMemo(() => {
    if (typeFilter === "All") return rows;

    return rows.filter(
      (item) =>
        String(item.type || "").toLowerCase() ===
        typeFilter.toLowerCase()
    );
  }, [rows, typeFilter]);

  const totalBorrow = useMemo(
    () =>
      rows
        .filter(
          (item) =>
            String(item.type || "").toLowerCase() === "borrow"
        )
        .reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        ),
    [rows]
  );

  const totalLoan = useMemo(
    () =>
      rows
        .filter(
          (item) =>
            String(item.type || "").toLowerCase() === "loan"
        )
        .reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        ),
    [rows]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / PAGE_SIZE)
  );

  const visibleRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const monthLabel = useMemo(() => {
    const [year, m] = month.split("-").map(Number);
    return new Date(year, m - 1, 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  return (
    <div className="loan-page">
      <style>{styles}</style>

      <header className="loan-header">
        <div>
          <div className="loan-title">
            <Landmark size={22} />
            <h1>Loan & Borrow</h1>
          </div>
          <p>
            Track borrowed money, loans, dates and remaining time for{" "}
            {monthLabel}.
          </p>
        </div>

        <div className="loan-actions">
          <label className="month-picker">
            <CalendarDays size={17} />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>

          <button
            className="icon-button"
            onClick={loadData}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>

          <button className="add-button" onClick={openAdd}>
            <Plus size={17} />
            Add
          </button>
        </div>
      </header>

      {toast && (
        <div className={`toast-notification ${toast.type}`} role="status">
          <span className="toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <span className="toast-text">{toast.text}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <section className="totals-grid">
        <div className="total-card">
          <div className="total-icon borrow">
            <HandCoins size={19} />
          </div>
          <span>Total Borrow</span>
          <strong>{money(totalBorrow)}</strong>
        </div>

        <div className="total-card">
          <div className="total-icon loan">
            <Landmark size={19} />
          </div>
          <span>Total Loan</span>
          <strong>{money(totalLoan)}</strong>
        </div>

        <div className="total-card">
          <div className="total-icon combined">
            <IndianRupee size={19} />
          </div>
          <span>Both Total</span>
          <strong>{money(totalBorrow + totalLoan)}</strong>
        </div>
      </section>

      <section className="list-panel">
        <div className="panel-header">
          <div>
            <h2>Loan & Borrow Details</h2>
            <p>
              Start/end or return dates automatically show the
              remaining time.
            </p>
          </div>

          <select
            className="type-filter"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All</option>
            <option value="Borrow">Borrow</option>
            <option value="Loan">Loan</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw className="spin" size={26} />
            <span>Loading details...</span>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="empty-state">
            <Landmark size={28} />
            <span>No loan or borrow details found.</span>
          </div>
        ) : (
          <>
            <div className="loan-list">
              {visibleRows.map((item) => {
                const type =
                  String(item.type || "Borrow").toLowerCase() ===
                  "loan"
                    ? "Loan"
                    : "Borrow";

                const startDate =
                  item.loan_date ||
                  item.start_date ||
                  item.loanDate;

                const endDate =
                  item.return_date ||
                  item.end_date ||
                  item.returnDate;

                const remaining =
                  item.remaining_amount ??
                  item.remainingAmount ??
                  item.amount;

                const isOverdue =
                  endDate && endDate < today();

                return (
                  <article
                    className={`loan-item ${
                      type === "Loan" ? "loan" : "borrow"
                    }`}
                    key={item.id}
                  >
                    <div className="loan-main">
                      <div className="type-icon">
                        {type === "Loan" ? (
                          <Landmark size={19} />
                        ) : (
                          <HandCoins size={19} />
                        )}
                      </div>

                      <div className="loan-info">
                        <div className="name-row">
                          <h3>
                            {item.name ??
                              item.person_name ??
                              item.personName ??
                              item.loan_name ??
                              "-"}
                          </h3>
                          <span
                            className={`type-tag ${
                              type === "Loan"
                                ? "loan-tag"
                                : "borrow-tag"
                            }`}
                          >
                            {type}
                          </span>
                        </div>

                        <div className="date-row">
                          <span>
                            Start: {formatDisplayDate(startDate)}
                          </span>
                          <span>
                            {type === "Loan"
                              ? `End: ${formatDisplayDate(endDate)}`
                              : `Return: ${formatDisplayDate(endDate)}`}
                          </span>
                        </div>

                        {item.notes && (
                          <div className="notes">
                            <FileText size={13} />
                            <span>{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="loan-right">
                      <strong>{money(remaining)}</strong>

                      <span
                        className={`remaining ${
                          isOverdue ? "overdue" : ""
                        }`}
                      >
                        <Clock3 size={13} />
                        {remainingText(endDate)}
                      </span>

                      <div className="item-actions">
                        <button
                          onClick={() => openEdit(item)}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="delete"
                          onClick={() => askDelete(item.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((p) => Math.max(1, p - 1))
                  }
                >
                  <ChevronLeft size={17} />
                </button>

                <span>
                  Page {page} of {totalPages}
                </span>

                <button
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((p) =>
                      Math.min(totalPages, p + 1)
                    )
                  }
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {deleteId && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteId(null);
          }}
        >
          <div className="confirm-modal" role="dialog" aria-modal="true">
            <div className="confirm-icon danger">
              <Trash2 size={20} />
            </div>
            <h3>Delete entry?</h3>
            <p>This action cannot be undone.</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-button"
                onClick={deleteItem}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) resetForm();
          }}
        >
          <form className="loan-modal" onSubmit={submit}>
            <div className="modal-heading">
              <div>
                <h2>
                  {editingId ? "Update" : "Add"}{" "}
                  {form.type === "Loan" ? "Loan" : "Borrow"}
                </h2>
                <p>
                  Add the complete start and repayment/end period.
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={resetForm}
              >
                <X size={18} />
              </button>
            </div>

            <label>
              Type
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value,
                  }))
                }
              >
                <option value="Borrow">Borrow</option>
                <option value="Loan">Loan</option>
              </select>
            </label>

            <label>
              {form.type === "Loan"
                ? "Loan Name"
                : "Person Name"}
              <input
                type="text"
                placeholder={
                  form.type === "Loan"
                    ? "Enter loan name"
                    : "Enter person name"
                }
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                  }))
                }
              />
            </label>

            <label>
              Amount
              <div className="amount-box">
                <IndianRupee size={15} />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      amount: e.target.value,
                    }))
                  }
                />
              </div>
            </label>

            <div className="two-columns">
              <label>
                {form.type === "Loan"
                  ? "Loan Start Date"
                  : "Borrow Date"}
                <input
                  type="date"
                  value={form.loanDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      loanDate: e.target.value,
                    }))
                  }
                />
              </label>

              <label>
                {form.type === "Loan"
                  ? "Loan End Date"
                  : "Return Date"}
                <input
                  type="date"
                  min={form.loanDate}
                  value={form.returnDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      returnDate: e.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label>
              EMI / Monthly Payment
              <div className="amount-box">
                <IndianRupee size={15} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={form.emi}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      emi: e.target.value,
                    }))
                  }
                />
              </div>
            </label>

            <label>
              Notes <span>(Optional)</span>
              <textarea
                rows="3"
                placeholder="Add optional notes..."
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    notes: e.target.value,
                  }))
                }
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="spin" size={15} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    {editingId ? "Update" : "Save"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const styles = `
.loan-page {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  padding: 18px;
  overflow-x: hidden;
  color: #fff;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.loan-header,
.loan-title,
.loan-actions,
.panel-header,
.name-row,
.date-row,
.loan-main,
.loan-right,
.modal-heading,
.modal-actions {
  display: flex;
  align-items: center;
}

.loan-header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.loan-title {
  gap: 9px;
}

.loan-title h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
}

.loan-header p,
.panel-header p {
  margin: 5px 0 0;
  color: rgba(255,255,255,.5);
  font-size: .76rem;
  line-height: 1.45;
}

.loan-actions {
  gap: 8px;
}

.month-picker,
.icon-button,
.add-button {
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

.icon-button,
.add-button {
  cursor: pointer;
}

.icon-button {
  width: 40px;
  display: grid;
  place-items: center;
}

.add-button,
.save-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 13px;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  border: 0;
  font-weight: 750;
}

.icon-button:hover,
.add-button:hover,
.save-button:hover {
  transform: translateY(-1px);
}

.toast-notification {
  position: fixed;
  top: max(12px, env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 12000;
  width: min(380px, calc(100vw - 24px));
  min-height: 48px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 11px;
  border-radius: 11px;
  color: #fff;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,.1);
  box-shadow: 0 18px 50px rgba(0,0,0,.35);
  animation: toast-in .2s ease;
}
.toast-notification.success { border-color: rgba(16,185,129,.35); }
.toast-notification.error { border-color: rgba(239,68,68,.35); }
.toast-icon {
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #16a34a;
  font-size: .75rem;
  font-weight: 800;
}
.toast-notification.error .toast-icon { background: #dc2626; }
.toast-text {
  min-width: 0;
  flex: 1;
  font-size: .72rem;
  line-height: 1.35;
}
.toast-close {
  width: 27px;
  height: 27px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 7px;
  color: rgba(255,255,255,.65);
  background: transparent;
  cursor: pointer;
}
.toast-close:hover { color: #fff; background: rgba(255,255,255,.08); }

.confirm-modal {
  width: min(330px, calc(100vw - 30px));
  box-sizing: border-box;
  padding: 18px;
  text-align: center;
  color: #fff;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 15px;
  box-shadow: 0 25px 70px rgba(0,0,0,.48);
  animation: modal-in .2s ease;
}
.confirm-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 10px;
  display: grid;
  place-items: center;
  border-radius: 11px;
}
.confirm-icon.danger {
  color: #fca5a5;
  background: rgba(239,68,68,.12);
  border: 1px solid rgba(239,68,68,.2);
}
.confirm-modal h3 { margin: 0; font-size: .92rem; }
.confirm-modal p {
  margin: 6px 0 16px;
  color: rgba(255,255,255,.45);
  font-size: .68rem;
}
.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.delete-confirm-button {
  min-height: 37px;
  padding: 0 15px;
  border: 0;
  border-radius: 9px;
  color: #fff;
  background: #dc2626;
  font-size: .68rem;
  font-weight: 750;
  cursor: pointer;
}
.delete-confirm-button:hover { background: #b91c1c; }

.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 11px;
  font-size: .76rem;
}

.notice button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.notice.error {
  color: #fecaca;
  background: rgba(239,68,68,.09);
  border: 1px solid rgba(239,68,68,.2);
}

.notice.success {
  color: #a7f3d0;
  background: rgba(16,185,129,.08);
  border: 1px solid rgba(16,185,129,.2);
}

.totals-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.total-card,
.list-panel {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0,0,0,.14);
}

.total-card {
  padding: 15px;
}

.total-icon {
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  border-radius: 10px;
}

.total-icon.borrow {
  color: #67e8f9;
  background: rgba(34,211,238,.1);
}

.total-icon.loan {
  color: #c4b5fd;
  background: rgba(124,58,237,.12);
}

.total-icon.combined {
  color: #6ee7b7;
  background: rgba(16,185,129,.1);
}

.total-card span {
  display: block;
  margin-top: 10px;
  color: rgba(255,255,255,.5);
  font-size: .7rem;
}

.total-card strong {
  display: block;
  margin-top: 4px;
  font-size: 1.05rem;
  overflow-wrap: anywhere;
}

.list-panel {
  padding: 16px;
}

.panel-header {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
}

.panel-header h2 {
  margin: 0;
  font-size: .9rem;
  font-weight: 800;
}

.type-filter {
  min-width: 125px;
  height: 36px;
  padding: 0 9px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 9px;
  color: #111827;
  background: #fff;
  outline: 0;
  cursor: pointer;
  color-scheme: light;
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
}

.type-filter:hover {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124,58,237,.10);
}

.type-filter:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124,58,237,.14);
}

.type-filter option,
.loan-modal select option {
  background: #fff;
  color: #111827;
}

.type-filter option:hover,
.loan-modal select option:hover {
  background: #7c3aed;
  color: #fff;
}

.type-filter option:checked,
.loan-modal select option:checked {
  background: #7c3aed;
  color: #fff;
}

.loan-list {
  display: grid;
  gap: 9px;
}

.loan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 13px;
  background: rgba(255,255,255,.025);
  transition: .2s ease;
}

.loan-item:hover {
  transform: translateY(-1px);
}

.loan-item.loan:hover {
  border-color: rgba(167,139,250,.3);
}

.loan-item.borrow:hover {
  border-color: rgba(103,232,249,.3);
}

.loan-main {
  min-width: 0;
  gap: 10px;
}

.type-icon {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: #67e8f9;
  background: rgba(34,211,238,.1);
}

.loan-item.loan .type-icon {
  color: #c4b5fd;
  background: rgba(124,58,237,.1);
}

.loan-info {
  min-width: 0;
}

.name-row {
  flex-wrap: wrap;
  gap: 7px;
}

.name-row h3 {
  margin: 0;
  font-size: .78rem;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.type-tag {
  padding: 4px 7px;
  border-radius: 7px;
  font-size: .57rem;
  font-weight: 750;
}

.borrow-tag {
  color: #67e8f9;
  background: rgba(34,211,238,.08);
}

.loan-tag {
  color: #c4b5fd;
  background: rgba(124,58,237,.1);
}

.date-row {
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
  color: rgba(255,255,255,.4);
  font-size: .62rem;
}

.notes {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin-top: 6px;
  color: rgba(255,255,255,.48);
  font-size: .64rem;
  line-height: 1.4;
}

.notes span {
  overflow-wrap: anywhere;
}

.loan-right {
  flex: 0 0 auto;
  align-items: flex-end;
  flex-direction: column;
  gap: 7px;
}

.loan-right > strong {
  font-size: .83rem;
  white-space: nowrap;
}

.remaining {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fcd34d;
  font-size: .62rem;
  text-align: right;
}

.remaining.overdue {
  color: #fca5a5;
}

.item-actions {
  display: flex;
  gap: 5px;
}

.item-actions button {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 8px;
  color: rgba(255,255,255,.65);
  background: rgba(255,255,255,.04);
  cursor: pointer;
}

.item-actions button:hover {
  border-color: rgba(103,232,249,.3);
}

.item-actions .delete:hover {
  color: #fca5a5;
  border-color: rgba(239,68,68,.3);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 13px;
}

.pagination button {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: .35;
  cursor: not-allowed;
}

.pagination span {
  color: rgba(255,255,255,.48);
  font-size: .68rem;
}

.empty-state {
  min-height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: rgba(255,255,255,.4);
  font-size: .72rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(2,6,23,.74);
  backdrop-filter: blur(8px);
}

.loan-modal {
  width: min(460px, calc(100vw - 30px));
  box-sizing: border-box;
  max-height: calc(100vh - 36px);
  overflow-y: auto;
  padding: 18px;
  color: #fff;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 17px;
  box-shadow: 0 25px 70px rgba(0,0,0,.45);
  animation: modal-in .2s ease;
}

.modal-heading {
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 17px;
}

.modal-heading h2 {
  margin: 0;
  font-size: .95rem;
}

.modal-heading p {
  margin: 4px 0 0;
  color: rgba(255,255,255,.42);
  font-size: .65rem;
  line-height: 1.4;
}

.close-button {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  color: #fff;
  background: rgba(255,255,255,.05);
  cursor: pointer;
}

.loan-modal label {
  display: block;
  margin-bottom: 13px;
  color: rgba(255,255,255,.72);
  font-size: .68rem;
  font-weight: 650;
}

.loan-modal label span {
  color: rgba(255,255,255,.35);
  font-weight: 400;
}

.loan-modal input,
.loan-modal select,
.loan-modal textarea {
  width: 100%;
  box-sizing: border-box;
  margin-top: 6px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 9px;
  outline: none;
  color: #fff;
  background: rgba(255,255,255,.055);
  font: inherit;
}

.loan-modal select {
  cursor: pointer;
  color-scheme: light;
}

.loan-modal select:hover {
  border-color: #7c3aed;
}

.loan-modal select:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124,58,237,.14);
}

.loan-modal input,
.loan-modal select {
  height: 39px;
  padding: 0 10px;
}

.loan-modal textarea {
  padding: 9px 10px;
  resize: vertical;
  line-height: 1.45;
}

.loan-modal input:focus,
.loan-modal select:focus,
.loan-modal textarea:focus {
  border-color: rgba(103,232,249,.5);
  box-shadow: 0 0 0 3px rgba(34,211,238,.06);
}

.amount-box {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  padding-left: 10px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 9px;
  background: rgba(255,255,255,.055);
}

.amount-box input {
  margin-top: 0;
  border: 0;
  background: transparent;
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.modal-actions {
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.cancel-button,
.save-button {
  min-height: 37px;
  padding: 0 13px;
  border-radius: 9px;
  font-size: .68rem;
  font-weight: 700;
  cursor: pointer;
}

.cancel-button {
  color: rgba(255,255,255,.7);
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
}

.save-button {
  border: 0;
}

.cancel-button:disabled,
.save-button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes toast-in {
  from { opacity: 0; transform: translate(-50%, -8px) scale(.98); }
  to { opacity: 1; transform: translate(-50%, 0) scale(1); }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 800px) {
  .loan-page {
    padding: 10px;
  }

  .loan-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .loan-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .month-picker {
    flex: 1;
  }

  .month-picker input {
    width: 100%;
  }

  .totals-grid {
    grid-template-columns: 1fr;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .type-filter {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .toast-notification { width: calc(100vw - 20px); }
  .confirm-actions { width: 100%; }
  .confirm-actions button { flex: 1; }

  .loan-page {
    padding: 8px;
  }

  .loan-title h1 {
    font-size: 1.15rem;
  }

  .loan-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .loan-right {
    width: 100%;
    align-items: flex-start;
  }

  .remaining {
    text-align: left;
  }

  .two-columns {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .loan-modal {
    padding: 15px;
  }
}
`;

export default LoanBorrow;
