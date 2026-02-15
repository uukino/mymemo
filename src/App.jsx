import { useState, useEffect } from "react";
import MemoInput from "./MemoInput";
import MemoList from "./MemoList";

import MyPage from "./MyPage";
import RemoteSearch from "./RemoteSearch";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const PUBLIC_USER_ID = import.meta.env.VITE_PUBLIC_USER_ID || "";

function App() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [memos, setMemos] = useState([]);
  const [viewMode, setViewMode] = useState("local");
  const [remoteMemos, setRemoteMemos] = useState([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");
  const [inputText, setInputText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState("");

  // 1. 初回ロード時に現在のURLを取得し、保存されたメモを読み込む
  useEffect(() => {
    loadMemos();
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          const url = tabs[0].url;
          setCurrentUrl(url);
        }
      });
    } else {
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
      newMemos = memos.map((memo) =>
        memo.id === editingId ? { ...memo, text, updatedAt: now } : memo,
      );
      setEditingId(null);
    } else {
      const newMemo = {
        id: Date.now(),
        url: currentUrl,
        text,
        createdAt: now,
        updatedAt: now,
        liked: false,
        hidden: false,
        good: 0,
        pasted: false,
        memoColor: "#fff8b0",
      };
      newMemos = [...memos, newMemo];
    }

    setMemos(newMemos);
    setInputText("");

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

  const changeColor = (memo, e) => {
    memo.memoColor = e.target.value;
    const newMemos = memos.map((m) => (m.id === memo.id ? memo : m));
    chrome.storage.local.set({ memos: newMemos });
    setMemos(newMemos);
    console.log(newMemos);
  };
  const pasteMemo = (memo) => {
    memo.pasted = memo.pasted ? false : true;
    const newMemos = memos.map((m) => (m.id === memo.id ? memo : m));
    chrome.storage.local.set({ memos: newMemos });
    setMemos(newMemos);
    console.log(newMemos);
  };

  // メモを削除する関数
  const deleteMemo = (id) => {
    if (!window.confirm("このメモを削除してもよろしいですか？")) return;

    const newMemos = memos.filter((memo) => memo.id !== id);
    setMemos(newMemos);

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ memos: newMemos });
    }

    // 編集中のメモを削除した場合のリセット処理
    if (editingId === id) {
      setInputText("");
      setEditingId(null);
    }
  };

  const handleEdit = (memo) => {
    setInputText(memo.text);
    setEditingId(memo.id);
  };

  const handleCancel = () => {
    setInputText("");
    setEditingId(null);
  };

  const currentPageMemos = memos.filter((memo) => memo.url === currentUrl);
  const currentList = viewMode === "remote" ? remoteMemos : currentPageMemos;

  const formatTimestamp = (memo) =>
    memo.updated_at ||
    memo.updatedAt ||
    memo.created_at ||
    memo.createdAt ||
    "";

  return (
    <div
      style={{ width: "300px", padding: "16px", fontFamily: "sans-serif" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h2>📝 URL Memo</h2>
        <button
          onClick={() => {
            console.log("toggle all memo");
            chrome.storage.local.get(["memos"], (res) => {
              const memos = res.memos || [];
              memos.forEach((m) => {
                console.log(m);
                m.hidden = m.hidden ? false : true;
              });
              console.log(memos);
              chrome.storage.local.set({ memos });
              console.log(memos);
            });
          }}
        >
          &times;
        </button>
        <button
          onClick={() => {
            chrome.storage.local.get(["memos"], (res) => {
              const memos = res.memos || [];
              memos.forEach((m) => {
                console.log(m);
                if (!m.liked) m.hidden = m.hidden ? false : true;
              });
              console.log("delete all memo");
              chrome.storage.local.set({ memos });
            });
          }}
        >
          <span style={{ fontSize: "12px" }}>&times;</span>
        </button>
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
        <button
          onClick={() => setViewMode("mypage")}
          style={{ flex: 1, background: viewMode === "mypage" ? "#ddd" : "" }}
        >
          マイページ
        </button>
      </div>

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

      {viewMode === "mypage" ? (
        <MyPage onBack={() => setViewMode("local")} memos={memos} />
      ) : (
        /* ▼ ここからが viewMode !== 'mypage' のときの中身 ▼ */
        <>
          {viewMode === "local" && (
            <MemoInput
              inputText={inputText}
              setInputText={setInputText}
              editingId={editingId}
              saveMemo={saveMemo}
              shareMemo={shareMemo}
              handleCancel={handleCancel}
              shareMessage={shareMessage}
              shareError={shareError}
            />
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

          <RemoteSearch apiBase={API_BASE} onResults={setRemoteMemos} />
          {remoteError && (
            <p style={{ color: "#c00", fontSize: "12px" }}>{remoteError}</p>
          )}

          <MemoList
            viewMode={viewMode}
            currentList={currentList}
            formatTimestamp={formatTimestamp}
            handleEdit={handleEdit}
            pasteMemo={pasteMemo}
            changeColor={changeColor}
            deleteMemo={deleteMemo}
          />
        </>
      )
      }
    </div>
  );
}

export default App;