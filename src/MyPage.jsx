import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
const supabaseReady = Boolean(supabase);

const MyPage = ({ onBack, memos = [] }) => {
  const [name, setName] = useState("ゲストユーザー");
  const [authStatus, setAuthStatus] = useState("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [supabaseUpdateError, setSupabaseUpdateError] = useState("");

  // 初回ロード時に認証状態を確認
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setAuthStatus("auth");
        setName(data.session.user?.email || "ゲストユーザー");
      } else {
        setAuthStatus("unauth");
      }
    });
  }, []);

  const handleSignIn = async () => {
    setAuthError("");
    if (!supabase || !email || !password) {
      setAuthError("メールアドレスとパスワードを入力してください");
      return;
    }
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setAuthError(`ログイン失敗: ${error.message}`);
      return;
    }
    setAuthStatus("auth");
    setName(data.user?.email || "ゲストユーザー");
  };

  const handleSignUp = async () => {
    setAuthError("");
    if (!supabase || !email || !password) {
      setAuthError("メールアドレスとパスワードを入力してください");
      return;
    }
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setAuthError(`登録失敗: ${error.message}`);
      return;
    }
    setAuthStatus("auth");
    setName(data.user?.email || "ゲストユーザー");
  };

  // 名前が変更されたら保存
  const handleNameChange = async (e) => {
    const newName = e.target.value;
    setName(newName);
    setSupabaseUpdateError("");

    if (supabase && memos.length > 0) {
      const memoIds = memos.map((m) => m.id);
      const { error } = await supabase
        .from("memos")
        .update({ user_id: newName })
        .in("id", memoIds);
      if (error) {
        setSupabaseUpdateError(
          "Supabase更新に失敗しました。RLS設定を確認してください。",
        );
      }
    }
  };

  // 統計情報の計算
  const memoCount = memos.length;
  const totalLikes = memos.reduce((sum, memo) => sum + (memo.good || 0), 0);

  // 日付順（新しい順）に並び替え
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
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginBottom: "8px",
            }}
          >
            メールアドレスでログイン
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
            onClick={handleSignIn}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "12px",
              cursor: "pointer",
              marginBottom: "8px",
            }}
          >
            ログイン
          </button>
          <button
            onClick={handleSignUp}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "12px",
              cursor: "pointer",
              backgroundColor: "#fff",
              border: "1px solid #ddd",
            }}
          >
            新規登録
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
          {supabaseUpdateError && (
            <div
              style={{ fontSize: "10px", color: "#d32f2f", marginTop: "4px" }}
            >
              {supabaseUpdateError}
            </div>
          )}
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
            onClick={() => window.open(memo.url, "_blank")}
            style={{
              border: "1px solid #eee",
              borderRadius: "4px",
              padding: "8px",
              marginBottom: "8px",
              backgroundColor: memo.memoColor || "#f9f9f9",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {/* メモの内容 */}
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

            {/* メタ情報 */}
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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>🕒 {memo.createdAt}</span>
                {memo.good > 0 && <span>👍 {memo.good}</span>}
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
