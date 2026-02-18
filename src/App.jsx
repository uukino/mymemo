import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import MemoInput from "./MemoInput";
import MemoList from "./MemoList";
import MyPage from "./MyPage";
import RemoteSearch from "./RemoteSearch";
import SearchMemo from "./SearchMemo";

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
  const [sortOrder, setSortOrder] = useState("desc");
  const [inputTags, setInputTags] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          setCurrentUrl(tabs[0].url);
        }
      });
    } else {
      setCurrentUrl("http://localhost");
    }
    loadMemosAndSettings();
  }, []);

  useEffect(() => {
    if (viewMode !== "remote" || !currentUrl) return;
    void fetchRemoteMemos();
  }, [viewMode, currentUrl]);

  const loadMemosAndSettings = () => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["memos", "sortOrder"], (result) => {
        if (result.memos) setMemos(result.memos);
        if (result.sortOrder) setSortOrder(result.sortOrder);
      });
    }
  };

  const updateMemos = (newMemos) => {
    setMemos(newMemos);
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ memos: newMemos });
    }
  };

  const saveMemo = () => {
    const text = inputText.trim();
    if (!text) return;
    const now = new Date().toLocaleString();
    let newMemos;

    if (editingId) {
      newMemos = memos.map((memo) =>
        memo.id === editingId ? { ...memo, text, tags: inputTags, updatedAt: now } : memo
      );
      setEditingId(null);
    } else {
      const newMemo = {
        id: Date.now(),
        url: currentUrl,
        text,
        tags: inputTags,
        createdAt: now,
        updatedAt: now,
        liked: false,
        hidden: false,
        good: 0,
        pasted: true,
        memoColor: "#fff8b0",
        isCanvas: false,
      };
      if (sortOrder === "asc") {
        newMemos = [...memos, newMemo];
      } else {
        newMemos = [newMemo, ...memos];
      }
    }
    updateMemos(newMemos);
    setInputText("");
    setInputTags([]);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = memos.findIndex((m) => m.id === active.id);
      const newIndex = memos.findIndex((m) => m.id === over.id);
      const newMemos = arrayMove(memos, oldIndex, newIndex);
      updateMemos(newMemos);

      if (sortOrder !== "manual") {
        setSortOrder("manual");
        if (typeof chrome !== "undefined" && chrome.storage) {
          chrome.storage.local.set({ sortOrder: "manual" });
        }
      }
    }
  };

  const handleSortChange = (e) => {
    const order = e.target.value;
    setSortOrder(order);

    if (order !== "manual") {
      const sortedMemos = [...memos].sort((a, b) => {
        if (order === "desc") return b.id - a.id;
        return a.id - b.id;
      });
      updateMemos(sortedMemos);
    }

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ sortOrder: order });
    }
  };

  const shareMemo = async () => {
    const trimmed = inputText.trim();
    const fallbackMemo = memos.filter((memo) => memo.url === currentUrl).at(0);
    const text = trimmed || fallbackMemo?.text || "";
    if (!text) return;
    setShareMessage("");
    setShareError("");
    try {
      const payload = { url: currentUrl, text };
      if (PUBLIC_USER_ID) payload.user_id = PUBLIC_USER_ID;
      const response = await fetch(`${API_BASE}/memos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await response.text());
      setShareMessage("共有しました");
    } catch (error) {
      console.warn(error);
      setShareError("DB保存に失敗しました");
    }
  };

  const fetchRemoteMemos = async () => {
    if (!currentUrl) return;
    setRemoteLoading(true);
    setRemoteError("");
    try {
      const res = await fetch(`${API_BASE}/memos?url=${encodeURIComponent(currentUrl)}`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      setRemoteMemos(Array.isArray(data) ? data : []);
    } catch (e) {
      setRemoteError("取得失敗");
      setRemoteMemos([]);
    } finally {
      setRemoteLoading(false);
    }
  };

  const filterMemo = (memo) => {
    if (!memo) return;
    const updated = { ...memo, hidden: !memo.hidden };
    updateMemos(memos.map((m) => (m.id === memo.id ? updated : m)));
  };

  const makeCanvas = () => {
    const now = new Date().toLocaleString();
    const newCanvasMemo = {
      id: Date.now(),
      url: currentUrl,
      text: "",
      tags: [],
      createdAt: now,
      updatedAt: now,
      liked: false,
      hidden: false,
      good: 0,
      pasted: true,
      memoColor: "#ffffff",
      isCanvas: true,
    };
    updateMemos([newCanvasMemo, ...memos]);
  };

  const changeColor = (memo, e) => {
    const updated = { ...memo, memoColor: e.target.value };
    updateMemos(memos.map((m) => (m.id === memo.id ? updated : m)));
  };

  const pasteMemo = (memo) => {
    const updated = { ...memo, pasted: !memo.pasted };
    updateMemos(memos.map((m) => (m.id === memo.id ? updated : m)));
  };

  const deleteMemo = (id) => {
    if (!window.confirm("削除しますか？")) return;
    updateMemos(memos.filter((m) => m.id !== id));
    if (editingId === id) {
      setInputText("");
      setInputTags([]);
      setEditingId(null);
    }
  };

  const handleEdit = (memo) => {
    setInputText(memo.text);
    setInputTags(memo.tags || []);
    setEditingId(memo.id);
  };

  const handleCancel = () => {
    setInputText("");
    setInputTags([]);
    setEditingId(null);
  };

  const handleLike = async (memoId) => {
    /* リモート用機能省略 */
  };

  const currentPageMemos = memos.filter((memo) => memo.url === currentUrl);
  const currentList = viewMode === "remote" ? remoteMemos : currentPageMemos;

  const formatTimestamp = (memo) =>
    memo.updated_at || memo.updatedAt || memo.created_at || memo.createdAt || "";

  return (
    <div style={{ width: "300px", padding: "16px", fontFamily: "sans-serif", alignItems:"flex-start" }}>
      <div
        style={{ display: "flex", marginBottom: "12px", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <h2>📝 URL Memo</h2>
        <button onClick={() => filterMemo(memos.find((m) => m.url === currentUrl))}>&times;</button>
        <button onClick={makeCanvas}>お絵描き</button>
      </div>

      {/* ★修正: 選択中のボタンの文字色を黒(#333)にする処理を追加 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button 
          onClick={() => setViewMode("local")} 
          style={{ 
            flex: 1, 
            background: viewMode === "local" ? "#ddd" : "",
            color: viewMode === "local" ? "#333" : "" 
          }}
        >
          オフライン
        </button>
        <button 
          onClick={() => setViewMode("remote")} 
          style={{ 
            flex: 1, 
            background: viewMode === "remote" ? "#ddd" : "",
            color: viewMode === "remote" ? "#333" : "" 
          }}
        >
          オンライン
        </button>
        <button 
          onClick={() => setViewMode("search")} 
          style={{ 
            flex: 1, 
            background: viewMode === "search" ? "#ddd" : "",
            color: viewMode === "search" ? "#333" : "" 
          }}
        >
          検索
        </button>
        <button 
          onClick={() => setViewMode("mypage")} 
          style={{ 
            flex: 1, 
            background: viewMode === "mypage" ? "#ddd" : "",
            color: viewMode === "mypage" ? "#333" : "" 
          }}
        >
          マイページ
        </button>
      </div>

      {viewMode !== "search" && (
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px", wordBreak: "break-all" }}>
          Current: {currentUrl}
        </div>
      )}

      {viewMode === "mypage" ? (
        <MyPage onBack={() => setViewMode("local")} memos={memos} />
      ) : viewMode === "search" ? (
        <SearchMemo
          memos={memos}
          formatTimestamp={formatTimestamp}
          handleEdit={(memo) => {
            handleEdit(memo);
            setViewMode("local");
          }}
          pasteMemo={pasteMemo}
          changeColor={changeColor}
          deleteMemo={deleteMemo}
        />
      ) : (
        <>
          {viewMode === "local" && (
            <MemoInput
              inputText={inputText}
              setInputText={setInputText}
              inputTags={inputTags}
              setInputTags={setInputTags}
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
              <button onClick={fetchRemoteMemos} style={{ width: "100%" }} disabled={remoteLoading}>
                {remoteLoading ? "読み込み中..." : "リモート更新"}
              </button>
              <RemoteSearch apiBase={API_BASE} onResults={setRemoteMemos} />
              {remoteError && <p style={{ color: "#c00", fontSize: "12px" }}>{remoteError}</p>}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
            <select value={sortOrder} onChange={handleSortChange} style={{ padding: "4px", fontSize: "12px" }}>
              <option value="desc">▼ 新しい順</option>
              <option value="asc">▲ 古い順</option>
              <option value="manual">≡ 手動(ドラッグ)</option>
            </select>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <MemoList
              viewMode={viewMode}
              currentList={currentList}
              formatTimestamp={formatTimestamp}
              handleEdit={handleEdit}
              pasteMemo={pasteMemo}
              changeColor={changeColor}
              deleteMemo={deleteMemo}
              handleLike={handleLike}
              filterMemo={filterMemo}
            />
          </DndContext>
        </>
      )}
    </div>
  );
}

export default App;