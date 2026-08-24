import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const API_BASE =
    "https://express-project-learning-new.onrender.com/api/personal-trading";

const SEGMENTS = [
    "Index",
    "Options",
    "Gold",
    "Forex",
    "Crypto",
    "Stocks",
    "Futures",
    "Commodities",
    "Other",
];

const DEFAULT_BROKERS = [
    "Groww",
    "Zerodha",
    "Dhan",
    "XM",
    "Lemon",
    "MetaTrader",
];

const MONTHS = [
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
];

const emptyForm = {
    broker_name: "",
    date: "",
    result: "Profit",
    amount: "",
    segment: "",
    trades_today: "",
    strategy_logic: "",
    notes: "",
};

function formatMoney(value) {
    const number = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    }).format(Math.round(number));
}

function formatDate(date) {
    if (!date) return "-";

    const raw = String(date).slice(0, 10);
    const d = new Date(`${raw}T00:00:00`);

    if (Number.isNaN(d.getTime())) return date;

    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getCurrentMonth() {
    return String(new Date().getMonth() + 1).padStart(2, "0");
}

function getCurrentYear() {
    return String(new Date().getFullYear());
}

export default function Trading_Main() {
    const { user } = useAuth();

    const userId =
        user?.id ??
        user?.user_id ??
        user?.userId ??
        "";

    const [entries, setEntries] = useState([]);
    const [brokers, setBrokers] = useState(DEFAULT_BROKERS);
    const [form, setForm] = useState(emptyForm);

    const [selectedMonth, setSelectedMonth] =
        useState(getCurrentMonth());
    const [selectedYear, setSelectedYear] =
        useState(getCurrentYear());

    const [summary, setSummary] = useState({
        total_profit: 0,
        total_loss: 0,
        net_pnl: 0,
        journal_entries: 0,
        total_trades: 0,
    });

    const [weekly, setWeekly] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [filterResult, setFilterResult] = useState("All");
    const [filterSegment, setFilterSegment] = useState("All");

    const [showForm, setShowForm] = useState(false);
    const [showBrokerInput, setShowBrokerInput] = useState(false);
    const [newBroker, setNewBroker] = useState("");

    const [alert, setAlert] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const showAlert = (type, message) => {
        setAlert({ type, message });

        window.clearTimeout(showAlert.timer);
        showAlert.timer = window.setTimeout(() => {
            setAlert(null);
        }, 3000);
    };

    const loadEntries = async () => {
        if (!userId) {
            setLoading(false);
            showAlert("error", "User ID not found. Please login again.");
            return;
        }

        try {
            setLoading(true);

            const params = new URLSearchParams({
                user_id: String(userId),
                month: selectedMonth,
                year: selectedYear,
            });

            const response = await fetch(`${API_BASE}?${params.toString()}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to load journal"
                );
            }

            setEntries(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error(error);
            showAlert(
                "error",
                error.message || "Unable to load trading journal"
            );
        } finally {
            setLoading(false);
        }
    };

    const loadSummary = async () => {
        if (!userId) return;

        try {
            const params = new URLSearchParams({
                user_id: String(userId),
                month: selectedMonth,
                year: selectedYear,
            });

            const response = await fetch(
                `${API_BASE}/summary/monthly?${params.toString()}`
            );
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Failed to load summary"
                );
            }

            setSummary(
                data.monthly || {
                    total_profit: 0,
                    total_loss: 0,
                    net_pnl: 0,
                    journal_entries: 0,
                    total_trades: 0,
                }
            );

            setWeekly(Array.isArray(data.weekly) ? data.weekly : []);
        } catch (error) {
            console.error(error);
            showAlert(
                "error",
                error.message || "Unable to calculate summary"
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
                const apiBrokers = Array.isArray(data.brokers)
                    ? data.brokers
                    : [];

                setBrokers([
                    ...new Set([
                        ...DEFAULT_BROKERS,
                        ...apiBrokers,
                    ]),
                ]);
            }
        } catch (error) {
            console.error("Broker loading error:", error);
        }
    };

    useEffect(() => {
        loadEntries();
        loadSummary();
        loadBrokers();
    }, [userId, selectedMonth, selectedYear]);

    const refreshAll = async () => {
        if (refreshing) return;

        setRefreshing(true);

        try {
            await Promise.all([
                loadEntries(),
                loadSummary(),
                loadBrokers(),
            ]);
            showAlert("success", "Trading journal refreshed.");
        } finally {
            window.setTimeout(() => {
                setRefreshing(false);
            }, 350);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;

        if (value === "") {
            setForm((prev) => ({ ...prev, amount: "" }));
            return;
        }

        const clean = value.replace(/\D/g, "");
        setForm((prev) => ({
            ...prev,
            amount: clean,
        }));
    };

    const addNewBroker = () => {
        const broker = newBroker.trim();

        if (!broker) {
            showAlert("warning", "Enter broker name first.");
            return;
        }

        const existing = brokers.find(
            (item) =>
                item.toLowerCase() === broker.toLowerCase()
        );

        if (existing) {
            setForm((prev) => ({
                ...prev,
                broker_name: existing,
            }));
            setShowBrokerInput(false);
            setNewBroker("");
            showAlert("success", `${existing} selected.`);
            return;
        }

        setBrokers((prev) => [...prev, broker]);

        setForm((prev) => ({
            ...prev,
            broker_name: broker,
        }));

        setNewBroker("");
        setShowBrokerInput(false);
        showAlert("success", "New broker added.");
    };

    const openAddForm = () => {
        setEditingId(null);
        setForm({
            ...emptyForm,
            date: new Date().toISOString().slice(0, 10),
        });
        setShowBrokerInput(false);
        setNewBroker("");
        setShowForm(true);
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        setShowBrokerInput(false);
        setNewBroker("");
    };

    const validateForm = () => {
        if (!String(form.broker_name || "").trim()) {
            showAlert("warning", "Please select or add a broker.");
            return false;
        }

        if (!form.date) {
            showAlert("warning", "Please select a date.");
            return false;
        }

        if (!form.amount || Number(form.amount) <= 0) {
            showAlert("warning", "Please enter a valid whole amount.");
            return false;
        }

        if (!form.segment) {
            showAlert("warning", "Please select a segment.");
            return false;
        }

        return true;
    };

    const saveEntry = async (e) => {
        e.preventDefault();

        if (!userId) {
            showAlert("error", "User session not found.");
            return;
        }

        if (!validateForm()) return;

        try {
            setSaving(true);

            const payload = {
                user_id: Number(userId),
                broker_name: form.broker_name.trim(),
                date: form.date,
                result: form.result,
                amount: Math.round(Number(form.amount)),
                segment: form.segment,
                trades_today:
                    form.trades_today === ""
                        ? null
                        : Number(form.trades_today),
                strategy_logic:
                    form.strategy_logic.trim() || null,
                notes:
                    form.notes.trim() || null,
            };

            const url = editingId
                ? `${API_BASE}/${editingId}`
                : API_BASE;

            const method = editingId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to save trading entry"
                );
            }

            showAlert(
                "success",
                editingId
                    ? "Trading journal updated."
                    : "Trading journal added."
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
                error.message || "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    };

    const editEntry = (entry) => {
        setEditingId(entry.id);

        setForm({
            broker_name: entry.broker_name || "",
            date: entry.date
                ? String(entry.date).slice(0, 10)
                : "",
            result: entry.result || "Profit",
            amount:
                entry.amount === null ||
                entry.amount === undefined
                    ? ""
                    : String(
                          Math.round(Number(entry.amount))
                      ),
            segment: entry.segment || "",
            trades_today:
                entry.trades_today ?? "",
            strategy_logic:
                entry.strategy_logic || "",
            notes: entry.notes || "",
        });

        setShowBrokerInput(false);
        setNewBroker("");
        setShowForm(true);
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
                    data.message || "Unable to delete entry"
                );
            }

            setConfirmDelete(null);

            showAlert("success", "Trading entry deleted.");

            await Promise.all([
                loadEntries(),
                loadSummary(),
            ]);
        } catch (error) {
            console.error(error);
            showAlert(
                "error",
                error.message || "Delete failed."
            );
        }
    };

    const filteredEntries = useMemo(() => {
        const query = search.trim().toLowerCase();

        return entries.filter((entry) => {
            const matchesSearch =
                !query ||
                String(entry.broker_name || "")
                    .toLowerCase()
                    .includes(query) ||
                String(entry.segment || "")
                    .toLowerCase()
                    .includes(query) ||
                String(entry.strategy_logic || "")
                    .toLowerCase()
                    .includes(query) ||
                String(entry.notes || "")
                    .toLowerCase()
                    .includes(query);

            const matchesResult =
                filterResult === "All" ||
                entry.result === filterResult;

            const matchesSegment =
                filterSegment === "All" ||
                entry.segment === filterSegment;

            return (
                matchesSearch &&
                matchesResult &&
                matchesSegment
            );
        });
    }, [
        entries,
        search,
        filterResult,
        filterSegment,
    ]);

    const netPnl = Number(summary.net_pnl || 0);
    const totalProfit = Number(summary.total_profit || 0);
    const totalLoss = Number(summary.total_loss || 0);
    const totalTrades = Number(summary.total_trades || 0);
    const entryCount = Number(summary.journal_entries || 0);

    const monthName =
        MONTHS[Number(selectedMonth) - 1] || "Month";

    if (!user) {
        return (
            <div className="login-required">
                <div className="login-card">
                    <div className="login-icon">🔐</div>
                    <h2>Login Required</h2>
                    <p>Please login to view your trading journal.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="trading-page">
            <style>{`
                * {
                    box-sizing: border-box;
                }

                .trading-page {
                    min-height: 100vh;
                    width: 100%;
                    overflow-x: hidden;
                    background:
                        radial-gradient(
                            circle at 100% 0%,
                            rgba(37,99,235,.10),
                            transparent 28%
                        ),
                        linear-gradient(
                            135deg,
                            #f8fafc 0%,
                            #eef3f9 100%
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

                .trading-page button,
                .trading-page input,
                .trading-page select,
                .trading-page textarea {
                    font: inherit;
                }

                .trading-container {
                    width: 100%;
                    max-width: 1250px;
                    margin: 0 auto;
                    padding: 20px;
                    padding-bottom: 42px;
                }

                .page-heading {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 14px;
                }

                .page-heading h1 {
                    margin: 0;
                    color: #111827;
                    font-size: 23px;
                    line-height: 1.2;
                    font-weight: 850;
                    letter-spacing: -.45px;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 7px;
                    flex-wrap: wrap;
                }

                .btn {
                    min-height: 34px;
                    height: 34px;
                    border: 1px solid transparent;
                    border-radius: 9px;
                    padding: 6px 11px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 800;
                    white-space: nowrap;
                    transition:
                        transform .16s ease,
                        box-shadow .16s ease,
                        background .16s ease,
                        border-color .16s ease,
                        opacity .16s ease;
                }

                .btn:hover {
                    transform: translateY(-1px);
                }

                .btn:active {
                    transform: scale(.96);
                }

                .btn:disabled {
                    opacity: .55;
                    cursor: not-allowed;
                    transform: none;
                }

                .btn-primary {
                    background: linear-gradient(
                        135deg,
                        #2563eb,
                        #1d4ed8
                    );
                    color: #fff;
                    box-shadow:
                        0 6px 15px rgba(37,99,235,.18);
                }

                .btn-secondary {
                    background: #fff;
                    color: #334155;
                    border-color: #d7e0eb;
                }

                .btn-danger {
                    background: #fee2e2;
                    color: #b91c1c;
                    border-color: #fecaca;
                }

                .refresh-btn {
                    width: 34px;
                    min-width: 34px;
                    height: 34px;
                    min-height: 34px;
                    padding: 0;
                    border-radius: 50%;
                    font-size: 16px;
                }

                .refresh-btn.refreshing {
                    animation: refreshSpin .7s linear infinite;
                }

                .summary-section {
                    margin-bottom: 14px;
                }

                .summary-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin-bottom: 9px;
                }

                .summary-top h2 {
                    min-width: 0;
                    margin: 0;
                    color: #172033;
                    font-size: 18px;
                    line-height: 1.25;
                    font-weight: 850;
                    white-space: normal;
                    overflow-wrap: anywhere;
                }

                .month-controls {
                    display: grid;
                    grid-template-columns: minmax(130px, 1fr) 92px;
                    gap: 7px;
                    flex: 0 0 auto;
                }

                .select,
                .input {
                    width: 100%;
                    min-width: 0;
                    min-height: 40px;
                    border: 1px solid #d5dfeb;
                    border-radius: 10px;
                    background: #fff;
                    color: #172033;
                    padding: 8px 11px;
                    outline: none;
                    font-size: 13px;
                    transition:
                        border-color .18s ease,
                        box-shadow .18s ease,
                        background .18s ease;
                }

                .select:focus,
                .input:focus,
                textarea.input:focus {
                    border-color: #3b82f6;
                    box-shadow:
                        0 0 0 3px rgba(59,130,246,.10);
                }

                .month-select {
                    width: 100%;
                    min-width: 130px;
                }

                .year-select {
                    width: 92px;
                }

                .summary-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));
                    gap: 9px;
                }

                .summary-card {
                    min-width: 0;
                    background: rgba(255,255,255,.95);
                    border: 1px solid #e0e7ef;
                    border-radius: 14px;
                    padding: 14px;
                    box-shadow:
                        0 7px 22px rgba(15,23,42,.045);
                    animation: cardIn .35s ease both;
                }

                .summary-label {
                    color: #64748b;
                    font-size: 11px;
                    line-height: 1.2;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: .45px;
                }

                .summary-value {
                    margin-top: 6px;
                    color: #172033;
                    font-size: 22px;
                    line-height: 1.15;
                    font-weight: 850;
                    overflow-wrap: anywhere;
                }

                .profit {
                    color: #059669 !important;
                }

                .loss {
                    color: #dc2626 !important;
                }

                .neutral {
                    color: #2563eb !important;
                }

                .weekly-card {
                    margin-top: 9px;
                    overflow: hidden;
                    background: #fff;
                    border: 1px solid #e0e7ef;
                    border-radius: 14px;
                    box-shadow:
                        0 7px 22px rgba(15,23,42,.045);
                }

                .weekly-title {
                    padding: 11px 13px;
                    border-bottom: 1px solid #edf1f5;
                    font-size: 13px;
                    font-weight: 850;
                }

                .weekly-list {
                    display: grid;
                    grid-template-columns:
                        repeat(5, minmax(0, 1fr));
                }

                .week-item {
                    min-width: 0;
                    padding: 10px 12px;
                    border-right: 1px solid #edf1f5;
                }

                .week-item:last-child {
                    border-right: 0;
                }

                .week-number {
                    color: #64748b;
                    font-size: 10px;
                    font-weight: 800;
                }

                .week-net {
                    margin-top: 4px;
                    font-size: 15px;
                    font-weight: 850;
                    overflow-wrap: anywhere;
                }

                .history-card {
                    overflow: hidden;
                    background: #fff;
                    border: 1px solid #e0e7ef;
                    border-radius: 15px;
                    box-shadow:
                        0 9px 28px rgba(15,23,42,.055);
                }

                .history-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 13px;
                    border-bottom: 1px solid #edf1f5;
                }

                .history-header h2 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 850;
                }

                .history-count {
                    margin-top: 3px;
                    color: #64748b;
                    font-size: 11px;
                }

                .filters {
                    display: grid;
                    grid-template-columns:
                        minmax(180px, 1.5fr)
                        minmax(125px, .8fr)
                        minmax(125px, .8fr);
                    gap: 7px;
                    padding: 9px 13px;
                    background: #f8fafc;
                    border-bottom: 1px solid #edf1f5;
                }

                .entries {
                    width: 100%;
                    padding: 8px;
                }

                .entry-card {
                    width: 100%;
                    min-width: 0;
                    display: grid;
                    grid-template-columns:
                        minmax(150px, 1.25fr)
                        minmax(80px, .75fr)
                        minmax(100px, .9fr)
                        minmax(80px, .7fr);
                    align-items: center;
                    gap: 11px;
                    padding: 12px;
                    margin-bottom: 7px;
                    border: 1px solid #e8edf3;
                    border-radius: 12px;
                    background: #fff;
                    transition:
                        transform .16s ease,
                        box-shadow .16s ease,
                        border-color .16s ease;
                }

                .entry-card:hover {
                    transform: translateY(-1px);
                    border-color: #cfe0fb;
                    box-shadow:
                        0 7px 20px rgba(15,23,42,.055);
                }

                .entry-main,
                .entry-cell {
                    min-width: 0;
                }

                .broker-name {
                    color: #172033;
                    font-size: 13px;
                    font-weight: 850;
                    overflow-wrap: anywhere;
                }

                .entry-date {
                    margin-top: 3px;
                    color: #64748b;
                    font-size: 11px;
                    white-space: nowrap;
                }

                .entry-label {
                    margin-bottom: 3px;
                    color: #94a3b8;
                    font-size: 9px;
                    line-height: 1.2;
                    font-weight: 850;
                    text-transform: uppercase;
                    letter-spacing: .35px;
                }

                .entry-value {
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.3;
                    font-weight: 800;
                    overflow-wrap: anywhere;
                }

                .result-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 50px;
                    padding: 4px 8px;
                    border-radius: 999px;
                    font-size: 10px;
                    line-height: 1;
                    font-weight: 850;
                }

                .result-profit {
                    background: #dcfce7;
                    color: #15803d;
                }

                .result-loss {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .entry-actions {
                    grid-column: 1 / -1;
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 7px;
                    padding-top: 9px;
                    margin-top: 1px;
                    border-top: 1px solid #edf1f5;
                }

                .entry-action-btn {
                    min-width: 0;
                    min-height: 36px;
                    height: 36px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    border: 1px solid #dbe3ec;
                    border-radius: 9px;
                    background: #fff;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 850;
                    transition:
                        transform .16s ease,
                        background .16s ease,
                        border-color .16s ease,
                        box-shadow .16s ease;
                }

                .entry-action-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 5px 14px rgba(15,23,42,.07);
                }

                .edit-action {
                    color: #2563eb;
                    background: #eff6ff;
                    border-color: #bfdbfe;
                }

                .edit-action:hover {
                    background: #dbeafe;
                    border-color: #93c5fd;
                }

                .delete-action {
                    color: #dc2626;
                    background: #fff7f7;
                    border-color: #fecaca;
                }

                .delete-action:hover {
                    background: #fee2e2;
                    border-color: #fca5a5;
                }

                .action-icon {
                    font-size: 14px;
                    line-height: 1;
                }

                .details-row {
                    grid-column: 1 / -1;
                    display: grid;
                    grid-template-columns:
                        repeat(3, minmax(0, 1fr));
                    gap: 8px;
                    padding-top: 9px;
                    border-top: 1px solid #f1f5f9;
                }

                .details-item {
                    min-width: 0;
                    padding: 8px;
                    border-radius: 8px;
                    background: #f8fafc;
                }

                .details-text {
                    color: #475569;
                    font-size: 11px;
                    line-height: 1.45;
                    overflow-wrap: anywhere;
                }

                .empty-state,
                .loading {
                    text-align: center;
                    padding: 42px 15px;
                    color: #64748b;
                }

                .empty-icon {
                    margin-bottom: 6px;
                    font-size: 30px;
                }

                .spinner {
                    width: 25px;
                    height: 25px;
                    margin: 0 auto 8px;
                    border: 3px solid #dbeafe;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: spin .8s linear infinite;
                }

                .login-required {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: #f8fafc;
                    font-family:
                        Inter,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }

                .login-card {
                    width: min(420px, 100%);
                    padding: 28px;
                    text-align: center;
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    box-shadow:
                        0 15px 45px rgba(15,23,42,.08);
                }

                .login-icon {
                    margin-bottom: 8px;
                    font-size: 32px;
                }

                .login-card h2 {
                    margin: 0 0 7px;
                    font-size: 20px;
                }

                .login-card p {
                    margin: 0;
                    color: #64748b;
                    font-size: 13px;
                }

                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: auto;
                    padding:
                        max(16px, env(safe-area-inset-top))
                        max(12px, env(safe-area-inset-right))
                        max(16px, env(safe-area-inset-bottom))
                        max(12px, env(safe-area-inset-left));
                    background: rgba(15,23,42,.56);
                    backdrop-filter: blur(6px);
                    overscroll-behavior: contain;
                    animation: fadeIn .18s ease;
                }

                .modal {
                    width: min(480px, calc(100vw - 24px));
                    max-height: min(90vh, 760px);
                    overflow-y: auto;
                    overscroll-behavior: contain;
                    padding: 0;
                    background: #fff;
                    border: 1px solid rgba(255,255,255,.9);
                    border-radius: 17px;
                    box-shadow:
                        0 28px 80px rgba(15,23,42,.30);
                    animation: modalIn .2s ease;
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 transparent;
                }

                .modal::-webkit-scrollbar {
                    width: 7px;
                }

                .modal::-webkit-scrollbar-track {
                    background: transparent;
                }

                .modal::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 999px;
                }

                .modal-wide {
                    width: min(720px, calc(100vw - 24px));
                }

                .modal-header {
                    position: sticky;
                    top: 0;
                    z-index: 3;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    min-height: 58px;
                    margin: 0;
                    padding: 12px 17px;
                    background: rgba(255,255,255,.97);
                    border-bottom: 1px solid #edf1f5;
                    backdrop-filter: blur(8px);
                }

                .modal-header h3 {
                    min-width: 0;
                    margin: 0;
                    color: #172033;
                    font-size: 17px;
                    line-height: 1.25;
                    font-weight: 850;
                    overflow-wrap: anywhere;
                }

                .modal-close {
                    width: 30px;
                    min-width: 30px;
                    height: 30px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: #f8fafc;
                    color: #475569;
                    cursor: pointer;
                    font-weight: 850;
                }

                .modal-copy {
                    margin: 0;
                    padding: 16px 17px 2px;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.5;
                }

                .modal-actions {
                    position: sticky;
                    bottom: 0;
                    z-index: 3;
                    display: flex;
                    justify-content: flex-end;
                    gap: 7px;
                    margin: 16px 0 0;
                    padding: 11px 17px;
                    background: rgba(255,255,255,.97);
                    border-top: 1px solid #edf1f5;
                    backdrop-filter: blur(8px);
                }

                .modal-form {
                    padding: 16px 17px 0;
                }

                .modal-form + .modal-actions {
                    margin-top: 0;
                }

                .form-grid {
                    padding-bottom: 2px;
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }

                .field {
                    min-width: 0;
                }

                .field.full {
                    grid-column: 1 / -1;
                }

                .field label {
                    display: block;
                    margin-bottom: 5px;
                    color: #475569;
                    font-size: 11px;
                    font-weight: 850;
                }

                .optional {
                    color: #94a3b8;
                    font-weight: 500;
                }

                textarea.input {
                    min-height: 72px;
                    resize: vertical;
                }

                .broker-row,
                .broker-add-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    min-width: 0;
                }

                .broker-row .select {
                    flex: 1;
                }

                .add-broker-btn {
                    width: 40px;
                    min-width: 40px;
                    height: 40px;
                    border: 1px solid #d5dfeb;
                    border-radius: 10px;
                    background: #f8fafc;
                    color: #2563eb;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: 850;
                    transition: .16s ease;
                }

                .add-broker-btn:hover {
                    background: #eff6ff;
                    transform: translateY(-1px);
                }

                .date-preview {
                    margin-top: 5px;
                    color: #64748b;
                    font-size: 10px;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 8px;
                }

                .detail-box {
                    min-width: 0;
                    padding: 10px;
                    border: 1px solid #edf1f5;
                    border-radius: 10px;
                    background: #f8fafc;
                }

                .detail-box.full {
                    grid-column: 1 / -1;
                }

                .detail-label {
                    margin-bottom: 4px;
                    color: #94a3b8;
                    font-size: 9px;
                    font-weight: 850;
                    text-transform: uppercase;
                    letter-spacing: .35px;
                }

                .detail-value {
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.45;
                    font-weight: 750;
                    overflow-wrap: anywhere;
                }

                .alert-container {
                    position: fixed;
                    z-index: 11000;
                    left: 50%;
                    top: 50%;
                    width: min(340px, calc(100vw - 28px));
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                }

                .alert-box {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 11px 12px;
                    background: rgba(255,255,255,.98);
                    border: 1px solid #e2e8f0;
                    border-left: 4px solid #2563eb;
                    border-radius: 11px;
                    box-shadow:
                        0 18px 50px rgba(15,23,42,.20);
                    color: #334155;
                    font-size: 12px;
                    line-height: 1.4;
                    font-weight: 750;
                    animation: alertIn .2s ease;
                }

                .alert-box.success {
                    border-left-color: #16a34a;
                }

                .alert-box.error {
                    border-left-color: #dc2626;
                }

                .alert-box.warning {
                    border-left-color: #f59e0b;
                }

                .alert-icon {
                    flex: 0 0 auto;
                    font-weight: 900;
                }

                .modal-form {
                    margin: 0;
                }

                @keyframes cardIn {
                    from {
                        opacity: 0;
                        transform: translateY(7px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes modalIn {
                    from {
                        opacity: 0;
                        transform: scale(.97) translateY(5px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                @keyframes alertIn {
                    from {
                        opacity: 0;
                        transform: scale(.96);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @keyframes refreshSpin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 900px) {
                    .trading-container {
                        padding: 14px;
                        padding-bottom: 34px;
                    }

                    .summary-grid {
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                    }

                    .weekly-list {
                        grid-template-columns:
                            repeat(3, minmax(0, 1fr));
                    }

                    .entry-card {
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                    }

                    .entry-actions {
                        justify-content: flex-start;
                    }
                }

                @media (max-width: 650px) {
                    .trading-page {
                        min-height: 100dvh;
                        padding-bottom: env(safe-area-inset-bottom);
                    }

                    .trading-container {
                        width: 100%;
                        max-width: none;
                        padding: 6px;
                        padding-bottom: 30px;
                    }

                    .page-heading {
                        margin-bottom: 9px;
                    }

                    .page-heading h1 {
                        font-size: 19px;
                    }

                    .header-actions {
                        gap: 5px;
                    }

                    .header-actions .btn {
                        font-size: 11px;
                    }

                    .summary-top {
                        align-items: flex-start;
                        flex-direction: column;
                        gap: 7px;
                    }

                    .summary-top h2 {
                        width: 100%;
                        font-size: 17px;
                    }

                    .month-controls {
                        width: 100%;
                        grid-template-columns:
                            minmax(0, 1fr)
                            minmax(82px, 92px);
                    }

                    .month-select {
                        min-width: 0;
                    }

                    .year-select {
                        width: 100%;
                    }

                    .summary-grid {
                        grid-template-columns: 1fr;
                        gap: 7px;
                    }

                    .summary-card {
                        width: 100%;
                        padding: 13px;
                    }

                    .weekly-list {
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                    }

                    .week-item {
                        border-bottom: 1px solid #edf1f5;
                    }

                    .entry-card {
                        width: 100%;
                        grid-template-columns: 1fr 1fr;
                        gap: 9px;
                        padding: 10px;
                    }

                    .entry-main {
                        grid-column: 1 / -1;
                    }

                    .entry-actions {
                        grid-column: 1 / -1;
                        width: 100%;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }

                    .details-row {
                        grid-template-columns: 1fr;
                    }

                    .filters {
                        grid-template-columns: 1fr;
                        padding: 8px;
                    }

                    .history-header {
                        align-items: flex-start;
                    }

                    .history-header .btn {
                        flex: 0 0 auto;
                    }

                    .entries {
                        padding: 5px;
                    }

                    .form-grid,
                    .detail-grid {
                        grid-template-columns: 1fr;
                    }

                    .field.full,
                    .detail-box.full {
                        grid-column: auto;
                    }

                    .modal-backdrop {
                        padding: 8px;
                    }

                    .modal,
                    .modal-wide {
                        width: calc(100vw - 16px);
                        max-width: 520px;
                        max-height: 90vh;
                        border-radius: 14px;
                    }

                    .modal-header {
                        min-height: 54px;
                        padding: 10px 13px;
                    }

                    .modal-form {
                        padding: 13px 13px 0;
                    }

                    .modal-copy {
                        padding: 13px 13px 2px;
                    }

                    .modal-actions {
                        padding: 10px 13px;
                    }

                    .modal-header h3 {
                        font-size: 16px;
                    }

                    .alert-container {
                        width: min(330px, calc(100vw - 24px));
                    }
                }

                @media (max-width: 400px) {
                    .trading-container {
                        padding: 5px;
                    }

                    .page-heading h1 {
                        font-size: 18px;
                    }

                    .btn {
                        padding-left: 9px;
                        padding-right: 9px;
                    }

                    .weekly-list {
                        grid-template-columns: 1fr 1fr;
                    }

                    .entry-card {
                        padding: 9px;
                    }

                    .entry-action-btn {
                        min-height: 38px;
                        height: 38px;
                        font-size: 11px;
                    }

                    .summary-value {
                        font-size: 20px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .trading-page *,
                    .trading-page *::before,
                    .trading-page *::after {
                        animation-duration: .01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: .01ms !important;
                    }
                }
            `}</style>

            {alert && (
                <div className="alert-container" role="status">
                    <div className={`alert-box ${alert.type}`}>
                        <span className="alert-icon">
                            {alert.type === "success"
                                ? "✓"
                                : alert.type === "error"
                                ? "!"
                                : "⚠"}
                        </span>
                        <span>{alert.message}</span>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setConfirmDelete(null);
                        }
                    }}
                >
                    <div className="modal" role="dialog" aria-modal="true">
                        <div className="modal-header">
                            <h3>Delete Trading Entry?</h3>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() =>
                                    setConfirmDelete(null)
                                }
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <p className="modal-copy">
                            Delete the {confirmDelete.broker_name || "trading"}{" "}
                            entry from {formatDate(confirmDelete.date)}?
                            This action cannot be undone.
                        </p>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() =>
                                    setConfirmDelete(null)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={deleteEntry}
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
                        if (e.target === e.currentTarget) {
                            resetForm();
                        }
                    }}
                >
                    <div className="modal modal-wide" role="dialog" aria-modal="true">
                        <div className="modal-header">
                            <h3>
                                {editingId
                                    ? "Edit Trading Journal"
                                    : "Add Trading Journal"}
                            </h3>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={resetForm}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <form className="modal-form" onSubmit={saveEntry}>
                            <div className="form-grid">
                                <div className="field">
                                    <label>Broker *</label>

                                    <div className="broker-row">
                                        <select
                                            className="select"
                                            name="broker_name"
                                            value={form.broker_name}
                                            onChange={handleChange}
                                        >
                                            <option value="">
                                                Select broker
                                            </option>

                                            {brokers.map((broker) => (
                                                <option
                                                    key={broker}
                                                    value={broker}
                                                >
                                                    {broker}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            className="add-broker-btn"
                                            onClick={() =>
                                                setShowBrokerInput(
                                                    !showBrokerInput
                                                )
                                            }
                                            aria-label="Add broker"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {showBrokerInput && (
                                        <div className="broker-add-row">
                                            <input
                                                className="input"
                                                placeholder="New broker name"
                                                value={newBroker}
                                                onChange={(e) =>
                                                    setNewBroker(
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={addNewBroker}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="field">
                                    <label>Date *</label>

                                    <input
                                        className="input"
                                        type="date"
                                        name="date"
                                        value={form.date}
                                        onChange={handleChange}
                                    />

                                    <div className="date-preview">
                                        {form.date
                                            ? `Selected: ${formatDate(form.date)}`
                                            : "Select a date"}
                                    </div>
                                </div>

                                <div className="field">
                                    <label>Result *</label>

                                    <select
                                        className="select"
                                        name="result"
                                        value={form.result}
                                        onChange={handleChange}
                                    >
                                        <option value="Profit">
                                            Profit
                                        </option>
                                        <option value="Loss">
                                            Loss
                                        </option>
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Profit / Loss Amount *</label>

                                    <input
                                        className="input"
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        step="1"
                                        pattern="[0-9]*"
                                        name="amount"
                                        placeholder="2000"
                                        value={form.amount}
                                        onChange={handleAmountChange}
                                    />
                                </div>

                                <div className="field">
                                    <label>Segment *</label>

                                    <select
                                        className="select"
                                        name="segment"
                                        value={form.segment}
                                        onChange={handleChange}
                                    >
                                        <option value="">
                                            Select segment
                                        </option>

                                        {SEGMENTS.map((segment) => (
                                            <option
                                                key={segment}
                                                value={segment}
                                            >
                                                {segment}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="field">
                                    <label>
                                        Trades Today{" "}
                                        <span className="optional">
                                            (Optional)
                                        </span>
                                    </label>

                                    <input
                                        className="input"
                                        type="number"
                                        inputMode="numeric"
                                        min="0"
                                        step="1"
                                        name="trades_today"
                                        placeholder="5"
                                        value={form.trades_today}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="field full">
                                    <label>
                                        Strategy / Logic{" "}
                                        <span className="optional">
                                            (Optional)
                                        </span>
                                    </label>

                                    <textarea
                                        className="input"
                                        name="strategy_logic"
                                        placeholder="Enter strategy or logic..."
                                        value={form.strategy_logic}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="field full">
                                    <label>
                                        Notes{" "}
                                        <span className="optional">
                                            (Optional)
                                        </span>
                                    </label>

                                    <textarea
                                        className="input"
                                        name="notes"
                                        placeholder="Additional notes..."
                                        value={form.notes}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                        ? "Update"
                                        : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <main className="trading-container">
                <header className="page-heading">
                    <h1>Trading Journal</h1>

                    <div className="header-actions">
                        <button
                            type="button"
                            className={`btn btn-secondary refresh-btn ${
                                refreshing ? "refreshing" : ""
                            }`}
                            onClick={refreshAll}
                            title="Refresh"
                            aria-label="Refresh"
                        >
                            ↻
                        </button>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={openAddForm}
                        >
                            + Add
                        </button>
                    </div>
                </header>

                <section className="summary-section">
                    <div className="summary-top">
                        <h2>
                            {monthName} {selectedYear} Performance
                        </h2>

                        <div className="month-controls">
                            <select
                                className="select month-select"
                                value={selectedMonth}
                                onChange={(e) =>
                                    setSelectedMonth(e.target.value)
                                }
                                aria-label="Select month"
                            >
                                {MONTHS.map((month, index) => (
                                    <option
                                        key={month}
                                        value={String(index + 1).padStart(
                                            2,
                                            "0"
                                        )}
                                    >
                                        {month}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="select year-select"
                                value={selectedYear}
                                onChange={(e) =>
                                    setSelectedYear(e.target.value)
                                }
                                aria-label="Select year"
                            >
                                {Array.from(
                                    { length: 7 },
                                    (_, i) =>
                                        new Date().getFullYear() - 3 + i
                                ).map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="summary-grid">
                        <div className="summary-card">
                            <div className="summary-label">
                                Total Profit
                            </div>
                            <div className="summary-value profit">
                                {formatMoney(totalProfit)}
                            </div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-label">
                                Total Loss
                            </div>
                            <div className="summary-value loss">
                                {formatMoney(totalLoss)}
                            </div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-label">
                                Net P&amp;L
                            </div>
                            <div
                                className={`summary-value ${
                                    netPnl >= 0
                                        ? "profit"
                                        : "loss"
                                }`}
                            >
                                {formatMoney(netPnl)}
                            </div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-label">
                                Trades
                            </div>
                            <div className="summary-value neutral">
                                {totalTrades || entryCount}
                            </div>
                        </div>
                    </div>

                    <div className="weekly-card">
                        <div className="weekly-title">
                            Weekly P&amp;L
                        </div>

                        <div className="weekly-list">
                            {weekly.length > 0 ? (
                                weekly.map((week) => (
                                    <div
                                        className="week-item"
                                        key={week.week_number}
                                    >
                                        <div className="week-number">
                                            Week {week.week_number}
                                        </div>

                                        <div
                                            className={`week-net ${
                                                Number(week.net_pnl) >= 0
                                                    ? "profit"
                                                    : "loss"
                                            }`}
                                        >
                                            {formatMoney(week.net_pnl)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div
                                    style={{
                                        padding: "14px",
                                        color: "#64748b",
                                        fontSize: "11px",
                                    }}
                                >
                                    No weekly data for this month.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="history-card">
                    <div className="history-header">
                        <div>
                            <h2>Trading History</h2>
                            <div className="history-count">
                                {filteredEntries.length}{" "}
                                {filteredEntries.length === 1
                                    ? "entry"
                                    : "entries"}{" "}
                                found · Edit or delete below each card
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                                setSearch("");
                                setFilterResult("All");
                                setFilterSegment("All");
                                showAlert(
                                    "success",
                                    "Filters cleared."
                                );
                            }}
                        >
                            Clear
                        </button>
                    </div>

                    <div className="filters">
                        <input
                            className="input"
                            placeholder="Search broker, segment, strategy..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                        <select
                            className="select"
                            value={filterResult}
                            onChange={(e) =>
                                setFilterResult(e.target.value)
                            }
                        >
                            <option value="All">All Results</option>
                            <option value="Profit">Profit</option>
                            <option value="Loss">Loss</option>
                        </select>

                        <select
                            className="select"
                            value={filterSegment}
                            onChange={(e) =>
                                setFilterSegment(e.target.value)
                            }
                        >
                            <option value="All">All Segments</option>

                            {[
                                ...new Set(
                                    entries
                                        .map((item) => item.segment)
                                        .filter(Boolean)
                                ),
                            ].map((segment) => (
                                <option
                                    key={segment}
                                    value={segment}
                                >
                                    {segment}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="entries">
                        {loading ? (
                            <div className="loading">
                                <div className="spinner" />
                                Loading trading history...
                            </div>
                        ) : filteredEntries.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📊</div>
                                <strong>No trading records</strong>
                                <div
                                    style={{
                                        marginTop: "5px",
                                        fontSize: "11px",
                                    }}
                                >
                                    Add your first trading journal entry.
                                </div>
                            </div>
                        ) : (
                            filteredEntries.map((entry) => (
                                <div
                                    className="entry-card"
                                    key={entry.id}
                                >
                                    <div className="entry-main">
                                        <div className="broker-name">
                                            {entry.broker_name || "-"}
                                        </div>

                                        <div className="entry-date">
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>

                                    <div className="entry-cell">
                                        <div className="entry-label">
                                            Result
                                        </div>

                                        <span
                                            className={`result-badge ${
                                                entry.result === "Profit"
                                                    ? "result-profit"
                                                    : "result-loss"
                                            }`}
                                        >
                                            {entry.result || "-"}
                                        </span>
                                    </div>

                                    <div className="entry-cell">
                                        <div className="entry-label">
                                            Amount
                                        </div>

                                        <div
                                            className={`entry-value ${
                                                entry.result === "Profit"
                                                    ? "profit"
                                                    : "loss"
                                            }`}
                                        >
                                            {entry.result === "Loss"
                                                ? "-"
                                                : "+"}
                                            {formatMoney(entry.amount)}
                                        </div>
                                    </div>

                                    <div className="entry-cell">
                                        <div className="entry-label">
                                            Segment
                                        </div>

                                        <div className="entry-value">
                                            {entry.segment || "-"}
                                        </div>
                                    </div>

                                    <div
                                        className="entry-actions"
                                        onClick={(e) =>
                                            e.stopPropagation()
                                        }
                                    >
                                        <button
                                            type="button"
                                            className="entry-action-btn edit-action"
                                            title="Edit trading entry"
                                            aria-label="Edit trading entry"
                                            onClick={() =>
                                                editEntry(entry)
                                            }
                                        >
                                            <span className="action-icon">✎</span>
                                            <span>Edit</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="entry-action-btn delete-action"
                                            title="Delete trading entry"
                                            aria-label="Delete trading entry"
                                            onClick={() =>
                                                setConfirmDelete(entry)
                                            }
                                        >
                                            <span className="action-icon">🗑</span>
                                            <span>Delete</span>
                                        </button>
                                    </div>

                                    {(entry.strategy_logic ||
                                        entry.notes ||
                                        entry.trades_today) && (
                                        <div className="details-row">
                                            {entry.trades_today !== null &&
                                                entry.trades_today !==
                                                    undefined &&
                                                entry.trades_today !== "" && (
                                                    <div className="details-item">
                                                        <div className="entry-label">
                                                            Trades Today
                                                        </div>
                                                        <div className="details-text">
                                                            {
                                                                entry.trades_today
                                                            }
                                                        </div>
                                                    </div>
                                                )}

                                            {entry.strategy_logic && (
                                                <div className="details-item">
                                                    <div className="entry-label">
                                                        Strategy / Logic
                                                    </div>
                                                    <div className="details-text">
                                                        {
                                                            entry.strategy_logic
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            {entry.notes && (
                                                <div className="details-item">
                                                    <div className="entry-label">
                                                        Notes
                                                    </div>
                                                    <div className="details-text">
                                                        {entry.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
