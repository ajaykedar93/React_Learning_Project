import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  IndianRupee,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  AlertCircle,
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
const PAYMENT_CATEGORIES = ["Work", "Business", "Other"];

const today = () => new Date().toISOString().slice(0, 10);

const monthValue = () => today().slice(0, 7);

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

const dateDiff = (from, to) => {
  if (!from || !to) return 0;

  const a = new Date(from);
  const b = new Date(to);

  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return 0;
  }

  return Math.ceil((b - a) / 86400000);
};

const formatDifference = (date) => {
  if (!date) return "-";

  const diff = dateDiff(date, today());

  if (date === today()) return "Received today";

  if (date > today()) {
    const remaining = dateDiff(today(), date);

    if (remaining < 30) {
      return `${remaining} day${remaining === 1 ? "" : "s"} until due`;
    }

    const months = Math.floor(remaining / 30);
    const days = remaining % 30;

    return `${months} month${months === 1 ? "" : "s"}${
      days ? ` ${days} day${days === 1 ? "" : "s"}` : ""
    } until due`;
  }

  const overdue = Math.abs(diff);

  if (overdue < 30) {
    return `${overdue} day${overdue === 1 ? "" : "s"} overdue`;
  }

  const months = Math.floor(overdue / 30);
  const days = overdue % 30;

  return `${months} month${months === 1 ? "" : "s"}${
    days ? ` ${days} day${days === 1 ? "" : "s"}` : ""
  } overdue`;
};

const normalizeRows = (result) => {
  const rows =
    result?.data ||
    result?.payments ||
    result?.transactions ||
    result?.rows ||
    result ||
    [];

  return Array.isArray(rows) ? rows : [];
};

