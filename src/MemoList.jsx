function MemoList({ viewMode, currentList, formatTimestamp, handleEdit, pasteMemo, changeColor}) {
  return (
    <div>
      <hr />

      {/* リスト表示エリア */}
      <h3>このページのメモ一覧 ({currentList.length})</h3>
      <ul>
        {currentList.map((memo) => (
          <li key={memo.id}>
            <div>{memo.text}</div>
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
                <div>
                  <input type="color" value={memo.memoColor||"#fff8b0"} onChange={(e)=>{
                    changeColor(memo,e);
                  }}></input>
                  <button onClick={()=>pasteMemo(memo)}>
                    貼付
                  </button>
                <button
                  onClick={() => handleEdit(memo)}
                  style={{ fontSize: "12px", padding: "2px 8px" }}
                >
                  編集
                </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {currentList.length === 0 && <p>メモはありません</p>}
    </div>
  );
}

export default MemoList;
