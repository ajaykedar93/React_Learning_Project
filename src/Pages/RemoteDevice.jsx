import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  "https://express-project-learning-new.onrender.com";

export default function RemoteDevice() {
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const videoRef = useRef(null);

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [socketStatus, setSocketStatus] =
    useState("Disconnected");

  const [webRTCStatus, setWebRTCStatus] =
    useState("Not connected");

  const [camera, setCamera] = useState(false);
  const [microphone, setMicrophone] = useState(false);
  const [screen, setScreen] = useState(false);
  const [recording, setRecording] = useState(false);

  const [error, setError] = useState("");

  const selectedDeviceRef = useRef(null);
  const pendingIceRef = useRef([]);

  useEffect(() => {
    selectedDeviceRef.current = selectedDevice;
  }, [selectedDevice]);

  // ============================================================
  // REST DEVICE LIST FALLBACK / REFRESH
  // ============================================================

  async function refreshDevices() {
    try {
      const response = await fetch(
        `${SOCKET_URL}/api/remote/devices`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Device API returned ${response.status}`
        );
      }

      const data = await response.json();

      if (Array.isArray(data?.devices)) {
        setDevices(data.devices);
      }
    } catch (err) {
      console.warn(
        "Device list refresh failed:",
        err
      );
    }
  }

  // ============================================================
  // SOCKET CONNECTION
  // ============================================================

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("Connected");
      setError("");

      socket.emit("remote-register");
      refreshDevices();
    });

    socket.on("disconnect", () => {
      setSocketStatus("Disconnected");
      setWebRTCStatus("Not connected");
    });

    socket.on("connect_error", (err) => {
      setSocketStatus("Connection error");
      setError(
        err?.message || "Unable to connect to backend"
      );
    });

    // ==========================================================
    // DEVICE LIST
    // ==========================================================

    socket.on("device-list", (list) => {
      setDevices(Array.isArray(list) ? list : []);
    });

    // ==========================================================
    // DEVICE STATUS
    // ==========================================================

    socket.on(
      "device-status",
      ({ deviceId, online }) => {
        setDevices((current) =>
          current.map((device) =>
            device.deviceId === deviceId
              ? { ...device, online }
              : device
          )
        );

        if (
          selectedDeviceRef.current?.deviceId === deviceId &&
          !online
        ) {
          setWebRTCStatus("Device offline");
        }
      }
    );

    // ==========================================================
    // CAMERA STATUS
    // ==========================================================

    socket.on(
      "camera-status",
      ({ deviceId, active }) => {
        if (
          selectedDeviceRef.current?.deviceId === deviceId
        ) {
          setCamera(Boolean(active));
        }
      }
    );

    // ==========================================================
    // MICROPHONE STATUS
    // ==========================================================

    socket.on(
      "microphone-status",
      ({ deviceId, active }) => {
        if (
          selectedDeviceRef.current?.deviceId === deviceId
        ) {
          setMicrophone(Boolean(active));
        }
      }
    );

    // ==========================================================
    // SCREEN STATUS
    // ==========================================================

    socket.on(
      "screen-status",
      ({ deviceId, active }) => {
        if (
          selectedDeviceRef.current?.deviceId === deviceId
        ) {
          setScreen(Boolean(active));
        }
      }
    );

    // ==========================================================
    // VIDEO RECORDING STATUS
    // ==========================================================

    socket.on(
      "video-recording-status",
      ({ deviceId, active }) => {
        if (
          selectedDeviceRef.current?.deviceId === deviceId
        ) {
          setRecording(Boolean(active));
        }
      }
    );

    // ==========================================================
    // PHOTO RESULT
    // ==========================================================

    socket.on(
      "photo-result",
      ({ deviceId, url, message }) => {
        if (
          selectedDeviceRef.current?.deviceId !== deviceId
        ) {
          return;
        }

        if (url) {
          window.open(url, "_blank");
        }

        if (message) {
          setError(message);
        }
      }
    );

    // ==========================================================
    // DEVICE ERROR
    // ==========================================================

    socket.on(
      "device-error",
      (payload) => {
        const message =
          typeof payload === "string"
            ? payload
            : payload?.message;

        setError(
          message || "Android device error"
        );
      }
    );

    // ==========================================================
    // WEBRTC OFFER
    // ==========================================================

    socket.on(
      "webrtc-offer",
      async ({ deviceId, offer }) => {
        if (
          !selectedDevice ||
          selectedDevice.deviceId !== deviceId
        ) {
          return;
        }

        try {
          if (!offer) {
            throw new Error(
              "Empty WebRTC offer"
            );
          }

          if (!peerRef.current) {
            createPeerConnection(deviceId);
          }

          const peer = peerRef.current;

          const remoteDescription =
            typeof offer === "string"
              ? {
                  type: "offer",
                  sdp: offer,
                }
              : {
                  type: offer.type || "offer",
                  sdp:
                    offer.sdp ||
                    offer.description ||
                    "",
                };

          if (!remoteDescription.sdp) {
            throw new Error(
              "Invalid WebRTC SDP offer"
            );
          }

          await peer.setRemoteDescription(
            remoteDescription
          );

          const queuedIce =
            pendingIceRef.current.filter(
              (item) =>
                item.deviceId === deviceId
            );

          pendingIceRef.current =
            pendingIceRef.current.filter(
              (item) =>
                item.deviceId !== deviceId
            );

          for (const item of queuedIce) {
            try {
              await peer.addIceCandidate(
                new RTCIceCandidate(
                  item.candidate
                )
              );
            } catch (iceError) {
              console.warn(
                "Queued ICE candidate failed:",
                iceError
              );
            }
          }

          const answer =
            await peer.createAnswer();

          await peer.setLocalDescription(
            answer
          );

          socket.emit(
            "webrtc-answer",
            {
              deviceId,
              answer: {
                type: answer.type,
                sdp: answer.sdp,
              },
            }
          );

          setWebRTCStatus(
            "Answer sent"
          );
        } catch (err) {
          console.error(
            "WebRTC offer error:",
            err
          );

          setWebRTCStatus(
            "WebRTC error"
          );

          setError(
            err?.message ||
              "WebRTC connection failed"
          );
        }
      }
    );

    // ==========================================================
    // WEBRTC ICE
    // ==========================================================

    socket.on(
      "webrtc-ice",
      async ({ deviceId, candidate }) => {
        if (
          selectedDeviceRef.current?.deviceId !== deviceId ||
          !candidate ||
          !peerRef.current
        ) {
          return;
        }

        try {
          const peer = peerRef.current;

          if (
            !peer.remoteDescription
          ) {
            pendingIceRef.current.push(
              {
                deviceId,
                candidate,
              }
            );
            return;
          }

          await peer.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (err) {
          console.error(
            "ICE candidate error:",
            err
          );
        }
      }
    );

    const deviceRefreshTimer = setInterval(
      refreshDevices,
      5000
    );

    return () => {
      clearInterval(deviceRefreshTimer);

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedDevice]);

  // ============================================================
  // CREATE WEBRTC CONNECTION
  // ============================================================

  function createPeerConnection(deviceId) {
    if (peerRef.current) {
      peerRef.current.close();
    }

    const peer =
      new RTCPeerConnection({
        iceServers: [
          {
            urls:
              "stun:stun.l.google.com:19302",
          },
        ],
      });

    peerRef.current = peer;

    // Remote video/audio
    peer.ontrack = (event) => {
      const stream =
        event.streams?.[0];

      if (
        stream &&
        videoRef.current
      ) {
        videoRef.current.srcObject =
          stream;

        setWebRTCStatus(
          "Live connection"
        );
      }
    };

    // ICE
    peer.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      socketRef.current?.emit(
        "webrtc-ice",
        {
          deviceId,
          candidate:
            event.candidate.toJSON(),
        }
      );
    };

    // Connection state
    peer.onconnectionstatechange =
      () => {
        switch (
          peer.connectionState
        ) {
          case "new":
            setWebRTCStatus("New");
            break;

          case "connecting":
            setWebRTCStatus(
              "Connecting..."
            );
            break;

          case "connected":
            setWebRTCStatus(
              "Live connection"
            );
            break;

          case "disconnected":
            setWebRTCStatus(
              "Disconnected"
            );
            break;

          case "failed":
            setWebRTCStatus(
              "Connection failed"
            );
            break;

          case "closed":
            setWebRTCStatus("Closed");
            break;

          default:
            break;
        }
      };
  }

  // ============================================================
  // SELECT DEVICE
  // ============================================================

  function selectDevice(device) {
    if (!device?.online) {
      setError(
        "This device is offline."
      );
      return;
    }

    setError("");

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    selectedDeviceRef.current = device;
    pendingIceRef.current = [];

    setSelectedDevice(device);

    setCamera(false);
    setMicrophone(false);
    setScreen(false);
    setRecording(false);

    setWebRTCStatus(
      "Waiting for approved media..."
    );

    socketRef.current?.emit(
      "select-device",
      {
        deviceId: device.deviceId,
      }
    );

  }

  // ============================================================
  // SEND COMMAND
  // ============================================================

  function sendCommand(command) {
    if (!selectedDevice) {
      setError(
        "Select a device first."
      );
      return;
    }

    if (!selectedDevice.online) {
      setError(
        "Selected device is offline."
      );
      return;
    }

    setError("");

    socketRef.current?.emit(
      "remote-command",
      {
        deviceId:
          selectedDevice.deviceId,
        command,
        timestamp: Date.now(),
      }
    );
  }

  // ============================================================
  // CAMERA
  // ============================================================

  function startCamera() {
    sendCommand("start_camera");
  }

  function stopCamera() {
    sendCommand("stop_camera");
  }

  function switchCamera() {
    sendCommand("switch_camera");
  }

  // ============================================================
  // PHOTO
  // ============================================================

  function takePhoto() {
    sendCommand("take_photo");
  }

  // ============================================================
  // VIDEO
  // ============================================================

  function startVideoRecording() {
    sendCommand(
      "start_video_recording"
    );
  }

  function stopVideoRecording() {
    sendCommand(
      "stop_video_recording"
    );
  }

  // ============================================================
  // MICROPHONE
  // ============================================================

  function startMicrophone() {
    sendCommand("start_microphone");
  }

  function stopMicrophone() {
    sendCommand("stop_microphone");
  }

  // ============================================================
  // SCREEN
  // ============================================================

  function startScreen() {
    sendCommand("start_screen");
  }

  function stopScreen() {
    sendCommand("stop_screen");
  }

  // ============================================================
  // DISCONNECT
  // ============================================================

  function disconnectDevice() {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    selectedDeviceRef.current = null;
    pendingIceRef.current = [];

    setSelectedDevice(null);

    setCamera(false);
    setMicrophone(false);
    setScreen(false);
    setRecording(false);

    setWebRTCStatus(
      "Not connected"
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        .remote-page {
          min-height: 100vh;
          background: #f5f7fa;
          color: #1c232b;
          font-family:
            Inter,
            Arial,
            sans-serif;
          padding-bottom: 30px;
        }

        .remote-header {
          position: sticky;
          top: 0;
          z-index: 20;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 18px 26px;

          background: #fff;
          border-bottom:
            1px solid #e5e8ec;
        }

        .header-title h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
        }

        .header-title p {
          margin: 5px 0 0;
          color: #7a838e;
          font-size: 12px;
        }

        .server-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #6e7782;
        }

        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #b8bec6;
        }

        .status-dot.online {
          background: #1ca66b;
        }

        .main-grid {
          width: min(1150px, 94%);
          margin: 22px auto;

          display: grid;
          grid-template-columns: 330px 1fr;
          gap: 20px;
        }

        .card {
          background: #fff;
          border: 1px solid #e2e6ea;
          border-radius: 14px;

          box-shadow:
            0 4px 18px
            rgba(20, 30, 40, .05);
        }

        .devices-card {
          padding: 18px;
        }

        .card-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-title h2 {
          margin: 0;
          font-size: 16px;
        }

        .count {
          color: #7d8792;
          font-size: 11px;
        }

        .device-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 15px;
        }

        .device-button {
          width: 100%;

          display: flex;
          align-items: center;
          gap: 10px;

          padding: 11px;

          border: 1px solid #e1e5e9;
          border-radius: 10px;

          background: #fff;
          cursor: pointer;
          text-align: left;
        }

        .device-button:hover {
          border-color: #9da6af;
        }

        .device-button.selected {
          border-color: #333b44;
          background: #f7f8f9;
        }

        .device-icon {
          width: 38px;
          height: 38px;

          display: grid;
          place-items: center;

          flex-shrink: 0;

          border-radius: 9px;
          background: #eef1f4;

          font-size: 19px;
        }

        .device-info {
          min-width: 0;
          flex: 1;
        }

        .device-name {
          display: block;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          font-size: 13px;
          font-weight: 600;
        }

        .device-state {
          display: block;
          margin-top: 3px;

          color: #7d8690;
          font-size: 10px;
        }

        .online-dot {
          width: 8px;
          height: 8px;

          flex-shrink: 0;

          border-radius: 50%;
          background: #b8bec6;
        }

        .online-dot.active {
          background: #1ca66b;
        }

        .empty {
          padding: 40px 10px;

          text-align: center;

          color: #858e98;
          font-size: 12px;
        }

        .control-card {
          padding: 18px;
        }

        .device-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .device-header h2 {
          margin: 0;
          font-size: 17px;
        }

        .device-header p {
          margin: 5px 0 0;

          color: #7b8590;
          font-size: 11px;
        }

        .disconnect {
          border: 0;
          border-radius: 8px;

          padding: 8px 12px;

          background: #eef0f2;
          color: #303841;

          cursor: pointer;
          font-size: 11px;
        }

        .error {
          margin-top: 13px;

          padding: 10px 12px;

          border-radius: 8px;

          background: #fff1f1;
          color: #b3261e;

          font-size: 11px;
        }

        .video-box {
          position: relative;

          width: 100%;
          aspect-ratio: 16 / 9;

          margin-top: 17px;

          overflow: hidden;

          border-radius: 12px;

          background: #11161c;
        }

        .video-box video {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: contain;
        }

        .video-placeholder {
          position: absolute;
          inset: 0;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          color: #aeb6bf;

          text-align: center;
          pointer-events: none;
        }

        .camera-icon {
          font-size: 34px;
          margin-bottom: 8px;
        }

        .placeholder-text {
          font-size: 12px;
        }

        .section-title {
          margin-top: 17px;
          margin-bottom: 9px;

          font-size: 12px;
          font-weight: 700;

          color: #555f6a;
        }

        .controls {
          display: grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap: 9px;
        }

        .control {
          min-height: 72px;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 4px;

          padding: 9px 5px;

          border: 1px solid #e0e4e8;
          border-radius: 10px;

          background: #fff;

          cursor: pointer;
        }

        .control:hover {
          border-color: #9ca5ae;
        }

        .control.active {
          background: #f0f2f4;
          border-color: #343b43;
        }

        .control-icon {
          font-size: 20px;
        }

        .control-name {
          font-size: 11px;
          font-weight: 600;
        }

        .control-state {
          color: #7d8690;
          font-size: 9px;
        }

        .privacy {
          margin-top: 14px;

          padding: 11px;

          border-radius: 9px;

          background: #f4f6f8;
        }

        .privacy strong {
          display: block;
          font-size: 11px;
        }

        .privacy span {
          display: block;

          margin-top: 4px;

          color: #737d87;

          font-size: 10px;
          line-height: 1.5;
        }

        .no-device {
          min-height: 430px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #858e98;

          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 850px) {
          .main-grid {
            grid-template-columns: 1fr;
          }

          .no-device {
            min-height: 220px;
          }
        }

        @media (max-width: 520px) {
          .remote-header {
            padding: 15px;
          }

          .header-title h1 {
            font-size: 18px;
          }

          .main-grid {
            width: 94%;
            margin: 14px auto;
            gap: 12px;
          }

          .devices-card,
          .control-card {
            padding: 13px;
            border-radius: 11px;
          }

          .controls {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .device-header {
            align-items: flex-start;
          }

          .disconnect {
            padding: 7px 9px;
          }
        }

      `}</style>

      <div className="remote-page">

        {/* HEADER */}

        <header className="remote-header">

          <div className="header-title">
            <h1>Remote Device</h1>
            <p>
              Device management dashboard
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <button
              onClick={refreshDevices}
              style={{
                border: "1px solid #e1e5e9",
                borderRadius: 8,
                padding: "7px 10px",
                background: "#fff",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              ↻ Refresh
            </button>

            <div className="server-status">

            <span
              className={`status-dot ${
                socketStatus === "Connected"
                  ? "online"
                  : ""
              }`}
            />

            {socketStatus}
            </div>
          </div>
        </header>

        <main className="main-grid">

          {/* =====================================================
              DEVICE LIST
          ===================================================== */}

          <section className="card devices-card">

            <div className="card-title">

              <h2>My Devices</h2>

              <span className="count">
                {devices.length} device
                {devices.length !== 1
                  ? "s"
                  : ""}
              </span>

            </div>

            {devices.length === 0 ? (
              <div className="empty">
                <div>No Android devices online</div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    color: "#9aa2aa",
                    lineHeight: 1.5,
                  }}
                >
                  Keep the Android app open and connected
                  to the same backend.
                </div>
              </div>
            ) : (
              <div className="device-list">

                {devices.map((device) => (

                  <button
                    key={device.deviceId}
                    className={`device-button ${
                      selectedDevice?.deviceId ===
                      device.deviceId
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectDevice(device)
                    }
                  >

                    <span className="device-icon">
                      📱
                    </span>

                    <span className="device-info">

                      <span className="device-name">
                        {device.deviceName ||
                          device.deviceId}
                      </span>

                      <span className="device-state">
                        {device.online
                          ? "Online"
                          : "Offline"}
                      </span>

                    </span>

                    <span
                      className={`online-dot ${
                        device.online
                          ? "active"
                          : ""
                      }`}
                    />

                  </button>

                ))}

              </div>
            )}

          </section>

          {/* =====================================================
              CONTROL PANEL
          ===================================================== */}

          <section className="card control-card">

            {!selectedDevice ? (

              <div className="no-device">
                Select an online Android
                device to continue.
              </div>

            ) : (

              <>

                <div className="device-header">

                  <div>
                    <h2>
                      {selectedDevice.deviceName ||
                        selectedDevice.deviceId}
                    </h2>

                    <p>
                      WebRTC: {webRTCStatus}
                    </p>
                  </div>

                  <button
                    className="disconnect"
                    onClick={
                      disconnectDevice
                    }
                  >
                    Disconnect
                  </button>

                </div>

                {error && (
                  <div className="error">
                    {error}
                  </div>
                )}

                {/* =================================================
                    LIVE VIDEO
                ================================================= */}

                <div className="video-box">

                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    controls={false}
                  />

                  <div className="video-placeholder">

                    <div className="camera-icon">
                      📹
                    </div>

                    <div className="placeholder-text">
                      Waiting for approved
                      media stream
                    </div>

                  </div>

                </div>

                {/* =================================================
                    CAMERA
                ================================================= */}

                <div className="section-title">
                  Camera
                </div>

                <div className="controls">

                  <button
                    className={`control ${
                      camera
                        ? "active"
                        : ""
                    }`}
                    onClick={
                      camera
                        ? stopCamera
                        : startCamera
                    }
                  >
                    <span className="control-icon">
                      📷
                    </span>

                    <span className="control-name">
                      {camera
                        ? "Stop Camera"
                        : "Start Camera"}
                    </span>

                    <span className="control-state">
                      {camera
                        ? "Active"
                        : "Off"}
                    </span>
                  </button>

                  <button
                    className="control"
                    onClick={
                      switchCamera
                    }
                  >
                    <span className="control-icon">
                      🔄
                    </span>

                    <span className="control-name">
                      Front / Back
                    </span>

                    <span className="control-state">
                      Switch
                    </span>
                  </button>

                  <button
                    className="control"
                    onClick={
                      takePhoto
                    }
                  >
                    <span className="control-icon">
                      📸
                    </span>

                    <span className="control-name">
                      Take Photo
                    </span>

                    <span className="control-state">
                      Requires approval
                    </span>
                  </button>

                </div>

                {/* =================================================
                    VIDEO
                ================================================= */}

                <div className="section-title">
                  Video Recording
                </div>

                <div className="controls">

                  <button
                    className={`control ${
                      recording
                        ? "active"
                        : ""
                    }`}
                    onClick={
                      recording
                        ? stopVideoRecording
                        : startVideoRecording
                    }
                  >
                    <span className="control-icon">
                      🎥
                    </span>

                    <span className="control-name">
                      {recording
                        ? "Stop Recording"
                        : "Start Recording"}
                    </span>

                    <span className="control-state">
                      {recording
                        ? "Recording"
                        : "Requires approval"}
                    </span>
                  </button>

                </div>

                {/* =================================================
                    AUDIO
                ================================================= */}

                <div className="section-title">
                  Audio
                </div>

                <div className="controls">

                  <button
                    className={`control ${
                      microphone
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      microphone
                        ? stopMicrophone()
                        : startMicrophone()
                    }
                  >
                    <span className="control-icon">
                      🎙️
                    </span>

                    <span className="control-name">
                      {microphone
                        ? "Stop Mic"
                        : "Start Mic"}
                    </span>

                    <span className="control-state">
                      {microphone
                        ? "Active"
                        : "Off"}
                    </span>
                  </button>

                </div>

                {/* =================================================
                    SCREEN
                ================================================= */}

                <div className="section-title">
                  Screen Sharing
                </div>

                <div className="controls">

                  <button
                    className={`control ${
                      screen
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      screen
                        ? stopScreen()
                        : startScreen()
                    }
                  >
                    <span className="control-icon">
                      🖥️
                    </span>

                    <span className="control-name">
                      {screen
                        ? "Stop Screen"
                        : "Share Screen"}
                    </span>

                    <span className="control-state">
                      {screen
                        ? "Active"
                        : "Requires approval"}
                    </span>
                  </button>

                </div>

                {/* =================================================
                    PRIVACY
                ================================================= */}

                <div className="privacy">

                  <strong>
                    Privacy & Consent
                  </strong>

                  <span>
                    Camera, microphone, photo,
                    video and screen actions
                    require explicit approval
                    on the Android device.
                    Active sessions show a
                    visible foreground indicator.
                  </span>

                </div>

              </>

            )}

          </section>

        </main>

      </div>
    </>
  );
}