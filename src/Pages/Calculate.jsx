import React, { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const HISTORY_KEY = "ajay_kedar_calculator_history_v9";

/* =========================================================
   NUMBER HELPERS
========================================================= */

const normalizeDecimal = (value) => {
  let str = String(value ?? "").trim();

  if (!str) return "0";

  let negative = false;

  if (str.startsWith("-")) {
    negative = true;
    str = str.slice(1);
  }

  if (!str.includes(".")) {
    str = `${str}.0`;
  }

  let [integer, decimal] = str.split(".");

  integer = integer.replace(/^0+(?=\d)/, "");
  decimal = (decimal || "").replace(/0+$/, "");

  if (!integer) integer = "0";

  const result = decimal
    ? `${integer}.${decimal}`
    : integer;

  if (result === "0") return "0";

  return negative ? `-${result}` : result;
};

const formatNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "0";
  }

  const normalized = normalizeDecimal(value);

  const negative = normalized.startsWith("-");

  const clean = negative
    ? normalized.slice(1)
    : normalized;

  const [integer, decimal] = clean.split(".");

  const formattedInteger = integer.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ","
  );

  return `${negative ? "-" : ""}${formattedInteger}${
    decimal ? `.${decimal}` : ""
  }`;
};

/* =========================================================
   BIG NUMBER DECIMAL MATH
========================================================= */

const parseDecimal = (value) => {
  const normalized = normalizeDecimal(value);

  const negative = normalized.startsWith("-");

  const clean = negative
    ? normalized.slice(1)
    : normalized;

  const [integer, decimal = ""] =
    clean.split(".");

  return {
    negative,
    integer: BigInt(integer || "0"),
    decimal,
  };
};

const makeDecimal = (
  negative,
  integer,
  decimal
) => {
  const cleanDecimal =
    String(decimal).replace(/0+$/, "");

  let result = cleanDecimal
    ? `${integer.toString()}.${cleanDecimal}`
    : integer.toString();

  if (result === "0") return "0";

  return negative
    ? `-${result}`
    : result;
};

const addDecimal = (a, b) => {
  const A = parseDecimal(a);
  const B = parseDecimal(b);

  const scale = Math.max(
    A.decimal.length,
    B.decimal.length
  );

  const aInt =
    BigInt(
      `${A.integer}${A.decimal}`
    ) *
    10n **
      BigInt(
        scale - A.decimal.length
      );

  const bInt =
    BigInt(
      `${B.integer}${B.decimal}`
    ) *
    10n **
      BigInt(
        scale - B.decimal.length
      );

  const result =
    (A.negative ? -aInt : aInt) +
    (B.negative ? -bInt : bInt);

  const negative = result < 0n;

  const absolute = negative
    ? -result
    : result;

  const divisor =
    10n ** BigInt(scale);

  const integer =
    absolute / divisor;

  const decimal =
    (absolute % divisor)
      .toString()
      .padStart(scale, "0");

  return makeDecimal(
    negative,
    integer,
    decimal
  );
};

const subtractDecimal = (a, b) =>
  addDecimal(a, `-${normalizeDecimal(b)}`);

const multiplyDecimal = (a, b) => {
  const A = parseDecimal(a);
  const B = parseDecimal(b);

  const aInt = BigInt(
    `${A.integer}${A.decimal}`
  );

  const bInt = BigInt(
    `${B.integer}${B.decimal}`
  );

  const result = aInt * bInt;

  const scale =
    A.decimal.length +
    B.decimal.length;

  const negative =
    A.negative !== B.negative;

  if (scale === 0) {
    return makeDecimal(
      negative,
      result,
      ""
    );
  }

  const divisor =
    10n ** BigInt(scale);

  const integer =
    result / divisor;

  const decimal =
    (result % divisor)
      .toString()
      .padStart(scale, "0");

  return makeDecimal(
    negative,
    integer,
    decimal
  );
};

const divideDecimal = (a, b) => {
  const A = parseDecimal(a);
  const B = parseDecimal(b);

  const denominator = BigInt(
    `${B.integer}${B.decimal}`
  );

  if (denominator === 0n) {
    throw new Error("DIV_ZERO");
  }

  const numerator = BigInt(
    `${A.integer}${A.decimal}`
  );

  const precision = 20;

  let scaledNumerator = numerator;
  let scaledDenominator =
    denominator;

  const scaleDifference =
    B.decimal.length -
    A.decimal.length;

  if (scaleDifference > 0) {
    scaledNumerator *=
      10n **
        BigInt(scaleDifference);
  }

  if (scaleDifference < 0) {
    scaledDenominator *=
      10n **
        BigInt(-scaleDifference);
  }

  const multiplier =
    10n ** BigInt(precision);

  const result =
    (scaledNumerator *
      multiplier) /
    scaledDenominator;

  const negative =
    A.negative !== B.negative;

  const integer =
    result / multiplier;

  const decimal =
    (result % multiplier)
      .toString()
      .padStart(precision, "0");

  return makeDecimal(
    negative,
    integer,
    decimal
  );
};

const percentDecimal = (a, b) =>
  divideDecimal(
    multiplyDecimal(a, b),
    "100"
  );

/* =========================================================
   DESCRIPTION
========================================================= */

const removeDescriptions = (
  expression
) =>
  expression.replace(
    /\s*\([^()]*\)/g,
    ""
  );

/* =========================================================
   TOKENIZER
========================================================= */

const tokenize = (expression) => {
  const clean =
    removeDescriptions(expression)
      .replace(/,/g, "")
      .replace(/\s+/g, "")
      .trim();

  if (!clean) return [];

  const tokens = [];

  let number = "";

  const pushNumber = () => {
    if (number !== "") {
      tokens.push({
        type: "number",
        value: number,
      });

      number = "";
    }
  };

  for (
    let i = 0;
    i < clean.length;
    i++
  ) {
    const char = clean[i];

    if (
      /[0-9.]/.test(char)
    ) {
      number += char;
      continue;
    }

    if (
      "+-*/%()".includes(char)
    ) {
      pushNumber();

      tokens.push({
        type: "operator",
        value: char,
      });

      continue;
    }

    return null;
  }

  pushNumber();

  return tokens;
};

/* =========================================================
   BIG CALCULATOR
========================================================= */

const calculateExpression = (
  expression
) => {
  try {
    const originalTokens =
      tokenize(expression);

    if (
      !originalTokens ||
      !originalTokens.length
    ) {
      return null;
    }

    /*
      Special percentage:

      5000 % 10 = 500
      48509 % 20 = 9701.8
    */

    if (
      originalTokens.length === 3 &&
      originalTokens[0].type ===
        "number" &&
      originalTokens[1].value === "%" &&
      originalTokens[2].type ===
        "number"
    ) {
      return percentDecimal(
        originalTokens[0].value,
        originalTokens[2].value
      );
    }

    const tokens =
      originalTokens.map(
        (token) => ({ ...token })
      );

    /*
      Normal standalone percentage:
      10% = 0.1
    */

    const converted = [];

    for (
      let i = 0;
      i < tokens.length;
      i++
    ) {
      const current = tokens[i];

      if (
        current.type === "number" &&
        tokens[i + 1]?.value === "%"
      ) {
        converted.push({
          type: "number",
          value: divideDecimal(
            current.value,
            "100"
          ),
        });

        i++;
      } else {
        converted.push(current);
      }
    }

    let index = 0;

    const parsePrimary = () => {
      const token = converted[index];

      if (!token) {
        throw new Error(
          "INVALID"
        );
      }

      if (
        token.value === "+"
      ) {
        index++;

        return parsePrimary();
      }

      if (
        token.value === "-"
      ) {
        index++;

        return multiplyDecimal(
          "-1",
          parsePrimary()
        );
      }

      if (
        token.value === "("
      ) {
        index++;

        const value =
          parseAddSubtract();

        if (
          converted[index]?.value !==
          ")"
        ) {
          throw new Error(
            "BRACKET"
          );
        }

        index++;

        return value;
      }

      if (
        token.type === "number"
      ) {
        if (
          !/^\d+(?:\.\d+)?$/.test(
            token.value
          )
        ) {
          throw new Error(
            "NUMBER"
          );
        }

        index++;

        return normalizeDecimal(
          token.value
        );
      }

      throw new Error(
        "INVALID"
      );
    };

    const parseMultiplyDivide =
      () => {
        let left =
          parsePrimary();

        while (
          index <
          converted.length
        ) {
          const op =
            converted[index]
              ?.value;

          if (
            op !== "*" &&
            op !== "/"
          ) {
            break;
          }

          index++;

          const right =
            parsePrimary();

          if (op === "*") {
            left =
              multiplyDecimal(
                left,
                right
              );
          } else {
            left =
              divideDecimal(
                left,
                right
              );
          }
        }

        return left;
      };

    const parseAddSubtract =
      () => {
        let left =
          parseMultiplyDivide();

        while (
          index <
          converted.length
        ) {
          const op =
            converted[index]
              ?.value;

          if (
            op !== "+" &&
            op !== "-"
          ) {
            break;
          }

          index++;

          const right =
            parseMultiplyDivide();

          if (op === "+") {
            left =
              addDecimal(
                left,
                right
              );
          } else {
            left =
              subtractDecimal(
                left,
                right
              );
          }
        }

        return left;
      };

    const result =
      parseAddSubtract();

    if (
      index !==
      converted.length
    ) {
      throw new Error(
        "INVALID"
      );
    }

    return normalizeDecimal(
      result
    );
  } catch {
    return null;
  }
};

