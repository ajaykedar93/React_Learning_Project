import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Search,
  Layers3,
  WalletCards,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  CalendarRange,
} from "lucide-react";

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://express-project-learning-new.onrender.com";

const DEFAULT_CATEGORIES = [
  "Petrol",
  "Daily Kharch Saman",
  "Shopping",
  "Food",
  "Travel",
  "Bike",
  "Business",
];

const PAGE_SIZE = 10;

const currentMonthValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const todayValue = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const money = (value) => {
  const n = Number(value || 0);
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;

  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
  }).format(rounded)}`;
};

const formatDate = (value) => {
  if (!value) return "—";

  const raw = String(value).slice(0, 10);
  const [y, m, d] = raw.split("-").map(Number);

  if (!y || !m || !d) return String(value);

  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const monthLabel = (month) => {
  if (!month) return "";

  const [year, m] = month.split("-").map(Number);

  return new Date(year, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

const headers = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const getWeekLabel = (week) => {
  if (week === "all") return "All Weeks";

  const ranges = {
    1: "1–7",
    2: "8–14",
    3: "15–21",
    4: "22–28",
    5: "29–End",
  };

  return `Week ${week} (${ranges[week] || ""})`;
};

const getWeekFromDate = (date) => {
  const day = Number(String(date).slice(8, 10));

  if (!day) return 1;
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
};

const getWeekRange = (month, week) => {
  if (!month || week === "all") return null;

  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  const startDay = (Number(week) - 1) * 7 + 1;
  if (startDay > daysInMonth) return null;

  const endDay = Math.min(startDay + 6, daysInMonth);

  return {
    start: `${month}-${String(startDay).padStart(2, "0")}`,
    end: `${month}-${String(endDay).padStart(2, "0")}`,
  };
};

const normalizeRows = (result) =>
  Array.isArray(result?.expenses)
    ? result.expenses
    : Array.isArray(result?.data)
    ? result.data
    : Array.isArray(result?.rows)
    ? result.rows
    : [];

const Expense = () => {
  const [month, setMonth] = useState(currentMonthValue());
  const [week, setWeek] = useState("all");
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    category: "",
    customCategory: "",
    amount: "",
    expenseDate: todayValue(),
    notes: "",
  });

  const [formError, setFormError] = useState("");

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses/categories`, {
        method: "GET",
        headers: headers(),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        return;
      }

      const serverCategories = Array.isArray(result.categories)
        ? result.categories
        : [];

      const merged = [...DEFAULT_CATEGORIES, ...serverCategories].filter(
        (item, index, array) =>
          array.findIndex(
            (x) => x.toLowerCase() === item.toLowerCase()
          ) === index
      );

      setCategories(merged);
    } catch (error) {
      console.error("Category GET error:", error);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        month,
      });

      if (week !== "all") {
        query.set("week", week);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/expenses?${query.toString()}`,
        {
          method: "GET",
          headers: headers(),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to load expenses.");
      }

      setExpenses(normalizeRows(result));
      setPage(1);
    } catch (error) {
      console.error("Expense GET error:", error);
      setExpenses([]);
      showToast("error", error.message || "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }, [month, week, showToast]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setCategoryFilter("All");
    setSearch("");
    setPage(1);
  }, [month, week]);

  const resetForm = () => {
    setForm({
      category: "",
      customCategory: "",
      amount: "",
      expenseDate: todayValue(),
      notes: "",
    });
    setEditingId(null);
    setFormError("");
    setShowForm(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      category: "",
      customCategory: "",
      amount: "",
      expenseDate: todayValue(),
      notes: "",
    });
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      category: expense.category || "",
      customCategory: "",
      amount: String(expense.amount ?? ""),
      expenseDate: String(expense.expense_date || todayValue()).slice(0, 10),
      notes: expense.notes || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const submitExpense = async (event) => {
    event.preventDefault();
    setFormError("");

    const selectedCategory =
      form.category === "__custom__"
        ? form.customCategory.trim()
        : form.category.trim();

    const amount = Number(form.amount);

    if (!selectedCategory) {
      setFormError("Please select or add an expense category.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!form.expenseDate) {
      setFormError("Please select the expense date.");
      return;
    }

    const isEdit = Boolean(editingId);

    try {
      setSaving(true);

      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/expenses/${editingId}`
          : `${API_BASE_URL}/api/expenses`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: headers(),
          body: JSON.stringify({
            category: selectedCategory,
            amount,
            expenseDate: form.expenseDate,
            notes: form.notes.trim() || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            `Failed to ${isEdit ? "update" : "add"} expense.`
        );
      }

      resetForm();

      showToast(
        "success",
        isEdit
          ? "Expense updated successfully."
          : "Expense added successfully."
      );

      await loadCategories();
      await loadExpenses();
    } catch (error) {
      console.error("Expense save error:", error);
      setFormError(error.message || "Unable to save expense.");
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (expense) => {
    setDeleteTarget(expense);
    setShowDelete(true);
  };

  const deleteExpense = async () => {
    if (!deleteTarget?.id) return;

    try {
      setDeletingId(deleteTarget.id);

      const response = await fetch(
        `${API_BASE_URL}/api/expenses/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: headers(),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to delete expense.");
      }

      setShowDelete(false);
      setDeleteTarget(null);

      showToast("success", "Expense deleted successfully.");

      await loadCategories();
      await loadExpenses();
    } catch (error) {
      console.error("Expense delete error:", error);
      showToast("error", error.message || "Unable to delete expense.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();

    return expenses.filter((item) => {
      const matchesCategory =
        categoryFilter === "All" ||
        String(item.category || "") === categoryFilter;

      const matchesSearch =
        !q ||
        String(item.category || "").toLowerCase().includes(q) ||
        String(item.notes || "").toLowerCase().includes(q) ||
        String(item.expense_date || "").includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [expenses, categoryFilter, search]);

  const categoryTotals = useMemo(() => {
    const map = {};

    expenses.forEach((item) => {
      const category = item.category || "Other";

      if (!map[category]) {
        map[category] = {
          total: 0,
          entries: 0,
        };
      }

      map[category].total += Number(item.amount || 0);
      map[category].entries += 1;
    });

    return Object.entries(map)
      .map(([category, value]) => ({
        category,
        total: value.total,
        entries: value.entries,
      }))
      .sort((a, b) => b.total - a.total);
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

  const weekTotal = useMemo(() => {
    if (week === "all") return totalExpense;

    return expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [expenses, totalExpense, week]);

  const weekRange = getWeekRange(month, week);

  const selectedCategoryData = useMemo(() => {
    if (categoryFilter === "All") return null;

    return categoryTotals.find(
      (item) => item.category === categoryFilter
    );
  }, [categoryTotals, categoryFilter]);

  const monthStats = useMemo(() => {
    const days = expenses.map((item) => getWeekFromDate(item.expense_date));
    const uniqueWeeks = [...new Set(days)];

    return {
      categories: categoryTotals.length,
      activeWeeks: uniqueWeeks.length,
    };
  }, [expenses, categoryTotals]);

  return (
    <div className="expense-page">
      <style>{styles}</style>

      {toast && (
        <div className={`expense-toast ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === "success" ? (
              <CheckCircle2 size={17} />
            ) : (
              <AlertCircle size={17} />
            )}
          </div>

          <span>{toast.text}</span>

          <button onClick={() => setToast(null)} aria-label="Close notification">
            <X size={15} />
          </button>
        </div>
      )}

      <header className="expense-header">
        <div className="page-heading">
          <div className="heading-icon">
            <ReceiptText size={22} />
          </div>

          <div>
            <div className="title-row">
              <h1>Expenses</h1>
              <span className="live-badge">
                <span />
                Live
              </span>
            </div>

            <p>
              Track and manage your expenses for{" "}
              <strong>{monthLabel(month)}</strong>
            </p>
          </div>
        </div>

        <div className="header-actions">
          <label className="month-picker">
            <CalendarDays size={16} />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>

          <button
            className="refresh-button"
            onClick={() => {
              loadExpenses();
              loadCategories();
            }}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>

          <button className="add-button" onClick={openAdd}>
            <Plus size={17} />
            Add Expense
          </button>
        </div>
      </header>

      <section className="filter-bar">
        <div className="filter-left">
          <div className="filter-label">
            <CalendarRange size={15} />
            Period
          </div>

          <div className="week-tabs">
            <button
              className={week === "all" ? "active" : ""}
              onClick={() => setWeek("all")}
            >
              All
            </button>

            {[1, 2, 3, 4, 5].map((item) => (
              <button
                key={item}
                className={week === item ? "active" : ""}
                onClick={() => setWeek(item)}
              >
                W{item}
              </button>
            ))}
          </div>

          <span className="period-text">
            {week === "all"
              ? `Full month • ${monthLabel(month)}`
              : `${getWeekLabel(week)} • ${weekRange ? `${formatDate(
                  weekRange.start
                )} – ${formatDate(weekRange.end)}` : ""}`}
          </span>
        </div>

        <div className="search-box">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search expenses..."
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card stat-purple">
          <div className="stat-top">
            <div className="stat-icon">
              <IndianRupee size={18} />
            </div>
            <span className="stat-tag">MONTH</span>
          </div>

          <span className="stat-label">Total Expense</span>
          <strong>{money(totalExpense)}</strong>
          <small>{expenses.length} expense entries</small>
        </div>

        <div className="stat-card stat-cyan">
          <div className="stat-top">
            <div className="stat-icon">
              <CalendarRange size={18} />
            </div>
            <span className="stat-tag">WEEK</span>
          </div>

          <span className="stat-label">
            {week === "all" ? "Current View Total" : `Week ${week} Total`}
          </span>
          <strong>{money(weekTotal)}</strong>
          <small>
            {week === "all"
              ? "All weeks in selected month"
              : getWeekLabel(week)}
          </small>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-top">
            <div className="stat-icon">
              <Layers3 size={18} />
            </div>
            <span className="stat-tag">CATEGORIES</span>
          </div>

          <span className="stat-label">
            {categoryFilter === "All" ? "Active Categories" : categoryFilter}
          </span>
          <strong>
            {categoryFilter === "All"
              ? monthStats.categories
              : money(selectedCategoryData?.total || 0)}
          </strong>
          <small>
            {categoryFilter === "All"
              ? "Categories used this period"
              : `${selectedCategoryData?.entries || 0} entries`}
          </small>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-top">
            <div className="stat-icon">
              <ReceiptText size={18} />
            </div>
            <span className="stat-tag">ACTIVITY</span>
          </div>

          <span className="stat-label">Active Weeks</span>
          <strong>{monthStats.activeWeeks}</strong>
          <small>Weeks containing expenses</small>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="panel-title">
              <Sparkles size={16} />
              <h2>Expense Categories</h2>
            </div>
            <p>Each category automatically combines all matching expenses.</p>
          </div>

          <select
            className="white-dropdown"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="category-grid">
          {categoryTotals.length === 0 ? (
            <div className="empty-category">
              <WalletCards size={27} />
              <span>No expenses found for this period.</span>
            </div>
          ) : (
            categoryTotals.map((item) => (
              <button
                key={item.category}
                className={`category-card ${
                  categoryFilter === item.category ? "selected" : ""
                }`}
                onClick={() => {
                  setCategoryFilter(item.category);
                  setPage(1);
                }}
              >
                <div className="category-card-icon">
                  <Tag size={15} />
                </div>

                <div className="category-card-content">
                  <span>{item.category}</span>
                  <strong>{money(item.total)}</strong>
                  <small>{item.entries} entries</small>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="panel details-panel">
        <div className="panel-heading">
          <div>
            <div className="panel-title">
              <ReceiptText size={16} />
              <h2>Expense Details</h2>
            </div>

            <p>
              {categoryFilter === "All"
                ? "All expense records for the selected period."
                : `${categoryFilter} expense records`}
            </p>
          </div>

          <div className="result-count">
            {filteredExpenses.length} record
            {filteredExpenses.length === 1 ? "" : "s"}
          </div>
        </div>

        {loading ? (
          <div className="state-box">
            <RefreshCw className="spin" size={25} />
            <strong>Loading expenses...</strong>
            <span>Getting your latest records.</span>
          </div>
        ) : visibleExpenses.length === 0 ? (
          <div className="state-box">
            <ReceiptText size={31} />
            <strong>No expenses found</strong>
            <span>Try another month, week or category.</span>
            <button onClick={openAdd}>
              <Plus size={15} />
              Add First Expense
            </button>
          </div>
        ) : (
          <>
            <div className="expense-list">
              {visibleExpenses.map((expense) => (
                <article className="expense-row" key={expense.id}>
                  <div className="expense-main">
                    <div className="expense-avatar">
                      <Tag size={17} />
                    </div>

                    <div className="expense-info">
                      <div className="expense-name-row">
                        <h3>{expense.category || "Other"}</h3>
                        <span className="date-badge">
                          {formatDate(expense.expense_date)}
                        </span>
                      </div>

                      {expense.notes ? (
                        <p>
                          <FileText size={13} />
                          {expense.notes}
                        </p>
                      ) : (
                        <span className="no-notes">No notes added</span>
                      )}
                    </div>
                  </div>

                  <div className="expense-right">
                    <strong>{money(expense.amount)}</strong>

                    <div className="row-actions">
                      <button
                        className="edit-action"
                        onClick={() => openEdit(expense)}
                        title="Edit expense"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        className="delete-action"
                        onClick={() => askDelete(expense)}
                        disabled={deletingId === expense.id}
                        title="Delete expense"
                      >
                        {deletingId === expense.id ? (
                          <RefreshCw className="spin" size={15} />
                        ) : (
                          <Trash2 size={15} />
                        )}
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
                  <ChevronLeft size={16} />
                </button>

                <span>
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>

                <button
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              resetForm();
            }
          }}
        >
          <form className="expense-modal" onSubmit={submitExpense}>
            <div className="modal-header">
              <div>
                <div className="modal-title-icon">
                  {editingId ? <Pencil size={17} /> : <Plus size={17} />}
                </div>

                <div>
                  <h2>{editingId ? "Update Expense" : "Add Expense"}</h2>
                  <p>
                    {editingId
                      ? "Update the expense details below."
                      : "Add a new expense to your selected date."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={resetForm}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="form-error">
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <label className="form-label">
              Category
              <select
                className="form-control white-dropdown"
                value={form.category}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    category: e.target.value,
                    customCategory: "",
                  }))
                }
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}

                <option value="__custom__">+ Add New Category</option>
              </select>
            </label>

            {form.category === "__custom__" && (
              <label className="form-label">
                New Category
                <input
                  className="form-control"
                  value={form.customCategory}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      customCategory: e.target.value,
                    }))
                  }
                  placeholder="Enter new category"
                  maxLength={100}
                  autoFocus
                />
              </label>
            )}

            <div className="form-two">
              <label className="form-label">
                Amount
                <div className="amount-control">
                  <IndianRupee size={16} />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </label>

              <label className="form-label">
                Expense Date
                <div className="date-control">
                  <CalendarDays size={16} />
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        expenseDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </label>
            </div>

            <div className="date-help">
              <CalendarRange size={14} />
              Week {getWeekFromDate(form.expenseDate)} of{" "}
              {monthLabel(String(form.expenseDate).slice(0, 7))}
            </div>

            <label className="form-label">
              Notes <span className="optional">(Optional)</span>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    notes: e.target.value,
                  }))
                }
                placeholder="Add optional notes..."
                rows={4}
                maxLength={500}
              />
            </label>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className="spin" size={15} />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingId ? <Pencil size={15} /> : <Plus size={15} />}
                    {editingId ? "Update Expense" : "Add Expense"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDelete && deleteTarget && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) {
              setShowDelete(false);
              setDeleteTarget(null);
            }
          }}
        >
          <div className="delete-modal">
            <div className="delete-icon">
              <Trash2 size={20} />
            </div>

            <h2>Delete Expense?</h2>

            <p>
              Delete <strong>{deleteTarget.category}</strong> expense of{" "}
              <strong>{money(deleteTarget.amount)}</strong>?
              <br />
              This action cannot be undone.
            </p>

            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() => {
                  setShowDelete(false);
                  setDeleteTarget(null);
                }}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </button>

              <button
                className="danger-button"
                onClick={deleteExpense}
                disabled={Boolean(deletingId)}
              >
                {deletingId ? (
                  <>
                    <RefreshCw className="spin" size={15} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = `
  .expense-page {
    width: 100%;
    min-height: 100%;
    box-sizing: border-box;
    padding: clamp(12px, 2vw, 26px);
    color: #f8fafc;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background:
      radial-gradient(circle at 8% 0%, rgba(124,58,237,.17), transparent 30%),
      radial-gradient(circle at 92% 8%, rgba(6,182,212,.10), transparent 27%);
  }

  .expense-header,
  .filter-bar,
  .page-heading,
  .header-actions,
  .title-row,
  .panel-heading,
  .panel-title,
  .stat-top,
  .expense-main,
  .expense-name-row,
  .expense-right,
  .row-actions,
  .modal-header,
  .modal-header > div,
  .date-control,
  .amount-control,
  .date-help,
  .modal-footer {
    display: flex;
    align-items: center;
  }

  .expense-header {
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 16px;
  }

  .page-heading {
    gap: 11px;
    min-width: 0;
  }

  .heading-icon {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    display: grid;
    place-items: center;
    color: #c4b5fd;
    background: linear-gradient(135deg, rgba(124,58,237,.22), rgba(6,182,212,.11));
    border: 1px solid rgba(167,139,250,.2);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(124,58,237,.12);
  }

  .title-row {
    gap: 9px;
  }

  .title-row h1 {
    margin: 0;
    font-size: clamp(1.25rem, 2vw, 1.55rem);
    font-weight: 850;
    letter-spacing: -.025em;
  }

  .page-heading p {
    margin: 5px 0 0;
    color: rgba(226,232,240,.54);
    font-size: .73rem;
  }

  .page-heading p strong {
    color: rgba(226,232,240,.8);
  }

  .live-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 7px;
    border-radius: 999px;
    color: #6ee7b7;
    background: rgba(16,185,129,.08);
    border: 1px solid rgba(52,211,153,.14);
    font-size: .56rem;
    font-weight: 800;
  }

  .live-badge span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px rgba(52,211,153,.8);
  }

  .header-actions {
    gap: 8px;
  }

  .month-picker,
  .refresh-button,
  .add-button {
    height: 40px;
    box-sizing: border-box;
    border-radius: 11px;
  }

  .month-picker {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 10px;
    color: #a78bfa;
    background: rgba(15,23,42,.72);
    border: 1px solid rgba(148,163,184,.16);
  }

  .month-picker input {
    width: 128px;
    color: #fff;
    background: transparent;
    border: 0;
    outline: 0;
    font-size: .73rem;
    font-weight: 700;
  }

  .refresh-button,
  .add-button,
  .week-tabs button,
  .category-card,
  .row-actions button,
  .pagination button,
  .state-box button,
  .modal-close,
  .primary-button,
  .secondary-button,
  .danger-button,
  .filter-bar button {
    cursor: pointer;
  }

  .refresh-button {
    width: 40px;
    display: grid;
    place-items: center;
    color: #cbd5e1;
    background: rgba(15,23,42,.72);
    border: 1px solid rgba(148,163,184,.16);
    transition: .2s ease;
  }

  .refresh-button:hover {
    color: #fff;
    border-color: rgba(167,139,250,.45);
    background: rgba(124,58,237,.14);
    transform: translateY(-1px);
  }

  .add-button,
  .primary-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 14px;
    color: #fff;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    border: 1px solid rgba(167,139,250,.35);
    font-weight: 800;
    box-shadow: 0 8px 22px rgba(79,70,229,.18);
    transition: .2s ease;
  }

  .add-button:hover,
  .primary-button:hover {
    transform: translateY(-1px);
    filter: brightness(1.08);
    box-shadow: 0 12px 28px rgba(124,58,237,.28);
  }

  .filter-bar {
    justify-content: space-between;
    gap: 12px;
    padding: 10px;
    margin-bottom: 13px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 13px;
    background: rgba(15,23,42,.58);
    box-shadow: inset 0 1px rgba(255,255,255,.025);
  }

  .filter-left {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 9px;
    flex-wrap: wrap;
  }

  .filter-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: rgba(226,232,240,.54);
    font-size: .66rem;
    font-weight: 750;
  }

  .filter-label svg {
    color: #a78bfa;
  }

  .week-tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    border-radius: 9px;
    background: rgba(255,255,255,.035);
  }

  .week-tabs button {
    height: 29px;
    min-width: 37px;
    padding: 0 8px;
    color: rgba(226,232,240,.54);
    background: transparent;
    border: 0;
    border-radius: 7px;
    font-size: .62rem;
    font-weight: 750;
    transition: .18s ease;
  }

  .week-tabs button:hover {
    color: #fff;
    background: rgba(124,58,237,.1);
  }

  .week-tabs button.active {
    color: #fff;
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    box-shadow: 0 4px 13px rgba(124,58,237,.2);
  }

  .period-text {
    color: rgba(203,213,225,.45);
    font-size: .62rem;
  }

  .search-box {
    width: min(230px, 100%);
    height: 35px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 9px;
    color: rgba(203,213,225,.42);
    background: rgba(255,255,255,.035);
    border: 1px solid rgba(148,163,184,.1);
    border-radius: 9px;
  }

  .search-box:focus-within {
    color: #a78bfa;
    border-color: rgba(139,92,246,.4);
    box-shadow: 0 0 0 3px rgba(139,92,246,.08);
  }

  .search-box input {
    width: 100%;
    min-width: 0;
    color: #fff;
    background: transparent;
    border: 0;
    outline: 0;
    font-size: .68rem;
  }

  .search-box input::placeholder {
    color: rgba(203,213,225,.35);
  }

  .search-box button {
    display: grid;
    place-items: center;
    padding: 0;
    color: rgba(203,213,225,.45);
    background: transparent;
    border: 0;
    cursor: pointer;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 13px;
  }

  .stat-card {
    --tone: #8b5cf6;
    position: relative;
    overflow: hidden;
    padding: 15px;
    border-radius: 16px;
    border: 1px solid rgba(148,163,184,.12);
    background: linear-gradient(145deg, rgba(15,23,42,.92), rgba(17,24,39,.75));
    box-shadow: 0 14px 32px rgba(0,0,0,.16), inset 0 1px rgba(255,255,255,.03);
    transition: .22s ease;
  }

  .stat-card::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 2px;
    background: var(--tone);
  }

  .stat-card::after {
    content: "";
    position: absolute;
    width: 100px;
    height: 100px;
    right: -50px;
    top: -50px;
    border-radius: 50%;
    background: var(--tone);
    opacity: .06;
  }

  .stat-card:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--tone) 35%, transparent);
    box-shadow: 0 20px 40px rgba(0,0,0,.22);
  }

  .stat-purple { --tone: #a78bfa; }
  .stat-cyan { --tone: #22d3ee; }
  .stat-green { --tone: #34d399; }
  .stat-orange { --tone: #fb923c; }

  .stat-top {
    justify-content: space-between;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--tone) 17%, transparent);
    border-radius: 10px;
  }

  .stat-tag {
    color: color-mix(in srgb, var(--tone) 75%, white);
    font-size: .52rem;
    font-weight: 850;
    letter-spacing: .06em;
  }

  .stat-label {
    display: block;
    margin-top: 12px;
    color: rgba(226,232,240,.52);
    font-size: .67rem;
    font-weight: 650;
  }

  .stat-card strong {
    display: block;
    margin-top: 4px;
    color: #f8fafc;
    font-size: clamp(1.05rem, 1.7vw, 1.3rem);
    font-weight: 850;
    letter-spacing: -.025em;
    word-break: break-word;
  }

  .stat-card small {
    display: block;
    margin-top: 4px;
    color: rgba(148,163,184,.45);
    font-size: .59rem;
  }

  .panel {
    padding: 16px;
    margin-bottom: 13px;
    border: 1px solid rgba(148,163,184,.11);
    border-radius: 17px;
    background: linear-gradient(145deg, rgba(15,23,42,.8), rgba(17,24,39,.62));
    box-shadow: 0 14px 34px rgba(0,0,0,.13), inset 0 1px rgba(255,255,255,.025);
  }

  .panel-heading {
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .panel-title {
    gap: 7px;
  }

  .panel-title svg {
    color: #a78bfa;
  }

  .panel-title h2 {
    margin: 0;
    color: #f1f5f9;
    font-size: .86rem;
    font-weight: 820;
  }

  .panel-heading p {
    margin: 5px 0 0;
    color: rgba(203,213,225,.43);
    font-size: .62rem;
  }

  .white-dropdown {
    min-width: 165px;
    height: 37px;
    padding: 0 10px;
    color: #111827 !important;
    background: #fff !important;
    border: 1px solid #d1d5db;
    border-radius: 9px;
    outline: none;
    font-size: .68rem;
    font-weight: 700;
    color-scheme: light;
  }

  .white-dropdown option {
    color: #111827 !important;
    background: #fff !important;
  }

  .white-dropdown:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139,92,246,.1);
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 9px;
  }

  .category-card {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px;
    text-align: left;
    color: #fff;
    background: linear-gradient(145deg, rgba(255,255,255,.035), rgba(124,58,237,.035));
    border: 1px solid rgba(139,92,246,.12);
    border-radius: 11px;
    transition: .2s ease;
  }

  .category-card:hover,
  .category-card.selected {
    transform: translateY(-2px);
    border-color: rgba(167,139,250,.35);
    background: linear-gradient(145deg, rgba(124,58,237,.11), rgba(34,211,238,.05));
    box-shadow: 0 9px 22px rgba(0,0,0,.15);
  }

  .category-card-icon {
    width: 31px;
    height: 31px;
    flex: 0 0 31px;
    display: grid;
    place-items: center;
    color: #67e8f9;
    background: rgba(34,211,238,.08);
    border: 1px solid rgba(103,232,249,.1);
    border-radius: 8px;
  }

  .category-card-content {
    min-width: 0;
  }

  .category-card-content span,
  .category-card-content strong,
  .category-card-content small {
    display: block;
  }

  .category-card-content span {
    color: rgba(226,232,240,.55);
    font-size: .62rem;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .category-card-content strong {
    margin-top: 3px;
    color: #f8fafc;
    font-size: .76rem;
  }

  .category-card-content small {
    margin-top: 2px;
    color: rgba(148,163,184,.42);
    font-size: .54rem;
  }

  .empty-category {
    grid-column: 1 / -1;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 7px;
    color: rgba(203,213,225,.42);
    font-size: .68rem;
  }

  .result-count {
    padding: 5px 8px;
    color: rgba(203,213,225,.52);
    background: rgba(255,255,255,.035);
    border: 1px solid rgba(148,163,184,.09);
    border-radius: 7px;
    font-size: .58rem;
    white-space: nowrap;
  }

  .expense-list {
    display: grid;
    gap: 8px;
  }

  .expense-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px;
    border: 1px solid rgba(148,163,184,.09);
    border-radius: 12px;
    background: rgba(255,255,255,.025);
    transition: .2s ease;
  }

  .expense-row:hover {
    border-color: rgba(103,232,249,.22);
    background: rgba(124,58,237,.04);
    transform: translateY(-1px);
  }

  .expense-main {
    min-width: 0;
    gap: 10px;
  }

  .expense-avatar {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    display: grid;
    place-items: center;
    color: #a78bfa;
    background: linear-gradient(135deg, rgba(124,58,237,.14), rgba(34,211,238,.07));
    border: 1px solid rgba(167,139,250,.12);
    border-radius: 10px;
  }

  .expense-info {
    min-width: 0;
  }

  .expense-name-row {
    gap: 8px;
    flex-wrap: wrap;
  }

  .expense-info h3 {
    margin: 0;
    color: #f1f5f9;
    font-size: .76rem;
    font-weight: 780;
    overflow-wrap: anywhere;
  }

  .date-badge {
    padding: 3px 6px;
    color: rgba(203,213,225,.52);
    background: rgba(255,255,255,.035);
    border: 1px solid rgba(148,163,184,.08);
    border-radius: 6px;
    font-size: .54rem;
    white-space: nowrap;
  }

  .expense-info p {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    margin: 5px 0 0;
    color: rgba(203,213,225,.47);
    font-size: .62rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .expense-info p svg {
    flex: 0 0 auto;
    margin-top: 1px;
  }

  .no-notes {
    display: block;
    margin-top: 5px;
    color: rgba(148,163,184,.32);
    font-size: .58rem;
  }

  .expense-right {
    flex: 0 0 auto;
    flex-direction: column;
    align-items: flex-end;
    gap: 7px;
  }

  .expense-right > strong {
    color: #f8fafc;
    font-size: .82rem;
    white-space: nowrap;
  }

  .row-actions {
    gap: 5px;
  }

  .row-actions button {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    color: rgba(226,232,240,.6);
    background: rgba(255,255,255,.035);
    border: 1px solid rgba(148,163,184,.1);
    transition: .18s ease;
  }

  .row-actions .edit-action:hover {
    color: #a78bfa;
    border-color: rgba(167,139,250,.3);
    background: rgba(124,58,237,.1);
  }

  .row-actions .delete-action:hover {
    color: #fda4af;
    border-color: rgba(251,113,133,.28);
    background: rgba(244,63,94,.08);
  }

  .row-actions button:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 9px;
    margin-top: 13px;
  }

  .pagination button {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    color: #fff;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(148,163,184,.1);
    border-radius: 8px;
  }

  .pagination button:not(:disabled):hover {
    background: rgba(124,58,237,.12);
    border-color: rgba(167,139,250,.3);
  }

  .pagination button:disabled {
    opacity: .3;
    cursor: not-allowed;
  }

  .pagination span {
    color: rgba(203,213,225,.45);
    font-size: .62rem;
  }

  .pagination strong {
    color: #e2e8f0;
  }

  .state-box {
    min-height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 7px;
    color: rgba(203,213,225,.38);
  }

  .state-box strong {
    color: rgba(226,232,240,.65);
    font-size: .73rem;
  }

  .state-box span {
    font-size: .62rem;
  }

  .state-box button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    padding: 8px 11px;
    color: #fff;
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    border: 0;
    border-radius: 8px;
    font-size: .62rem;
    font-weight: 750;
  }

  .expense-toast {
    position: fixed;
    top: 18px;
    right: 18px;
    z-index: 10020;
    min-width: 260px;
    max-width: min(390px, calc(100vw - 30px));
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 11px;
    border-radius: 11px;
    color: #f8fafc;
    background: rgba(15,23,42,.95);
    border: 1px solid rgba(148,163,184,.15);
    box-shadow: 0 18px 45px rgba(0,0,0,.38);
    backdrop-filter: blur(12px);
    animation: toast-in .22s ease;
    font-size: .68rem;
  }

  .expense-toast.success {
    border-color: rgba(52,211,153,.25);
  }

  .expense-toast.error {
    border-color: rgba(251,113,133,.25);
  }

  .toast-icon {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    display: grid;
    place-items: center;
    border-radius: 8px;
  }

  .expense-toast.success .toast-icon {
    color: #6ee7b7;
    background: rgba(16,185,129,.1);
  }

  .expense-toast.error .toast-icon {
    color: #fda4af;
    background: rgba(244,63,94,.1);
  }

  .expense-toast span {
    flex: 1;
    line-height: 1.4;
  }

  .expense-toast > button {
    display: grid;
    place-items: center;
    color: rgba(203,213,225,.45);
    background: transparent;
    border: 0;
    cursor: pointer;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px;
    background: rgba(2,6,23,.74);
    backdrop-filter: blur(8px);
  }

  .expense-modal,
  .delete-modal {
    width: min(500px, calc(100vw - 28px));
    max-height: calc(100vh - 28px);
    overflow-y: auto;
    box-sizing: border-box;
    padding: 19px;
    border: 1px solid rgba(167,139,250,.2);
    border-radius: 17px;
    background: linear-gradient(145deg, #111827, #0f172a);
    box-shadow: 0 30px 90px rgba(0,0,0,.58), 0 0 45px rgba(124,58,237,.09);
    animation: modal-in .2s ease;
  }

  .delete-modal {
    width: min(400px, calc(100vw - 28px));
    text-align: center;
  }

  .modal-header {
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 15px;
  }

  .modal-header > div:first-child {
    align-items: flex-start;
    gap: 9px;
  }

  .modal-title-icon {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    display: grid;
    place-items: center;
    color: #c4b5fd;
    background: rgba(124,58,237,.12);
    border: 1px solid rgba(167,139,250,.14);
    border-radius: 9px;
  }

  .modal-header h2,
  .delete-modal h2 {
    margin: 0;
    color: #f8fafc;
    font-size: .94rem;
    font-weight: 850;
  }

  .modal-header p {
    margin: 4px 0 0;
    color: rgba(203,213,225,.45);
    font-size: .62rem;
  }

  .modal-close {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    color: rgba(226,232,240,.65);
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(148,163,184,.1);
    border-radius: 8px;
  }

  .modal-close:hover {
    color: #fda4af;
    background: rgba(244,63,94,.08);
  }

  .form-error {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    margin-bottom: 12px;
    padding: 9px 10px;
    color: #fecaca;
    background: rgba(239,68,68,.08);
    border: 1px solid rgba(248,113,113,.2);
    border-radius: 9px;
    font-size: .65rem;
    line-height: 1.4;
  }

  .form-label {
    display: block;
    margin-bottom: 12px;
    color: rgba(226,232,240,.7);
    font-size: .66rem;
    font-weight: 700;
  }

  .optional {
    color: rgba(203,213,225,.32);
    font-weight: 450;
  }

  .form-control,
  .expense-modal textarea {
    width: 100%;
    box-sizing: border-box;
    margin-top: 6px;
    border-radius: 9px;
    outline: 0;
    font: inherit;
  }

  .form-control {
    height: 40px;
    padding: 0 10px;
  }

  .expense-modal input:not(.white-dropdown),
  .expense-modal textarea {
    color: #fff;
    background: rgba(255,255,255,.045);
    border: 1px solid rgba(148,163,184,.13);
  }

  .expense-modal textarea {
    min-height: 85px;
    padding: 9px 10px;
    resize: vertical;
    line-height: 1.45;
  }

  .expense-modal input:focus,
  .expense-modal textarea:focus {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139,92,246,.09);
  }

  .form-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .amount-control,
  .date-control {
    height: 40px;
    box-sizing: border-box;
    gap: 7px;
    margin-top: 6px;
    padding: 0 9px;
    border-radius: 9px;
    color: #a78bfa;
    background: rgba(255,255,255,.045);
    border: 1px solid rgba(148,163,184,.13);
  }

  .amount-control:focus-within,
  .date-control:focus-within {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139,92,246,.09);
  }

  .amount-control input,
  .date-control input {
    width: 100%;
    min-width: 0;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0 !important;
    outline: 0;
    background: transparent !important;
    box-shadow: none !important;
    color: #fff;
    font-size: .7rem;
  }

  .date-control input {
    color-scheme: dark;
  }

  .date-help {
    gap: 5px;
    margin: -2px 0 12px;
    color: rgba(203,213,225,.4);
    font-size: .59rem;
  }

  .date-help svg {
    color: #67e8f9;
  }

  .modal-footer {
    justify-content: flex-end;
    gap: 8px;
    margin-top: 15px;
  }

  .secondary-button,
  .primary-button,
  .danger-button {
    min-height: 37px;
    padding: 0 14px;
    border-radius: 9px;
    font-size: .66rem;
    font-weight: 800;
  }

  .secondary-button {
    color: rgba(226,232,240,.72);
    background: rgba(255,255,255,.045);
    border: 1px solid rgba(148,163,184,.12);
  }

  .secondary-button:hover {
    background: rgba(255,255,255,.075);
  }

  .danger-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #fff;
    background: linear-gradient(135deg, #e11d48, #be123c);
    border: 0;
  }

  .danger-button:hover {
    filter: brightness(1.08);
  }

  .delete-icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    margin: 0 auto 12px;
    color: #fda4af;
    background: rgba(244,63,94,.1);
    border: 1px solid rgba(251,113,133,.17);
    border-radius: 12px;
  }

  .delete-modal p {
    margin: 8px 0 0;
    color: rgba(203,213,225,.53);
    font-size: .67rem;
    line-height: 1.6;
  }

  .delete-modal p strong {
    color: #f8fafc;
  }

  .delete-modal .modal-footer {
    justify-content: center;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(-8px) scale(.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes modal-in {
    from { opacity: 0; transform: translateY(8px) scale(.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 1050px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .category-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .expense-page {
      padding: 10px;
    }

    .expense-header {
      align-items: stretch;
      flex-direction: column;
    }

    .header-actions {
      width: 100%;
    }

    .month-picker {
      flex: 1;
      min-width: 0;
    }

    .month-picker input {
      width: 100%;
      min-width: 0;
    }

    .filter-bar {
      align-items: stretch;
      flex-direction: column;
    }

    .search-box {
      width: 100%;
    }

    .category-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 520px) {
    .expense-page {
      padding: 8px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .category-grid {
      grid-template-columns: 1fr;
    }

    .panel {
      padding: 13px;
      border-radius: 14px;
    }

    .panel-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .white-dropdown {
      width: 100%;
    }

    .expense-row {
      align-items: flex-start;
      flex-direction: column;
    }

    .expense-right {
      width: 100%;
      align-items: flex-start;
      flex-direction: row;
      justify-content: space-between;
    }

    .form-two {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .week-tabs {
      width: 100%;
      justify-content: space-between;
    }

    .week-tabs button {
      flex: 1;
    }

    .period-text {
      width: 100%;
    }

    .expense-toast {
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
      min-width: 0;
    }

    .modal-footer {
      width: 100%;
    }

    .secondary-button,
    .primary-button,
    .danger-button {
      flex: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .stat-card,
    .category-card,
    .expense-row,
    .add-button,
    .primary-button,
    .refresh-button {
      transition: none;
    }

    .spin {
      animation: none;
    }
  }
`;

export default Expense;
