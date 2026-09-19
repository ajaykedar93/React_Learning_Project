import React, { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const HISTORY_KEY = "ajay_kedar_calculator_history";

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "0";

  return Number(value.toFixed(10)).toLocaleString("en-IN", {
    maximumFractionDigits: 10,
  });
};

const cleanForCalculation = (expression) => {
  return expression
    .replace(/\s*\([^()]*\)/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "");
};

const calculateExpression = (expression) => {
  try {
    const clean = cleanForCalculation(expression);

    if (!clean) return null;

    // Only calculator characters are allowed.
    if (!/^[0-9+\-*/().%]+$/.test(clean)) {
      return null;
    }

    // Convert percentage.
    const converted = clean.replace(
      /(\d+(?:\.\d+)?)%/g,
      "($1/100)"
    );

    const value = Function(
      `"use strict"; return (${converted})`
    )();

    if (!Number.isFinite(value)) return null;

    return value;
  } catch {
    return null;
  }
};

const getLastAmount = (expression) => {
  const match = expression.match(
    /(\d+(?:\.\d+)?)\s*(?:\(([^()]*)\))?$/
  );

  if (!match) return null;

  return {
    number: match[1],
    description: match[2] || "",
    start: match.index,
  };
};

export default function Calculate() {
  const [expression, setExpression] = useState("");

  const [description, setDescription] = useState("");
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const [total, setTotal] = useState(null);
  const [showTotal, setShowTotal] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [usdAmount, setUsdAmount] = useState("");
  const [usdRate, setUsdRate] = useState(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState("");

  const descriptionRef = useRef(null);

  /* =========================================================
     LOAD HISTORY
  ========================================================= */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 10));
        }
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const updateHistory = (items) => {
    const limited = items.slice(0, 10);

    setHistory(limited);

    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(limited)
      );
    } catch {
      // Ignore localStorage errors.
    }
  };

  /* =========================================================
     DESCRIPTION
  ========================================================= */

  const openDescription = () => {
    if (!expression.trim()) return;

    setDescriptionOpen(true);
    setShowTotal(false);

    const last = getLastAmount(expression);

    // Only load description if this exact amount already has one.
    // New amounts remain completely blank.
    setDescription(last?.description || "");

    setTimeout(() => {
      descriptionRef.current?.focus();
    }, 100);
  };

  const closeDescription = () => {
    setDescriptionOpen(false);
    setDescription("");
  };

  const handleDescriptionChange = (value) => {
    const safeText = value
      .replace(/[()]/g, "")
      .trimStart();

    setDescription(safeText);
    setShowTotal(false);

    const last = getLastAmount(expression);

    if (!last) return;

    const before = expression.substring(0, last.start);

    const replacement = safeText
      ? `${last.number} (${safeText})`
      : last.number;

    setExpression(before + replacement);
  };

  /* =========================================================
     MAIN INPUT
  ========================================================= */

  const handleExpressionChange = (value) => {
    setExpression(value);
    setShowTotal(false);
    setTotal(null);

    if (descriptionOpen) {
      const last = getLastAmount(value);

      // If user typed a new amount after an operator,
      // the description must be fresh.
      setDescription(last?.description || "");
    }
  };

  /* =========================================================
     NUMBER
  ========================================================= */

  const addNumber = (value) => {
    setShowTotal(false);
    setTotal(null);

    setExpression((previous) => {
      const next = previous + value;

      // If there is an operator before the new number,
      // this is a new amount, so clear old description.
      if (descriptionOpen) {
        const trimmed = previous.trim();

        if (
          /[+\-*/%]\s*$/.test(trimmed) ||
          trimmed === ""
        ) {
          setDescription("");
        }
      }

      return next;
    });
  };

  /* =========================================================
     DECIMAL
  ========================================================= */

  const addDecimal = () => {
    setShowTotal(false);
    setTotal(null);

    setExpression((previous) => {
      const parts = previous.split(/[\s+\-*/]/);
      const lastPart = parts[parts.length - 1];

      if (lastPart.includes(".")) {
        return previous;
      }

      if (!lastPart) {
        return previous + "0.";
      }

      return previous + ".";
    });
  };

  /* =========================================================
     OPERATOR
  ========================================================= */

  const addOperator = (operator) => {
    setShowTotal(false);
    setTotal(null);

    setExpression((previous) => {
      let value = previous.trim();

      if (!value) return value;

      // Don't allow two operators together.
      if (/[+\-*/]\s*$/.test(value)) {
        value = value.slice(0, -1).trim();
      }

      // Description is now completed for the previous amount.
      // Clear description for the NEXT amount.
      setDescription("");

      return `${value} ${operator} `;
    });
  };

  /* =========================================================
     PERCENT
  ========================================================= */

  const addPercent = () => {
    setShowTotal(false);
    setTotal(null);

    setExpression((previous) => {
      if (!previous.trim()) return previous;

      if (/%\s*$/.test(previous)) {
        return previous;
      }

      return `${previous}%`;
    });
  };

  /* =========================================================
     BACKSPACE
  ========================================================= */

  const backspace = () => {
    setShowTotal(false);
    setTotal(null);

    setExpression((previous) => {
      const value = previous.slice(0, -1);

      if (descriptionOpen) {
        const last = getLastAmount(value);
        setDescription(last?.description || "");
      }

      return value;
    });
  };

  /* =========================================================
     CLEAR
  ========================================================= */

  const clearAll = () => {
    setExpression("");
    setDescription("");
    setDescriptionOpen(false);
    setTotal(null);
    setShowTotal(false);
  };

  /* =========================================================
     TOTAL
  ========================================================= */

  const calculateTotal = () => {
    if (!expression.trim()) return;

    const value = calculateExpression(expression);

    if (value === null) {
      setTotal(null);
      setShowTotal(true);
      return;
    }

    const formatted = formatNumber(value);

    setTotal(formatted);
    setShowTotal(true);

    // Store ONLY final total.
    const newItem = {
      id: Date.now(),
      total: formatted,
    };

    updateHistory([newItem, ...history]);

    // Keep current expression but close description field.
    setDescriptionOpen(false);
    setDescription("");
  };

  /* =========================================================
     HISTORY
  ========================================================= */

  const deleteHistory = (id) => {
    const updated = history.filter(
      (item) => item.id !== id
    );

    updateHistory(updated);
  };

  const deleteAllHistory = () => {
    updateHistory([]);
  };

  /* =========================================================
     CURRENCY
  ========================================================= */

  const loadUsdRate = async () => {
    setCurrencyLoading(true);
    setCurrencyError("");

    try {
      const response = await fetch(
        "https://open.er-api.com/v6/latest/USD"
      );

      if (!response.ok) {
        throw new Error("Unable to load rate");
      }

      const data = await response.json();

      if (!data?.rates?.INR) {
        throw new Error("INR rate unavailable");
      }

      setUsdRate(data.rates.INR);
    } catch {
      setCurrencyError(
        "Unable to load rate. Please try again."
      );
    } finally {
      setCurrencyLoading(false);
    }
  };

  const toggleCurrency = () => {
    const next = !currencyOpen;

    setCurrencyOpen(next);

    if (next && usdRate === null) {
      loadUsdRate();
    }
  };

  const inrValue =
    usdAmount && usdRate
      ? Number(usdAmount) * usdRate
      : null;

  /* =========================================================
     KEYBOARD
  ========================================================= */

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;

      // Don't control typing inside description field.
      if (
        target &&
        target.classList.contains("description-input")
      ) {
        return;
      }

      const key = event.key;

      if (/^\d$/.test(key)) {
        addNumber(key);
        return;
      }

      if (key === ".") {
        addDecimal();
        return;
      }

      if (["+", "-", "*", "/"].includes(key)) {
        addOperator(key);
        return;
      }

      if (key === "%") {
        addPercent();
        return;
      }

      if (key === "Backspace") {
        backspace();
        return;
      }

      if (key === "Escape") {
        clearAll();
        return;
      }

      if (key === "Enter") {
        calculateTotal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  });

  /* =========================================================
     BUTTON
  ========================================================= */

  const KeyButton = ({
    children,
    onClick,
    type = "number",
    wide = false,
  }) => {
    return (
      <button
        type="button"
        className={`calc-key calc-key-${type} ${
          wide ? "calc-key-wide" : ""
        }`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  };

  return (
    <>
      <style>{`
        :root {
          --calc-bg: #f4f1ff;
          --calc-card: #ffffff;
          --calc-text: #17152b;
          --calc-muted: #77728f;

          --purple: #7c3aed;
          --purple-dark: #5b21b6;
          --violet: #8b5cf6;
          --pink: #ec4899;
          --blue: #2563eb;
          --cyan: #06b6d4;
          --green: #10b981;
          --orange: #f97316;
          --red: #ef4444;
          --yellow: #f59e0b;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background:
            radial-gradient(
              circle at top left,
              rgba(139, 92, 246, 0.15),
              transparent 35%
            ),
            radial-gradient(
              circle at bottom right,
              rgba(236, 72, 153, 0.12),
              transparent 35%
            ),
            var(--calc-bg);
          color: var(--calc-text);
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .calculator-page {
          min-height: 100vh;
          padding: 22px 14px 40px;
        }

        .calculator-wrapper {
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
        }

        /* TOP BAR */

        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
          padding: 0 2px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .brand-code {
          color: var(--purple);
          font-weight: 900;
          font-size: 17px;
        }

        .calculator-title {
          font-size: 16px;
          font-weight: 800;
          color: #302a49;
        }

        /* CARD */

        .calculator-card {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(124, 58, 237, 0.10);
          border-radius: 28px;
          padding: 18px;
          box-shadow:
            0 22px 60px rgba(68, 45, 130, 0.12),
            0 4px 14px rgba(68, 45, 130, 0.06);
          backdrop-filter: blur(18px);
        }

        /* INPUT */

        .main-input-wrap {
          position: relative;
        }

        .main-input {
          width: 100%;
          height: 62px;
          border: 1.5px solid #e6e1f2;
          border-radius: 17px;
          outline: none;
          background: #fbfaff;
          color: var(--calc-text);
          padding: 0 16px;
          font-size: 19px;
          font-weight: 700;
          transition: 0.25s ease;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
        }

        .main-input::placeholder {
          color: #aaa4bd;
          font-weight: 500;
        }

        .main-input:focus {
          background: #ffffff;
          border-color: var(--violet);
          box-shadow:
            0 0 0 4px rgba(124, 58, 237, 0.10),
            0 8px 25px rgba(124, 58, 237, 0.08);
        }

        /* DESCRIPTION */

        .description-area {
          margin-top: 9px;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .description-input-wrap {
          position: relative;
        }

        .description-prefix,
        .description-suffix {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          color: var(--purple);
          font-size: 17px;
          font-weight: 800;
          z-index: 2;
          pointer-events: none;
        }

        .description-prefix {
          left: 13px;
        }

        .description-suffix {
          right: 13px;
        }

        .description-input {
          width: 100%;
          height: 44px;
          border-radius: 13px;
          border: 1.5px solid #ddd5f4;
          background: #faf8ff;
          padding: 0 32px;
          outline: none;
          color: #3d315d;
          font-size: 15px;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .description-input:focus {
          border-color: var(--pink);
          box-shadow:
            0 0 0 3px rgba(236, 72, 153, 0.10);
          background: white;
        }

        .description-hint {
          margin-top: 5px;
          padding-left: 4px;
          color: #9991aa;
          font-size: 11px;
        }

        /* RESULT */

        .result-box {
          margin-top: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #f1ecff,
              #fff1f8
            );
          border: 1px solid rgba(124, 58, 237, 0.12);
        }

        .result-label {
          color: var(--calc-muted);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .result-value {
          margin-top: 2px;
          color: var(--purple-dark);
          font-size: 28px;
          font-weight: 900;
          word-break: break-word;
        }

        .error-result {
          color: var(--red);
          font-size: 14px;
          font-weight: 700;
        }

        /* TOOL BUTTONS */

        .tool-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          margin-top: 12px;
        }

        .tool-btn {
          min-height: 42px;
          border: 0;
          border-radius: 13px;
          font-weight: 800;
          font-size: 12px;
          transition: 0.2s ease;
          cursor: pointer;
        }

        .tool-btn:hover {
          transform: translateY(-2px);
        }

        .tool-btn:active {
          transform: scale(0.96);
        }

        .description-btn {
          color: #6d28d9;
          background: #f0eaff;
        }

        .description-btn.active {
          color: white;
          background:
            linear-gradient(
              135deg,
              var(--purple),
              var(--pink)
            );
          box-shadow:
            0 8px 20px rgba(124, 58, 237, 0.22);
        }

        .history-btn {
          color: #1d4ed8;
          background: #eaf1ff;
        }

        .currency-btn {
          color: #047857;
          background: #e5fbf3;
        }

        /* KEYPAD */

        .keypad {
          margin-top: 15px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 9px;
        }

        .calc-key {
          height: 58px;
          border: 0;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 0.13s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .calc-key:hover {
          transform: translateY(-2px);
        }

        .calc-key:active {
          transform: scale(0.94);
        }

        .calc-key-number {
          background: #f4f1fa;
          color: #28223e;
          box-shadow:
            0 4px 10px rgba(70, 50, 110, 0.06);
        }

        .calc-key-number:hover {
          background: #ebe5f8;
          box-shadow:
            0 8px 18px rgba(70, 50, 110, 0.10);
        }

        .calc-key-operator {
          color: white;
          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #9333ea
            );
          box-shadow:
            0 7px 16px rgba(124, 58, 237, 0.22);
        }

        .calc-key-operator:hover {
          background:
            linear-gradient(
              135deg,
              #6d28d9,
              #7e22ce
            );
        }

        .calc-key-action {
          color: #be123c;
          background: #fff0f4;
        }

        .calc-key-percent {
          color: #0369a1;
          background: #e8f7ff;
        }

        .calc-key-total {
          color: white;
          background:
            linear-gradient(
              135deg,
              #ec4899,
              #7c3aed
            );
          box-shadow:
            0 9px 22px rgba(236, 72, 153, 0.23);
        }

        .calc-key-total:hover {
          background:
            linear-gradient(
              135deg,
              #db2777,
              #6d28d9
            );
        }

        .calc-key-wide {
          grid-column: span 2;
        }

        /* HISTORY */

        .history-panel {
          margin-top: 15px;
          border-radius: 18px;
          background: #faf9ff;
          border: 1px solid #ebe5f7;
          overflow: hidden;
          animation: slideDown 0.2s ease;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 14px;
          border-bottom: 1px solid #eee9f6;
        }

        .history-title {
          font-size: 14px;
          font-weight: 900;
        }

        .clear-history {
          border: 0;
          background: transparent;
          color: var(--red);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .history-empty {
          padding: 22px 15px;
          text-align: center;
          color: #9a94aa;
          font-size: 13px;
        }

        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid #eee9f6;
        }

        .history-item:last-child {
          border-bottom: 0;
        }

        .history-total {
          color: #31265a;
          font-size: 17px;
          font-weight: 900;
        }

        .delete-history {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 10px;
          background: #fff0f2;
          color: var(--red);
          font-weight: 900;
          transition: 0.2s ease;
        }

        .delete-history:hover {
          background: #ffe0e5;
          transform: scale(1.05);
        }

        /* CURRENCY */

        .currency-panel {
          margin-top: 15px;
          padding: 15px;
          border-radius: 18px;
          background:
            linear-gradient(
              135deg,
              #ecfdf7,
              #effaff
            );
          border: 1px solid #d7f3e9;
          animation: slideDown 0.2s ease;
        }

        .currency-title {
          font-size: 14px;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .currency-input {
          height: 45px;
          border-radius: 12px;
          border: 1px solid #cfe8df;
          width: 100%;
          padding: 0 12px;
          outline: none;
          font-weight: 700;
          background: white;
        }

        .currency-input:focus {
          border-color: var(--green);
          box-shadow:
            0 0 0 3px rgba(16, 185, 129, 0.10);
        }

        .currency-result {
          margin-top: 11px;
          padding: 12px;
          border-radius: 12px;
          background: white;
          color: #047857;
          font-weight: 900;
        }

        .rate-text {
          margin-top: 7px;
          color: #658278;
          font-size: 11px;
        }

        .refresh-rate {
          border: 0;
          margin-top: 8px;
          border-radius: 10px;
          padding: 7px 11px;
          background: #dff8ed;
          color: #047857;
          font-size: 11px;
          font-weight: 800;
        }

        .currency-error {
          margin-top: 8px;
          color: var(--red);
          font-size: 12px;
          font-weight: 700;
        }

        /* DESKTOP */

        @media (min-width: 768px) {
          .calculator-page {
            padding-top: 45px;
          }

          .calculator-card {
            padding: 22px;
          }

          .main-input {
            height: 68px;
            font-size: 21px;
          }

          .calc-key {
            height: 64px;
          }
        }

        /* SMALL MOBILE */

        @media (max-width: 380px) {
          .calculator-page {
            padding: 14px 9px 30px;
          }

          .calculator-card {
            padding: 13px;
            border-radius: 23px;
          }

          .top-bar {
            margin-bottom: 13px;
          }

          .brand,
          .calculator-title {
            font-size: 14px;
          }

          .main-input {
            height: 57px;
            font-size: 17px;
          }

          .tool-row {
            gap: 6px;
          }

          .tool-btn {
            font-size: 10px;
          }

          .keypad {
            gap: 7px;
          }

          .calc-key {
            height: 53px;
            border-radius: 14px;
            font-size: 16px;
          }
        }
      `}</style>

      <div className="calculator-page">
        <div className="calculator-wrapper">

          {/* TOP ROW */}
          <div className="top-bar">
            <div className="brand">
              <span className="brand-code">
                &lt;/&gt;
              </span>

              <span>Ajay Kedar</span>
            </div>

            <div className="calculator-title">
              Calculator
            </div>
          </div>

          {/* MAIN CARD */}
          <div className="calculator-card">

            {/* MAIN INPUT */}
            <div className="main-input-wrap">
              <input
                type="text"
                className="main-input"
                placeholder="Enter amount"
                value={expression}
                onChange={(e) =>
                  handleExpressionChange(e.target.value)
                }
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {/* DESCRIPTION INPUT */}
            {descriptionOpen && (
              <div className="description-area">
                <div className="description-input-wrap">
                  <span className="description-prefix">
                    (
                  </span>

                  <input
                    ref={descriptionRef}
                    type="text"
                    className="description-input"
                    value={description}
                    onChange={(e) =>
                      handleDescriptionChange(
                        e.target.value
                      )
                    }
                    placeholder="Enter description"
                    autoComplete="off"
                    spellCheck="false"
                  />

                  <span className="description-suffix">
                    )
                  </span>
                </div>

                <div className="description-hint">
                  Description is added to the current amount.
                </div>
              </div>
            )}

            {/* RESULT */}
            {showTotal && (
              <div className="result-box">
                <div className="result-label">
                  Total
                </div>

                {total !== null ? (
                  <div className="result-value">
                    {total}
                  </div>
                ) : (
                  <div className="error-result">
                    Invalid expression
                  </div>
                )}
              </div>
            )}

            {/* TOOLS */}
            <div className="tool-row">

              <button
                type="button"
                className={`tool-btn description-btn ${
                  descriptionOpen ? "active" : ""
                }`}
                onClick={() => {
                  if (descriptionOpen) {
                    closeDescription();
                  } else {
                    openDescription();
                  }
                }}
              >
                {descriptionOpen
                  ? "Close Description"
                  : "Description"}
              </button>

              <button
                type="button"
                className="tool-btn history-btn"
                onClick={() =>
                  setHistoryOpen(!historyOpen)
                }
              >
                History
              </button>

              <button
                type="button"
                className="tool-btn currency-btn"
                onClick={toggleCurrency}
              >
                USD → INR
              </button>
            </div>

            {/* CURRENCY */}
            {currencyOpen && (
              <div className="currency-panel">
                <div className="currency-title">
                  USD → INR Converter
                </div>

                <input
                  type="number"
                  className="currency-input"
                  placeholder="Enter USD amount"
                  value={usdAmount}
                  onChange={(e) =>
                    setUsdAmount(e.target.value)
                  }
                  inputMode="decimal"
                />

                {currencyLoading && (
                  <div className="rate-text">
                    Loading exchange rate...
                  </div>
                )}

                {currencyError && (
                  <>
                    <div className="currency-error">
                      {currencyError}
                    </div>

                    <button
                      type="button"
                      className="refresh-rate"
                      onClick={loadUsdRate}
                    >
                      Retry Rate
                    </button>
                  </>
                )}

                {inrValue !== null && (
                  <div className="currency-result">
                    ₹ {formatNumber(inrValue)}
                  </div>
                )}

                {usdRate && (
                  <div className="rate-text">
                    1 USD = ₹{" "}
                    {formatNumber(usdRate)}
                  </div>
                )}
              </div>
            )}

            {/* HISTORY */}
            {historyOpen && (
              <div className="history-panel">
                <div className="history-header">
                  <div className="history-title">
                    Calculation History
                  </div>

                  {history.length > 0 && (
                    <button
                      type="button"
                      className="clear-history"
                      onClick={deleteAllHistory}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="history-empty">
                    No calculation history yet.
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      className="history-item"
                      key={item.id}
                    >
                      <div className="history-total">
                        {item.total}
                      </div>

                      <button
                        type="button"
                        className="delete-history"
                        onClick={() =>
                          deleteHistory(item.id)
                        }
                        aria-label="Delete history"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* KEYPAD */}
            <div className="keypad">

              <KeyButton
                type="action"
                onClick={clearAll}
              >
                AC
              </KeyButton>

              <KeyButton
                type="action"
                onClick={backspace}
              >
                ⌫
              </KeyButton>

              <KeyButton
                type="percent"
                onClick={addPercent}
              >
                %
              </KeyButton>

              <KeyButton
                type="operator"
                onClick={() => addOperator("/")}
              >
                ÷
              </KeyButton>

              <KeyButton onClick={() => addNumber("7")}>
                7
              </KeyButton>

              <KeyButton onClick={() => addNumber("8")}>
                8
              </KeyButton>

              <KeyButton onClick={() => addNumber("9")}>
                9
              </KeyButton>

              <KeyButton
                type="operator"
                onClick={() => addOperator("*")}
              >
                ×
              </KeyButton>

              <KeyButton onClick={() => addNumber("4")}>
                4
              </KeyButton>

              <KeyButton onClick={() => addNumber("5")}>
                5
              </KeyButton>

              <KeyButton onClick={() => addNumber("6")}>
                6
              </KeyButton>

              <KeyButton
                type="operator"
                onClick={() => addOperator("-")}
              >
                −
              </KeyButton>

              <KeyButton onClick={() => addNumber("1")}>
                1
              </KeyButton>

              <KeyButton onClick={() => addNumber("2")}>
                2
              </KeyButton>

              <KeyButton onClick={() => addNumber("3")}>
                3
              </KeyButton>

              <KeyButton
                type="operator"
                onClick={() => addOperator("+")}
              >
                +
              </KeyButton>

              <KeyButton onClick={() => addNumber("0")}>
                0
              </KeyButton>

              <KeyButton onClick={addDecimal}>
                .
              </KeyButton>

              <KeyButton
                type="total"
                wide
                onClick={calculateTotal}
              >
                TOTAL
              </KeyButton>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}