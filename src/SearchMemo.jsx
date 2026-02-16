import { useState } from "react";
import MemoList from "./MemoList";

function SearchMemo({
  memos,
  formatTimestamp,
  handleEdit,
  pasteMemo,
  changeColor,
  deleteMemo,
}) {
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState("all"); // "all", "text", "tag"

  // 検索ロジック
  const filteredMemos = memos.filter((memo) => {
    if (!searchText.trim()) return false; // 入力がないときは何も表示しない

    const q = searchText.toLowerCase();
    const textMatch = memo.text && memo.text.toLowerCase().includes(q);
    const tagMatch =
      memo.tags && memo.tags.some((t) => t.toLowerCase().includes(q));

    if (searchType === "text") return textMatch;
    if (searchType === "tag") return tagMatch;
    return textMatch || tagMatch; // "all" の場合はどちらかにヒットすればOK
  });

  return (
    <div>
      <div
        style={{
          marginBottom: "12px",
          padding: "8px",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
          color: "#333", // ★修正: 文字色を黒にして見やすくする
        }}
      >
        {/* 検索ボックス */}
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="検索ワードを入力..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px",
            marginBottom: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "#fff", // 入力欄の背景も白に固定
            color: "#000",
          }}
        />

        {/* 検索タイプの切り替え */}
        <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="radio"
              name="searchType"
              checked={searchType === "all"}
              onChange={() => setSearchType("all")}
              style={{ marginRight: "4px" }}
            />
            すべて
          </label>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="radio"
              name="searchType"
              checked={searchType === "text"}
              onChange={() => setSearchType("text")}
              style={{ marginRight: "4px" }}
            />
            本文
          </label>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="radio"
              name="searchType"
              checked={searchType === "tag"}
              onChange={() => setSearchType("tag")}
              style={{ marginRight: "4px" }}
            />
            タグ
          </label>
        </div>
      </div>

      {/* 検索結果の表示 */}
      {searchText.trim() && (
        <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
          検索結果: {filteredMemos.length} 件
        </div>
      )}

      <MemoList
        viewMode="search" // ドラッグハンドルを隠すために search モードを指定
        currentList={filteredMemos}
        formatTimestamp={formatTimestamp}
        handleEdit={handleEdit}
        pasteMemo={pasteMemo}
        changeColor={changeColor}
        deleteMemo={deleteMemo}
      />
    </div>
  );
}

export default SearchMemo;