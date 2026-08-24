import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_BASE =
    "https://express-project-learning-new.onrender.com/api/trading-dip-with";

const DEFAULT_BROKERS = [
    "Groww",
    "Zerodha",
    "Dhan",
    "XM",
    "Lemon",
    "MetaTrader",
];

const emptyForm = {
    type: "Deposit",
    amount: "",
    broker_name: "",
    date: "",
    notes: "",
};

function formatMoney(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function Trading_dip_with() {
    const { user } = useAuth();

    const userId =
        user?.id ??
        user?.user_id ??
        user?.userId ??
        "";

    const [entries, setEntries] = useState([]);
    const [brokers, setBrokers] = useState(DEFAULT_BROKERS);

    const [form, setForm] = useState(emptyForm);

    const [month, setMonth] = useState(
        String(new Date().getMonth() + 1).padStart(2, "0")
    );

    const [year, setYear] = useState(
        String(new Date().getFullYear())
    );

    const [summary, setSummary] = useState({
        total_deposit: 0,
        total_withdrawal: 0,
        net_cash_flow: 0,
    });

    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [filterBroker, setFilterBroker] = useState("All");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [showBrokerInput, setShowBrokerInput] = useState(false);
    const [newBroker, setNewBroker] = useState("");

    const [alert, setAlert] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const showAlert = (type, message) => {
        setAlert({ type, message });

        setTimeout(() => {
            setAlert(null);
        }, 3500);
    };

    const loadEntries = async () => {
        if (!userId) {
            setLoading(false);

            showAlert(
                "error",
                "User ID not found. Please login again."
            );

            return;
        }

        try {
            setLoading(true);

            const params = new URLSearchParams({
                user_id: userId,
                month,
                year,
            });

            const response = await fetch(
                `${API_BASE}?${params.toString()}`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                        "Failed to load transactions"
                );
            }

            setEntries(data.data || []);
        } catch (error) {
            console.error(error);

            showAlert(
                "error",
                error.message ||
                    "Unable to load transactions"
            );
        } finally {
            setLoading(false);
        }
    };

    const loadSummary = async () => {
        if (!userId) return;

        try {
            const params = new URLSearchParams({
                user_id: userId,
                month,
                year,
            });

            const response = await fetch(
                `${API_BASE}/summary/monthly?${params.toString()}`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                        "Failed to load summary"
                );
            }

            setSummary({
                total_deposit:
                    Number(data.total_deposit || 0),

                total_withdrawal:
                    Number(data.total_withdrawal || 0),

                net_cash_flow:
                    Number(data.net_cash_flow || 0),
            });
        } catch (error) {
            console.error(error);

            showAlert(
                "error",
                error.message ||
                    "Unable to calculate summary"
            );
        }
    };

    const loadBrokers = async () => {
        if (!userId) return;

        try {
            const response = await fetch(
                `${API_BASE}/brokers/list?user_id=${encodeURIComponent(
                    userId
                )}`
            );

            const data = await response.json();

            if (response.ok && data.success) {
                setBrokers([
                    ...new Set([
                        ...DEFAULT_BROKERS,
                        ...(data.brokers || []),
                    ]),
                ]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadEntries();
        loadSummary();
        loadBrokers();
    }, [userId, month, year]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const addBroker = () => {
        const name = newBroker.trim();

        if (!name) {
            showAlert(
                "warning",
                "Enter broker name first."
            );
            return;
        }

        const existing = brokers.find(
            (broker) =>
                broker.toLowerCase() ===
                name.toLowerCase()
        );

        if (existing) {
            setForm((prev) => ({
                ...prev,
                broker_name: existing,
            }));

            setShowBrokerInput(false);
            setNewBroker("");

            return;
        }

        setBrokers((prev) => [
            ...prev,
            name,
        ]);

        setForm((prev) => ({
            ...prev,
            broker_name: name,
        }));

        setNewBroker("");
        setShowBrokerInput(false);

        showAlert(
            "success",
            "New broker added."
        );
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setShowBrokerInput(false);
        setNewBroker("");
    };

    const validateForm = () => {
        if (!form.amount || Number(form.amount) <= 0) {
            showAlert(
                "warning",
                "Enter a valid amount."
            );
            return false;
        }

        if (!form.broker_name.trim()) {
            showAlert(
                "warning",
                "Select or add a broker."
            );
            return false;
        }

        if (!form.date) {
            showAlert(
                "warning",
                "Select a date."
            );
            return false;
        }

        return true;
    };

    const saveTransaction = async (e) => {
        e.preventDefault();

        if (!userId) {
            showAlert(
                "error",
                "User session not found."
            );
            return;
        }

        if (!validateForm()) return;

        try {
            setSaving(true);

            const payload = {
                user_id: Number(userId),
                type: form.type,
                amount: Number(form.amount),
                broker_name:
                    form.broker_name.trim(),
                date: form.date,
                notes:
                    form.notes.trim() || null,
            };

            const response = await fetch(
                editingId
                    ? `${API_BASE}/${editingId}`
                    : API_BASE,
                {
                    method: editingId
                        ? "PUT"
                        : "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                        "Unable to save transaction"
                );
            }

            showAlert(
                "success",
                editingId
                    ? "Transaction updated successfully."
                    : `${form.type} added successfully.`
            );

            resetForm();

            await Promise.all([
                loadEntries(),
                loadSummary(),
                loadBrokers(),
            ]);
        } catch (error) {
            console.error(error);

            showAlert(
                "error",
                error.message ||
                    "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    };

    const editEntry = (entry) => {
        setEditingId(entry.id);

        setForm({
            type: entry.type || "Deposit",
            amount: entry.amount ?? "",
            broker_name:
                entry.broker_name || "",
            date: entry.date || "",
            notes: entry.notes || "",
        });

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const deleteEntry = async () => {
        if (!confirmDelete) return;

        try {
            const response = await fetch(
                `${API_BASE}/${confirmDelete.id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                        "Delete failed"
                );
            }

            setConfirmDelete(null);

            showAlert(
                "success",
                "Transaction deleted successfully."
            );

            await Promise.all([
                loadEntries(),
                loadSummary(),
            ]);
        } catch (error) {
            console.error(error);

            showAlert(
                "error",
                error.message ||
                    "Unable to delete transaction."
            );
        }
    };

    const filteredEntries = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        return entries.filter((entry) => {
            const matchesSearch =
                !query ||
                String(entry.broker_name || "")
                    .toLowerCase()
                    .includes(query) ||
                String(entry.notes || "")
                    .toLowerCase()
                    .includes(query);

            const matchesType =
                filterType === "All" ||
                entry.type === filterType;

            const matchesBroker =
                filterBroker === "All" ||
                entry.broker_name ===
                    filterBroker;

            return (
                matchesSearch &&
                matchesType &&
                matchesBroker
            );
        });
    }, [
        entries,
        search,
        filterType,
        filterBroker,
    ]);

    const monthName = new Date(
        Number(year),
        Number(month) - 1,
        1
    ).toLocaleString("en-IN", {
        month: "long",
    });

    if (!user) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "#f8fafc",
                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
                <div style={{
                    width: "min(420px, 100%)",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "28px",
                    textAlign: "center",
                    boxShadow: "0 15px 45px rgba(15,23,42,.08)"
                }}>
                    <div style={{ fontSize: "34px", marginBottom: "10px" }}>🔐</div>
                    <h2 style={{ margin: "0 0 8px", color: "#172033" }}>Login Required</h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                        Please login to view your deposit and withdrawal records.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="dw-page">

            <style>{`
                * {
                    box-sizing: border-box;
                }

                .dw-page {
                    min-height: 100vh;
                    width: 100%;
                    padding: 0;
                    background:
                        radial-gradient(
                            circle at top right,
                            rgba(16,185,129,.10),
                            transparent 30%
                        ),
                        linear-gradient(
                            135deg,
                            #f8fafc,
                            #eef2f7
                        );
                    color: #172033;
                    font-family:
                        Inter,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }

                .dw-container {
                    max-width: 1200px;
                    margin: auto;
                }

                .dw-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 18px;
                    margin-bottom: 22px;
                }

                .dw-title h1 {
                    margin: 0;
                    font-size: clamp(23px, 4vw, 31px);
                    font-weight: 800;
                    letter-spacing: -.7px;
                }

                .dw-title p {
                    margin: 6px 0 0;
                    color: #64748b;
                    font-size: 14px;
                }

                .dw-actions {
                    display: flex;
                    gap: 8px;
                }

                .dw-btn {
                    min-height: 42px;
                    padding: 10px 15px;
                    border: 0;
                    border-radius: 11px;
                    cursor: pointer;
                    font-weight: 750;
                    transition: .2s ease;
                }

                .dw-btn:hover {
                    transform: translateY(-2px);
                }

                .dw-primary {
                    color: white;
                    background: #2563eb;
                    box-shadow:
                        0 7px 18px
                        rgba(37,99,235,.20);
                }

                .dw-secondary {
                    background: white;
                    color: #334155;
                    border: 1px solid #dbe2ea;
                }

                .dw-danger {
                    color: #b91c1c;
                    background: #fee2e2;
                }

                .dw-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 14px;
                }

                .dw-month {
                    display: flex;
                    gap: 8px;
                }

                .dw-select,
                .dw-input,
                .dw-textarea {
                    width: 100%;
                    min-height: 43px;
                    border: 1px solid #d7dee8;
                    background: white;
                    border-radius: 10px;
                    padding: 10px 12px;
                    outline: none;
                    color: #172033;
                    font-size: 14px;
                    transition: .2s ease;
                }

                .dw-select:focus,
                .dw-input:focus,
                .dw-textarea:focus {
                    border-color: #3b82f6;
                    box-shadow:
                        0 0 0 3px
                        rgba(59,130,246,.10);
                }

                .dw-month .dw-select:first-child {
                    width: 145px;
                }

                .dw-month .dw-select:last-child {
                    width: 105px;
                }

                .dw-summary {
                    display: grid;
                    grid-template-columns:
                        repeat(3, minmax(0,1fr));
                    gap: 13px;
                    margin-bottom: 22px;
                }

                .dw-summary-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 18px;
                    box-shadow:
                        0 8px 28px
                        rgba(15,23,42,.05);
                    animation: dwIn .45s ease both;
                }

                .dw-label {
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: .5px;
                }

                .dw-value {
                    margin-top: 7px;
                    font-size: 24px;
                    font-weight: 800;
                    overflow-wrap: anywhere;
                }

                .dw-deposit {
                    color: #059669;
                }

                .dw-withdrawal {
                    color: #dc2626;
                }

                .dw-net {
                    color: #2563eb;
                }

                .dw-form {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 20px;
                    margin-bottom: 22px;
                    box-shadow:
                        0 12px 35px
                        rgba(15,23,42,.06);
                    animation: dwSlide .35s ease;
                }

                .dw-form-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 17px;
                }

                .dw-form-header h2 {
                    margin: 0;
                    font-size: 19px;
                }

                .dw-form-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0,1fr));
                    gap: 15px;
                }

                .dw-field label {
                    display: block;
                    margin-bottom: 7px;
                    font-size: 12px;
                    font-weight: 800;
                    color: #475569;
                }

                .dw-full {
                    grid-column: 1 / -1;
                }

                .dw-type {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .dw-type button {
                    min-height: 43px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 800;
                    background: #f8fafc;
                    border: 1px solid #dbe2ea;
                    color: #64748b;
                }

                .dw-type button.active-deposit {
                    color: #047857;
                    background: #dcfce7;
                    border-color: #86efac;
                }

                .dw-type button.active-withdrawal {
                    color: #b91c1c;
                    background: #fee2e2;
                    border-color: #fecaca;
                }

                .dw-broker {
                    display: flex;
                    gap: 7px;
                }

                .dw-broker .dw-select {
                    flex: 1;
                    min-width: 0;
                }

                .dw-add {
                    width: 43px;
                    border: 1px solid #cbd5e1;
                    background: #f8fafc;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 19px;
                    color: #2563eb;
                    font-weight: 800;
                }

                .dw-new-broker {
                    display: flex;
                    gap: 7px;
                    margin-top: 8px;
                }

                .dw-textarea {
                    min-height: 85px;
                    resize: vertical;
                }

                .dw-form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    margin-top: 18px;
                }

                .dw-history {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    overflow: hidden;
                    box-shadow:
                        0 12px 35px
                        rgba(15,23,42,.05);
                }

                .dw-history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    padding: 17px;
                    border-bottom: 1px solid #edf1f5;
                }

                .dw-history-header h2 {
                    margin: 0;
                    font-size: 19px;
                }

                .dw-filter {
                    display: grid;
                    grid-template-columns:
                        1.5fr .8fr .9fr;
                    gap: 8px;
                    padding: 14px 17px;
                    background: #f8fafc;
                    border-bottom: 1px solid #edf1f5;
                }

                .dw-list {
                    padding: 10px;
                }

                .dw-card {
                    display: grid;
                    grid-template-columns:
                        1.2fr .8fr .8fr .8fr auto;
                    align-items: center;
                    gap: 14px;
                    padding: 15px;
                    margin-bottom: 8px;
                    border: 1px solid #edf1f5;
                    border-radius: 13px;
                    transition: .2s ease;
                }

                .dw-card:hover {
                    transform: translateY(-2px);
                    border-color: #dbeafe;
                    box-shadow:
                        0 7px 22px
                        rgba(15,23,42,.06);
                }

                .dw-broker-name {
                    font-weight: 800;
                    overflow-wrap: anywhere;
                }

                .dw-date {
                    margin-top: 4px;
                    color: #64748b;
                    font-size: 12px;
                }

                .dw-card-label {
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    margin-bottom: 3px;
                }

                .dw-card-value {
                    font-weight: 700;
                    overflow-wrap: anywhere;
                }

                .dw-badge {
                    display: inline-flex;
                    padding: 5px 9px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 800;
                }

                .dw-badge-deposit {
                    color: #15803d;
                    background: #dcfce7;
                }

                .dw-badge-withdrawal {
                    color: #b91c1c;
                    background: #fee2e2;
                }

                .dw-card-actions {
                    display: flex;
                    gap: 6px;
                }

                .dw-icon {
                    width: 36px;
                    height: 36px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    border-radius: 9px;
                    cursor: pointer;
                    transition: .2s;
                }

                .dw-icon:hover {
                    background: #f1f5f9;
                    transform: translateY(-1px);
                }

                .dw-empty,
                .dw-loading {
                    text-align: center;
                    padding: 50px 20px;
                    color: #64748b;
                }

                .dw-spinner {
                    width: 28px;
                    height: 28px;
                    border: 3px solid #dbeafe;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    margin: 0 auto 10px;
                    animation: dwSpin .8s linear infinite;
                }

                .dw-toast-container {
                    position: fixed;
                    top: 18px;
                    right: 18px;
                    width: min(380px, calc(100vw - 36px));
                    z-index: 9999;
                }

                .dw-toast {
                    background: white;
                    padding: 14px 16px;
                    border-radius: 13px;
                    border-left: 4px solid #2563eb;
                    box-shadow:
                        0 15px 45px
                        rgba(15,23,42,.18);
                    animation: dwToast .3s ease;
                    font-size: 14px;
                    font-weight: 700;
                }

                .dw-toast.success {
                    border-left-color: #16a34a;
                }

                .dw-toast.error {
                    border-left-color: #dc2626;
                }

                .dw-toast.warning {
                    border-left-color: #f59e0b;
                }

                .dw-modal-bg {
                    position: fixed;
                    inset: 0;
                    z-index: 9998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    background: rgba(15,23,42,.48);
                    backdrop-filter: blur(4px);
                    animation: dwFade .2s ease;
                }

                .dw-modal {
                    width: min(420px,100%);
                    background: white;
                    padding: 21px;
                    border-radius: 18px;
                    box-shadow:
                        0 25px 70px
                        rgba(15,23,42,.25);
                    animation: dwModal .25s ease;
                }

                .dw-modal h3 {
                    margin: 0 0 8px;
                    font-size: 19px;
                }

                .dw-modal p {
                    color: #64748b;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .dw-modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    margin-top: 18px;
                }

                @keyframes dwIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes dwSlide {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes dwToast {
                    from {
                        opacity: 0;
                        transform: translateX(25px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes dwModal {
                    from {
                        opacity: 0;
                        transform: scale(.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes dwFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes dwSpin {
                    to { transform: rotate(360deg); }
                }

                @media (min-width: 1400px) {
                     .dw-container {
                         padding-left: 32px;
                         padding-right: 32px;
                    }

                     .dw-summary-card {
                         padding: 22px;
                    }

                     .dw-form,
                     .dw-history {
                         border-radius: 20px;
                    }
                }

                @media (max-width: 850px) {
                    .dw-summary {
                        grid-template-columns:
                            repeat(3,1fr);
                    }

                    .dw-card {
                        grid-template-columns:
                            1fr 1fr;
                    }

                    .dw-card-main {
                        grid-column: 1 / -1;
                    }

                    .dw-card-actions {
                        justify-content: flex-end;
                    }
                }

                @media (max-width: 650px) {
                    .dw-page {
                        padding: 12px;
                    }

                    .dw-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .dw-actions {
                        width: 100%;
                    }

                    .dw-actions button {
                        flex: 1;
                    }

                    .dw-controls {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .dw-month {
                        width: 100%;
                    }

                    .dw-month .dw-select {
                        flex: 1;
                        width: auto !important;
                    }

                    .dw-summary {
                        grid-template-columns: 1fr;
                    }

                    .dw-form-grid {
                        grid-template-columns: 1fr;
                    }

                    .dw-full {
                        grid-column: auto;
                    }

                    .dw-filter {
                        grid-template-columns: 1fr;
                    }

                    .dw-history-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .dw-card {
                        grid-template-columns: 1fr;
                    }

                    .dw-card-main {
                        grid-column: auto;
                    }

                    .dw-card-actions {
                        justify-content: flex-start;
                    }

                    .dw-form-actions {
                        flex-direction: column-reverse;
                    }

                    .dw-form-actions button {
                        width: 100%;
                    }
                }

                @media (max-width: 400px) {
                    .dw-type {
                        grid-template-columns: 1fr;
                    }

                    .dw-actions {
                        flex-direction: column;
                    }

                    .dw-actions button {
                        width: 100%;
                    }
                }
            `}</style>

            {alert && (
                <div className="dw-toast-container">
                    <div className={`dw-toast ${alert.type}`}>
                        {alert.type === "success" && "✓ "}
                        {alert.type === "error" && "✕ "}
                        {alert.type === "warning" && "⚠ "}
                        {alert.message}
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div className="dw-modal-bg">
                    <div className="dw-modal">

                        <h3>
                            Delete transaction?
                        </h3>

                        <p>
                            This{" "}
                            {confirmDelete.type?.toLowerCase()}{" "}
                            transaction will be
                            permanently deleted.
                        </p>

                        <div className="dw-modal-actions">

                            <button
                                className="dw-btn dw-secondary"
                                onClick={() =>
                                    setConfirmDelete(null)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="dw-btn dw-danger"
                                onClick={deleteEntry}
                            >
                                Delete
                            </button>

                        </div>

                    </div>
                </div>
            )}

            <div className="dw-container">

                <header className="dw-header">

                    <div className="dw-title">
                        <h1>
                            Deposit & Withdrawal
                        </h1>

                        <p>
                            Manage your trading
                            account cash flow.
                        </p>
                    </div>

                    <div className="dw-actions">

                        <button
                            className="dw-btn dw-secondary"
                            onClick={() => {
                                loadEntries();
                                loadSummary();
                            }}
                        >
                            ↻ Refresh
                        </button>

                        <button
                            className="dw-btn dw-primary"
                            onClick={() => {
                                resetForm();
                                setShowForm(true);
                            }}
                        >
                            + Add Transaction
                        </button>

                    </div>

                </header>

                <div className="dw-controls">

                    <h2
                        style={{
                            margin: 0,
                            fontSize: "18px",
                        }}
                    >
                        {monthName} {year}
                    </h2>

                    <div className="dw-month">

                        <select
                            className="dw-select"
                            value={month}
                            onChange={(e) =>
                                setMonth(
                                    e.target.value
                                )
                            }
                        >
                            {[
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December",
                            ].map(
                                (name, index) => (
                                    <option
                                        key={name}
                                        value={String(
                                            index + 1
                                        ).padStart(
                                            2,
                                            "0"
                                        )}
                                    >
                                        {name}
                                    </option>
                                )
                            )}
                        </select>

                        <select
                            className="dw-select"
                            value={year}
                            onChange={(e) =>
                                setYear(
                                    e.target.value
                                )
                            }
                        >
                            {Array.from(
                                {
                                    length: 7,
                                },
                                (_, index) =>
                                    new Date().getFullYear() -
                                    3 +
                                    index
                            ).map((item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </option>
                            ))}
                        </select>

                    </div>

                </div>

                <section className="dw-summary">

                    <div className="dw-summary-card">
                        <div className="dw-label">
                            Total Deposit
                        </div>

                        <div className="dw-value dw-deposit">
                            {formatMoney(
                                summary.total_deposit
                            )}
                        </div>
                    </div>

                    <div className="dw-summary-card">
                        <div className="dw-label">
                            Total Withdrawal
                        </div>

                        <div className="dw-value dw-withdrawal">
                            {formatMoney(
                                summary.total_withdrawal
                            )}
                        </div>
                    </div>

                    <div className="dw-summary-card">
                        <div className="dw-label">
                            Net Cash Flow
                        </div>

                        <div
                            className={`dw-value ${
                                summary.net_cash_flow >= 0
                                    ? "dw-deposit"
                                    : "dw-withdrawal"
                            }`}
                        >
                            {formatMoney(
                                summary.net_cash_flow
                            )}
                        </div>
                    </div>

                </section>

                {showForm && (
                    <form
                        className="dw-form"
                        onSubmit={saveTransaction}
                    >

                        <div className="dw-form-header">

                            <h2>
                                {editingId
                                    ? "Edit Transaction"
                                    : "Add Transaction"}
                            </h2>

                            <button
                                type="button"
                                className="dw-btn dw-secondary"
                                onClick={resetForm}
                            >
                                Close
                            </button>

                        </div>

                        <div className="dw-form-grid">

                            <div className="dw-field">
                                <label>
                                    Transaction Type *
                                </label>

                                <div className="dw-type">

                                    <button
                                        type="button"
                                        className={
                                            form.type ===
                                            "Deposit"
                                                ? "active-deposit"
                                                : ""
                                        }
                                        onClick={() =>
                                            setForm(
                                                (prev) => ({
                                                    ...prev,
                                                    type: "Deposit",
                                                })
                                            )
                                        }
                                    >
                                        ↓ Deposit
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            form.type ===
                                            "Withdrawal"
                                                ? "active-withdrawal"
                                                : ""
                                        }
                                        onClick={() =>
                                            setForm(
                                                (prev) => ({
                                                    ...prev,
                                                    type: "Withdrawal",
                                                })
                                            )
                                        }
                                    >
                                        ↑ Withdrawal
                                    </button>

                                </div>
                            </div>

                            <div className="dw-field">
                                <label>
                                    Amount *
                                </label>

                                <input
                                    className="dw-input"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="amount"
                                    placeholder="₹ 0.00"
                                    value={
                                        form.amount
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                            <div className="dw-field">
                                <label>
                                    Broker *
                                </label>

                                <div className="dw-broker">

                                    <select
                                        className="dw-select"
                                        name="broker_name"
                                        value={
                                            form.broker_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
                                        <option value="">
                                            Select broker
                                        </option>

                                        {brokers.map(
                                            (broker) => (
                                                <option
                                                    key={broker}
                                                    value={broker}
                                                >
                                                    {broker}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <button
                                        type="button"
                                        className="dw-add"
                                        onClick={() =>
                                            setShowBrokerInput(
                                                !showBrokerInput
                                            )
                                        }
                                    >
                                        +
                                    </button>

                                </div>

                                {showBrokerInput && (
                                    <div className="dw-new-broker">

                                        <input
                                            className="dw-input"
                                            placeholder="New broker name"
                                            value={
                                                newBroker
                                            }
                                            onChange={(e) =>
                                                setNewBroker(
                                                    e.target
                                                        .value
                                                )
                                            }
                                        />

                                        <button
                                            type="button"
                                            className="dw-btn dw-primary"
                                            onClick={
                                                addBroker
                                            }
                                        >
                                            Add
                                        </button>

                                    </div>
                                )}
                            </div>

                            <div className="dw-field">
                                <label>
                                    Date *
                                </label>

                                <input
                                    className="dw-input"
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                            <div className="dw-field dw-full">
                                <label>
                                    Notes{" "}
                                    <span
                                        style={{
                                            color: "#94a3b8",
                                            fontWeight: 500,
                                        }}
                                    >
                                        (Optional)
                                    </span>
                                </label>

                                <textarea
                                    className="dw-textarea"
                                    name="notes"
                                    placeholder="Add optional notes..."
                                    value={
                                        form.notes
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                        </div>

                        <div className="dw-form-actions">

                            <button
                                type="button"
                                className="dw-btn dw-secondary"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="dw-btn dw-primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                    ? "Update Transaction"
                                    : "Save Transaction"}
                            </button>

                        </div>

                    </form>
                )}

                <section className="dw-history">

                    <div className="dw-history-header">

                        <div>
                            <h2>
                                Transaction History
                            </h2>

                            <div
                                style={{
                                    color: "#64748b",
                                    fontSize: "12px",
                                    marginTop: "4px",
                                }}
                            >
                                {filteredEntries.length}{" "}
                                transactions
                            </div>
                        </div>

                        <button
                            className="dw-btn dw-secondary"
                            onClick={() => {
                                setSearch("");
                                setFilterType("All");
                                setFilterBroker("All");
                            }}
                        >
                            Clear Filters
                        </button>

                    </div>

                    <div className="dw-filter">

                        <input
                            className="dw-input"
                            placeholder="Search broker or notes..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                        <select
                            className="dw-select"
                            value={filterType}
                            onChange={(e) =>
                                setFilterType(
                                    e.target.value
                                )
                            }
                        >
                            <option value="All">
                                All Types
                            </option>

                            <option value="Deposit">
                                Deposit
                            </option>

                            <option value="Withdrawal">
                                Withdrawal
                            </option>
                        </select>

                        <select
                            className="dw-select"
                            value={filterBroker}
                            onChange={(e) =>
                                setFilterBroker(
                                    e.target.value
                                )
                            }
                        >
                            <option value="All">
                                All Brokers
                            </option>

                            {[
                                ...new Set(
                                    entries.map(
                                        (item) =>
                                            item.broker_name
                                    )
                                ),
                            ].map((broker) => (
                                <option
                                    key={broker}
                                    value={broker}
                                >
                                    {broker}
                                </option>
                            ))}
                        </select>

                    </div>

                    <div className="dw-list">

                        {loading ? (
                            <div className="dw-loading">
                                <div className="dw-spinner" />
                                Loading transactions...
                            </div>
                        ) : filteredEntries.length ===
                          0 ? (
                            <div className="dw-empty">
                                <div
                                    style={{
                                        fontSize: "35px",
                                        marginBottom: "8px",
                                    }}
                                >
                                    💰
                                </div>

                                <strong>
                                    No transactions found
                                </strong>

                                <div
                                    style={{
                                        fontSize: "13px",
                                        marginTop: "5px",
                                    }}
                                >
                                    Add a deposit or
                                    withdrawal to get
                                    started.
                                </div>
                            </div>
                        ) : (
                            filteredEntries.map(
                                (entry) => (
                                    <div
                                        className="dw-card"
                                        key={entry.id}
                                    >

                                        <div className="dw-card-main">
                                            <div className="dw-broker-name">
                                                {
                                                    entry.broker_name
                                                }
                                            </div>

                                            <div className="dw-date">
                                                {formatDate(
                                                    entry.date
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="dw-card-label">
                                                Type
                                            </div>

                                            <span
                                                className={`dw-badge ${
                                                    entry.type ===
                                                    "Deposit"
                                                        ? "dw-badge-deposit"
                                                        : "dw-badge-withdrawal"
                                                }`}
                                            >
                                                {
                                                    entry.type
                                                }
                                            </span>
                                        </div>

                                        <div>
                                            <div className="dw-card-label">
                                                Amount
                                            </div>

                                            <div
                                                className={`dw-card-value ${
                                                    entry.type ===
                                                    "Deposit"
                                                        ? "dw-deposit"
                                                        : "dw-withdrawal"
                                                }`}
                                            >
                                                {entry.type ===
                                                "Deposit"
                                                    ? "+"
                                                    : "-"}
                                                {formatMoney(
                                                    entry.amount
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="dw-card-label">
                                                Date
                                            </div>

                                            <div className="dw-card-value">
                                                {formatDate(
                                                    entry.date
                                                )}
                                            </div>
                                        </div>

                                        <div className="dw-card-actions">

                                            <button
                                                className="dw-icon"
                                                title="Edit"
                                                onClick={() =>
                                                    editEntry(
                                                        entry
                                                    )
                                                }
                                            >
                                                ✎
                                            </button>

                                            <button
                                                className="dw-icon"
                                                title="Delete"
                                                onClick={() =>
                                                    setConfirmDelete(
                                                        entry
                                                    )
                                                }
                                            >
                                                🗑
                                            </button>

                                        </div>

                                        {entry.notes && (
                                            <div
                                                style={{
                                                    gridColumn:
                                                        "1 / -1",
                                                    borderTop:
                                                        "1px solid #f1f5f9",
                                                    paddingTop:
                                                        "8px",
                                                    color:
                                                        "#64748b",
                                                    fontSize:
                                                        "12px",
                                                }}
                                            >
                                                {entry.notes}
                                            </div>
                                        )}

                                    </div>
                                )
                            )
                        )}

                    </div>

                </section>

            </div>
        </div>
    );
}