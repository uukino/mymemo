import { useState } from "react";

function MemoInput({
  inputText,
  setInputText,
  inputTags,      
  setInputTags,   
  editingId,
  saveMemo,
  shareMemo,
  handleCancel,
  shareMessage,
  shareError,
}) {
  const [tagText, setTagText] = useState("");

  // タグ追加処理
  const handleAddTag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 改行を防ぐ
      const newTag = tagText.trim();
      if (newTag && !inputTags.includes(newTag)) {
        setInputTags([...inputTags, newTag]);
        setTagText("");
      }
    }
  };

  // タグ削除処理
  const removeTag = (tagToRemove) => {
    setInputTags(inputTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div>
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

      {/* ★タグ入力・表示エリア */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "4px" }}>
          {inputTags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "12px",
                backgroundColor: "#e0e0e0",
                padding: "2px 6px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "#333"
              }}
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "12px",
                  color: "#666",
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagText}
          onChange={(e) => setTagText(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="タグを入力 (Enterで追加)"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "4px",
            fontSize: "12px",
            border: "1px solid #ccc",
            borderRadius: "4px"
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" ,padding: "0.6em 1.2em",}}>
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
    </div>
  );
}

export default MemoInput;