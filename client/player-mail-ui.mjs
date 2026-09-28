export function openPlayerMail({ call, location, postOfficeId, applyRewards, onClose = () => {} }) {
  let letters = [], selected = null, tab = 'unclaimed', busy = false, closed = false;
  const dialog = document.createElement('dialog'); dialog.className = 'gg-mail';
  const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = 'assets/ui/player-mail.css?v=20260914-compact'; document.head.append(style);
  document.body.append(dialog);
  const el = (tag, text, css) => { const n = document.createElement(tag); if(text !== undefined)n.textContent=text;if(css)n.className=css;return n; };
  const close = () => { if(closed)return;closed=true;dialog.remove();style.remove();onClose(); };
  const button = (label, fn, css='') => { const b=el('button',label,css);b.type='button';b.disabled=busy;b.onclick=fn;return b; };
  const message = el('p','','gg-mail-status'); message.setAttribute('role','status');
  const run = async fn => { if(busy||closed)return;busy=true;message.textContent='';render();try{await fn();}catch(e){message.textContent=e.message||'Could not connect. Your mail is safe.';}finally{busy=false;if(!closed)render();} };
  const load = async () => { const r=await call({action:'list'});letters=r.letters||[]; };
  const art = () => { const n=el('div',undefined,'gg-mail-envelope');n.setAttribute('aria-hidden','true');return n; };
  function render() {
    if(closed)return;
    dialog.replaceChildren();
    const header=el('header');header.append(el('h1','MAIL'),button('×',close,'gg-mail-close'));dialog.append(header);
    const content=el('div',undefined,'gg-mail-content');dialog.append(content);
    const footer=el('footer');
    if(selected){
      content.append(button('‹ Back to mail',()=>{selected=null;render();},'gg-mail-back'),art(),el('h2',selected.title),el('p','From: GrowGo','gg-mail-from'),el('p',selected.message,'gg-mail-paper'));
      const rewards=el('div',undefined,'gg-mail-rewards');
      const r=selected.reward||{};
      for(const [label,value]of [['XP',r.xp],['points',r.points],['coins',r.coins],...Object.entries(r.items||{}).map(([k,v])=>[k.replaceAll('_',' '),v])]) {
        if(value){const row=el('div',undefined,'gg-mail-reward');row.append(el('span',label),el('strong',String(value)));rewards.append(row);}
      }
      content.append(el('h2','Your rewards'),rewards);
      const collected=selected.status==='claimed';
      const collect=button(collected?'Collected ✓':busy?'Collecting…':'Collect rewards',()=>void run(async()=>{
        const r=await call({action:'collect',mailId:selected.id,postOfficeId,...location()});
        if(r.ok!==true)throw Error('Collection was not confirmed. Please try again.');
        applyRewards(r);selected.status='claimed';message.textContent='Rewards collected.';
      }),'gg-mail-collect');collect.disabled=busy||collected;footer.append(collect);
      footer.append(el('small','Within 200m of a post office or your mailbox.'));
    }else{
      content.append(art(),el('h2',`${letters.filter(l=>l.status==='unclaimed').length} deliveries waiting`));
      const tabs=el('nav');tabs.append(button('Waiting',()=>{tab='unclaimed';render();},tab==='unclaimed'?'active':''),button('Collected',()=>{tab='claimed';render();},tab==='claimed'?'active':''));content.append(tabs);
      const rows=letters.filter(l=>l.status===tab);
      for(const letter of rows)content.append(button(`${letter.title}  ›`,()=>{selected=letter;render();},'gg-mail-row'));
      if(!rows.length)content.append(el('p',busy?'Loading mail…':tab==='unclaimed'?'No mail waiting.':'No collected deliveries yet.'));
    }
    footer.append(message);dialog.append(footer);
  }
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  render();dialog.showModal();void run(load);
  return { close };
}
