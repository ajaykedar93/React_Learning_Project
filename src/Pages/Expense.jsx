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

const API_BASE_URL = (
  import.meta.env?.VITE_API_URL ||  "https://express-project-learning-new.onrender.com/api" ||
  "http://localhost:5000/api"
).replace(/\/$/, "");

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
    minimumFractionDigits: 0,
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

  const [weekFilter, setWeekFilter] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("date-desc");

  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

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
        const response = await axios.get(
          `${API_BASE_URL}/expenses/categories`,
          axiosConfig
        );

        const payload = response?.data ?? {};
        const raw =
          payload?.data ??
          payload?.categories ??
          payload?.rows ??
          [];

        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.categories)
          ? raw.categories
          : Array.isArray(raw?.rows)
          ? raw.rows
          : [];

        setCategories(
          list
            .filter((item) => item && item.id != null)
            .map((item) => ({
              ...item,
              category_name:
                item.category_name ||
                item.name ||
                "Unnamed category",
              is_default:
                Boolean(item.is_default),
            }))
        );
      } catch (error) {
        console.error(
          "Get categories error:",
          error
        );

        setCategories([]);

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

  useEffect(() => {
    const overlayOpen =
      modal !== null ||
      categoryModal === true ||
      confirmAction !== null;

    if (!overlayOpen) {
      return undefined;
    }

    const scrollY = window.scrollY || 0;
    const body = document.body;
    const html = document.documentElement;

    const previousBodyOverflow =
      body.style.overflow;
    const previousBodyPosition =
      body.style.position;
    const previousBodyTop =
      body.style.top;
    const previousBodyWidth =
      body.style.width;
    const previousHtmlOverflow =
      html.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      html.style.overflow =
        previousHtmlOverflow;
      body.style.overflow =
        previousBodyOverflow;
      body.style.position =
        previousBodyPosition;
      body.style.top =
        previousBodyTop;
      body.style.width =
        previousBodyWidth;

      window.scrollTo({
        top: scrollY,
        left: 0,
        behavior: "auto",
      });
    };
  }, [
    modal,
    categoryModal,
    confirmAction,
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
    setWeekFilter("all");

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

    setWeekFilter("all");

    setSelectedMonth(
      new Date(
        Number(year),
        Number(month) - 1,
        1
      )
    );
  };

  const selectCurrentMonth = () => {
    setWeekFilter("all");
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
  const deleteExpense = async (expenseId) => {
    setSaving(true);

    try {
      await axios.delete(
        `${API_BASE_URL}/expenses/${expenseId}`,
        axiosConfig
      );

      setConfirmAction(null);
      await loadExpenses();

      showToast(
        "success",
        "Expense deleted successfully."
      );
    } catch (error) {
      console.error("Delete expense error:", error);

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
    const name = categoryName.trim();

    if (!name) {
      showToast("error", "Enter category name.");
      return;
    }

    if (name.length < 2) {
      showToast(
        "error",
        "Category name must contain at least 2 characters."
      );
      return;
    }

    const duplicate = categories.some(
      (category) =>
        String(category.category_name || "")
          .trim()
          .toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      showToast(
        "error",
        "Category already exists."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/expenses/categories`,
        {
          category_name: name,
        },
        axiosConfig
      );

      if (response?.data?.success === false) {
        throw new Error(
          response?.data?.error ||
            "Could not add category."
        );
      }

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
  const deleteCategory = async (categoryId) => {
    const category = categories.find(
      (item) =>
        String(item.id) === String(categoryId)
    );

    if (!category) {
      setConfirmAction(null);
      showToast(
        "error",
        "Category not found."
      );
      return;
    }

    if (category.is_default) {
      setConfirmAction(null);
      showToast(
        "error",
        "Default categories cannot be deleted."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/expenses/categories/${categoryId}`,
        axiosConfig
      );

      if (response?.data?.success === false) {
        throw new Error(
          response?.data?.error ||
            "Could not delete category."
        );
      }

      setConfirmAction(null);
      setCategoryName("");
      await loadCategories();

      // Refresh the expense list as well because category counts/filters can change.
      await loadExpenses();

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
          error.message ||
          "Category is already being used or cannot be deleted."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * WEEK FILTER
   * Week 1: 1-7
   * Week 2: 8-14
   * Week 3: 15-21
   * Week 4: 22-end of selected month
   */
  const getWeekRange = useCallback(
    (week) => {
      if (week === "all") return null;

      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      const lastDay = new Date(
        year,
        month + 1,
        0
      ).getDate();

      const ranges = {
        week1: [1, 7],
        week2: [8, 14],
        week3: [15, 21],
        week4: [22, lastDay],
      };

      const range = ranges[week];
      if (!range) return null;

      return {
        start: new Date(
          year,
          month,
          range[0],
          0,
          0,
          0,
          0
        ),
        end: new Date(
          year,
          month,
          range[1],
          23,
          59,
          59,
          999
        ),
      };
    },
    [selectedMonth]
  );

  const matchesWeekFilter = useCallback(
    (expense) => {
      if (weekFilter === "all") return true;

      const range =
        getWeekRange(weekFilter);

      if (!range) return true;

      const value =
        String(
          expense.expense_date || ""
        ).slice(0, 10);

      const date = new Date(
        `${value}T12:00:00`
      );

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return (
        date >= range.start &&
        date <= range.end
      );
    },
    [getWeekRange, weekFilter]
  );

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

        const matchesWeek =
          matchesWeekFilter(expense);

        const matchesCategory =
          categoryFilter === "all" ||
          String(
            expense.category_id
          ) === String(
            categoryFilter
          );

        return (
          matchesSearch &&
          matchesWeek &&
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

  filteredExpenses.forEach(
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


        .expense-category-info {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .expense-category-info > div {
          min-width: 0;
        }

        .expense-category-info strong,
        .expense-category-info small {
          display: block;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .expense-category-info strong {
          color: #172033;
          font-size: 10px;
          line-height: 1.25;
        }

        .expense-category-info small {
          margin-top: 2px;
          color: #8a94a6;
          font-size: 7px;
          line-height: 1.2;
        }

        .expense-category-dot {
          width: 29px;
          height: 29px;
          flex: 0 0 29px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #1769aa;
          background: #eaf3ff;
        }

        .expense-category-default {
          flex: 0 0 auto;
          color: #8a94a6;
          font-size: 7px;
          font-weight: 850;
        }


        .expense-modal-header > div {
          min-width: 0;
        }

        .expense-modal-subtitle {
          margin: 3px 0 0;
          color: #8a94a6;
          font-size: 8px;
          line-height: 1.2;
          font-weight: 650;
        }

        .expense-category-info {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .expense-category-info > div {
          min-width: 0;
        }

        .expense-category-info strong,
        .expense-category-info small {
          display: block;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .expense-category-info strong {
          color: #172033;
          font-size: 10px;
          line-height: 1.25;
        }

        .expense-category-info small {
          margin-top: 2px;
          color: #8a94a6;
          font-size: 7px;
          line-height: 1.2;
        }

        .expense-category-dot {
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #1769aa;
          background: #eaf3ff;
        }

        .expense-category-default {
          flex: 0 0 auto;
          color: #8a94a6;
          font-size: 7px;
          font-weight: 850;
        }

        .expense-category-empty {
          min-height: 130px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 18px;
          border: 1px dashed #d8e0eb;
          border-radius: 11px;
          background: #f8fafc;
          color: #8a94a6;
          text-align: center;
        }

        .expense-category-empty strong {
          color: #596579;
          font-size: 11px;
        }

        .expense-category-empty span {
          max-width: 280px;
          font-size: 8px;
          line-height: 1.4;
        }

        /* CENTER CONFIRMATION */
        .expense-confirm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 6000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          background: rgba(7, 19, 38, 0.62);
          backdrop-filter: blur(6px);
        }

        .expense-confirm {
          width: min(390px, calc(100vw - 26px));
          padding: 18px;
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 30px 90px rgba(7, 19, 38, 0.30);
          text-align: center;
          animation: expenseModalIn 0.18s ease;
        }

        .expense-confirm-icon {
          width: 46px;
          height: 46px;
          margin: 0 auto 9px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          color: #d04444;
          background: #fff0f0;
        }

        .expense-confirm h2 {
          margin: 0;
          color: #172033;
          font-size: 16px;
          font-weight: 900;
          line-height: 1.2;
        }

        .expense-confirm p {
          margin: 6px auto 0;
          max-width: 330px;
          color: #697386;
          font-size: 10px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .expense-confirm-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
          margin-top: 14px;
        }

        .expense-confirm-actions button {
          height: 38px;
          border: 0;
          border-radius: 9px;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .expense-confirm-cancel {
          color: #475467;
          background: #f1f4f8;
        }

        .expense-confirm-delete {
          color: #fff;
          background: linear-gradient(135deg, #d04444, #e05252);
          box-shadow: 0 8px 20px rgba(208, 68, 68, 0.18);
        }

        .expense-confirm-actions button:disabled {
          opacity: 0.55;
          cursor: wait;
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


        /* FINAL RESPONSIVE EXPENSE POLISH */
        .expense-month {
          min-width: 0;
          max-width: 100%;
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.25;
          text-align: center;
        }

        .expense-category-summary-card,
        .expense-row,
        .expense-stat,
        .expense-panel,
        .expense-field {
          min-width: 0;
        }

        .expense-category-summary-card span,
        .expense-row-main strong,
        .expense-row-main span,
        .expense-row-main small,
        .expense-row-amount,
        .expense-stat-text small,
        .expense-stat-text strong,
        .expense-stat-text span {
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .expense-category-summary-card {
          min-width: 155px;
          min-height: 82px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 4px;
          border-radius: 12px;
          overflow: visible;
        }

        .expense-category-summary-card span {
          display: block;
          color: #172033;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.25;
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .expense-category-summary-card strong {
          display: block;
          margin-top: 3px;
          color: #172033;
          font-size: 20px;
          font-weight: 950;
          line-height: 1.15;
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .expense-filter-context {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 8px 0 9px;
        }

        .expense-filter-context span {
          max-width: 100%;
          padding: 5px 8px;
          border: 1px solid #e4e9f0;
          border-radius: 999px;
          background: #f8fafc;
          color: #596579;
          font-size: 8px;
          font-weight: 800;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        @media (max-width: 900px) {
          .expense-filters {
            grid-template-columns: 1fr 1fr;
          }

          .expense-search {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 600px) {
          .expense-page {
            padding: 8px 8px calc(
              46px + env(safe-area-inset-bottom)
            );
          }

          .expense-brand h1 {
            font-size: 19px;
          }

          .expense-brand p {
            font-size: 9px;
          }

          .expense-month {
            min-width: 0;
            font-size: 10px;
          }

          .expense-filters {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .expense-search,
          .expense-filter {
            height: 38px;
            font-size: 10px;
          }

          .expense-search input {
            font-size: 10px;
          }

          .expense-filter-context {
            gap: 5px;
            margin: 7px 0 8px;
          }

          .expense-filter-context span {
            font-size: 8px;
          }

          .expense-stats {
            gap: 7px;
          }

          .expense-stat {
            padding: 10px;
            border-radius: 11px;
          }

          .expense-stat-text small {
            font-size: 7px;
          }

          .expense-stat-text strong {
            font-size: 14px;
            line-height: 1.2;
          }

          .expense-stat-text span {
            font-size: 7px;
          }

          .expense-panel-title h2 {
            font-size: 12px;
          }

          .expense-panel-title p {
            font-size: 8px;
            line-height: 1.35;
          }

          .expense-category-summary {
            gap: 7px;
          }

          .expense-category-summary-card {
            min-width: 150px;
            min-height: 86px;
            padding: 12px;
            gap: 4px;
          }

          .expense-category-summary-card span {
            font-size: 12px;
            line-height: 1.3;
          }

          .expense-category-summary-card strong {
            margin-top: 4px;
            font-size: 19px;
            line-height: 1.15;
          }

          .expense-row {
            align-items: flex-start;
            gap: 8px;
            padding: 10px;
          }

          .expense-row-main strong {
            font-size: 12px;
            line-height: 1.3;
          }

          .expense-row-main span,
          .expense-row-main small {
            font-size: 8px;
            line-height: 1.4;
          }

          .expense-row-amount {
            font-size: 14px;
          }

          .expense-row-action {
            width: 31px;
            height: 31px;
          }

          .expense-modal-backdrop,
          .expense-confirm-backdrop {
            position: fixed;
            inset: 0;
            align-items: center;
            justify-content: center;
            padding: 12px;
          }

          .expense-modal {
            width: min(
              100%,
              470px
            );
            max-height: calc(100dvh - 24px);
          }

          .expense-confirm {
            width: min(
              100%,
              390px
            );
          }

          .expense-toast-container {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: calc(100vw - 24px);
            max-width: 360px;
          }
        }

        @media (max-width: 390px) {
          .expense-category-summary-card {
            min-width: 144px;
            min-height: 82px;
            padding: 11px;
          }

          .expense-category-summary-card span {
            font-size: 11px;
            line-height: 1.3;
          }

          .expense-category-summary-card strong {
            font-size: 18px;
            line-height: 1.15;
          }

          .expense-row-main strong {
            font-size: 11px;
          }

          .expense-row-amount {
            font-size: 13px;
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
            width: 100%;
            min-height: 100%;
            padding: 7px 7px calc(42px + env(safe-area-inset-bottom));
            overflow-x: hidden;
          }

          .expense-container {
            width: 100%;
            min-width: 0;
          }

          .expense-header {
            position: relative;
            top: auto;
            z-index: 2;
            flex-direction: column;
            align-items: stretch;
            gap: 9px;
            padding: 10px;
            border-radius: 14px;
          }

          .expense-brand {
            gap: 8px;
          }

          .expense-brand-icon {
            width: 34px;
            height: 34px;
            flex-basis: 34px;
            border-radius: 9px;
          }

          .expense-brand-icon svg {
            width: 17px;
            height: 17px;
          }

          .expense-brand h1 {
            font-size: 17px;
            line-height: 1.15;
          }

          .expense-brand p {
            margin-top: 2px;
            font-size: 7px;
          }

          .expense-controls {
            display: grid;
            grid-template-columns: 31px minmax(0, 1fr) 31px;
            gap: 4px;
            width: 100%;
            align-items: center;
          }

          .expense-icon-btn {
            width: 31px;
            height: 31px;
            border-radius: 8px;
          }

          .expense-icon-btn svg {
            width: 14px;
            height: 14px;
          }

          .expense-month {
            min-width: 0;
            height: 31px;
            padding: 0 6px;
            border-radius: 8px;
            font-size: 9px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .expense-month-input {
            grid-column: 1 / span 2;
            width: 100%;
            height: 31px;
            min-width: 0;
            border-radius: 8px;
            font-size: 9px;
          }

          .expense-current {
            display: none;
          }

          .expense-controls .expense-icon-btn:nth-of-type(3) {
            grid-column: 3;
            grid-row: 2;
          }

          .expense-add {
            grid-column: 1 / -1;
            grid-row: 3;
            width: 100%;
            min-height: 34px;
            height: auto;
            padding: 8px 12px;
            border-radius: 8px;
            justify-content: center;
            font-size: 10px;
            line-height: 1.2;
            white-space: nowrap;
          }

          .expense-add span {
            display: inline;
          }

          .expense-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 5px;
            margin-bottom: 6px;
          }

          .expense-stat {
            min-width: 0;
            padding: 8px;
            gap: 6px;
            border-radius: 10px;
          }

          .expense-stat-icon {
            width: 27px;
            height: 27px;
            flex-basis: 27px;
            border-radius: 7px;
          }

          .expense-stat-icon svg {
            width: 13px;
            height: 13px;
          }

          .expense-stat-text {
            min-width: 0;
          }

          .expense-stat-text small {
            font-size: 6px;
            line-height: 1.2;
          }

          .expense-stat-text strong {
            margin-top: 3px;
            font-size: 11px;
            line-height: 1.2;
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .expense-stat-text span {
            margin-top: 2px;
            font-size: 6px;
            line-height: 1.2;
          }

          .expense-panel {
            padding: 9px;
            margin-bottom: 6px;
            border-radius: 11px;
          }

          .expense-panel-header {
            align-items: flex-start;
            gap: 6px;
            margin-bottom: 8px;
          }

          .expense-panel-title {
            min-width: 0;
          }

          .expense-panel-title h2 {
            font-size: 10px;
            line-height: 1.25;
          }

          .expense-panel-title p {
            margin-top: 2px;
            font-size: 6.5px;
            line-height: 1.3;
          }

          .expense-category-btn {
            flex: 0 0 auto;
            min-height: 30px;
            padding: 6px 8px;
            border-radius: 7px;
            font-size: 7px;
            white-space: nowrap;
          }

          .expense-category-btn svg {
            width: 12px;
            height: 12px;
          }

          .expense-filters {
            grid-template-columns: 1fr;
            gap: 5px;
          }

          .expense-search,
          .expense-filter {
            width: 100%;
            min-width: 0;
            height: 33px;
            border-radius: 8px;
            font-size: 8px;
          }

          .expense-search {
            padding: 0 8px;
          }

          .expense-search input,
          .expense-filter {
            font-size: 8px;
          }

          .expense-week-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 5px;
          }

          .expense-week {
            min-width: 0;
            padding: 7px;
            border-radius: 8px;
          }

          .expense-week span {
            font-size: 6px;
            line-height: 1.2;
          }

          .expense-week strong {
            margin-top: 4px;
            font-size: 9px;
            line-height: 1.2;
            overflow-wrap: anywhere;
          }

          .expense-category-summary {
            gap: 5px;
            padding-bottom: 2px;
          }

          .expense-category-summary-card {
            min-width: 108px;
            max-width: 150px;
            padding: 7px;
            border-radius: 8px;
          }

          .expense-category-summary-card span {
            font-size: 6px;
            overflow-wrap: anywhere;
            white-space: normal;
            line-height: 1.2;
          }

          .expense-category-summary-card strong {
            margin-top: 3px;
            font-size: 8px;
          }

          .expense-list {
            width: 100%;
            gap: 5px;
            padding-bottom: 6px;
          }

          .expense-row {
            width: 100%;
            display: grid;
            grid-template-columns: 28px minmax(0, 1fr) auto;
            gap: 6px;
            padding: 8px;
            border-radius: 9px;
            align-items: start;
          }

          .expense-row-icon {
            width: 28px;
            height: 28px;
            flex-basis: 28px;
            border-radius: 7px;
          }

          .expense-row-icon svg {
            width: 13px;
            height: 13px;
          }

          .expense-row-main {
            min-width: 0;
          }

          .expense-row-main strong {
            font-size: 8px;
            line-height: 1.25;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .expense-row-main span {
            margin-top: 2px;
            font-size: 6px;
            line-height: 1.25;
          }

          .expense-row-main small {
            margin-top: 2px;
            font-size: 6px;
            line-height: 1.3;
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .expense-row-amount {
            grid-column: 2;
            grid-row: 2;
            margin-top: 2px;
            font-size: 8px;
            line-height: 1.2;
            white-space: normal;
            overflow-wrap: anywhere;
          }

          .expense-row-actions {
            grid-column: 3;
            grid-row: 1 / span 2;
            flex-direction: column;
            gap: 3px;
          }

          .expense-row-action {
            width: 26px;
            height: 26px;
            border-radius: 7px;
          }

          .expense-row-action svg {
            width: 12px;
            height: 12px;
          }

          .expense-empty {
            min-height: 210px;
            padding: 25px 12px;
            border-radius: 11px;
            text-align: center;
          }

          .expense-empty strong {
            font-size: 10px;
          }

          .expense-empty span {
            font-size: 7px;
            line-height: 1.4;
          }

          .expense-modal-backdrop {
            padding: 9px;
            align-items: center;
            overflow: auto;
          }

          .expense-modal {
            width: min(100%, 470px);
            max-width: 100%;
            max-height: calc(100dvh - 18px);
            border-radius: 15px;
          }

          .expense-category-add {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 5px;
          }

          .expense-category-add input {
            min-width: 0;
            height: 34px;
            padding: 0 8px;
            border-radius: 8px;
            font-size: 8px;
          }

          .expense-category-add button {
            min-width: 66px;
            height: 34px;
            padding: 0 8px;
            border-radius: 8px;
            font-size: 8px;
            white-space: nowrap;
          }

          .expense-category-item {
            min-width: 0;
            gap: 7px;
            padding: 8px;
            border-radius: 9px;
          }

          .expense-category-info {
            min-width: 0;
            gap: 6px;
          }

          .expense-category-dot {
            width: 27px;
            height: 27px;
            flex-basis: 27px;
            border-radius: 7px;
          }

          .expense-category-info strong {
            font-size: 8px;
          }

          .expense-category-info small {
            font-size: 6px;
          }

          .expense-category-delete {
            width: 27px;
            height: 27px;
            flex: 0 0 27px;
            border-radius: 7px;
          }

          .expense-category-list {
            gap: 5px;
            margin-top: 9px;
          }

          .expense-category-item {
            min-width: 0;
            gap: 7px;
            padding: 8px;
            border-radius: 9px;
          }

          .expense-category-info {
            gap: 6px;
          }

          .expense-category-info strong {
            font-size: 8px;
          }

          .expense-category-info small {
            font-size: 6px;
          }

          .expense-category-dot {
            width: 27px;
            height: 27px;
            flex-basis: 27px;
            border-radius: 7px;
          }

          .expense-category-delete {
            width: 27px;
            height: 27px;
            flex: 0 0 27px;
            border-radius: 7px;
          }

          .expense-category-default {
            font-size: 6px;
          }

          .expense-modal-subtitle {
            font-size: 6px;
          }

          .expense-modal-header {
            padding: 11px;
          }

          .expense-modal-header h2 {
            font-size: 12px;
            line-height: 1.2;
          }

          .expense-modal-close {
            width: 28px;
            height: 28px;
            border-radius: 7px;
          }

          .expense-modal-body {
            padding: 11px;
          }

          .expense-form {
            gap: 8px;
          }

          .expense-form label {
            gap: 4px;
            font-size: 7px;
          }

          .expense-form input,
          .expense-form select,
          .expense-form textarea {
            min-width: 0;
            font-size: 9px;
            border-radius: 8px;
            padding: 8px;
          }

          .expense-form input,
          .expense-form select {
            height: 35px;
          }

          .expense-form textarea {
            min-height: 68px;
          }

          .expense-submit {
            height: 36px;
            margin-top: 8px;
            border-radius: 8px;
            font-size: 9px;
          }

          .expense-category-add {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 5px;
          }

          .expense-category-add input {
            min-width: 0;
            height: 35px;
            border-radius: 8px;
            font-size: 9px;
          }

          .expense-category-add button {
            height: 35px;
            padding: 0 10px;
            border-radius: 8px;
            font-size: 9px;
            white-space: nowrap;
          }

          .expense-category-item {
            min-width: 0;
            gap: 7px;
            padding: 8px;
            border-radius: 8px;
            font-size: 8px;
          }

          .expense-category-item span:first-child {
            min-width: 0;
            overflow-wrap: anywhere;
            word-break: break-word;
            line-height: 1.3;
          }

          .expense-category-delete {
            width: 27px;
            height: 27px;
            flex: 0 0 27px;
            border-radius: 7px;
          }

          .expense-toast-container {
            width: min(340px, calc(100vw - 20px));
          }

          .expense-toast {
            padding: 10px;
            border-radius: 11px;
            gap: 7px;
          }

          .expense-toast-title {
            font-size: 10px;
          }

          .expense-toast-message {
            font-size: 8px;
          }

          .expense-toast-close {
            width: 25px;
            height: 25px;
            flex: 0 0 25px;
          }

          .expense-confirm {
            width: min(340px, calc(100vw - 22px));
            padding: 15px;
            border-radius: 15px;
          }

          .expense-confirm-icon {
            width: 40px;
            height: 40px;
            border-radius: 11px;
          }

          .expense-confirm h2 {
            font-size: 13px;
            line-height: 1.2;
          }

          .expense-confirm p {
            font-size: 8px;
            line-height: 1.5;
          }

          .expense-confirm-actions button {
            height: 34px;
            font-size: 8px;
            border-radius: 8px;
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

        /* FINAL CATEGORY TOTALS READABILITY */
        .expense-category-summary-card span {
          color: #172033 !important;
          font-size: 13px !important;
          font-weight: 900 !important;
          line-height: 1.3 !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        .expense-category-summary-card strong {
          color: #172033 !important;
          font-size: 20px !important;
          font-weight: 950 !important;
          line-height: 1.15 !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        @media (max-width: 600px) {
          .expense-category-summary-card span {
            font-size: 12px !important;
          }

          .expense-category-summary-card strong {
            font-size: 19px !important;
          }
        }

        @media (max-width: 390px) {
          .expense-category-summary-card span {
            font-size: 11px !important;
          }

          .expense-category-summary-card strong {
            font-size: 18px !important;
          }
        }

        @media (max-width: 340px) {
          .expense-category-summary-card span {
            font-size: 10px !important;
          }

          .expense-category-summary-card strong {
            font-size: 17px !important;
          }
        }


        /* FINAL REQUESTED UI:
           Category name = 22-25px
           Amount = 16-18px
           Dialogs/alerts = centered in current viewport
        */

        .expense-category-summary-card {
          min-width: 155px !important;
          min-height: 88px !important;
          padding: 12px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          align-items: flex-start !important;
          gap: 4px !important;
          overflow: visible !important;
        }

        .expense-category-summary-card span {
          display: block !important;
          width: 100% !important;
          color: #172033 !important;
          font-size: 23px !important;
          font-weight: 900 !important;
          line-height: 1.15 !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        .expense-category-summary-card strong {
          display: block !important;
          width: 100% !important;
          margin-top: 3px !important;
          color: #172033 !important;
          font-size: 17px !important;
          font-weight: 900 !important;
          line-height: 1.15 !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        /* Keep the original page position when an overlay opens.
           Body scrolling is disabled only while the overlay is visible. */
        .expense-modal-backdrop,
        .expense-confirm-backdrop,
        .expense-toast-container {
          position: fixed !important;
          inset: 0 !important;
        }

        .expense-modal-backdrop,
        .expense-confirm-backdrop {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 14px !important;
        }

        .expense-modal {
          margin: 0 auto !important;
          width: min(470px, calc(100vw - 28px)) !important;
          max-height: min(90vh, calc(100dvh - 28px)) !important;
          overflow: auto !important;
        }

        .expense-confirm {
          margin: 0 auto !important;
          width: min(390px, calc(100vw - 28px)) !important;
          max-height: min(80vh, calc(100dvh - 28px)) !important;
          overflow: auto !important;
        }

        .expense-toast-container {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 14px !important;
          transform: none !important;
          pointer-events: none !important;
        }

        .expense-toast {
          width: min(360px, calc(100vw - 28px)) !important;
          pointer-events: auto !important;
        }

        @media (max-width: 700px) {
          .expense-category-summary-card {
            min-width: 155px !important;
            min-height: 94px !important;
            padding: 12px !important;
          }

          .expense-category-summary-card span {
            font-size: 22px !important;
            line-height: 1.15 !important;
          }

          .expense-category-summary-card strong {
            font-size: 18px !important;
            line-height: 1.15 !important;
          }

          .expense-modal-backdrop,
          .expense-confirm-backdrop {
            padding: 10px !important;
          }

          .expense-modal {
            width: min(470px, calc(100vw - 20px)) !important;
            max-height: calc(100dvh - 20px) !important;
            border-radius: 17px !important;
          }

          .expense-confirm {
            width: min(390px, calc(100vw - 20px)) !important;
            max-height: calc(100dvh - 20px) !important;
            border-radius: 16px !important;
          }

          .expense-toast-container {
            padding: 10px !important;
          }

          .expense-toast {
            width: min(360px, calc(100vw - 20px)) !important;
          }
        }

        @media (max-width: 390px) {
          .expense-category-summary-card {
            min-width: 145px !important;
            min-height: 90px !important;
          }

          .expense-category-summary-card span {
            font-size: 22px !important;
          }

          .expense-category-summary-card strong {
            font-size: 17px !important;
          }
        }


        /* TRANSACTIONS ONLY WHEN CATEGORY IS SELECTED */
        .expense-selected-category-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          margin-bottom: 7px;
          border: 1px solid #e3e9f1;
          border-radius: 12px;
          background: linear-gradient(135deg,#ffffff,#f7f9fc);
        }

        .expense-selected-category-header span,
        .expense-selected-category-header strong {
          display: block;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .expense-selected-category-header span {
          color: #8a94a6;
          font-size: 8px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: .06em;
        }

        .expense-selected-category-header strong {
          margin-top: 3px;
          color: #172033;
          font-size: 17px;
          font-weight: 900;
          line-height: 1.2;
        }

        .expense-selected-category-header b {
          flex: 0 0 auto;
          padding: 5px 8px;
          border-radius: 999px;
          background: #eaf3ff;
          color: #1769aa;
          font-size: 8px;
          font-weight: 900;
          white-space: nowrap;
        }

        @media (max-width: 600px) {
          .expense-selected-category-header {
            align-items: flex-start;
            padding: 9px 10px;
          }

          .expense-selected-category-header strong {
            font-size: 16px;
          }

          .expense-selected-category-header b {
            font-size: 7px;
          }
        }

        @media (max-width: 360px) {
          .expense-selected-category-header {
            flex-direction: column;
            gap: 6px;
          }

          .expense-selected-category-header b {
            white-space: normal;
          }
        }


        /* ============================================================
           FINAL CARD / TOTAL POLISH
        ============================================================ */

        /* Four top cards: slightly larger, more breathing room,
           clear separation and stronger hierarchy. */
        .expense-stats {
          gap: 11px !important;
        }

        .expense-stat {
          min-height: 92px !important;
          padding: 15px !important;
          gap: 11px !important;
          border-radius: 16px !important;
        }

        .expense-stat-icon {
          width: 42px !important;
          height: 42px !important;
          flex-basis: 42px !important;
          border-radius: 12px !important;
        }

        .expense-stat-text {
          min-width: 0 !important;
          flex: 1 1 auto !important;
        }

        .expense-stat-text small {
          font-size: 10px !important;
          font-weight: 900 !important;
          line-height: 1.25 !important;
        }

        .expense-stat-text strong {
          margin-top: 5px !important;
          font-size: 19px !important;
          line-height: 1.2 !important;
          font-weight: 950 !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        .expense-stat-text span {
          margin-top: 3px !important;
          font-size: 9px !important;
          line-height: 1.3 !important;
        }

        /* Category total cards: larger category title and red total amount. */
        .expense-category-summary {
          display: grid !important;
          grid-template-columns: repeat(
            auto-fit,
            minmax(155px, 1fr)
          ) !important;
          gap: 10px !important;
          overflow: visible !important;
          padding-bottom: 0 !important;
        }

        .expense-category-summary-card {
          min-width: 0 !important;
          min-height: 94px !important;
          padding: 13px !important;
          border-radius: 13px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          align-items: flex-start !important;
          gap: 5px !important;
          overflow: visible !important;
          background: linear-gradient(
            180deg,
            #fbfdff 0%,
            #f5f8fc 100%
          ) !important;
          border: 1px solid #dfe6ef !important;
          box-shadow: 0 5px 16px rgba(
            20,
            35,
            60,
            0.06
          ) !important;
        }

        .expense-category-summary-card span {
          width: 100% !important;
          color: #172033 !important;
          font-size: 22px !important;
          font-weight: 950 !important;
          line-height: 1.12 !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        .expense-category-summary-card strong {
          width: 100% !important;
          margin-top: 2px !important;
          color: #d04444 !important;
          font-size: 18px !important;
          font-weight: 950 !important;
          line-height: 1.15 !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        /* Extra spacing for the transaction area. */
        .expense-list {
          gap: 8px !important;
        }

        @media (max-width: 900px) {
          .expense-stats {
            gap: 9px !important;
          }

          .expense-stat {
            min-height: 88px !important;
            padding: 13px !important;
          }

          .expense-stat-text strong {
            font-size: 17px !important;
          }

          .expense-category-summary {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
            gap: 9px !important;
          }
        }

        @media (max-width: 600px) {
          .expense-stats {
            gap: 8px !important;
          }

          .expense-stat {
            min-height: 86px !important;
            padding: 11px !important;
            gap: 8px !important;
            border-radius: 12px !important;
          }

          .expense-stat-icon {
            width: 34px !important;
            height: 34px !important;
            flex-basis: 34px !important;
            border-radius: 9px !important;
          }

          .expense-stat-text small {
            font-size: 8.5px !important;
          }

          .expense-stat-text strong {
            font-size: 15px !important;
            line-height: 1.2 !important;
          }

          .expense-stat-text span {
            font-size: 8px !important;
          }

          .expense-category-summary {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
            gap: 8px !important;
          }

          .expense-category-summary-card {
            min-height: 88px !important;
            padding: 11px !important;
            border-radius: 11px !important;
          }

          .expense-category-summary-card span {
            font-size: 19px !important;
          }

          .expense-category-summary-card strong {
            font-size: 17px !important;
          }
        }

        @media (max-width: 390px) {
          .expense-stats {
            gap: 7px !important;
          }

          .expense-stat {
            min-height: 82px !important;
            padding: 10px !important;
          }

          .expense-stat-text small {
            font-size: 8px !important;
          }

          .expense-stat-text strong {
            font-size: 14px !important;
          }

          .expense-stat-text span {
            font-size: 7.5px !important;
          }

          .expense-category-summary {
            grid-template-columns: 1fr 1fr !important;
            gap: 7px !important;
          }

          .expense-category-summary-card {
            min-height: 84px !important;
            padding: 10px !important;
          }

          .expense-category-summary-card span {
            font-size: 17px !important;
          }

          .expense-category-summary-card strong {
            font-size: 16px !important;
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
                onClick={openAddExpense}
                disabled={saving || refreshing}
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
                  Expenses for the selected month,
                  week and category filters
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
                value={weekFilter}
                onChange={(e) =>
                  setWeekFilter(
                    e.target.value
                  )
                }
              >
                <option value="all">
                  All Weeks
                </option>
                <option value="week1">
                  Week 1 · 1-7
                </option>
                <option value="week2">
                  Week 2 · 8-14
                </option>
                <option value="week3">
                  Week 3 · 15-21
                </option>
                <option value="week4">
                  Week 4 · 22-End
                </option>
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

          <div className="expense-filter-context">
            <span>
              Month: {selectedMonth.toLocaleDateString(
                "en-IN",
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </span>

            <span>
              Week:{" "}
              {weekFilter === "all"
                ? "All Weeks"
                : weekFilter === "week1"
                ? "Week 1 · 1-7"
                : weekFilter === "week2"
                ? "Week 2 · 8-14"
                : weekFilter === "week3"
                ? "Week 3 · 15-21"
                : "Week 4 · 22-End"}
            </span>

            <span>
              Category:{" "}
              {categoryFilter === "all"
                ? "All Categories"
                : categories.find(
                    (category) =>
                      String(
                        category.id
                      ) ===
                      String(
                        categoryFilter
                      )
                  )?.category_name ||
                  "Selected Category"}
            </span>
          </div>

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

          {/* EXPENSE LIST
              Hidden until the user selects a category.
              All matching entries from that category are shown together. */}
          {categoryFilter !== "all" && (
            <section className="expense-list">
              {loading && expenses.length === 0 ? (
                <div className="expense-empty">
                  <RefreshCw size={28} className="expense-spin" />
                  <strong>Loading expenses...</strong>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="expense-empty">
                  <Receipt size={38} />
                  <strong>No expenses found</strong>
                  <span>
                    No entries match the selected category and active filters.
                  </span>
                </div>
              ) : (
                <>
                  <div className="expense-selected-category-header">
                    <div>
                      <span>Selected Category</span>
                      <strong>
                        {categories.find(
                          (category) =>
                            String(category.id) ===
                            String(categoryFilter)
                        )?.category_name || "Selected Category"}
                      </strong>
                    </div>
                    <b>
                      {filteredExpenses.length}{" "}
                      {filteredExpenses.length === 1 ? "entry" : "entries"}
                    </b>
                  </div>

                  {filteredExpenses.map((expense) => (
                    <article className="expense-row" key={expense.id}>
                      <div className="expense-row-icon">
                        <Receipt size={17} />
                      </div>

                      <div className="expense-row-main">
                        <strong>
                          {expense.category_name || "Expense"}
                        </strong>

                        <span>
                          {new Date(
                            expense.expense_date
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>

                        {expense.notes ? (
                          <small>{expense.notes}</small>
                        ) : null}
                      </div>

                      <div className="expense-row-amount">
                        {formatMoney(expense.amount)}
                      </div>

                      <div className="expense-row-actions">
                        <button
                          type="button"
                          className="expense-row-action edit"
                          onClick={() => openEditExpense(expense)}
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          className="expense-row-action delete"
                          onClick={() =>
                            setConfirmAction({
                              type: "expense",
                              id: expense.id,
                              title: "Delete Expense?",
                              message:
                                "This expense record will be permanently deleted. This action cannot be undone.",
                            })
                          }
                          title="Delete"
                          disabled={saving}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </>
              )}
            </section>
          )}
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
                onClick={() => {
                  setCategoryModal(false);
                  setCategoryName("");
                }}
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
                {categories.length === 0 ? (
                  <div className="expense-category-empty">
                    <Tag size={20} />
                    <strong>No categories available</strong>
                    <span>
                      Add a new category above and it will appear here.
                    </span>
                  </div>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="expense-category-item"
                    >
                      <div className="expense-category-info">
                        <span className="expense-category-dot">
                          <Tag size={13} />
                        </span>

                        <div>
                          <strong>
                            {category.category_name}
                          </strong>
                          <small>
                            {category.is_default
                              ? "Default category"
                              : "User category"}
                          </small>
                        </div>
                      </div>

                      {!category.is_default ? (
                        <button
                          type="button"
                          className="expense-category-delete"
                          onClick={() =>
                            setConfirmAction({
                              type: "category",
                              id: category.id,
                              title: "Delete Category?",
                              message:
                                "This user-created category will be permanently deleted. It can only be removed when no expense is using it.",
                            })
                          }
                          disabled={saving}
                          title="Delete category"
                          aria-label={`Delete ${category.category_name}`}
                        >
                          {saving ? (
                            <RefreshCw
                              size={13}
                              className="expense-spin"
                            />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      ) : (
                        <span className="expense-category-default">
                          Default
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* CENTER DELETE CONFIRMATION */}
      {confirmAction ? (
        <div
          className="expense-confirm-backdrop"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              setConfirmAction(null);
            }
          }}
        >
          <div
            className="expense-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="expense-confirm-title"
          >
            <div className="expense-confirm-icon">
              <Trash2 size={20} />
            </div>
            <h2 id="expense-confirm-title">
              {confirmAction.title}
            </h2>
            <p>{confirmAction.message}</p>

            <div className="expense-confirm-actions">
              <button
                type="button"
                className="expense-confirm-cancel"
                onClick={() => setConfirmAction(null)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="expense-confirm-delete"
                onClick={() =>
                  confirmAction.type === "expense"
                    ? deleteExpense(confirmAction.id)
                    : deleteCategory(confirmAction.id)
                }
                disabled={saving}
              >
                {saving ? (
                  <RefreshCw
                    size={14}
                    className="expense-spin"
                  />
                ) : (
                  <Trash2 size={14} />
                )}
                {saving ? "Deleting..." : "Delete"}
              </button>
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