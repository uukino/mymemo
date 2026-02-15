import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const MyPage = ({ onBack, memos = [] }) => {
  const [name, setName] = useState("ゲストユーザー");
  const [authStatus, setAuthStatus] = useState("unauth");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["userId", "userName"], (result) => {
        if (result.userId) {
          setAuthStatus("auth");
          setUserId(result.userId);
          setName(result.userName || "ゲストユーザー");
        }
      });
    }
  }, []);

  const handleSignIn = async () => {
    setAuthError("");
    if (!username || !password) {
      setAuthError("ユーザー名とパスワードを入力してください");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.id) {
        setAuthError("ユーザー名またはパスワードが正しくありません");
        return;
      }
      setAuthStatus("auth");
      setUserId(data.id);
      setName(data.name);
      setUsername("");
      setPassword("");
      chrome.storage.local.set({
        userId: data.id,
        userName: data.name,
      });
    } catch (err) {
      setAuthError("ログインに失敗しました");
    }
  };

  const handleSignUp = async () => {
    setAuthError("");
    if (!displayName || !password) {
      setAuthError("ユーザー名とパスワードを入力してください");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.id) {
        setAuthError(data.message || "登録に失敗しました");
        return;
      }
      setAuthStatus("auth");
      setUserId(data.id);
      setName(data.name);
      setUsername("");
      setPassword("");
      setDisplayName("");
      chrome.storage.local.set({
        userId: data.id,
        userName: data.name,
      });
    } catch (err) {
      setAuthError("登録に失敗しました");
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ userName: newName });
    }
  };

  const memoCount = memos.length;
  const totalLikes = memos.reduce((sum, memo) => sum + (memo.good || 0), 0);
  const sortedMemos = [...memos].sort((a, b) => b.id - a.id);

  if (authStatus !== "auth") {
    return (
      <div style={{ padding: "0 4px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={onBack}
            style={{
              marginRight: "8px",
              padding: "4px 8px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ← 戻る
          </button>
          <h3 style={{ margin: 0 }}>マイページ</h3>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
            backgroundColor: "#fff",
          }}
        >
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
            {isSignUp ? "新規登録" : "ログイン"}
          </div>
          <input
            type="text"
            value={isSignUp ? displayName : username}
            onChange={(e) =>
              isSignUp
                ? setDisplayName(e.target.value)
                : setUsername(e.target.value)
            }
            placeholder="ユーザー名"
            style={{
              fontSize: "14px",
              border: "1px solid #eee",
              borderRadius: "4px",
              outline: "none",
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              backgroundColor: "transparent",
              color: "#333",
              boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            style={{
              fontSize: "14px",
              border: "1px solid #eee",
              borderRadius: "4px",
              outline: "none",
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              backgroundColor: "transparent",
              color: "#333",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={isSignUp ? handleSignUp : handleSignIn}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "12px",
              cursor: "pointer",
              marginBottom: "8px",
            }}
          >
            {isSignUp ? "新規登録" : "ログイン"}
          </button>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError("");
            }}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "12px",
              cursor: "pointer",
              backgroundColor: "#fff",
              border: "1px solid #ddd",
            }}
          >
            {isSignUp ? "ログイン画面へ" : "新規登録へ"}
          </button>
          {authError && (
            <div
              style={{ marginTop: "8px", fontSize: "10px", color: "#d32f2f" }}
            >
              {authError}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 4px" }}>
      {/* ヘッダー部分 */}
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}
      >
        <button
          onClick={onBack}
          style={{
            marginRight: "8px",
            padding: "4px 8px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          ← 戻る
        </button>
        <h3 style={{ margin: 0 }}>マイページ</h3>
      </div>

      {/* ユーザー情報カード */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px",
          textAlign: "center",
          backgroundColor: "#fff",
        }}
      >
        {/* 名前入力欄 */}
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="名前を入力してください"
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              textAlign: "center",
              border: "none",
              borderBottom: "2px solid #eee",
              outline: "none",
              width: "100%",
              padding: "4px 0",
              backgroundColor: "transparent",
              color: "#333",
            }}
            onFocus={(e) => (e.target.style.borderBottomColor = "#2196F3")}
            onBlur={(e) => (e.target.style.borderBottomColor = "#eee")}
          />
          <div style={{ fontSize: "10px", color: "#888", marginTop: "4px" }}>
            タップして名前を変更
          </div>
        </div>

        {/* 統計情報 */}
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#666" }}>書いたメモ</div>
            <div
              style={{ fontWeight: "bold", fontSize: "18px", color: "#000" }}
            >
              {memoCount}
            </div>
          </div>
          <div style={{ borderLeft: "1px solid #eee" }}></div>
          <div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              もらったいいね
            </div>
            <div
              style={{ fontWeight: "bold", fontSize: "18px", color: "#000" }}
            >
              {totalLikes}
            </div>
          </div>
        </div>
      </div>

      {/* 書いたメモ一覧 */}
      <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
        最近のメモ ({memoCount})
      </h4>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {sortedMemos.map((memo) => (
          <li
            key={memo.id}
            style={{
              border: "1px solid #eee",
              borderRadius: "4px",
              padding: "8px",
              marginBottom: "8px",
              backgroundColor: memo.memoColor || "#f9f9f9",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                marginBottom: "4px",
                whiteSpace: "pre-wrap",
                color: "#333",
              }}
            >
              {memo.text}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#666",
                wordBreak: "break-all",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <div>🔗 {memo.url}</div>
              <div>
                <span>🕒 {memo.createdAt}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {memoCount === 0 && (
        <p style={{ textAlign: "center", color: "#888", fontSize: "12px" }}>
          まだメモがありません
        </p>
      )}
    </div>
  );
};

export default MyPage;