const Payment = () => {
  const [month, setMonth] = useState(monthValue());
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    personName: "",
    amount: "",
    paymentDate: today(),
    category: "Work",
    notes: "",
  });

  const headers = () => ({
    "Content-Type": "application/json",
    ...(getToken()
      ? { Authorization: `Bearer ${getToken()}` }
      : {}),
  });

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/payments?month=${encodeURIComponent(month)}`,
        {
          method: "GET",
          headers: headers(),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to load payments."
        );
      }

      setPayments(normalizeRows(result));
      setPage(1);
    } catch (err) {
      console.error("Payment GET error:", err);
      setError(err.message || "Failed to load payments.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [month]);

  const resetForm = () => {
    setForm({
      personName: "",
      amount: "",
      paymentDate: today(),
      category: "Work",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      personName: "",
      amount: "",
      // Payment date is always current date for new pending payments.
      paymentDate: today(),
      category: "Work",
      notes: "",
    });
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const openEdit = (payment) => {
    setEditingId(payment.id);

    setForm({
      personName:
        payment.person_name ||
        payment.personName ||
        payment.name ||
        "",
      amount: String(payment.amount ?? ""),
      paymentDate:
        payment.payment_date ||
        payment.transaction_date ||
        payment.paymentDate ||
        today(),
      category: payment.category || "Work",
      notes: payment.notes || "",
    });

    setError("");
    setMessage("");
    setShowForm(true);
  };

  const submitPayment = async (event) => {
    event.preventDefault();

    if (!form.personName.trim()) {
      setError("Please enter the person or payment name.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (!PAYMENT_CATEGORIES.includes(form.category)) {
      setError("Please select a valid payment category.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const isEdit = Boolean(editingId);

      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/payments/${editingId}`
          : `${API_BASE_URL}/api/payments`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: headers(),
          body: JSON.stringify({
            person_name: form.personName.trim(),
            amount,
            // Backend should enforce CURRENT_DATE for new entries.
            payment_date: isEdit ? form.paymentDate : today(),
            category: form.category,
            notes: form.notes.trim() || null,
            month,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            `Failed to ${isEdit ? "update" : "add"} payment.`
        );
      }

      setMessage(
        isEdit
          ? "Payment updated successfully."
          : "Pending payment added successfully."
      );

      resetForm();
      await loadPayments();
    } catch (err) {
      console.error("Payment save error:", err);
      setError(err.message || "Unable to save payment.");
    } finally {
      setSaving(false);
    }
  };

  const markReceived = async (payment) => {
    if (!window.confirm("Mark this payment as received now?")) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/payments/${payment.id}/received`,
        {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({
            received_date: today(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to mark payment as received."
        );
      }

      setMessage("Payment marked as received.");
      await loadPayments();
    } catch (err) {
      console.error("Payment received error:", err);
      setError(err.message || "Unable to update payment status.");
    }
  };

  const deletePayment = async (id) => {
    if (!window.confirm("Delete this payment permanently?")) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/payments/${id}`,
        {
          method: "DELETE",
          headers: headers(),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to delete payment."
        );
      }

      setMessage("Payment deleted successfully.");
      await loadPayments();
    } catch (err) {
      console.error("Payment delete error:", err);
      setError(err.message || "Unable to delete payment.");
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const status =
        String(item.status || "Pending").toLowerCase();
      const category = item.category || "Work";

      const statusMatch =
        statusFilter === "All" ||
        status.toLowerCase() === statusFilter.toLowerCase();

      const categoryMatch =
        categoryFilter === "All" ||
        category === categoryFilter;

      return statusMatch && categoryMatch;
    });
  }, [payments, statusFilter, categoryFilter]);

  const pendingPayments = payments.filter(
    (item) =>
      String(item.status || "Pending").toLowerCase() ===
      "pending"
  );

  const receivedPayments = payments.filter(
    (item) =>
      String(item.status || "").toLowerCase() ===
      "received"
  );

  const overduePayments = pendingPayments.filter((item) => {
    const dueDate =
      item.payment_date ||
      item.transaction_date ||
      item.paymentDate;

    return dueDate && dueDate < today();
  });

  const lostPayments = pendingPayments.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    const value = String(
      item.payment_status ||
        item.paymentStatus ||
        ""
    ).toLowerCase();

    return (
      status === "lost" ||
      value === "lost" ||
      value === "not_received"
    );
  });

  const totalPending = pendingPayments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalReceived = receivedPayments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / PAGE_SIZE)
  );

  const visiblePayments = filteredPayments.slice(
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
    <div className="payment-page">
      <style>{styles}</style>

      <header className="payment-header">
        <div>
          <div className="payment-title">
            <IndianRupee size={22} />
            <h1>Payments</h1>
          </div>
          <p>
            Track pending, received and overdue payments for{" "}
            {monthLabel}.
          </p>
        </div>

        <div className="payment-actions">
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
            onClick={loadPayments}
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>

          <button className="add-button" onClick={openAdd}>
            <Plus size={17} />
            Add Payment
          </button>
        </div>
      </header>

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

      <section className="payment-stats">
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock3 size={19} />
          </div>
          <span>Pending</span>
          <strong>{money(totalPending)}</strong>
          <small>{pendingPayments.length} payments</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon received">
            <CheckCircle2 size={19} />
          </div>
          <span>Received</span>
          <strong>{money(totalReceived)}</strong>
          <small>{receivedPayments.length} payments</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon overdue">
            <AlertCircle size={19} />
          </div>
          <span>Overdue</span>
          <strong>{overduePayments.length}</strong>
          <small>Pending past payment date</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon lost">
            <BriefcaseBusiness size={19} />
          </div>
          <span>Lost / Not Received</span>
          <strong>{lostPayments.length}</strong>
          <small>Payments not received</small>
        </div>
      </section>

      <section className="payment-panel">
        <div className="panel-header">
          <div>
            <h2>Payment Details</h2>
            <p>
              New pending payments use the current date automatically.
            </p>
          </div>

          <div className="filters">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Categories</option>
              {PAYMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw className="spin" size={26} />
            <span>Loading payments...</span>
          </div>
        ) : visiblePayments.length === 0 ? (
          <div className="empty-state">
            <IndianRupee size={28} />
            <span>No payment details found.</span>
          </div>
        ) : (
          <>
            <div className="payment-list">
              {visiblePayments.map((payment) => {
                const status =
                  String(payment.status || "Pending")
                    .toLowerCase();

                const paymentDate =
                  payment.payment_date ||
                  payment.transaction_date ||
                  payment.paymentDate;

                const receivedDate =
                  payment.received_date ||
                  payment.receivedDate;

                const differenceDate =
                  status === "received"
                    ? receivedDate || paymentDate
                    : paymentDate;

                const isOverdue =
                  status === "pending" &&
                  paymentDate &&
                  paymentDate < today();

                const category =
                  payment.category || "Work";

                return (
                  <article
                    className={`payment-item ${
                      isOverdue ? "is-overdue" : ""
                    }`}
                    key={payment.id}
                  >
                    <div className="payment-main">
                      <div className="payment-icon">
                        {category === "Business" ? (
                          <Building2 size={18} />
                        ) : category === "Work" ? (
                          <BriefcaseBusiness size={18} />
                        ) : (
                          <IndianRupee size={18} />
                        )}
                      </div>

                      <div className="payment-info">
                        <div className="name-row">
                          <h3>
                            {payment.person_name ||
                              payment.personName ||
                              payment.name ||
                              "-"}
                          </h3>

                          <span className="category-tag">
                            {category}
                          </span>

                          <span
                            className={`status-tag ${
                              status === "received"
                                ? "received-tag"
                                : status === "lost"
                                ? "lost-tag"
                                : isOverdue
                                ? "overdue-tag"
                                : "pending-tag"
                            }`}
                          >
                            {status === "received"
                              ? "Received"
                              : status === "lost"
                              ? "Lost"
                              : isOverdue
                              ? "Overdue"
                              : "Pending"}
                          </span>
                        </div>

                        <div className="date-info">
                          <span>
                            Payment date: {paymentDate || "-"}
                          </span>

                          {status === "received" &&
                            receivedDate && (
                              <span>
                                Received: {receivedDate}
                              </span>
                            )}
                        </div>

                        <div
                          className={`difference ${
                            isOverdue ? "overdue-text" : ""
                          }`}
                        >
                          <Clock3 size={13} />
                          <span>
                            {status === "received"
                              ? `Difference: ${formatDifference(
                                  paymentDate
                                )}`
                              : formatDifference(paymentDate)}
                          </span>
                        </div>

                        {payment.notes && (
                          <div className="notes">
                            <FileText size={13} />
                            <span>{payment.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="payment-right">
                      <strong>{money(payment.amount)}</strong>

                      <div className="payment-actions-row">
                        {status === "pending" && (
                          <button
                            className="received-button"
                            onClick={() =>
                              markReceived(payment)
                            }
                          >
                            <CheckCircle2 size={14} />
                            Received
                          </button>
                        )}

                        <button
                          className="edit-button"
                          onClick={() =>
                            openEdit(payment)
                          }
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            deletePayment(payment.id)
                          }
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

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) resetForm();
          }}
        >
          <form
            className="payment-modal"
            onSubmit={submitPayment}
          >
            <div className="modal-heading">
              <div>
                <h2>
                  {editingId
                    ? "Update Payment"
                    : "Add Pending Payment"}
                </h2>
                <p>
                  Category: Work, Business or Other.
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
              Person / Payment Name
              <input
                type="text"
                placeholder="Enter person or payment name"
                value={form.personName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    personName: e.target.value,
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

            <label>
              Category
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value,
                  }))
                }
              >
                {PAYMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Payment Date
              <input
                type="date"
                value={form.paymentDate}
                disabled={!editingId}
                max={today()}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    paymentDate: e.target.value,
                  }))
                }
              />
              <small className="field-help">
                New pending payments always use today's date.
              </small>
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
                    {editingId ? "Update" : "Add Pending"}
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
.payment-page {
  width: 100%;
  min-height: 100%;
  padding: 18px;
  color: #fff;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.payment-header,
.payment-title,
.payment-actions,
.panel-header,
.name-row,
.date-info,
.payment-main,
.payment-right,
.payment-actions-row,
.modal-heading,
.modal-actions {
  display: flex;
  align-items: center;
}

.payment-header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.payment-title {
  gap: 9px;
}

.payment-title h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
}

