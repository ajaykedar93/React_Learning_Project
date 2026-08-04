import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  CheckCircle, XCircle, AlertCircle, Loader2, 
  Mail, Lock, ArrowLeft, KeyRound, Shield, 
  Sparkles, Code2, Eye, EyeOff
} from "lucide-react";

export default function Forgot() {
  const navigate = useNavigate();

  const API_BASE =
    import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

  const [step, setStep] = useState("email"); // email -> otp -> reset
  const [emailLocked, setEmailLocked] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [verifyToken, setVerifyToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState({ send: false, verify: false, reset: false });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message, duration = 4000) => {
    setToast({ type, title, message, duration });
    setTimeout(() => setToast(null), duration);
  };

  const closeToast = () => setToast(null);

  const normalizeEmail = (e) => String(e || "").trim().toLowerCase();
  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());

  async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {}

    if (!res.ok) throw new Error(data?.message || text || `Request failed (HTTP ${res.status})`);
    return data || {};
  }

  // ✅ STEP 1: Send OTP
  const sendOtp = async () => {
    setErrors({});
    const em = normalizeEmail(email);

    if (!isValidEmail(em)) {
      setErrors({ email: "Enter valid email" });
      showToast("error", "Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading((p) => ({ ...p, send: true }));

      const data = await apiPost("/api/personal-users/forgot/send-otp", { email_address: em });

      setStep("otp");
      setEmailLocked(true);
      showToast("success", "OTP Sent", data?.message || "OTP sent to your email.");
    } catch (err) {
      showToast("error", "OTP Send Failed", err.message);
    } finally {
      setLoading((p) => ({ ...p, send: false }));
    }
  };

  // ✅ STEP 2: Verify OTP
  const verifyOtpFn = async () => {
    setErrors({});
    const em = normalizeEmail(email);

    if (!/^[0-9]{6}$/.test(String(otp || ""))) {
      setErrors({ otp: "OTP must be 6 digits" });
      showToast("error", "Invalid OTP", "Please enter 6 digit OTP.");
      return;
    }

    try {
      setLoading((p) => ({ ...p, verify: true }));

      const data = await apiPost("/api/personal-users/forgot/verify-otp", { 
        email_address: em, 
        otp 
      });

      setVerifyToken(data.verify_token || "");
      setStep("reset");
      showToast("success", "Verified", "OTP verified. Now reset your password.");
    } catch (err) {
      showToast("error", "OTP Verification Failed", err.message);
    } finally {
      setLoading((p) => ({ ...p, verify: false }));
    }
  };

  // ✅ STEP 3: Reset Password
  const resetPassword = async () => {
    setErrors({});

    if (!newPass || newPass.length < 6) {
      setErrors({ newPass: "Password must be at least 6 characters" });
      showToast("error", "Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      setErrors({ confirmPass: "Password not match" });
      showToast("error", "Not Match", "New password and confirm password not match.");
      return;
    }
    if (!verifyToken) {
      showToast("error", "Not Verified", "Please verify OTP first.");
      return;
    }

    try {
      setLoading((p) => ({ ...p, reset: true }));

      const data = await apiPost("/api/personal-users/forgot/reset-password", {
        email_address: normalizeEmail(email),
        new_password: newPass,
        verify_token: verifyToken,
      });

      showToast("success", "Password Updated", data?.message || "Password reset successfully ✅");

      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (err) {
      showToast("error", "Reset Failed", err.message);
    } finally {
      setLoading((p) => ({ ...p, reset: false }));
    }
  };

  return (
    <div className="forgot-page">
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

      {/* Forgot Password Card */}
      <div className="forgot-wrapper">
        <div className="forgot-card glass-card">

          {/* Back Button */}
          <Link to="/login" className="back-link">
            <ArrowLeft size={18} />
            Back to Login
          </Link>

          {/* Brand */}
          <div className="brand-section">
            <div className="brand-icon">
              <KeyRound size={28} color="#fff" />
            </div>
            <h1 className="brand-title">Forgot Password</h1>
            <p className="brand-subtitle">
              {step === "email" && "Enter your email to receive OTP"}
              {step === "otp" && "Check your email for OTP"}
              {step === "reset" && "Create a new password"}
            </p>
          </div>

          {/* STEP 1: EMAIL */}
          {step === "email" && (
            <>
              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    className={`form-input ${errors.email ? "error" : ""}`}
                    placeholder="Enter registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>

              <button className="submit-btn" onClick={sendOtp} disabled={loading.send}>
                {loading.send ? (
                  <>
                    <Loader2 size={20} className="spinner" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail size={20} />
                    Send OTP
                  </>
                )}
              </button>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === "otp" && (
            <>
              <div className="form-group locked-field">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input className="form-input locked" value={normalizeEmail(email)} readOnly />
                </div>
              </div>

              <div className="otp-section">
                <div className="otp-header">
                  <span className="otp-title">Enter OTP</span>
                  <span className="otp-hint">Check inbox / spam</span>
                </div>

                <div className="otp-row">
                  <input
                    className={`form-input otp-input ${errors.otp ? "error" : ""}`}
                    placeholder="6 digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                  />
                  <button 
                    className="verify-btn" 
                    type="button" 
                    onClick={verifyOtpFn} 
                    disabled={loading.verify}
                  >
                    {loading.verify ? (
                      <Loader2 size={18} className="spinner" />
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>

                {errors.otp && <div className="error-text center">{errors.otp}</div>}

                <button 
                  className="resend-link" 
                  type="button" 
                  onClick={sendOtp} 
                  disabled={loading.send}
                >
                  {loading.send ? "Resending..." : "Resend OTP"}
                </button>
              </div>
            </>
          )}

          {/* STEP 3: RESET */}
          {step === "reset" && (
            <>
              <div className="form-group locked-field">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input className="form-input locked" value={normalizeEmail(email)} readOnly />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  New Password <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    className={`form-input ${errors.newPass ? "error" : ""}`}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 chars)"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPass && <div className="error-text">{errors.newPass}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Confirm Password <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    className={`form-input ${errors.confirmPass ? "error" : ""}`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPass && <div className="error-text">{errors.confirmPass}</div>}
              </div>

              <button className="submit-btn" onClick={resetPassword} disabled={loading.reset}>
                {loading.reset ? (
                  <>
                    <Loader2 size={20} className="spinner" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    Update Password
                  </>
                )}
              </button>
            </>
          )}

          {/* Footer Links - Only Back to Login */}
          <div className="auth-links">
            <Link className="auth-link" to="/login">
              ← Back to Login
            </Link>
          </div>

          <div className="footer-note">
            🔒 Secured with industry standard encryption
          </div>
        </div>

        {/* Developer Footer */}
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
     MODERN FORGOT PASSWORD PAGE CSS
     ============================================ */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .forgot-page {
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
     ANIMATED BACKGROUND
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
  .forgot-wrapper {
    width: 100%;
    max-width: 440px;
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
     GLASS CARD
     ============================================ */
  .forgot-card {
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

  .forgot-card:hover {
    box-shadow: 
      0 50px 120px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.08) inset,
      0 0 60px rgba(124, 58, 237, 0.08);
    transform: translateY(-2px);
  }

  /* ============================================
     BACK LINK
     ============================================ */
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: rgba(255, 255, 255, 0.3);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    margin-bottom: 16px;
  }

  .back-link:hover {
    color: rgba(255, 255, 255, 0.7);
  }

  /* ============================================
     BRAND SECTION
     ============================================ */
  .brand-section {
    text-align: center;
    margin-bottom: 24px;
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
    margin-top: 4px;
  }

  /* ============================================
     FORM ELEMENTS
     ============================================ */
  .form-group {
    margin-bottom: 16px;
  }

  .form-group.locked-field {
    opacity: 0.7;
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

  .input-icon {
    position: absolute;
    left: 14px;
    color: rgba(255, 255, 255, 0.2);
    pointer-events: none;
  }

  .form-input {
    width: 100%;
    padding: 12px 16px 12px 42px;
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

  .form-input.locked {
    opacity: 0.7;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.02);
  }

  .form-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .otp-input {
    text-align: center;
    letter-spacing: 4px;
    font-size: 18px;
    font-weight: 700;
    padding: 12px 16px;
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

  .error-text.center {
    text-align: center;
  }

  /* ============================================
     OTP SECTION
     ============================================ */
  .otp-section {
    margin: 8px 0 4px;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgba(124, 58, 237, 0.15);
    background: rgba(255, 255, 255, 0.03);
  }

  .otp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .otp-title {
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
  }

  .otp-hint {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    font-weight: 500;
  }

  .otp-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
  }

  .verify-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #7C3AED, #4F6BFF);
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 100px;
  }

  .verify-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
  }

  .verify-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .resend-link {
    margin-top: 10px;
    width: 100%;
    border: none;
    background: transparent;
    color: rgba(124, 58, 237, 0.7);
    font-weight: 600;
    cursor: pointer;
    font-size: 12px;
    transition: color 0.3s ease;
    font-family: inherit;
    text-decoration: underline;
  }

  .resend-link:hover:not(:disabled) {
    color: #7C3AED;
  }

  .resend-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    margin-top: 6px;
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
     AUTH LINKS - Only Back to Login
     ============================================ */
  .auth-links {
    text-align: center;
    margin-top: 18px;
    font-size: 14px;
    font-weight: 600;
  }

  .auth-link {
    color: rgba(124, 58, 237, 0.8);
    font-weight: 700;
    text-decoration: none;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
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
     DEVELOPER FOOTER
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
  }

  .toast-close:hover {
    color: rgba(255, 255, 255, 0.5);
  }

  /* ============================================
     RESPONSIVE
     ============================================ */
  @media (max-width: 640px) {
    .forgot-page {
      padding: 16px;
    }

    .forgot-card {
      padding: 24px 20px 20px;
      border-radius: 24px;
    }

    .forgot-wrapper {
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
      padding: 10px 14px 10px 38px;
      font-size: 13px;
    }

    .otp-row {
      grid-template-columns: 1fr;
    }

    .verify-btn {
      width: 100%;
      justify-content: center;
      min-width: auto;
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
    .forgot-card {
      padding: 18px 14px 16px;
      border-radius: 20px;
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

    .forgot-wrapper {
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