/* =========================================================
   NUMBER TO WORDS
========================================================= */

const numberToWords = (
  value,
  currency = "INR"
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const normalized =
    normalizeDecimal(value);

  const negative =
    normalized.startsWith("-");

  const clean = negative
    ? normalized.slice(1)
    : normalized;

  const [
    integerPart,
    decimalPart,
  ] = clean.split(".");

  let number;

  try {
    number = BigInt(
      integerPart || "0"
    );
  } catch {
    return "";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];

  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const under100 = (n) => {
    if (n < 10)
      return ones[n];

    if (n < 20)
      return teens[n - 10];

    return (
      tens[Math.floor(n / 10)] +
      (n % 10
        ? ` ${ones[n % 10]}`
        : "")
    );
  };

  const under1000 = (n) => {
    if (n < 100)
      return under100(n);

    return (
      `${ones[Math.floor(n / 100)]} Hundred` +
      (n % 100
        ? ` ${under100(
            n % 100
          )}`
        : "")
    );
  };

  if (number === 0n) {
    return currency === "INR"
      ? "Zero Rupees"
      : "Zero Dollars";
  }

  const groups = [
    {
      value: 1000000000000000n,
      name: "Quadrillion",
    },
    {
      value: 1000000000000n,
      name: "Trillion",
    },
    {
      value: 1000000000n,
      name: "Billion",
    },
    {
      value: 10000000n,
      name: "Crore",
    },
    {
      value: 100000n,
      name: "Lakh",
    },
    {
      value: 1000n,
      name: "Thousand",
    },
  ];

  const parts = [];

  let remaining = number;

  for (const group of groups) {
    if (
      remaining >= group.value
    ) {
      const count =
        remaining / group.value;

      remaining =
        remaining % group.value;

      let countText;

      if (count <= 999n) {
        countText =
          under1000(
            Number(count)
          );
      } else {
        countText =
          count.toString();
      }

      parts.push(
        `${countText} ${group.name}`
      );
    }
  }

  if (remaining > 0n) {
    parts.push(
      under1000(
        Number(remaining)
      )
    );
  }

  let result =
    parts.join(" ");

  if (decimalPart) {
    result +=
      " Point " +
      decimalPart
        .split("")
        .map(
          (digit) =>
            ones[
              Number(digit)
            ]
        )
        .join(" ");
  }

  if (negative) {
    result =
      `Minus ${result}`;
  }

  return currency === "INR"
    ? `${result} Rupees`
    : `${result} Dollars`;
};

/* =========================================================
   LAST AMOUNT
========================================================= */

