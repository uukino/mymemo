import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const PUBLIC_USER_ID = import.meta.env.VITE_PUBLIC_USER_ID || "";

function App() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [memos, setMemos] = useState([]); // 全てのメモ
  const [viewMode, setViewMode] = useState("local");
  const [remoteMemos, setRemoteMemos] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState("");
  const [inputText, setInputText] = useState("");
  const [editingId, setEditingId] = useState(null); // 編集中のメモID

  // 1. 初回ロード時に現在のURLを取得し、保存されたメモを読み込む
  useEffect(() => {
    // Chrome拡張環境下かどうかチェック
    if (typeof chrome !== "undefined" && chrome.tabs) {
      // 現在のタブのURLを取得
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          const url = tabs[0].url;
          setCurrentUrl(url);
          loadMemos(); // URL取得後にメモをロード
        }
      });
    } else {
      // 開発用（ブラウザで直接開いた場合）のダミー
      setCurrentUrl("http://localhost");
    }
  }, []);

  useEffect(() => {
    if (viewMode !== "remote" || !currentUrl) return;
    void fetchRemoteMemos();
  }, [viewMode, currentUrl]);

  // 2. ローカルストレージからメモを読み込む関数
  const loadMemos = () => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["memos"], (result) => {
        if (result.memos) {
          setMemos(result.memos);
        }
      });
    }
  };

  // 3. メモを保存・更新する関数
  const saveMemo = () => {
    const text = inputText.trim();
    if (!text) return;

    let newMemos;
    const now = new Date().toLocaleString();

    if (editingId) {
      // 編集モード：既存のメモを更新
      newMemos = memos.map((memo) =>
        memo.id === editingId ? { ...memo, text, updatedAt: now } : memo,
      );
      setEditingId(null);
    } else {
      // 新規作成モード
      const newMemo = {
        id: Date.now(),
        url: currentUrl,
        text,
        createdAt: now,
        updatedAt: now,
      };
      newMemos = [...memos, newMemo];
    }

    // ReactのState更新
    setMemos(newMemos);
    setInputText("");

    // Chrome Storageに保存
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ memos: newMemos }, () => {
        console.log("Saved");
      });
    }
  };

  const shareMemo = async () => {
    const trimmed = inputText.trim();
    const fallbackMemo = memos.filter((memo) => memo.url === currentUrl).at(-1);
    const text = trimmed || fallbackMemo?.text || "";
    if (!text) return;
    setShareMessage("");
    setShareError("");
    try {
      const payload = {
        url: currentUrl,
        text,
      };
      if (PUBLIC_USER_ID) {
        payload.user_id = PUBLIC_USER_ID;
      }

      const response = await fetch(`${API_BASE}/memos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API error: ${response.status}`);
      }
      setShareMessage("共有しました");
    } catch (error) {
      console.warn("DB保存に失敗しました", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "DB保存に失敗しました";
      setShareError(message);
    }
  };

  const fetchRemoteMemos = async () => {
    if (!currentUrl) return;
    setRemoteLoading(true);
    setRemoteError("");
    try {
      const response = await fetch(
        `${API_BASE}/memos?url=${encodeURIComponent(currentUrl)}`,
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setRemoteMemos(Array.isArray(data) ? data : []);
    } catch (error) {
      setRemoteError("取得に失敗しました");
      setRemoteMemos([]);
    } finally {
      setRemoteLoading(false);
    }
  };

  // 4. 編集ボタンを押した時の処理
  const handleEdit = (memo) => {
    setInputText(memo.text);
    setEditingId(memo.id);
  };

  // 5. キャンセルボタン処理
  const handleCancel = () => {
    setInputText("");
    setEditingId(null);
  };

  // 現在のURLに紐づくメモだけをフィルタリングして表示
  const currentPageMemos = memos.filter((memo) => memo.url === currentUrl);

  const currentList = viewMode === "remote" ? remoteMemos : currentPageMemos;

  const formatTimestamp = (memo) =>
    memo.updated_at ||
    memo.updatedAt ||
    memo.created_at ||
    memo.createdAt ||
    "";

  return (
    <div style={{ width: "300px", padding: "16px", fontFamily: "sans-serif" }}>
      <div style={{display: "flex", alignItems: "center", marginBottom: "12px"}}>
        <h2>📝 URL Memo</h2>
        <button onClick={()=>{
          console.log("toggle all memo");
          chrome.storage.local.get(['memos'],res=>{
            const memos=res.memos||[];
            memos.forEach(m=>{
              console.log(m)
              m.hidden=m.hidden?false:true;
          });
            console.log(memos);
            chrome.storage.local.set({memos});
            console.log(memos);
          });
        }}>&times;</button>
        <button onClick={()=>{
          chrome.storage.local.get(['memos'],res=>{
            const memos=res.memos||[];
            memos.forEach(m=>{
              console.log(m);
              if(!m.liked)m.hidden=m.hidden?false:true;
            });
            console.log("delete all memo");
            chrome.storage.local.set({memos});
          });
      }}><span style={{fontSize:"12px"}}>&times;</span></button>
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button
          onClick={() => setViewMode("local")}
          style={{ flex: 1, background: viewMode === "local" ? "#ddd" : "" }}
        >
          ローカル
        </button>
        <button
          onClick={() => setViewMode("remote")}
          style={{ flex: 1, background: viewMode === "remote" ? "#ddd" : "" }}
        >
          リモート
        </button>
      </div>

      {/* URL表示エリア */}
      <div
        style={{
          fontSize: "12px",
          color: "#666",
          marginBottom: "10px",
          wordBreak: "break-all",
        }}
      >
        Current: {currentUrl}
      </div>

      {viewMode === "local" && (
        <>
          {/* 入力エリア */}
          <textarea
            style={{
              width: "100%",
              height: "80px",
              marginBottom: "8px",
              boxSizing: "border-box",
            }}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="メモを入力..."
          />

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button onClick={saveMemo} style={{ flex: 1 }}>
              {editingId ? "更新する" : "保存する"}
            </button>
            <button onClick={shareMemo} style={{ flex: 1 }}>
              共有
            </button>
            {editingId && (
              <button onClick={handleCancel} style={{ background: "#ccc" }}>
                キャンセル
              </button>
            )}
          </div>
          {shareMessage && (
            <p style={{ color: "#2b7", fontSize: "12px" }}>{shareMessage}</p>
          )}
          {shareError && (
            <p style={{ color: "#c00", fontSize: "12px" }}>{shareError}</p>
          )}
        </>
      )}

      {viewMode === "remote" && (
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={fetchRemoteMemos}
            style={{ width: "100%" }}
            disabled={remoteLoading}
          >
            {remoteLoading ? "読み込み中..." : "リモート更新"}
          </button>
          {remoteError && (
            <p style={{ color: "#c00", fontSize: "12px" }}>{remoteError}</p>
          )}
        </div>
      )}

      <hr />

      {/* リスト表示エリア */}
      <h3>このページのメモ一覧 ({currentList.length})</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {currentList.map((memo) => (
          <li
            key={memo.id}
            style={{
              border: "1px solid #eee",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "4px",
              backgroundColor: "#f9f9f9",
              color: "#333",
            }}
          >
            <div style={{ whiteSpace: "pre-wrap", marginBottom: "4px" }}>
              {memo.text}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "10px", color: "#888" }}>
                {formatTimestamp(memo)}
              </span>
              {viewMode === "remote" ? (
                <span style={{ fontSize: "10px", color: "#888" }}>
                  {memo.user_id ? `by ${memo.user_id}` : ""}
                </span>
              ) : (
                <button
                  onClick={() => handleEdit(memo)}
                  style={{ fontSize: "12px", padding: "2px 8px" }}
                >
                  編集
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {currentList.length === 0 && (
        <p style={{ textAlign: "center", color: "#888" }}>メモはありません</p>
      )}
    </div>
  );
}

export default App;
