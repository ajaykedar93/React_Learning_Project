import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";


const API_BASE = "https://express-project-learning-new.onrender.com";
const LOGIN_API = `${API_BASE}/api/personal-users/login`;
const REDIRECT_TO = "/";

export default function Login_Ani() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [trustDevice, setTrustDevice] = useState(
    () =>
      localStorage.getItem("remember_me") === "true" &&
      !!localStorage.getItem("saved_email") &&
      !!localStorage.getItem("saved_password")
  );

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const aliveRef = useRef(true);
  const autoLoginTimerRef = useRef(null);
  const autoLoginControllerRef = useRef(null);
  const trustDisabledRef = useRef(false);
  const autoLoginAttemptIdRef = useRef(0);

  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });
  const [isPointerNear, setIsPointerNear] = useState(false);

  const buttonAreaRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const isFilled = email.trim() !== "" && password.trim() !== "";
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const isError = status === "error";
  const credentialError =
    isError &&
    Boolean(error) &&
    /invalid|incorrect|wrong|password|credentials/i.test(error);
  const showCredentialError = isError && Boolean(error);

  // -------------------------------------------------------
  // Validation
  // -------------------------------------------------------
  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validateFields = () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      emailRef.current?.focus();
      return false;
    }

    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address.");
      emailRef.current?.focus();
      return false;
    }

    if (!password) {
      setError("Please enter your password.");
      passwordRef.current?.focus();
      return false;
    }

    return true;
  };

  // -------------------------------------------------------
  // OLD LOGIN/API LOGIC — UI remains unchanged
  // -------------------------------------------------------
  const apiPost = async (path, body, { timeoutMs = 35000, signal } = {}) => {
    const controller = signal ? null : new AbortController();
    const activeSignal = signal || controller.signal;
    const timer = controller
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : null;

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
        signal: activeSignal,
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : await response.text().then((text) => ({ message: text })).catch(() => ({}));

      if (!response.ok) {
        const err = new Error(
          data?.message || `Request failed (HTTP ${response.status}).`
        );
        err.status = response.status;
        throw err;
      }

      return data || {};
    } catch (err) {
      if (err?.name === "AbortError") {
        const timeoutError = new Error(
          "Server is waking up. Wait 5–10 seconds and try again."
        );
        timeoutError.name = "AbortError";
        throw timeoutError;
      }
      throw err;
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  };

  const toNiceError = (err, status) => {
    const message = err?.message || "";

    if (err?.name === "AbortError" || message.toLowerCase().includes("cold start")) {
      return "Server is waking up. Wait 5–10 seconds and try again.";
    }

    if (message.toLowerCase().includes("failed to fetch")) {
      return "API unreachable. Check backend CORS and API URL.";
    }

    if (status === 404) return "API route not found (404). Check endpoint path.";
    if (status === 401) return "Invalid username or password. Please try again.";
    if (status === 400) return "Please check your username and password.";

    return message || "Login failed. Please try again.";
  };

  const clearSavedLogin = () => {
    localStorage.removeItem("saved_email");
    localStorage.removeItem("saved_password");
    localStorage.removeItem("remember_me");
    setTrustDevice(false);
  };

  // Trusted device is a storage preference only; it never auto-logs in.

  useEffect(() => {
    aliveRef.current = true;

    if (isAuthenticated) {
      navigate(REDIRECT_TO, { replace: true });
      return () => { aliveRef.current = false; };
    }

    // Trust Device: restore saved details, but NEVER auto-submit.
    // User only needs to click Login manually next time.
    const savedEmail = localStorage.getItem("saved_email");
    const savedPassword = localStorage.getItem("saved_password");
    const rememberMe = localStorage.getItem("remember_me") === "true";

    if (savedEmail && savedPassword && rememberMe) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setTrustDevice(true);
    } else if (savedEmail && rememberMe) {
      setEmail(savedEmail);
      setTrustDevice(true);
    }

    return () => { aliveRef.current = false; };
  }, [isAuthenticated, navigate]);

  // Keep the Render backend warm, same as the old page.
  useEffect(() => {
    fetch(`${API_BASE}/api/health`, {
      method: "GET",
      cache: "no-store",
    }).catch(() => {});
  }, []);

  // -------------------------------------------------------
  // Hydraulic / magnetic button movement
  // -------------------------------------------------------
  const moveButtonAwayFromPointer = (clientX, clientY, force = 1) => {
    if (isFilled || isLoading || isSuccess) return;

    const rect = buttonAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const triggerDistance = 180;

    if (distance < triggerDistance || force > 1) {
      const safeDistance = Math.max(distance, 1);
      const proximity = Math.max(
        0,
        Math.min(1, (triggerDistance - safeDistance) / triggerDistance)
      );

      // Push in the exact opposite direction of the cursor.
      // Both X and Y are used, so the button can move left/right/up/down.
      const strength = (26 + proximity * 34) * force;

      let moveX = -(dx / safeDistance) * strength;
      let moveY = -(dy / safeDistance) * strength;

      // If the pointer is exactly at the center, choose a diagonal escape.
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        moveX = 30;
        moveY = -22;
      }

      setButtonOffset({
        x: Math.max(-62, Math.min(62, moveX)),
        y: Math.max(-38, Math.min(38, moveY)),
      });
      setIsPointerNear(true);
    }
  };

  const handleButtonAreaMove = (event) => {
    if (isFilled || isLoading || isSuccess) return;

    const rect = buttonAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Long distance = original position.
    if (distance >= 180) {
      setButtonOffset({ x: 0, y: 0 });
      setIsPointerNear(false);
      return;
    }

    moveButtonAwayFromPointer(mouseX, mouseY);
  };

  const handleEmptyButtonClick = (event) => {
    if (isFilled || isLoading || isSuccess) return;

    // Empty button is deliberately NOT clickable/submittable.
    // Clicking/tapping it acts like a hydraulic pressure release.
    event.preventDefault();
    event.stopPropagation();

    moveButtonAwayFromPointer(event.clientX, event.clientY, 1.35);

    window.clearTimeout(window.__loginHydraulicTimer);
    window.__loginHydraulicTimer = window.setTimeout(() => {
      setButtonOffset({ x: 0, y: 0 });
      setIsPointerNear(false);
    }, 900);
  };

  const resetButtonPosition = () => {
    if (!isFilled && !isLoading && !isSuccess) {
      setButtonOffset({ x: 0, y: 0 });
      setIsPointerNear(false);
    }
  };

  // When both fields become filled, immediately restore the
  // button to its real position.
  useEffect(() => {
    if (isFilled) {
      setButtonOffset({ x: 0, y: 0 });
      setIsPointerNear(false);
      setError("");
      if (status === "error") setStatus("idle");
    }
  }, [isFilled, status]);

  // -------------------------------------------------------
  // Login
  // -------------------------------------------------------
  const handleLogin = async (event) => {
    event?.preventDefault();

    if (isLoading) return;

    trustDisabledRef.current = false;
    autoLoginAttemptIdRef.current += 1;

    setError("");
    setSuccessMessage("");

    if (!validateFields()) {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 650);
      return;
    }

    setButtonOffset({ x: 0, y: 0 });
    setIsPointerNear(false);
    setStatus("loading");

    try {
      const data = await apiPost("/api/personal-users/login", {
        email: email.trim(),
        password: password.trim(),
      });

      if (!aliveRef.current) return;

      const token = data?.token || data?.accessToken || data?.jwt || "";
      if (token) {
        localStorage.setItem("token", token);
      }

      if (data.success && data.data) {
        login(data.data);

        if (trustDevice) {
          localStorage.setItem("saved_email", email.trim());
          localStorage.setItem("saved_password", password.trim());
          localStorage.setItem("remember_me", "true");
        } else {
          localStorage.removeItem("saved_email");
          localStorage.removeItem("saved_password");
          localStorage.removeItem("remember_me");
        }

        setStatus("success");
        setSuccessMessage(data?.message || "Login successful.");

        window.setTimeout(() => {
          if (aliveRef.current) {
            navigate(REDIRECT_TO, { replace: true });
          }
        }, 800);

        return;
      }

      throw new Error(data?.message || "Login failed");
    } catch (err) {
      if (!aliveRef.current) return;

      clearSavedLogin();
      setStatus("error");
      setError(toNiceError(err, err?.status));

      window.setTimeout(() => {
        setStatus((current) => (current === "error" ? "idle" : current));
      }, 2400);
    }
  };

  const stopTrustedDevice = () => {
    trustDisabledRef.current = true;
    autoLoginAttemptIdRef.current += 1;

    if (autoLoginTimerRef.current) {
      window.clearTimeout(autoLoginTimerRef.current);
      autoLoginTimerRef.current = null;
    }

    if (autoLoginControllerRef.current) {
      autoLoginControllerRef.current.abort();
      autoLoginControllerRef.current = null;
    }

    localStorage.removeItem("saved_email");
    localStorage.removeItem("saved_password");
    localStorage.removeItem("remember_me");
    localStorage.removeItem("token");

    setTrustDevice(false);
    setStatus("idle");
    setError("");
    setSuccessMessage("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setButtonOffset({ x: 0, y: 0 });
    setIsPointerNear(false);

    emailRef.current?.focus();
  };

  // -------------------------------------------------------
  // Enter key submits the form.
  // -------------------------------------------------------
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLogin(event);
    }
  };

  return (
    <main className="login-page">
      <style>{styles}</style>

      {/* Ambient background */}
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grid-overlay" />

      <section className="login-shell">
        <div className="login-card">
          {/* Brand */}
          <div className="brand">
            <div className="brand-mark">
              <span className="brand-ring" />
              <span className="brand-dot" />
            </div>

            <div className="brand-name" aria-label="AJAY KEDAR">
              <span className="brand-letter">A</span><span className="brand-letter">J</span><span className="brand-letter">A</span><span className="brand-letter">Y</span>
              <span className="brand-gap" aria-hidden="true" />
              <span className="brand-letter">K</span><span className="brand-letter">E</span><span className="brand-letter">D</span><span className="brand-letter">A</span><span className="brand-letter">R</span>
            </div>
          </div>

          {/* Login title */}
          <header className="login-header">
            <h1>Login</h1>
          </header>

          <form className={credentialError ? "credential-error-form" : ""} onSubmit={handleLogin} onKeyDown={handleKeyDown}>
            {/* Email */}
            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="login-email">Email</label>
              </div>

              <div
                className={[
                  "input-shell",
                  email ? "has-value" : "",
                  email && !isValidEmail(email) ? "invalid" : "",
                  email && isValidEmail(email) ? "valid" : "",
                ].join(" ")}
              >
                <span className="input-icon" aria-hidden="true">
                  <MailIcon />
                </span>

                <input
                  ref={emailRef}
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                    if (status === "error") setStatus("idle");
                  }}
                  onFocus={() => setIsPointerNear(false)}
                  aria-invalid={Boolean(email && !isValidEmail(email))}
                />

                {email && isValidEmail(email) && (
                  <span className="field-status valid-status">
                    <CheckIcon />
                  </span>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="field-group password-group">
              <div className="field-label-row">
                <label htmlFor="login-password">Password</label>

                <button
                  type="button"
                  className="forgot-button"
                  onClick={() => {
                    // Replace with your forgot-password route/modal.
                    window.location.href = "/forgot";
                  }}
                >
                  Forgot?
                </button>
              </div>

              <div
                className={[
                  "input-shell",
                  password ? "has-value" : "",
                  password && !isError && !isSuccess ? "valid" : "",
                  isError ? "error-field" : "",
                  isSuccess ? "success-field" : "",
                ].join(" ")}
              >
                <span className="input-icon" aria-hidden="true">
                  <LockIcon />
                </span>

                <input
                  ref={passwordRef}
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                    if (status === "error") setStatus("idle");
                  }}
                  onFocus={() => setIsPointerNear(false)}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>

                {password && !isLoading && !isSuccess && !isError && (
                  <span className="password-check">
                    <CheckIcon />
                  </span>
                )}

                {isError && (
                  <span className="password-check error-check">
                    <CloseIcon />
                  </span>
                )}

                {isSuccess && (
                  <span className="password-check success-check">
                    <CheckIcon />
                  </span>
                )}
              </div>
            </div>

            {/* Error */}
            <div
              className={[
                "error-message",
                isError && error ? "visible" : "",
              ].join(" ")}
              role="alert"
              aria-live="polite"
            >
              <span className="error-message-icon">
                <AlertIcon />
              </span>
              <span>{error || "Incorrect email or password."}</span>
            </div>

            {/* Success */}
            <div
              className={[
                "success-message",
                isSuccess ? "visible" : "",
              ].join(" ")}
              role="status"
              aria-live="polite"
            >
              <span className="success-message-icon">
                <CheckIcon />
              </span>
              <span>{successMessage || "Login successful."}</span>
            </div>

            {/* Trust this device */}
            <div className="trust-device-row">
              <button
                type="button"
                className={`trust-device-button ${trustDevice ? "trusted" : ""}`}
                onClick={() => {
                  if (trustDevice) {
                    stopTrustedDevice();
                  } else {
                    setTrustDevice(true);
                  }
                }}
                aria-pressed={trustDevice}
                title={trustDevice ? "Trusted on this device" : "Trust this device"}
              >
                <span className="trust-checkbox">
                  {trustDevice && <CheckIcon />}
                </span>
                <span>Trust this device</span>
              </button>

              {trustDevice && (
                <button
                  type="button"
                  className="trust-stop-button"
                  onClick={stopTrustedDevice}
                  aria-label="Stop trusting this device and clear login"
                  title="Stop trust & clear"
                >
                  <span />
                </button>
              )}
            </div>

            {/* Animated button zone */}
            <div
              ref={buttonAreaRef}
              className={[
                "login-button-zone",
                !isFilled ? "locked-zone" : "",
                isFilled ? "ready-zone" : "",
                isError ? "error-zone" : "",
                isSuccess ? "success-zone" : "",
              ].join(" ")}
              onMouseMove={handleButtonAreaMove}
              onMouseLeave={resetButtonPosition}
              onTouchStart={(event) => {
                if (isFilled || isLoading || isSuccess) return;
                const touch = event.touches[0];
                if (!touch) return;
                moveButtonAwayFromPointer(touch.clientX, touch.clientY, 1.15);
              }}
              onTouchMove={(event) => {
                if (isFilled || isLoading || isSuccess) return;
                const touch = event.touches[0];
                if (!touch) return;
                handleButtonAreaMove({
                  clientX: touch.clientX,
                  clientY: touch.clientY,
                });
              }}
              onTouchEnd={() => {
                window.clearTimeout(window.__loginHydraulicTimer);
                window.__loginHydraulicTimer = window.setTimeout(
                  resetButtonPosition,
                  700
                );
              }}
            >
              {/* Single hydraulic pump rod behind the Login button */}
              {!isFilled && !isLoading && !isSuccess && !isError && (
                <div className="hydraulic-pump" aria-hidden="true">
                  <span className="pump-rod pump-rod-left" />
                  <span className="pump-rod pump-rod-right" />
                  <span className="pump-core">
                    <span className="pump-core-light" />
                  </span>
                  <span className="energy energy-one" />
                  <span className="energy energy-two" />
                  <span className="energy energy-three" />
                  <span className="energy energy-four" />
                </div>
              )}

              <div
                className={credentialError ? "error-button-motion" : ""}
              >
              <button
                type="submit"
                className={[
                  "login-button",
                  isFilled ? "button-ready" : "",
                  isLoading ? "button-loading" : "",
                  isError ? "button-error" : "",
                  isSuccess ? "button-success" : "",
                  isPointerNear ? "button-near" : "",
                ].join(" ")}
                disabled={isLoading || isSuccess || (!isFilled && false)}
                onClick={handleEmptyButtonClick}
                aria-disabled={!isFilled || isLoading || isSuccess}
                title={
                  !isFilled
                    ? "Enter username/email and password first"
                    : isError
                    ? "Incorrect credentials"
                    : "Log in"
                }
                style={{
                  transform: `translate3d(${buttonOffset.x}px, ${buttonOffset.y}px, 0)`,
                }}
              >
                <span className="button-label">
                  {isSuccess
                    ? "Success"
                    : isError
                    ? "Try again"
                    : isLoading
                    ? "Checking"
                    : "Log in"}
                </span>

                {isLoading && (
                  <span className="spinner" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                )}

                {isSuccess && (
                  <span className="button-success-icon">
                    <CheckIcon />
                  </span>
                )}
              </button>
              </div>
            </div>

            {/* Keyboard helper */}
            <div className="keyboard-hint">
              <span className="hint-key">Tab</span>
              <span>reaches it.</span>
              <span className="hint-key">Enter</span>
              <span>submits.</span>
            </div>
          </form>

          <div className="divider" />

          {/* Register */}
          <div className="register-row">
            <span>No account yet?</span>
            <button
              type="button"
              className="create-button"
              onClick={() => {
                window.location.href = "/register";
              }}
            >
              Create one
            </button>
          </div>
        </div>
      </section>

      <footer className="page-footer">
        <span className="footer-code">&lt;/&gt;</span>
        <span className="footer-name">AJAY KEDAR</span>
        <span className="footer-separator">•</span>
        <span>Secure access</span>
      </footer>
    </main>
  );
}

