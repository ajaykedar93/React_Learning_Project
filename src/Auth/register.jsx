import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  CheckCircle, XCircle, AlertCircle, Loader2, Eye, EyeOff, 
  Sparkles, UserPlus, Code2, Mail, Phone, MapPin, Lock, User
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const API_BASE = useMemo(
    () =>
      import.meta?.env?.VITE_API_BASE?.trim() ||
      "http://localhost:5000",
    []
  );

  const [form, setForm] = useState({
    full_name: "",
    profession: "",
    instagram: "",
    phone1: "",
    phone2: "",
    email1: "",
    email2: "",
    username: "",
    email_address: "",
    street: "",
    city: "",
    taluka: "",
    district: "",
    state: "",
    pincode: "",
    password: "",
    confirm_password: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState({
    sendOtp: false,
    verifyOtp: false,
    register: false,
  });

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message, duration = 4000) => {
    setToast({ type, title, message, duration });
    setTimeout(() => setToast(null), duration);
  };

  const closeToast = () => setToast(null);

  const normalizeEmail = (e) => String(e || "").trim().toLowerCase();
  const isValidEmail = (e) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());
  const isValidMobile = (m) => /^[0-9]{10}$/.test(String(m || "").trim());
  const isValidPincode = (p) => !p || /^[0-9]{6}$/.test(String(p || "").trim());

  const setOneError = (key, msg) => setErrors((p) => ({ ...p, [key]: msg }));

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone1" || name === "phone2") {
      const v = value.replace(/\D/g, "").slice(0, 10);
      setForm((p) => ({ ...p, [name]: v }));
      return;
    }
    if (name === "pincode") {
      const v = value.replace(/\D/g, "").slice(0, 6);
      setForm((p) => ({ ...p, pincode: v }));
      return;
    }
    if (name === "otp") {
      setOtp(value.replace(/\D/g, "").slice(0, 6));
      return;
    }

    if (name === "email_address" && !emailVerified) {
      setOtpSent(false);
      setOtp("");
      setVerifyToken("");
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

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

    if (!res.ok) {
      throw new Error(data?.message || text || `Request failed (HTTP ${res.status})`);
    }
    return data || {};
  }

  const validate = () => {
    const err = {};

    if (!form.full_name.trim()) err.full_name = "Full name required";
    
    const email = normalizeEmail(form.email_address || form.email1);
    if (!isValidEmail(email)) err.email_address = "Invalid email address";

    if (!form.password) err.password = "Password required";
    if (String(form.password || "").length < 6)
      err.password = "Password must be at least 6 characters";
    if (!form.confirm_password) err.confirm_password = "Confirm password required";
    if (form.password !== form.confirm_password) err.confirm_password = "Password not match";

    if (!emailVerified || !verifyToken)
      err.email_verify = "Please verify your email OTP first";

    setErrors(err);

    if (err.email_verify) {
      showToast("error", "Email Not Verified", "Please verify OTP before Register.");
    }

    return Object.keys(err).length === 0;
  };

  const sendOtp = async () => {
    setErrors({});

    const email = normalizeEmail(form.email_address || form.email1);
    if (!isValidEmail(email)) {
      setOneError("email_address", "Enter valid email before OTP");
      showToast("error", "Invalid Email", "Enter valid email and click Send OTP.");
      return;
    }

    try {
      setLoading((p) => ({ ...p, sendOtp: true }));
      
      const data = await apiPost("/api/personal-users/send-otp", { 
        email_address: email 
      });

      setOtpSent(true);
      setOtp("");
      setEmailVerified(false);
      setVerifyToken(data.verify_token || "");

      showToast(
        "success",
        "OTP Sent",
        "OTP has been sent to your email. Please enter OTP and verify."
      );
    } catch (err) {
      showToast("error", "OTP Send Failed", err.message);
    } finally {
      setLoading((p) => ({ ...p, sendOtp: false }));
    }
  };

  const verifyOtp = async () => {
    setErrors({});

    const email = normalizeEmail(form.email_address || form.email1);
    if (!isValidEmail(email)) {
      setOneError("email_address", "Invalid email");
      showToast("error", "Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (!/^[0-9]{6}$/.test(String(otp || ""))) {
      setOneError("email_verify", "OTP must be 6 digits");
      showToast("error", "Invalid OTP", "OTP must be 6 digits.");
      return;
    }

    try {
      setLoading((p) => ({ ...p, verifyOtp: true }));
      
      const data = await apiPost("/api/personal-users/verify-otp", { 
        email_address: email, 
        otp 
      });

      setEmailVerified(true);
      setVerifyToken(data.verify_token || "");

      showToast("success", "Verified", "Email verified successfully ✅");
    } catch (err) {
      setEmailVerified(false);
      setVerifyToken("");
      showToast("error", "OTP Verification Failed", err.message);
    } finally {
      setLoading((p) => ({ ...p, verifyOtp: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const email = normalizeEmail(form.email_address || form.email1);
    const username = form.username || email.split('@')[0];

    const payload = {
      full_name: form.full_name.trim(),
      profession: form.profession?.trim() || null,
      instagram: form.instagram?.trim() || null,
      phone1: String(form.phone1).trim() || null,
      phone2: String(form.phone2).trim() || null,
      email1: email || null,
      email2: form.email2?.trim() || null,
      username: username.toLowerCase(),
      email_address: email,
      password: form.password,
      street: form.street?.trim() || null,
      city: form.city?.trim() || null,
      taluka: form.taluka?.trim() || null,
      district: form.district?.trim() || null,
      state: form.state?.trim() || null,
      pincode: form.pincode?.trim() || null,
      verify_token: verifyToken,
    };

    try {
      setLoading((p) => ({ ...p, register: true }));
      
      const data = await apiPost("/api/personal-users/register", payload);

      showToast("success", "Registered", data?.message || "Account created successfully ✅");

      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (err) {
      showToast("error", "Register Failed", err.message);
    } finally {
      setLoading((p) => ({ ...p, register: false }));
    }
  };

  const emailLocked = emailVerified;
  const emailValue = form.email_address || form.email1;

  return (
    <div className="register-page">
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

      {/* Register Card */}
      <div className="register-wrapper">
        <div className="register-card glass-card">
          {/* Brand */}
          <div className="brand-section">
            <div className="brand-icon">
              <UserPlus size={28} color="#fff" />
            </div>
            <h1 className="brand-title">Create Account</h1>
            <p className="brand-subtitle">Join us • Secure • OTP Verified</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Personal Details */}
            <div className="form-row">
              <div className="form-group half">
                <label className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    className={`form-input ${errors.full_name ? "error" : ""}`}
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    disabled={loading.register}
                  />
                </div>
                {errors.full_name && <div className="error-text">{errors.full_name}</div>}
              </div>

              <div className="form-group half">
                <label className="form-label">Profession (Optional)</label>
                <div className="input-wrapper">
                  <Briefcase size={18} className="input-icon" />
                  <input
                    className="form-input"
                    name="profession"
                    value={form.profession}
                    onChange={handleChange}
                    placeholder="Your profession"
                    disabled={loading.register}
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="form-row">
              <div className="form-group half">
                <label className="form-label">
                  Mobile Number <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input
                    className={`form-input ${errors.phone1 ? "error" : ""}`}
                    name="phone1"
                    value={form.phone1}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    disabled={loading.register}
                  />
                </div>
                {errors.phone1 && <div className="error-text">{errors.phone1}</div>}
              </div>

              <div className="form-group half">
                <label className="form-label">Alternate Mobile (Optional)</label>
                <div className="input-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input
                    className="form-input"
                    name="phone2"
                    value={form.phone2}
                    onChange={handleChange}
                    placeholder="Alternate number"
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    disabled={loading.register}
                  />
                </div>
              </div>
            </div>

            {/* Email & OTP */}
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  className={`form-input ${errors.email_address ? "error" : ""} ${
                    emailLocked ? "locked" : ""
                  }`}
                  name="email_address"
                  value={emailValue}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  type="email"
                  readOnly={emailLocked}
                  disabled={loading.register}
                />
              </div>
              {errors.email_address && <div className="error-text">{errors.email_address}</div>}
              
              <div className="otp-actions">
                {!emailVerified ? (
                  <button
                    type="button"
                    className="otp-btn"
                    onClick={sendOtp}
                    disabled={loading.sendOtp}
                  >
                    {loading.sendOtp ? "Sending OTP..." : "Send Email OTP"}
                  </button>
                ) : (
                  <div className="verified-badge">✅ Email Verified</div>
                )}
              </div>
            </div>

            {/* OTP Verification */}
            {!emailVerified && otpSent && (
              <div className="otp-section">
                <div className="otp-header">
                  <span className="otp-title">Verify OTP</span>
                  <span className="otp-hint">Check your inbox/spam</span>
                </div>
                <div className="otp-row">
                  <input
                    className={`form-input ${errors.email_verify ? "error" : ""}`}
                    name="otp"
                    placeholder="Enter 6 digit OTP"
                    value={otp}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={6}
                    disabled={loading.register}
                  />
                  <button
                    type="button"
                    className="verify-btn"
                    onClick={verifyOtp}
                    disabled={loading.verifyOtp}
                  >
                    {loading.verifyOtp ? "Verifying..." : "Verify"}
                  </button>
                </div>
                {errors.email_verify && <div className="error-text center">{errors.email_verify}</div>}
                <button 
                  type="button" 
                  className="resend-link" 
                  onClick={sendOtp} 
                  disabled={loading.sendOtp}
                >
                  {loading.sendOtp ? "Resending..." : "Resend OTP"}
                </button>
              </div>
            )}

            {/* Address Details */}
            <div className="form-row">
              <div className="form-group half">
                <label className="form-label">City (Optional)</label>
                <div className="input-wrapper">
                  <MapPin size={18} className="input-icon" />
                  <input
                    className="form-input"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    disabled={loading.register}
                  />
                </div>
              </div>

              <div className="form-group half">
                <label className="form-label">State (Optional)</label>
                <div className="input-wrapper">
                  <MapPin size={18} className="input-icon" />
                  <input
                    className="form-input"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                    disabled={loading.register}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label className="form-label">District (Optional)</label>
                <input
                  className="form-input"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="District"
                  disabled={loading.register}
                />
              </div>

              <div className="form-group half">
                <label className="form-label">Taluka (Optional)</label>
                <input
                  className="form-input"
                  name="taluka"
                  value={form.taluka}
                  onChange={handleChange}
                  placeholder="Taluka"
                  disabled={loading.register}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label className="form-label">Street (Optional)</label>
                <input
                  className="form-input"
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="Street address"
                  disabled={loading.register}
                />
              </div>

              <div className="form-group half">
                <label className="form-label">Pincode (Optional)</label>
                <input
                  className={`form-input ${errors.pincode ? "error" : ""}`}
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="6 digit pincode"
                  type="tel"
                  maxLength={6}
                  inputMode="numeric"
                  disabled={loading.register}
                />
                {errors.pincode && <div className="error-text">{errors.pincode}</div>}
              </div>
            </div>

            {/* Password Fields */}
            <div className="form-row">
              <div className="form-group half">
                <label className="form-label">
                  Password <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    className={`form-input ${errors.password ? "error" : ""}`}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    disabled={loading.register}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <div className="error-text">{errors.password}</div>}
              </div>

              <div className="form-group half">
                <label className="form-label">
                  Confirm Password <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    className={`form-input ${errors.confirm_password ? "error" : ""}`}
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    disabled={loading.register}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirm_password && <div className="error-text">{errors.confirm_password}</div>}
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn" disabled={loading.register}>
              {loading.register ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="auth-links">
              <span>Already have an account?</span>
              <Link className="auth-link" to="/login">
                Sign In
              </Link>
            </div>

            {/* Footer */}
            <div className="footer-note">
              🔒 Secured with industry standard encryption
            </div>
          </form>
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
     MODERN REGISTER PAGE CSS
     ============================================ */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .register-page {
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
  .register-wrapper {
    width: 100%;
    max-width: 600px;
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
  .register-card {
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

  .register-card:hover {
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
    font-size: 24px;
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
     FORM ELEMENTS
     ============================================ */
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .form-group {
    margin-bottom: 14px;
  }

  .form-group.half {
    margin-bottom: 0;
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
  .otp-actions {
    margin-top: 8px;
  }

  .otp-btn {
    width: 100%;
    padding: 10px 14px;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.6), rgba(236, 72, 153, 0.6));
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .otp-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(124, 58, 237, 0.2);
  }

  .otp-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .verified-badge {
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid rgba(34, 197, 94, 0.2);
    background: rgba(34, 197, 94, 0.08);
    color: #6EE7B7;
    font-weight: 600;
    text-align: center;
    font-size: 13px;
  }

  .otp-section {
    margin: 14px 0;
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

  .otp-row .form-input {
    padding: 10px 16px;
    font-size: 14px;
    text-align: center;
    letter-spacing: 4px;
  }

  .verify-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #7C3AED, #4F6BFF);
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .verify-btn:hover:not(:disabled) {
    transform: translateY(-1px);
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
    .register-page {
      padding: 16px;
    }

    .register-card {
      padding: 24px 20px 20px;
      border-radius: 24px;
    }

    .register-wrapper {
      max-width: 100%;
      gap: 14px;
    }

    .form-row {
      grid-template-columns: 1fr;
      gap: 0;
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
    .register-card {
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

    .register-wrapper {
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

// Missing imports - add these at the top
const Briefcase = () => null; // Placeholder for missing icon