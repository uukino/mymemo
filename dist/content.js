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
        MemoDrag(div,memo);
        document.body.appendChild(div);
    });
};
const MemoDrag=(el,memo)=>{
    let offsetX=0;
    let offsetY=0;
    let isDrag=false;

    el.addEventListener('mousedown',(e)=>{
        isDrag=true;
        offsetX=e.clientX-el.offsetLeft;
        offsetY=e.clientY-el.offsetTop;
        el.style.cursor='grabbing';
        e.preventDefault();
    });
    document.addEventListener('mousemove',(e)=>{
        if(!isDrag)return;
        el.style.left=`${e.clientX-offsetX}px`;
        el.style.top=`${e.clientY-offsetY}px`;
    });
    document.addEventListener('mouseup',()=>{
        if(!isDrag)return;
        isDrag=false;
        el.style.cursor='grab';
        memo.x=el.offsetLeft;
        memo.y=el.offsetTop;
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