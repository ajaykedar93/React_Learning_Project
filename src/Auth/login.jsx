import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle, XCircle, AlertCircle, Loader2, Eye, EyeOff, Sparkles, LogIn, Code2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const API_BASE = useMemo(() => {
    const envBase = import.meta?.env?.VITE_API_BASE?.trim();

    if (envBase) {
      return envBase.replace(/\/$/, "");
    }

    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }

    return "https://express-project-learning-new.onrender.com";
  }, []);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [serverStatus, setServerStatus] = useState({
    state: "checking",
    ms: 0,
  });

  const [toast, setToast] = useState(null);

  const showToast = (type, title, message, duration = 4000) => {
    setToast({ type, title, message, duration });
    setTimeout(() => setToast(null), duration);
  };

  const closeToast = () => setToast(null);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeToast();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Warm-up backend
  useEffect(() => {
    const warmUp = async () => {
      const start = performance.now();
      const setStateSafe = (state, ms = 0) => {
        if (!aliveRef.current) return;
        setServerStatus({ state, ms });
      };

      setStateSafe("checking", 0);

      try {
        const r1 = await fetch(`${API_BASE}/api/health`, {
          method: "GET",
          cache: "no-store",
        });

        if (!r1.ok) {
          const r2 = await fetch(`${API_BASE}/`, {
            method: "GET",
            cache: "no-store",
          });

          const ms = Math.round(performance.now() - start);
          setStateSafe(r2.ok ? "ready" : "waking", ms);
          return;
        }

        const ms = Math.round(performance.now() - start);
        setStateSafe("ready", ms);
      } catch {
        const ms = Math.round(performance.now() - start);
        setStateSafe("down", ms);
      }
    };

    warmUp();
  }, [API_BASE]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const err = {};
    const email = form.email.trim();
    const password = form.password.trim();

    if (!email) err.email = "Email address required";
    if (!password) err.password = "Password required";

    setErrors(err);

    if (Object.keys(err).length) {
      showToast(
        "error",
        "Missing Fields",
        "Please enter Email and Password."
      );
    }
    return Object.keys(err).length === 0;
  };

  function toNiceError(err, resStatus) {
    const msg = err?.message || "";

    if (msg.toLowerCase().includes("cold start") || err?.name === "AbortError") {
      return "Server is waking up. Wait 5–10 seconds and try again.";
    }

    if (msg.toLowerCase().includes("failed to fetch")) {
      return "API unreachable. Check backend CORS and API URL.";
    }

    if (resStatus === 404) {
      return "API route not found (404). Check endpoint path.";
    }

    if (resStatus === 401) {
      return "Invalid email or password. Please try again.";
    }

    if (resStatus === 400) {
      return "Please check your email and password.";
    }

    return msg || "Login failed. Please try again.";
  }

  async function apiPost(path, body, { timeoutMs = 35000 } = {}) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json().catch(() => ({}))
        : await res.text().then((txt) => ({ message: txt })).catch(() => ({}));

      if (!res.ok) {
        const e = new Error(
          data?.message || `Request failed (HTTP ${res.status}).`
        );
        e.status = res.status;
        throw e;
      }

      return data || {};
    } catch (e) {
      if (e?.name === "AbortError") {
        const er = new Error(
          "Server is taking too long (cold start). Please try again."
        );
        er.name = "AbortError";
        throw er;
      }
      throw e;
    } finally {
      clearTimeout(t);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    try {
      setLoading(true);
      showToast("info", "Signing you in…", "Please wait a moment.");

      const data = await apiPost("/api/personal-users/login", {
        email: form.email.trim(),
        password: form.password.trim(),
      });

      if (!aliveRef.current) return;

      const token = data?.token || data?.accessToken || data?.jwt || "";
      
      if (token) {
        localStorage.setItem("token", token);
        if (rememberMe) {
          localStorage.setItem("remember_token", token);
        }
      } else {
        localStorage.removeItem("token");
      }

      if (data.success && data.data) {
        login(data.data);
        showToast("success", "Welcome Back! 🎉", data?.message || "Login successful!");
        setTimeout(() => navigate("/", { replace: true }), 800);
      } else {
        throw new Error(data?.message || "Login failed");
      }

    } catch (err) {
      if (!aliveRef.current) return;
      showToast(
        "error",
        "Login Failed",
        toNiceError(err, err?.status)
      );
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  };

  const serverText =
    serverStatus.state === "ready"
      ? `Server ready (${serverStatus.ms}ms)`
      : serverStatus.state === "waking"
      ? `Server waking up… (${serverStatus.ms}ms)`
      : serverStatus.state === "down"
      ? `Server not reachable`
      : `Checking server…`;

  const serverColor =
    serverStatus.state === "ready" ? "#22c55e" :
    serverStatus.state === "waking" ? "#f59e0b" :
    serverStatus.state === "down" ? "#ef4444" :
    "#94a3b8";

  return (
    <div className="login-page">
      <style>{css}</style>
      
      {/* Animated Background */}
      <div className="bg-animated">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast-overlay ${toast.type}`} onClick={closeToast}>
          <div className="toast-container" onClick={(e) => e.stopPropagation()}>
            <div className="toast-icon">
              {toast.type === "success" && <CheckCircle size={28} color="#22c55e" />}
              {toast.type === "error" && <XCircle size={28} color="#ef4444" />}
              {toast.type === "info" && <AlertCircle size={28} color="#3b82f6" />}
            </div>
            <div className="toast-content">
              <h4 className="toast-title">{toast.title}</h4>
              <p className="toast-message">{toast.message}</p>
            </div>
            <button className="toast-close" onClick={closeToast}>
              <XCircle size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="login-wrapper">
        <div className="login-card glass-card">
          {/* Brand */}
          <div className="brand-section">
            <div className="brand-icon">
              <Sparkles size={28} color="#fff" />
            </div>
            <h1 className="brand-title">Welcome Back</h1>
            <p className="brand-subtitle">Sign in to your account</p>
          </div>

          {/* Server Status */}
          <div className="server-status">
            <span className="status-dot" style={{ background: serverColor }} />
            <span className="status-text">{serverText}</span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  className={`form-input ${errors.email ? "error" : ""}`}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  type="email"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              {errors.email && <div className="error-text">{errors.email}</div>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  className={`form-input ${errors.password ? "error" : ""}`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <div className="error-text">{errors.password}</div>}
            </div>

            {/* Options */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link className="forgot-link" to="/forgot">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="auth-links">
              <span>Don't have an account?</span>
              <Link className="auth-link" to="/register">
                Create Account
              </Link>
            </div>

            {/* Footer */}
            <div className="footer-note">
              🔒 Secured with industry standard encryption
            </div>
          </form>
        </div>

        {/* Developer Footer - Below Card with Bold White Text */}
        <div className="dev-footer">
          <div className="dev-line">
            <Code2 size={16} className="dev-icon" />
            <span className="dev-text">Developed by <span className="dev-name">Ajay Kedar</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
  /* ============================================
     MODERN LOGIN PAGE CSS
     ============================================ */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .login-page {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 20px;
    background: #0f0a1a;
  }

  /* ============================================
     ANIMATED BACKGROUND WITH ORBS
     ============================================ */
  .bg-animated {
    position: fixed;
    inset: 0;
    z-index: 0;
    background: 
      radial-gradient(ellipse at 20% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 50%, rgba(236, 72, 153, 0.12) 0%, transparent 60%),
      radial-gradient(ellipse at 50% 100%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
      #0f0a1a;
    overflow: hidden;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    animation: floatOrb 12s ease-in-out infinite alternate;
  }

  .orb-1 {
    width: 400px;
    height: 400px;
    background: rgba(124, 58, 237, 0.25);
    top: -100px;
    left: -100px;
    animation-delay: 0s;
  }

  .orb-2 {
    width: 350px;
    height: 350px;
    background: rgba(236, 72, 153, 0.2);
    bottom: -80px;
    right: -80px;
    animation-delay: -4s;
  }

  .orb-3 {
    width: 250px;
    height: 250px;
    background: rgba(16, 185, 129, 0.15);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -8s;
  }

  .orb-4 {
    width: 200px;
    height: 200px;
    background: rgba(59, 130, 246, 0.15);
    top: 20%;
    right: 20%;
    animation-delay: -2s;
  }

  @keyframes floatOrb {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -40px) scale(1.1); }
    66% { transform: translate(-20px, 30px) scale(0.9); }
    100% { transform: translate(40px, 20px) scale(1.05); }
  }

  /* ============================================
     LAYOUT
     ============================================ */
  .login-wrapper {
    width: 100%;
    max-width: 420px;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    animation: slideUp 0.6s ease-out;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ============================================
     GLASS LOGIN CARD
     ============================================ */
  .login-card {
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 28px;
    padding: 32px 32px 28px;
    box-shadow: 
      0 40px 100px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.05) inset,
      0 0 40px rgba(124, 58, 237, 0.05);
    transition: all 0.4s ease;
  }

  .login-card:hover {
    box-shadow: 
      0 50px 120px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.08) inset,
      0 0 60px rgba(124, 58, 237, 0.08);
    transform: translateY(-2px);
  }

  /* ============================================
     BRAND SECTION
     ============================================ */
  .brand-section {
    text-align: center;
    margin-bottom: 20px;
  }

  .brand-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    background: linear-gradient(135deg, #7C3AED, #EC4899);
    border-radius: 16px;
    margin-bottom: 12px;
    box-shadow: 0 12px 40px rgba(124, 58, 237, 0.3);
    transition: all 0.3s ease;
  }

  .brand-icon:hover {
    transform: scale(1.05) rotate(-5deg);
    box-shadow: 0 16px 50px rgba(124, 58, 237, 0.4);
  }

  .brand-title {
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
    margin: 0;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
  }

  .brand-subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 500;
    margin-top: 2px;
  }

  /* ============================================
     SERVER STATUS
     ============================================ */
  .server-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 100px;
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    display: inline-block;
    transition: all 0.3s ease;
    animation: pulseDot 2s ease-in-out infinite;
  }

  @keyframes pulseDot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .status-text {
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.3);
  }

  /* ============================================
     FORM ELEMENTS
     ============================================ */
  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 5px;
  }

  .required {
    color: #f43f5e;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .form-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.04);
    outline: none;
    transition: all 0.3s ease;
    font-family: inherit;
  }

  .form-input::placeholder {
    color: rgba(255, 255, 255, 0.2);
    font-weight: 400;
  }

  .form-input:focus {
    border-color: rgba(124, 58, 237, 0.5);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
  }

  .form-input.error {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }

  .form-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .password-toggle {
    position: absolute;
    right: 14px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.3s ease;
  }

  .password-toggle:hover {
    color: rgba(255, 255, 255, 0.5);
  }

  .error-text {
    font-size: 11px;
    font-weight: 600;
    color: #f87171;
    margin-top: 5px;
  }

  /* ============================================
     FORM OPTIONS
     ============================================ */
  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: color 0.3s ease;
  }

  .checkbox-label:hover {
    color: rgba(255, 255, 255, 0.6);
  }

  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #7C3AED;
    border-radius: 4px;
    cursor: pointer;
  }

  .forgot-link {
    font-size: 12px;
    font-weight: 600;
    color: rgba(124, 58, 237, 0.7);
    text-decoration: none;
    transition: all 0.3s ease;
  }

  .forgot-link:hover {
    color: #7C3AED;
    text-decoration: underline;
  }

  /* ============================================
     SUBMIT BUTTON
     ============================================ */
  .submit-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.8), rgba(236, 72, 153, 0.8));
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: inherit;
    box-shadow: 0 8px 30px rgba(124, 58, 237, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent 50%);
    opacity: 0;
    transition: opacity 0.4s ease;
    border-radius: 12px;
  }

  .submit-btn:hover:not(:disabled)::before {
    opacity: 1;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 12px 40px rgba(124, 58, 237, 0.4);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .submit-btn:active:not(:disabled) {
    transform: scale(0.97);
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* ============================================
     AUTH LINKS
     ============================================ */
  .auth-links {
    text-align: center;
    margin-top: 16px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.3);
    font-weight: 500;
  }

  .auth-link {
    color: rgba(124, 58, 237, 0.8);
    font-weight: 700;
    text-decoration: none;
    margin-left: 4px;
    transition: all 0.3s ease;
  }

  .auth-link:hover {
    color: #7C3AED;
    text-decoration: underline;
  }

  .footer-note {
    text-align: center;
    margin-top: 14px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.15);
    font-weight: 500;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  /* ============================================
     DEVELOPER FOOTER - BOLD WHITE WITH GLOW
     ============================================ */
  .dev-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
  }

  .dev-line {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 20px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 100px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .dev-line:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }

  .dev-icon {
    color: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }

  .dev-text {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.5px;
  }

  .dev-name {
    font-weight: 800;
    font-size: 14px;
    color: #ffffff;
    background: linear-gradient(135deg, #A78BFA, #7C3AED, #EC4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 40px rgba(124, 58, 237, 0.3);
    transition: all 0.3s ease;
    letter-spacing: 0.5px;
  }

  .dev-line:hover .dev-name {
    text-shadow: 0 0 60px rgba(124, 58, 237, 0.6), 0 0 100px rgba(124, 58, 237, 0.3);
  }

  /* ============================================
     TOAST NOTIFICATION
     ============================================ */
  .toast-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: fadeIn 0.3s ease;
    padding: 20px;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .toast-container {
    max-width: 400px;
    width: 100%;
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 22px 26px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
    animation: toastSlide 0.4s ease;
  }

  @keyframes toastSlide {
    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .toast-overlay.success .toast-container {
    border-color: rgba(34, 197, 94, 0.2);
  }

  .toast-overlay.error .toast-container {
    border-color: rgba(239, 68, 68, 0.2);
  }

  .toast-overlay.info .toast-container {
    border-color: rgba(59, 130, 246, 0.2);
  }

  .toast-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
  }

  .toast-content {
    flex: 1;
  }

  .toast-title {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 3px 0;
  }

  .toast-message {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
    line-height: 1.5;
  }

  .toast-close {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    padding: 4px;
    transition: color 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toast-close:hover {
    color: rgba(255, 255, 255, 0.5);
  }

  /* ============================================
     RESPONSIVE
     ============================================ */
  @media (max-width: 640px) {
    .login-page {
      padding: 16px;
    }

    .login-card {
      padding: 24px 20px 20px;
      border-radius: 24px;
    }

    .login-wrapper {
      max-width: 100%;
      gap: 14px;
    }

    .brand-title {
      font-size: 20px;
    }

    .brand-icon {
      width: 48px;
      height: 48px;
    }

    .form-input {
      padding: 10px 14px;
      font-size: 13px;
    }

    .toast-container {
      padding: 16px 18px;
    }

    .toast-title {
      font-size: 14px;
    }

    .toast-message {
      font-size: 12px;
    }

    .dev-text {
      font-size: 12px;
    }

    .dev-name {
      font-size: 13px;
    }

    .dev-line {
      padding: 6px 16px;
    }
  }

  @media (max-width: 400px) {
    .login-card {
      padding: 18px 14px 16px;
      border-radius: 20px;
    }

    .form-options {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }

    .brand-title {
      font-size: 18px;
    }

    .brand-icon {
      width: 44px;
      height: 44px;
    }

    .toast-container {
      padding: 14px 14px;
    }

    .login-wrapper {
      gap: 12px;
    }

    .dev-text {
      font-size: 11px;
    }

    .dev-name {
      font-size: 12px;
    }

    .dev-line {
      padding: 5px 12px;
    }
  }
`;