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
        const goodButton=document.createElement('button');
        goodButton.textContent='👍'+(memo.good||0);
        goodButton.onclick=()=>{
            memo.liked=memo.liked?false:true;
            memo.good=memo.good<0?0:memo.good||0;//goodの初期化,負の値防止
            console.log(memo.liked);
            memo.good += memo.liked ? 1 : -1;
            chrome.storage.local.set({memos:allMemos});
            console.log(memo.good);
        }
        goodButton.style.marginRight='4px';
        div.textContent = memo.text;
        div.className='page-memo';
        Object.assign(div.style, {
        position: 'absolute',
        top: `${memo.y??(120 + i * 80)}px`,
        left: `${memo.x??120}px`,
        background: `${memo.memoColor||"#fff8b0"}`,
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        zIndex: 999999,
        display: memo.hidden ? 'none' : 'block',
        whiteSpace: 'pre-wrap',
        });
        Object.assign(goodButton.style,{
            background: memo.liked?'#9b9898':'none',
            border:'1px solid #ccc',
            borderRadius:'10px',
            cursor:'pointer',
        });
        div.appendChild(goodButton);
        MemoDrag(div,div,memo);
        document.body.appendChild(div);
    });
};
const MemoDrag=(el,target,memo)=>{
    let offsetX=0;
    let offsetY=0;
    let isDrag=false;

    el.addEventListener('mousedown',(e)=>{
        isDrag=true;
        offsetX=e.clientX-target.offsetLeft;
        offsetY=e.clientY-target.offsetTop;
        el.style.cursor='grabbing';
        e.preventDefault();
    });
    document.addEventListener('mousemove',(e)=>{
        if(!isDrag)return;
        target.style.left=`${e.clientX-offsetX}px`;
        target.style.top=`${e.clientY-offsetY}px`;
    });
    document.addEventListener('mouseup',()=>{
        if(!isDrag)return;
        isDrag=false;
        target.style.cursor='grab';
        memo.x=target.offsetLeft;
        memo.y=target.offsetTop;
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
        zIndex:999999,
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