import { useState } from "react";

function RemoteSearch({ apiBase, onResults }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setError("検索ワードを入力してください");
      return;
    }

    setSearching(true);
    setError("");
    try {
      const response = await fetch(
        `${apiBase}/memos?q=${encodeURIComponent(q)}`,
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      onResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("検索に失敗しました");
      onResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ marginTop: "8px" }}>
      <form onSubmit={handleSearch}>
        <input
          style={{
            width: "100%",
            marginBottom: "6px",
            boxSizing: "border-box",
            padding: "6px 8px",
          }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="単語検索"
        />
        <button type="submit" style={{ width: "100%" }} disabled={searching}>
          {searching ? "検索中..." : "検索"}
        </button>
      </form>

      {error && <p style={{ color: "#c00", fontSize: "12px" }}>{error}</p>}
    </div>
  );
}

export default RemoteSearch;
