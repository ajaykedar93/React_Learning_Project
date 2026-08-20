import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  Receipt,
  Tag,
  Wallet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("authToken") ||
  "";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const monthStart = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;

const monthInputValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;

const todayInput = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Expense() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date()
  );

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [modal, setModal] = useState(null);
  const [categoryModal, setCategoryModal] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("date-desc");

  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    expense_date: todayInput(),
    notes: "",
  });

  const [categoryName, setCategoryName] =
    useState("");

  const token = getToken();

  const axiosConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),
    [token]
  );

  /*
   * PROFESSIONAL ALERT
   */
  const showToast = useCallback(
    (type, message) => {
      setToast({
        type,
        message,
      });

      clearTimeout(
        window.__expenseToastTimer
      );

      window.__expenseToastTimer =
        setTimeout(() => {
          setToast(null);
        }, 3000);
    },
    []
  );

  /*
   * LOAD EXPENSES
   *
   * Expense API is responsible for:
   * - selected month
   * - expense records
   * - monthly total
   */
  const loadExpenses = useCallback(
    async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `${API_BASE_URL}/expenses`,
          {
            ...axiosConfig,
            params: {
              month: monthStart(selectedMonth),
            },
          }
        );

        const result =
          response.data?.data ??
          response.data ??
          {};

        if (Array.isArray(result)) {
          setExpenses(result);
        } else {
          setExpenses(
            result.expenses ??
              result.rows ??
              result.items ??
              []
          );
        }
      } catch (error) {
        console.error(
          "Get expenses error:",
          error
        );

        showToast(
          "error",
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Could not load expenses"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      selectedMonth,
      axiosConfig,
      showToast,
    ]
  );

  /*
   * LOAD CATEGORIES
   */
  const loadCategories =
    useCallback(async () => {
      try {
        const response =
          await axios.get(
            `${API_BASE_URL}/expenses/categories`,
            axiosConfig
          );

        const result =
          response.data?.data ??
          response.data ??
          [];

        if (Array.isArray(result)) {
          setCategories(result);
        } else {
          setCategories(
            result.categories ??
              result.rows ??
              []
          );
        }
      } catch (error) {
        console.error(
          "Get categories error:",
          error
        );

        showToast(
          "error",
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Could not load categories"
        );
      }
    }, [axiosConfig, showToast]);

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, [
    loadExpenses,
    loadCategories,
  ]);

  /*
   * REFRESH
   */
  const refreshPage = async () => {
    setRefreshing(true);

    await Promise.all([
      loadExpenses(),
      loadCategories(),
    ]);

    setRefreshing(false);
  };

  /*
   * MONTH
   */
  const changeMonth = (amount) => {
    setSelectedMonth((old) => {
      const date = new Date(old);

      date.setMonth(
        date.getMonth() + amount
      );

      return date;
    });
  };

  const changeMonthInput = (value) => {
    if (!value) return;

    const [year, month] =
      value.split("-");

    setSelectedMonth(
      new Date(
        Number(year),
        Number(month) - 1,
        1
      )
    );
  };

  const selectCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  /*
   * RESET EXPENSE FORM
   */
  const resetForm = () => {
    setForm({
      category_id: "",
      amount: "",
      expense_date: todayInput(),
      notes: "",
    });

    setEditingId(null);
  };

  /*
   * ADD EXPENSE
   */
  const openAddExpense = () => {
    resetForm();

    setModal("add");
  };

  /*
   * EDIT EXPENSE
   */
  const openEditExpense = (
    expense
  ) => {
    setEditingId(expense.id);

    setForm({
      category_id:
        expense.category_id
          ? String(expense.category_id)
          : "",

      amount:
        expense.amount !== undefined
          ? String(expense.amount)
          : "",

      expense_date:
        String(
          expense.expense_date || ""
        ).slice(0, 10),

      notes:
        expense.notes || "",
    });

    setModal("edit");
  };

  /*
   * SAVE EXPENSE
   */
  const saveExpense = async () => {
    if (!form.category_id) {
      showToast(
        "error",
        "Please select a category."
      );
      return;
    }

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      showToast(
        "error",
        "Enter a valid expense amount."
      );
      return;
    }

    if (!form.expense_date) {
      showToast(
        "error",
        "Please select expense date."
      );
      return;
    }

    /*
     * Prevent saving a date from another month.
     */
    const selectedPrefix =
      monthInputValue(selectedMonth);

    if (
      form.expense_date.slice(0, 7) !==
      selectedPrefix
    ) {
      showToast(
        "error",
        "Expense date must be inside the selected month."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        category_id: Number(
          form.category_id
        ),

        amount: Number(
          form.amount
        ),

        expense_date:
          form.expense_date,

        notes:
          form.notes.trim() || null,
      };

      if (
        modal === "edit" &&
        editingId
      ) {
        await axios.put(
          `${API_BASE_URL}/expenses/${editingId}`,
          payload,
          axiosConfig
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/expenses`,
          payload,
          axiosConfig
        );
      }

      setModal(null);

      resetForm();

      await loadExpenses();

      showToast(
        "success",
        modal === "edit"
          ? "Expense updated successfully."
          : "Expense added successfully."
      );
    } catch (error) {
      console.error(
        "Save expense error:",
        error
      );

      showToast(
        "error",
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Could not save expense"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * DELETE EXPENSE
   */
  const deleteExpense = async (
    expenseId
  ) => {
    setSaving(true);

    try {
      await axios.delete(
        `${API_BASE_URL}/expenses/${expenseId}`,
        axiosConfig
      );

      await loadExpenses();

      showToast(
        "success",
        "Expense deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete expense error:",
        error
      );

      showToast(
        "error",
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Could not delete expense"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ADD CATEGORY
   */
  const addCategory = async () => {
    const name =
      categoryName.trim();

    if (!name) {
      showToast(
        "error",
        "Enter category name."
      );
      return;
    }

    setSaving(true);

    try {
      await axios.post(
        `${API_BASE_URL}/expenses/categories`,
        {
          category_name: name,
        },
        axiosConfig
      );

      setCategoryName("");

      await loadCategories();

      showToast(
        "success",
        "Category added successfully."
      );
    } catch (error) {
      console.error(
        "Add category error:",
        error
      );

      showToast(
        "error",
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Could not add category"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * DELETE CATEGORY
   *
   * PostgreSQL uses ON DELETE RESTRICT,
   * therefore a category already used by
   * expenses cannot be deleted.
   */
  const deleteCategory =
    async (categoryId) => {
      setSaving(true);

      try {
        await axios.delete(
          `${API_BASE_URL}/expenses/categories/${categoryId}`,
          axiosConfig
        );

        await loadCategories();

        showToast(
          "success",
          "Category deleted successfully."
        );
      } catch (error) {
        console.error(
          "Delete category error:",
          error
        );

        showToast(
          "error",
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Category is already being used or cannot be deleted."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * FILTER + SORT
   */
  const filteredExpenses =
    [...expenses]
      .filter((expense) => {
        const query =
          search
            .trim()
            .toLowerCase();

        const categoryName =
          String(
            expense.category_name ||
              ""
          ).toLowerCase();

        const notes =
          String(
            expense.notes || ""
          ).toLowerCase();

        const matchesSearch =
          !query ||
          categoryName.includes(
            query
          ) ||
          notes.includes(query);

        const matchesCategory =
          categoryFilter === "all" ||
          String(
            expense.category_id
          ) === String(
            categoryFilter
          );

        return (
          matchesSearch &&
          matchesCategory
        );
      })
      .sort((a, b) => {
        if (
          sortBy === "amount-desc"
        ) {
          return (
            Number(b.amount) -
            Number(a.amount)
          );
        }

        if (
          sortBy === "amount-asc"
        ) {
          return (
            Number(a.amount) -
            Number(b.amount)
          );
        }

        if (
          sortBy === "date-asc"
        ) {
          return (
            new Date(
              a.expense_date
            ) -
            new Date(
              b.expense_date
            )
          );
        }

        return (
          new Date(
            b.expense_date
          ) -
          new Date(
            a.expense_date
          )
        );
      });

  /*
   * MONTH TOTAL
   *
   * This is automatically calculated
   * from personal_expenses for the
   * selected month.
   */
  const totalExpenses =
    expenses.reduce(
      (total, expense) =>
        total +
        Number(
          expense.amount || 0
        ),
      0
    );

  /*
   * WEEK TOTALS
   */
  const weekTotals = {
    week1: 0,
    week2: 0,
    week3: 0,
    week4: 0,
  };

  expenses.forEach((expense) => {
    const day =
      new Date(
        expense.expense_date
      ).getDate();

    if (day <= 7) {
      weekTotals.week1 +=
        Number(
          expense.amount || 0
        );
    } else if (day <= 14) {
      weekTotals.week2 +=
        Number(
          expense.amount || 0
        );
    } else if (day <= 21) {
      weekTotals.week3 +=
        Number(
          expense.amount || 0
        );
    } else {
      weekTotals.week4 +=
        Number(
          expense.amount || 0
        );
    }
  });

  /*
   * CATEGORY TOTALS
   */
  const categoryTotals = {};

  expenses.forEach(
    (expense) => {
      const name =
        expense.category_name ||
        "Other";

      categoryTotals[name] =
        (categoryTotals[name] ||
          0) +
        Number(
          expense.amount || 0
        );
    }
  );

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f4f7fb;
        }

        .expense-page {
          min-height: 100vh;
          padding: 12px;
          color: #172033;

          background:
            radial-gradient(
              circle at 0% 0%,
              rgba(26, 105, 170, 0.10),
              transparent 30%
            ),
            radial-gradient(
              circle at 100% 10%,
              rgba(96, 72, 190, 0.08),
              transparent 28%
            ),
            #f4f7fb;
        }

        .expense-container {
          width: min(1180px, 100%);
          margin: auto;
        }

        /* HEADER */

        .expense-header {
          position: sticky;
          top: 0;
          z-index: 40;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 12px;

          padding: 12px;

          margin-bottom: 11px;

          background: rgba(
            255,
            255,
            255,
            0.96
          );

          border:
            1px solid #e5eaf1;

          border-radius: 18px;

          box-shadow:
            0 8px 30px
            rgba(20, 35, 60, 0.08);

          backdrop-filter: blur(12px);
        }

        .expense-brand {
          display: flex;
          align-items: center;
          gap: 10px;

          min-width: 0;
        }

        .expense-brand-icon {
          width: 44px;
          height: 44px;

          flex: 0 0 44px;

          display: grid;
          place-items: center;

          border-radius: 14px;

          color: white;

          background:
            linear-gradient(
              135deg,
              #1769aa,
              #6246c7
            );

          box-shadow:
            0 8px 20px
            rgba(49, 90, 165, 0.22);
        }

        .expense-brand h1 {
          margin: 0;

          font-size:
            clamp(18px, 3vw, 25px);

          font-weight: 900;

          letter-spacing: -0.04em;
        }

        .expense-brand p {
          margin: 2px 0 0;

          color: #7c8799;

          font-size: 11px;
        }

        .expense-controls {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .expense-icon-btn {
          width: 37px;
          height: 37px;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 10px;

          background: #eff2f7;

          color: #344054;

          cursor: pointer;

          transition: 0.2s ease;
        }

        .expense-icon-btn:hover {
          background: #e4e9f1;

          transform:
            translateY(-1px);
        }

        .expense-icon-btn:disabled {
          opacity: 0.55;
        }

        .expense-month {
          min-width: 145px;

          height: 37px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 6px;

          padding: 0 10px;

          border-radius: 10px;

          background: #eff2f7;

          font-size: 12px;

          font-weight: 800;

          white-space: nowrap;
        }

        .expense-month-input {
          width: 125px;
          height: 37px;

          border: 0;

          border-radius: 10px;

          padding: 0 7px;

          background: #eff2f7;

          color: #344054;

          font-size: 11px;

          font-weight: 700;

          outline: none;
        }

        .expense-current {
          height: 37px;

          border: 0;

          border-radius: 10px;

          padding: 0 11px;

          background: #eaf3ff;

          color: #1769aa;

          font-size: 11px;

          font-weight: 800;

          cursor: pointer;
        }

        .expense-add {
          height: 37px;

          display: flex;
          align-items: center;
          gap: 5px;

          border: 0;

          border-radius: 10px;

          padding: 0 13px;

          color: white;

          background:
            linear-gradient(
              135deg,
              #1769aa,
              #6246c7
            );

          font-size: 11px;

          font-weight: 850;

          cursor: pointer;

          box-shadow:
            0 6px 16px
            rgba(49, 90, 165, 0.20);
        }

        /* STATS */

        .expense-stats {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 9px;

          margin-bottom: 10px;
        }

        .expense-stat {
          display: flex;
          align-items: center;

          gap: 10px;

          padding: 14px;

          background: white;

          border:
            1px solid #e5eaf1;

          border-radius: 16px;

          box-shadow:
            0 7px 24px
            rgba(20, 35, 60, 0.06);

          transition: 0.2s ease;
        }

        .expense-stat:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 12px 30px
            rgba(20, 35, 60, 0.10);
        }

        .expense-stat-icon {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          display: grid;
          place-items: center;

          border-radius: 12px;
        }

        .expense-stat-icon.red {
          color: #d04444;
          background: #fff0f0;
        }

        .expense-stat-icon.purple {
          color: #6347c7;
          background: #f0ecff;
        }

        .expense-stat-icon.blue {
          color: #1769aa;
          background: #eaf3ff;
        }

        .expense-stat-icon.green {
          color: #168451;
          background: #e9f8f0;
        }

        .expense-stat-text {
          min-width: 0;
        }

        .expense-stat-text small {
          display: block;

          color: #7b8496;

          font-size: 9px;

          font-weight: 850;

          text-transform: uppercase;
        }

        .expense-stat-text strong {
          display: block;

          margin-top: 4px;

          font-size:
            clamp(16px, 2.3vw, 23px);

          font-weight: 900;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        .expense-stat-text span {
          display: block;

          margin-top: 2px;

          color: #9aa4b5;

          font-size: 9px;
        }

        /* PANEL */

        .expense-panel {
          padding: 15px;

          margin-bottom: 10px;

          background: white;

          border:
            1px solid #e5eaf1;

          border-radius: 16px;

          box-shadow:
            0 7px 24px
            rgba(20, 35, 60, 0.06);
        }

        .expense-panel-header {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 10px;

          margin-bottom: 12px;
        }

        .expense-panel-title h2 {
          margin: 0;

          font-size: 14px;

          font-weight: 900;
        }

        .expense-panel-title p {
          margin: 3px 0 0;

          color: #8a94a6;

          font-size: 10px;
        }

        .expense-category-btn {
          display: flex;
          align-items: center;
          gap: 5px;

          border: 0;

          border-radius: 9px;

          padding: 9px 11px;

          background: #eef4ff;

          color: #1769aa;

          font-size: 10px;

          font-weight: 800;

          cursor: pointer;
        }

        .expense-filters {
          display: grid;

          grid-template-columns:
            1fr 180px 170px;

          gap: 7px;
        }

        .expense-search {
          height: 39px;

          display: flex;
          align-items: center;

          gap: 7px;

          padding: 0 11px;

          border:
            1px solid #e4e9f0;

          border-radius: 10px;

          background: #f7f9fc;

          color: #8a94a6;
        }

        .expense-search input {
          width: 100%;

          border: 0;

          outline: 0;

          background: transparent;

          font-size: 11px;
        }

        .expense-filter {
          height: 39px;

          border:
            1px solid #e4e9f0;

          border-radius: 10px;

          padding: 0 9px;

          background: #f7f9fc;

          color: #344054;

          font-size: 11px;

          outline: none;
        }

        /* WEEK CARDS */

        .expense-week-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 8px;

          margin-bottom: 10px;
        }

        .expense-week {
          padding: 11px;

          border-radius: 12px;

          background:
            linear-gradient(
              145deg,
              #f8fafc,
              #f1f5fa
            );

          border:
            1px solid #e5eaf1;
        }

        .expense-week span {
          color: #7b8496;

          font-size: 9px;

          font-weight: 800;
        }

        .expense-week strong {
          display: block;

          margin-top: 5px;

          font-size: 15px;

          font-weight: 900;
        }

        /* CATEGORY SUMMARY */

        .expense-category-summary {
          display: flex;

          gap: 7px;

          overflow-x: auto;

          padding-bottom: 3px;

          margin-bottom: 10px;
        }

        .expense-category-summary-card {
          min-width: 125px;

          padding: 10px;

          border-radius: 11px;

          background: #f8fafc;

          border:
            1px solid #e6ebf1;
        }

        .expense-category-summary-card span {
          display: block;

          color: #7b8496;

          font-size: 9px;

          font-weight: 750;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        .expense-category-summary-card strong {
          display: block;

          margin-top: 4px;

          font-size: 13px;
        }

        /* LIST */

        .expense-list {
          display: flex;

          flex-direction: column;

          gap: 7px;
        }

        .expense-row {
          display: flex;

          align-items: center;

          gap: 10px;

          padding: 12px;

          background: white;

          border:
            1px solid #e5eaf1;

          border-radius: 14px;

          box-shadow:
            0 5px 18px
            rgba(20, 35, 60, 0.05);

          transition: 0.2s ease;
        }

        .expense-row:hover {
          transform:
            translateY(-1px);

          box-shadow:
            0 9px 25px
            rgba(20, 35, 60, 0.09);
        }

        .expense-row-icon {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          display: grid;
          place-items: center;

          border-radius: 11px;

          color: #d04444;

          background: #fff0f0;
        }

        .expense-row-main {
          flex: 1;

          min-width: 0;
        }

        .expense-row-main strong {
          display: block;

          font-size: 13px;

          font-weight: 850;
        }

        .expense-row-main span {
          display: block;

          margin-top: 3px;

          color: #7b8496;

          font-size: 9px;
        }

        .expense-row-main small {
          display: block;

          margin-top: 3px;

          color: #9aa4b5;

          font-size: 9px;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        .expense-row-amount {
          color: #d04444;

          font-size: 14px;

          font-weight: 900;

          white-space: nowrap;
        }

        .expense-row-actions {
          display: flex;

          gap: 3px;
        }

        .expense-row-action {
          width: 32px;
          height: 32px;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 9px;

          background: #f1f4f8;

          color: #667085;

          cursor: pointer;
        }

        .expense-row-action.edit:hover {
          color: #1769aa;

          background: #eaf3ff;
        }

        .expense-row-action.delete:hover {
          color: #d04444;

          background: #fff0f0;
        }

        /* EMPTY */

        .expense-empty {
          min-height: 260px;

          display: flex;

          align-items: center;

          justify-content: center;

          flex-direction: column;

          gap: 8px;

          background: white;

          border:
            1px solid #e5eaf1;

          border-radius: 16px;

          color: #7b8496;
        }

        .expense-empty strong {
          font-size: 13px;
        }

        .expense-empty span {
          font-size: 10px;
        }

        /* MODAL */

        .expense-modal-backdrop {
          position: fixed;

          inset: 0;

          z-index: 1000;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 14px;

          background:
            rgba(7, 19, 38, 0.62);

          backdrop-filter: blur(5px);
        }

        .expense-modal {
          width:
            min(470px, 100%);

          max-height: 90vh;

          overflow: auto;

          background: white;

          border-radius: 18px;

          box-shadow:
            0 25px 80px
            rgba(7, 19, 38, 0.30);

          animation:
            expenseModalIn 0.18s ease;
        }

        .expense-modal-header {
          position: sticky;

          top: 0;

          z-index: 2;

          display: flex;

          align-items: center;

          justify-content: space-between;

          padding: 14px;

          border-bottom:
            1px solid #e8edf3;

          background: white;
        }

        .expense-modal-header h2 {
          margin: 0;

          font-size: 16px;

          font-weight: 900;
        }

        .expense-modal-close {
          width: 32px;
          height: 32px;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 9px;

          background: #f1f4f8;

          color: #667085;

          cursor: pointer;
        }

        .expense-modal-body {
          padding: 15px;
        }

        .expense-form {
          display: grid;

          gap: 11px;
        }

        .expense-form label {
          display: grid;

          gap: 5px;

          color: #596579;

          font-size: 10px;

          font-weight: 800;
        }

        .expense-form input,
        .expense-form select,
        .expense-form textarea {
          width: 100%;

          border:
            1px solid #dfe5ed;

          border-radius: 10px;

          padding: 10px;

          background: #f8fafc;

          color: #172033;

          outline: none;

          font-size: 12px;
        }

        .expense-form input,
        .expense-form select {
          height: 40px;
        }

        .expense-form textarea {
          min-height: 85px;

          resize: vertical;
        }

        .expense-form input:focus,
        .expense-form select:focus,
        .expense-form textarea:focus {
          border-color: #5b8def;

          box-shadow:
            0 0 0 3px
            rgba(91, 141, 239, 0.12);
        }

        .expense-submit {
          width: 100%;

          height: 41px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 6px;

          margin-top: 12px;

          border: 0;

          border-radius: 10px;

          color: white;

          background:
            linear-gradient(
              135deg,
              #1769aa,
              #6246c7
            );

          font-size: 11px;

          font-weight: 850;

          cursor: pointer;
        }

        .expense-category-add {
          display: flex;

          gap: 7px;
        }

        .expense-category-add input {
          flex: 1;

          height: 40px;

          border:
            1px solid #dfe5ed;

          border-radius: 10px;

          padding: 0 10px;

          outline: none;
        }

        .expense-category-add button {
          height: 40px;

          border: 0;

          border-radius: 10px;

          padding: 0 13px;

          color: white;

          background:
            linear-gradient(
              135deg,
              #1769aa,
              #6246c7
            );

          font-size: 11px;

          font-weight: 800;

          cursor: pointer;
        }

        .expense-category-list {
          display: grid;

          gap: 6px;

          margin-top: 12px;
        }

        .expense-category-item {
          display: flex;

          align-items: center;

          justify-content: space-between;

          padding: 10px 11px;

          border:
            1px solid #e6ebf1;

          border-radius: 10px;

          background: #f8fafc;

          font-size: 11px;

          font-weight: 750;
        }

        .expense-category-delete {
          width: 30px;
          height: 30px;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 8px;

          background: #fff0f0;

          color: #d04444;

          cursor: pointer;
        }

        /* TOAST */

        .expense-toast-container {
          position: fixed;

          z-index: 5000;

          left: 50%;
          top: 50%;

          transform:
            translate(-50%, -50%);

          width:
            min(350px, calc(100vw - 26px));
        }

        .expense-toast {
          display: flex;

          align-items: flex-start;

          gap: 9px;

          padding: 13px;

          background: white;

          border:
            1px solid #e3e8ef;

          border-left:
            4px solid #168451;

          border-radius: 13px;

          box-shadow:
            0 20px 65px
            rgba(7, 19, 38, 0.24);

          animation:
            expenseToastIn 0.18s ease;
        }

        .expense-toast.error {
          border-left-color: #d04444;
        }

        .expense-toast-content {
          flex: 1;

          min-width: 0;
        }

        .expense-toast-title {
          font-size: 12px;

          font-weight: 850;
        }

        .expense-toast-message {
          margin-top: 3px;

          color: #697386;

          font-size: 10px;

          line-height: 1.45;

          overflow-wrap: anywhere;
        }

        .expense-toast-close {
          width: 27px;
          height: 27px;

          display: grid;
          place-items: center;

          border: 0;

          border-radius: 8px;

          background: #f0f3f7;

          cursor: pointer;
        }

        .expense-spin {
          animation:
            expenseSpin 0.9s linear infinite;
        }

        @keyframes expenseSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes expenseModalIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes expenseToastIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* TABLET */

        @media (max-width: 900px) {
          .expense-stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .expense-filters {
            grid-template-columns:
              1fr 1fr;
          }

          .expense-search {
            grid-column: 1 / -1;
          }

          .expense-week-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .expense-page {
            padding: 7px;

            padding-bottom:
              env(
                safe-area-inset-bottom,
                10px
              );
          }

          .expense-header {
            flex-direction: column;

            align-items: stretch;

            border-radius: 15px;
          }

          .expense-controls {
            justify-content: center;

            flex-wrap: nowrap;
          }

          .expense-month {
            flex: 1;

            min-width: 0;
          }

          .expense-month-input {
            width: 108px;
          }

          .expense-current {
            display: none;
          }

          .expense-add {
            padding: 0 10px;
          }

          .expense-stats {
            gap: 6px;
          }

          .expense-stat {
            padding: 11px;

            gap: 7px;

            border-radius: 13px;
          }

          .expense-stat-icon {
            width: 32px;
            height: 32px;

            flex-basis: 32px;
          }

          .expense-stat-text strong {
            font-size: 16px;
          }

          .expense-stat-text small {
            font-size: 8px;
          }

          .expense-panel {
            padding: 12px;

            border-radius: 14px;
          }

          .expense-panel-header {
            align-items: flex-start;
          }

          .expense-filters {
            grid-template-columns: 1fr;
          }

          .expense-search {
            grid-column: auto;
          }

          .expense-week-grid {
            gap: 6px;
          }

          .expense-week {
            padding: 9px;
          }

          .expense-week strong {
            font-size: 13px;
          }

          .expense-row {
            padding: 10px;

            gap: 8px;

            border-radius: 13px;
          }

          .expense-row-icon {
            width: 34px;
            height: 34px;

            flex-basis: 34px;
          }

          .expense-row-amount {
            font-size: 12px;
          }

          .expense-row-actions {
            flex-direction: column;
          }

          .expense-modal-backdrop {
            align-items: flex-end;

            padding: 7px;
          }

          .expense-modal {
            max-height: 92vh;

            border-radius:
              18px 18px 12px 12px;
          }
        }

        @media (max-width: 390px) {
          .expense-brand p {
            display: none;
          }

          .expense-controls {
            gap: 3px;
          }

          .expense-month-input {
            width: 100px;
          }

          .expense-stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .expense-week-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      <main className="expense-page">
        <div className="expense-container">

          {/* HEADER */}
          <header className="expense-header">

            <div className="expense-brand">

              <div className="expense-brand-icon">
                <Wallet size={21} />
              </div>

              <div>
                <h1>Expenses</h1>

                <p>
                  Monthly expense management
                </p>
              </div>
            </div>

            <div className="expense-controls">

              <button
                type="button"
                className="expense-icon-btn"
                onClick={() =>
                  changeMonth(-1)
                }
              >
                <ChevronLeft size={18} />
              </button>

              <div className="expense-month">
                <CalendarDays size={15} />

                {selectedMonth.toLocaleDateString(
                  "en-IN",
                  {
                    month: "long",
                    year: "numeric",
                  }
                )}
              </div>

              <button
                type="button"
                className="expense-icon-btn"
                onClick={() =>
                  changeMonth(1)
                }
              >
                <ChevronRight size={18} />
              </button>

              <input
                type="month"
                className="expense-month-input"
                value={monthInputValue(
                  selectedMonth
                )}
                onChange={(e) =>
                  changeMonthInput(
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="expense-current"
                onClick={
                  selectCurrentMonth
                }
              >
                Current
              </button>

              <button
                type="button"
                className="expense-icon-btn"
                onClick={refreshPage}
                disabled={refreshing}
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "expense-spin"
                      : ""
                  }
                />
              </button>

              <button
                type="button"
                className="expense-add"
                onClick={
                  openAddExpense
                }
              >
                <Plus size={15} />
                Add
              </button>
            </div>
          </header>

          {/* STATS */}
          <section className="expense-stats">

            <div className="expense-stat">
              <div className="expense-stat-icon red">
                <Receipt size={18} />
              </div>

              <div className="expense-stat-text">
                <small>
                  Total Expenses
                </small>

                <strong>
                  {formatMoney(
                    totalExpenses
                  )}
                </strong>

                <span>
                  Selected month
                </span>
              </div>
            </div>

            <div className="expense-stat">
              <div className="expense-stat-icon purple">
                <Tag size={18} />
              </div>

              <div className="expense-stat-text">
                <small>
                  Categories
                </small>

                <strong>
                  {categories.length}
                </strong>

                <span>
                  Available categories
                </span>
              </div>
            </div>

            <div className="expense-stat">
              <div className="expense-stat-icon blue">
                <Wallet size={18} />
              </div>

              <div className="expense-stat-text">
                <small>
                  Transactions
                </small>

                <strong>
                  {expenses.length}
                </strong>

                <span>
                  This month
                </span>
              </div>
            </div>

            <div className="expense-stat">
              <div className="expense-stat-icon green">
                <CalendarDays size={18} />
              </div>

              <div className="expense-stat-text">
                <small>
                  Month
                </small>

                <strong>
                  {selectedMonth.toLocaleDateString(
                    "en-IN",
                    {
                      month: "short",
                    }
                  )}
                </strong>

                <span>
                  {selectedMonth.getFullYear()}
                </span>
              </div>
            </div>
          </section>

          {/* FILTER SECTION */}
          <section className="expense-panel">

            <div className="expense-panel-header">

              <div className="expense-panel-title">
                <h2>
                  Expense Overview
                </h2>

                <p>
                  All expenses for selected month
                </p>
              </div>

              <button
                type="button"
                className="expense-category-btn"
                onClick={() =>
                  setCategoryModal(true)
                }
              >
                <Tag size={14} />
                Categories
              </button>
            </div>

            <div className="expense-filters">

              <div className="expense-search">
                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search category or notes..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />
              </div>

              <select
                className="expense-filter"
                value={
                  categoryFilter
                }
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value
                  )
                }
              >
                <option value="all">
                  All Categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {
                        category.category_name
                      }
                    </option>
                  )
                )}
              </select>

              <select
                className="expense-filter"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value
                  )
                }
              >
                <option value="date-desc">
                  Newest First
                </option>

                <option value="date-asc">
                  Oldest First
                </option>

                <option value="amount-desc">
                  Highest Amount
                </option>

                <option value="amount-asc">
                  Lowest Amount
                </option>
              </select>
            </div>
          </section>

          {/* WEEK TOTALS */}
          <section className="expense-panel">

            <div className="expense-panel-header">
              <div className="expense-panel-title">
                <h2>
                  Weekly Expenses
                </h2>

                <p>
                  Selected month's weekly totals
                </p>
              </div>
            </div>

            <div className="expense-week-grid">

              <div className="expense-week">
                <span>
                  WEEK 1 · 1–7
                </span>

                <strong>
                  {formatMoney(
                    weekTotals.week1
                  )}
                </strong>
              </div>

              <div className="expense-week">
                <span>
                  WEEK 2 · 8–14
                </span>

                <strong>
                  {formatMoney(
                    weekTotals.week2
                  )}
                </strong>
              </div>

              <div className="expense-week">
                <span>
                  WEEK 3 · 15–21
                </span>

                <strong>
                  {formatMoney(
                    weekTotals.week3
                  )}
                </strong>
              </div>

              <div className="expense-week">
                <span>
                  WEEK 4 · 22–END
                </span>

                <strong>
                  {formatMoney(
                    weekTotals.week4
                  )}
                </strong>
              </div>
            </div>

            {Object.keys(
              categoryTotals
            ).length > 0 && (
              <>
                <div
                  className="expense-panel-header"
                  style={{
                    marginTop: "12px",
                  }}
                >
                  <div className="expense-panel-title">
                    <h2>
                      Category Totals
                    </h2>
                  </div>
                </div>

                <div className="expense-category-summary">
                  {Object.entries(
                    categoryTotals
                  ).map(
                    ([name, amount]) => (
                      <div
                        className="expense-category-summary-card"
                        key={name}
                      >
                        <span>
                          {name}
                        </span>

                        <strong>
                          {formatMoney(
                            amount
                          )}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </section>

          {/* EXPENSE LIST */}
          <section className="expense-list">

            {loading &&
            expenses.length === 0 ? (
              <div className="expense-empty">
                <RefreshCw
                  size={28}
                  className="expense-spin"
                />

                <strong>
                  Loading expenses...
                </strong>
              </div>
            ) : filteredExpenses.length ===
              0 ? (
              <div className="expense-empty">
                <Receipt size={38} />

                <strong>
                  No expenses found
                </strong>

                <span>
                  Add an expense or change
                  your filters.
                </span>
              </div>
            ) : (
              filteredExpenses.map(
                (expense) => (
                  <article
                    className="expense-row"
                    key={expense.id}
                  >
                    <div className="expense-row-icon">
                      <Receipt size={17} />
                    </div>

                    <div className="expense-row-main">
                      <strong>
                        {
                          expense.category_name ||
                          "Expense"
                        }
                      </strong>

                      <span>
                        {new Date(
                          expense.expense_date
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>

                      {expense.notes ? (
                        <small>
                          {expense.notes}
                        </small>
                      ) : null}
                    </div>

                    <div className="expense-row-amount">
                      {formatMoney(
                        expense.amount
                      )}
                    </div>

                    <div className="expense-row-actions">

                      <button
                        type="button"
                        className="expense-row-action edit"
                        onClick={() =>
                          openEditExpense(
                            expense
                          )
                        }
                        title="Edit"
                      >
                        <Edit2
                          size={15}
                        />
                      </button>

                      <button
                        type="button"
                        className="expense-row-action delete"
                        onClick={() =>
                          deleteExpense(
                            expense.id
                          )
                        }
                        title="Delete"
                        disabled={saving}
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    </div>
                  </article>
                )
              )
            )}
          </section>
        </div>
      </main>

      {/* ADD / EDIT EXPENSE MODAL */}
      {modal ? (
        <div
          className="expense-modal-backdrop"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setModal(null);
              resetForm();
            }
          }}
        >
          <div className="expense-modal">

            <div className="expense-modal-header">
              <h2>
                {modal === "edit"
                  ? "Edit Expense"
                  : "Add Expense"}
              </h2>

              <button
                type="button"
                className="expense-modal-close"
                onClick={() => {
                  setModal(null);
                  resetForm();
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="expense-modal-body">

              <div className="expense-form">

                <label>
                  Category

                  <select
                    value={
                      form.category_id
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category_id:
                          e.target.value,
                      })
                    }
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.category_name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Amount

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={
                      form.amount
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount:
                          e.target.value,
                      })
                    }
                    placeholder="Enter amount"
                  />
                </label>

                <label>
                  Expense Date

                  <input
                    type="date"
                    value={
                      form.expense_date
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        expense_date:
                          e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Notes

                  <textarea
                    value={
                      form.notes
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notes:
                          e.target.value,
                      })
                    }
                    placeholder="Optional notes"
                  />
                </label>
              </div>

              <button
                type="button"
                className="expense-submit"
                onClick={
                  saveExpense
                }
                disabled={saving}
              >
                <Save size={15} />

                {saving
                  ? "Saving..."
                  : modal === "edit"
                  ? "Update Expense"
                  : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* CATEGORY MODAL */}
      {categoryModal ? (
        <div
          className="expense-modal-backdrop"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setCategoryModal(
                false
              );
            }
          }}
        >
          <div className="expense-modal">

            <div className="expense-modal-header">
              <h2>
                Expense Categories
              </h2>

              <button
                type="button"
                className="expense-modal-close"
                onClick={() =>
                  setCategoryModal(
                    false
                  )
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="expense-modal-body">

              <div className="expense-category-add">

                <input
                  type="text"
                  value={
                    categoryName
                  }
                  onChange={(e) =>
                    setCategoryName(
                      e.target.value
                    )
                  }
                  placeholder="Category name"
                />

                <button
                  type="button"
                  onClick={
                    addCategory
                  }
                  disabled={saving}
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              <div className="expense-category-list">

                {categories.length ===
                0 ? (
                  <div
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "20px",
                      color:
                        "#7b8496",
                      fontSize:
                        "11px",
                    }}
                  >
                    No categories found.
                  </div>
                ) : (
                  categories.map(
                    (category) => (
                      <div
                        className="expense-category-item"
                        key={
                          category.id
                        }
                      >
                        <span>
                          {
                            category.category_name
                          }
                        </span>

                        {!category.is_default ? (
                          <button
                            type="button"
                            className="expense-category-delete"
                            onClick={() =>
                              deleteCategory(
                                category.id
                              )
                            }
                            disabled={
                              saving
                            }
                            title="Delete category"
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        ) : (
                          <span
                            style={{
                              color:
                                "#8a94a6",
                              fontSize:
                                "9px",
                            }}
                          >
                            Default
                          </span>
                        )}
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* PROFESSIONAL CENTER ALERT */}
      {toast ? (
        <div className="expense-toast-container">

          <div
            className={`expense-toast ${toast.type}`}
          >
            {toast.type ===
            "success" ? (
              <CheckCircle2
                size={19}
                color="#168451"
              />
            ) : (
              <AlertCircle
                size={19}
                color="#d04444"
              />
            )}

            <div className="expense-toast-content">

              <div className="expense-toast-title">
                {toast.type ===
                "success"
                  ? "Success"
                  : "Error"}
              </div>

              <div className="expense-toast-message">
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              className="expense-toast-close"
              onClick={() =>
                setToast(null)
              }
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}