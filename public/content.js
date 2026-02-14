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
    console.log(currentUrl);
    memos.forEach((memo, i) => {
        const div = document.createElement('div');
        div.textContent = memo.text;
        div.className='page-memo';
        Object.assign(div.style, {
        position: 'absolute',
        top: `${memo.y??(120 + i * 80)}px`,
        left: `${memo.x??120}px`,
        background: '#fff8b0',
        padding: '8px',
        border: '1px solid #ccc',
        zIndex: 999999,
        display: memo.hidden ? 'none' : 'block',
        });
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
                console.log(memos);
            }
        });
    });

}
