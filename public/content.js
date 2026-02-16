console.log('content script loaded');

chrome.storage.local.get(['memos'], (res) => {
    MemoUpdate(res.memos);
});
chrome.storage.onChanged.addListener((changes,area)=>{
    if(area==='local'&&changes.memos) MemoUpdate(changes.memos.newValue)
})
const MemoUpdate=(allMemos)=>{
    document.querySelectorAll('.page-memo').forEach(e=>e.remove());
    const currentUrl=location.href;
    const memos = (allMemos||[]).filter(memo=>memo.url===currentUrl);
    console.log(memos);
    memos.forEach((memo, i) => {
        console.log(memo);
        console.log(memo.pasted);
        if(memo.isCanvas&&memo.pasted){
            renderCanvas(memo,i,allMemos);
            return;
        }
        if(!memo.pasted)return;
        const div = document.createElement('div');
        const header=document.createElement('div');
        const textarea=document.createElement('textarea');
        Object.assign(div.style, {
            position: 'absolute',
            top: `${memo.y??(120 + i * 80)}px`,
            left: `${memo.x??120}px`,
            width:`${memo.width??100}px`,
            height:`${memo.height??50}px`,
            background: `${memo.memoColor||"#fff8b0"}`,
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            zIndex: 999998,
            display: memo.hidden ? 'none' : 'block',
            whiteSpace: 'pre-wrap',
            resize: 'both',
            overflow: 'auto',
            boxSizing:'border-box',
        });
        div.className='page-memo';
        Object.assign(header.style,{
            height:'10px',
            display:'flex',
            background:`${memo.memoColor||"#fff8b0"}`,
            cursor:'grab',
            alignItems:'center',
            padding:'0.8px',
        });
        Object.assign(textarea.style,{
            width:'100%',
        });
        textarea.value=memo.text;
        textarea.addEventListener('change',()=>{
            memo.text=textarea.value;
            chrome.storage.local.get(['memos'], res => {
        const memos = res.memos || [];
        const idx = memos.findIndex(m => m.id === memo.id);
        if (idx !== -1) {
            memos[idx] = memo;
            chrome.storage.local.set({ memos });
        }
    });
        });
        div.appendChild(header);
        div.appendChild(textarea);
        MemoDrag(header,div,memo);
        document.body.appendChild(div);
        div.addEventListener('mouseup', () => {
            memo.width = div.offsetWidth;
            memo.height = div.offsetHeight;

            chrome.storage.local.get(['memos'], res => {
                const memos = res.memos || [];
                const idx = memos.findIndex(m => m.id === memo.id);
                if (idx !== -1) {
                    memos[idx] = memo;
                    chrome.storage.local.set({ memos });
                }
            });
        });
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

        chrome.storage.local.get(['memos'], res => {
            const memos = res.memos || [];
            const idx = memos.findIndex(m => m.id === memo.id);
            if (idx !== -1) {
                memos[idx] = memo;
                chrome.storage.local.set({ memos });
            }
        });
    };

    el.addEventListener('mousedown', (e) => {
        offsetX = e.clientX - target.offsetLeft;
        offsetY = e.clientY - target.offsetTop;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        e.preventDefault();
    });
};


const renderCanvas=(memo,i,allMemos)=>{
    const div = document.createElement('div');
    div.className='page-memo';
    Object.assign(div.style,{
        position:'absolute',
        top:`${memo.y??(120 + i * 80)}px`,
        left:`${memo.x??120}px`,
        width:'500px',
        height:'500px',
        background:`${memo.memoColor||"#fff8b0"}`,
        border:'1px solid #ccc',
        borderRadius:'4px',
        zIndex:999997,
        display:memo.hidden?'none':'block',
    });
    const header=document.createElement('div');
    header.style.height='30px';
    header.style.display='flex';
    header.style.background=`${memo.memoColor||"#fff8b0"}`;
    header.style.cursor='grab';
    header.style.alignItems='center';
    header.style.padding='0.8px';

    const canvas=document.createElement('canvas');
    canvas.width=500;
    canvas.height=500;
    canvas.style.width='500px';
    canvas.style.height='500px';
    canvas.style.display='block';
    const ctx=canvas.getContext('2d');
    ctx.fillStyle=memo.memoColor||"#fff8b0";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    if(memo.imageData){
        const img=new Image();
        img.onload=()=>{
            ctx.drawImage(img,0,0);
        };
        img.src=memo.imageData;
    }
    ctx.fillStyle="#000";
    ctx.font="14px sans-serif";
    const lines=(memo.text||'').split('\n');
    lines.forEach((line,index)=>{
        ctx.fillText(line,10,20+index*20);
    });
    div.appendChild(header);
    div.appendChild(canvas);
    MemoDrag(header,div,memo);
    drawCanvas(canvas,ctx,memo);
    document.body.appendChild(div);
    div.addEventListener('mouseup',()=>{
    memo.width = div.offsetWidth;
    memo.height = div.offsetHeight;

    chrome.storage.local.get(['memos'],res=>{
        const memos=res.memos||[];
        const idx=memos.findIndex(m=>m.id===memo.id);
        if(idx!==-1){
            memos[idx]=memo;
            chrome.storage.local.set({memos});
        }
    });
});

}

const drawCanvas=(canvas,ctx,memo)=>{
    let drawing=false;
    canvas.addEventListener('mousedown',(e)=>{
        drawing=true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX,e.offsetY);
    });
    canvas.addEventListener('mousemove',(e)=>{
        if(!drawing)return;
        ctx.lineTo(e.offsetX,e.offsetY);
        ctx.stroke();
    });
    const saveCanvas=()=>{
        if(!memo)return;
        memo.imageData=canvas.toDataURL();
        chrome.storage.local.get(['memos'],res=>{
            const memos=res.memos||[];
            const idx=memos.findIndex(m=>m.id===memo.id);
            if(idx!==-1){
                memos[idx]=memo;
                chrome.storage.local.set({memos});
            }
        })
    }
    canvas.addEventListener('mouseup',()=>{
        drawing=false;
        saveCanvas();
    });
    canvas.addEventListener('mouseleave',()=>{
        drawing=false;
        saveCanvas();
    });
}