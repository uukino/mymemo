import React, { useState, useEffect } from "react";

const MyPage = ({ onBack, memos = [] }) => {
  const [name, setName] = useState("ゲストユーザー");

  // 1. 初回ロード時に保存された名前を読み込む
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["userName"], (result) => {
        if (result.userName) {
          setName(result.userName);
        }
      });
    }
  }, []);

  // 2. 名前が変更されたら保存する
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ userName: newName });
    }
  };

  // 3. 統計情報の計算
  const memoCount = memos.length;
  const totalLikes = memos.reduce((sum, memo) => sum + (memo.good || 0), 0);

  // 日付順（新しい順）に並び替え
  const sortedMemos = [...memos].sort((a, b) => b.id - a.id);

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
            {/* ★修正: 文字色を黒(#000)に指定 */}
            <div style={{ fontWeight: "bold", fontSize: "18px", color: "#000" }}>
              {memoCount}
            </div>
          </div>
          <div style={{ borderLeft: "1px solid #eee" }}></div>
          <div>
            <div style={{ fontSize: "12px", color: "#666" }}>もらったいいね</div>
            {/* ★修正: 文字色を黒(#000)に指定 */}
            <div style={{ fontWeight: "bold", fontSize: "18px", color: "#000" }}>
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
            // ★修正: クリックでURLを開く処理を追加
            onClick={() => window.open(memo.url, '_blank')}
            style={{
              border: "1px solid #eee",
              borderRadius: "4px",
              padding: "8px",
              marginBottom: "8px",
              backgroundColor: memo.memoColor || "#f9f9f9",
              cursor: "pointer", // ★修正: クリックできることがわかるようにカーソルを変更
            }}
            // ホバー時に少し色を変えてわかりやすくする（インラインスタイルでの簡易的な実装）
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            {/* メモの内容 */}
            <div
              style={{
                fontSize: "13px",
                marginBottom: "4px",
                whiteSpace: "pre-wrap",
                color: "#333"
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
                gap: "2px"
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