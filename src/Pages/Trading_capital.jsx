import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_BASE =
    "https://express-project-learning-new.onrender.com/api/trading-capital";

const DEFAULT_BROKERS = [
    "Groww",
    "Zerodha",
    "Dhan",
    "XM",
    "Lemon",
    "MetaTrader",
];

const emptyForm = {
    capital_amount: "",
    broker_name: "",
    date: "",
    notes: "",
};

function money(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

function dateFormat(value) {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function Trading_capital() {
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
        starting_capital: 0,
        deposits: 0,
        withdrawals: 0,
        profit: 0,
        loss: 0,
        net_pnl: 0,
        current_capital: 0,
        return_percentage: 0,
    });

    const [search, setSearch] = useState("");
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
                        "Failed to load capital"
                );
            }

            setEntries(data.data || []);
        } catch (error) {
            console.error(error);

            showAlert(
                "error",
                error.message ||
                    "Unable to load capital entries"
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
                        "Failed to calculate capital summary"
                );
            }

            setSummary({
                starting_capital:
                    Number(data.starting_capital || 0),

                deposits:
                    Number(data.deposits || 0),

                withdrawals:
                    Number(data.withdrawals || 0),

                profit:
                    Number(data.profit || 0),

                loss:
                    Number(data.loss || 0),

                net_pnl:
                    Number(data.net_pnl || 0),

                current_capital:
                    Number(data.current_capital || 0),

                return_percentage:
                    Number(
                        data.return_percentage || 0
                    ),
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
            console.error(
                "Broker loading error:",
                error
            );
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
        const broker = newBroker.trim();

        if (!broker) {
            showAlert(
                "warning",
                "Enter broker name first."
            );

            return;
        }

        const existing = brokers.find(
            (item) =>
                item.toLowerCase() ===
                broker.toLowerCase()
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
            broker,
        ]);

        setForm((prev) => ({
            ...prev,
            broker_name: broker,
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
        if (
            !form.capital_amount ||
            Number(form.capital_amount) <= 0
        ) {
            showAlert(
                "warning",
                "Enter a valid capital amount."
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

    const saveCapital = async (e) => {
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
                capital_amount:
                    Number(form.capital_amount),
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
                        "Unable to save capital"
                );
            }

            showAlert(
                "success",
                editingId
                    ? "Capital updated successfully."
                    : "Capital added successfully."
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
            capital_amount:
                entry.capital_amount ?? "",
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
                "Capital entry deleted successfully."
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
                    "Unable to delete capital."
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

            const matchesBroker =
                filterBroker === "All" ||
                entry.broker_name ===
                    filterBroker;

            return (
                matchesSearch &&
                matchesBroker
            );
        });
    }, [
        entries,
        search,
        filterBroker,
    ]);

    const monthName = new Date(
        Number(year),
        Number(month) - 1,
        1
    ).toLocaleString("en-IN", {
        month: "long",
    });

    const returnPositive =
        Number(summary.return_percentage) >= 0;

    if (!user) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                    background: "#f8fafc",
                    fontFamily:
                        'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}
            >
                <div
                    style={{
                        width: "min(420px, 100%)",
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        padding: 28,
                        textAlign: "center",
                        boxShadow: "0 15px 45px rgba(15,23,42,.08)",
                    }}
                >
                    <div style={{ fontSize: 34, marginBottom: 10 }}>🔐</div>
                    <h2 style={{ margin: "0 0 8px", color: "#172033" }}>
                        Login Required
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
                        Please login to view your trading capital.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="capital-page">

            <style>{`
                * {
                    box-sizing: border-box;
                }

                .capital-page {
                    min-height: 100vh;
                    width: 100%;
                    padding: 20px;
                    background:
                        radial-gradient(
                            circle at top right,
                            rgba(139,92,246,.11),
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

                .capital-container {
                    max-width: 1250px;
                    margin: auto;
                }

                .capital-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 18px;
                    margin-bottom: 22px;
                }

                .capital-title h1 {
                    margin: 0;
                    font-size: clamp(23px, 4vw, 32px);
                    font-weight: 800;
                    letter-spacing: -.7px;
                }

                .capital-title p {
                    margin: 6px 0 0;
                    color: #64748b;
                    font-size: 14px;
                }

                .capital-actions {
                    display: flex;
                    gap: 8px;
                }

                .capital-btn {
                    min-height: 42px;
                    padding: 10px 15px;
                    border: 0;
                    border-radius: 11px;
                    cursor: pointer;
                    font-weight: 750;
                    transition:
                        transform .2s ease,
                        box-shadow .2s ease;
                }

                .capital-btn:hover {
                    transform: translateY(-2px);
                }

                .capital-primary {
                    color: white;
                    background: #2563eb;
                    box-shadow:
                        0 7px 18px
                        rgba(37,99,235,.20);
                }

                .capital-secondary {
                    color: #334155;
                    background: white;
                    border: 1px solid #dbe2ea;
                }

                .capital-danger {
                    color: #b91c1c;
                    background: #fee2e2;
                }

                .capital-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 14px;
                }

                .capital-month {
                    display: flex;
                    gap: 8px;
                }

                .capital-select,
                .capital-input,
                .capital-textarea {
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

                .capital-select:focus,
                .capital-input:focus,
                .capital-textarea:focus {
                    border-color: #3b82f6;
                    box-shadow:
                        0 0 0 3px
                        rgba(59,130,246,.10);
                }

                .capital-month .capital-select:first-child {
                    width: 145px;
                }

                .capital-month .capital-select:last-child {
                    width: 105px;
                }

                .capital-summary {
                    display: grid;
                    grid-template-columns:
                        repeat(4, minmax(0,1fr));
                    gap: 13px;
                    margin-bottom: 13px;
                }

                .capital-summary.second {
                    grid-template-columns:
                        repeat(4, minmax(0,1fr));
                    margin-bottom: 22px;
                }

                .capital-summary-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 18px;
                    box-shadow:
                        0 8px 28px
                        rgba(15,23,42,.05);
                    animation: capIn .45s ease both;
                }

                .capital-label {
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: .5px;
                }

                .capital-value {
                    margin-top: 7px;
                    font-size: clamp(19px, 3vw, 25px);
                    font-weight: 800;
                    overflow-wrap: anywhere;
                }

                .capital-blue {
                    color: #2563eb;
                }

                .capital-green {
                    color: #059669;
                }

                .capital-red {
                    color: #dc2626;
                }

                .capital-purple {
                    color: #7c3aed;
                }

                .capital-form {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 20px;
                    margin-bottom: 22px;
                    box-shadow:
                        0 12px 35px
                        rgba(15,23,42,.06);
                    animation: capSlide .35s ease;
                }

                .capital-form-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 17px;
                }

                .capital-form-header h2 {
                    margin: 0;
                    font-size: 19px;
                }

                .capital-form-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0,1fr));
                    gap: 15px;
                }

                .capital-field label {
                    display: block;
                    margin-bottom: 7px;
                    font-size: 12px;
                    font-weight: 800;
                    color: #475569;
                }

                .capital-full {
                    grid-column: 1 / -1;
                }

                .capital-broker {
                    display: flex;
                    gap: 7px;
                }

                .capital-broker .capital-select {
                    flex: 1;
                    min-width: 0;
                }

                .capital-add {
                    width: 43px;
                    border: 1px solid #cbd5e1;
                    background: #f8fafc;
                    border-radius: 10px;
                    cursor: pointer;
                    color: #2563eb;
                    font-size: 19px;
                    font-weight: 800;
                }

                .capital-new-broker {
                    display: flex;
                    gap: 7px;
                    margin-top: 8px;
                }

                .capital-textarea {
                    min-height: 85px;
                    resize: vertical;
                }

                .capital-form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    margin-top: 18px;
                }

                .capital-return-box {
                    margin-bottom: 22px;
                    padding: 20px;
                    border-radius: 18px;
                    color: white;
                    background:
                        linear-gradient(
                            135deg,
                            #1d4ed8,
                            #7c3aed
                        );
                    box-shadow:
                        0 12px 35px
                        rgba(37,99,235,.18);
                    overflow: hidden;
                    position: relative;
                }

                .capital-return-box::after {
                    content: "";
                    position: absolute;
                    width: 180px;
                    height: 180px;
                    right: -50px;
                    top: -80px;
                    border-radius: 50%;
                    background: rgba(255,255,255,.09);
                }

                .return-title {
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: .6px;
                    opacity: .85;
                }

                .return-value {
                    font-size: clamp(28px, 6vw, 42px);
                    font-weight: 900;
                    margin-top: 5px;
                }

                .return-subtitle {
                    font-size: 13px;
                    opacity: .82;
                    margin-top: 4px;
                }

                .capital-history {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    overflow: hidden;
                    box-shadow:
                        0 12px 35px
                        rgba(15,23,42,.05);
                }

                .capital-history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    padding: 17px;
                    border-bottom: 1px solid #edf1f5;
                }

                .capital-history-header h2 {
                    margin: 0;
                    font-size: 19px;
                }

                .capital-filters {
                    display: grid;
                    grid-template-columns:
                        1.5fr .9fr;
                    gap: 8px;
                    padding: 14px 17px;
                    background: #f8fafc;
                    border-bottom: 1px solid #edf1f5;
                }

                .capital-list {
                    padding: 10px;
                }

                .capital-card {
                    display: grid;
                    grid-template-columns:
                        1.2fr .9fr .9fr auto;
                    align-items: center;
                    gap: 14px;
                    padding: 15px;
                    margin-bottom: 8px;
                    border: 1px solid #edf1f5;
                    border-radius: 13px;
                    transition: .2s ease;
                }

                .capital-card:hover {
                    transform: translateY(-2px);
                    border-color: #ddd6fe;
                    box-shadow:
                        0 7px 22px
                        rgba(15,23,42,.06);
                }

                .capital-broker-name {
                    font-weight: 800;
                    overflow-wrap: anywhere;
                }

                .capital-date {
                    color: #64748b;
                    font-size: 12px;
                    margin-top: 4px;
                }

                .capital-card-label {
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    margin-bottom: 3px;
                }

                .capital-card-value {
                    font-weight: 750;
                    overflow-wrap: anywhere;
                }

                .capital-card-actions {
                    display: flex;
                    gap: 6px;
                }

                .capital-icon {
                    width: 36px;
                    height: 36px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    border-radius: 9px;
                    cursor: pointer;
                    transition: .2s;
                }

                .capital-icon:hover {
                    background: #f1f5f9;
                    transform: translateY(-1px);
                }

                .capital-empty,
                .capital-loading {
                    text-align: center;
                    padding: 50px 20px;
                    color: #64748b;
                }

                .capital-spinner {
                    width: 28px;
                    height: 28px;
                    border: 3px solid #dbeafe;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    margin: 0 auto 10px;
                    animation: capSpin .8s linear infinite;
                }

                .capital-toast-container {
                    position: fixed;
                    top: 18px;
                    right: 18px;
                    width: min(380px, calc(100vw - 36px));
                    z-index: 9999;
                }

                .capital-toast {
                    background: white;
                    padding: 14px 16px;
                    border-radius: 13px;
                    border-left: 4px solid #2563eb;
                    box-shadow:
                        0 15px 45px
                        rgba(15,23,42,.18);
                    animation: capToast .3s ease;
                    font-size: 14px;
                    font-weight: 700;
                }

                .capital-toast.success {
                    border-left-color: #16a34a;
                }

                .capital-toast.error {
                    border-left-color: #dc2626;
                }

                .capital-toast.warning {
                    border-left-color: #f59e0b;
                }

                .capital-modal-bg {
                    position: fixed;
                    inset: 0;
                    z-index: 9998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(15,23,42,.48);
                    backdrop-filter: blur(4px);
                    animation: capFade .2s ease;
                }

                .capital-modal {
                    width: min(420px,100%);
                    background: white;
                    padding: 21px;
                    border-radius: 18px;
                    box-shadow:
                        0 25px 70px
                        rgba(15,23,42,.25);
                    animation: capModal .25s ease;
                }

                .capital-modal h3 {
                    margin: 0 0 8px;
                    font-size: 19px;
                }

                .capital-modal p {
                    color: #64748b;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .capital-modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    margin-top: 18px;
                }

                @keyframes capIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes capSlide {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes capToast {
                    from {
                        opacity: 0;
                        transform: translateX(25px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes capModal {
                    from {
                        opacity: 0;
                        transform: scale(.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes capFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes capSpin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                @media (max-width: 950px) {
                    .capital-summary,
                    .capital-summary.second {
                        grid-template-columns:
                            repeat(2, minmax(0,1fr));
                    }

                    .capital-card {
                        grid-template-columns:
                            1fr 1fr;
                    }

                    .capital-card-main {
                        grid-column: 1 / -1;
                    }

                    .capital-card-actions {
                        justify-content: flex-end;
                    }
                }

                @media (max-width: 650px) {
                    .capital-page {
                        padding: 12px;
                    }

                    .capital-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .capital-actions {
                        width: 100%;
                    }

                    .capital-actions button {
                        flex: 1;
                    }

                    .capital-controls {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .capital-month {
                        width: 100%;
                    }

                    .capital-month .capital-select {
                        flex: 1;
                        width: auto !important;
                    }

                    .capital-summary,
                    .capital-summary.second {
                        grid-template-columns: 1fr;
                    }

                    .capital-form-grid {
                        grid-template-columns: 1fr;
                    }

                    .capital-full {
                        grid-column: auto;
                    }

                    .capital-filters {
                        grid-template-columns: 1fr;
                    }

                    .capital-history-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .capital-card {
                        grid-template-columns: 1fr;
                    }

                    .capital-card-main {
                        grid-column: auto;
                    }

                    .capital-card-actions {
                        justify-content: flex-start;
                    }

                    .capital-form-actions {
                        flex-direction: column-reverse;
                    }

                    .capital-form-actions button {
                        width: 100%;
                    }
                }

                @media (max-width: 400px) {
                    .capital-actions {
                        flex-direction: column;
                    }

                    .capital-actions button {
                        width: 100%;
                    }
                }
            `}</style>

            {alert && (
                <div className="capital-toast-container">
                    <div
                        className={`capital-toast ${alert.type}`}
                    >
                        {alert.type === "success" &&
                            "✓ "}
                        {alert.type === "error" &&
                            "✕ "}
                        {alert.type === "warning" &&
                            "⚠ "}
                        {alert.message}
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div className="capital-modal-bg">
                    <div className="capital-modal">

                        <h3>
                            Delete capital entry?
                        </h3>

                        <p>
                            This capital record will be
                            permanently deleted.
                        </p>

                        <div className="capital-modal-actions">

                            <button
                                className="capital-btn capital-secondary"
                                onClick={() =>
                                    setConfirmDelete(
                                        null
                                    )
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="capital-btn capital-danger"
                                onClick={deleteEntry}
                            >
                                Delete
                            </button>

                        </div>

                    </div>
                </div>
            )}

            <div className="capital-container">

                <header className="capital-header">

                    <div className="capital-title">
                        <h1>
                            Trading Capital
                        </h1>

                        <p>
                            Track capital and monthly
                            trading returns.
                        </p>
                    </div>

                    <div className="capital-actions">

                        <button
                            className="capital-btn capital-secondary"
                            onClick={() => {
                                loadEntries();
                                loadSummary();
                            }}
                        >
                            ↻ Refresh
                        </button>

                        <button
                            className="capital-btn capital-primary"
                            onClick={() => {
                                resetForm();
                                setShowForm(true);
                            }}
                        >
                            + Add Capital
                        </button>

                    </div>

                </header>

                <div className="capital-controls">

                    <h2
                        style={{
                            margin: 0,
                            fontSize: "18px",
                        }}
                    >
                        {monthName} {year}
                    </h2>

                    <div className="capital-month">

                        <select
                            className="capital-select"
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
                            className="capital-select"
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

                <section className="capital-summary">

                    <div className="capital-summary-card">
                        <div className="capital-label">
                            Starting Capital
                        </div>

                        <div className="capital-value capital-blue">
                            {money(
                                summary.starting_capital
                            )}
                        </div>
                    </div>

                    <div className="capital-summary-card">
                        <div className="capital-label">
                            Deposits
                        </div>

                        <div className="capital-value capital-green">
                            {money(
                                summary.deposits
                            )}
                        </div>
                    </div>

                    <div className="capital-summary-card">
                        <div className="capital-label">
                            Withdrawals
                        </div>

                        <div className="capital-value capital-red">
                            {money(
                                summary.withdrawals
                            )}
                        </div>
                    </div>

                    <div className="capital-summary-card">
                        <div className="capital-label">
                            Current Capital
                        </div>

                        <div className="capital-value capital-purple">
                            {money(
                                summary.current_capital
                            )}
                        </div>
                    </div>

                </section>

                <section className="capital-summary second">

                    <div className="capital-summary-card">
                        <div className="capital-label">
                            Profit
                        </div>

                        <div className="capital-value capital-green">
                            {money(
                                summary.profit
                            )}
                        </div>
                    </div>

                    <div className="capital-summary-card">
                        <div className="capital-label">
                            Loss
                        </div>

                        <div className="capital-value capital-red">
                            {money(
                                summary.loss
                            )}
                        </div>
                    </div>

                    <div className="capital-summary-card">
                        <div className="capital-label">
                            Net P&L
                        </div>

                        <div
                            className={`capital-value ${
                                Number(
                                    summary.net_pnl
                                ) >= 0
                                    ? "capital-green"
                                    : "capital-red"
                            }`}
                        >
                            {money(
                                summary.net_pnl
                            )}
                        </div>
                    </div>

                    <div className="capital-summary-card">
                        <div className="capital-label">
                            Monthly Return
                        </div>

                        <div
                            className={`capital-value ${
                                returnPositive
                                    ? "capital-green"
                                    : "capital-red"
                            }`}
                        >
                            {returnPositive
                                ? "+"
                                : ""}
                            {Number(
                                summary.return_percentage
                            ).toFixed(2)}
                            %
                        </div>
                    </div>

                </section>

                <section className="capital-return-box">

                    <div className="return-title">
                        {monthName} {year} Return
                    </div>

                    <div className="return-value">
                        {returnPositive
                            ? "+"
                            : ""}
                        {Number(
                            summary.return_percentage
                        ).toFixed(2)}
                        %
                    </div>

                    <div className="return-subtitle">
                        Net P&L{" "}
                        {money(summary.net_pnl)}{" "}
                        compared with starting
                        capital{" "}
                        {money(
                            summary.starting_capital
                        )}
                    </div>

                </section>

                {showForm && (
                    <form
                        className="capital-form"
                        onSubmit={saveCapital}
                    >

                        <div className="capital-form-header">

                            <h2>
                                {editingId
                                    ? "Edit Capital"
                                    : "Add Trading Capital"}
                            </h2>

                            <button
                                type="button"
                                className="capital-btn capital-secondary"
                                onClick={resetForm}
                            >
                                Close
                            </button>

                        </div>

                        <div className="capital-form-grid">

                            <div className="capital-field">
                                <label>
                                    Capital Amount *
                                </label>

                                <input
                                    className="capital-input"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="capital_amount"
                                    placeholder="₹ 0.00"
                                    value={
                                        form.capital_amount
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                            <div className="capital-field">
                                <label>
                                    Broker *
                                </label>

                                <div className="capital-broker">

                                    <select
                                        className="capital-select"
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
                                        className="capital-add"
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
                                    <div className="capital-new-broker">

                                        <input
                                            className="capital-input"
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
                                            className="capital-btn capital-primary"
                                            onClick={
                                                addBroker
                                            }
                                        >
                                            Add
                                        </button>

                                    </div>
                                )}
                            </div>

                            <div className="capital-field">
                                <label>
                                    Capital Date *
                                </label>

                                <input
                                    className="capital-input"
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    onChange={
                                        handleChange
                                    }
                                />
                            </div>

                            <div className="capital-field capital-full">
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
                                    className="capital-textarea"
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

                        <div className="capital-form-actions">

                            <button
                                type="button"
                                className="capital-btn capital-secondary"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="capital-btn capital-primary"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                    ? "Update Capital"
                                    : "Save Capital"}
                            </button>

                        </div>

                    </form>
                )}

                <section className="capital-history">

                    <div className="capital-history-header">

                        <div>
                            <h2>
                                Capital History
                            </h2>

                            <div
                                style={{
                                    color: "#64748b",
                                    fontSize: "12px",
                                    marginTop: "4px",
                                }}
                            >
                                {filteredEntries.length}{" "}
                                capital entries
                            </div>
                        </div>

                        <button
                            className="capital-btn capital-secondary"
                            onClick={() => {
                                setSearch("");
                                setFilterBroker("All");
                            }}
                        >
                            Clear Filters
                        </button>

                    </div>

                    <div className="capital-filters">

                        <input
                            className="capital-input"
                            placeholder="Search broker or notes..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                        <select
                            className="capital-select"
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

                    <div className="capital-list">

                        {loading ? (
                            <div className="capital-loading">
                                <div className="capital-spinner" />
                                Loading capital...
                            </div>
                        ) : filteredEntries.length ===
                          0 ? (
                            <div className="capital-empty">

                                <div
                                    style={{
                                        fontSize: "35px",
                                        marginBottom: "8px",
                                    }}
                                >
                                    💼
                                </div>

                                <strong>
                                    No capital records
                                </strong>

                                <div
                                    style={{
                                        fontSize: "13px",
                                        marginTop: "5px",
                                    }}
                                >
                                    Add your trading
                                    capital to start
                                    tracking returns.
                                </div>

                            </div>
                        ) : (
                            filteredEntries.map(
                                (entry) => (
                                    <div
                                        className="capital-card"
                                        key={entry.id}
                                    >

                                        <div className="capital-card-main">
                                            <div className="capital-broker-name">
                                                {
                                                    entry.broker_name
                                                }
                                            </div>

                                            <div className="capital-date">
                                                {dateFormat(
                                                    entry.date
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="capital-card-label">
                                                Capital
                                            </div>

                                            <div className="capital-card-value capital-blue">
                                                {money(
                                                    entry.capital_amount
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="capital-card-label">
                                                Date
                                            </div>

                                            <div className="capital-card-value">
                                                {dateFormat(
                                                    entry.date
                                                )}
                                            </div>
                                        </div>

                                        <div className="capital-card-actions">

                                            <button
                                                className="capital-icon"
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
                                                className="capital-icon"
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