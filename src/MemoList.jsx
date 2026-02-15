function MemoList({ viewMode, currentList, formatTimestamp, handleEdit, pasteMemo, changeColor, deleteMemo}) {

  return (
    <div>
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

                <div style={{ display: "flex", gap: "8px" }}>
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
                  <button
                    onClick={() => deleteMemo(memo.id)}
                    style={{
                      fontSize: "12px",
                      padding: "2px 8px",
                      backgroundColor: "#ffebee",
                      color: "#c62828",
                      border: "1px solid #ffcdd2",
                      cursor: "pointer"
                    }}
                  >
                    削除
                  </button>
                </div>
                /* ▲ 変更ここまで */
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

export default MemoList;