.payment-header p,
.panel-header p {
  margin: 5px 0 0;
  color: rgba(255,255,255,.5);
  font-size: .76rem;
  line-height: 1.45;
}

.payment-actions {
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

.payment-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card,
.payment-panel {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0,0,0,.14);
}

.stat-card {
  padding: 15px;
}

.stat-icon {
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  border-radius: 10px;
}

.stat-icon.pending {
  color: #fcd34d;
  background: rgba(245,158,11,.1);
}

.stat-icon.received {
  color: #6ee7b7;
  background: rgba(16,185,129,.1);
}

.stat-icon.overdue {
  color: #fca5a5;
  background: rgba(239,68,68,.1);
}

.stat-icon.lost {
  color: #c4b5fd;
  background: rgba(124,58,237,.1);
}

.stat-card span {
  display: block;
  margin-top: 10px;
  color: rgba(255,255,255,.5);
  font-size: .69rem;
}

.stat-card strong {
  display: block;
  margin-top: 4px;
  font-size: 1rem;
  overflow-wrap: anywhere;
}

.stat-card small {
  display: block;
  margin-top: 4px;
  color: rgba(255,255,255,.35);
  font-size: .6rem;
}

.payment-panel {
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

.filters {
  display: flex;
  gap: 7px;
}

.filters select {
  min-width: 125px;
  height: 36px;
  padding: 0 9px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 9px;
  color: #fff;
  background: #111827;
  outline: 0;
}

.payment-list {
  display: grid;
  gap: 9px;
}

.payment-item {
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

.payment-item:hover {
  transform: translateY(-1px);
  border-color: rgba(103,232,249,.25);
}

.payment-item.is-overdue {
  border-color: rgba(239,68,68,.18);
}

.payment-main {
  min-width: 0;
  gap: 10px;
}

.payment-icon {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: #67e8f9;
  background: rgba(34,211,238,.1);
}

.payment-info {
  min-width: 0;
}

.name-row {
  flex-wrap: wrap;
  gap: 6px;
}

.name-row h3 {
  margin: 0;
  font-size: .78rem;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.category-tag,
.status-tag {
  padding: 4px 7px;
  border-radius: 7px;
  font-size: .55rem;
  font-weight: 750;
}

.category-tag {
  color: #a5b4fc;
  background: rgba(99,102,241,.1);
}

.pending-tag {
  color: #fcd34d;
  background: rgba(245,158,11,.1);
}

.received-tag {
  color: #6ee7b7;
  background: rgba(16,185,129,.1);
}

.overdue-tag,
.lost-tag {
  color: #fca5a5;
  background: rgba(239,68,68,.1);
}

.date-info {
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 5px;
  color: rgba(255,255,255,.4);
  font-size: .62rem;
}

.difference {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  color: #fcd34d;
  font-size: .62rem;
}

.overdue-text {
  color: #fca5a5;
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

.payment-right {
  flex: 0 0 auto;
  align-items: flex-end;
  flex-direction: column;
  gap: 8px;
}

.payment-right > strong {
  font-size: .83rem;
  white-space: nowrap;
}

.payment-actions-row {
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 5px;
}

.received-button,
.edit-button,
.delete-button {
  min-height: 29px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 8px;
  cursor: pointer;
  font-size: .6rem;
  font-weight: 700;
}

.received-button {
  padding: 0 8px;
  color: #6ee7b7;
  background: rgba(16,185,129,.08);
  border: 1px solid rgba(16,185,129,.18);
}

.edit-button,
.delete-button {
  width: 29px;
  padding: 0;
  color: rgba(255,255,255,.65);
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
}

.delete-button:hover {
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

.payment-modal {
  width: min(450px, 100%);
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

.payment-modal label {
  display: block;
  margin-bottom: 13px;
  color: rgba(255,255,255,.72);
  font-size: .68rem;
  font-weight: 650;
}

.payment-modal label span {
  color: rgba(255,255,255,.35);
  font-weight: 400;
}

.payment-modal input,
.payment-modal select,
.payment-modal textarea {
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

.payment-modal input,
.payment-modal select {
  height: 39px;
  padding: 0 10px;
}

.payment-modal textarea {
  padding: 9px 10px;
  resize: vertical;
  line-height: 1.45;
}

.payment-modal input:focus,
.payment-modal select:focus,
.payment-modal textarea:focus {
  border-color: rgba(103,232,249,.5);
  box-shadow: 0 0 0 3px rgba(34,211,238,.06);
}

.payment-modal input:disabled {
  opacity: .55;
  cursor: not-allowed;
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

.field-help {
  display: block;
  margin-top: 4px;
  color: rgba(255,255,255,.35);
  font-size: .58rem;
  font-weight: 400;
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
  .payment-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 800px) {
  .payment-page {
    padding: 10px;
  }

  .payment-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .payment-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .month-picker {
    flex: 1;
  }

  .month-picker input {
    width: 100%;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .filters {
    width: 100%;
  }

  .filters select {
    flex: 1;
  }
}

@media (max-width: 560px) {
  .payment-page {
    padding: 8px;
  }

  .payment-title h1 {
    font-size: 1.15rem;
  }

  .payment-stats {
    grid-template-columns: 1fr;
  }

  .payment-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .payment-right {
    width: 100%;
    align-items: flex-start;
  }

  .payment-actions-row {
    justify-content: flex-start;
  }

  .filters {
    flex-direction: column;
  }

  .filters select {
    width: 100%;
  }

  .payment-modal {
    padding: 15px;
  }
}
`;

export default Payment;
