import React, { useEffect, useRef, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Chat_ai() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendMessage = async () => {
    const question = input.trim();

    if (!question || loading) return;

    const userMessage = {
      role: "user",
      content: question,
    };

    const previousHistory = messages;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: question,
            history: previousHistory,
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data?.message ||
            `Request failed (${response.status})`
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.message ||
            "Unable to connect to AI server.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
    setCopiedIndex(null);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const copyAnswer = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedIndex(index);

      setTimeout(() => {
        setCopiedIndex(null);
      }, 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const useSuggestion = (text) => {
    setInput(text);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        .ai-page {
          width: 100%;
          height: 100vh;
          height: 100dvh;
          display: flex;
          background: #f7f8fa;
          color: #172033;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;
          overflow: hidden;
        }

        /* SIDEBAR */

        .ai-sidebar {
          width: 260px;
          min-width: 260px;
          height: 100%;
          background: #ffffff;
          border-right: 1px solid #e7e9ee;
          padding: 22px 16px;
        }

        .ai-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 28px;
        }

        .ai-logo {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: #111827;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }

        .new-chat-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          background: #111827;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .new-chat-btn:hover {
          background: #252c39;
        }

        .sidebar-title {
          margin-top: 35px;
          color: #8a91a1;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .sidebar-info {
          margin-top: 10px;
          color: #777f90;
          font-size: 13px;
          line-height: 1.6;
        }

        /* MAIN */

        .ai-main {
          flex: 1;
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* HEADER */

        .ai-header {
          height: 72px;
          min-height: 72px;
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          border-bottom: 1px solid #e7e9ee;
        }

        .ai-header h2 {
          margin: 0 0 2px;
          font-size: 17px;
        }

        .ai-header span {
          color: #8b92a1;
          font-size: 12px;
        }

        .header-new-btn {
          padding: 8px 13px;
          border: 1px solid #dfe2e8;
          border-radius: 8px;
          background: white;
          color: #303746;
          cursor: pointer;
          font-size: 12px;
        }

        .header-new-btn:hover {
          background: #f4f5f7;
        }

        /* CHAT */

        .chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 30px 20px 155px;
        }

        .chat-area::-webkit-scrollbar {
          width: 6px;
        }

        .chat-area::-webkit-scrollbar-thumb {
          background: #d4d8df;
          border-radius: 20px;
        }

        /* WELCOME */

        .welcome {
          max-width: 720px;
          margin: 90px auto 0;
          text-align: center;
        }

        .welcome-logo {
          width: 55px;
          height: 55px;
          margin: auto;
          border-radius: 16px;
          background: #111827;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 800;
        }

        .welcome h1 {
          margin: 20px 0 8px;
          font-size: 30px;
        }

        .welcome p {
          margin: 0;
          color: #777f90;
          font-size: 14px;
        }

        /* SUGGESTIONS */

        .suggestions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 30px;
        }

        .suggestions button {
          padding: 14px;
          background: white;
          border: 1px solid #e1e4e9;
          border-radius: 10px;
          text-align: left;
          cursor: pointer;
          font-size: 13px;
          color: #394150;
        }

        .suggestions button:hover {
          background: #fafafa;
          border-color: #aeb4bf;
        }

        /* MESSAGES */

        .messages {
          max-width: 850px;
          margin: auto;
        }

        .message-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin: 22px 0;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.user .avatar {
          order: 2;
        }

        .message-row.user .message-content {
          max-width: 75%;
          padding: 12px 15px;
          border-radius: 14px 14px 4px 14px;
          background: #111827;
          color: white;
        }

        .message-row.assistant
          .message-content {
          max-width: 82%;
        }

        .avatar {
          width: 34px;
          min-width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #e9ecf1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333b4a;
          font-size: 10px;
          font-weight: 800;
        }

        .message-name {
          margin-bottom: 6px;
          color: #777f90;
          font-size: 11px;
          font-weight: 700;
        }

        .message-row.user
          .message-name {
          color: #d7dbe3;
        }

        .message-text {
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.65;
          font-size: 14px;
        }

        .message-row.assistant
          .message-text {
          color: #293241;
        }

        .message-row.user
          .message-text {
          color: white;
        }

        .message-text.error {
          color: #d14343 !important;
        }

        /* COPY */

        .copy-btn {
          margin-top: 10px;
          padding: 5px 9px;
          border: 1px solid #dfe2e8;
          border-radius: 6px;
          background: white;
          color: #4c5360;
          font-size: 11px;
          cursor: pointer;
        }

        .copy-btn:hover {
          background: #f1f2f4;
        }

        /* LOADING */

        .typing {
          display: flex;
          gap: 4px;
          padding: 10px 0;
        }

        .typing span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #858c99;
          animation: typing 1s infinite;
        }

        .typing span:nth-child(2) {
          animation-delay: .15s;
        }

        .typing span:nth-child(3) {
          animation-delay: .3s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: .3;
            transform: translateY(0);
          }

          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        /* INPUT */

        .input-section {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 5;
          padding: 14px 20px 18px;
          background: linear-gradient(
            transparent,
            #f7f8fa 25%
          );
        }

        .input-box {
          max-width: 850px;
          margin: auto;
          padding: 8px 8px 8px 15px;
          display: flex;
          align-items: flex-end;
          background: white;
          border: 1px solid #dfe2e8;
          border-radius: 15px;
          box-shadow:
            0 5px 20px rgba(0, 0, 0, .05);
        }

        .input-box:focus-within {
          border-color: #aeb4bf;
        }

        .input-box textarea {
          flex: 1;
          min-height: 38px;
          max-height: 130px;
          padding: 9px 0;
          border: none;
          outline: none;
          resize: none;
          background: transparent;
          color: #202735;
          font-family: inherit;
          font-size: 14px;
        }

        .input-box textarea::placeholder {
          color: #9aa1ae;
        }

        .send-btn {
          width: 38px;
          min-width: 38px;
          height: 38px;
          border: none;
          border-radius: 10px;
          background: #111827;
          color: white;
          font-size: 17px;
          cursor: pointer;
        }

        .send-btn:hover:not(:disabled) {
          background: #252c39;
        }

        .send-btn:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .input-footer {
          max-width: 850px;
          margin: 7px auto 0;
          text-align: center;
          color: #9299a7;
          font-size: 10px;
        }

        /* MOBILE */

        @media (max-width: 700px) {

          .ai-sidebar {
            display: none;
          }

          .ai-header {
            height: 64px;
            min-height: 64px;
            padding: 0 14px;
          }

          .ai-header h2 {
            font-size: 15px;
          }

          .ai-header span {
            font-size: 10px;
          }

          .header-new-btn {
            padding: 7px 10px;
          }

          .chat-area {
            padding: 20px 12px 140px;
          }

          .welcome {
            margin-top: 55px;
          }

          .welcome h1 {
            font-size: 24px;
          }

          .suggestions {
            grid-template-columns: 1fr;
          }

          .message-row {
            gap: 9px;
            margin: 18px 0;
          }

          .avatar {
            width: 30px;
            min-width: 30px;
            height: 30px;
          }

          .message-row.user
            .message-content,
          .message-row.assistant
            .message-content {
            max-width: 88%;
          }

          .message-text {
            font-size: 13px;
          }

          .input-section {
            padding: 8px 9px;
            padding-bottom:
              calc(
                10px +
                env(safe-area-inset-bottom)
              );
          }

          .input-box {
            border-radius: 13px;
            padding-left: 12px;
          }

          .input-box textarea {
            font-size: 13px;
          }

          .input-footer {
            font-size: 9px;
          }
        }

      `}</style>

      <div className="ai-page">

        {/* SIDEBAR */}
        <aside className="ai-sidebar">

          <div className="ai-brand">
            <div className="ai-logo">
              AI
            </div>

            <span>
              AI Assistant
            </span>
          </div>

          <button
            className="new-chat-btn"
            onClick={newChat}
          >
            ＋ New Chat
          </button>

          <div className="sidebar-title">
            AI Assistant
          </div>

          <div className="sidebar-info">
            Ask questions, solve problems,
            write code and get professional
            answers.
          </div>

        </aside>

        {/* MAIN */}
        <main className="ai-main">

          {/* HEADER */}
          <header className="ai-header">

            <div>
              <h2>
                AI Assistant
              </h2>

              <span>
                Professional AI Chat
              </span>
            </div>

            <button
              className="header-new-btn"
              onClick={newChat}
            >
              New Chat
            </button>

          </header>

          {/* CHAT */}
          <section className="chat-area">

            {messages.length === 0 && (

              <div className="welcome">

                <div className="welcome-logo">
                  AI
                </div>

                <h1>
                  How can I help you?
                </h1>

                <p>
                  Ask any question and get a
                  clear, professional answer.
                </p>

                <div className="suggestions">

                  <button
                    onClick={() =>
                      useSuggestion(
                        "Explain React.js in simple terms"
                      )
                    }
                  >
                    Explain React.js
                  </button>

                  <button
                    onClick={() =>
                      useSuggestion(
                        "How can I build a professional Node.js API?"
                      )
                    }
                  >
                    Node.js API
                  </button>

                  <button
                    onClick={() =>
                      useSuggestion(
                        "Help me solve a programming problem"
                      )
                    }
                  >
                    Programming Help
                  </button>

                  <button
                    onClick={() =>
                      useSuggestion(
                        "Explain this concept professionally"
                      )
                    }
                  >
                    Explain Concept
                  </button>

                </div>

              </div>
            )}

            <div className="messages">

              {messages.map(
                (message, index) => (

                  <div
                    className={`message-row ${message.role}`}
                    key={index}
                  >

                    <div className="avatar">
                      {message.role === "user"
                        ? "U"
                        : "AI"}
                    </div>

                    <div className="message-content">

                      <div className="message-name">
                        {message.role === "user"
                          ? "You"
                          : "AI Assistant"}
                      </div>

                      <div
                        className={`message-text ${
                          message.error
                            ? "error"
                            : ""
                        }`}
                      >
                        {message.content}
                      </div>

                      {message.role ===
                        "assistant" &&
                        !message.error && (

                          <button
                            className="copy-btn"
                            onClick={() =>
                              copyAnswer(
                                message.content,
                                index
                              )
                            }
                          >
                            {copiedIndex === index
                              ? "Copied"
                              : "Copy"}
                          </button>

                        )}

                    </div>

                  </div>

                )
              )}

              {loading && (

                <div className="message-row assistant">

                  <div className="avatar">
                    AI
                  </div>

                  <div className="message-content">

                    <div className="message-name">
                      AI Assistant
                    </div>

                    <div className="typing">
                      <span />
                      <span />
                      <span />
                    </div>

                  </div>

                </div>

              )}

              <div ref={bottomRef} />

            </div>

          </section>

          {/* INPUT */}
          <div className="input-section">

            <div className="input-box">

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                disabled={loading}
              />

              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={
                  !input.trim() || loading
                }
              >
                ➤
              </button>

            </div>

            <div className="input-footer">
              AI can make mistakes. Verify
              important information.
            </div>

          </div>

        </main>

      </div>
    </>
  );
}