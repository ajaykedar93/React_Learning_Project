import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Edit3,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UserRound,
  WalletCards,
  X,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL = (import.meta.env?.VITE_API_URL || "https://express-project-learning-new.onrender.com/api").replace(/\/$/, "");

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const dateInput = (value = new Date()) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const monthParam = (date) =>
  `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}`;

const monthTitle = (date) =>
  date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const safeNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const editableNumber = (value) => {
  if (value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? value : "";
};

const startOfDay = (value = new Date()) => {
  const d = new Date(value);
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  );
};

const daysBetween = (fromDate, toDate) => {
  if (!fromDate || !toDate) return null;

  const from = startOfDay(fromDate);
  const to = startOfDay(toDate);

  return Math.round(
    (to.getTime() - from.getTime()) /
      86400000
  );
};

const dayText = (days) => {
  if (days === null || days === undefined) {
    return "—";
  }

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} remaining`;
  }

  if (days === 0) {
    return "Due today";
  }

  const overdue = Math.abs(days);
  return `${overdue} day${overdue === 1 ? "" : "s"} overdue`;
};

export default function LoanBorrow() {
  const [borrows, setBorrows] = useState([]);
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState("borrow");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("date-desc");

  const [modal, setModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const [toast, setToast] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const [form, setForm] = useState({
    person_name: "",
    borrow_amount: "",
    take_date: dateInput(),
    return_date: "",
    bank_name: "",
    total_loan_amount: "",
    emi_amount: "",
    total_emis: "",
    next_emi_date: "",
    notes: "",
    payment_amount: "",
    payment_date: dateInput(),
    payment_notes: "",
  });

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    "";

  const config = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),
    [token]
  );

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    window.clearTimeout(window.__loanToastTimer);
    window.__loanToastTimer = window.setTimeout(
      () => setToast(null),
      2500
    );
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const month = encodeURIComponent(monthParam(selectedMonth));

      const [borrowRes, loanRes, totalsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/loan-borrow/borrow`, config),
        axios.get(`${API_BASE_URL}/loan-borrow/loan`, config),
        axios.get(`${API_BASE_URL}/loan-borrow/totals?month=${month}`, config),
      ]);

      if (borrowRes.data?.success) {
        setBorrows(borrowRes.data.data || []);
      }

      if (loanRes.data?.success) {
        setLoans(loanRes.data.data || []);
      }

      if (totalsRes.data?.success) {
        setSummary(totalsRes.data.data || {});
      }
    } catch (error) {
      console.error("Loan/Borrow load error:", error);
      notify(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Internal server error. Check the Loan/Borrow API."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, config, notify]);

  useEffect(() => {
    window.__loanBusyAction = busyAction || "";
    return () => {
      window.__loanBusyAction = "";
    };
  }, [busyAction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const resetForm = () => {
    setForm({
      person_name: "",
      borrow_amount: "",
      take_date: dateInput(),
      return_date: "",
      bank_name: "",
      total_loan_amount: "",
      emi_amount: "",
      total_emis: "",
      next_emi_date: "",
      notes: "",
      payment_amount: "",
      payment_date: dateInput(),
      payment_notes: "",
    });
    setEditingId(null);
    setSelectedId(null);
  };

  const closeModal = () => {
    setModal(null);
    setDetailItem(null);
    resetForm();
  };

  const changeMonth = (amount) => {
    setSelectedMonth((old) => {
      const d = new Date(old);
      d.setMonth(d.getMonth() + amount);
      return d;
    });
  };

  const currentMonth = () => setSelectedMonth(new Date());

  const openAdd = () => {
    resetForm();
    setModal(activeTab === "borrow" ? "add-borrow" : "add-loan");
  };

  const openEdit = (item, type) => {
    setEditingId(item.id);

    if (type === "borrow") {
      setForm({
        ...form,
        person_name: item.person_name || "",
        borrow_amount:
          item.borrow_amount !== undefined ? String(item.borrow_amount) : "",
        take_date: dateInput(item.take_date),
        return_date: item.return_date ? dateInput(item.return_date) : "",
        notes: item.notes || "",
      });
      setModal("edit-borrow");
    } else {
      setForm({
        ...form,
        bank_name: item.bank_name || item.person_name || "",
        total_loan_amount:
          item.total_loan_amount !== undefined
            ? String(item.total_loan_amount)
            : "",
        emi_amount:
          item.emi_amount !== undefined ? String(item.emi_amount) : "",
        total_emis:
          item.total_emis !== undefined ? String(item.total_emis) : "",
        next_emi_date: item.next_emi_date
          ? dateInput(item.next_emi_date)
          : "",
        notes: item.notes || "",
      });
      setModal("edit-loan");
    }
  };

  const openPayment = (id, type) => {
    setSelectedId(id);
    setForm((old) => ({
      ...old,
      payment_amount: "",
      payment_date: dateInput(),
      payment_notes: "",
    }));
    setModal(type === "borrow" ? "borrow-payment" : "loan-payment");
  };

  const openDetails = (item, type) => {
    setDetailItem({ ...item, recordType: type });
    setModal("details");
  };

  const markBorrowReturned = async (item) => {
    if (!item?.id) {
      notify("error", "Borrow record not found.");
      return;
    }

    setBusyAction(`return-borrow-${item.id}`);

    try {
      const today = dateInput(new Date());

      const response = await axios.put(
        `${API_BASE_URL}/loan-borrow/borrow/${item.id}`,
        {
          person_name:
            item.person_name?.trim() || "",
          borrow_amount:
            safeNumber(item.borrow_amount),
          take_date: item.take_date
            ? dateInput(item.take_date)
            : today,
          return_date: today,
          notes: item.notes || "",
        },
        config
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.error ||
            "Failed to mark borrow as returned"
        );
      }

      await fetchData();
      notify(
        "success",
        `Borrow returned today (${new Date().toLocaleDateString(
          "en-IN"
        )}).`
      );
    } catch (error) {
      console.error(
        "Mark borrow returned error:",
        error
      );

      notify(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to mark borrow as returned."
      );
    } finally {
      setBusyAction("");
    }
  };

  const addBorrow = async () => {
    if (!form.person_name.trim()) {
      notify("error", "Person name is required.");
      return;
    }
    if (safeNumber(form.borrow_amount) <= 0) {
      notify("error", "Enter a valid borrow amount.");
      return;
    }
    if (!form.take_date || !form.return_date) {
      notify("error", "Take date and return date are required.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/loan-borrow/borrow`,
        {
          person_name: form.person_name.trim(),
          borrow_amount: safeNumber(form.borrow_amount),
          take_date: form.take_date,
          return_date: form.return_date,
          notes: form.notes.trim(),
        },
        config
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to add borrow");
      }

      closeModal();
      await fetchData();
      notify("success", "Borrow added successfully.");
    } catch (error) {
      console.error(error);
      notify(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to add borrow."
      );
    }
  };

  const updateBorrow = async () => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/loan-borrow/borrow/${editingId}`,
        {
          person_name: form.person_name.trim(),
          borrow_amount: safeNumber(form.borrow_amount),
          take_date: form.take_date,
          return_date: form.return_date,
          notes: form.notes.trim(),
        },
        config
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to update borrow");
      }

      closeModal();
      await fetchData();
      notify("success", "Borrow updated successfully.");
    } catch (error) {
      console.error(error);
      notify(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update borrow."
      );
    }
  };

  const deleteBorrow = async (id) => {
    setBusyAction(`delete-borrow-${id}`);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/loan-borrow/borrow/${id}`,
        config
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to delete borrow");
      }

      setConfirmAction(null);
      await fetchData();
      notify("success", "Borrow deleted successfully.");
    } catch (error) {
      console.error(error);
      notify(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to delete borrow."
      );
    } finally {
      setBusyAction("");
    }
  };

  const addLoan = async () => {
    if (!form.bank_name.trim()) {
      notify("error", "Bank name is required.");
      return;
    }
    if (safeNumber(form.total_loan_amount) <= 0) {
      notify("error", "Enter a valid loan amount.");
      return;
    }
    if (safeNumber(form.emi_amount) <= 0) {
      notify("error", "Enter a valid EMI amount.");
      return;
    }
    if (safeNumber(form.total_emis) <= 0) {
      notify("error", "Enter total number of EMIs.");
      return;
    }
    if (!form.next_emi_date) {
      notify("error", "Next EMI date is required.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/loan-borrow/loan`,
        {
          bank_name: form.bank_name.trim(),
          total_loan_amount: safeNumber(form.total_loan_amount),
          emi_amount: safeNumber(form.emi_amount),
          total_emis: Math.floor(safeNumber(form.total_emis)),
          next_emi_date: form.next_emi_date,
          notes: form.notes.trim(),
        },
        config
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to add loan");
      }

      closeModal();
      await fetchData();
      notify("success", "Loan added successfully.");
    } catch (error) {
      console.error(error);
      notify(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to add loan."
      );
    }
  };

  const updateLoan = async () => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/loan-borrow/loan/${editingId}`,
        {
          bank_name: form.bank_name.trim(),
          total_loan_amount: safeNumber(form.total_loan_amount),
          emi_amount: safeNumber(form.emi_amount),
          total_emis: Math.floor(safeNumber(form.total_emis)),
          next_emi_date: form.next_emi_date,
          notes: form.notes.trim(),
        },
        config
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to update loan");
      }

      closeModal();
      await fetchData();
      notify("success", "Loan updated successfully.");
    } catch (error) {
      console.error(error);
      notify(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update loan."
      );
    }
  };

  const deleteLoan = async (id) => {
    setBusyAction(`delete-loan-${id}`);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/loan-borrow/loan/${id}`,
        config
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to delete loan");
      }

      setConfirmAction(null);
      await fetchData();
      notify("success", "Loan deleted successfully.");
    } catch (error) {
      console.error(error);
      notify(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to delete loan."
      );
    } finally {
      setBusyAction("");
    }
  };

  const addBorrowRepayment = async () => {
    if (safeNumber(form.payment_amount) <= 0) {
      notify("error", "Enter a valid repayment amount.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/loan-borrow/borrow/${selectedId}/repayment`,
        {
          repayment_amount: safeNumber(form.payment_amount),
          payment_date: form.payment_date,
          notes: form.payment_notes.trim(),
        },
        config
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to add repayment");
      }

      closeModal();
      await fetchData();
      notify("success", "Repayment added successfully.");
    } catch (error) {
      console.error(error);
      notify(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to add repayment."
      );
    }
  };

  const addLoanEMI = async () => {
    if (safeNumber(form.payment_amount) <= 0) {
      notify("error", "Enter a valid EMI amount.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/loan-borrow/loan/${selectedId}/emi`,
        {
          emi_amount: safeNumber(form.payment_amount),
          payment_date: form.payment_date,
          notes: form.payment_notes.trim(),
        },
        config
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to add EMI");
      }

      closeModal();
      await fetchData();
      notify("success", "EMI payment added successfully.");
    } catch (error) {
      console.error(error);
      notify(
        "error",
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to add EMI payment."
      );
    }
  };

  const activeItems = activeTab === "borrow" ? borrows : loans;

  const filteredItems = [...activeItems]
    .filter((item) => {
      const name = (
        item.person_name ||
        item.bank_name ||
        item.person_or_bank_name ||
        ""
      ).toLowerCase();

      const matchesSearch =
        !search.trim() ||
        name.includes(search.toLowerCase().trim());

      const itemStatus =
        item.calculated_status || item.status || "Active";

      const matchesStatus =
        status === "all" ||
        itemStatus.toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sort === "amount-desc") {
        return Number(
          b.borrow_amount || b.total_loan_amount || b.total_amount || 0
        ) - Number(a.borrow_amount || a.total_loan_amount || a.total_amount || 0);
      }

      if (sort === "amount-asc") {
        return Number(
          a.borrow_amount || a.total_loan_amount || a.total_amount || 0
        ) - Number(b.borrow_amount || b.total_loan_amount || b.total_amount || 0);
      }

      const da = new Date(a.take_date || a.created_at || a.next_emi_date);
      const db = new Date(b.take_date || b.created_at || b.next_emi_date);

      return sort === "date-asc" ? da - db : db - da;
    });

  const borrowTotal = borrows.reduce(
    (s, x) => s + Number(x.borrow_amount || x.total_amount || 0),
    0
  );

  const loanTotal = loans.reduce(
    (s, x) => s + Number(x.total_loan_amount || x.total_amount || 0),
    0
  );

  const remainingBorrow = borrows.reduce(
    (s, x) => s + Number(x.remaining_amount || 0),
    0
  );

  const remainingLoan = loans.reduce(
    (s, x) => s + Number(x.remaining_amount || 0),
    0
  );

  const summaryBorrow =
    Number(summary?.borrow_amount || summary?.total_borrow || 0);

  const summaryLoan =
    Number(summary?.loan_amount || summary?.total_loan || 0);

  const displayedBorrowTotal =
    summaryBorrow > 0 ? summaryBorrow : borrowTotal;

  const displayedLoanTotal =
    summaryLoan > 0 ? summaryLoan : loanTotal;

  return (
    <>
      <style>{`
        *{box-sizing:border-box}
        html,body,#root{min-height:100%;margin:0}
        body{margin:0;background:#f4f7fb;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        button,input,textarea,select{font:inherit}
        button{touch-action:manipulation}
        .lb-page{min-height:100vh;width:100%;padding:20px;overflow-x:hidden;background:radial-gradient(circle at 5% 0%,rgba(79,70,229,.12),transparent 27%),radial-gradient(circle at 96% 4%,rgba(14,165,233,.10),transparent 24%),linear-gradient(135deg,#f8fafc 0%,#eef2ff 52%,#f8fafc 100%)}
        .lb-shell{width:min(1180px,100%);margin:0 auto;min-width:0}
        .lb-header{position:sticky;top:12px;z-index:30;margin-bottom:16px;padding:20px;border-radius:24px;color:#fff;overflow:hidden;background:linear-gradient(135deg,#17164a 0%,#4338ca 55%,#7c3aed 100%);box-shadow:0 22px 55px rgba(49,46,129,.22)}
        .lb-header:before{content:"";position:absolute;width:300px;height:300px;border-radius:50%;right:-120px;top:-170px;background:rgba(255,255,255,.08)}
        .lb-header-row{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:18px}
        .lb-brand{display:flex;align-items:center;gap:13px;min-width:0}
        .lb-brand-icon{width:50px;height:50px;flex:0 0 50px;display:grid;place-items:center;border-radius:15px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.23)}
        .lb-brand h1{margin:0;font-size:25px;line-height:1.15;font-weight:900;letter-spacing:-.035em;overflow-wrap:anywhere}
        .lb-brand p{margin:5px 0 0;color:#e0e7ff;font-size:12px;font-weight:600;line-height:1.4;overflow-wrap:anywhere}
        .lb-header-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}
        .lb-btn{min-height:42px;border:0;border-radius:11px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-size:12px;font-weight:850;cursor:pointer;white-space:nowrap;transition:.18s ease}
        .lb-btn:hover{transform:translateY(-1px)}
        .lb-btn-light{color:#fff;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.2)}
        .lb-btn-add{color:#4338ca;background:#fff;box-shadow:0 10px 25px rgba(0,0,0,.13)}
        .lb-btn:disabled,.lb-action:disabled,.lb-submit:disabled{opacity:.55;cursor:wait;transform:none}
        .lb-monthbar{position:relative;z-index:1;margin-top:15px;padding-top:14px;border-top:1px solid rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;gap:7px}
        .lb-month{min-width:190px;height:40px;padding:0 14px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:7px;background:rgba(255,255,255,.12);font-size:13px;font-weight:850;white-space:nowrap}
        .lb-nav{width:40px;height:40px;border:0;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.12);color:#fff;cursor:pointer}
        .lb-nav:hover{background:rgba(255,255,255,.2)}
        .lb-today{height:40px;border:0;border-radius:11px;padding:0 13px;background:#fff;color:#4338ca;font-size:12px;font-weight:850;cursor:pointer}
        .lb-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}
        .lb-stat{min-width:0;padding:17px;border:1px solid #d9dee7;border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 10px 30px rgba(15,23,42,.055);transition:.18s ease}
        .lb-stat:hover{transform:translateY(-2px);box-shadow:0 17px 38px rgba(15,23,42,.09)}
        .lb-stat-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
        .lb-stat-label{color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.055em;font-weight:900;line-height:1.3}
        .lb-stat-value{margin-top:7px;font-size:23px;line-height:1.15;font-weight:950;letter-spacing:-.035em;overflow-wrap:anywhere;word-break:break-word}
        .lb-stat-sub{margin-top:4px;color:#64748b;font-size:10px;font-weight:650;line-height:1.3}
        .lb-stat-icon{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:0 0 40px}
        .indigo{background:#eef2ff;color:#4f46e5}.green{background:#ecfdf5;color:#059669}.blue{background:#eff6ff;color:#2563eb}.orange{background:#fff7ed;color:#ea580c}
        .lb-tabs-card,.lb-filter-card,.lb-list-card{border:1px solid #d9dee7;border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 10px 30px rgba(15,23,42,.05)}
        .lb-tabs-card{padding:6px;margin-bottom:12px}.lb-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .lb-tab{min-height:49px;border:0;border-radius:13px;background:transparent;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:900}
        .lb-tab.active{color:#fff;background:linear-gradient(135deg,#4f46e5,#7c3aed);box-shadow:0 9px 22px rgba(79,70,229,.24)}
        .lb-filter-card{padding:13px;margin-bottom:12px}.lb-filters{display:grid;grid-template-columns:minmax(0,1fr) 180px 180px;gap:8px}
        .lb-search,.lb-select{min-width:0;height:42px;border:1px solid #d9dee7;border-radius:11px;background:#f8fafc;color:#334155;outline:none;font-size:12px;font-weight:650}
        .lb-search{display:flex;align-items:center;gap:8px;padding:0 12px}.lb-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;font-size:12px}.lb-select{padding:0 10px}
        .lb-list-card{padding:14px}.lb-list-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}.lb-list-head h2{margin:0;font-size:16px;font-weight:950;letter-spacing:-.02em}.lb-list-head span{color:#64748b;font-size:10px;font-weight:750}
        .lb-list{display:grid;gap:12px}
        .lb-item{min-width:0;display:grid;grid-template-columns:48px minmax(0,1fr) minmax(125px,auto) auto;align-items:center;gap:14px;padding:16px;border:1.5px solid #111827;border-radius:16px;background:#fff;box-shadow:0 5px 16px rgba(15,23,42,.07);transition:.18s ease}
        .lb-item:hover{transform:translateY(-2px);border-color:#111827;box-shadow:0 13px 30px rgba(15,23,42,.11)}
        .lb-avatar{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;flex:0 0 48px}.lb-avatar.borrow{background:#eef2ff;color:#4f46e5}.lb-avatar.loan{background:#ecfeff;color:#0891b2}
        .lb-main{min-width:0}.lb-name{font-size:15px;line-height:1.3;font-weight:950;color:#0b1220;overflow-wrap:anywhere;word-break:break-word}
        .lb-meta{display:flex;align-items:center;flex-wrap:wrap;gap:7px 10px;margin-top:5px;color:#475569;font-size:10px;font-weight:700;line-height:1.4}
        .lb-note{margin-top:7px;color:#111827;font-size:10.5px;font-weight:650;line-height:1.5;overflow-wrap:anywhere;word-break:break-word}
        .lb-schedule,.lb-loan-metrics{display:flex;flex-wrap:wrap;gap:5px 12px;margin-top:6px;color:#334155;font-size:10px;font-weight:700;line-height:1.45}
        .lb-schedule strong,.lb-loan-metrics strong{color:#059669;font-weight:950}.lb-schedule .returned{color:#059669}.lb-schedule .overdue,.lb-loan-metrics .overdue{color:#dc2626}.lb-loan-metrics span b{color:#0f172a}
        .lb-status{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:99px;font-size:9px;font-weight:950;white-space:nowrap}.status-active{background:#eff6ff;color:#2563eb}.status-completed{background:#ecfdf5;color:#059669}.status-overdue{background:#fef2f2;color:#dc2626}
        .lb-money{min-width:125px;text-align:right;align-self:center;padding:10px 11px;border:1.5px solid #111827;border-radius:11px;background:#f8fafc}.lb-money strong{display:block;font-size:17px;line-height:1.2;font-weight:950;color:#000;overflow-wrap:anywhere;word-break:break-word}.lb-money span{display:block;margin-top:4px;color:#334155;font-size:10px;font-weight:750;overflow-wrap:anywhere;word-break:break-word}.lb-money small{display:block;margin-top:3px;color:#64748b;font-size:9px;font-weight:700;overflow-wrap:anywhere}
        .lb-actions{display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:flex-end}.lb-action{width:35px;height:35px;border:1px solid #e2e8f0;border-radius:9px;background:#f1f5f9;color:#475569;display:grid;place-items:center;cursor:pointer;transition:.16s ease}.lb-action:hover{background:#eef2ff;color:#4f46e5}.lb-action.pay:hover{background:#ecfdf5;color:#059669}.lb-action.delete:hover{background:#fef2f2;color:#dc2626}.lb-action.return{background:#ecfdf5;color:#059669}.lb-action.return:hover{background:#d1fae5;color:#047857}.lb-action.is-busy{color:#4f46e5;background:#eef2ff}
        .lb-empty{padding:60px 20px;text-align:center;border:1px dashed #94a3b8;border-radius:16px;background:linear-gradient(180deg,#fff,#f8fafc);color:#64748b}.lb-empty-icon{width:50px;height:50px;margin:0 auto 10px;border-radius:15px;background:#eef2ff;color:#6366f1;display:grid;place-items:center}.lb-empty strong{display:block;color:#334155;font-size:14px;font-weight:900}.lb-empty span{display:block;margin-top:5px;font-size:10px;line-height:1.45}
        .lb-backdrop{position:fixed;inset:0;z-index:1000;padding:16px;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.64);backdrop-filter:blur(8px);overflow:auto}
        .lb-modal{width:min(570px,100%);max-height:min(90vh,780px);overflow:auto;background:#fff;border-radius:22px;box-shadow:0 30px 90px rgba(15,23,42,.3);animation:lbIn .18s ease}.lb-modal-head{position:sticky;top:0;z-index:2;padding:16px 18px;border-bottom:1px solid #d9dee7;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px}.lb-modal-head h3{margin:0;font-size:17px;line-height:1.25;font-weight:950;overflow-wrap:anywhere}.lb-close{width:34px;height:34px;border:0;border-radius:9px;background:#f1f5f9;display:grid;place-items:center;cursor:pointer;flex:0 0 34px}.lb-modal-body{padding:18px;overflow-wrap:anywhere}
        .lb-form{display:grid;gap:12px}.lb-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.lb-field{display:grid;gap:6px;min-width:0}.lb-field.full{grid-column:1/-1}.lb-field label{color:#334155;font-size:10px;text-transform:uppercase;letter-spacing:.045em;font-weight:950;line-height:1.3}.lb-field input,.lb-field textarea,.lb-field select{width:100%;min-width:0;max-width:100%;border:1px solid #1f2937;border-radius:11px;background:#f8fafc;padding:10px 11px;color:#0f172a;font-size:13px;font-weight:650;outline:none}.lb-field input,.lb-field select{height:43px}.lb-field textarea{min-height:86px;resize:vertical;line-height:1.45}.lb-field input:focus,.lb-field textarea:focus,.lb-field select:focus{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(99,102,241,.10);background:#fff}.lb-submit{width:100%;min-height:44px;border:0;border-radius:11px;color:#fff;background:linear-gradient(135deg,#4f46e5,#7c3aed);font-weight:900;font-size:12px;cursor:pointer;box-shadow:0 9px 22px rgba(79,70,229,.22);display:flex;align-items:center;justify-content:center;gap:7px}.lb-submit.green-btn{background:linear-gradient(135deg,#059669,#10b981)}
        .lb-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.lb-detail{min-width:0;padding:14px;border-radius:12px;background:#fff;border:1.5px solid #111827;box-shadow:0 3px 10px rgba(15,23,42,.05)}.lb-detail small{display:block;color:#475569;font-size:9px;text-transform:uppercase;letter-spacing:.035em;font-weight:950;line-height:1.3}.lb-detail strong{display:block;margin-top:5px;color:#000;font-size:14px;line-height:1.45;font-weight:900;overflow-wrap:anywhere;word-break:break-word}.lb-detail:last-child{grid-column:1/-1}
        .lb-toast-wrap{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:none}.lb-toast{pointer-events:auto;width:min(390px,calc(100vw - 28px));display:flex;gap:10px;align-items:flex-start;padding:14px;border-radius:15px;background:rgba(255,255,255,.98);box-shadow:0 25px 75px rgba(15,23,42,.24);border:1px solid #d9dee7;animation:lbIn .18s ease}.lb-toast.success{border-left:4px solid #059669}.lb-toast.error{border-left:4px solid #dc2626}.lb-toast-body{flex:1;min-width:0}.lb-toast-body b{display:block;font-size:13px;font-weight:900}.lb-toast-body span{display:block;margin-top:4px;color:#475569;font-size:11px;line-height:1.45;overflow-wrap:anywhere}.lb-toast-close{width:28px;height:28px;border:0;border-radius:8px;background:#f1f5f9;display:grid;place-items:center;cursor:pointer;flex:0 0 28px}
        .lb-confirm{width:min(410px,calc(100vw - 28px));padding:20px;border-radius:19px;background:#fff;box-shadow:0 30px 90px rgba(15,23,42,.32);text-align:center;animation:lbIn .18s ease}.lb-confirm-icon{width:48px;height:48px;margin:0 auto 10px;border-radius:14px;display:grid;place-items:center;background:#fef2f2;color:#dc2626}.lb-confirm h3{margin:0;color:#0f172a;font-size:17px;font-weight:950}.lb-confirm p{margin:7px auto 0;max-width:330px;color:#64748b;font-size:11px;line-height:1.55;overflow-wrap:anywhere}.lb-confirm-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:15px}.lb-confirm-actions button{height:40px;border:0;border-radius:10px;font-size:11px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}.lb-confirm-cancel{background:#f1f5f9;color:#475569}.lb-confirm-delete{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;box-shadow:0 8px 20px rgba(220,38,38,.18)}.lb-confirm-actions button:disabled{opacity:.55;cursor:wait}
        .lb-spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@keyframes lbIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
        @media(max-width:950px){.lb-stats{grid-template-columns:1fr 1fr}.lb-filters{grid-template-columns:1fr 1fr}.lb-search{grid-column:1/-1}.lb-item{grid-template-columns:46px minmax(0,1fr) minmax(115px,auto) auto}}
        @media(max-width:680px){
          .lb-page{padding:10px 9px calc(48px + env(safe-area-inset-bottom))}.lb-header{position:relative;top:auto;padding:14px;border-radius:17px;margin-bottom:10px}.lb-header-row{gap:10px}.lb-brand{gap:9px}.lb-brand-icon{width:40px;height:40px;flex-basis:40px;border-radius:11px}.lb-brand h1{font-size:19px}.lb-brand p{font-size:10px;margin-top:3px}.lb-header-actions{gap:5px}.lb-header-actions .label{display:none}.lb-btn{width:38px;height:38px;min-height:38px;padding:0;border-radius:9px}.lb-monthbar{margin-top:10px;padding-top:10px;gap:5px}.lb-month{min-width:0;flex:1;height:36px;padding:0 7px;font-size:10px}.lb-nav{width:36px;height:36px}.lb-today{height:36px;padding:0 9px;font-size:10px}
          .lb-stats{gap:7px;margin-bottom:9px}.lb-stat{padding:11px;border-radius:13px}.lb-stat-label{font-size:8px}.lb-stat-value{font-size:17px}.lb-stat-sub{font-size:8px}.lb-stat-icon{width:31px;height:31px;flex-basis:31px;border-radius:9px}
          .lb-tabs-card,.lb-filter-card,.lb-list-card{border-radius:14px}.lb-tabs-card{padding:4px;margin-bottom:8px}.lb-tab{min-height:43px;border-radius:10px;font-size:11px}.lb-filter-card{padding:8px;margin-bottom:8px}.lb-filters{grid-template-columns:1fr;gap:6px}.lb-search{grid-column:auto}.lb-search,.lb-select{height:39px;font-size:11px}.lb-search input{font-size:11px}.lb-list-card{padding:9px}.lb-list-head{margin-bottom:8px}.lb-list-head h2{font-size:13px}.lb-list-head span{font-size:8px}.lb-list{gap:10px}
          .lb-item{grid-template-columns:40px minmax(0,1fr);gap:10px;padding:12px;min-height:195px;height:auto;border:1.5px solid #111827;border-radius:14px;align-items:start}.lb-avatar{width:40px;height:40px;flex-basis:40px;border-radius:10px}.lb-main{grid-column:2;grid-row:1;min-width:0}.lb-name{font-size:13.5px;line-height:1.35}.lb-meta{font-size:9px;gap:5px 8px;margin-top:5px}.lb-status{font-size:7.5px;padding:3px 6px}.lb-note{font-size:9.5px;line-height:1.5;margin-top:6px}.lb-schedule,.lb-loan-metrics{font-size:9px;gap:4px 8px;margin-top:5px}.lb-money{grid-column:1/-1;grid-row:2;text-align:left;min-width:0;padding:10px 11px;border:1.5px solid #111827;border-radius:10px;background:#f8fafc}.lb-money strong{font-size:16px}.lb-money span{font-size:9px;margin-top:3px}.lb-money small{font-size:8.5px}.lb-actions{grid-column:1/-1;grid-row:3;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;width:100%}.lb-action{width:100%;height:35px;border-radius:8px}
          .lb-empty{padding:42px 14px}.lb-backdrop{padding:9px}.lb-modal{width:100%;max-width:560px;max-height:calc(100dvh - 18px);border-radius:17px}.lb-modal-head{padding:12px 13px}.lb-modal-head h3{font-size:14px}.lb-close{width:30px;height:30px;flex-basis:30px}.lb-modal-body{padding:13px}.lb-form{gap:10px}.lb-form-grid{grid-template-columns:1fr;gap:9px}.lb-field.full{grid-column:auto}.lb-field label{font-size:8.5px}.lb-field input,.lb-field textarea,.lb-field select{font-size:12px;border-radius:9px}.lb-field input,.lb-field select{height:40px}.lb-submit{min-height:41px;font-size:10.5px}.lb-detail-grid{grid-template-columns:1fr 1fr;gap:8px}.lb-detail{padding:11px;border:1.5px solid #111827}.lb-detail small{font-size:7.5px}.lb-detail strong{font-size:12px;line-height:1.45}.lb-toast-wrap{padding:10px}.lb-toast{width:min(370px,calc(100vw - 20px));padding:12px}.lb-confirm{width:calc(100vw - 22px);padding:17px}.lb-confirm h3{font-size:14px}.lb-confirm p{font-size:9.5px}
        }
        @media(max-width:420px){.lb-brand p{display:none}.lb-stat-value{font-size:15px}.lb-month{font-size:9px}.lb-detail-grid{grid-template-columns:1fr}.lb-detail:last-child{grid-column:auto}}
        @media(max-width:360px){.lb-page{padding-left:7px;padding-right:7px}.lb-stat-value{font-size:13px}.lb-item{padding:10px}.lb-actions{grid-template-columns:repeat(5,1fr)}}
      `}</style>

      <main className="lb-page">
        <div className="lb-shell">

          <header className="lb-header">
            <div className="lb-header-row">
              <div className="lb-brand">
                <div className="lb-brand-icon"><WalletCards size={23} /></div>
                <div>
                  <h1>Loans & Borrows</h1>
                  <p>Track money you borrowed and money you lent</p>
                </div>
              </div>

              <div className="lb-header-actions">
                <button className="lb-btn lb-btn-light" onClick={refresh} disabled={refreshing || !!busyAction}>
                  <RefreshCw size={16} className={refreshing ? "lb-spin" : ""} />
                  <span className="label">Refresh</span>
                </button>
                <button className="lb-btn lb-btn-add" onClick={openAdd} disabled={!!busyAction}>
                  <Plus size={17} />
                  <span className="label">Add Record</span>
                </button>
              </div>
            </div>

            <div className="lb-monthbar">
              <button className="lb-nav" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
              <div className="lb-month"><CalendarDays size={15} />{monthTitle(selectedMonth)}</div>
              <button className="lb-nav" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
              <button className="lb-today" onClick={currentMonth}>Today</button>
            </div>
          </header>

          <section className="lb-stats">
            <Stat icon={<ArrowDownRight />} iconClass="indigo" title="Total Borrowed" value={money(displayedBorrowTotal)} sub={`${borrows.length} records`} />
            <Stat icon={<ArrowUpRight />} iconClass="blue" title="Total Loans" value={money(displayedLoanTotal)} sub={`${loans.length} records`} />
            <Stat icon={<WalletCards />} iconClass="green" title="Borrow Remaining" value={money(remainingBorrow)} sub="Outstanding amount" />
            <Stat icon={<CreditCard />} iconClass="orange" title="Loan Remaining" value={money(remainingLoan)} sub="Outstanding amount" />
          </section>

          <section className="lb-tabs-card">
            <div className="lb-tabs">
              <button className={`lb-tab ${activeTab === "borrow" ? "active" : ""}`} onClick={() => setActiveTab("borrow")}>
                <UserRound size={18} /> Borrows <span>({borrows.length})</span>
              </button>
              <button className={`lb-tab ${activeTab === "loan" ? "active" : ""}`} onClick={() => setActiveTab("loan")}>
                <Banknote size={18} /> Loans <span>({loans.length})</span>
              </button>
            </div>
          </section>

          <section className="lb-filter-card">
            <div className="lb-filters">
              <div className="lb-search">
                <Search size={15} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${activeTab === "borrow" ? "person" : "bank"}...`} />
              </div>

              <select className="lb-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>

              <select className="lb-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </section>

          <section className="lb-list-card">
            <div className="lb-list-head">
              <div>
                <h2>{activeTab === "borrow" ? "Borrow Records" : "Loan Records"}</h2>
              </div>
              <span>{filteredItems.length} shown</span>
            </div>

            {loading ? (
              <div className="lb-empty">
                <div className="lb-empty-icon"><RefreshCw size={22} className="lb-spin" /></div>
                <strong>Loading records</strong>
                <span>Please wait while your data is loaded.</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="lb-empty">
                <div className="lb-empty-icon">{activeTab === "borrow" ? <UserRound size={22} /> : <Banknote size={22} />}</div>
                <strong>No {activeTab === "borrow" ? "borrow" : "loan"} records</strong>
                <span>Tap “Add Record” to create your first record.</span>
              </div>
            ) : (
              <div className="lb-list">
                {filteredItems.map((item) => (
                  <RecordCard
                    key={item.id}
                    item={item}
                    type={activeTab}
                    onView={() => openDetails(item, activeTab)}
                    onEdit={() => openEdit(item, activeTab)}
                    onDelete={() =>
                      setConfirmAction({
                        type: activeTab,
                        id: item.id,
                        title: `Delete ${activeTab === "borrow" ? "Borrow" : "Loan"}?`,
                        message: `This ${activeTab === "borrow" ? "borrow" : "loan"} record will be permanently deleted. This action cannot be undone.`,
                      })
                    }
                    onPayment={() => openPayment(item.id, activeTab)}
                    onReturn={
                      activeTab === "borrow"
                        ? () => markBorrowReturned(item)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {modal && modal !== "details" && (
        <div className="lb-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="lb-modal">
            <div className="lb-modal-head">
              <h3>
                {modal === "add-borrow" && "Add Borrow"}
                {modal === "edit-borrow" && "Edit Borrow"}
                {modal === "add-loan" && "Add Loan"}
                {modal === "edit-loan" && "Edit Loan"}
                {modal === "borrow-payment" && "Record Borrow Repayment"}
                {modal === "loan-payment" && "Record EMI Payment"}
              </h3>
              <button className="lb-close" onClick={closeModal}><X size={17} /></button>
            </div>

            <div className="lb-modal-body">
              {(modal === "add-borrow" || modal === "edit-borrow") && (
                <div className="lb-form">
                  <div className="lb-form-grid">
                    <Field label="Person Name">
                      <input value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} placeholder="Enter person name" />
                    </Field>
                    <Field label="Amount">
                      <input type="number" min="0" step="0.01" inputMode="decimal" value={form.borrow_amount} onChange={(e) => setForm({ ...form, borrow_amount: editableNumber(e.target.value) })} placeholder="0" />
                    </Field>
                    <Field label="Take Date">
                      <input type="date" value={form.take_date} onChange={(e) => setForm({ ...form, take_date: e.target.value })} />
                    </Field>
                    <Field label="Return Date">
                      <input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
                    </Field>
                    <Field label="Notes" full>
                      <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                    </Field>
                  </div>
                  <button className="lb-submit" onClick={modal === "add-borrow" ? addBorrow : updateBorrow}>
                    <SaveIcon /> {modal === "add-borrow" ? "Add Borrow" : "Update Borrow"}
                  </button>
                </div>
              )}

              {(modal === "add-loan" || modal === "edit-loan") && (
                <div className="lb-form">
                  <div className="lb-form-grid">
                    <Field label="Bank Name">
                      <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Enter bank name" />
                    </Field>
                    <Field label="Loan Amount">
                      <input type="number" min="0" step="0.01" inputMode="decimal" value={form.total_loan_amount} onChange={(e) => setForm({ ...form, total_loan_amount: editableNumber(e.target.value) })} placeholder="0" />
                    </Field>
                    <Field label="EMI Amount">
                      <input type="number" min="0" step="0.01" inputMode="decimal" value={form.emi_amount} onChange={(e) => setForm({ ...form, emi_amount: editableNumber(e.target.value) })} placeholder="0" />
                    </Field>
                    <Field label="Number of EMIs">
                      <input type="number" min="0" step="1" inputMode="numeric" value={form.total_emis} onChange={(e) => setForm({ ...form, total_emis: editableNumber(e.target.value) })} placeholder="0" />
                    </Field>
                    <Field label="Next EMI Date">
                      <input type="date" value={form.next_emi_date} onChange={(e) => setForm({ ...form, next_emi_date: e.target.value })} />
                    </Field>
                    <Field label="Notes" full>
                      <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                    </Field>
                  </div>
                  <button className="lb-submit" onClick={modal === "add-loan" ? addLoan : updateLoan}>
                    <SaveIcon /> {modal === "add-loan" ? "Add Loan" : "Update Loan"}
                  </button>
                </div>
              )}

              {(modal === "borrow-payment" || modal === "loan-payment") && (
                <div className="lb-form">
                  <div className="lb-form-grid">
                    <Field label={modal === "borrow-payment" ? "Repayment Amount" : "EMI Amount"}>
                      <input type="number" min="0" step="0.01" inputMode="decimal" value={form.payment_amount} onChange={(e) => setForm({ ...form, payment_amount: editableNumber(e.target.value) })} placeholder="0" />
                    </Field>
                    <Field label="Payment Date">
                      <input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
                    </Field>
                    <Field label="Notes" full>
                      <textarea value={form.payment_notes} onChange={(e) => setForm({ ...form, payment_notes: e.target.value })} placeholder="Optional payment notes" />
                    </Field>
                  </div>
                  <button className="lb-submit green-btn" onClick={modal === "borrow-payment" ? addBorrowRepayment : addLoanEMI}>
                    <CheckCircle2 size={16} /> {modal === "borrow-payment" ? "Save Repayment" : "Save EMI Payment"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modal === "details" && detailItem && (
        <div className="lb-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="lb-modal">
            <div className="lb-modal-head">
              <h3>Record Details</h3>
              <button className="lb-close" onClick={closeModal}><X size={17} /></button>
            </div>
            <div className="lb-modal-body">
              <div className="lb-detail-grid">
                <Detail label="Type" value={detailItem.recordType === "borrow" ? "Borrow" : "Loan"} />
                <Detail label="Status" value={detailItem.calculated_status || detailItem.status || "Active"} />
                <Detail label={detailItem.recordType === "borrow" ? "Person" : "Bank"} value={detailItem.person_name || detailItem.bank_name || detailItem.person_or_bank_name} />
                <Detail label="Amount" value={money(detailItem.borrow_amount || detailItem.total_loan_amount || detailItem.total_amount)} />

                {detailItem.recordType === "borrow" ? (
                  <>
                    <Detail label="Added Date" value={detailItem.take_date ? dateInput(detailItem.take_date) : "—"} />
                    <Detail label="Return Date" value={detailItem.return_date ? dateInput(detailItem.return_date) : "Not returned"} />
                    <Detail
                      label="Return Duration"
                      value={
                        detailItem.take_date
                          ? `${Math.max(
                              0,
                              daysBetween(
                                detailItem.take_date,
                                detailItem.return_date || new Date()
                              ) || 0
                            )} days`
                          : "—"
                      }
                    />
                    <Detail
                      label="Days Status"
                      value={
                        detailItem.return_date
                          ? "Returned"
                          : dayText(
                              daysBetween(
                                new Date(),
                                detailItem.return_date
                              )
                            )
                      }
                    />
                    <Detail label="Remaining" value={money(detailItem.remaining_amount)} />
                  </>
                ) : (
                  <>
                    <Detail label="Loan Start" value={detailItem.created_at ? dateInput(detailItem.created_at) : "—"} />
                    <Detail label="EMI" value={money(detailItem.emi_amount)} />
                    <Detail label="Total EMIs" value={String(detailItem.total_emis || 0)} />
                    <Detail
                      label="EMIs Remaining"
                      value={String(
                        Math.max(
                          0,
                          Number(
                            detailItem.remaining_emis ??
                              (
                                Number(detailItem.total_emis || 0) -
                                Number(
                                  detailItem.paid_emis ??
                                    detailItem.emis_paid ??
                                    detailItem.completed_emis ??
                                    0
                                )
                              )
                          ) || 0
                        )
                      )}
                    />
                    <Detail
                      label="Remaining Amount"
                      value={money(
                        detailItem.remaining_amount ??
                          (
                            Number(detailItem.total_loan_amount || 0) -
                            Number(
                              detailItem.paid_emis ??
                                detailItem.emis_paid ??
                                detailItem.completed_emis ??
                                0
                            ) *
                              Number(detailItem.emi_amount || 0)
                          )
                      )}
                    />
                    <Detail label="Next EMI" value={detailItem.next_emi_date ? dateInput(detailItem.next_emi_date) : "—"} />
                    <Detail
                      label="Next EMI Status"
                      value={
                        detailItem.next_emi_date
                          ? dayText(
                              daysBetween(
                                new Date(),
                                detailItem.next_emi_date
                              )
                            )
                          : "—"
                      }
                    />
                  </>
                )}

                {detailItem.notes && <Detail label="Notes" value={detailItem.notes} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="lb-backdrop lb-confirm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busyAction && setConfirmAction(null)}>
          <div className="lb-confirm" role="alertdialog" aria-modal="true" aria-labelledby="lb-confirm-title">
            <div className="lb-confirm-icon"><Trash2 size={20} /></div>
            <h3 id="lb-confirm-title">{confirmAction.title}</h3>
            <p>{confirmAction.message}</p>
            <div className="lb-confirm-actions">
              <button
                type="button"
                className="lb-confirm-cancel"
                onClick={() => setConfirmAction(null)}
                disabled={!!busyAction}
              >
                Cancel
              </button>
              <button
                type="button"
                className="lb-confirm-delete"
                onClick={() =>
                  confirmAction.type === "borrow"
                    ? deleteBorrow(confirmAction.id)
                    : deleteLoan(confirmAction.id)
                }
                disabled={!!busyAction}
              >
                {busyAction ? <RefreshCw size={14} className="lb-spin" /> : <Trash2 size={14} />}
                {busyAction ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="lb-toast-wrap">
          <div className={`lb-toast ${toast.type}`}>
            {toast.type === "success" ? <CheckCircle2 size={19} color="#059669" /> : <AlertCircle size={19} color="#dc2626" />}
            <div className="lb-toast-body">
              <b>{toast.type === "success" ? "Success" : "Error"}</b>
              <span>{toast.message}</span>
            </div>
            <button className="lb-toast-close" onClick={() => setToast(null)}><X size={14} /></button>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ icon, iconClass, title, value, sub }) {
  return (
    <div className="lb-stat">
      <div className="lb-stat-top">
        <div>
          <div className="lb-stat-label">{title}</div>
          <div className="lb-stat-value">{value}</div>
          <div className="lb-stat-sub">{sub}</div>
        </div>
        <div className={`lb-stat-icon ${iconClass}`}>{icon}</div>
      </div>
    </div>
  );
}

function RecordCard({
  item,
  type,
  onView,
  onEdit,
  onDelete,
  onPayment,
  onReturn,
}) {
  const status =
    item.calculated_status ||
    item.status ||
    "Active";

  const normalized = status
    .toLowerCase()
    .replace(/\s+/g, "-");

  const name =
    item.person_name ||
    item.bank_name ||
    item.person_or_bank_name ||
    "Unknown";

  const amount =
    item.borrow_amount ||
    item.total_loan_amount ||
    item.total_amount ||
    0;

  const addedDate =
    item.take_date ||
    item.created_at ||
    item.start_date ||
    item.next_emi_date;

  const returnDate =
    item.return_date ||
    null;

  const today = new Date();

  const borrowDurationDays =
    type === "borrow"
      ? daysBetween(
          addedDate,
          returnDate || today
        )
      : null;

  const returnRemainingDays =
    type === "borrow" && !returnDate
      ? daysBetween(today, item.return_date)
      : null;

  const paidEmis = Math.max(
    0,
    Number(
      item.paid_emis ??
        item.emis_paid ??
        item.completed_emis ??
        item.number_of_paid_emis ??
        0
    ) || 0
  );

  const totalEmis = Math.max(
    0,
    Number(item.total_emis || 0)
  );

  const remainingEmis = Math.max(
    0,
    Number(
      item.remaining_emis ??
        (totalEmis > 0
          ? totalEmis - paidEmis
          : 0)
    ) || 0
  );

  const loanRemainingAmount =
    type === "loan"
      ? Math.max(
          0,
          Number(
            item.remaining_amount ??
              item.remaining_loan_amount ??
              (
                Number(
                  item.total_loan_amount || 0
                ) -
                paidEmis *
                  Number(
                    item.emi_amount || 0
                  )
              )
          ) || 0
        )
      : null;

  const nextEmiDays =
    type === "loan" &&
    item.next_emi_date
      ? daysBetween(
          today,
          item.next_emi_date
        )
      : null;

  const nextEmiText =
    type === "loan" &&
    item.next_emi_date
      ? dayText(nextEmiDays)
      : "";

  return (
    <article className="lb-item">
      <div className={`lb-avatar ${type}`}>
        {type === "borrow" ? (
          <UserRound size={19} />
        ) : (
          <Banknote size={19} />
        )}
      </div>

      <div className="lb-main">
        <div className="lb-name">
          {name}
        </div>

        <div className="lb-meta">
          <span>
            Added:{" "}
            {addedDate
              ? new Date(
                  addedDate
                ).toLocaleDateString(
                  "en-IN"
                )
              : "No date"}
          </span>

          <span
            className={`lb-status status-${normalized}`}
          >
            {normalized === "completed" ? (
              <CheckCircle2 size={9} />
            ) : normalized ===
              "overdue" ? (
              <AlertCircle size={9} />
            ) : (
              <Clock3 size={9} />
            )}
            {status}
          </span>
        </div>

        {type === "borrow" && (
          <div className="lb-schedule">
            <span>
              Return:{" "}
              {returnDate
                ? new Date(
                    returnDate
                  ).toLocaleDateString(
                    "en-IN"
                  )
                : "Not set"}
            </span>

            <strong
              className={
                returnDate
                  ? "returned"
                  : borrowDurationDays !==
                      null &&
                    borrowDurationDays < 0
                  ? "overdue"
                  : ""
              }
            >
              {returnDate
                ? `Duration: ${Math.max(
                    0,
                    borrowDurationDays || 0
                  )} day${
                    Math.max(
                      0,
                      borrowDurationDays || 0
                    ) === 1
                      ? ""
                      : "s"
                  }`
                : dayText(
                    returnRemainingDays
                  )}
            </strong>
          </div>
        )}

        {type === "loan" && (
          <div className="lb-loan-metrics">
            <span>
              EMI:{" "}
              {money(
                item.emi_amount
              )}
            </span>

            <span>
              EMIs left:{" "}
              <b>
                {remainingEmis}
              </b>
            </span>

            {item.next_emi_date && (
              <span>
                Next EMI:{" "}
                {new Date(
                  item.next_emi_date
                ).toLocaleDateString(
                  "en-IN"
                )}
              </span>
            )}

            {item.next_emi_date && (
              <strong
                className={
                  nextEmiDays !== null &&
                  nextEmiDays < 0
                    ? "overdue"
                    : ""
                }
              >
                {nextEmiText}
              </strong>
            )}
          </div>
        )}

        {item.notes && (
          <div className="lb-note">
            {item.notes}
          </div>
        )}
      </div>

      <div className="lb-money">
        <strong>
          {money(amount)}
        </strong>

        {type === "loan" ? (
          <>
            <span>
              Remaining{" "}
              {money(loanRemainingAmount)}
            </span>

            <small>
              {remainingEmis} of{" "}
              {totalEmis} EMIs
            </small>
          </>
        ) : (
          <span>
            Remaining{" "}
            {money(
              item.remaining_amount
            )}
          </span>
        )}
      </div>

      <div className="lb-actions">
        <button
          className="lb-action"
          title="View details"
          onClick={onView}
        >
          <Eye size={15} />
        </button>

        {type === "borrow" && onReturn && (
          <button
            className={`lb-action return ${
              busyActionForItem(item.id)
                ? "is-busy"
                : ""
            }`}
            title="Mark returned today"
            onClick={onReturn}
            disabled={
              Boolean(
                window.__loanBusyAction &&
                  window.__loanBusyAction.includes(
                    `return-borrow-${item.id}`
                  )
              ) || returnDate
            }
          >
            {returnDate ? (
              <CheckCircle2 size={15} />
            ) : (
              <RotateCcw size={15} />
            )}
          </button>
        )}

        <button
          className="lb-action pay"
          title={
            type === "borrow"
              ? "Repay"
              : "Pay EMI"
          }
          onClick={onPayment}
        >
          <Send size={15} />
        </button>

        <button
          className="lb-action"
          title="Edit"
          onClick={onEdit}
        >
          <Edit3 size={15} />
        </button>

        <button
          className="lb-action delete"
          title="Delete"
          onClick={onDelete}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

function busyActionForItem(id) {
  return Boolean(
    window.__loanBusyAction ===
      `return-borrow-${id}`
  );
}

function Field({ label, children, full = false }) {
  return <div className={`lb-field ${full ? "full" : ""}`}><label>{label}</label>{children}</div>;
}

function Detail({ label, value }) {
  return (
    <div className="lb-detail">
      <small>{label}</small>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function SaveIcon() {
  return <FileText size={16} />;
}
