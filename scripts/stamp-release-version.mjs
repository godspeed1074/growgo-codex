import fs from 'node:fs';import path from 'node:path';import{createHash}from'node:crypto';
export function compareVersions(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i]?1:-1;}return 0;}
export function verifyRelease(next,live){
 if(!/^\d+\.\d+\.\d+$/.test(next.version))throw Error('A numeric major.minor.patch version is required');
 if(!live)return;
 if(!/^\d+\.\d+\.\d+$/.test(live.version)||typeof live.hash!=='string')throw Error('Live version metadata is invalid');
 if(compareVersions(next.version,live.version)<0||(next.version===live.version&&next.hash!==live.hash))throw Error('Changed releases need a new version. Run npm run release:patch before publishing.');
}
export async function stampRelease(root,out){
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
 const hash=createHash('sha256');
 function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else{hash.update(path.relative(out,p));hash.update(fs.readFileSync(p));}}}walk(out);
 const release={version,hash:hash.digest('hex')};verifyRelease(release,null);
 if(process.env.VERCEL_ENV==='production'){
  const r=await fetch('https://growgo-account-profile.vercel.app/version.json?check='+Date.now(),{signal:AbortSignal.timeout(15000)});
  if(r.ok){const text=await r.text();if(text.trim().startsWith('{'))verifyRelease(release,JSON.parse(text));else if(!text.trim().startsWith('<'))throw Error('Could not verify live release version');}
  else if(r.status!==404)throw Error('Could not verify live release version: '+r.status);
 }
 fs.writeFileSync(path.join(out,'version.json'),JSON.stringify(release,null,2));
 const js=`globalThis.GROWGO_RELEASE=Object.freeze(${JSON.stringify(release)});document.addEventListener('DOMContentLoaded',()=>{const e=document.getElementById('growgoAppVersion');if(e)e.textContent='GrowGo v'+GROWGO_RELEASE.version+' · Alpha';});`;
 fs.writeFileSync(path.join(out,'release-version.js'),js);
 const index=path.join(out,'index.html');fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace('</head>',`<script src="release-version.js?v=${version}"></script>\n</head>`));
 console.log('GrowGo release v'+version);
}
