console.log('content script loaded');

chrome.storage.local.get(['memos'], (res) => {
    MemoUpdate(res.memos);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.memos) MemoUpdate(changes.memos.newValue);
});

const MemoUpdate = (allMemos) => {
    document.querySelectorAll('.page-memo').forEach(e => e.remove());
    const currentUrl = location.href;
    const memos = (allMemos || []).filter(memo => memo.url === currentUrl);
    
    memos.forEach((memo, i) => {
        if (memo.isCanvas && memo.pasted) {
            renderCanvas(memo, i, allMemos);
            return;
        }
        if (!memo.pasted) return;

        const div = document.createElement('div');
        const header = document.createElement('div');
        const textarea = document.createElement('textarea');

        Object.assign(div.style, {
            position: 'absolute',
            top: `${memo.y ?? (120 + i * 80)}px`,
            left: `${memo.x ?? 120}px`,
            width: `${memo.width ?? 100}px`,
            height: `${memo.height ?? 50}px`,
            background: `${memo.memoColor || "#fff8b0"}`,
            padding: '20px 8px 8px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            zIndex: 999998,
            display: memo.hidden ? 'none' : 'block',
            boxSizing: 'border-box',
            resize: 'both',
            overflow: 'auto',
        });
        div.className = 'page-memo';

        Object.assign(header.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '20px',
            background: `${memo.memoColor || "#fff8b0"}`,
            cursor: 'grab',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '4px 4px 0 0',
        });
        Object.assign(textarea.style,{
            width:'100%',
            height:`${memo.height?memo.height-30:20}px`,
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
        });

        textarea.value = memo.text;
        textarea.addEventListener('change', () => {
            memo.text = textarea.value;
            saveMemoData(memo);
        });

        const controls = createControlButtons(memo, div);
        header.appendChild(controls);

        div.appendChild(header);
        div.appendChild(textarea);
        
        MemoDrag(header, div, memo);
        document.body.appendChild(div);

        // リサイズ保存用
        div.addEventListener('mouseup', () => {
            memo.width = div.offsetWidth;
            memo.height = div.offsetHeight;
            saveMemoData(memo);
        });
    });
};

const createControlButtons = (memo, div) => {
    const container = document.createElement('div');
    Object.assign(container.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        zIndex: 999999,
        display: 'flex',
        gap: '2px',
        padding: '2px'
    });

    const btnStyle = {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#555',
        padding: '0 4px',
        lineHeight: '16px',
    };

    const delBtn = document.createElement('button');
    delBtn.innerText = '×';
    delBtn.title = '削除';
    Object.assign(delBtn.style, btnStyle);
    delBtn.style.color = '#d32f2f';
    
    delBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('このメモを削除しますか？')) {
            div.remove();
            removeMemoData(memo.id);
        }
    });

    const hideBtn = document.createElement('button');
    hideBtn.innerText = '－';
    hideBtn.title = '非表示';
    Object.assign(hideBtn.style, btnStyle);

    hideBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    hideBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        div.style.display = 'none';
        memo.pasted = false;
        saveMemoData(memo);
    });

    container.appendChild(delBtn);
    container.appendChild(hideBtn);

    return container;
};

const saveMemoData = (targetMemo) => {
    chrome.storage.local.get(['memos'], res => {
        const memos = res.memos || [];
        const idx = memos.findIndex(m => m.id === targetMemo.id);
        if (idx !== -1) {
            memos[idx] = targetMemo;
            chrome.storage.local.set({ memos });
        }
    });
};

const removeMemoData = (id) => {
    chrome.storage.local.get(['memos'], res => {
        const memos = res.memos || [];
        const newMemos = memos.filter(m => m.id !== id);
        chrome.storage.local.set({ memos: newMemos });
    });
};

const MemoDrag = (el, target, memo) => {
    let offsetX = 0;
    let offsetY = 0;

    const onMouseMove = (e) => {
        target.style.left = `${e.clientX - offsetX}px`;
        target.style.top = `${e.clientY - offsetY}px`;
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        memo.x = target.offsetLeft;
        memo.y = target.offsetTop;
        saveMemoData(memo);
    };

    el.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;

        offsetX = e.clientX - target.offsetLeft;
        offsetY = e.clientY - target.offsetTop;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        e.preventDefault();
    });
};

const renderCanvas = (memo, i, allMemos) => {
    const div = document.createElement('div');
    div.className = 'page-memo';
    Object.assign(div.style, {
        position: 'absolute',
        top: `${memo.y ?? (120 + i * 80)}px`,
        left: `${memo.x ?? 120}px`,
        width: '500px',
        height: '500px',
        background: `${memo.memoColor || "#fff8b0"}`,
        border: '1px solid #ccc',
        borderRadius: '4px',
        zIndex: 999997,
        display: memo.hidden ? 'none' : 'block',
    });
    
    const header = document.createElement('div');
    header.style.height = '30px';
    header.style.display = 'flex';
    header.style.background = `${memo.memoColor || "#fff8b0"}`;
    header.style.cursor = 'grab';
    header.style.alignItems = 'center';
    header.style.padding = '0.8px';
    header.style.position = 'relative';

    const controls = createControlButtons(memo, div);
    header.appendChild(controls);

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    canvas.style.width = '300px';
    canvas.style.height = '300px';
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = memo.memoColor || "#fff8b0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (memo.imageData) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
        };
        img.src = memo.imageData;
    }
    ctx.fillStyle = "#000";
    ctx.font = "14px sans-serif";
    const lines = (memo.text || '').split('\n');
    lines.forEach((line, index) => {
        ctx.fillText(line, 10, 20 + index * 20);
    });

    div.appendChild(header);
    div.appendChild(canvas);
    MemoDrag(header, div, memo);
    drawCanvas(canvas, ctx, memo);
    document.body.appendChild(div);
    div.addEventListener('mouseup', () => {
        memo.width = div.offsetWidth;
        memo.height = div.offsetHeight;
        saveMemoData(memo);
    });
}

const drawCanvas = (canvas, ctx, memo) => {
    let drawing = false;
    canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    });
    const saveCanvas = () => {
        if (!memo) return;
        memo.imageData = canvas.toDataURL();
        saveMemoData(memo);
    }
    canvas.addEventListener('mouseup', () => {
        drawing = false;
        saveCanvas();
    });
    canvas.addEventListener('mouseleave', () => {
        drawing = false;
        saveCanvas();
    });
}