/* =========================================================
   Icons
   ========================================================= */

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m3.2 8 8.8 6 8.8-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="10"
        width="15"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.8 12s3.3-5 9.2-5 9.2 5 9.2 5-3.3 5-9.2 5-9.2-5-9.2-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10.6 7.2A10.2 10.2 0 0 1 12 7c5.9 0 9.2 5 9.2 5a15.6 15.6 0 0 1-3.1 3.2M6.2 6.8C4 8.1 2.8 12 2.8 12s3.3 5 9.2 5c1.2 0 2.3-.2 3.3-.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6.5 12.5 3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m7 7 10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 8v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

/* =========================================================
   Styles
   ========================================================= */

const styles = `
  * {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    margin: 0;
    min-height: 100%;
    width: 100%;
  }

  body {
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    background: #090807;
    color: #f7f1df;
  }

  button,
  input {
    font: inherit;
  }

  button {
    -webkit-tap-highlight-color: transparent;
  }

  .login-page {
    position: relative;
    min-height: 100vh;
    min-height: 100svh;
    width: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding:
      max(28px, env(safe-area-inset-top))
      20px
      max(28px, env(safe-area-inset-bottom));
    background:
      radial-gradient(circle at 50% 35%, rgba(214, 179, 90, 0.07), transparent 31%),
      linear-gradient(145deg, #090807 0%, #15110a 48%, #080706 100%);
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.16;
    background-image:
      linear-gradient(rgba(214, 179, 90, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(214, 179, 90, 0.035) 1px, transparent 1px);
    background-size: 54px 54px;
    mask-image: radial-gradient(circle at center, black, transparent 80%);
  }

  .ambient {
    position: absolute;
    border-radius: 50%;
    filter: blur(75px);
    pointer-events: none;
    opacity: 0.25;
    animation: ambientFloat 9s ease-in-out infinite;
  }

  .ambient-one {
    width: 360px;
    height: 360px;
    left: -160px;
    top: 10%;
    background: rgba(214, 179, 90, 0.16);
  }

  .ambient-two {
    width: 300px;
    height: 300px;
    right: -130px;
    bottom: 5%;
    background: rgba(168, 132, 53, 0.12);
    animation-delay: -4s;
  }

  .login-shell {
    position: relative;
    z-index: 2;
    width: min(100%, 520px);
  }

  .login-card {
    position: relative;
    width: 100%;
    padding: 34px 36px 28px;
    border: 1px solid #d6b35a;
    border-radius: 28px;
    background:
      linear-gradient(
        145deg,
        rgba(30, 48, 48, 0.94),
        rgba(10, 23, 24, 0.96)
      );
    box-shadow:
      0 35px 90px rgba(0, 0, 0, 0.52),
      0 0 0 1px rgba(214, 179, 90, 0.07),
      0 0 22px rgba(214, 179, 90, 0.07),
      inset 0 1px 0 rgba(255, 255, 255, 0.045),
      inset 0 -1px 0 rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    overflow: hidden;
  }

  .login-card {
    animation: cardReveal 700ms cubic-bezier(.22,1,.36,1) both;
  }

  .login-card:hover {
    box-shadow:
      0 38px 96px rgba(0, 0, 0, 0.60),
      0 0 38px rgba(214, 179, 90, 0.09),
      inset 0 1px 0 rgba(255, 246, 214, 0.07);
  }

  @keyframes cardReveal {
    from {
      opacity: 0;
      transform: translateY(14px) scale(.985);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .login-card {
    border-color: rgba(214, 179, 90, .62);
    background:
      radial-gradient(circle at 15% 0%, rgba(214,179,90,.055), transparent 28%),
      linear-gradient(145deg, rgba(31,27,19,.98), rgba(9,8,7,.985));
    box-shadow:
      0 40px 100px rgba(0,0,0,.62),
      0 0 34px rgba(214,179,90,.08),
      inset 0 1px 0 rgba(255,248,220,.07);
    animation: premiumCardIn 700ms cubic-bezier(.22,1,.36,1) both;
  }

  .brand-name {
    color: rgba(247,241,223,.82);
    text-shadow: 0 0 14px rgba(214,179,90,.14);
  }

  .login-header h1 {
    color: #e8ca78;
    text-shadow:
      0 0 8px rgba(214,179,90,.22),
      0 0 24px rgba(214,179,90,.12);
  }

  .field-label-row label {
    color: rgba(247,241,223,.76);
  }

  @keyframes premiumCardIn {
    0% { opacity: 0; transform: translateY(16px) scale(.985); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  .login-card::before {
    content: "";
    position: absolute;
    left: 15%;
    right: 15%;
    top: -1px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(214, 179, 90, 0.65),
      transparent
    );
    opacity: 0.55;
  }

  .login-card::after {
    content: "";
    position: absolute;
    width: 180px;
    height: 180px;
    top: -130px;
    right: -100px;
    border-radius: 50%;
    background: rgba(214, 179, 90, 0.09);
    filter: blur(20px);
    pointer-events: none;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 31px;
  }

  .brand-mark {
    position: relative;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
  }

  .brand-ring {
    position: absolute;
    inset: 2px;
    border: 2px solid #d6b35a;
    border-radius: 50%;
    box-shadow:
      0 0 9px rgba(214, 179, 90, 0.8),
      inset 0 0 7px rgba(214, 179, 90, 0.25);
    animation: ringPulse 2.2s ease-in-out infinite;
  }

  .brand-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #e0c26b;
    box-shadow: 0 0 11px #e0c26b;
  }

  .brand-name {
    display: flex;
    gap: 6px;
    color: rgba(228, 243, 240, 0.64);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 4px;
  }

  .login-header {
    margin-bottom: 26px;
    text-align: center;
  }

  .login-header h1 {
    margin: 0;
    color: #d6b35a;
    font-size: clamp(27px, 5vw, 34px);
    line-height: 1;
    font-weight:  800;
    letter-spacing: 0.2px;
    text-shadow:
      0 0 8px rgba(255, 215, 0, 0.22),
      0 0 20px rgba(255, 215, 0, 0.10);
  }

  .login-header p {
    max-width: 390px;
    margin: 0;
    color: rgba(224, 239, 236, 0.59);
    font-size: 14px;
    line-height: 1.65;
  }

  .field-group {
    margin-bottom: 22px;
  }

  .password-group {
    margin-bottom: 8px;
  }

  .field-label-row {
    min-height: 19px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 8px;
  }

  .field-label-row label {
    color: rgba(232, 244, 241, 0.65);
    font-size: 13px;
    font-weight: 500;
  }

  .forgot-button {
    border: 0;
    padding: 0;
    color: #d6b35a;
    background: transparent;
    font-size: 13px;
    cursor: pointer;
    transition: color 180ms ease, text-shadow 180ms ease;
  }

  .forgot-button:hover {
    color: #f0d68b;
    text-shadow: 0 0 14px rgba(37, 220, 183, 0.32);
  }

  .input-shell {
    position: relative;
    height: 58px;
    display: flex;
    align-items: center;
    border: 1px solid rgba(164, 215, 207, 0.13);
    border-radius: 15px;
    background: rgba(3, 13, 14, 0.62);
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.025),
      0 4px 16px rgba(0, 0, 0, 0.12);
    transition:
      border-color 220ms ease,
      box-shadow 220ms ease,
      background 220ms ease,
      transform 220ms ease;
  }

  .input-shell:focus-within {
    border-color: #d6b35a;
    background: rgba(10, 18, 18, 0.82);
    box-shadow:
      0 0 0 3px rgba(255, 215, 0, 0.08),
      0 0 22px rgba(255, 215, 0, 0.16),
      0 0 42px rgba(255, 215, 0, 0.06),
      inset 0 1px 1px rgba(255, 255, 255, 0.04);
    transform: translateY(-1px);
  }

  .input-shell:focus-within .input-icon {
    color: #d6b35a;
    filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.28));
    transition: color 220ms ease, filter 220ms ease;
  }

  .input-shell:focus-within input::placeholder {
    color: rgba(255, 235, 150, 0.52);
  }

  .input-shell:focus-within .password-toggle {
    color: rgba(255, 215, 0, 0.72);
  }

  .input-shell:focus-within::after {
    content: "";
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: -1px;
    height: 1px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 215, 0, 0.75),
      transparent
    );
    box-shadow: 0 0 9px rgba(255, 215, 0, 0.42);
    pointer-events: none;
    animation: inputEnergy 1.4s ease-in-out infinite;
  }

  @keyframes inputEnergy {
    0%, 100% { opacity: .25; transform: scaleX(.55); }
    50% { opacity: 1; transform: scaleX(1); }
  }

  .input-shell.valid {
    border-color: rgba(39, 226, 188, 0.34);
  }

  /* Strong API credential-error state */
  .credential-error-form .input-shell.error-field {
    border: 1.5px solid #ff3f52 !important;
    background:
      linear-gradient(180deg, rgba(58, 10, 15, 0.56), rgba(25, 7, 10, 0.72)) !important;
    box-shadow:
      0 0 0 3px rgba(255, 63, 82, 0.11),
      0 0 18px rgba(255, 45, 66, 0.24),
      0 0 42px rgba(255, 45, 66, 0.10),
      inset 0 0 18px rgba(255, 45, 66, 0.055) !important;
    animation: credentialInputError 560ms cubic-bezier(.22,1,.36,1);
  }

  .credential-error-form .input-shell.error-field .input-icon,
  .credential-error-form .input-shell.error-field .password-toggle {
    color: #ff6675 !important;
    filter: drop-shadow(0 0 6px rgba(255, 63, 82, .35));
  }

  .credential-error-form .input-shell.error-field input {
    color: #fff3f4 !important;
  }

  .credential-error-form .input-shell.error-field::before {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    border: 1px solid rgba(255, 95, 108, .35);
    pointer-events: none;
    animation: errorBorderPulse 1.1s ease-in-out 2;
  }

  .error-button-motion {
    position: relative;
    z-index: 5;
    display: inline-flex;
    animation: professionalErrorMotion 720ms cubic-bezier(.22,1,.36,1);
  }

  .error-button-motion .login-button {
    animation: none !important;
  }

  .credential-error-form .login-button.button-error {
    color: #fff8f8 !important;
    background:
      linear-gradient(135deg, #ff6876 0%, #e53649 52%, #b91f32 100%) !important;
    border: 1px solid rgba(255, 206, 210, .35) !important;
    box-shadow:
      0 15px 36px rgba(217, 32, 52, .34),
      0 0 18px rgba(255, 55, 75, .30),
      0 0 42px rgba(255, 55, 75, .13),
      inset 0 1px 0 rgba(255,255,255,.25) !important;
  }

  .credential-error-form .login-button.button-error::after {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    background: linear-gradient(
      105deg,
      transparent 10%,
      rgba(255,255,255,.30) 48%,
      transparent 82%
    );
    transform: translateX(-125%);
    animation: errorLightSweep 700ms ease-out;
    pointer-events: none;
  }

  @keyframes credentialInputError {
    0% { transform: translateX(0); }
    16% { transform: translateX(-5px); }
    32% { transform: translateX(5px); }
    48% { transform: translateX(-4px); }
    64% { transform: translateX(4px); }
    82% { transform: translateX(-2px); }
    100% { transform: translateX(0); }
  }

  @keyframes errorBorderPulse {
    0%, 100% { opacity: .25; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.008); }
  }

  @keyframes professionalErrorMotion {
    0% {
      transform: translate3d(0,0,0) rotate(0) scale(1);
      filter: brightness(1);
    }
    15% {
      transform: translate3d(-8px,0,0) rotate(-3deg) scale(1.035);
    }
    30% {
      transform: translate3d(8px,0,0) rotate(3deg) scale(1.035);
    }
    45% {
      transform: translate3d(-6px,0,0) rotate(-2deg) scale(1.02);
    }
    60% {
      transform: translate3d(6px,0,0) rotate(2deg) scale(1.015);
    }
    78% {
      transform: translate3d(-2px,0,0) rotate(-.6deg) scale(1.005);
    }
    100% {
      transform: translate3d(0,0,0) rotate(0) scale(1);
      filter: brightness(1);
    }
  }

  @keyframes errorLightSweep {
    0% { transform: translateX(-125%); opacity: 0; }
    18% { opacity: 1; }
    100% { transform: translateX(125%); opacity: 0; }
  }

  .input-shell.invalid,
  .input-shell.error-field {
    border-color: rgba(255, 77, 89, 0.62);
    box-shadow:
      0 0 0 3px rgba(255, 65, 81, 0.045),
      0 0 22px rgba(255, 65, 81, 0.07);
    animation: inputShake 320ms ease;
  }

  .input-shell.success-field {
    border-color: rgba(42, 235, 194, 0.65);
    box-shadow: 0 0 25px rgba(42, 235, 194, 0.1);
  }

  .input-icon {
    width: 47px;
    display: grid;
    place-items: center;
    color: rgba(208, 231, 226, 0.48);
    flex: 0 0 47px;
  }

  .input-icon svg {
    width: 19px;
    height: 19px;
  }

  .input-shell input {
    min-width: 0;
    flex: 1;
    height: 100%;
    padding: 0 7px 0 0;
    border: 0;
    outline: 0;
    color: #f7f1df;
    background: transparent;
    font-size: 15px;
    font-weight: 450;
  }

  .input-shell input::placeholder {
    color: rgba(213, 231, 227, 0.39);
  }

  .input-shell input:-webkit-autofill,
  .input-shell input:-webkit-autofill:hover,
  .input-shell input:-webkit-autofill:focus {
    -webkit-text-fill-color: #f7f1df;
    -webkit-box-shadow: 0 0 0 1000px #071719 inset;
    transition: background-color 9999s ease-in-out 0s;
  }

  .password-toggle,
  .field-status,
  .password-check {
    width: 43px;
    height: 100%;
    display: grid;
    place-items: center;
    flex: 0 0 43px;
  }

  .password-toggle {
    border: 0;
    color: rgba(210, 232, 228, 0.46);
    background: transparent;
    cursor: pointer;
    transition: color 180ms ease, transform 180ms ease;
  }

  .password-toggle:hover {
    color: #e0c26b;
    transform: scale(1.04);
  }

  .password-toggle svg {
    width: 19px;
    height: 19px;
  }

  .field-status svg,
  .password-check svg {
    width: 19px;
    height: 19px;
  }

  .valid-status {
    color: #d6b35a;
  }

  .password-check {
    color: #d6b35a;
  }

  .error-check {
    color: #ff4e5d;
  }

  .success-check {
    color: #e0c26b;
  }

  .error-message,
  .success-message {
    min-height: 0;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 0;
    font-size: 12px;
    line-height: 1.4;
    transition:
      opacity 220ms ease,
      max-height 220ms ease,
      margin 220ms ease;
  }

  .error-message.visible {
    max-height: 42px;
    opacity: 1;
    margin: 8px 2px 0;
    color: #ff6471;
  }

  .success-message.visible {
    max-height: 42px;
    opacity: 1;
    margin: 8px 2px 0;
    color: #e0c26b;
  }

  .error-message-icon,
  .success-message-icon {
    width: 16px;
    height: 16px;
    display: grid;
    place-items: center;
    flex: 0 0 16px;
  }

  .error-message-icon svg,
  .success-message-icon svg {
    width: 16px;
    height: 16px;
  }

  .login-button-zone {
    position: relative;
    height: 88px;
    margin-top: 18px;
    border-radius: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    isolation: isolate;
  }

  .login-button-zone::before {
    content: none;
  }

  /* Single hydraulic pump rod — no surrounding box/dotted frame */
  .hydraulic-pump {
    position: absolute;
    left: 2%;
    right: 2%;
    top: 50%;
    height: 66px;
    transform: translateY(-50%);
    z-index: 1;
    pointer-events: none;
    overflow: visible;
  }

  .pump-rod {
    position: absolute;
    top: 50%;
    height: 3px;
    width: calc(50% - 72px);
    transform: translateY(-50%);
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(92, 68, 27, .18),
      rgba(214, 179, 90, .68),
      rgba(232, 203, 117, .95)
    );
    box-shadow:
      0 0 5px rgba(214, 179, 90, .58),
      0 0 14px rgba(214, 179, 90, .24);
  }

  .pump-rod::before,
  .pump-rod::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transform: translateY(-50%);
    border: 1px solid rgba(214, 179, 90, .78);
    background: rgba(7, 38, 35, .95);
    box-shadow:
      0 0 8px rgba(214, 179, 90, .45),
      0 0 16px rgba(214, 179, 90, .18);
  }

  .pump-rod::after {
    width: 4px;
    height: 4px;
    border: 0;
    background: #f0d68b;
    box-shadow: 0 0 9px #35eac3;
  }

  .pump-rod-left {
    left: 0;
    transform-origin: right center;
  }

  .pump-rod-left::before {
    left: -2px;
  }

  .pump-rod-left::after {
    right: 0;
  }

  .pump-rod-right {
    right: 0;
    transform-origin: left center;
    background: linear-gradient(
      90deg,
      rgba(232, 203, 117, .95),
      rgba(214, 179, 90, .68),
      rgba(92, 68, 27, .18)
    );
  }

  .pump-rod-right::before {
    right: -2px;
  }

  .pump-rod-right::after {
    left: 0;
  }

  .pump-core {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 19px;
    height: 19px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid rgba(214, 179, 90, .8);
    background: rgba(10, 50, 46, .92);
    box-shadow:
      0 0 8px rgba(214, 179, 90, .85),
      0 0 22px rgba(214, 179, 90, .4);
    animation: pumpPulse 1.1s ease-in-out infinite;
  }

  .pump-core-light {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 6px;
    height: 6px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: #f0d68b;
    box-shadow:
      0 0 8px #d6b35a,
      0 0 18px rgba(214, 179, 90, .7);
  }

  .energy {
    position: absolute;
    top: 50%;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #f0d68b;
    box-shadow:
      0 0 5px #e0c26b,
      0 0 13px rgba(214, 179, 90, .8);
    opacity: 0;
  }

  .energy-one {
    left: 7%;
    animation: energyToCore 1.25s linear infinite;
  }

  .energy-two {
    left: 18%;
    animation: energyToCore 1.25s linear infinite .28s;
  }

  .energy-three {
    right: 7%;
    animation: energyFromCore 1.25s linear infinite .12s;
  }

  .energy-four {
    right: 18%;
    animation: energyFromCore 1.25s linear infinite .42s;
  }

  @keyframes pumpPulse {
    0%, 100% {
      transform: translate(-50%, -50%) scale(.86);
      box-shadow:
        0 0 8px rgba(214, 179, 90, .75),
        0 0 18px rgba(214, 179, 90, .28);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.18);
      box-shadow:
        0 0 11px rgba(214, 179, 90, 1),
        0 0 28px rgba(214, 179, 90, .5);
    }
  }

  @keyframes energyToCore {
    0% {
      opacity: 0;
      transform: translateX(0) scale(.5);
    }
    15% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateX(220px) scale(1.15);
    }
  }

  @keyframes energyFromCore {
    0% {
      opacity: 0;
      transform: translateX(0) scale(.5);
    }
    15% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateX(-220px) scale(1.15);
    }
  }

  .login-button {
    position: relative;
    z-index: 4;
    min-width: 130px;
    height: 58px;
    padding: 0 28px;
    border: 0;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: rgba(234, 242, 240, 0.7);
    background:
      linear-gradient(
        180deg,
        rgba(45, 61, 60, 0.92),
        rgba(31, 46, 45, 0.96)
      );
    box-shadow:
      0 12px 25px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.035);
    cursor: pointer;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    transition:
      transform 170ms cubic-bezier(0.22, 1, 0.36, 1),
      background 260ms ease,
      color 260ms ease,
      box-shadow 260ms ease,
      border-color 260ms ease;
    will-change: transform;
  }

  .login-button:hover {
    color: #fff9e8;
  }

  .login-button:focus-visible {
    outline: 2px solid rgba(214, 179, 90, 0.9);
    outline-offset: 4px;
  }

  .login-button.button-near {
    box-shadow:
      0 16px 34px rgba(0, 0, 0, 0.3),
      0 0 16px rgba(40, 225, 187, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.035);
  }

  .login-button.button-ready {
    min-width: 148px;
    color: #171107;
    background: linear-gradient(135deg, #d6b35a, #a88435);
    box-shadow:
      0 13px 32px rgba(23, 216, 177, 0.23),
      0 0 28px rgba(31, 225, 186, 0.13),
      inset 0 1px 0 rgba(255, 255, 255, 0.32);
  }

  .login-button.button-ready:hover {
    background: linear-gradient(135deg, #e8ca78, #b99443);
    box-shadow:
      0 16px 36px rgba(23, 216, 177, 0.28),
      0 0 32px rgba(31, 225, 186, 0.16);
    transform: translateY(-1px) !important;
  }

  .login-button.button-loading {
    color: #071613;
    background: linear-gradient(135deg, #2bdcb7, #19caa4);
    cursor: wait;
  }

  .login-button.button-error {
    color: #fff8f8;
    background:
      linear-gradient(135deg, #ff6672 0%, #e13b4b 52%, #b92335 100%);
    border: 1px solid rgba(255, 180, 185, 0.22);
    box-shadow:
      0 14px 34px rgba(214, 35, 55, 0.30),
      0 0 22px rgba(255, 55, 75, 0.20),
      inset 0 1px 0 rgba(255, 255, 255, 0.20);
    animation: errorButtonProfessional 620ms cubic-bezier(.22,1,.36,1);
  }

  .login-button.button-error::before {
    content: "";
    position: absolute;
    inset: 1px;
    border-radius: inherit;
    background: linear-gradient(
      110deg,
      transparent 18%,
      rgba(255,255,255,.22) 48%,
      transparent 72%
    );
    transform: translateX(-130%);
    animation: errorSweep 620ms ease-out;
    pointer-events: none;
  }

  .login-button.button-error-pulse .button-label {
    animation: errorTextPulse 620ms ease-out;
  }

  .login-button.button-success {
    color: #052019;
    background: linear-gradient(135deg, #39e8bf, #1bcaa5);
    box-shadow: 0 0 34px rgba(40, 230, 190, 0.18);
  }

  .button-label {
    position: relative;
    z-index: 2;
  }

  .spinner {
    width: 20px;
    height: 20px;
    position: relative;
    display: inline-block;
  }

  .spinner span {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    transform-origin: 2px 2px;
    animation: spinnerDots 0.85s linear infinite;
  }

  .spinner span:nth-child(1) {
    transform: rotate(0deg) translateX(7px);
    animation-delay: 0s;
  }

  .spinner span:nth-child(2) {
    transform: rotate(120deg) translateX(7px);
    animation-delay: -0.28s;
  }

  .spinner span:nth-child(3) {
    transform: rotate(240deg) translateX(7px);
    animation-delay: -0.56s;
  }

  .button-success-icon {
    width: 19px;
    height: 19px;
    display: grid;
    place-items: center;
    animation: successPop 420ms cubic-bezier(0.2, 1.5, 0.4, 1);
  }

  .button-success-icon svg {
    width: 19px;
    height: 19px;
  }

  .keyboard-hint {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 1px;
    color: rgba(216, 232, 228, 0.36);
    font-size: 11px;
    letter-spacing: 0.1px;
  }

  .hint-key {
    min-width: 34px;
    padding: 3px 7px;
    border: 1px solid rgba(197, 223, 218, 0.09);
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.025);
    color: rgba(226, 240, 237, 0.54);
    text-align: center;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .divider {
    height: 1px;
    margin: 14px 0 24px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(171, 213, 207, 0.11),
      transparent
    );
  }

  .register-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    color: rgba(224, 238, 235, 0.48);
    font-size: 13px;
  }

  .create-button {
    border: 0;
    padding: 2px 0;
    color: #28dcb6;
    background: transparent;
    cursor: pointer;
    font-size: inherit;
    font-weight: 600;
    transition: color 180ms ease, text-shadow 180ms ease;
  }

  .create-button:hover {
    color: #65f2d3;
    text-shadow: 0 0 15px rgba(40, 220, 182, 0.25);
  }

  .page-footer {
    position: absolute;
    left: 50%;
    bottom: max(11px, env(safe-area-inset-bottom));
    z-index: 3;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 7px;
    color: rgba(207, 228, 223, 0.25);
    font-size: 10px;
    letter-spacing: 0.6px;
    white-space: nowrap;
  }

  .footer-code {
    color: rgba(42, 222, 184, 0.58);
    font-weight: 700;
  }




  /* Final trust-device treatment */
  .trust-device-row {
    min-height: 23px;
    margin: 8px 2px 1px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .trust-device-button {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 2px 0;
    border: 0;
    background: transparent;
    color: rgba(225, 240, 236, .68);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: color .18s ease, opacity .18s ease;
  }

  .trust-device-button:hover {
    color: #dffef5;
  }

  .trust-checkbox {
    width: 14px;
    height: 14px;
    flex: 0 0 14px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(151,205,196,.38);
    border-radius: 3px;
    background: rgba(3,13,14,.78);
    transition: all .18s ease;
  }

  .trust-checkbox svg {
    width: 10px;
    height: 10px;
  }

  .trust-device-button.trusted .trust-checkbox {
    color: #05231d;
    background: #2ce1b9;
    border-color: #39edc5;
    box-shadow: 0 0 10px rgba(44,225,185,.22);
  }

  .trust-stop-button {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid rgba(255, 85, 85, .62);
    border-radius: 4px;
    background: #8b0000;
    box-shadow:
      0 0 8px rgba(255, 40, 40, .12),
      inset 0 1px 0 rgba(255,255,255,.08);
    cursor: pointer;
    transition:
      background .18s ease,
      border-color .18s ease,
      transform .18s ease,
      box-shadow .18s ease;
  }

  .trust-stop-button span {
    width: 6px;
    height: 6px;
    border-radius: 1px;
    background: #ffb0b0;
  }

  .trust-stop-button:hover {
    background: #b00000;
    border-color: #ff6969;
    box-shadow: 0 0 12px rgba(255, 40, 40, .22);
    transform: scale(1.06);
  }

  .trust-stop-button:active {
    transform: scale(.92);
  }

  @media (max-width: 560px) {
    .login-card {
      border-color: #d6b35a;
    }

    .trust-device-row {
      margin-top: 7px;
    }

    .trust-device-button {
      font-size: 10.5px;
    }

    .trust-stop-button {
      width: 17px;
      height: 17px;
      flex-basis: 17px;
    }
  }

  /* AJAY KEDAR / reference hydraulic controls */
  .brand-name {
    letter-spacing: 3px;
    font-size: 10px;
  }

  .trust-device-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 8px 3px 2px;
    min-height: 24px;
  }

  .trust-device-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
    border: 0;
    background: transparent;
    color: rgba(225, 240, 236, 0.68);
    font-size: 12px;
    cursor: pointer;
    transition: color .18s ease;
  }

  .trust-device-button:hover {
    color: #eafff9;
  }

  .trust-checkbox {
    width: 16px;
    height: 16px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(151,205,196,.38);
    border-radius: 4px;
    background: rgba(3,13,14,.72);
    transition: all .18s ease;
  }

  .trust-device-button.trusted .trust-checkbox {
    color: #05231d;
    background: #2ce1b9;
    border-color: #39edc5;
    box-shadow: 0 0 13px rgba(44,225,185,.28);
    animation: trustPop .25s ease-out;
  }

  .trust-checkbox svg {
    width: 12px;
    height: 12px;
  }

  .login-button-zone {
    height: 92px;
    margin-top: 6px;
    touch-action: pan-y;
  }

  .locked-zone {
    cursor: default;
  }

  .hydraulic-track {
    left: 22px;
    right: 50%;
    height: 43px;
  }

  .track-line {
    right: 2px;
    background: repeating-linear-gradient(
      90deg,
      rgba(35,220,181,.62) 0 8px,
      transparent 8px 14px
    );
    filter: drop-shadow(0 0 3px rgba(35,220,181,.18));
  }

  .hydraulic-piston {
    width: 39px;
    height: 39px;
    border: 1px solid rgba(39,225,188,.4);
    background: rgba(16,49,47,.58);
    box-shadow:
      0 0 14px rgba(39,225,188,.22),
      inset 0 0 9px rgba(39,225,188,.09);
  }

  .hydraulic-piston span {
    width: 7px;
    height: 7px;
  }

  .login-button {
    position: relative;
    z-index: 5;
    min-width: 137px;
    height: 60px;
    border: 1px solid rgba(145,192,186,.06);
    background: linear-gradient(
      180deg,
      rgba(47,62,61,.96),
      rgba(34,49,48,.99)
    );
    box-shadow:
      0 13px 25px rgba(0,0,0,.24),
      inset 0 1px 0 rgba(255,255,255,.035);
  }

  .login-button.button-ready {
    min-width: 150px;
    color: #052019;
    background: linear-gradient(135deg,#35e8c0,#18cba5);
    box-shadow:
      0 14px 34px rgba(24,215,176,.25),
      0 0 28px rgba(31,225,186,.13);
  }

  @keyframes trustPop {
    0% { transform: scale(.65); }
    70% { transform: scale(1.12); }
    100% { transform: scale(1); }
  }


  /* FINAL REFERENCE OVERRIDES */
  .login-button-zone,
  .login-button-zone::before,
  .login-button-zone::after {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .hydraulic-pump {
    z-index: 1 !important;
  }

  .login-button {
    z-index: 5 !important;
  }

  .login-button.button-ready {
    box-shadow:
      0 14px 34px rgba(24, 215, 176, .25),
      0 0 30px rgba(45, 240, 199, .18),
      inset 0 1px 0 rgba(255,255,255,.3);
  }

  .login-button.button-error {
    box-shadow:
      0 12px 32px rgba(235, 51, 68, .25),
      0 0 26px rgba(255, 66, 82, .17);
  }

  @media (max-width: 560px) {
    .hydraulic-pump {
      left: 0;
      right: 0;
      height: 58px;
    }

    .pump-rod {
      width: calc(50% - 62px);
    }

    .trust-device-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 3px;
    }

    .trust-device-note {
      padding-left: 24px;
    }
  }

  @keyframes ringPulse {
    0%, 100% {
      transform: scale(0.96);
      opacity: 0.72;
    }
    50% {
      transform: scale(1.06);
      opacity: 1;
    }
  }

  @keyframes pistonPulse {
    0%, 100% {
      transform: translate(50%, -50%) scale(0.92);
    }
    50% {
      transform: translate(50%, -50%) scale(1.08);
    }
  }

  @keyframes trackFlow {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 28px 0;
    }
  }

  @keyframes spinnerDots {
    0% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.25;
    }
  }

  @keyframes successPop {
    0% {
      opacity: 0;
      transform: scale(0.3) rotate(-20deg);
    }
    75% {
      transform: scale(1.18) rotate(5deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0);
    }
  }

  @keyframes inputShake {
    0%, 100% {
      transform: translateX(0);
    }
    30% {
      transform: translateX(-3px);
    }
    60% {
      transform: translateX(3px);
    }
  }

  @keyframes inputShake {
    0% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
    100% { transform: translateX(0); }
  }

  @keyframes errorButtonProfessional {
    0% {
      transform: translate3d(0,0,0) rotate(0deg) scale(1);
    }
    14% {
      transform: translate3d(-7px,1px,0) rotate(-2deg) scale(1.02);
    }
    28% {
      transform: translate3d(7px,-1px,0) rotate(2deg) scale(1.02);
    }
    42% {
      transform: translate3d(-5px,1px,0) rotate(-1.5deg) scale(1.01);
    }
    56% {
      transform: translate3d(5px,0,0) rotate(1.5deg) scale(1.01);
    }
    72% {
      transform: translate3d(-2px,0,0) rotate(-.5deg) scale(1);
    }
    100% {
      transform: translate3d(0,0,0) rotate(0deg) scale(1);
    }
  }

  @keyframes errorSweep {
    0% { transform: translateX(-130%); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateX(130%); opacity: 0; }
  }

  @keyframes errorTextPulse {
    0%, 100% { transform: scale(1); }
    35% { transform: scale(1.035); }
    65% { transform: scale(.985); }
  }

  @keyframes errorButtonShake {
    0%, 100% {
      margin-left: 0;
    }
    25% {
      margin-left: -5px;
    }
    50% {
      margin-left: 5px;
    }
    75% {
      margin-left: -3px;
    }
  }

  @keyframes ambientFloat {
    0%, 100% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      transform: translate3d(30px, -20px, 0) scale(1.08);
    }
  }

  @media (max-width: 560px) {
    .login-page {
      align-items: center;
      padding-left: 14px;
      padding-right: 14px;
    }

    .login-shell {
      width: min(100%, 430px);
    }

    .login-card {
      padding: 27px 22px 23px;
      border-radius: 24px;
    }

    .brand {
      margin-bottom: 25px;
    }

    .login-header {
      margin-bottom: 23px;
    }

    .login-header h1 {
      font-size: 30px;
    }

    .login-header p {
      font-size: 13px;
      line-height: 1.55;
    }

    .field-group {
      margin-bottom: 18px;
    }

    .input-shell {
      height: 55px;
      border-radius: 14px;
    }

    .login-button-zone {
      height: 84px;
      margin-top: 14px;
    }

    .hydraulic-track {
      left: 18px;
    }

    .login-button {
      min-width: 120px;
      height: 54px;
      padding: 0 25px;
    }

    .login-button.button-ready {
      min-width: 142px;
    }

    .page-footer {
      display: none;
    }
  }

  @media (max-width: 360px) {
    .login-page {
      padding-left: 10px;
      padding-right: 10px;
    }

    .login-card {
      padding: 23px 17px 20px;
    }

    .brand-name {
      letter-spacing: 3px;
      gap: 4px;
    }

    .login-header h1 {
      font-size: 28px;
    }

    .input-shell {
      height: 53px;
    }

    .input-icon {
      width: 42px;
      flex-basis: 42px;
    }

    .keyboard-hint {
      font-size: 10px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
    }
  }

  /* Classic luxury palette — restrained gold, ivory and charcoal */
  .login-page {
    letter-spacing: 0.01em;
  }

  .login-card {
    border-color: rgba(214, 179, 90, 0.52);
    background:
      linear-gradient(145deg, rgba(30, 26, 18, 0.97), rgba(12, 11, 9, 0.98));
    box-shadow:
      0 35px 90px rgba(0, 0, 0, 0.58),
      0 0 34px rgba(214, 179, 90, 0.07),
      inset 0 1px 0 rgba(255, 246, 214, 0.06);
  }

  .brand-name {
    color: rgba(247, 241, 223, 0.72);
    letter-spacing: 4.5px;
  }

  .login-header h1 {
    color: #e2c36f;
    letter-spacing: 0.3px;
    text-shadow: 0 0 18px rgba(214, 179, 90, 0.14);
  }

  .field-label-row label {
    color: rgba(247, 241, 223, 0.72);
    font-weight: 600;
  }

  .forgot-button,
  .create-button {
    color: #d6b35a;
    font-weight: 600;
  }

  .forgot-button:hover,
  .create-button:hover {
    color: #f0d68b;
    text-shadow: 0 0 12px rgba(214, 179, 90, 0.24);
  }

  .input-shell {
    border-color: rgba(214, 179, 90, 0.16);
    background: rgba(8, 7, 6, 0.72);
  }

  .input-shell:focus-within {
    border-color: #d6b35a;
    background: rgba(17, 14, 9, 0.9);
    box-shadow:
      0 0 0 3px rgba(214, 179, 90, 0.08),
      0 0 24px rgba(214, 179, 90, 0.14),
      inset 0 1px 1px rgba(255, 246, 214, 0.045);
  }

  .input-shell input {
    color: #f7f1df;
    font-weight: 500;
  }

  .input-shell input::placeholder {
    color: rgba(247, 241, 223, 0.38);
  }

  .trust-device-button {
    color: rgba(247, 241, 223, 0.7);
  }

  .trust-checkbox {
    border-color: rgba(214, 179, 90, 0.45);
  }

  .trust-device-button.trusted .trust-checkbox {
    background: #d6b35a;
    border-color: #d6b35a;
    color: #171107;
  }

  .login-button.button-ready {
    color: #171107;
    background: linear-gradient(135deg, #e0c26b, #a88435);
    box-shadow:
      0 14px 32px rgba(168, 132, 53, 0.24),
      0 0 28px rgba(214, 179, 90, 0.12),
      inset 0 1px 0 rgba(255, 248, 220, 0.34);
  }

  .login-button.button-ready:hover {
    background: linear-gradient(135deg, #efd27e, #b99443);
    box-shadow:
      0 16px 36px rgba(168, 132, 53, 0.28),
      0 0 32px rgba(214, 179, 90, 0.15);
  }

  .divider {
    background: linear-gradient(90deg, transparent, rgba(214, 179, 90, 0.24), transparent);
  }

  .register-row {
    color: rgba(247, 241, 223, 0.55);
  }

  .page-footer {
    color: rgba(247, 241, 223, 0.48);
  }

  .footer-code {
    color: #d6b35a;
  }

  @media (prefers-reduced-motion: reduce) {
    .login-card *,
    .login-card *::before,
    .login-card *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Premium AJAY KEDAR motion layer */
  .login-page{background:radial-gradient(circle at 50% 18%,rgba(214,179,90,.075),transparent 27%),radial-gradient(circle at 8% 85%,rgba(214,179,90,.055),transparent 25%),linear-gradient(145deg,#080706 0%,#15110a 48%,#080706 100%)}
  .grid-overlay{animation:gridDrift 24s linear infinite}
  .login-card{border-color:rgba(214,179,90,.58);background:linear-gradient(145deg,rgba(31,27,19,.965),rgba(10,9,7,.985));box-shadow:0 35px 90px rgba(0,0,0,.62),0 0 42px rgba(214,179,90,.055),inset 0 1px 0 rgba(255,246,214,.075);animation:cardEntrance .8s cubic-bezier(.22,1,.36,1) both,cardFloat 8s ease-in-out 1s infinite}
  .login-card::before{animation:topSweep 4.5s ease-in-out infinite}
  .brand,.login-header,.field-group,.trust-device-row,.login-button-zone,.keyboard-hint,.register-row{animation:contentRise .65s cubic-bezier(.22,1,.36,1) both}
  .brand{animation-delay:.08s}.login-header{animation-delay:.18s}.field-group:nth-child(1){animation-delay:.25s}.field-group:nth-child(2){animation-delay:.31s}.trust-device-row{animation-delay:.4s}.login-button-zone{animation-delay:.45s}.keyboard-hint{animation-delay:.52s}.register-row{animation-delay:.56s}
  .brand-mark{animation:markFloat 4s ease-in-out infinite}.brand-ring{animation:ringPulse 2.4s ease-in-out infinite,ringRotate 8s linear infinite}
  .brand-name{gap:5px;color:#d6b35a;font-size:12px;font-weight:700;letter-spacing:2.8px;text-transform:uppercase;text-shadow:0 0 18px rgba(214,179,90,.14)}
  .brand-letter{display:inline-block;animation:letterReveal .65s cubic-bezier(.22,1,.36,1) both}
  .brand-letter:nth-child(1){animation-delay:.14s}.brand-letter:nth-child(2){animation-delay:.18s}.brand-letter:nth-child(3){animation-delay:.22s}.brand-letter:nth-child(4){animation-delay:.26s}.brand-letter:nth-child(6){animation-delay:.34s}.brand-letter:nth-child(7){animation-delay:.38s}.brand-letter:nth-child(8){animation-delay:.42s}.brand-letter:nth-child(9){animation-delay:.46s}.brand-letter:nth-child(10){animation-delay:.50s}.brand-gap{width:7px}
  .login-header h1{color:#e3c56f;text-shadow:0 0 12px rgba(214,179,90,.20),0 0 30px rgba(214,179,90,.07)}
  .input-shell{border-color:rgba(214,179,90,.17);background:rgba(8,7,6,.76)}.input-shell:hover{border-color:rgba(214,179,90,.30);transform:translateY(-1px)}
  .input-shell:focus-within{border-color:#d6b35a;background:rgba(18,14,8,.88);box-shadow:0 0 0 3px rgba(214,179,90,.075),0 0 26px rgba(214,179,90,.13),inset 0 1px 1px rgba(255,246,214,.045)}
  .trust-device-button{color:rgba(247,241,223,.68)}.trust-device-button:hover{color:#e7ca78}.trust-checkbox{transition:transform .25s cubic-bezier(.22,1,.36,1),background .25s ease,border-color .25s ease,box-shadow .25s ease}.trust-device-button:hover .trust-checkbox{transform:scale(1.06)}.trust-device-button.trusted .trust-checkbox{background:#d6b35a;border-color:#d6b35a;color:#171107;box-shadow:0 0 16px rgba(214,179,90,.22)}
  .login-button{transition:transform .24s cubic-bezier(.22,1,.36,1),background .3s ease,color .3s ease,box-shadow .3s ease,filter .3s ease}
  .login-button.button-ready{color:#171107;background:linear-gradient(135deg,#ead083,#d6b35a 45%,#a88435);box-shadow:0 14px 34px rgba(168,132,53,.26),0 0 28px rgba(214,179,90,.13),inset 0 1px 0 rgba(255,249,222,.42)}
  .login-button.button-ready:hover{filter:brightness(1.07);box-shadow:0 17px 40px rgba(168,132,53,.31),0 0 34px rgba(214,179,90,.17),inset 0 1px 0 rgba(255,249,222,.48)}
  .divider{background:linear-gradient(90deg,transparent,rgba(214,179,90,.30),transparent)}.create-button{color:#d6b35a}
  .page-footer{gap:8px;color:rgba(247,241,223,.46);letter-spacing:.6px;animation:footerReveal 1s .65s cubic-bezier(.22,1,.36,1) both}.footer-name{color:#d6b35a;font-weight:750;letter-spacing:2px;text-shadow:0 0 14px rgba(214,179,90,.12)}.footer-separator{color:rgba(214,179,90,.55)}
  @keyframes cardEntrance{from{opacity:0;transform:translateY(22px) scale(.975);filter:blur(4px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}@keyframes cardFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes contentRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes letterReveal{from{opacity:0;transform:translateY(7px);filter:blur(3px)}to{opacity:1;transform:translateY(0);filter:blur(0)}}@keyframes topSweep{0%,100%{opacity:.3;transform:scaleX(.7)}50%{opacity:.9;transform:scaleX(1)}}@keyframes markFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2px) rotate(2deg)}}@keyframes ringRotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes gridDrift{from{background-position:0 0,0 0}to{background-position:54px 54px,54px 54px}}@keyframes footerReveal{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @media (prefers-reduced-motion:reduce){.login-card,.brand,.brand-mark,.brand-ring,.brand-letter,.login-header,.field-group,.trust-device-row,.login-button-zone,.keyboard-hint,.register-row,.page-footer,.grid-overlay{animation:none!important}}
`;

