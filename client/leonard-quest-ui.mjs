import {LEONARD_DIALOGUE} from '../quest-factory/leonard-dialogue.mjs';
import {installLeonardPreparation} from './leonard-preparation.mjs';

// Personal quest decorations only. Never changes the map's normal pin store.
export function installLeonardQuestUI({uid,bridge,host}) {
 let run=null,busy=false,stopped=false,dialog=null;
 let preparation=null;
 let replay=false;
 const current=()=>!stopped&&bridge.getPlayerId()===uid&&bridge.isActive();
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const art=name=>`assets/quests/leonard/${['eggs','leonard-worried','leonard-happy','mr-van-zant','sticks'].includes(name)?name+'-transparent-v2':name}.png`;
 const panel=el('section');panel.className='gg-leonard-panel';
 document.getElementById('birdQuestPilotPanel')?.after(panel);
 const style=el('link');style.rel='stylesheet';style.href='assets/ui/leonard-quest.css?v=4';document.head.append(style);
 const button=(label,fn)=>{const b=el('button',label);b.type='button';b.disabled=busy;b.onclick=fn;return b;};
 const close=()=>{dialog?.remove();dialog=null;};
 function feedback(message,error=false){
  if(!dialog)return;
  let note=dialog.querySelector('[data-leonard-feedback]');
  if(!note){note=el('p');note.dataset.leonardFeedback='true';const content=dialog.querySelector('.gg-leonard-speech')||dialog;content.insertBefore(note,content.querySelector('button:not([aria-label])'));}
  note.setAttribute('role',error?'alert':'status');note.textContent=message;note.hidden=!message;
 }
 async function request(payload){
  if(!current())throw Error('Account changed');
  const result=await bridge.leonardQuest(payload);
  if(!current())throw Error('Account changed');
  if(!result.ok)throw Error('Quest action was not confirmed');
  if(result.replayEnded){window.location.reload();return result;}
  replay=result.replay===true;run=result.run;host.applyRewards(result);render();return result;
 }
 async function perform(fn){if(busy||!current())return;busy=true;feedback('Working…');render();try{await fn();feedback('');}catch(e){if(current()){const message=e.message||'Please try again. Your progress is saved.';if(dialog)feedback(message,true);else host.toast('Leonard',message);}}finally{busy=false;if(current())render();}}
 const act=async kind=>request({action:'progress',runId:run.runId,stage:run.stage,kind,
  ...(['craft-nest','use-nest'].includes(kind)?{}:host.audioPosition())});
 function dialogue(id){
  const d=LEONARD_DIALOGUE.find(x=>x.id===id);if(!d||!current())return;
  close();dialog=el('dialog');dialog.className='gg-leonard-dialog';
  const intro=['Bingles','Leonard','Mr. Van Zant'].includes(d.speaker);
  if(intro)dialog.classList.add('gg-leonard-intro');
  const content=intro?el('section'):dialog;
  if(intro){content.className='gg-leonard-speech';dialog.append(content);}
  const x=button('×',close);x.setAttribute('aria-label','Close');content.append(x);
  const img=el('img');img.alt=d.speaker;img.src=art(d.artwork==='bingles-pop-in'?'bingles':d.artwork);
  if(intro){img.className='gg-leonard-popin';dialog.append(img);}else content.append(img);
  const heading=el('h2',d.speaker);heading.id='gg-leonard-speaker';content.append(heading);dialog.setAttribute('aria-labelledby',heading.id);
  const text=el('p',d.text);text.className='gg-leonard-text';content.append(text);
  for(const b of d.buttons)content.append(button(b.label,()=>void perform(async()=>{
   switch(b.action){
    case 'show-leonard':{
     const position=host.audioPosition();
     if(!Number.isFinite(position?.latitude)||!Number.isFinite(position?.longitude))throw Error('Waiting for your location. Enable location access and try again.');
     if(!Number.isFinite(position.accuracyMetres)||position.accuracyMetres>100||position.accuracyMetres<0)throw Error('Your GPS location is not accurate enough yet. Move into the open and try again.');
     feedback('Finding Leonard and checking nearby quest locations… This can take up to a minute.');
     await request({action:'start',...position});close();host.focusBird({lat:run.actionLocations.leonard.latitude,lng:run.actionLocations.leonard.longitude});break;
    }
    case 'confirm-talk':await act('talk');close();break;
    case 'show-materials':dialogue('nest-materials');break;
    case 'request-cotton-purchase':await act('buy-cotton');dialogue('cotton-purchased');break;
    case 'open-crafting':close();host.openLeonardCrafting?.();break;
    case 'open-birdhouse':close();await host.openLeonardBirdhouse?.();break;
    default:close();
   }
  })));
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  document.body.append(dialog);dialog.showModal();
 }
 async function tap(id){await perform(async()=>{
  if(id==='leonard'){
   if(run.stage==='meet-leonard')dialogue('meet-leonard');
   else if(run.stage==='return-eggs'){await act('talk');dialogue('return-eggs');}
   else if(run.stage==='materials'){
    if(run.sticks===6&&run.cotton===6){await act('talk');dialogue('nest-recipe');}
    else dialogue('nest-materials');
   }else if(run.stage==='craft')dialogue('nest-recipe');
  }else if(id==='seller')dialogue('cotton-offer');
  else await request({action:'progress',runId:run.runId,stage:run.stage,
   kind:run.stage==='lost-eggs'?'collect-egg':'collect-stick',pinId:id,...host.audioPosition()});
 });}
 const stages={ 'meet-leonard':'Talk to Leonard','lost-eggs':'Find six eggs','return-eggs':'Return the eggs to Leonard',materials:'Collect six sticks and buy six cotton',craft:'Craft the nest',use:'Use the nest from Inventory',incubating:'Your egg is incubating',completed:'Your dove is in the Birdhouse' };
 function render(){
  if(!current())return;panel.replaceChildren(el('h3','A little help from my friends'));
  if(replay)panel.append(el('p','Test replay · original egg and hatch timer preserved · test coins only'),button('End replay — return to original quest',()=>void perform(()=>request({action:'end-replay'}))));
  if(!run)panel.append(button('Begin Leonard’s quest',()=>dialogue('introduction')));
  else{
   panel.append(el('p',stages[run.stage]||'Quest progress saved'));
   if(run.stage==='lost-eggs')panel.append(el('p',`${run.collectedEggPins.length} / 6 eggs`));
   if(run.stage==='materials')panel.append(el('p',`${run.sticks} / 6 sticks · ${run.cotton} / 6 cotton`));
   if(run.stage==='incubating')panel.append(el('p',`Hatches ${new Date(run.hatchAt).toLocaleString()}`),button('Check egg',()=>void perform(async()=>{await request({action:'hatch',runId:run.runId});dialogue('hatched');})));
   if(run.stage!=='completed'&&!replay)panel.append(button('Restart from a new location',()=>{
    if(window.confirm('Start over? All progress and items for this quest, including incubation, will be removed. Previously spent cotton coins are not refunded. Your other inventory and birds are unchanged.'))
      void perform(async()=>{await request({action:'restart',runId:run.runId});dialogue('introduction');});
   }));
  }
  const markers=[];
  if(run?.actionLocations&&!['incubating','completed'].includes(run.stage)){
   markers.push({id:'leonard',...run.actionLocations.leonard,art:art('leonard-normal-pin-v1')});
   const egg=run.stage==='lost-eggs',sticks=run.stage==='materials';
   if(egg||sticks){const ids=egg?run.locations.eggPins:run.locations.stickPins,done=egg?run.collectedEggPins:run.collectedStickPins;
    for(const id of ids.filter(id=>!done.includes(id)))markers.push({id,...run.actionLocations.targets[id],art:art(egg?'eggs':'sticks')});}
   if(run.stage==='materials'&&!run.cottonPurchased)markers.push({id:'seller',...run.actionLocations.seller,art:art('mr-van-zant-normal-pin-transparent-v2')});
  }
  host.showLeonardMarkers?.(markers,id=>void tap(id));host.refreshLeonardItems?.();
  // Dialog actions remain disabled during a request; re-enable after completion.
  dialog?.querySelectorAll('button').forEach(b=>b.disabled=busy&&b.getAttribute('aria-label')!=='Close');
 }
 function inventory(grid){
  grid.querySelector('[data-leonard-items]')?.remove();if(!current()||!run||run.stage==='completed')return;
  const card=el('section');card.dataset.leonardItems='true';card.className='inventory-card inventory-special-utility';
  const icon=el('img');icon.src=art(run.stage==='use'?'nest':'eggs');icon.alt='';icon.width=42;icon.height=42;
  card.append(icon,el('h3',run.stage==='incubating'?'Companion egg':'Leonard’s quest items'));
  for(const [key,label]of [['egg','Companion egg'],['sticks','Sticks'],['cotton','Quest cotton'],['nest','Bird nest']])if(run[key])card.append(el('p',`${label} ×${run[key]} · Quest only`));
  if(run.stage==='use'){
   if(replay)card.append(el('p','Replay complete — stops before incubation. Original egg preserved.'),button('End replay — return to original quest',()=>void perform(()=>request({action:'end-replay'}))));
   else card.append(button('Use nest',()=>void perform(async()=>{await act('use-nest');dialogue('incubate');})));
  }
  if(run.stage==='incubating')card.append(el('p',`Hatches ${new Date(run.hatchAt).toLocaleString()}`),button('Check egg',()=>void perform(async()=>{await request({action:'hatch',runId:run.runId});dialogue('hatched');})));
  grid.prepend(card);
 }
 function crafting(grid){
  grid.querySelector('[data-leonard-recipe]')?.remove();if(!current()||run?.stage!=='craft')return;
  const card=el('section');card.dataset.leonardRecipe='true';card.className='gg-leonard-panel';
  card.append(el('h3','Bird nest'),el('p','6 quest sticks + 6 quest cotton'),button('Craft nest',()=>void perform(async()=>{await act('craft-nest');host.toast('Nest crafted','Use your nest in Inventory → Special.');})));grid.prepend(card);
 }
 // One startup read; no periodic Firestore polling for incubation.
 void perform(async()=>{const status=await request({action:'status'});
  if(status.preparationEnabled&&current())preparation=installLeonardPreparation({current,position:()=>host.audioPosition(),prepare:p=>bridge.leonardQuest(p)});
  if(!run)dialogue('introduction');});
 return {inventory,crafting,stop(){stopped=true;preparation?.stop();close();panel.remove();style.remove();document.querySelectorAll('[data-leonard-items],[data-leonard-recipe]').forEach(node=>node.remove());host.showLeonardMarkers?.([],()=>{});}};
}
