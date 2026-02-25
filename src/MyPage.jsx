import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

const MyPage = ({ onBack, memos = [] }) => {
  const [name, setName] = useState("ゲストユーザー");
  const [authStatus, setAuthStatus] = useState("unauth");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["userId", "userName"], (result) => {
        if (result.userId) {
          setAuthStatus("auth");
          setName(result.userName || "ゲストユーザー");
        }
      });
    }
  }, []);

  const handleSignIn = async () => {
    setAuthError("");
    if (!email || !password) {
      setAuthError("メールアドレスとパスワードを入力してください");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.id) {
        setAuthError("メールアドレスまたはパスワードが正しくありません");
        return;
      }
      const userName = data.display_name || data.email;
      setAuthStatus("auth");
      setName(userName);
      setEmail("");
      setPassword("");
      chrome.storage.local.set({ userId: data.id, userName });
    } catch {
      setAuthError("ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setAuthError("");
    if (!email || !password) {
      setAuthError("メールアドレスとパスワードを入力してください");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, display_name: displayName }),
      });
      const data = await res.json();
      if (res.status === 202) {
        setAuthError("確認メールを送信しました。メールを確認してください");
        return;
      }
      if (!res.ok || !data.id) {
        setAuthError(data.error || "登録に失敗しました");
        return;
      }
      const userName = data.display_name || data.email;
      setAuthStatus("auth");
      setName(userName);
      setEmail("");
      setPassword("");
      setDisplayName("");
      chrome.storage.local.set({ userId: data.id, userName });
    } catch {
      setAuthError("登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${API_BASE}/auth/signout`, { method: "POST" });
    } catch {
      // ネットワークエラーでもローカルのサインアウトは実行する
    }
    chrome.storage.local.remove(["userId", "userName"]);
    setAuthStatus("unauth");
    setName("ゲストユーザー");
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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
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
          {isSignUp && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名（任意）"
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
          )}
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
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "12px",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "8px",
            }}
          >
            {loading ? "処理中..." : isSignUp ? "新規登録" : "ログイン"}
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

        {/* ログアウトボタン */}
        <button
          onClick={handleSignOut}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "6px",
            fontSize: "12px",
            cursor: "pointer",
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            color: "#666",
          }}
        >
          ログアウト
        </button>
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
