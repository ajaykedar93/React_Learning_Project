import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Filter,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

/*
  Payment.jsx
  Backend mount:
    app.use("/api/payments", paymentRoutes);

  Supported:
    GET    /api/payments/?month=YYYY-MM
    GET    /api/payments/:id
    POST   /api/payments/
    PUT    /api/payments/:id
    PUT    /api/payments/:id/receive
    PUT    /api/payments/:id/lost
    PUT    /api/payments/:id/pending
    DELETE /api/payments/:id

  Status:
    pending | received | overdue | lost

  Important:
    - Overdue is calculated automatically by the supplied backend when a
      non-received payment date is in the past.
    - The form also allows the user to manually select every status.
    - Received date/time can be automatic (Now) or manually entered.
    - When adding a payment with a manually selected received time, this page
      first creates the payment and then updates received_at with that time.
*/

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL ||
  "http://localhost:5000/api/payments";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "received", label: "Received" },
  { value: "overdue", label: "Overdue" },
  { value: "lost", label: "Lost" },
];

const CATEGORY_OPTIONS = [
  { value: "work", label: "Work" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
];

const pad = (n) => String(n).padStart(2, "0");

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const dateTimeInput = (value = new Date()) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const monthLabel = (month) => {
  if (!month) return "";
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const shiftMonth = (month, delta) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const displayDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const displayDateTime = (value) => {
  if (!value) return "—";
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

const normalize = (p) => ({
  ...p,
  id: p?.id,
  person_name: p?.person_name || "",
  amount: Number(p?.amount || 0),
  category: String(p?.category || "other").toLowerCase(),
  status: String(p?.status || "pending").toLowerCase(),
  actual_status: String(p?.actual_status || p?.status || "pending").toLowerCase(),
});

async function apiRequest(path, options = {}) {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    "";

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const type = response.headers.get("content-type") || "";
  const body = type.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    throw new Error(
      body?.error || body?.message || `Request failed: ${response.status}`
    );
  }
  return body;
}

function StatusBadge({ status }) {
  const map = {
    pending: ["Pending", "pending"],
    received: ["Received", "received"],
    overdue: ["Overdue", "overdue"],
    lost: ["Lost", "lost"],
  };
  const [label, cls] = map[String(status || "pending").toLowerCase()] || map.pending;
  return <span className={`ps-status ps-status-${cls}`}>{label}</span>;
}

function CategoryBadge({ category }) {
  const value = String(category || "other").toLowerCase();
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return <span className={`ps-category ps-category-${value}`}>{label}</span>;
}

function Toast({ toast, close }) {
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div className="ps-toast-wrap">
      <div className={`ps-toast ps-toast-${toast.type}`}>
        <span className="ps-toast-icon">
          {ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        </span>
        <div className="ps-toast-body">
          <strong>{ok ? "Success" : "Error"}</strong>
          <span>{toast.message}</span>
        </div>
        <button className="ps-icon" onClick={close} aria-label="Close">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

function Modal({ title, children, close, wide = false }) {
  return (
    <div className="ps-backdrop" onMouseDown={close}>
      <div
        className={`ps-modal ${wide ? "ps-modal-wide" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ps-modal-head">
          <div className="ps-modal-title">
            <strong>{title}</strong>
            <span>Manage payment information</span>
          </div>
          <button className="ps-icon" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PaymentForm({ initial, loading, onCancel, onSubmit }) {
  const editing = Boolean(initial?.id);

  const [form, setForm] = useState({
    person_name: initial?.person_name || "",
    amount: initial?.amount != null ? String(initial.amount) : "",
    category: initial?.category || "work",
    payment_date: initial?.payment_date?.slice?.(0, 10) || todayInput(),
    status: initial?.status || "pending",
    received_at: initial?.received_at ? dateTimeInput(initial.received_at) : "",
    receivedMode: initial?.received_at ? "manual" : "auto",
    notes: initial?.notes || "",
  });

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);

    if (!form.person_name.trim()) return;
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!form.payment_date) return;

    let receivedAt = null;
    if (form.status === "received") {
      receivedAt =
        form.receivedMode === "auto"
          ? new Date().toISOString()
          : form.received_at
          ? new Date(form.received_at).toISOString()
          : new Date().toISOString();
    }

    await onSubmit({
      person_name: form.person_name.trim(),
      amount,
      category: form.category,
      payment_date: form.payment_date,
      status: form.status,
      received_at: receivedAt,
      notes: form.notes.trim(),
    });
  };

  return (
    <form className="ps-form" onSubmit={submit}>
      <div className="ps-form-grid">
        <label className="ps-field">
          <span>Person / Company</span>
          <input
            autoFocus
            value={form.person_name}
            onChange={(e) => set("person_name", e.target.value)}
            placeholder="Enter full person or company name"
            maxLength={150}
            required
          />
        </label>

        <label className="ps-field">
          <span>Amount</span>
          <div className="ps-money-input">
            <b>₹</b>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </label>

        <label className="ps-field">
          <span>Category</span>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORY_OPTIONS.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ps-field">
          <span>Payment / Due Date</span>
          <div className="ps-input-icon">
            <CalendarDays size={17} />
            <input
              type="date"
              value={form.payment_date}
              onChange={(e) => set("payment_date", e.target.value)}
              required
            />
          </div>
        </label>

        <label className="ps-field">
          <span>Status</span>
          <select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS_OPTIONS.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
          <small className="ps-help">
            You can manually change to any status. Overdue is also calculated automatically.
          </small>
        </label>

        {form.status === "received" && (
          <div className="ps-field">
            <span>Received Date & Time</span>
            <div className="ps-time-mode">
              <button
                type="button"
                className={form.receivedMode === "auto" ? "active" : ""}
                onClick={() => set("receivedMode", "auto")}
              >
                <Clock3 size={14} /> Auto — Now
              </button>
              <button
                type="button"
                className={form.receivedMode === "manual" ? "active" : ""}
                onClick={() => {
                  set("receivedMode", "manual");
                  if (!form.received_at) set("received_at", dateTimeInput());
                }}
              >
                <CalendarDays size={14} /> Manual
              </button>
            </div>
            {form.receivedMode === "manual" && (
              <input
                className="ps-time-input"
                type="datetime-local"
                value={form.received_at}
                onChange={(e) => set("received_at", e.target.value)}
                required
              />
            )}
            {form.receivedMode === "auto" && (
              <small className="ps-help">The current date and time will be saved automatically.</small>
            )}
          </div>
        )}

        <label className="ps-field ps-full">
          <span>
            Notes <em>Optional</em>
          </span>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Add any useful note or payment reference"
            rows={4}
            maxLength={1000}
          />
        </label>
      </div>

      <div className="ps-form-actions">
        <button type="button" className="ps-btn ps-btn-light" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="ps-btn ps-btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="ps-spin" /> : <Check size={16} />}
          {editing ? "Save changes" : "Add payment"}
        </button>
      </div>
    </form>
  );
}

function Stat({ title, amount, count, tone }) {
  return (
    <div className={`ps-stat ps-tone-${tone}`}>
      <div className="ps-stat-head">
        <span>{title}</span>
        <b>{count}</b>
      </div>
      <strong>{money(amount)}</strong>
    </div>
  );
}

export default function Payment() {
  const [month, setMonth] = useState(currentMonth());
  const [payments, setPayments] = useState([]);
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const notify = useCallback((type, message) => setToast({ type, message }), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const loadPayments = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const response = await apiRequest(`/?month=${encodeURIComponent(month)}`);
        const data = response?.data || {};
        setServerData(data);
        setPayments((data.payments || []).map(normalize));
      } catch (e) {
        notify("error", e.message || "Unable to load payments.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [month, notify]
  );

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Automatic background refresh keeps calculated Overdue status current.
  useEffect(() => {
    const timer = window.setInterval(() => {
      loadPayments(true);
    }, 60000);
    return () => window.clearInterval(timer);
  }, [loadPayments]);

  const refresh = async () => {
    setRefreshing(true);
    await loadPayments(true);
    setRefreshing(false);
  };

  const totals = useMemo(() => {
    const result = { total: 0, received: 0, pending: 0, overdue: 0, lost: 0, count: payments.length };
    payments.forEach((p) => {
      result.total += p.amount;
      if (result[p.actual_status] !== undefined) result[p.actual_status] += p.amount;
    });
    return result;
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...payments]
      .filter((p) => {
        const text = `${p.person_name || ""} ${p.category || ""} ${p.notes || ""}`.toLowerCase();

        return (
          (!q || text.includes(q)) &&
          (statusFilter === "all" || p.actual_status === statusFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.payment_date) - new Date(a.payment_date)
      );
  }, [payments, search, statusFilter]);

  const openAdd = () => {
    setMenuId(null);
    setModal({ type: "add" });
  };

  const openEdit = (payment) => {
    setMenuId(null);
    setModal({ type: "edit", payment });
  };

  const openView = async (payment) => {
    setMenuId(null);
    setActionLoading(true);
    try {
      const response = await apiRequest(`/${payment.id}`);
      setModal({ type: "view", payment: response?.data || response });
    } catch {
      setModal({ type: "view", payment });
    } finally {
      setActionLoading(false);
    }
  };

  const addPayment = async (payload) => {
    setActionLoading(true);
    try {
      const response = await apiRequest("/", {
        method: "POST",
        body: JSON.stringify({
          person_name: payload.person_name,
          amount: payload.amount,
          category: payload.category,
          payment_date: payload.payment_date,
          status: payload.status,
          notes: payload.notes || "",
        }),
      });

      /*
        The supplied POST endpoint automatically sets received_at to current
        time for Received, but does not accept a custom received_at value.
        Therefore, when the user selected a manual received time, perform a
        second PUT using the newly created payment id.
      */
      const created = response?.data;
      if (payload.status === "received" && payload.received_at && created?.id) {
        await apiRequest(`/${created.id}`, {
          method: "PUT",
          body: JSON.stringify({
            received_at: payload.received_at,
            status: "received",
          }),
        });
      }

      setModal(null);
      notify("success", "Payment added successfully.");
      await loadPayments(true);
    } catch (e) {
      notify("error", e.message || "Unable to add payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const updatePayment = async (payload) => {
    const id = modal?.payment?.id;
    if (!id) return;

    setActionLoading(true);
    try {
      await apiRequest(`/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          person_name: payload.person_name,
          amount: payload.amount,
          category: payload.category,
          payment_date: payload.payment_date,
          status: payload.status,
          received_at: payload.status === "received" ? payload.received_at : null,
          notes: payload.notes || "",
        }),
      });

      setModal(null);
      notify("success", "Payment updated successfully.");
      await loadPayments(true);
    } catch (e) {
      notify("error", e.message || "Unable to update payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const changeStatus = async (payment, status) => {
    setMenuId(null);
    setActionLoading(true);

    try {
      if (status === "received") {
        await apiRequest(`/${payment.id}/receive`, { method: "PUT" });
      } else if (status === "lost") {
        await apiRequest(`/${payment.id}/lost`, { method: "PUT" });
      } else if (status === "pending") {
        await apiRequest(`/${payment.id}/pending`, { method: "PUT" });
      } else {
        /*
          Overdue is a valid stored status through the general PUT endpoint.
          This allows the user to manually set Overdue.
        */
        await apiRequest(`/${payment.id}`, {
          method: "PUT",
          body: JSON.stringify({ status: "overdue" }),
        });
      }

      notify("success", `Status changed to ${status}.`);
      await loadPayments(true);
    } catch (e) {
      notify("error", e.message || "Unable to change status.");
    } finally {
      setActionLoading(false);
    }
  };

  const requestDelete = (payment) => {
    setMenuId(null);
    setConfirmDelete(payment);
  };

  const deletePayment = async () => {
    if (!confirmDelete?.id) return;
    const payment = confirmDelete;

    setConfirmDelete(null);
    setActionLoading(true);

    try {
      await apiRequest(`/${payment.id}`, { method: "DELETE" });
      notify("success", "Payment deleted successfully.");
      await loadPayments(true);
    } catch (e) {
      notify("error", e.message || "Unable to delete payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const serverTotals = serverData?.status_totals;
  const receivedTotal = serverTotals ? Number(serverTotals.total_received || 0) : totals.received;
  const pendingTotal = serverTotals ? Number(serverTotals.total_pending || 0) : totals.pending;
  const overdueTotal = serverTotals ? Number(serverTotals.total_overdue || 0) : totals.overdue;
  const lostTotal = serverTotals ? Number(serverTotals.total_lost || 0) : totals.lost;
  const totalAmount = serverTotals ? Number(serverTotals.total_amount || 0) : totals.total;

  return (
    <div className="ps-page">
      <style>{`
        * { box-sizing: border-box; }

        .ps-page {
          min-height: 100vh;
          color: #172033;
          background:
            radial-gradient(circle at 8% 0%, rgba(79,70,229,.09), transparent 28%),
            radial-gradient(circle at 95% 4%, rgba(14,165,233,.07), transparent 25%),
            #f6f8fc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding-bottom: 40px;
        }

        .ps-page button, .ps-page input, .ps-page select, .ps-page textarea { font: inherit; }

        .ps-container {
          width: min(1280px, calc(100% - 28px));
          margin: 0 auto;
        }

        .ps-header {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(18px);
          background: rgba(246,248,252,.90);
          border-bottom: 1px solid rgba(148,163,184,.22);
        }

        .ps-header-inner {
          min-height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .ps-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .ps-brand-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          color: #fff;
          border-radius: 13px;
          background: linear-gradient(135deg,#4f46e5,#7c3aed);
          box-shadow: 0 10px 24px rgba(79,70,229,.23);
        }

        .ps-brand-text { min-width: 0; }
        .ps-brand h1 {
          margin: 0;
          font-size: 19px;
          line-height: 1.25;
          font-weight: 850;
          letter-spacing: -.3px;
          overflow-wrap: anywhere;
        }
        .ps-brand p {
          margin: 3px 0 0;
          color: #667085;
          font-size: 12px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .ps-header-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex: 0 0 auto;
        }

        .ps-btn {
          min-height: 38px;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: .17s ease;
        }
        .ps-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .ps-btn:disabled { opacity: .58; cursor: not-allowed; }

        .ps-btn-primary {
          color: #fff;
          background: linear-gradient(135deg,#4f46e5,#6d28d9);
          box-shadow: 0 8px 18px rgba(79,70,229,.20);
        }
        .ps-btn-light {
          color: #344054;
          background: #fff;
          border-color: #e2e8f0;
        }
        .ps-btn-danger {
          color: #fff;
          background: #dc2626;
          border-color: #dc2626;
        }

        .ps-icon {
          width: 34px;
          height: 34px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          display: inline-grid;
          place-items: center;
          background: #fff;
          color: #667085;
          cursor: pointer;
        }
        .ps-icon:hover {
          color: #4f46e5;
          border-color: #c7d2fe;
          background: #f8faff;
        }

        .ps-main { padding: 24px 0; }

        .ps-month-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 17px;
        }

        .ps-month-title h2 {
          margin: 0;
          font-size: 23px;
          line-height: 1.25;
          font-weight: 850;
          letter-spacing: -.5px;
          overflow-wrap: anywhere;
        }
        .ps-month-title p {
          margin: 4px 0 0;
          color: #667085;
          font-size: 12px;
        }

        .ps-month-control {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .ps-month-control button {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #475467;
          cursor: pointer;
        }
        .ps-month-control button:hover { background:#eef2ff; color:#4f46e5; }
        .ps-month-control span {
          min-width: 125px;
          padding: 0 5px;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .ps-stats {
          display: grid;
          grid-template-columns: repeat(5,minmax(0,1fr));
          gap: 11px;
          margin-bottom: 16px;
        }
        .ps-stat {
          background: #fff;
          border: 1px solid #e7ebf2;
          border-radius: 15px;
          padding: 14px;
          box-shadow: 0 7px 22px rgba(15,23,42,.04);
          min-width: 0;
        }
        .ps-stat-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 9px;
        }
        .ps-stat-head span {
          color: #667085;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .ps-stat-head b {
          color: #7b8798;
          background: #f3f5f8;
          border-radius: 99px;
          padding: 3px 7px;
          font-size: 10px;
          flex: 0 0 auto;
        }
        .ps-stat > strong {
          display: block;
          font-size: 18px;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .ps-tone-total > strong { color:#4f46e5; }
        .ps-tone-received > strong { color:#059669; }
        .ps-tone-pending > strong { color:#b45309; }
        .ps-tone-overdue > strong { color:#dc2626; }
        .ps-tone-lost > strong { color:#64748b; }

        .ps-toolbar {
          background: #fff;
          border: 1px solid #e7ebf2;
          border-radius: 14px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          box-shadow: 0 7px 22px rgba(15,23,42,.04);
        }

        .ps-search {
          position: relative;
          flex: 1 1 250px;
          min-width: 160px;
        }
        .ps-search svg {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #98a2b3;
        }

        .ps-control {
          height: 38px;
          border: 1px solid #e2e8f0;
          background: #fff;
          border-radius: 9px;
          padding: 0 10px;
          color: #344054;
          font-size: 11px;
          font-weight: 700;
          outline: none;
          min-width: 130px;
        }
        .ps-search input {
          width: 100%;
          height: 38px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          padding: 0 12px 0 35px;
          outline: none;
          font-size: 12px;
        }
        .ps-control:focus, .ps-search input:focus, .ps-field input:focus,
        .ps-field select:focus, .ps-field textarea:focus {
          border-color: #a5b4fc;
          box-shadow: 0 0 0 3px rgba(99,102,241,.09);
        }

        .ps-list-card {
          background: #fff;
          border: 1px solid #e7ebf2;
          border-radius: 16px;
          box-shadow: 0 8px 26px rgba(15,23,42,.045);
          overflow: visible;
        }

        .ps-list-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid #edf0f4;
        }
        .ps-list-head strong { font-size: 13px; }
        .ps-list-head span {
          color: #7b8798;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .ps-desktop-table { display: block; }
        .ps-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }
        .ps-table th {
          padding: 10px 12px;
          background: #fafbfc;
          color: #7b8798;
          border-bottom: 1px solid #edf0f4;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .45px;
          text-align: left;
          white-space: normal;
        }
        .ps-table td {
          padding: 12px;
          border-bottom: 1px solid #f0f2f5;
          vertical-align: middle;
          font-size: 12px;
          color: #344054;
        }
        .ps-table tr:last-child td { border-bottom: 0; }
        .ps-table tbody tr { border-left:3px solid transparent; }
        .ps-table tr:hover td { background:#fcfcfe; }
        .ps-table tbody tr:hover { border-left-color:#6366f1; }

        .ps-person {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 160px;
        }
        .ps-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          color: #4f46e5;
          background: #eef2ff;
          border-radius: 10px;
        }
        .ps-person-info { min-width: 0; }
        .ps-person-info strong {
          display: block;
          color: #1f2937;
          font-size: 12px;
          line-height: 1.4;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .ps-person-info span {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .ps-amount {
          font-weight: 850;
          color: #172033;
          white-space: nowrap;
        }

        .ps-status, .ps-category {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          max-width: 100%;
          min-height: 27px;
          padding: 5px 10px 5px 9px;
          border-radius: 999px;
          font-size: 10px;
          line-height: 1.25;
          font-weight: 850;
          letter-spacing: .1px;
          overflow-wrap: anywhere;
          white-space: normal;
          border: 1px solid transparent;
          box-shadow: 0 3px 10px rgba(15,23,42,.05);
          transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
        }
        .ps-status::before {
          content: "";
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 0 3px rgba(255,255,255,.55);
        }
        .ps-status:hover, .ps-category:hover {
          transform: translateY(-1px);
          filter: saturate(1.08);
          box-shadow: 0 7px 16px rgba(15,23,42,.10);
        }
        .ps-status-pending {
          color:#7a4300;
          background:linear-gradient(135deg,#fff4a8,#ffd84d);
          border-color:#f2b900;
          box-shadow:0 6px 18px rgba(234,179,8,.28), inset 0 1px rgba(255,255,255,.75);
        }
        .ps-status-pending::before {
          animation:ps-status-pulse 1.8s ease-in-out infinite;
          box-shadow:0 0 0 3px rgba(234,179,8,.18),0 0 11px rgba(234,179,8,.65);
        }
        .ps-status-received {
          color:#005c3d;
          background:linear-gradient(135deg,#b7f7d8,#39d98a);
          border-color:#10b981;
          box-shadow:0 6px 18px rgba(16,185,129,.27), inset 0 1px rgba(255,255,255,.7);
        }
        .ps-status-received::before {
          box-shadow:0 0 0 3px rgba(16,185,129,.16),0 0 11px rgba(16,185,129,.62);
        }
        .ps-status-overdue {
          color:#9e1027;
          background:linear-gradient(135deg,#ffbdc8,#ff4f68);
          border-color:#ef334f;
          box-shadow:0 6px 18px rgba(239,51,79,.30), inset 0 1px rgba(255,255,255,.65);
        }
        .ps-status-overdue::before {
          animation:ps-status-pulse-danger 1.3s ease-in-out infinite;
          box-shadow:0 0 0 3px rgba(239,51,79,.18),0 0 11px rgba(239,51,79,.72);
        }
        .ps-status-lost {
          color:#fff;
          background:linear-gradient(135deg,#475569,#111827);
          border-color:#1f2937;
          box-shadow:0 6px 18px rgba(15,23,42,.24), inset 0 1px rgba(255,255,255,.14);
        }
        .ps-status-lost::before {
          box-shadow:0 0 0 3px rgba(15,23,42,.14),0 0 9px rgba(15,23,42,.55);
        }
        @keyframes ps-status-pulse {
          0%,100% { transform:scale(1); opacity:.8; }
          50% { transform:scale(1.25); opacity:1; }
        }
        @keyframes ps-status-pulse-danger {
          0%,100% { transform:scale(1); opacity:.75; }
          50% { transform:scale(1.3); opacity:1; }
        }

        .ps-category-work { color:#4338ca; background:#eef2ff; }
        .ps-category-business { color:#0369a1; background:#e0f2fe; }
        .ps-category-other { color:#475569; background:#f1f5f9; }

        .ps-date {
          line-height: 1.4;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .ps-date small {
          display: block;
          color: #98a2b3;
          font-size: 9px;
          margin-top: 2px;
        }

        .ps-row-actions {
          position: relative;
          display: flex;
          justify-content: flex-end;
        }
        .ps-row-action {
          width: 31px;
          height: 31px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          display: inline-grid;
          place-items: center;
          color: #667085;
          cursor: pointer;
        }
        .ps-row-action:hover {
          color: #4f46e5;
          border-color: #c7d2fe;
          background:#f8faff;
        }

        .ps-menu {
          position: absolute;
          right: 0;
          top: 38px;
          z-index: 80;
          width: 205px;
          max-width: min(205px, calc(100vw - 34px));
          padding: 5px;
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:11px;
          box-shadow:0 18px 45px rgba(15,23,42,.16);
        }
        .ps-menu button {
          width:100%;
          min-height:34px;
          display:flex;
          align-items:center;
          gap:8px;
          padding:7px 8px;
          border:0;
          border-radius:8px;
          background:transparent;
          color:#344054;
          text-align:left;
          font-size:11px;
          font-weight:750;
          cursor:pointer;
          white-space:normal;
          line-height:1.35;
          overflow-wrap:anywhere;
          word-break:break-word;
        }
        .ps-menu button:hover { background:#f5f7fb; color:#4f46e5; }
        .ps-menu .danger:hover { color:#dc2626; background:#fff1f2; }
        .ps-menu .received:hover { color:#047857; background:#ecfdf5; }
        .ps-menu .pending:hover { color:#b45309; background:#fffbeb; }
        .ps-menu .overdue:hover { color:#b91c1c; background:#fef2f2; }
        .ps-menu .lost:hover { color:#475569; background:#f1f5f9; }
        .ps-menu-sep { height:1px; background:#edf0f4; margin:4px 3px; }

        .ps-mobile-list {
          display:none;
          padding:10px 0 1px;
        }
        .ps-mobile-card {
          margin:0 10px 10px;
          padding:14px;
          border:1px solid #e7ebf2;
          border-radius:14px;
          background:#fff;
          box-shadow:0 6px 18px rgba(15,23,42,.06);
        }
        .ps-mobile-card:last-child { margin-bottom:10px; }
        .ps-mobile-top {
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:10px;
        }
        .ps-mobile-meta {
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:8px;
          margin-top:11px;
        }
        .ps-mobile-meta div {
          min-width:0;
          padding:8px;
          border-radius:9px;
          background:#f8fafc;
        }
        .ps-mobile-meta span {
          display:block;
          color:#98a2b3;
          font-size:9px;
          margin-bottom:3px;
        }
        .ps-mobile-meta strong {
          display:block;
          font-size:11px;
          line-height:1.35;
          overflow-wrap:anywhere;
          word-break:break-word;
        }

        .ps-empty {
          padding:58px 20px;
          text-align:center;
          color:#7b8798;
        }
        .ps-empty-icon {
          width:50px;
          height:50px;
          display:grid;
          place-items:center;
          margin:0 auto 11px;
          border-radius:14px;
          color:#4f46e5;
          background:#eef2ff;
        }
        .ps-empty strong { display:block; color:#344054; font-size:13px; }
        .ps-empty p { margin:5px 0 14px; font-size:11px; line-height:1.5; }

        .ps-form { padding:17px; }
        .ps-form-grid {
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:14px;
        }
        .ps-field {
          display:flex;
          flex-direction:column;
          gap:6px;
          min-width:0;
        }
        .ps-field.ps-full { grid-column:1 / -1; }
        .ps-field > span {
          color:#344054;
          font-size:11px;
          font-weight:800;
        }
        .ps-field > span em {
          color:#98a2b3;
          font-style:normal;
          font-weight:600;
        }
        .ps-field input, .ps-field select, .ps-field textarea {
          width:100%;
          border:1px solid #dfe5ec;
          border-radius:9px;
          outline:none;
          background:#fff;
          color:#172033;
          padding:10px 11px;
          font-size:12px;
        }
        .ps-field input, .ps-field select { height:40px; }
        .ps-field textarea { resize:vertical; min-height:90px; line-height:1.5; }
        .ps-money-input {
          height:40px;
          display:flex;
          align-items:center;
          border:1px solid #dfe5ec;
          border-radius:9px;
          overflow:hidden;
          background:#fff;
        }
        .ps-money-input b {
          padding-left:11px;
          color:#667085;
          font-size:12px;
        }
        .ps-money-input input {
          height:100%;
          border:0;
          border-radius:0;
          box-shadow:none !important;
        }
        .ps-input-icon {
          position:relative;
        }
        .ps-input-icon svg {
          position:absolute;
          left:11px;
          top:50%;
          transform:translateY(-50%);
          color:#98a2b3;
          pointer-events:none;
        }
        .ps-input-icon input { padding-left:35px; }
        .ps-help {
          color:#98a2b3;
          font-size:9px;
          line-height:1.45;
          overflow-wrap:anywhere;
        }
        .ps-time-mode {
          display:flex;
          gap:6px;
          flex-wrap:wrap;
        }
        .ps-time-mode button {
          min-height:34px;
          border:1px solid #e2e8f0;
          border-radius:8px;
          background:#fff;
          color:#667085;
          padding:0 9px;
          display:inline-flex;
          align-items:center;
          gap:6px;
          cursor:pointer;
          font-size:10px;
          font-weight:800;
        }
        .ps-time-mode button.active {
          color:#4f46e5;
          border-color:#c7d2fe;
          background:#eef2ff;
        }
        .ps-time-input { margin-top:2px; }

        .ps-form-actions {
          display:flex;
          justify-content:flex-end;
          gap:8px;
          padding-top:16px;
          margin-top:16px;
          border-top:1px solid #edf0f4;
        }

        .ps-backdrop {
          position:fixed;
          inset:0;
          z-index:90;
          padding:18px;
          display:grid;
          place-items:center;
          background:rgba(15,23,42,.45);
          backdrop-filter:blur(5px);
        }
        .ps-modal {
          width:min(650px,100%);
          max-height:min(90vh,780px);
          overflow:auto;
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:17px;
          box-shadow:0 30px 80px rgba(15,23,42,.24);
        }
        .ps-modal-wide { width:min(780px,100%); }
        .ps-modal-head {
          position:sticky;
          top:0;
          z-index:2;
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:12px;
          padding:15px 17px;
          background:rgba(255,255,255,.96);
          border-bottom:1px solid #edf0f4;
          backdrop-filter:blur(12px);
        }
        .ps-modal-title strong {
          display:block;
          color:#172033;
          font-size:15px;
          line-height:1.35;
          overflow-wrap:anywhere;
        }
        .ps-modal-title span {
          display:block;
          color:#98a2b3;
          margin-top:2px;
          font-size:10px;
          line-height:1.4;
        }

        .ps-details { padding:17px; }
        .ps-detail-grid {
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:10px;
        }
        .ps-detail {
          min-width:0;
          padding:11px;
          background:#f8fafc;
          border:1px solid #edf0f4;
          border-radius:10px;
        }
        .ps-detail-full { grid-column:1 / -1; }
        .ps-detail span {
          display:block;
          color:#98a2b3;
          font-size:9px;
          margin-bottom:4px;
        }
        .ps-detail strong {
          display:block;
          color:#344054;
          font-size:11px;
          line-height:1.5;
          overflow-wrap:anywhere;
          word-break:break-word;
        }

        .ps-confirm {
          width:min(410px,100%);
          background:#fff;
          border-radius:16px;
          padding:20px;
          box-shadow:0 30px 80px rgba(15,23,42,.25);
        }
        .ps-confirm-icon {
          width:40px;
          height:40px;
          display:grid;
          place-items:center;
          border-radius:11px;
          color:#dc2626;
          background:#fff1f2;
          margin-bottom:12px;
        }
        .ps-confirm h3 { margin:0 0 6px; font-size:15px; }
        .ps-confirm p {
          margin:0;
          color:#667085;
          font-size:11px;
          line-height:1.6;
          overflow-wrap:anywhere;
        }
        .ps-confirm-actions {
          display:flex;
          justify-content:flex-end;
          gap:8px;
          margin-top:17px;
        }

        .ps-toast-wrap {
          position:fixed;
          top:84px;
          left:50%;
          transform:translateX(-50%);
          z-index:120;
          width:min(400px,calc(100% - 28px));
        }
        .ps-toast {
          display:flex;
          align-items:center;
          gap:9px;
          padding:10px;
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:12px;
          box-shadow:0 18px 45px rgba(15,23,42,.16);
        }
        .ps-toast-success .ps-toast-icon { color:#047857; background:#ecfdf5; }
        .ps-toast-error .ps-toast-icon { color:#b91c1c; background:#fef2f2; }
        .ps-toast-icon {
          width:31px;
          height:31px;
          flex:0 0 auto;
          display:grid;
          place-items:center;
          border-radius:8px;
        }
        .ps-toast-body { flex:1; min-width:0; }
        .ps-toast-body strong {
          display:block;
          font-size:10px;
          margin-bottom:2px;
        }
        .ps-toast-body span {
          display:block;
          color:#667085;
          font-size:10px;
          line-height:1.45;
          overflow-wrap:anywhere;
          word-break:break-word;
        }

        .ps-spin { animation: ps-spin .8s linear infinite; }
        @keyframes ps-spin { to { transform:rotate(360deg); } }

        /* Premium responsive polish */
        .ps-page { overflow-x:hidden; }
        .ps-header { box-shadow:0 4px 22px rgba(15,23,42,.045); }
        .ps-header-inner { padding:0 2px; }
        .ps-btn-primary { position:relative; overflow:hidden; }
        .ps-btn-primary::after {
          content:""; position:absolute; inset:0;
          background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,.24) 50%,transparent 75%);
          transform:translateX(-120%); transition:transform .55s ease;
        }
        .ps-btn-primary:hover::after { transform:translateX(120%); }
        .ps-stat { transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .ps-stat:hover { transform:translateY(-3px); box-shadow:0 15px 34px rgba(15,23,42,.09); border-color:#d9e0eb; }
        .ps-table-wrap, .ps-mobile-list { box-shadow:0 10px 30px rgba(15,23,42,.055); }
        .ps-table tbody tr { transition:background .18s ease, transform .18s ease; }
        .ps-table tbody tr:hover { background:#fafbff; }
        .ps-control:focus-within, .ps-search:focus-within { border-color:#a5b4fc !important; box-shadow:0 0 0 3px rgba(99,102,241,.10); }
        .ps-menu { animation:ps-menu-in .16s ease-out; transform-origin:top right; }
        @keyframes ps-menu-in { from{opacity:0;transform:scale(.97) translateY(-3px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .ps-mobile-card { transition:background .18s ease; }
        .ps-mobile-card:hover { background:#fafbff; }
        .ps-modal { box-shadow:0 30px 80px rgba(15,23,42,.22); }
        .ps-modal-head { background:linear-gradient(180deg,#ffffff,#fbfcff); }
        .ps-toast { box-shadow:0 20px 55px rgba(15,23,42,.18); border-color:#dfe5ee; }
        .ps-list-head { background:linear-gradient(180deg,#ffffff,#fbfcff); }
        .ps-person-info strong, .ps-mobile-top strong { overflow-wrap:anywhere; word-break:break-word; }
        .ps-table th, .ps-table td { vertical-align:middle; }
        .ps-category { min-height:25px; padding:4px 9px; }
        .ps-category-work { color:#4338ca; background:linear-gradient(135deg,#eef2ff,#e0e7ff); border-color:#c7d2fe; }
        .ps-category-business { color:#0369a1; background:linear-gradient(135deg,#e0f2fe,#dbeafe); border-color:#bae6fd; }
        .ps-category-other { color:#475569; background:linear-gradient(135deg,#f8fafc,#eef2f7); border-color:#dbe3ec; }

        @media (max-width: 950px) {
          .ps-stats { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .ps-toolbar { flex-wrap:wrap; }
          .ps-search { flex-basis:100%; }
        }

        @media (max-width: 720px) {
          .ps-container { width:min(100% - 14px, 1280px); }
          .ps-main { padding-bottom:22px; }
          .ps-header { padding-top:env(safe-area-inset-top); }
          .ps-header-inner { gap:8px; }
          .ps-header-actions { gap:5px; }
          .ps-brand { gap:9px; }
          .ps-brand-icon { box-shadow:0 7px 18px rgba(79,70,229,.20); }
          .ps-header-inner { min-height:68px; }
          .ps-brand-icon { width:39px; height:39px; border-radius:11px; }
          .ps-brand h1 { font-size:16px; }
          .ps-brand p { display:none; }
          .ps-header-actions .ps-btn span { display:none; }
          .ps-header-actions .ps-btn { width:36px; padding:0; }
          .ps-month-bar { align-items:flex-start; flex-direction:column; }
          .ps-month-control { width:100%; justify-content:space-between; }
          .ps-month-control span { flex:1; }
          .ps-stats { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .ps-form-grid { grid-template-columns:1fr; }
          .ps-field.ps-full { grid-column:auto; }
          .ps-detail-grid { grid-template-columns:1fr; }
          .ps-detail-full { grid-column:auto; }
          .ps-desktop-table { display:none; }
          .ps-mobile-list { display:block; }
          .ps-toolbar .ps-control { flex:0 0 170px; min-width:0; }
          .ps-list-head { align-items:flex-start; flex-direction:column; }
        }

        @media (max-width: 450px) {
          .ps-main { padding-top:14px; }
          .ps-container { width:calc(100% - 12px); }
          .ps-status, .ps-category { font-size:9px; min-height:25px; padding:4px 8px; }
          .ps-status::before { width:6px; height:6px; flex-basis:6px; }
          .ps-mobile-card { margin:0 6px 9px; padding:12px; }
          .ps-stats { grid-template-columns:1fr 1fr; gap:8px; }
          .ps-stat { padding:11px; border-radius:12px; }
          .ps-stat > strong { font-size:15px; }
          .ps-toolbar { padding:8px; }
          .ps-toolbar .ps-control { flex-basis:100%; }
          .ps-form { padding:13px; }
          .ps-modal { border-radius:14px; }
          .ps-backdrop { padding:10px; }
          .ps-form-actions .ps-btn { flex:1; }
        }
      `}</style>

      <header className="ps-header">
        <div className="ps-container ps-header-inner">
          <div className="ps-brand">
            <div className="ps-brand-icon">
              <CheckCircle2 size={22} />
            </div>
            <div className="ps-brand-text">
              <h1>Payment Management</h1>
              <p>Track payments, due dates, status changes and received times</p>
            </div>
          </div>

          <div className="ps-header-actions">
            <button className="ps-btn ps-btn-light" onClick={refresh} disabled={refreshing}>
              {refreshing ? <Loader2 size={15} className="ps-spin" /> : <RefreshCw size={15} />}
              <span>Refresh</span>
            </button>
            <button className="ps-btn ps-btn-primary" onClick={openAdd}>
              <Plus size={15} />
              <span>Add payment</span>
            </button>
          </div>
        </div>
      </header>

      <main className="ps-main">
        <div className="ps-container">
          <div className="ps-month-bar">
            <div className="ps-month-title">
              <h2>{monthLabel(month)}</h2>
              <p>All payment records for the selected month</p>
            </div>

            <div className="ps-month-control">
              <button onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Previous month">
                <ArrowLeft size={16} />
              </button>
              <span>{monthLabel(month)}</span>
              <button onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Next month">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <section className="ps-stats">
            <Stat title="Total amount" amount={totalAmount} count={payments.length} tone="total" />
            <Stat title="Received" amount={receivedTotal} count={payments.filter((p) => p.actual_status === "received").length} tone="received" />
            <Stat title="Pending" amount={pendingTotal} count={payments.filter((p) => p.actual_status === "pending").length} tone="pending" />
            <Stat title="Overdue" amount={overdueTotal} count={payments.filter((p) => p.actual_status === "overdue").length} tone="overdue" />
            <Stat title="Lost" amount={lostTotal} count={payments.filter((p) => p.actual_status === "lost").length} tone="lost" />
          </section>

          <section className="ps-toolbar">
            <div className="ps-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search person, company, category or notes"
              />
            </div>

            <select className="ps-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((x) => (
                <option key={x.value} value={x.value}>{x.label}</option>
              ))}
            </select>



            <button className="ps-icon" onClick={resetFilters} title="Reset filters">
              <Filter size={15} />
            </button>
          </section>

          <section className="ps-list-card">
            <div className="ps-list-head">
              <div>
                <strong>Payments</strong>
                <span> {filtered.length} record{filtered.length === 1 ? "" : "s"} shown</span>
              </div>
              <span>Manual + automatic status tracking</span>
            </div>

            {loading ? (
              <div className="ps-empty">
                <Loader2 className="ps-spin" size={26} />
                <p>Loading payment records...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ps-empty">
                <div className="ps-empty-icon"><UserRound size={22} /></div>
                <strong>No payments found</strong>
                <p>No record matches the current month, search or filters.</p>
                <button className="ps-btn ps-btn-primary" onClick={openAdd}>
                  <Plus size={15} /> Add payment
                </button>
              </div>
            ) : (
              <>
                <div className="ps-desktop-table">
                  <table className="ps-table">
                    <thead>
                      <tr>
                        <th>Person / Company</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Payment date</th>
                        <th>Received date & time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((payment) => (
                        <tr key={payment.id}>
                          <td>
                            <div className="ps-person">
                              <div className="ps-avatar"><UserRound size={16} /></div>
                              <div className="ps-person-info">
                                <strong>{payment.person_name || "Unnamed payment"}</strong>
                                <span>{payment.notes || "No notes added"}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="ps-amount">{money(payment.amount)}</span></td>
                          <td><CategoryBadge category={payment.category} /></td>
                          <td><StatusBadge status={payment.actual_status} /></td>
                          <td>
                            <div className="ps-date">
                              {displayDate(payment.payment_date)}
                              {payment.days_late > 0 && (
                                <small>{payment.days_late} day{payment.days_late === 1 ? "" : "s"} late</small>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="ps-date">
                              {displayDateTime(payment.received_at)}
                              {payment.received_at && <small>Saved received time</small>}
                            </div>
                          </td>
                          <td>
                            <div className="ps-row-actions">
                              <button
                                className="ps-row-action"
                                onClick={() => setMenuId(menuId === payment.id ? null : payment.id)}
                                aria-label={`Actions for ${payment.person_name}`}
                              >
                                <MoreVertical size={16} />
                              </button>

                              {menuId === payment.id && (
                                <div className="ps-menu">
                                  <button onClick={() => openView(payment)}>
                                    <Eye size={14} /> View full details
                                  </button>
                                  <button onClick={() => openEdit(payment)}>
                                    <Edit3 size={14} /> Edit payment
                                  </button>
                                  <div className="ps-menu-sep" />
                                  <button className="received" onClick={() => changeStatus(payment, "received")}>
                                    <Check size={14} /> Change to Received
                                  </button>
                                  <button className="pending" onClick={() => changeStatus(payment, "pending")}>
                                    <Clock3 size={14} /> Change to Pending
                                  </button>
                                  <button className="overdue" onClick={() => changeStatus(payment, "overdue")}>
                                    <AlertCircle size={14} /> Change to Overdue
                                  </button>
                                  <button className="lost" onClick={() => changeStatus(payment, "lost")}>
                                    <XCircle size={14} /> Change to Lost
                                  </button>
                                  <div className="ps-menu-sep" />
                                  <button className="danger" onClick={() => requestDelete(payment)}>
                                    <Trash2 size={14} /> Delete payment
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="ps-mobile-list">
                  {filtered.map((payment) => (
                    <div className="ps-mobile-card" key={payment.id}>
                      <div className="ps-mobile-top">
                        <div className="ps-person">
                          <div className="ps-avatar"><UserRound size={16} /></div>
                          <div className="ps-person-info">
                            <strong>{payment.person_name || "Unnamed payment"}</strong>
                            <span>{payment.notes || "No notes added"}</span>
                          </div>
                        </div>
                        <div className="ps-row-actions">
                          <button
                            className="ps-row-action"
                            onClick={() => setMenuId(menuId === payment.id ? null : payment.id)}
                            aria-label={`Actions for ${payment.person_name}`}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {menuId === payment.id && (
                            <div className="ps-menu">
                              <button onClick={() => openView(payment)}><Eye size={14} /> View full details</button>
                              <button onClick={() => openEdit(payment)}><Edit3 size={14} /> Edit payment</button>
                              <div className="ps-menu-sep" />
                              <button className="received" onClick={() => changeStatus(payment, "received")}><Check size={14} /> Change to Received</button>
                              <button className="pending" onClick={() => changeStatus(payment, "pending")}><Clock3 size={14} /> Change to Pending</button>
                              <button className="overdue" onClick={() => changeStatus(payment, "overdue")}><AlertCircle size={14} /> Change to Overdue</button>
                              <button className="lost" onClick={() => changeStatus(payment, "lost")}><XCircle size={14} /> Change to Lost</button>
                              <div className="ps-menu-sep" />
                              <button className="danger" onClick={() => requestDelete(payment)}><Trash2 size={14} /> Delete payment</button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ps-mobile-meta">
                        <div><span>Amount</span><strong>{money(payment.amount)}</strong></div>
                        <div><span>Status</span><StatusBadge status={payment.actual_status} /></div>
                        <div><span>Category</span><CategoryBadge category={payment.category} /></div>
                        <div><span>Payment date</span><strong>{displayDate(payment.payment_date)}</strong></div>
                        <div><span>Received date & time</span><strong>{displayDateTime(payment.received_at)}</strong></div>
                        <div><span>Delay</span><strong>{payment.delay_message || "On time"}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <Toast toast={toast} close={() => setToast(null)} />

      {confirmDelete && (
        <div className="ps-backdrop" onMouseDown={() => !actionLoading && setConfirmDelete(null)}>
          <div className="ps-confirm" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ps-confirm-icon"><Trash2 size={19} /></div>
            <h3>Delete payment?</h3>
            <p>
              You are deleting the payment for <strong>{confirmDelete.person_name}</strong>.
              {confirmDelete.amount != null ? ` Amount: ${money(confirmDelete.amount)}.` : ""}
              {" "}This action cannot be undone.
            </p>
            <div className="ps-confirm-actions">
              <button className="ps-btn ps-btn-light" onClick={() => setConfirmDelete(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="ps-btn ps-btn-danger" onClick={deletePayment} disabled={actionLoading}>
                {actionLoading ? <Loader2 size={15} className="ps-spin" /> : <Trash2 size={15} />}
                Delete payment
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === "add" && (
        <Modal title="Add payment" close={() => setModal(null)} wide>
          <PaymentForm
            onSubmit={addPayment}
            onCancel={() => setModal(null)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Edit payment" close={() => setModal(null)} wide>
          <PaymentForm
            initial={modal.payment}
            onSubmit={updatePayment}
            onCancel={() => setModal(null)}
            loading={actionLoading}
          />
        </Modal>
      )}

      {modal?.type === "view" && (
        <Modal title="Payment details" close={() => setModal(null)} wide>
          <div className="ps-details">
            <div className="ps-detail-grid">
              <div className="ps-detail">
                <span>Person / Company</span>
                <strong>{modal.payment?.person_name || "—"}</strong>
              </div>
              <div className="ps-detail">
                <span>Amount</span>
                <strong>{money(modal.payment?.amount)}</strong>
              </div>
              <div className="ps-detail">
                <span>Category</span>
                <CategoryBadge category={modal.payment?.category} />
              </div>
              <div className="ps-detail">
                <span>Current status</span>
                <StatusBadge status={modal.payment?.actual_status || modal.payment?.status} />
              </div>
              <div className="ps-detail">
                <span>Stored status</span>
                <strong>{modal.payment?.status || "—"}</strong>
              </div>
              <div className="ps-detail">
                <span>Payment / Due date</span>
                <strong>{displayDate(modal.payment?.payment_date)}</strong>
              </div>
              <div className="ps-detail">
                <span>Received date & time</span>
                <strong>{displayDateTime(modal.payment?.received_at)}</strong>
              </div>
              <div className="ps-detail">
                <span>Delay</span>
                <strong>{modal.payment?.delay_message || "On time"}</strong>
              </div>
              <div className="ps-detail">
                <span>Days to receive</span>
                <strong>{modal.payment?.days_to_receive ?? "—"}</strong>
              </div>
              <div className="ps-detail">
                <span>Last updated</span>
                <strong>{displayDateTime(modal.payment?.updated_at)}</strong>
              </div>
              <div className="ps-detail ps-detail-full">
                <span>Notes</span>
                <strong>{modal.payment?.notes || "No notes added"}</strong>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {actionLoading && (
        <div style={{ position:"fixed", inset:0, zIndex:85, pointerEvents:"none" }} />
      )}
    </div>
  );
}
