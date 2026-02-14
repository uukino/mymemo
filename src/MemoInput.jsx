function MemoInput({
  inputText,
  setInputText,
  editingId,
  saveMemo,
  shareMemo,
  handleCancel,
  shareMessage,
  shareError,
}) {
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
    </div>
  );
}

export default MemoInput;