const getLastAmount = (
  expression
) => {
  const match =
    expression.match(
      /(\d+(?:\.\d+)?)(?:\s*\(([^()]*)\))?$/
    );

  if (!match)
    return null;

  return {
    number: match[1],
    description:
      match[2] || "",
    start: match.index,
  };
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Calculate() {
  const [
    calculatorMode,
    setCalculatorMode,
  ] = useState(true);

  const [
    expression,
    setExpression,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    descriptionOpen,
    setDescriptionOpen,
  ] = useState(false);

  const [
    total,
    setTotal,
  ] = useState(null);

  const [
    showTotal,
    setShowTotal,
  ] = useState(false);

  const [
    history,
    setHistory,
  ] = useState([]);

  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(false);

  const [
    selectedEntryIndex,
    setSelectedEntryIndex,
  ] = useState(-1);

  const [
    currencyEditing,
    setCurrencyEditing,
  ] = useState(false);

  const [
    currencyDirection,
    setCurrencyDirection,
  ] = useState("USD_INR");

  const [
    currencyAmount,
    setCurrencyAmount,
  ] = useState("");

  const [
    usdRate,
    setUsdRate,
  ] = useState(null);

  const [
    currencyLoading,
    setCurrencyLoading,
  ] = useState(false);

  const [
    currencyError,
    setCurrencyError,
  ] = useState("");

  const inputRef =
    useRef(null);

  const descriptionRef =
    useRef(null);

  const currencyInputRef =
    useRef(null);

  /* =========================================================
     LOAD HISTORY
  ========================================================= */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          HISTORY_KEY
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (
          Array.isArray(parsed)
        ) {
          setHistory(
            parsed.slice(0, 10)
          );
        }
      }
    } catch {
      setHistory([]);
    }
  }, []);

  /* =========================================================
     HISTORY SAVE
  ========================================================= */

  const saveHistory = (
    items
  ) => {
    const limited =
      items.slice(0, 10);

    setHistory(limited);

    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(limited)
      );
    } catch {}
  };

  /* =========================================================
     AUTO SCROLL INPUT
  ========================================================= */

  useEffect(() => {
    if (
      !calculatorMode ||
      !inputRef.current
    ) {
      return;
    }

    requestAnimationFrame(() => {
      inputRef.current.scrollLeft =
        inputRef.current.scrollWidth;
    });
  }, [
    expression,
    calculatorMode,
  ]);

  /* =========================================================
     BLUR KEYBOARD WHEN KEYPAD USED
  ========================================================= */

  const preventKeyboard = () => {
    if (
      document.activeElement ===
      inputRef.current
    ) {
      inputRef.current.blur();
    }

    if (
      document.activeElement ===
      descriptionRef.current
    ) {
      descriptionRef.current.blur();
    }
  };

  /* =========================================================
     DESCRIPTION
  ========================================================= */

  const openDescription = () => {
    if (!expression.trim())
      return;

    const last =
      getLastAmount(
        expression
      );

    setDescription(
      last?.description || ""
    );

    setDescriptionOpen(true);
    setShowTotal(false);

    setTimeout(() => {
      descriptionRef.current?.focus();
    }, 100);
  };

  const closeDescription = () => {
    setDescriptionOpen(false);
    setDescription("");
  };

  const handleDescriptionChange = (
    value
  ) => {
    const cleanText =
      value
        .replace(/[()]/g, "")
        .trimStart();

    setDescription(
      cleanText
    );

    setShowTotal(false);

    const last =
      getLastAmount(
        expression
      );

    if (!last) return;

    const before =
      expression.slice(
        0,
        last.start
      );

    const replacement =
      cleanText
        ? `${last.number} (${cleanText})`
        : last.number;

    setExpression(
      before + replacement
    );
  };

  /* =========================================================
     INPUT
  ========================================================= */

  const handleExpressionChange = (
    value
  ) => {
    setExpression(value);
    setShowTotal(false);
    setTotal(null);
    setSelectedEntryIndex(-1);

    if (descriptionOpen) {
      const last =
        getLastAmount(value);

      setDescription(
        last?.description || ""
      );
    }
  };

  /* =========================================================
     ADD NUMBER
  ========================================================= */

  const addNumber = (
    number
  ) => {
    preventKeyboard();

    setShowTotal(false);
    setTotal(null);

    setExpression(
      (previous) => {
        const next =
          previous + number;

        if (
          descriptionOpen
        ) {
          const trimmed =
            previous.trim();

          if (
            !trimmed ||
            /[+\-*/]\s*$/.test(
              trimmed
            )
          ) {
            setDescription("");
            setDescriptionOpen(
              false
            );
          }
        }

        return next;
      }
    );
  };

  /* =========================================================
     DECIMAL
  ========================================================= */

  const addDecimal = () => {
    preventKeyboard();

    setShowTotal(false);
    setTotal(null);

    setExpression(
      (previous) => {
        const parts =
          previous.split(
            /[+\-*/%\s]/
          );

        const last =
          parts[
            parts.length - 1
          ];

        if (
          last.includes(".")
        ) {
          return previous;
        }

        if (!last) {
          return `${previous}0.`;
        }

        return `${previous}.`;
      }
    );
  };

  /* =========================================================
     OPERATOR
  ========================================================= */

  const addOperator = (
    operator
  ) => {
    preventKeyboard();

    setShowTotal(false);
    setTotal(null);

    setExpression(
      (previous) => {
        let value =
          previous.trim();

        if (!value)
          return value;

        if (
          /[+\-*/]\s*$/.test(
            value
          )
        ) {
          value =
            value
              .slice(0, -1)
              .trim();
        }

        setDescription("");
        setDescriptionOpen(
          false
        );

        return `${value} ${operator} `;
      }
    );
  };

  /* =========================================================
     PERCENT
  ========================================================= */

  const addPercent = () => {
    preventKeyboard();

    setShowTotal(false);
    setTotal(null);

    setExpression(
      (previous) => {
        const value =
          previous.trim();

        if (!value)
          return previous;

        if (
          value.endsWith("%")
        ) {
          return previous;
        }

        return `${value}%`;
      }
    );
  };

  /* =========================================================
     BACKSPACE
  ========================================================= */

  const backspace = () => {
    preventKeyboard();

    setShowTotal(false);
    setTotal(null);

    setExpression(
      (previous) => {
        const next =
          previous.slice(
            0,
            -1
          );

        if (
          descriptionOpen
        ) {
          const last =
            getLastAmount(
              next
            );

          setDescription(
            last?.description ||
              ""
          );
        }

        return next;
      }
    );
  };

  /* =========================================================
     CLEAR
  ========================================================= */

  const clearAll = () => {
    preventKeyboard();

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
    preventKeyboard();

    if (!expression.trim())
      return;

    const value =
      calculateExpression(
        expression
      );

    setShowTotal(true);

    if (value === null) {
      setTotal(null);
      return;
    }

    const formatted =
      formatNumber(value);

    setTotal(formatted);

    saveHistory([
      {
        id: Date.now(),
        expression,
        total: formatted,
      },
      ...history,
    ]);

    setDescriptionOpen(false);
    setDescription("");
  };

  /* =========================================================
     HISTORY
  ========================================================= */

  const deleteHistoryItem = (
    id
  ) => {
    saveHistory(
      history.filter(
        (item) =>
          item.id !== id
      )
    );
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  /* =========================================================
     USD RATE
  ========================================================= */

  const loadUsdRate = async () => {
    setCurrencyLoading(true);
    setCurrencyError("");

    try {
      const response =
        await fetch(
          "https://open.er-api.com/v6/latest/USD"
        );

      if (!response.ok) {
        throw new Error();
      }

      const data =
        await response.json();

      if (
        !data?.rates?.INR
      ) {
        throw new Error();
      }

      setUsdRate(
        Number(
          data.rates.INR
        )
      );
    } catch {
      setCurrencyError(
        "Unable to load current rate. Try again."
      );
    } finally {
      setCurrencyLoading(false);
    }
  };

  /* =========================================================
     CURRENCY MODE
  ========================================================= */

  const openCurrency = () => {
    preventKeyboard();

    setCalculatorMode(false);
    setHistoryOpen(false);
    setDescriptionOpen(false);
    setDescription("");
    setShowTotal(false);
    setTotal(null);
    setCurrencyAmount("");

    if (
      usdRate === null
    ) {
      loadUsdRate();
    }

    setTimeout(() => {
      currencyInputRef.current?.focus();
    }, 150);
  };

  const closeCurrency = () => {
    setCalculatorMode(true);
    setCurrencyAmount("");
    setCurrencyEditing(false);
  };

  const switchCurrency = () => {
    setCurrencyDirection(
      (previous) =>
        previous === "USD_INR"
          ? "INR_USD"
          : "USD_INR"
    );
    setCurrencyAmount("");
    setCurrencyEditing(false);
  };

  const currencyAddNumber = (value) => {
    preventKeyboard();
    setCurrencyAmount((previous) => {
      if (previous === "0") return value;
      return previous + value;
    });
  };

  const currencyAddDecimal = () => {
    preventKeyboard();
    setCurrencyAmount((previous) => {
      if (!previous) return "0.";
      return previous.includes(".") ? previous : `${previous}.`;
    });
  };

  const currencyBackspace = () => {
    preventKeyboard();
    setCurrencyAmount((previous) => previous.slice(0, -1));
  };

  const currencyClear = () => {
    preventKeyboard();
    setCurrencyAmount("");
  };

  const currencyValue =
    currencyAmount &&
    usdRate &&
    Number(currencyAmount) >= 0
      ? currencyDirection === "USD_INR"
        ? Number(currencyAmount) * usdRate
        : Number(currencyAmount) / usdRate
      : null;

  /* =========================================================
     PREVIOUS / NEXT NUMBER NAVIGATION
  ========================================================= */

  const getNumberEntries = () => {
    const matches = [];
    const regex = /\d+(?:\.\d+)?(?:\s*\([^()]*\))?/g;
    let match;
    while ((match = regex.exec(expression)) !== null) {
      matches.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return matches;
  };

  const selectEntry = (index) => {
    const entries = getNumberEntries();
    if (!entries[index]) return;
    setSelectedEntryIndex(index);
    setTimeout(() => {
      inputRef.current?.focus();
      const entry = entries[index];
      if (inputRef.current) {
        inputRef.current.setSelectionRange(entry.start, entry.end);

        // Keep the selected number visible in the horizontal input.
        const input = inputRef.current;
        const valueBefore = expression.slice(0, entry.start);
        const measure = document.createElement("span");
        const style = window.getComputedStyle(input);
        measure.style.position = "absolute";
        measure.style.visibility = "hidden";
        measure.style.whiteSpace = "pre";
        measure.style.font = style.font;
        measure.style.letterSpacing = style.letterSpacing;
        measure.textContent = valueBefore;
        document.body.appendChild(measure);
        const targetLeft = measure.offsetWidth;
        document.body.removeChild(measure);

        const padding = 24;
        input.scrollLeft = Math.max(
          0,
          targetLeft - input.clientWidth / 2 + padding
        );
      }
    }, 0);
  };

  const previousEntry = () => {
    const entries = getNumberEntries();
    if (!entries.length) return;
    const nextIndex =
      selectedEntryIndex < 0
        ? entries.length - 1
        : Math.max(0, selectedEntryIndex - 1);
    selectEntry(nextIndex);
  };

  const nextEntry = () => {
    const entries = getNumberEntries();
    if (!entries.length) return;
    const nextIndex =
      selectedEntryIndex < 0
        ? 0
        : Math.min(entries.length - 1, selectedEntryIndex + 1);
    selectEntry(nextIndex);
  };

  /* =========================================================
     KEY BUTTON
  ========================================================= */


  const KeyButton = ({
    children,
    onClick,
    type = "number",
    wide = false,
  }) => (
    <button
      type="button"
      className={`calc-key calc-key-${type} ${
        wide
          ? "calc-key-wide"
          : ""
      }`}
      onPointerDown={
        preventKeyboard
      }
      onClick={onClick}
    >
      {children}
    </button>
  );

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          min-height: 100%;
          margin: 0;
          padding: 0;
        }

        html {
          overflow-x: hidden;
        }

        body {
          overflow-x: hidden;
          background:
            radial-gradient(
              circle at 10% 3%,
              rgba(124,58,237,.16),
              transparent 31%
            ),
            radial-gradient(
              circle at 92% 95%,
              rgba(236,72,153,.13),
              transparent 31%
            ),
            #f6f3ff;

          color: #17152b;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Arial,
            sans-serif;

          -webkit-text-size-adjust: 100%;
        }

        button,
        input {
          font-family: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        input {
          -webkit-appearance: none;
        }

        /* =====================================
           PAGE
        ===================================== */

        .calculator-page {
          width: 100%;
          min-height: 100dvh;

          padding-top:
            max(8px, env(safe-area-inset-top));

          padding-right:
            max(9px, env(safe-area-inset-right));

          padding-bottom:
            max(10px, env(safe-area-inset-bottom));

          padding-left:
            max(9px, env(safe-area-inset-left));

          display: flex;
          justify-content: center;
          align-items: flex-start;

          overflow-x: hidden;
        }

        .calculator-wrapper {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        /* =====================================
           TOP
        ===================================== */

        .top-bar {
          width: 100%;

          min-height: 58px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 12px;

          padding:
            0 6px;

          margin-bottom: 9px;
        }

        .brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          color: #111827;
          font-size: clamp(12px, 2vw, 16px);
          font-weight: 800;
          white-space: nowrap;
        }

        .brand-code {
          color: #ef4444;
          font-size: clamp(15px, 2.4vw, 20px);
          font-weight: 900;
        }

        .calculator-title {
          color: #111827;

          font-size: clamp(30px, 4vw, 40px);
          font-weight: 800;
          font-family: "Segoe UI", "Inter", "Helvetica Neue", sans-serif;

          white-space: nowrap;
          letter-spacing: -0.03em;
        }

        /* =====================================
           CARD
        ===================================== */

        .calculator-card {
          width: 100%;

          padding: 12px 10px 8px;

          border:
            1px solid
            rgba(124,58,237,.10);

          border-radius: 22px;

          background:
            rgba(255,255,255,.98);

          box-shadow:
            0 22px 55px
              rgba(72,47,140,.12),
            0 4px 16px
              rgba(72,47,140,.05);

          overflow: visible;
        }

        /* =====================================
           INPUT
        ===================================== */

        .main-input {
          display: block;

          width: 100%;
          height: 118px;

          padding:
            0 16px;

          border:
            1.5px solid #ded8ed;

          border-radius: 17px;

          outline: none;

          background: #fcfbff;

          color: #17152b;

          font-size: 34px;
          font-weight: 750;

          white-space: nowrap;

          overflow-x: auto;
          overflow-y: hidden;

          scrollbar-width: none;

          transition:
            border-color .18s ease,
            box-shadow .18s ease;
        }

        .main-input::-webkit-scrollbar {
          display: none;
        }

        .main-input::placeholder {
          color: #aaa4bb;
          font-weight: 500;
        }

        .main-input:focus {
          background: white;

          border-color: #8b5cf6;

          box-shadow:
            0 0 0 4px
              rgba(124,58,237,.09);
        }

        /* =====================================
           DESCRIPTION
        ===================================== */

        .description-area {
          margin-top: 9px;
        }

        .description-wrap {
          position: relative;
          width: 100%;
        }

        .description-input {
          width: 100%;
          height: 44px;

          padding:
            0 31px;

          border:
            1.5px solid #ddd5f2;

          border-radius: 12px;

          outline: none;

          background: #faf8ff;

          color: #3d315d;

          font-size: 14px;
          font-weight: 650;
        }

        .description-input:focus {
          background: white;

          border-color: #ec4899;

          box-shadow:
            0 0 0 3px
              rgba(236,72,153,.10);
        }

        .description-bracket {
          position: absolute;

          top: 50%;

          transform:
            translateY(-50%);

          z-index: 2;

          color: #7c3aed;

          font-size: 17px;
          font-weight: 900;

          pointer-events: none;
        }

        .description-left {
          left: 12px;
        }

        .description-right {
          right: 12px;
        }

        .description-hint {
          margin:
            5px 3px 0;

          color: #9b94aa;

          font-size: 9px;
        }

        /* =====================================
           RESULT
        ===================================== */

        .result-box {
          width: 100%;

          margin-top: 11px;

          padding:
            13px 15px;

          border-radius: 15px;

          background:
            linear-gradient(
              135deg,
              #f0eaff,
              #fff0f8
            );

          border:
            1px solid
            rgba(124,58,237,.10);

          overflow: hidden;
        }

        .result-label {
          color: #837a98;

          font-size: 9px;
          font-weight: 900;

          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .result-value {
          margin-top: 2px;

          color: #5b21b6;

          font-size:
            clamp(23px, 7vw, 32px);

          line-height: 1.2;

          font-weight: 950;

          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .result-error {
          color: #dc2626;

          font-size: 13px;
          font-weight: 800;
        }

        /* =====================================
           TOOLS
        ===================================== */

        .tool-row {
          width: 100%;

          display: grid;

          grid-template-columns:
            repeat(3, minmax(0, 1fr));

          gap: 7px;

          margin-top: 11px;
        }

        .tool-btn {
          width: 100%;
          min-width: 0;

          height: 48px;

          border: 0;

          border-radius: 12px;

          font-size:
            clamp(10px, 2.7vw, 12px);

          font-weight: 900;

          cursor: pointer;

          white-space: nowrap;

          transition:
            transform .12s ease,
            filter .12s ease;
        }

        .tool-btn:active {
          transform: scale(.94);
          filter: brightness(.94);
        }

        .description-btn {
          color: #6d28d9;
          background: #efe9ff;
        }

        .description-btn.active {
          color: white;

          background:
            linear-gradient(
              135deg,
              #7c3aed,
              #ec4899
            );
        }

        .history-btn {
          color: #1d4ed8;
          background: #eaf1ff;
        }

        .currency-btn {
          color: #047857;
          background: #e5faf2;
        }

        .tool-row .currency-btn {
          height: 50px;
          font-size: clamp(11px, 2.9vw, 13px);
        }

        /* =====================================
           HISTORY
        ===================================== */

        .history-panel {
          width: 100%;

          margin-top: 10px;

          border:
            1px solid #e5def0;

          border-radius: 16px;

          background: #fbfaff;

          overflow: hidden;

          animation:
            historyOpen .18s ease;
        }

        @keyframes historyOpen {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .history-header {
          min-height: 46px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          padding:
            0 13px;

          border-bottom:
            1px solid #eee9f6;
        }

        .history-title {
          color: #2e2742;

          font-size: 14px;
          font-weight: 900;
        }

        .clear-history {
          border: 0;

          background: transparent;

          color: #ef4444;

          font-size: 10px;
          font-weight: 850;

          cursor: pointer;
        }

        .history-empty {
          padding:
            19px 13px;

          color: #9b94aa;

          font-size: 11px;

          text-align: center;
        }

        .history-item {
          min-height: 47px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          padding:
            6px 11px;

          border-bottom:
            1px solid #eee9f6;
        }

        .history-item:last-child {
          border-bottom: 0;
        }

        .history-total {
          min-width: 0;

          color: #31265a;

          font-size: 15px;
          font-weight: 900;

          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .delete-history {
          flex: 0 0 auto;

          width: 32px;
          height: 32px;

          border: 0;

          border-radius: 9px;

          background: #fff0f2;

          color: #ef4444;

          font-size: 19px;
          font-weight: 800;

          cursor: pointer;
        }

        .delete-history:active {
          transform: scale(.90);
        }

        /* =====================================
           KEYPAD
        ===================================== */

        .keypad {
          width: 100%;

          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 7px;

          margin-top: 13px;
        }

        .calc-key {
          width: 100%;
          min-width: 0;

          height:
            clamp(54px, 12vw, 62px);

          border: 0;

          border-radius: 15px;

          font-size:
            clamp(16px, 4.8vw, 19px);

          font-weight: 900;

          cursor: pointer;

          user-select: none;

          transition:
            transform .10s ease,
            filter .10s ease,
            box-shadow .12s ease;
        }

        .calc-key:active {
          transform: scale(.92);

          filter: brightness(.92);
        }

        .calc-key-number {
          color: #29233d;

          background: #f3f0f8;

          box-shadow:
            0 3px 9px
              rgba(70,50,110,.05);
        }

        .calc-key-action {
          color: #6d28d9;

          background: #f4f0ff;
        }

        .keypad .calc-key-action:first-child {
          color: #dc2626;

          background: #fee2e2;

          border-color: #fecaca;
        }

        .calc-key-percent {
          color: #0369a1;

          background: #e7f7ff;
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
            0 6px 14px
              rgba(124,58,237,.20);
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
            0 8px 19px
              rgba(236,72,153,.21);
        }

        .calc-key-wide {
          grid-column:
            span 2;
        }

        /* =====================================
           CURRENCY
        ===================================== */

        .currency-mode {
          width: 100%;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .currency-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          margin-bottom: 15px;
        }

        .currency-heading {
          color: #075e4b;

          font-size: 17px;
          font-weight: 950;
        }

        .currency-close {
          min-height: 39px;

          padding:
            0 11px;

          border: 0;

          border-radius: 10px;

          background: #f0edf7;

          color: #514969;

          font-size: 10px;
          font-weight: 850;

          cursor: pointer;
        }

        .currency-close:active {
          transform: scale(.94);
        }

        .currency-direction-card {
          min-height: 58px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          margin-bottom: 13px;

          padding:
            9px 10px;

          border:
            1px solid #d9eee7;

          border-radius: 13px;

          background: #f3fcf8;
        }

        .currency-direction-text {
          color: #287260;

          font-size: 11px;
          font-weight: 850;
        }

        .switch-currency {
          flex: 0 0 auto;

          width: 44px;
          height: 39px;

          border: 0;

          border-radius: 10px;

          color: white;

          background:
            linear-gradient(
              135deg,
              #10b981,
              #06b6d4
            );

          font-size: 20px;
          font-weight: 900;
        }

        .switch-currency:active {
          transform: scale(.90);
        }

        .currency-input-label {
          display: block;

          margin-bottom: 6px;

          color: #547d70;

          font-size: 10px;
          font-weight: 850;
        }

        .currency-input {
          width: 100%;
          height: 57px;

          padding:
            0 14px;

          border:
            1.5px solid #cfe7df;

          border-radius: 15px;

          outline: none;

          background: white;

          color: #17352d;

          font-size: 20px;
          font-weight: 850;
        }

        .currency-input:focus {
          border-color: #10b981;

          box-shadow:
            0 0 0 4px
              rgba(16,185,129,.10);
        }

        .currency-result {
          margin-top: 14px;

          padding:
            15px;

          border:
            1px solid #d8eee7;

          border-radius: 15px;

          background: white;
        }

        .currency-result-label {
          color: #76958c;

          font-size: 9px;
          font-weight: 850;

          text-transform: uppercase;
          letter-spacing: .8px;
        }

        .currency-number {
          margin-top: 3px;

          color: #047857;

          font-size:
            clamp(24px, 7vw, 31px);

          line-height: 1.2;

          font-weight: 950;

          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .currency-words {
          margin-top: 5px;

          color: #758e87;

          font-size: 9px;

          line-height: 1.4;

          overflow-wrap: anywhere;
        }

        .currency-rate-box {
          margin-top: 12px;

          padding:
            10px 12px;

          border-radius: 11px;

          background: #effaf6;

          color: #547a70;

          font-size: 9px;

          line-height: 1.5;
        }

        .currency-rate-box strong {
          color: #047857;
        }

        .currency-updated {
          display: block;

          color: #91a69f;

          font-size: 8px;
        }

        .currency-loading,
        .currency-error {
          margin-top: 10px;

          font-size: 10px;
          font-weight: 750;
        }

        .currency-loading {
          color: #568278;
        }

        .currency-error {
          color: #dc2626;
        }

        .refresh-rate {
          margin-top: 7px;

          padding:
            7px 10px;

          border: 0;

          border-radius: 8px;

          background: #d9f7eb;

          color: #047857;

          font-size: 9px;
          font-weight: 850;
        }

        /* =====================================
           SMALL PHONE
        ===================================== */


        .selected-entry-line {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 5px;
          min-height: 17px;
          margin: 3px 5px 0;
          color: #64748b;
          font-size: 9px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .selected-entry-line strong {
          color: #2563eb;
          border-bottom: 2px solid #60a5fa;
          padding: 0 2px 1px;
          font-size: 10px;
        }

        .decimal-words {
          font-size: .82em;
          font-weight: 650;
        }

        .calc-key-plus {
          min-height: 56px;
        }

        @media (max-width: 359px) {

          .calculator-page {
            padding-left:
              max(6px,
              env(safe-area-inset-left));

            padding-right:
              max(6px,
              env(safe-area-inset-right));

            padding-top:
              max(11px,
              env(safe-area-inset-top));

            padding-bottom:
              max(24px,
              env(safe-area-inset-bottom));
          }

          .top-bar {
            min-height: 49px;

            margin-bottom: 7px;
          }

          .brand {
            font-size: 14px;
          }

          .calculator-title {
            font-size: 13px;
          }

          .brand-code {
            font-size: 15px;
          }

          .calculator-card {
            padding: 11px;

            border-radius: 21px;
          }

          .main-input {
            height: 55px;

            font-size: 16px;

            border-radius: 14px;
          }

          .tool-row {
            gap: 5px;
          }

          .tool-btn {
            height: 40px;

            font-size: 8px;
          }

          .keypad {
            gap: 6px;
          }

          .calc-key {
            height: 50px;

            border-radius: 13px;

            font-size: 15px;
          }
        }

        /* =====================================
           STANDARD MOBILE
        ===================================== */

        @media (min-width: 360px) and (max-width: 600px) {

          .calculator-page {
            padding-top:
              max(14px,
              env(safe-area-inset-top));

            padding-bottom:
              max(27px,
              env(safe-area-inset-bottom));
          }

          .calculator-card {
            padding: 15px;
          }

          .keypad {
            gap: 8px;
          }
        }

        /* =====================================
           TABLET
        ===================================== */

        @media (min-width: 601px) {

          .calculator-page {
            padding-top:
              max(30px,
              env(safe-area-inset-top));

            padding-bottom:
              max(45px,
              env(safe-area-inset-bottom));
          }

          .calculator-wrapper {
            max-width: 590px;
          }

          .calculator-card {
            padding: 21px;

            border-radius: 27px;
          }

          .main-input {
            height: 68px;

            font-size: 21px;
          }

          .calc-key {
            height: 64px;
          }
        }

        /* =====================================
           DESKTOP
        ===================================== */

        @media (min-width: 1000px) {

          .calculator-page {
            padding-top: 42px;
          }

          .calculator-wrapper {
            max-width: 610px;
          }
        }

        /* =====================================
           LANDSCAPE PHONE
        ===================================== */

        @media (
          max-height: 520px
        ) and (
          orientation: landscape
        ) {

          .calculator-page {
            padding-top: 8px;
            padding-bottom: 12px;
          }

          .top-bar {
            min-height: 40px;
            margin-bottom: 5px;
          }

          .calculator-card {
            padding: 10px;
          }

          .main-input {
            height: 48px;
          }

          .tool-btn {
            height: 36px;
          }

          .calc-key {
            height: 43px;
          }

          .keypad {
            gap: 5px;
            margin-top: 8px;
          }
        }


        /* =====================================
           FINAL RESPONSIVE / PROFESSIONAL OVERRIDES
        ===================================== */

        .calculator-page {
          min-height: 100dvh;
          padding: max(8px, env(safe-area-inset-top))
                   max(7px, env(safe-area-inset-right))
                   max(10px, env(safe-area-inset-bottom))
                   max(7px, env(safe-area-inset-left));
          align-items: flex-start;
        }

        .calculator-wrapper {
          width: 100%;
          max-width: 620px;
        }

        .top-bar {
          min-height: 42px;
          margin-bottom: 5px;
          padding: 0 3px;
          position: relative;
        }

        .calculator-title {
          order: 1;
          color: #111111;
          font-size: 18px;
          font-weight: 950;
        }

        .brand {
          display: flex;
          position: absolute;
          top: 50%;
          right: 3px;
          transform: translateY(-50%);
          order: 2;
          color: #ef4444;
          font-size: 11px;
          font-weight: 800;
          gap: 4px;
        }

        .brand-code {
          color: #ef4444;
          font-size: 12px;
          font-weight: 900;
        }

        .calculator-card {
          padding: 10px;
          border-radius: 18px;
          box-shadow: 0 12px 30px rgba(72,47,140,.10);
        }

        .main-input {
          height: 55px;
          padding: 0 13px;
          font-size: 17px;
          border-radius: 13px;
        }

        .result-box {
          margin-top: 8px;
          padding: 10px 12px;
          border-radius: 13px;
          overflow: visible;
        }

        .result-value {
          font-size: clamp(22px, 7vw, 31px);
          width: 100%;
          min-width: 0;
          overflow: visible;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .result-words,
        .currency-words {
          margin-top: 4px;
          color: #16a34a;
          font-size: 10px;
          line-height: 1.4;
          font-weight: 750;
          display: block;
          width: 100%;
          min-width: 0;
          max-height: none;
          overflow: visible;
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: normal;
        }

        .tool-row {
          margin-top: 8px;
          gap: 5px;
        }

        .tool-btn {
          height: 40px;
          border-radius: 10px;
          font-size: 9px;
        }

        .keypad,
        .currency-keypad {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
          margin-top: 9px;
        }

        .calc-key {
          width: 100%;
          height: 52px;
          min-width: 0;
          border: 1px solid #e1e7f2;
          border-radius: 13px;
          background: #ffffff;
          color: #17152b;
          font-size: 17px;
          font-weight: 900;
          box-shadow: 0 2px 7px rgba(30,41,59,.06);
          transition: transform .07s ease, box-shadow .07s ease,
                      border-color .07s ease, background .07s ease;
          user-select: none;
        }

        .calc-key:active,
        .calc-key:focus-visible {
          border-color: #60a5fa;
          box-shadow: 0 0 0 2px rgba(96,165,250,.22),
                      0 3px 9px rgba(59,130,246,.14);
          transform: scale(.965);
          outline: none;
        }

        .calc-key-action {
          background: #f4f0ff;
          color: #6d28d9;
        }

        .keypad .calc-key-action:first-child,
        .currency-keypad .calc-key-action:first-child {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .calc-key-percent {
          background: #eef7ff;
          color: #2563eb;
        }

        .calc-key-operator {
          background: #edf4ff;
          color: #2563eb;
        }

        .calc-key-plus {
          background: #e9f8ef;
          color: #15803d;
        }

        .calc-key-total {
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 6px 13px rgba(124,58,237,.20);
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .calc-key:active,
        .calc-key:focus,
        .tool-btn:active,
        .tool-btn:focus,
        .history-nav-btn:active,
        .history-nav-btn:focus,
        .clear-history:active {
          background: #2563eb !important;
          border-color: #1d4ed8 !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,.24),
                      0 3px 9px rgba(37,99,235,.28) !important;
          transform: scale(.965);
        }

        .history-navigation {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
          margin-top: 8px;
        }

        .history-nav-btn {
          height: 34px;
          border: 1px solid #dbeafe;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 10px;
          font-weight: 850;
        }

        .history-nav-btn:disabled {
          opacity: .45;
        }

        .history-total {
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: normal;
        }

        .currency-input-display {
          display: flex;
          align-items: center;
          width: 100%;
          height: 72px;
          border: 1.5px solid #ded8ed;
          border-radius: 13px;
          background: #fcfbff;
          padding: 0 12px;
        }

        .currency-symbol {
          flex: 0 0 auto;
          color: #2563eb;
          font-size: 24px;
          font-weight: 900;
          margin-right: 6px;
        }

        .currency-input-readonly {
          border: 0 !important;
          box-shadow: none !important;
          background: transparent !important;
          height: 100% !important;
          padding: 0 !important;
        }

        .currency-input-readonly:focus {
          outline: none;
        }

        .currency-keypad {
          margin-top: 10px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
          width: 100%;
        }

        .currency-keypad .calc-key {
          height: 56px;
          min-height: 56px;
          font-size: 17px;
        }

        .currency-number {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .currency-result {
          margin-top: 9px;
        }

        @media (max-width: 359px) {
          .calculator-card { padding: 8px; }
          .calc-key { height: 47px; font-size: 15px; border-radius: 11px; }
          .keypad, .currency-keypad { gap: 5px; }
          .currency-keypad .calc-key { height: 47px; min-height: 47px; }
          .calculator-title { font-size: 16px; }
          .brand { font-size: 10px; }
        }

        @media (min-width: 601px) {
          .calculator-page { padding-top: 12px; }
          .calculator-card { padding: 15px; }
          .calc-key { height: 60px; }
          .currency-keypad .calc-key { height: 58px; }
        }

        @media (max-height: 520px) and (orientation: landscape) {
          .calculator-page { padding-top: 5px; padding-bottom: 6px; }
          .top-bar { min-height: 34px; }
          .calculator-card { padding: 7px; }
          .main-input, .currency-input-display { height: 45px; }
          .tool-btn { height: 34px; }
          .calc-key, .currency-keypad .calc-key { height: 40px; }
          .keypad, .currency-keypad { gap: 4px; margin-top: 6px; }
        }

        /* =====================================
           FULL MOBILE SCREEN FIT
           Keeps the same design/functionality but
           stretches the calculator to use the
           available screen height.
        ===================================== */

        @media (max-width: 600px) and (orientation: portrait) {
          .calculator-page {
            height: 100dvh;
            min-height: 100dvh;
            box-sizing: border-box;
            overflow-x: hidden;
            overflow-y: hidden;
            display: flex;
            align-items: stretch;
            padding-top: max(6px, env(safe-area-inset-top));
            padding-bottom: max(8px, env(safe-area-inset-bottom));
          }

          .calculator-wrapper {
            height: 100%;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }

          .top-bar {
            flex: 0 0 auto;
            min-height: 52px;
            margin-bottom: 6px;
          }

          .calculator-card {
            flex: 1 1 auto;
            min-height: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            gap: 8px;
            padding: 10px 8px 8px;
          }

          .main-input,
          .currency-input-display {
            flex: 0 0 auto;
            height: 110px;
            font-size: 30px;
          }

          .tool-row,
          .history-navigation,
          .history-panel,
          .result-box,
          .description-area {
            flex: 0 0 auto;
          }

          .tool-row {
            margin-top: 0;
            gap: 7px;
          }

          .tool-btn {
            height: 48px;
            font-size: 11px;
          }

          .brand {
            font-size: 13px;
          }

          .calculator-title {
            font-size: clamp(24px, 6vw, 32px);
          }

          .keypad {
            flex: 1 1 0;
            min-height: 0;
            grid-template-rows: repeat(5, minmax(0, 1fr));
            gap: 7px;
            margin-top: 0;
          }

          .keypad .calc-key {
            height: 100%;
            min-height: 0;
            border-radius: 16px;
            font-size: 20px;
          }

          .history-panel {
            overflow-y: auto;
            min-height: 0;
          }

          .currency-mode {
            min-height: 0;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
          }

          .currency-keypad {
            flex: 1 1 auto;
            display: grid;
            grid-template-rows: repeat(5, minmax(0, 1fr));
            gap: 7px;
            margin-top: 10px;
          }

          .currency-keypad .calc-key {
            height: 100%;
            min-height: 0;
            font-size: 18px;
          }
        }

        @media (max-width: 359px) and (orientation: portrait) {
          .keypad {
            gap: 5px;
          }
        }

        /* =====================================
           ANDROID WEBVIEW — TRUE FULL MOBILE FIT
        ===================================== */

        html,
        body,
        #root {
          width: 100%;
          height: 100%;
          min-height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        .calculator-page {
          width: 100%;
          height: 100dvh;
          min-height: 100dvh;
          max-height: 100dvh;
          margin: 0;
          padding-top: max(2px, env(safe-area-inset-top));
          padding-right: max(3px, env(safe-area-inset-right));
          padding-bottom: max(3px, env(safe-area-inset-bottom));
          padding-left: max(3px, env(safe-area-inset-left));
          display: flex;
          align-items: stretch;
          justify-content: center;
          overflow: hidden;
          background: #f7f7fb;
        }

        .calculator-wrapper {
          width: 100%;
          max-width: 620px;
          height: 100%;
          min-height: 0;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .top-bar {
          flex: 0 0 auto;
          min-height: 38px;
          margin-bottom: 2px;
          padding: 0 8px;
        }

        .calculator-card {
          flex: 1 1 auto;
          min-height: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          padding: 8px 7px 5px;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          overflow: hidden;
        }

        .calculator-card > * {
          flex-shrink: 0;
        }

        .calculator-card > .keypad,
        .calculator-card > .history-panel,
        .calculator-card > .currency-mode {
          flex-shrink: 1;
        }

        .main-input {
          flex: 0 0 auto;
          height: 92px;
          border-radius: 12px;
          font-size: 25px;
        }

        .tool-row {
          flex: 0 0 auto;
        }

        .history-navigation {
          flex: 0 0 auto;
        }

        .keypad {
          flex: 1 1 auto;
          min-height: 0;
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-template-rows: repeat(5, minmax(0, 1fr));
          gap: 7px;
          margin-top: 0;
          margin-bottom: 0;
        }

        .keypad .calc-key {
          width: 100%;
          height: 100%;
          min-height: 0;
          border-radius: 14px;
          font-size: 18px;
        }

        .history-panel {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
        }

        .currency-mode {
          flex: 1 1 auto;
          min-height: 0;
          height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .currency-keypad {
          flex: 0 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
        }

        .currency-keypad .calc-key {
          height: 50px;
          min-height: 50px;
        }

        @media (max-width: 359px) {
          .calculator-card {
            padding: 8px;
          }

          .top-bar {
            min-height: 43px;
          }

          .keypad {
            gap: 5px;
          }
        }

        @media (max-height: 620px) and (orientation: portrait) {
          .top-bar {
            min-height: 40px;
          }

          .calculator-card {
            padding: 7px;
          }

          .main-input {
            height: 49px;
          }

          .tool-btn {
            height: 36px;
          }

          .history-navigation {
            margin-top: 6px;
          }

          .history-nav-btn {
            height: 30px;
          }

          .keypad {
            gap: 5px;
            margin-top: 6px;
          }
        }


        /* =====================================
           FINAL APP UI OVERRIDES
        ===================================== */

        .top-bar {
          position: relative;
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .title-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 1.05;
          gap: 4px;
        }

        .calculator-title {
          font-size: clamp(22px, 6vw, 30px);
          font-weight: 850;
          color: #111827;
          white-space: nowrap;
        }

        .built-by {
          margin-top: 0;
          color: #4b5563;
          font-size: clamp(11px, 2vw, 14px);
          font-weight: 700;
          letter-spacing: 0.02em;
          white-space: nowrap;
          line-height: 1.2;
        }

        .menu-btn {
          position: absolute;
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          padding: 7px;
          border: 0;
          background: transparent;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          -webkit-tap-highlight-color: transparent;
        }

        .menu-btn span {
          display: block;
          width: 19px;
          height: 2px;
          border-radius: 2px;
          background: #374151;
        }

        /* Responsive glass-blue tap effect */
        .calc-key-number:active,
        .calc-key-number:focus-visible {
          background: rgba(59, 130, 246, .20);
          border-color: rgba(59, 130, 246, .70);
          box-shadow: 0 0 0 2px rgba(96,165,250,.16),
                      0 0 14px rgba(59,130,246,.30),
                      inset 0 0 10px rgba(255,255,255,.38);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transform: scale(.965);
          outline: none;
        }

        .currency-keypad .calc-key-number:active,
        .currency-keypad .calc-key-number:focus-visible {
          background: rgba(59, 130, 246, .20);
        }

        /* Full mobile-height calculator */
        @media (max-width: 600px) and (orientation: portrait) {
          .calculator-page {
            height: 100dvh;
            min-height: 100dvh;
            max-height: 100dvh;
            overflow: hidden;
          }

          .calculator-wrapper {
            height: 100%;
            min-height: 0;
          }

          .calculator-card {
            min-height: 0;
            height: calc(100% - 54px);
          }

          .main-input {
            height: clamp(88px, 15dvh, 125px);
            flex: 0 0 auto;
            font-size: clamp(24px, 7vw, 32px);
          }

          .tool-row {
            flex: 0 0 auto;
          }

          .keypad {
            flex: 1 1 0;
            min-height: 0;
            grid-template-rows: repeat(5, minmax(0, 1fr));
            gap: clamp(5px, 1.8vw, 8px);
          }

          .keypad .calc-key {
            height: 100%;
            min-height: 0;
            font-size: clamp(17px, 5vw, 22px);
          }

          /* Currency uses the complete available mobile height */
          .currency-mode {
            height: 100%;
            min-height: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .currency-header,
          .currency-direction-card,
          .currency-input-label,
          .currency-input-display,
          .currency-result,
          .currency-rate-box,
          .currency-loading,
          .currency-error,
          .refresh-rate {
            flex: 0 0 auto;
          }

          .currency-input-display {
            height: clamp(64px, 11dvh, 90px);
          }

          .currency-keypad {
            flex: 1 1 0;
            min-height: 0;
            grid-template-rows: repeat(5, minmax(0, 1fr));
            gap: clamp(5px, 1.8vw, 8px);
          }

          .currency-keypad .calc-key {
            height: 100%;
            min-height: 0;
            font-size: clamp(16px, 4.8vw, 21px);
          }

          .currency-close {
            min-width: 110px;
            height: 42px;
            font-size: 11px;
            white-space: nowrap;
          }

          .switch-currency {
            width: 56px;
            height: 46px;
            flex: 0 0 56px;
          }
        }

        @media (max-height: 650px) and (orientation: portrait) {
          .top-bar { min-height: 45px; }
          .calculator-card { height: calc(100% - 47px); }
          .main-input { height: clamp(68px, 13dvh, 92px); }
          .tool-btn { height: 40px; }
        }

        @media (max-width: 359px) and (orientation: portrait) {
          .built-by { font-size: 10px; }
          .menu-btn { left: 2px; }
          .calculator-card { padding-left: 5px; padding-right: 5px; }
        }

        /* FINAL HEADER ORDER — Calculator above, Build by Ajay Kedar below */
        .top-bar .title-block {
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 5px !important;
          width: max-content !important;
          text-align: center !important;
          line-height: 1 !important;
        }

        .top-bar .calculator-title {
          order: 1 !important;
          position: static !important;
          margin: 0 !important;
          transform: none !important;
          font-size: clamp(22px, 6vw, 30px) !important;
          line-height: 1.05 !important;
          white-space: nowrap !important;
        }

        .top-bar .built-by {
          order: 2 !important;
          position: static !important;
          margin: 0 !important;
          transform: none !important;
          color: #2563eb !important;
          font-size: clamp(14px, 2.4vw, 18px) !important;
          line-height: 1.15 !important;
          white-space: nowrap !important;
        }

        @media (max-width: 359px) {
          .top-bar .title-block {
            gap: 3px !important;
          }
          .top-bar .calculator-title {
            font-size: 20px !important;
          }
          .top-bar .built-by {
            font-size: 14px !important;
          }
        }

      `}</style>

      <div className="calculator-page">

        <div className="calculator-wrapper">

          {/* TOP BAR */}

          <div className="top-bar">

            <button
              type="button"
              className="menu-btn"
              aria-label="Menu"
              onClick={() => {}}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <div className="title-block">
              <div className="calculator-title">
                Calculator
              </div>
              <div className="built-by">
                Build by Ajay Kedar
              </div>
            </div>

          </div>

          <div className="calculator-card">

            {/* =================================================
                CURRENCY MODE
            ================================================= */}

            {!calculatorMode ? (

              <div className="currency-mode">

                <div className="currency-header">

                  <div className="currency-heading">
                    Currency Converter
                  </div>

                  <button
                    type="button"
                    className="currency-close"
                    onClick={
                      closeCurrency
                    }
                  >
                    Calculator
                  </button>

                </div>

                <div className="currency-direction-card">

                  <div className="currency-direction-text">

                    {currencyDirection ===
                    "USD_INR"
                      ? "US Dollar → Indian Rupee"
                      : "Indian Rupee → US Dollar"}

                  </div>

                  <button
                    type="button"
                    className="switch-currency"
                    onClick={
                      switchCurrency
                    }
                  >
                    ⇄
                  </button>

                </div>

                <label className="currency-input-label">

                  {currencyDirection ===
                  "USD_INR"
                    ? "USD Amount"
                    : "INR Amount"}

                </label>

                <div className="currency-input-display">
                  <span className="currency-symbol">
                    {currencyDirection === "USD_INR" ? "$" : "₹"}
                  </span>
                  <input
                    ref={currencyInputRef}
                    type="text"
                    inputMode="none"
                    readOnly
                    className="currency-input currency-input-readonly"
                    placeholder={
                      currencyDirection === "USD_INR"
                        ? "Enter USD amount"
                        : "Enter INR amount"
                    }
                    value={currencyAmount}
                    onFocus={(e) => e.target.blur()}
                    aria-label={
                      currencyDirection === "USD_INR"
                        ? "USD amount"
                        : "INR amount"
                    }
                  />
                </div>

                <div className="currency-keypad">
                  {[
                    ["AC", currencyClear, "action"],
                    ["⌫", currencyBackspace, "action"],
                    ["%", () => {}, "percent"],
                    ["÷", () => {}, "operator"],
                    ["1", () => currencyAddNumber("1"), "number"],
                    ["2", () => currencyAddNumber("2"), "number"],
                    ["3", () => currencyAddNumber("3"), "number"],
                    ["×", () => {}, "operator"],
                    ["4", () => currencyAddNumber("4"), "number"],
                    ["5", () => currencyAddNumber("5"), "number"],
                    ["6", () => currencyAddNumber("6"), "number"],
                    ["−", () => {}, "operator"],
                    ["7", () => currencyAddNumber("7"), "number"],
                    ["8", () => currencyAddNumber("8"), "number"],
                    ["9", () => currencyAddNumber("9"), "number"],
                    ["+", () => {}, "operator"],
                    ["0", () => currencyAddNumber("0"), "number"],
                    [".", currencyAddDecimal, "number"],
                    ["00", () => currencyAddNumber("00"), "number"],
                    ["=", () => {}, "total"]
                  ].map(([label, action, type], index) => (
                    <button
                      key={`${label}-${index}`}
                      type="button"
                      className={`calc-key calc-key-${type}`}
                      onPointerDown={preventKeyboard}
                      onClick={action}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {currencyLoading && (
                  <div className="currency-loading">
                    Loading current USD rate...
                  </div>
                )}

                {currencyValue !==
                  null && (
                  <div className="currency-result">

                    <div className="currency-result-label">
                      Converted Amount
                    </div>

                    <div className="currency-number">

                      {currencyDirection ===
                      "USD_INR"
                        ? `₹ ${Number(
                            currencyValue
                          ).toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits: 2,
                            }
                          )}`
                        : `$ ${Number(
                            currencyValue
                          ).toLocaleString(
                            "en-US",
                            {
                              maximumFractionDigits: 2,
                            }
                          )}`}

                    </div>

                    <div className="currency-words">
                      {(() => {
                        const words = numberToWords(
                          normalizeDecimal(String(currencyValue)),
                          currencyDirection === "USD_INR" ? "INR" : "USD"
                        );
                        const parts = words.split(" Point ");
                        return (
                          <>
                            <span>{parts[0]}</span>
                            {parts[1] && (
                              <span className="decimal-words">
                                {" Point "}{parts[1]}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>

                  </div>
                )}

                {usdRate && (
                  <div className="currency-rate-box">

                    Current USD rate:{" "}

                    <strong>
                      1 USD = ₹
                      {usdRate.toFixed(
                        2
                      )}
                    </strong>

                    <span className="currency-updated">
                      Current reference exchange rate
                    </span>

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
                      onClick={
                        loadUsdRate
                      }
                    >
                      Refresh Rate
                    </button>
                  </>
                )}

              </div>

            ) : (

              /* =================================================
                 CALCULATOR MODE
              ================================================= */

              <>

                {/* MAIN INPUT */}

                <input
                  ref={inputRef}
                  type="text"
                  className="main-input"
                  placeholder="Enter amount"
                  value={
                    expression
                  }
                  onChange={(e) =>
                    handleExpressionChange(
                      e.target.value
                    )
                  }
                  autoComplete="off"
                  spellCheck="false"
                />
                {selectedEntryIndex >= 0 && getNumberEntries()[selectedEntryIndex] && (
                  <div className="selected-entry-line">
                    <span>Selected:</span>
                    <strong>{getNumberEntries()[selectedEntryIndex].text}</strong>
                  </div>
                )}

                {/* DESCRIPTION */}

                {descriptionOpen && (
                  <div className="description-area">

                    <div className="description-wrap">

                      <span
                        className="
                          description-bracket
                          description-left
                        "
                      >
                        (
                      </span>

                      <input
                        ref={
                          descriptionRef
                        }
                        type="text"
                        className="description-input"
                        value={
                          description
                        }
                        onChange={(e) =>
                          handleDescriptionChange(
                            e.target.value
                          )
                        }
                        placeholder="Enter description"
                        autoComplete="off"
                        spellCheck="false"
                      />

                      <span
                        className="
                          description-bracket
                          description-right
                        "
                      >
                        )
                      </span>

                    </div>

                    <div className="description-hint">
                      Description for current amount
                    </div>

                  </div>
                )}

                {/* TOTAL */}

                {showTotal && (
                  <div className="result-box">

                    {total !== null ? (

                      <>
                        <div className="result-value">
                          {total}
                        </div>
                        <div className="result-words">
                          {(() => {
                            const words = numberToWords(
                              total.replace(/,/g, ""),
                              "INR"
                            );
                            const parts = words.split(" Point ");
                            return (
                              <>
                                <span>{parts[0]}</span>
                                {parts[1] && (
                                  <span className="decimal-words">
                                    {" Point "}{parts[1]}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </>

                    ) : (

                      <div className="result-error">
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
                      descriptionOpen
                        ? "active"
                        : ""
                    }`}
                    onPointerDown={
                      preventKeyboard
                    }
                    onClick={() => {

                      if (
                        descriptionOpen
                      ) {
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
                    onPointerDown={
                      preventKeyboard
                    }
                    onClick={() =>
                      setHistoryOpen(
                        (previous) =>
                          !previous
                      )
                    }
                  >
                    History
                  </button>

                  <button
                    type="button"
                    className="tool-btn currency-btn"
                    onPointerDown={
                      preventKeyboard
                    }
                    onClick={
                      openCurrency
                    }
                  >
                    USD ⇄ INR
                  </button>

                </div>

                {/* HISTORY */}

                {historyOpen && (
                  <div className="history-panel">

                    <div className="history-header">

                      <div className="history-title">
                        Calculation History
                      </div>

                      {history.length >
                        0 && (
                        <button
                          type="button"
                          className="clear-history"
                          onPointerDown={
                            preventKeyboard
                          }
                          onClick={
                            clearHistory
                          }
                        >
                          Clear All
                        </button>
                      )}

                    </div>

                    {history.length ===
                    0 ? (

                      <div className="history-empty">
                        No calculation history
                      </div>

                    ) : (

                      history.map(
                        (item) => (

                          <div
                            className="history-item"
                            key={item.id}
                          >

                            <div className="history-total">
                              {item.expression
                                ? `${item.expression} = ${item.total}`
                                : `= ${item.total}`}
                            </div>

                            <button
                              type="button"
                              className="delete-history"
                              onPointerDown={
                                preventKeyboard
                              }
                              onClick={() =>
                                deleteHistoryItem(
                                  item.id
                                )
                              }
                            >
                              ×
                            </button>

                          </div>

                        )
                      )

                    )}

                  </div>
                )}

                {/* PREVIOUS / NEXT */}

                {!historyOpen && (
                  <div className="history-navigation">
                    <button
                      type="button"
                      className="history-nav-btn"
                      onClick={previousEntry}
                      disabled={!getNumberEntries().length}
                    >
                      ‹ Previous
                    </button>
                    <button
                      type="button"
                      className="history-nav-btn"
                      onClick={nextEntry}
                      disabled={!getNumberEntries().length}
                    >
                      Next ›
                    </button>
                  </div>
                )}

                {/* KEYPAD */}

                {!historyOpen && <div className="keypad">

                  <KeyButton
                    type="action"
                    onClick={
                      clearAll
                    }
                  >
                    AC
                  </KeyButton>

                  <KeyButton
                    type="action"
                    onClick={
                      backspace
                    }
                  >
                    ⌫
                  </KeyButton>

                  <KeyButton
                    type="percent"
                    onClick={
                      addPercent
                    }
                  >
                    %
                  </KeyButton>

                  <KeyButton
                    type="operator"
                    onClick={() =>
                      addOperator("/")
                    }
                  >
                    ÷
                  </KeyButton>

                  <KeyButton
                    onClick={() => addNumber("1")}
                  >1</KeyButton>

                  <KeyButton
                    onClick={() => addNumber("2")}
                  >2</KeyButton>

                  <KeyButton
                    onClick={() => addNumber("3")}
                  >3</KeyButton>

                  <KeyButton
                    type="operator"
                    onClick={() => addOperator("*")}
                  >×</KeyButton>

                  <KeyButton
                    onClick={() => addNumber("4")}
                  >4</KeyButton>

                  <KeyButton
                    onClick={() => addNumber("5")}
                  >5</KeyButton>

                  <KeyButton
                    onClick={() => addNumber("6")}
                  >6</KeyButton>

                  <KeyButton
                    type="operator"
                    onClick={() => addOperator("-")}
                  >−</KeyButton>

                  <KeyButton
                    onClick={() => addNumber("7")}
                  >7</KeyButton>

                  <KeyButton
                    onClick={() => addNumber("8")}
                  >8</KeyButton>

                  <KeyButton
                    onClick={() => addNumber("9")}
                  >9</KeyButton>

                  <KeyButton
                    type="plus"
                    onClick={() => addOperator("+")}
                  >+</KeyButton>

                  <KeyButton
                    onClick={() => addNumber("0")}
                  >0</KeyButton>

                  <KeyButton
                    onClick={addDecimal}
                  >.</KeyButton>

                  <KeyButton
                    onClick={() => addNumber("00")}
                  >00</KeyButton>

                  <KeyButton
                    type="total"
                    onClick={calculateTotal}
                  >TOTAL</KeyButton>

                </div>}

              </>

            )}

          </div>

        </div>

      </div>
    </>
  );
}