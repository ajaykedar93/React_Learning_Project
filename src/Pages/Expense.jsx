import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  X,
  CalendarDays,
  ReceiptText,
  IndianRupee,
  Tag,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://express-project-learning-new.onrender.com";

const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Rent",
  "Education",
  "Health",
  "Business",
  "Entertainment",
  "Other",
];

const currentMonthValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

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

const Expense = () => {
  const [month, setMonth] = useState(currentMonthValue());
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    category: "",
    amount: "",
    notes: "",
  });

  const PAGE_SIZE = 10;

  const headers = () => ({
    "Content-Type": "application/json",
    ...(getToken()
      ? { Authorization: `Bearer ${getToken()}` }
      : {}),
  });

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/expenses?month=${encodeURIComponent(month)}`,
        {
          method: "GET",
          headers: headers(),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to load expenses."
        );
      }

      const rows =
        result.expenses ||
        result.data ||
        result.rows ||
        [];

      setExpenses(Array.isArray(rows) ? rows : []);
      setPage(1);
    } catch (err) {
      console.error("Expense GET error:", err);
      setError(err.message || "Failed to load expenses.");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [month]);

  const resetForm = () => {
    setForm({
      category: "",
      amount: "",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const submitExpense = async (e) => {
    e.preventDefault();

    if (!form.category) {
      setError("Please select an expense category.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid expense amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const isEdit = Boolean(editingId);

      const url = isEdit
        ? `${API_BASE_URL}/api/expenses/${editingId}`
        : `${API_BASE_URL}/api/expenses`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify({
          category: form.category,
          amount,
          notes: form.notes.trim() || null,
          // Backend should use CURRENT_DATE for new entries.
          // Month is sent only so the API can refresh the
          // selected-month response correctly.
          month,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            `Failed to ${isEdit ? "update" : "add"} expense.`
        );
      }

      setMessage(
        isEdit
          ? "Expense updated successfully."
          : "Expense added successfully."
      );

      resetForm();
      await loadExpenses();
    } catch (err) {
      console.error("Expense save error:", err);
      setError(err.message || "Unable to save expense.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      category: expense.category || "",
      amount: String(expense.amount ?? ""),
      notes: expense.notes || "",
    });
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const deleteExpense = async (id) => {
    const confirmed = window.confirm(
      "Delete this expense permanently?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/expenses/${id}`,
        {
          method: "DELETE",
          headers: headers(),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to delete expense."
        );
      }

      setMessage("Expense deleted successfully.");
      await loadExpenses();
    } catch (err) {
      console.error("Expense delete error:", err);
      setError(err.message || "Unable to delete expense.");
    }
  };

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "All") return expenses;

    return expenses.filter(
      (item) => item.category === categoryFilter
    );
  }, [expenses, categoryFilter]);

  const categoryTotals = useMemo(() => {
    const map = {};

    expenses.forEach((item) => {
      const category = item.category || "Other";
      map[category] =
        (map[category] || 0) + Number(item.amount || 0);
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const totalExpense = useMemo(
    () =>
      expenses.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [expenses]
  );

  const filteredTotal = useMemo(
    () =>
      filteredExpenses.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [filteredExpenses]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / PAGE_SIZE)
  );

  const visibleExpenses = filteredExpenses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const selectedMonthLabel = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);

    return new Date(
      year,
      monthNumber - 1,
      1
    ).toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [month]);

  return (
    <div className="expense-page">
      <style>{styles}</style>

      <div className="expense-header">
        <div>
          <div className="expense-title">
            <ReceiptText size={22} />
            <h1>Expenses</h1>
          </div>

          <p>
            Weekly expense tracking for {selectedMonthLabel}
          </p>
        </div>

        <div className="expense-actions">
          <label className="month-box">
            <CalendarDays size={17} />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>

          <button
            className="icon-btn"
            onClick={loadExpenses}
            title="Refresh expenses"
          >
            <RefreshCw size={17} />
          </button>

          <button
            className="add-btn"
            onClick={() => {
              setEditingId(null);
              setForm({
                category: "",
                amount: "",
                notes: "",
              });
              setShowForm(true);
              setError("");
              setMessage("");
            }}
          >
            <Plus size={17} />
            Add Expense
          </button>
        </div>
      </div>

      {error && (
        <div className="notice error">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {message && (
        <div className="notice success">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>
            <X size={15} />
          </button>
        </div>
      )}

      <div className="expense-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <IndianRupee size={19} />
          </div>
          <span>Month Total</span>
          <strong>{money(totalExpense)}</strong>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <ReceiptText size={19} />
          </div>
          <span>Total Entries</span>
          <strong>{expenses.length}</strong>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <Tag size={19} />
          </div>
          <span>Selected Category</span>
          <strong>{money(filteredTotal)}</strong>
        </div>
      </div>

      <section className="category-section">
        <div className="section-heading">
          <div>
            <h2>Expense Categories</h2>
            <p>
              Month-end totals are calculated category-wise.
            </p>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="category-select"
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="category-grid">
          {categoryTotals.length === 0 ? (
            <div className="empty-category">
              No expenses added for this month.
            </div>
          ) : (
            categoryTotals.map(([category, total]) => (
              <button
                className="category-card"
                key={category}
                onClick={() => {
                  setCategoryFilter(category);
                  setPage(1);
                }}
              >
                <span>{category}</span>
                <strong>{money(total)}</strong>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="expense-list-section">
        <div className="section-heading">
          <div>
            <h2>Expense Details</h2>
            <p>
              {categoryFilter === "All"
                ? "All expenses for the selected month."
                : `${categoryFilter} expenses for the selected month.`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw className="spin" size={25} />
            <span>Loading expenses...</span>
          </div>
        ) : visibleExpenses.length === 0 ? (
          <div className="empty-state">
            <ReceiptText size={28} />
            <span>No expense details found.</span>
          </div>
        ) : (
          <>
            <div className="expense-cards">
              {visibleExpenses.map((expense) => (
                <article className="expense-item" key={expense.id}>
                  <div className="expense-item-main">
                    <div className="expense-item-icon">
                      <Tag size={18} />
                    </div>

                    <div className="expense-item-info">
                      <h3>{expense.category || "Other"}</h3>
                      <span>
                        {expense.expense_date ||
                          expense.date ||
                          "Current date"}
                      </span>

                      {expense.notes && (
                        <p>
                          <FileText size={13} />
                          {expense.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="expense-item-right">
                    <strong>{money(expense.amount)}</strong>

                    <div className="item-actions">
                      <button
                        onClick={() => startEdit(expense)}
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        className="delete"
                        onClick={() => deleteExpense(expense.id)}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
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
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
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

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) resetForm();
          }}
        >
          <form className="expense-modal" onSubmit={submitExpense}>
            <div className="modal-header">
              <div>
                <h2>
                  {editingId ? "Update Expense" : "Add Expense"}
                </h2>
                <p>
                  New expenses use the current date automatically.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={resetForm}
              >
                <X size={18} />
              </button>
            </div>

            <label>
              Category
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    category: e.target.value,
                  }))
                }
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Amount
              <div className="amount-input">
                <IndianRupee size={16} />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      amount: e.target.value,
                    }))
                  }
                />
              </div>
            </label>

            <label>
              Notes <span>(Optional)</span>
              <textarea
                rows="4"
                placeholder="Add optional notes..."
                value={form.notes}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    notes: e.target.value,
                  }))
                }
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-btn"
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
                    {editingId ? "Update Expense" : "Add Expense"}
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
  .expense-page {
    width: 100%;
    min-height: 100%;
    padding: 18px;
    color: #fff;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .expense-header,
  .section-heading,
  .expense-actions,
  .expense-title,
  .modal-header,
  .modal-actions,
  .expense-item-main,
  .expense-item-right {
    display: flex;
    align-items: center;
  }

  .expense-header {
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .expense-title {
    gap: 9px;
  }

  .expense-title h1 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 800;
  }

  .expense-header p,
  .section-heading p {
    margin: 5px 0 0;
    color: rgba(255,255,255,.52);
    font-size: .76rem;
  }

  .expense-actions {
    gap: 8px;
  }

  .month-box,
  .icon-btn,
  .add-btn {
    height: 40px;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 11px;
    background: rgba(255,255,255,.05);
    color: #fff;
  }

  .month-box {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 10px;
  }

  .month-box input {
    width: 125px;
    color: #fff;
    background: transparent;
    border: 0;
    outline: 0;
    font-size: .76rem;
    font-weight: 650;
  }

  .icon-btn,
  .add-btn,
  .item-actions button,
  .pagination button,
  .modal-close {
    cursor: pointer;
  }

  .icon-btn {
    width: 40px;
    display: grid;
    place-items: center;
  }

  .add-btn,
  .save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 13px;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    border: 0;
    color: #fff;
    font-weight: 750;
  }

  .icon-btn:hover,
  .add-btn:hover,
  .category-card:hover,
  .item-actions button:hover,
  .pagination button:not(:disabled):hover {
    transform: translateY(-1px);
    border-color: rgba(103,232,249,.35);
  }

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

  .expense-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }

  .summary-card {
    padding: 15px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.045);
    border-radius: 16px;
    box-shadow: 0 12px 30px rgba(0,0,0,.14);
  }

  .summary-icon {
    width: 35px;
    height: 35px;
    display: grid;
    place-items: center;
    color: #67e8f9;
    background: rgba(34,211,238,.1);
    border-radius: 10px;
  }

  .summary-card span {
    display: block;
    margin-top: 10px;
    color: rgba(255,255,255,.53);
    font-size: .7rem;
  }

  .summary-card strong {
    display: block;
    margin-top: 4px;
    font-size: 1.05rem;
    word-break: break-word;
  }

  .category-section,
  .expense-list-section {
    padding: 16px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.035);
    border-radius: 16px;
    margin-bottom: 12px;
  }

  .section-heading {
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 13px;
  }

  .section-heading h2 {
    margin: 0;
    font-size: .88rem;
    font-weight: 800;
  }

  .category-select {
    min-width: 155px;
    height: 36px;
    padding: 0 9px;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 9px;
    color: #fff;
    background: #111827;
    outline: none;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 9px;
  }

  .category-card {
    min-width: 0;
    padding: 11px;
    text-align: left;
    color: #fff;
    background: rgba(255,255,255,.035);
    border: 1px solid rgba(103,232,249,.12);
    border-radius: 11px;
    cursor: pointer;
    transition: .2s ease;
  }

  .category-card span {
    display: block;
    color: rgba(255,255,255,.52);
    font-size: .65rem;
    white-space: normal;
  }

  .category-card strong {
    display: block;
    margin-top: 5px;
    font-size: .76rem;
    overflow-wrap: anywhere;
  }

  .empty-category {
    grid-column: 1 / -1;
    padding: 18px;
    text-align: center;
    color: rgba(255,255,255,.4);
    font-size: .72rem;
  }

  .expense-cards {
    display: grid;
    gap: 9px;
  }

  .expense-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px;
    border: 1px solid rgba(255,255,255,.07);
    background: rgba(255,255,255,.03);
    border-radius: 12px;
    transition: .2s ease;
  }

  .expense-item:hover {
    border-color: rgba(103,232,249,.25);
    transform: translateY(-1px);
  }

  .expense-item-main {
    min-width: 0;
    gap: 10px;
  }

  .expense-item-icon {
    flex: 0 0 35px;
    width: 35px;
    height: 35px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    color: #a78bfa;
    background: rgba(124,58,237,.1);
  }

  .expense-item-info {
    min-width: 0;
  }

  .expense-item-info h3 {
    margin: 0;
    font-size: .77rem;
    font-weight: 750;
    overflow-wrap: anywhere;
  }

  .expense-item-info > span {
    display: block;
    margin-top: 3px;
    color: rgba(255,255,255,.4);
    font-size: .62rem;
  }

  .expense-item-info p {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    margin: 5px 0 0;
    color: rgba(255,255,255,.5);
    font-size: .66rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .expense-item-right {
    flex: 0 0 auto;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .expense-item-right > strong {
    font-size: .82rem;
    white-space: nowrap;
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
    transition: .2s ease;
  }

  .item-actions button.delete:hover {
    color: #fca5a5;
    border-color: rgba(239,68,68,.3);
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
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
  }

  .pagination button:disabled {
    opacity: .35;
    cursor: not-allowed;
  }

  .pagination span {
    color: rgba(255,255,255,.5);
    font-size: .68rem;
  }

  .empty-state {
    min-height: 150px;
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
    background: rgba(2,6,23,.72);
    backdrop-filter: blur(8px);
  }

  .expense-modal {
    width: min(440px, 100%);
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

  .modal-header {
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 17px;
  }

  .modal-header h2 {
    margin: 0;
    font-size: .95rem;
  }

  .modal-header p {
    margin: 4px 0 0;
    color: rgba(255,255,255,.42);
    font-size: .65rem;
    line-height: 1.4;
  }

  .modal-close {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px;
    color: #fff;
    background: rgba(255,255,255,.05);
  }

  .expense-modal label {
    display: block;
    margin-bottom: 13px;
    color: rgba(255,255,255,.72);
    font-size: .68rem;
    font-weight: 650;
  }

  .expense-modal label span {
    color: rgba(255,255,255,.35);
    font-weight: 400;
  }

  .expense-modal input,
  .expense-modal select,
  .expense-modal textarea {
    width: 100%;
    margin-top: 6px;
    box-sizing: border-box;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 9px;
    outline: none;
    color: #fff;
    background: rgba(255,255,255,.055);
    font: inherit;
  }

  .expense-modal input,
  .expense-modal select {
    height: 39px;
    padding: 0 10px;
  }

  .expense-modal textarea {
    min-height: 85px;
    padding: 9px 10px;
    resize: vertical;
    line-height: 1.45;
  }

  .expense-modal input:focus,
  .expense-modal select:focus,
  .expense-modal textarea:focus {
    border-color: rgba(103,232,249,.5);
    box-shadow: 0 0 0 3px rgba(34,211,238,.06);
  }

  .amount-input {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 6px;
    padding-left: 10px;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 9px;
    background: rgba(255,255,255,.055);
  }

  .amount-input input {
    margin-top: 0;
    border: 0;
    background: transparent;
  }

  .modal-actions {
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }

  .cancel-btn,
  .save-btn {
    min-height: 37px;
    padding: 0 13px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,.1);
    cursor: pointer;
    font-size: .68rem;
    font-weight: 700;
  }

  .cancel-btn {
    color: rgba(255,255,255,.7);
    background: rgba(255,255,255,.05);
  }

  .save-btn {
    border: 0;
  }

  .cancel-btn:disabled,
  .save-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .spin {
    animation: expense-spin 1s linear infinite;
  }

  @keyframes expense-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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

  @media (max-width: 1050px) {
    .category-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .expense-page {
      padding: 10px;
    }

    .expense-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .expense-actions {
      width: 100%;
      flex-wrap: wrap;
    }

    .month-box {
      flex: 1;
    }

    .month-box input {
      width: 100%;
    }

    .expense-summary {
      grid-template-columns: 1fr;
    }

    .category-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .section-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .category-select {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .expense-page {
      padding: 8px;
    }

    .expense-title h1 {
      font-size: 1.15rem;
    }

    .add-btn {
      flex: 1;
    }

    .category-grid {
      grid-template-columns: 1fr;
    }

    .expense-item {
      align-items: flex-start;
      flex-direction: column;
    }

    .expense-item-right {
      width: 100%;
      align-items: flex-start;
      flex-direction: row;
      justify-content: space-between;
    }

    .expense-modal {
      padding: 15px;
    }
  }
`;

export default Expense;
