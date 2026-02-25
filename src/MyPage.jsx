import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

const MyPage = ({ onBack, localMemos = [], deleteMemo, pasteRemoteMemo }) => {
  const [name, setName] = useState("ゲストユーザー");
  const [authStatus, setAuthStatus] = useState("unauth");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userMemos, setUserMemos] = useState([]);
  const [memosLoading, setMemosLoading] = useState(false);
  const [memoTab, setMemoTab] = useState("online");

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

  useEffect(() => {
    if (userId) fetchUserMemos();
  }, [userId]);

  const fetchUserMemos = async () => {
    setMemosLoading(true);
    try {
      const res = await fetch(`${API_BASE}/memos?user_id=${userId}`);
      const data = await res.json();
      setUserMemos(Array.isArray(data) ? data : []);
    } catch {
      setUserMemos([]);
    } finally {
      setMemosLoading(false);
    }
  };

  const handleDeleteMemo = async (memoId) => {
    if (!window.confirm("このメモを削除しますか？")) return;
    try {
      const res = await fetch(`${API_BASE}/memos/${memoId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        setUserMemos((prev) => prev.filter((m) => m.id !== memoId));
      }
    } catch {
      // 削除失敗時は何もしない
    }
  };

  const handleOpenUrl = (url) => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    }
  };

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
      setUserId(data.id);
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
      if (!res.ok || !data.id) {
        setAuthError(data.error || "登録に失敗しました");
        return;
      }
      const userName = data.display_name || data.email;
      setAuthStatus("auth");
      setUserId(data.id);
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
    setUserId("");
    setName("ゲストユーザー");
    setUserMemos([]);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ userName: newName });
    }
  };

  const memoCount = userMemos.length;
  const totalLikes = userMemos.reduce((sum, memo) => sum + (memo.good || 0), 0);

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
            <div style={{ fontSize: "12px", color: "#666" }}>投稿したメモ</div>
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

      {/* タブ切り替え */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
        <button
          onClick={() => setMemoTab("online")}
          style={{
            flex: 1,
            padding: "6px",
            fontSize: "12px",
            cursor: "pointer",
            background: memoTab === "online" ? "#ddd" : "#fff",
            border: "1px solid #ddd",
            borderRadius: "4px",
            color: memoTab === "online" ? "#333" : "#666",
          }}
        >
          オンライン ({memoCount})
        </button>
        <button
          onClick={() => setMemoTab("local")}
          style={{
            flex: 1,
            padding: "6px",
            fontSize: "12px",
            cursor: "pointer",
            background: memoTab === "local" ? "#ddd" : "#fff",
            border: "1px solid #ddd",
            borderRadius: "4px",
            color: memoTab === "local" ? "#333" : "#666",
          }}
        >
          ローカル ({localMemos.length})
        </button>
      </div>

      {/* ── オンラインメモ一覧 ── */}
      {memoTab === "online" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
            <button
              onClick={fetchUserMemos}
              disabled={memosLoading}
              style={{ fontSize: "11px", padding: "2px 8px", cursor: "pointer" }}
            >
              {memosLoading ? "読込中..." : "更新"}
            </button>
          </div>
          {memosLoading && (
            <p style={{ textAlign: "center", color: "#888", fontSize: "12px" }}>
              読み込み中...
            </p>
          )}
          <ul style={{ listStyle: "none", padding: 0 }}>
            {userMemos.map((memo) => (
              <li
                key={memo.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "4px",
                  padding: "8px",
                  marginBottom: "8px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <div style={{ fontSize: "13px", marginBottom: "6px", whiteSpace: "pre-wrap", color: "#333" }}>
                  {memo.text}
                </div>
                <button
                  onClick={() => handleOpenUrl(memo.url)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    fontSize: "10px", color: "#2196F3", background: "none",
                    border: "none", padding: "2px 0", cursor: "pointer",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginBottom: "4px",
                  }}
                  title={memo.url}
                >
                  🔗 {memo.url}
                </button>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "10px", color: "#999" }}>
                    <span>🕒 {new Date(memo.created_at).toLocaleString()}</span>
                    <span style={{ marginLeft: "8px" }}>♥ {memo.good || 0}</span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => pasteRemoteMemo(memo)}
                      style={{
                        fontSize: "10px", padding: "2px 6px", cursor: "pointer",
                        backgroundColor: "#e8f5e9", border: "1px solid #a5d6a7",
                        borderRadius: "3px", color: "#2e7d32",
                      }}
                    >
                      貼付
                    </button>
                    <button
                      onClick={() => handleDeleteMemo(memo.id)}
                      style={{
                        fontSize: "10px", padding: "2px 6px", cursor: "pointer",
                        backgroundColor: "#fff", border: "1px solid #ffcdd2",
                        borderRadius: "3px", color: "#e53935",
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {!memosLoading && memoCount === 0 && (
            <p style={{ textAlign: "center", color: "#888", fontSize: "12px" }}>
              まだ投稿したメモがありません
            </p>
          )}
        </>
      )}

      {/* ── ローカルメモ一覧 ── */}
      {memoTab === "local" && (
        <>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {localMemos.map((memo) => (
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
                <div style={{ fontSize: "13px", marginBottom: "6px", whiteSpace: "pre-wrap", color: "#333" }}>
                  {memo.text}
                </div>
                <button
                  onClick={() => handleOpenUrl(memo.url)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    fontSize: "10px", color: "#2196F3", background: "none",
                    border: "none", padding: "2px 0", cursor: "pointer",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginBottom: "4px",
                  }}
                  title={memo.url}
                >
                  🔗 {memo.url}
                </button>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "10px", color: "#999" }}>
                    🕒 {memo.updatedAt || memo.createdAt || ""}
                  </div>
                  <button
                    onClick={() => deleteMemo(memo.id)}
                    style={{
                      fontSize: "10px", padding: "2px 6px", cursor: "pointer",
                      backgroundColor: "#fff", border: "1px solid #ffcdd2",
                      borderRadius: "3px", color: "#e53935",
                    }}
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {localMemos.length === 0 && (
            <p style={{ textAlign: "center", color: "#888", fontSize: "12px" }}>
              ローカルにメモがありません
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default MyPage;
