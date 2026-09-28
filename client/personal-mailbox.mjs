export function createPersonalMailbox({getUid,call,position,getMap,L,pinHtml,openMail,refreshInventory,toast}) {
 let state=null,marker=null,key='',busy=false,menu=null;
 const own=()=>state?.uid===getUid()&&state?.mailbox?.owned===true;
 const close=()=>{menu?.remove();menu=null;};
 const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.style.cssText='font:inherit;padding:12px;margin:5px;border-radius:12px;border:1px solid #dbd69c;background:#246a60;color:white;min-height:44px';b.disabled=busy;b.onclick=e=>{e.stopPropagation();fn();};return b;};
 async function mutate(action){
   if(busy||!own())return;const uid=getUid();busy=true;close();refreshInventory();
   try{const r=await call({action,...(action==='deployMailbox'?position():{})});if(getUid()!==uid)return;
     if(!r.ok)throw Error('Mailbox change was not confirmed.');state={...state,mailbox:r.mailbox};draw();toast('Mailbox',action==='deployMailbox'?'Deployed at your location.':'Packed away in Inventory → Special.');
   }catch(e){toast('Mailbox',e.message||'Please try again.');}finally{busy=false;refreshInventory();}
 }
 const open=()=>{if(own()&&state.mailbox.deployed){close();openMail({id:`personal-mailbox:${getUid()}`});}};
 function options(){
   if(!own())return;close();menu=document.createElement('dialog');menu.style.cssText='color:#fff;background:#123d54;border:2px solid #ddd5a3;border-radius:22px;padding:20px;font:inherit;max-width:85vw';
   const title=document.createElement('h2');title.textContent='Personal mailbox';menu.append(button('×',close),title,button('Open Mail',open),button('Pack Away',()=>mutate('packMailbox')));
   menu.addEventListener('cancel',e=>{e.preventDefault();close();});menu.addEventListener('click',e=>{if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});document.body.append(menu);menu.showModal();
 }
 function draw(){
   const p=own()?state.mailbox.deployed:null,map=getMap();
   if(!map||!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)){marker?.remove();marker=null;key='';if(!own())close();return;}
   const next=JSON.stringify([getUid(),p.lat,p.lng,state.waiting]);if(marker&&key===next)return;
   marker?.remove();key=next;
   marker=L.marker([p.lat,p.lng],{keyboard:true,title:'Your personal mailbox',zIndexOffset:1800,icon:L.divIcon({className:'personal-mailbox-marker',iconSize:[64,100],iconAnchor:[32,100],html:`<div style="position:relative;width:64px;height:100px;user-select:none;-webkit-user-select:none;touch-action:none"><div style="position:absolute;left:11px;top:0;transform:scale(.65);transform-origin:top left">${pinHtml()}</div><img draggable="false" alt="Your mailbox" src="assets/map/personal-mailbox-v1.png" style="position:absolute;bottom:0;left:12px;width:40px;height:44px;object-fit:contain"></div>`})}).addTo(map);
   const el=marker.getElement();if(!el)return;let timer=null,start=null,suppress=0;
   const cancel=()=>{clearTimeout(timer);timer=null;};
   el.addEventListener('pointerdown',e=>{if(e.button!==0)return;start=[e.clientX,e.clientY];cancel();timer=setTimeout(()=>{suppress=Date.now()+1000;options();},550);});
   el.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start[0],e.clientY-start[1])>12)cancel();});
   for(const event of ['pointerup','pointercancel','pointerleave'])el.addEventListener(event,cancel);
   el.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();cancel();suppress=Date.now()+1000;options();});
   el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(Date.now()>suppress)open();},true);
 }
 function inventory(grid){
   grid.querySelector('[data-personal-mailbox]')?.remove();if(!own())return;
   const card=document.createElement('section');card.dataset.personalMailbox='true';card.className='inventory-card inventory-special-utility';
   const img=document.createElement('img');img.src='assets/map/personal-mailbox-v1.png';img.alt='Personal mailbox';img.width=56;img.height=56;
   const title=document.createElement('h3');title.textContent='Personal mailbox';const status=document.createElement('p');status.textContent=state.mailbox.deployed?'Deployed':'Packed away';card.title='1 owned · Account-bound';
   const action=button(state.mailbox.deployed?'Pack Away':'Deploy',()=>mutate(state.mailbox.deployed?'packMailbox':'deployMailbox'));action.removeAttribute('style');
   card.append(img,title,status,action);grid.prepend(card);
 }
 return {update(value){state=value;draw();refreshInventory();},draw,inventory};
}
