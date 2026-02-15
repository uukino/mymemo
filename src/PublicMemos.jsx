import { useEffect, useMemo, useState } from "react";

const DEFAULT_API_BASE = "http://localhost:3001";

function formatTimestamp(memo) {
  return (
    memo.updated_at || memo.updatedAt || memo.created_at || memo.createdAt || ""
  );
}

function App() {
  const apiBase = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE,
    [],
  );
  const [targetUrl, setTargetUrl] = useState("");
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url") || "";
    if (url) {
      setTargetUrl(url);
      void fetchMemos(url);
    }
  }, []);

  const fetchMemos = async (url) => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${apiBase}/memos?url=${encodeURIComponent(url)}`,
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setMemos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "読み込みに失敗しました");
      setMemos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    void fetchMemos(targetUrl);
  };

  const searchMemos = async (q) => {
    if (!q.trim()) return;
    setSearching(true);
    setError("");
    try {
      const response = await fetch(
        `${apiBase}/memos/search?q=${encodeURIComponent(q)}`,
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setMemos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "検索に失敗しました");
      setMemos([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    void searchMemos(query);
  };

  return (
    <div style={{ width: "360px", padding: "16px", fontFamily: "sans-serif" }}>
      <h2>🌐 Public URL Memo</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
          参照URL
        </div>
        <input
          style={{
            width: "100%",
            marginBottom: "8px",
            boxSizing: "border-box",
            padding: "6px 8px",
          }}
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://example.com"
        />
        <button type="submit" style={{ width: "100%" }} disabled={loading}>
          {loading ? "読み込み中..." : "メモを取得"}
        </button>
      </form>

      <form onSubmit={handleSearch}>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
          単語検索
        </div>
        <input
          style={{
            width: "100%",
            marginBottom: "8px",
            boxSizing: "border-box",
            padding: "6px 8px",
          }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索ワード"
        />
        <button type="submit" style={{ width: "100%" }} disabled={searching}>
          {searching ? "検索中..." : "検索"}
        </button>
      </form>

      <hr />

      <h3>他ユーザーのメモ一覧 ({memos.length})</h3>
      {error && <p style={{ color: "#c00", fontSize: "12px" }}>{error}</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {memos.map((memo) => (
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
              <span style={{ fontSize: "10px", color: "#888" }}>
                {memo.user_id ? `by ${memo.user_id}` : ""}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {!loading && memos.length === 0 && !error && (
        <p style={{ textAlign: "center", color: "#888" }}>メモはありません</p>
      )}
    </div>
  );
}

export default App;
