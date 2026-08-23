import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Battery,
  Bell,
  Calendar,
  Camera,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Info,
  Lock,
  MapPin,
  MessageSquare,
  Mic,
  MonitorUp,
  Phone,
  Play,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Smartphone,
  Square,
  Upload,
  Users,
  Video,
  Volume2,
  X,
  XCircle,
} from "lucide-react";

/* ================================================================
   BRIDGE HELPERS
   Matches the current MainActivity.kt bridge:
   AndroidPermissions.checkPermission(permission)
   AndroidPermissions.requestPermission(permission, callbackName)
   AndroidPermissions.openSettings()
   AndroidPermissions.startCameraService()
   AndroidPermissions.stopCameraService()
   AndroidPermissions.startMicrophoneService()
   AndroidPermissions.stopMicrophoneService()
   AndroidPermissions.readContacts(callbackName)
   AndroidPermissions.startScreenShare(callbackName)
   AndroidPermissions.stopScreenShare()
================================================================ */

const isAndroidWebView = () =>
  typeof window !== "undefined" &&
  window.AndroidPermissions &&
  typeof window.AndroidPermissions.checkPermission === "function";

const hasAndroidMethod = (name) =>
  isAndroidWebView() &&
  typeof window.AndroidPermissions[name] === "function";

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const callAndroidCallback = (method, ...args) => {
  return new Promise((resolve) => {
    if (!hasAndroidMethod(method)) {
      resolve(null);
      return;
    }

    const callbackName = `__am_${method}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    const timer = window.setTimeout(() => {
      delete window[callbackName];
      resolve(null);
    }, 30000);

    window[callbackName] = (result) => {
      window.clearTimeout(timer);
      delete window[callbackName];
      resolve(result);
    };

    try {
      window.AndroidPermissions[method](...args, callbackName);
    } catch (error) {
      window.clearTimeout(timer);
      delete window[callbackName];
      console.error(`${method} failed`, error);
      resolve(null);
    }
  });
};

const requestNativePermission = (permission) => {
  if (!hasAndroidMethod("requestPermission")) return Promise.resolve("unsupported");
  return callAndroidCallback("requestPermission", permission);
};

const checkNativePermission = (permission) => {
  if (!hasAndroidMethod("checkPermission")) return "unsupported";
  try {
    return window.AndroidPermissions.checkPermission(permission) || "denied";
  } catch {
    return "denied";
  }
};

const openNativeSettings = () => {
  if (hasAndroidMethod("openSettings")) {
    try {
      window.AndroidPermissions.openSettings();
      return true;
    } catch (error) {
      console.error(error);
    }
  }
  return false;
};

const serviceCall = (name) => {
  if (!hasAndroidMethod(name)) return false;
  try {
    window.AndroidPermissions[name]();
    return true;
  } catch (error) {
    console.error(`${name} failed`, error);
    return false;
  }
};

const browserPermissionName = {
  camera: "camera",
  microphone: "microphone",
  location: "geolocation",
  notifications: "notifications",
  screen: "display-capture",
};

const PERMISSIONS = [
  {
    id: "gallery",
    group: "media",
    label: "Gallery / Storage",
    description: "Select images, videos, and files from the Android picker.",
    icon: ImageIcon,
    android: "android.permission.READ_MEDIA_IMAGES",
  },
  {
    id: "camera",
    group: "media",
    label: "Camera",
    description: "Use the camera for live preview, photos, and video recording.",
    icon: Camera,
    android: "android.permission.CAMERA",
    web: "camera",
  },
  {
    id: "microphone",
    group: "media",
    label: "Microphone / Recorder",
    description: "Record voice or microphone audio.",
    icon: Mic,
    android: "android.permission.RECORD_AUDIO",
    web: "microphone",
  },
  {
    id: "video",
    group: "media",
    label: "Video Capture",
    description: "Use the camera for video capture.",
    icon: Video,
    android: "android.permission.CAMERA",
    web: "camera",
  },
  {
    id: "contacts",
    group: "communication",
    label: "Contacts",
    description: "Read contact names and phone numbers from the device.",
    icon: Users,
    android: "android.permission.READ_CONTACTS",
  },
  {
    id: "phone",
    group: "communication",
    label: "Phone & Call Log",
    description: "Read basic phone state and call log data when permitted.",
    icon: Phone,
    android: "android.permission.READ_PHONE_STATE",
  },
  {
    id: "sms",
    group: "communication",
    label: "SMS Messages",
    description: "Read SMS messages when the Android app is allowed to do so.",
    icon: MessageSquare,
    android: "android.permission.READ_SMS",
  },
  {
    id: "calendar",
    group: "communication",
    label: "Calendar",
    description: "Read calendar events on the Android device.",
    icon: Calendar,
    android: "android.permission.READ_CALENDAR",
  },
  {
    id: "location",
    group: "location",
    label: "Location",
    description: "Get the device GPS location.",
    icon: MapPin,
    android: "android.permission.ACCESS_FINE_LOCATION",
    web: "geolocation",
  },
  {
    id: "notifications",
    group: "system",
    label: "Notifications",
    description: "Allow notifications from the app.",
    icon: Bell,
    android: "android.permission.POST_NOTIFICATIONS",
    web: "notifications",
  },
  {
    id: "background",
    group: "system",
    label: "Background Activity",
    description: "Run supported foreground-service activity while the app is not visible.",
    icon: Volume2,
    android: "android.permission.WAKE_LOCK",
  },
  {
    id: "battery",
    group: "system",
    label: "Battery Optimization",
    description: "Open Android battery settings for the app.",
    icon: Battery,
    android: "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
  },
];

const GROUPS = [
  { id: "media", label: "Media & Recording", icon: FolderOpen },
  { id: "communication", label: "Communication & Contacts", icon: Users },
  { id: "location", label: "Location", icon: MapPin },
  { id: "system", label: "System & Background", icon: Settings },
];

const GROUP_MAP = Object.fromEntries(GROUPS.map((group) => [group.id, group]));

const extForMime = (mime) => {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

export default function AccessMob() {
  const [permissions, setPermissions] = useState({});
  const [expanded, setExpanded] = useState({
    media: true,
    communication: true,
    location: true,
    system: true,
  });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [serviceState, setServiceState] = useState({
    camera: false,
    microphone: false,
    screen: false,
  });
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [cameraMode, setCameraMode] = useState("photo");
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [micRecording, setMicRecording] = useState(false);
  const [screenRecording, setScreenRecording] = useState(false);
  const [mediaStatus, setMediaStatus] = useState("Idle");

  const videoRef = useRef(null);
  const previewStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const screenStreamRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const screenChunksRef = useRef([]);
  const galleryInputRef = useRef(null);

  const androidMode = isAndroidWebView();

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        String(c.name || "").toLowerCase().includes(q) ||
        String(c.number || "").toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }, []);

  const checkPermission = useCallback(async (perm) => {
    if (androidMode && perm.android) {
      return checkNativePermission(perm.android);
    }

    if (perm.web && navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: perm.web });
        return result.state || "prompt";
      } catch {
        if (perm.id === "notifications" && "Notification" in window) {
          return Notification.permission;
        }
      }
    }

    if (!androidMode && !perm.web) return "unsupported";
    return "prompt";
  }, [androidMode]);

  const checkAllPermissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = {};
      for (const perm of PERMISSIONS) {
        result[perm.id] = await checkPermission(perm);
      }
      setPermissions(result);
    } catch (err) {
      console.error(err);
      setError("Unable to check device permissions.");
    } finally {
      setLoading(false);
    }
  }, [checkPermission]);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  useEffect(() => {
    const refresh = () => checkAllPermissions();
    window.addEventListener("focus", refresh);
    window.addEventListener("android-permission-refresh", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("android-permission-refresh", refresh);
    };
  }, [checkAllPermissions]);

  useEffect(() => {
    return () => {
      stopCameraPreview();
      stopBrowserMicRecording();
      stopBrowserScreenRecording();
    };
  }, []);

  const updatePermission = async (permId, status) => {
    setPermissions((prev) => ({ ...prev, [permId]: status }));
  };

  const requestPermission = async (perm) => {
    setRequesting(perm.id);
    setError("");
    try {
      if (androidMode && perm.android) {
        const result = await requestNativePermission(perm.android);
        const next = result === "granted" ? "granted" : "denied";
        await updatePermission(perm.id, next);
        showToast(
          next === "granted"
            ? `${perm.label} granted.`
            : `${perm.label} was denied.`
        );
        return;
      }

      if (perm.id === "camera" || perm.id === "video") {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera is not supported in this browser.");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        await updatePermission(perm.id, "granted");
        showToast("Camera permission granted.");
        return;
      }

      if (perm.id === "microphone") {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone is not supported in this browser.");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        await updatePermission(perm.id, "granted");
        showToast("Microphone permission granted.");
        return;
      }

      if (perm.id === "location") {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        await updatePermission(perm.id, "granted");
        showToast("Location permission granted.");
        return;
      }

      if (perm.id === "notifications" && "Notification" in window) {
        const result = await Notification.requestPermission();
        await updatePermission(perm.id, result);
        showToast(`Notifications: ${result}.`);
        return;
      }

      await updatePermission(perm.id, "unsupported");
      showToast(`${perm.label} requires Android native access.`);
    } catch (err) {
      console.error(err);
      await updatePermission(perm.id, "denied");
      setError(err?.message || `${perm.label} permission was denied.`);
    } finally {
      setRequesting(null);
    }
  };

  const requestAll = async () => {
    setError("");
    for (const perm of PERMISSIONS) {
      const status = permissions[perm.id];
      if (status !== "granted" && status !== "unsupported") {
        await requestPermission(perm);
      }
    }
  };

  const toggleGroup = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const statusMeta = (status) => {
    if (status === "granted") return { label: "Granted", Icon: CheckCircle, className: "granted" };
    if (status === "denied") return { label: "Denied", Icon: XCircle, className: "denied" };
    if (status === "unsupported") return { label: "Unsupported", Icon: AlertCircle, className: "unsupported" };
    return { label: "Not Set", Icon: AlertCircle, className: "prompt" };
  };

  const groupSummary = (groupId) => {
    const rows = PERMISSIONS.filter((p) => p.group === groupId);
    const granted = rows.filter((p) => permissions[p.id] === "granted").length;
    return `${granted}/${rows.length} granted`;
  };

  const openGallery = () => galleryInputRef.current?.click();

  const onGalleryChange = (event) => {
    const files = Array.from(event.target.files || []);
    const next = files.map((file) => ({
      id: `${file.name}_${file.size}_${file.lastModified}_${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));
    setSelectedFiles(next);
    if (files.length) showToast(`${files.length} file(s) selected.`);
    event.target.value = "";
  };

  const removeFile = (id) => {
    setSelectedFiles((current) => {
      const item = current.find((x) => x.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return current.filter((x) => x.id !== id);
    });
  };

  const loadContacts = async () => {
    setError("");
    if (!androidMode || !hasAndroidMethod("readContacts")) {
      setError("Contacts are available in the Android app only.");
      return;
    }

    const permission = checkNativePermission("android.permission.READ_CONTACTS");
    if (permission !== "granted") {
      const status = await requestNativePermission("android.permission.READ_CONTACTS");
      if (status !== "granted") {
        setError("Contacts permission is required.");
        return;
      }
    }

    const raw = await callAndroidCallback("readContacts");
    const parsed = Array.isArray(safeJsonParse(raw, null)) ? safeJsonParse(raw, []) : [];
    setContacts(parsed);
    showToast(`${parsed.length} contacts loaded.`);
  };

  const startCameraPreview = async () => {
    try {
      stopCameraPreview();
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera preview is not supported here.");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
        audio: cameraMode === "video",
      });
      previewStreamRef.current = stream;
      setCameraOpen(true);
      setMediaStatus(cameraMode === "video" ? "Video preview active" : "Camera preview active");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setError(err?.message || "Unable to start camera.");
    }
  };

  const stopCameraPreview = () => {
    if (recorderRef.current?.state === "recording") {
      try { recorderRef.current.stop(); } catch {}
    }
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
    setMediaStatus("Idle");
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Start the camera preview first.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `photo_${Date.now()}.jpg`);
        showToast("Photo captured.");
      }
    }, "image/jpeg", 0.92);
  };

  const startVideoRecording = () => {
    const stream = previewStreamRef.current;
    if (!stream) {
      setError("Start the camera preview first.");
      return;
    }
    try {
      recordedChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorder.ondataavailable = (event) => {
        if (event.data?.size) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        downloadBlob(blob, `video_${Date.now()}.${extForMime(mime)}`);
        setMediaStatus("Video saved");
      };
      recorderRef.current = recorder;
      recorder.start();
      setMediaStatus("Video recording...");
      showToast("Video recording started.");
    } catch (err) {
      setError(err?.message || "Unable to record video.");
    }
  };

  const stopVideoRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      showToast("Video recording stopped.");
    }
  };

  const startBrowserMicRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone recording is not supported here.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorder.ondataavailable = (event) => {
        if (event.data?.size) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        downloadBlob(blob, `voice_${Date.now()}.${extForMime(mime)}`);
        stream.getTracks().forEach((track) => track.stop());
        setMicRecording(false);
        setMediaStatus("Voice saved");
      };
      recorderRef.current = recorder;
      recorder.start();
      setMicRecording(true);
      setMediaStatus("Voice recording...");
      showToast("Voice recording started.");
    } catch (err) {
      setError(err?.message || "Unable to start microphone recording.");
    }
  };

  const stopBrowserMicRecording = () => {
    if (recorderRef.current?.state === "recording") {
      try { recorderRef.current.stop(); } catch {}
    }
    setMicRecording(false);
  };

  const startNativeCamera = () => {
    if (serviceCall("startCameraService")) {
      setServiceState((s) => ({ ...s, camera: true }));
      showToast("Background camera service started.");
      setMediaStatus("Background camera active");
    } else {
      setError("Native background camera service is unavailable.");
    }
  };

  const stopNativeCamera = () => {
    if (serviceCall("stopCameraService")) {
      setServiceState((s) => ({ ...s, camera: false }));
      showToast("Background camera stopped.");
      setMediaStatus("Idle");
    }
  };

  const startNativeMic = () => {
    if (serviceCall("startMicrophoneService")) {
      setServiceState((s) => ({ ...s, microphone: true }));
      showToast("Background microphone service started.");
      setMediaStatus("Background microphone active");
    } else {
      setError("Native background microphone service is unavailable.");
    }
  };

  const stopNativeMic = () => {
    if (serviceCall("stopMicrophoneService")) {
      setServiceState((s) => ({ ...s, microphone: false }));
      showToast("Background microphone stopped.");
      setMediaStatus("Idle");
    }
  };

  const startScreenShare = async () => {
    setError("");
    if (androidMode && hasAndroidMethod("startScreenShare")) {
      const result = await callAndroidCallback("startScreenShare");
      if (result === "granted") {
        setServiceState((s) => ({ ...s, screen: true }));
        setScreenRecording(true);
        showToast("Screen capture started.");
        setMediaStatus("Android screen capture active");
      } else {
        setError("Screen capture permission was denied.");
      }
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("Screen sharing is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStreamRef.current = stream;
      screenChunksRef.current = [];

      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorder.ondataavailable = (event) => {
        if (event.data?.size) screenChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(screenChunksRef.current, { type: mime });
        downloadBlob(blob, `screen_${Date.now()}.webm`);
        stream.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        setScreenRecording(false);
        setMediaStatus("Screen recording saved");
      };
      recorder.start();
      screenRecorderRef.current = recorder;
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        if (screenRecorderRef.current?.state === "recording") screenRecorderRef.current.stop();
      });
      setScreenRecording(true);
      showToast("Screen recording started.");
      setMediaStatus("Screen recording...");
    } catch (err) {
      setError(err?.message || "Unable to start screen recording.");
    }
  };

  const stopBrowserScreenRecording = () => {
    if (screenRecorderRef.current?.state === "recording") {
      try { screenRecorderRef.current.stop(); } catch {}
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenRecording(false);
  };

  const stopScreenShare = () => {
    if (androidMode && hasAndroidMethod("stopScreenShare")) {
      serviceCall("stopScreenShare");
      setServiceState((s) => ({ ...s, screen: false }));
      setScreenRecording(false);
      setMediaStatus("Idle");
      showToast("Screen capture stopped.");
      return;
    }
    stopBrowserScreenRecording();
  };

  const useSystemGallery = androidMode || typeof navigator !== "undefined";

  return (
    <>
      <style>{styles}</style>
      <main className="am-page">
        <div className="am-shell">
          <header className="am-header">
            <div>
              <div className="am-eyebrow"><Shield size={14} /> DEVICE ACCESS</div>
              <h1>Permissions & Device Manager</h1>
              <p>Manage camera, microphone, gallery, contacts, screen sharing and background services.</p>
            </div>
            <button className="am-refresh" onClick={checkAllPermissions} disabled={loading} type="button">
              <RefreshCw size={15} className={loading ? "am-spin" : ""} /> Refresh
            </button>
          </header>

          <section className="am-device">
            <Smartphone size={21} />
            <div className="am-device-main">
              <strong>{androidMode ? "Android WebView App" : "Web Browser"}</strong>
              <span>{androidMode ? "Native Android bridge connected" : "Browser permission mode"}</span>
            </div>
            <div className={`am-mode ${androidMode ? "native" : "web"}`}>
              {androidMode ? "APP MODE" : "WEB MODE"}
            </div>
          </section>

          {error && (
            <div className="am-error">
              <AlertCircle size={17} />
              <span>{error}</span>
              <button type="button" onClick={() => setError("")}><X size={14} /></button>
            </div>
          )}

          <section className="am-summary">
            <div><b>{Object.values(permissions).filter((x) => x === "granted").length}</b><span>Granted</span></div>
            <div><b>{Object.values(permissions).filter((x) => x === "denied").length}</b><span>Denied</span></div>
            <div><b>{Object.values(permissions).filter((x) => x === "unsupported").length}</b><span>Unsupported</span></div>
            <div><b>{PERMISSIONS.length}</b><span>Total</span></div>
          </section>

          <section className="am-master-actions">
            <button type="button" className="primary" onClick={requestAll} disabled={loading}>
              <Shield size={16} /> Request Available Permissions
            </button>
            <button type="button" className="secondary" onClick={() => openNativeSettings()}>
              <Settings size={16} /> Android App Settings
            </button>
          </section>

          {loading ? (
            <section className="am-loading">
              <div className="am-spinner" />
              <b>Checking device access...</b>
              <span>Please wait.</span>
            </section>
          ) : (
            <>
              {GROUPS.map((group) => {
                const rows = PERMISSIONS.filter((p) => p.group === group.id);
                const Icon = group.icon;
                const open = expanded[group.id];
                return (
                  <section className="am-group" key={group.id}>
                    <button className="am-group-head" type="button" onClick={() => toggleGroup(group.id)}>
                      <span className="am-group-left">
                        <span className="am-group-icon"><Icon size={18} /></span>
                        <span><b>{group.label}</b><small>{groupSummary(group.id)}</small></span>
                      </span>
                      <span className="am-group-right"><span>{open ? "Collapse" : "Expand"}</span>{open ? <ChevronDown size={17} /> : <ChevronDown size={17} className="rotated" />}</span>
                    </button>

                    {open && (
                      <div className="am-perms">
                        {rows.map((perm) => {
                          const status = permissions[perm.id] || "prompt";
                          const { label, Icon: StatusIcon, className } = statusMeta(status);
                          const PermIcon = perm.icon;
                          const waiting = requesting === perm.id;
                          return (
                            <article className={`am-perm ${className}`} key={perm.id}>
                              <div className="am-perm-icon"><PermIcon size={19} /></div>
                              <div className="am-perm-info">
                                <div className="am-perm-title"><b>{perm.label}</b><span className={className}><StatusIcon size={13} /> {label}</span></div>
                                <p>{perm.description}</p>
                                {perm.android && <small className="am-perm-code">{perm.android}</small>}
                              </div>
                              <div className="am-perm-actions">
                                {status === "granted" ? (
                                  <button type="button" className="state-btn granted" disabled><CheckCircle size={14} /> Granted</button>
                                ) : status === "unsupported" ? (
                                  <button type="button" className="state-btn unsupported" disabled><AlertCircle size={14} /> Unsupported</button>
                                ) : (
                                  <button type="button" className="state-btn request" onClick={() => requestPermission(perm)} disabled={waiting}>
                                    {waiting ? <span className="tiny-spin" /> : <Lock size={14} />}
                                    {waiting ? "Requesting..." : "Allow"}
                                  </button>
                                )}
                                <button type="button" className="icon-btn" onClick={() => openNativeSettings()} title="Open settings"><Settings size={14} /></button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}

              <section className="am-card">
                <div className="am-card-head">
                  <div><h2>Camera & Video</h2><p>Foreground browser preview + Android background camera service.</p></div>
                  <Camera size={18} />
                </div>
                <div className="am-toolbar">
                  <select value={cameraMode} onChange={(e) => setCameraMode(e.target.value)}>
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                  </select>
                  <select value={cameraFacing} onChange={(e) => setCameraFacing(e.target.value)}>
                    <option value="environment">Rear Camera</option>
                    <option value="user">Front Camera</option>
                  </select>
                  <button className="secondary" type="button" onClick={startCameraPreview}><Play size={14} /> Start Preview</button>
                  <button className="danger" type="button" onClick={stopCameraPreview}><Square size={14} /> Stop Preview</button>
                </div>

                <div className="am-preview-wrap">
                  {cameraOpen ? <video ref={videoRef} className="am-video" autoPlay muted playsInline /> : <div className="am-preview-empty"><Camera size={25} /><span>Camera preview is stopped</span></div>}
                </div>

                <div className="am-toolbar">
                  {cameraMode === "photo" ? (
                    <button className="primary" type="button" onClick={capturePhoto}><Camera size={14} /> Capture Photo</button>
                  ) : (
                    <>
                      <button className="primary" type="button" onClick={startVideoRecording} disabled={!cameraOpen || recorderRef.current?.state === "recording"}><Video size={14} /> Record Video</button>
                      <button className="danger" type="button" onClick={stopVideoRecording}><Square size={14} /> Stop Video</button>
                    </>
                  )}
                  <button className={serviceState.camera ? "danger" : "secondary"} type="button" onClick={serviceState.camera ? stopNativeCamera : startNativeCamera} disabled={!androidMode}>
                    {serviceState.camera ? <Square size={14} /> : <MonitorUp size={14} />}
                    {serviceState.camera ? "Stop Background Camera" : "Start Background Camera"}
                  </button>
                </div>
              </section>

              <section className="am-card">
                <div className="am-card-head">
                  <div><h2>Voice & Microphone</h2><p>Record voice in the browser or keep the Android microphone service active.</p></div>
                  <Mic size={18} />
                </div>
                <div className="am-toolbar">
                  {!micRecording ? (
                    <button className="primary" type="button" onClick={startBrowserMicRecording}><Mic size={14} /> Record Voice</button>
                  ) : (
                    <button className="danger" type="button" onClick={stopBrowserMicRecording}><Square size={14} /> Stop & Save Voice</button>
                  )}
                  <button className={serviceState.microphone ? "danger" : "secondary"} type="button" onClick={serviceState.microphone ? stopNativeMic : startNativeMic} disabled={!androidMode}>
                    {serviceState.microphone ? <Square size={14} /> : <Volume2 size={14} />}
                    {serviceState.microphone ? "Stop Background Mic" : "Start Background Mic"}
                  </button>
                </div>
                <div className={`am-live ${micRecording || serviceState.microphone ? "active" : ""}`}>
                  <span className="pulse-dot" /> {micRecording ? "Voice recording" : serviceState.microphone ? "Android microphone service active" : "Microphone idle"}
                </div>
              </section>

              <section className="am-card">
                <div className="am-card-head">
                  <div><h2>Gallery & Files</h2><p>Select images, videos, documents and other files with the system picker.</p></div>
                  <FolderOpen size={18} />
                </div>
                <input ref={galleryInputRef} className="hidden-input" type="file" accept="image/*,video/*,.pdf,.txt,.csv,.doc,.docx,.xlsx,.zip" multiple onChange={onGalleryChange} />
                <div className="am-toolbar">
                  <button className="primary" type="button" onClick={openGallery}><Upload size={14} /> Open Gallery / Files</button>
                  <button className="secondary" type="button" onClick={() => setSelectedFiles([])}><X size={14} /> Clear Selection</button>
                </div>
                <div className="file-list">
                  {selectedFiles.length ? selectedFiles.map((item) => (
                    <div className="file-row" key={item.id}>
                      {item.preview ? <img src={item.preview} alt="" /> : <span className="file-icon"><FileText size={17} /></span>}
                      <div><b>{item.name}</b><small>{item.type || "file"} • {(item.size / 1024).toFixed(1)} KB</small></div>
                      <button type="button" className="icon-btn" onClick={() => removeFile(item.id)}><X size={14} /></button>
                    </div>
                  )) : <div className="empty-inline"><FolderOpen size={18} /> No files selected.</div>}
                </div>
                {!useSystemGallery && null}
              </section>

              <section className="am-card">
                <div className="am-card-head">
                  <div><h2>Contacts</h2><p>Read contacts from Android and search by name or number.</p></div>
                  <Users size={18} />
                </div>
                <div className="am-toolbar">
                  <button className="primary" type="button" onClick={loadContacts} disabled={!androidMode}><Users size={14} /> Load Contacts</button>
                  <div className="search-box"><Search size={14} /><input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Search contacts" /></div>
                </div>
                <div className="contact-list">
                  {filteredContacts.length ? filteredContacts.map((contact) => (
                    <div className="contact-row" key={`${contact.id}_${contact.number}`}>
                      <div className="contact-avatar">{String(contact.name || "?").trim().charAt(0).toUpperCase() || "?"}</div>
                      <div><b>{contact.name || "Unknown contact"}</b><small>{contact.number || "No number"}</small></div>
                    </div>
                  )) : <div className="empty-inline"><Users size={18} /> {contacts.length ? "No matching contacts." : "No contacts loaded."}</div>}
                </div>
              </section>

              <section className="am-card">
                <div className="am-card-head">
                  <div><h2>Screen Share / Screen Recording</h2><p>Android uses the system capture prompt; web mode can record the captured display.</p></div>
                  <MonitorUp size={18} />
                </div>
                <div className="am-toolbar">
                  {!screenRecording ? (
                    <button className="primary" type="button" onClick={startScreenShare}><MonitorUp size={14} /> Start Screen Share / Record</button>
                  ) : (
                    <button className="danger" type="button" onClick={stopScreenShare}><Square size={14} /> Stop Screen Capture</button>
                  )}
                </div>
                <div className={`am-live ${screenRecording || serviceState.screen ? "active" : ""}`}>
                  <span className="pulse-dot" /> {screenRecording || serviceState.screen ? "Screen capture active" : "Screen capture idle"}
                </div>
              </section>

              <section className="am-card status-card">
                <div className="am-card-head"><div><h2>Current Activity</h2><p>{mediaStatus}</p></div><Clock size={18} /></div>
                <div className="activity-grid">
                  <span className={serviceState.camera ? "on" : "off"}><Camera size={14} /> Background Camera</span>
                  <span className={serviceState.microphone ? "on" : "off"}><Mic size={14} /> Background Mic</span>
                  <span className={serviceState.screen ? "on" : "off"}><MonitorUp size={14} /> Screen Share</span>
                  <span className={cameraOpen ? "on" : "off"}><Video size={14} /> Camera Preview</span>
                  <span className={micRecording ? "on" : "off"}><Volume2 size={14} /> Voice Recording</span>
                  <span className={selectedFiles.length ? "on" : "off"}><ImageIcon size={14} /> Gallery Selection</span>
                </div>
              </section>

              <section className="am-info">
                <Info size={18} />
                <div><b>About device access</b><span>Android permissions are controlled by the native app. Browser camera/microphone/screen APIs are used when native bridge access is unavailable.</span></div>
                {androidMode && <button type="button" className="secondary" onClick={openNativeSettings}><Settings size={14} /> Open Android Settings</button>}
              </section>
            </>
          )}
        </div>
      </main>

      {toast && <div className="am-toast"><CheckCircle size={16} />{toast}</div>}
    </>
  );
}

const styles = `
*{box-sizing:border-box}
.am-page{min-height:100vh;padding:14px;background:linear-gradient(135deg,#f5f7fb,#eaf0f8);color:#172033;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-x:hidden}
.am-shell{width:min(1160px,100%);margin:auto}
.am-header{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px 22px;border-radius:20px;background:linear-gradient(135deg,#111827,#312e81 55%,#2563eb);color:#fff;box-shadow:0 18px 55px rgba(30,41,59,.18)}
.am-eyebrow{display:flex;align-items:center;gap:7px;color:#c7d2fe;font-size:9px;letter-spacing:.15em;font-weight:900}.am-header h1{margin:7px 0 4px;font-size:27px;font-weight:950}.am-header p{margin:0;color:#dbeafe;font-size:10px;line-height:1.45}.am-refresh{display:flex;align-items:center;gap:7px;border:1px solid #ffffff35;background:#ffffff14;color:#fff;border-radius:10px;padding:10px 13px;font-size:9px;font-weight:900;cursor:pointer}.am-refresh:disabled{opacity:.55;cursor:not-allowed}.am-spin{animation:amSpin .8s linear infinite}@keyframes amSpin{to{transform:rotate(360deg)}}
.am-device{margin-top:10px;display:flex;align-items:center;gap:11px;padding:13px 15px;background:#fff;border:1.5px solid #cbd5e1;border-radius:14px;box-shadow:0 8px 25px rgba(15,23,42,.06)}.am-device-main{flex:1}.am-device-main strong{display:block;font-size:12px;font-weight:950}.am-device-main span{display:block;margin-top:2px;color:#64748b;font-size:9px}.am-mode{padding:5px 10px;border-radius:20px;font-size:8px;font-weight:950}.am-mode.native{background:#dcfce7;color:#166534}.am-mode.web{background:#dbeafe;color:#1d4ed8}
.am-error{margin-top:10px;padding:11px 13px;display:flex;align-items:center;gap:8px;background:#fff1f2;color:#9f1239;border:1px solid #fecdd3;border-radius:12px;font-size:9px}.am-error span{flex:1}.am-error button{width:26px;height:26px;border:0;border-radius:7px;background:#ffe4e6;color:#be123c;display:grid;place-items:center;cursor:pointer}
.am-summary{margin-top:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.am-summary div{padding:13px;border:1.5px solid #cbd5e1;border-radius:13px;background:#fff;box-shadow:0 7px 20px rgba(15,23,42,.05)}.am-summary b{display:block;font-size:22px;font-weight:950}.am-summary span{display:block;margin-top:2px;color:#64748b;font-size:8px;text-transform:uppercase;font-weight:900;letter-spacing:.08em}
.am-master-actions{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}.primary,.secondary,.danger{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 12px;border-radius:9px;font-size:9px;font-weight:900;cursor:pointer;border:1.5px solid transparent}.primary{background:#2563eb;color:#fff}.primary:disabled{opacity:.6;cursor:not-allowed}.secondary{background:#f8fafc;color:#172033;border-color:#cbd5e1}.danger{background:#fee2e2;color:#991b1b;border-color:#fecaca}.am-loading{margin-top:10px;min-height:260px;border:1px solid #e2e8f0;border-radius:15px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px}.am-loading span{font-size:9px;color:#94a3b8}.am-spinner{width:32px;height:32px;border:4px solid #e2e8f0;border-top-color:#4f46e5;border-radius:50%;animation:amSpin .8s linear infinite}
.am-group{margin-top:10px;background:#fff;border:1.5px solid #cbd5e1;border-radius:15px;overflow:hidden;box-shadow:0 7px 25px rgba(15,23,42,.05)}.am-group-head{width:100%;border:0;background:#fff;padding:13px 14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer}.am-group-left{display:flex;align-items:center;gap:10px;text-align:left}.am-group-icon{width:34px;height:34px;border-radius:9px;background:#eef2ff;color:#4338ca;display:grid;place-items:center}.am-group-left b{display:block;font-size:11px;font-weight:950}.am-group-left small{display:block;color:#64748b;font-size:8px;margin-top:2px}.am-group-right{display:flex;align-items:center;gap:5px;color:#64748b;font-size:8px;font-weight:800}.rotated{transform:rotate(-90deg)}
.am-perm{padding:11px 13px;display:flex;align-items:center;gap:11px;border-top:1px solid #eef2f7}.am-perm-icon{width:38px;height:38px;display:grid;place-items:center;background:#f1f5f9;border-radius:9px;color:#334155;flex:0 0 auto}.am-perm-info{flex:1;min-width:0}.am-perm-title{display:flex;justify-content:space-between;align-items:center;gap:7px}.am-perm-title>b{font-size:10px;font-weight:950}.am-perm-title>span{display:inline-flex;align-items:center;gap:4px;font-size:8px;font-weight:900;flex:0 0 auto}.granted{color:#15803d}.denied{color:#dc2626}.prompt{color:#d97706}.unsupported{color:#64748b}.am-perm-info p{margin:3px 0 0;color:#64748b;font-size:8px;line-height:1.45}.am-perm-code{display:block;margin-top:4px;color:#94a3b8;font-size:7px;font-family:ui-monospace,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.am-perm-actions{display:flex;align-items:center;gap:5px;flex:0 0 auto}.state-btn,.icon-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;border-radius:8px;font-size:8px;font-weight:900}.state-btn{padding:7px 9px;border:0}.state-btn.granted{background:#dcfce7;color:#166534}.state-btn.unsupported{background:#f1f5f9;color:#475569}.state-btn.request{background:#dbeafe;color:#1d4ed8;cursor:pointer}.state-btn:disabled{opacity:.65;cursor:not-allowed}.icon-btn{width:31px;height:31px;border:1px solid #dbe3ec;background:#f8fafc;color:#64748b;cursor:pointer}.tiny-spin{width:13px;height:13px;border:2px solid #cbd5e1;border-top-color:#2563eb;border-radius:50%;animation:amSpin .8s linear infinite}
.am-card{margin-top:10px;padding:15px;border:1.5px solid #cbd5e1;border-radius:15px;background:#fff;box-shadow:0 7px 25px rgba(15,23,42,.05)}.am-card-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;color:#2563eb}.am-card-head h2{margin:0;color:#172033;font-size:14px;font-weight:950}.am-card-head p{margin:3px 0 0;color:#64748b;font-size:8px;line-height:1.4}.am-toolbar{margin-top:10px;display:flex;gap:7px;align-items:center;flex-wrap:wrap}.am-toolbar select{height:34px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;padding:0 9px;font-size:8px;font-weight:850}.am-preview-wrap{margin-top:10px;min-height:230px;border-radius:12px;background:#0f172a;overflow:hidden;border:1.5px solid #1e293b}.am-video{width:100%;height:350px;max-height:48vh;object-fit:cover;display:block;background:#000}.am-preview-empty{height:230px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:7px;color:#94a3b8;font-size:9px}.am-live{margin-top:10px;padding:10px 12px;border-radius:9px;background:#f8fafc;color:#64748b;font-size:9px;font-weight:850;display:flex;gap:7px;align-items:center}.am-live.active{background:#ecfdf5;color:#047857}.pulse-dot{width:8px;height:8px;border-radius:50%;background:#94a3b8}.am-live.active .pulse-dot{background:#10b981;box-shadow:0 0 0 5px rgba(16,185,129,.12)}
.hidden-input{display:none}.file-list,.contact-list{margin-top:10px;display:flex;flex-direction:column;gap:6px}.file-row,.contact-row{display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc}.file-row img{width:38px;height:38px;border-radius:7px;object-fit:cover}.file-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:7px;background:#e0e7ff;color:#4338ca}.file-row>div:nth-child(2),.contact-row>div:nth-child(2){flex:1;min-width:0}.file-row b,.contact-row b{display:block;font-size:9px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.file-row small,.contact-row small{display:block;margin-top:2px;color:#64748b;font-size:7px}.empty-inline{padding:22px;border:1px dashed #cbd5e1;border-radius:10px;color:#94a3b8;display:flex;align-items:center;justify-content:center;gap:7px;font-size:9px}.search-box{height:34px;display:flex;align-items:center;gap:6px;border:1px solid #cbd5e1;border-radius:8px;padding:0 9px;background:#fff;min-width:230px;flex:1}.search-box input{border:0;outline:0;width:100%;font-size:9px}.contact-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:950}
.activity-grid{margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.activity-grid span{display:flex;align-items:center;gap:6px;padding:9px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;color:#64748b;font-size:8px;font-weight:900}.activity-grid span.on{background:#ecfdf5;color:#047857;border-color:#bbf7d0}.activity-grid span.off{opacity:.8}.am-info{margin-top:10px;padding:13px;display:flex;align-items:center;gap:10px;border:1.5px solid #cbd5e1;border-radius:13px;background:#fff}.am-info>div{flex:1}.am-info b{display:block;font-size:10px;font-weight:950}.am-info span{display:block;margin-top:2px;color:#64748b;font-size:8px;line-height:1.45}.am-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);display:flex;align-items:center;gap:7px;padding:11px 14px;background:#f0fdf4;color:#047857;border:1px solid #bbf7d0;border-radius:11px;box-shadow:0 18px 45px rgba(15,23,42,.18);font-size:9px;font-weight:900;z-index:10000}
.status-card{margin-bottom:22px}
@media(max-width:900px){.activity-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:700px){.am-page{padding:9px}.am-header{flex-direction:column;align-items:stretch;padding:15px;border-radius:16px}.am-header h1{font-size:22px}.am-header p{font-size:9px}.am-refresh{align-self:flex-end}.am-summary{grid-template-columns:repeat(2,1fr)}.am-perm{align-items:flex-start;flex-wrap:wrap}.am-perm-actions{width:100%;justify-content:flex-end}.am-perm-title{flex-wrap:wrap}.am-video{height:260px}.activity-grid{grid-template-columns:1fr}.search-box{min-width:100%}}
@media(max-width:430px){.am-summary{grid-template-columns:1fr 1fr}.am-card{padding:12px}.am-toolbar .primary,.am-toolbar .secondary,.am-toolbar .danger{flex:1;min-width:145px}.am-perm-code{max-width:100%}}
`;
