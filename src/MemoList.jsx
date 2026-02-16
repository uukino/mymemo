import React from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 個別のメモ（ドラッグ可能な行）コンポーネント
function SortableItem({
  memo,
  viewMode,
  formatTimestamp,
  handleEdit,
  pasteMemo,
  changeColor,
  deleteMemo,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: memo.id });

  // ★追加: アイテムクリック時の処理
  const handleItemClick = (e) => {
    // 検索モード以外は何もしない
    if (viewMode !== "search") return;

    // ボタンや入力フォーム、SVGアイコンのクリックならURL遷移しない
    const tagName = e.target.tagName.toUpperCase();
    if (["BUTTON", "INPUT", "SVG", "PATH"].includes(tagName)) return;

    // URLがあれば新しいタブで開く
    if (memo.url) {
      window.open(memo.url, "_blank");
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: "1px solid #eee",
    padding: "8px",
    marginBottom: "8px",
    borderRadius: "4px",
    backgroundColor: memo.memoColor || "#f9f9f9",
    color: "#333",
    display: "flex",
    gap: "8px",
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    touchAction: "none",
    // ★追加: 検索モードのときはカーソルを指にする
    cursor: viewMode === "search" ? "pointer" : "default",
  };

  return (
    <li ref={setNodeRef} style={style} onClick={handleItemClick}>
      {/* ▼ 三本線（ドラッグハンドル） - main由来 */}
      {viewMode === "local" && (
        <div
          {...attributes}
          {...listeners}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "grab",
            paddingRight: "4px",
            color: "#aaa",
          }}
        >
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
            <path d="M3 5h14v2H3V5zm0 6h14v2H3v-2zm0 6h14v2H3v-2z" />
          </svg>
        </div>
      )}

      {/* メモの中身エリア（幅いっぱい使う） */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {/* ★タグ表示エリア - addtags由来 */}
        {memo.tags && memo.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              marginBottom: "4px",
            }}
          >
            {memo.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "10px",
                  backgroundColor: "rgba(0,0,0,0.05)",
                  padding: "1px 5px",
                  borderRadius: "8px",
                  color: "#555",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

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
            <div style={{ display: "flex", gap: "4px" }}>
              <input
                type="color"
                value={memo.memoColor || "#fff8b0"}
                onChange={(e) => changeColor(memo, e)}
                style={{
                  width: "20px",
                  height: "20px",
                  border: "none",
                  padding: 0,
                }}
              />
              <button
                onClick={() => pasteMemo(memo)}
                style={{ fontSize: "12px", padding: "2px 8px" }}
              >
                貼付
              </button>

              <button
                onClick={() => handleEdit(memo)}
                style={{ fontSize: "12px", padding: "2px 8px" }}
              >
                編集
              </button>
              <button
                onClick={() => deleteMemo(memo.id)}
                style={{
                  fontSize: "12px",
                  padding: "2px 8px",
                  backgroundColor: "#ffebee",
                  color: "#c62828",
                  border: "1px solid #ffcdd2",
                  cursor: "pointer",
                }}
              >
                削除
              </button>
            </div>
          )}
        </div>

        {viewMode === "remote" && (
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>🕒 {formatTimestamp(memo)}</span>
              {viewMode === "remote" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike && handleLike(memo.id);
                  }}
                  style={{
                    padding: "2px 6px",
                    fontSize: "10px",
                    cursor: "pointer",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  👍 {memo.good || 0}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

// メインのリストコンポーネント
function MemoList({
  viewMode,
  currentList,
  formatTimestamp,
  handleEdit,
  pasteMemo,
  changeColor,
  deleteMemo,
  handleLike,
}) {
  return (
    <div>
      <hr />
      <h3>このページのメモ一覧 ({currentList.length})</h3>

      {/* ソート可能なリストのコンテキスト */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        <SortableContext
          items={currentList.map((memo) => memo.id)}
          strategy={verticalListSortingStrategy}
        >
          {currentList.map((memo) => (
            <SortableItem
              key={memo.id}
              memo={memo}
              viewMode={viewMode}
              formatTimestamp={formatTimestamp}
              handleEdit={handleEdit}
              pasteMemo={pasteMemo}
              changeColor={changeColor}
              deleteMemo={deleteMemo}
            />
          ))}
        </SortableContext>
      </ul>

      {currentList.length === 0 && (
        <p style={{ textAlign: "center", color: "#888" }}>メモはありません</p>
      )}
    </div>
  );
}

export default MemoList;
