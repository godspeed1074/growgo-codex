import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { runtimeConfig } from '../config/runtimeConfig';
import { getAdminFirestore } from '../firebaseAdmin';
import { requireAuthenticated, requireAppCheckIfEnabled } from '../security/requireAuthenticated';
import { requireInvitedUserAccess } from '../security/requireInvitedUserAccess';
import { requireActiveDeviceSessionIfEnabled, verifyActiveDeviceSessionIfEnabled } from '../domain/players/activeDeviceSession';
import { asObject, assertAllowedKeys, requireString, requireFiniteNumber } from '../validation/requestValidation';
import { readStoredPlayerDocument, serializePlayerSnapshot } from '../domain/players/playerStore';
import { getPlayerLevelAfterXpGain } from '../domain/players/playerLeveling';
import { readMarketInventory, inventoryItemIds, MARKET_MAX_ITEM_QUANTITY } from '../domain/market/marketCatalog';
import { readLeaderboardScoreDocument, buildLeaderboardScoreDocument } from '../domain/leaderboards/leaderboardScoreStore';
import { getGrowGoUtcDayKey, getGrowGoSeasonAt } from '../domain/leaderboards/leaderboardPeriods';
import { SHARED_POI_PINS_COLLECTION, sharedWorldDocumentId } from '../domain/world/sharedWorld';
import { calculateHaversineDistanceMetres } from '../domain/pins/canonicalPinGenerator';

export async function playerMailHandler(request: CallableRequest<unknown>) {
 const {uid}=requireAuthenticated(request);requireAppCheckIfEnabled(request);requireInvitedUserAccess(request);
 if(request.auth?.token.email_verified!==true)throw new HttpsError('permission-denied','Verify your email first.');
 const p=asObject(request.data,'mail');assertAllowedKeys(p,['action','mailId','postOfficeId','latitude','longitude','accuracyMetres','deviceId'],'mail');
 const action=requireString(p.action,'action',1,16);
 const checkSession = action === 'badge' || action === 'list'
   ? verifyActiveDeviceSessionIfEnabled : requireActiveDeviceSessionIfEnabled;
 await checkSession({uid,deviceId:typeof p.deviceId==='string'?p.deviceId:undefined});
 const db=getAdminFirestore();
 const owner=db.collection('birdQuestPlayers').doc(uid),mail=owner.collection('mail');
 const mailboxRef=db.collection('personalMailboxes').doc(uid);
 if(action==='deployMailbox'||action==='packMailbox'){
   const deployed=action==='deployMailbox'?{
     lat:requireFiniteNumber(p.latitude,'latitude',-90,90),lng:requireFiniteNumber(p.longitude,'longitude',-180,180)
   }:null;
   if(deployed)requireFiniteNumber(p.accuracyMetres,'accuracyMetres',0,100);
   return db.runTransaction(async tx=>{
     const box=(await tx.get(mailboxRef)).data();
     if(box?.owned!==true)throw new HttpsError('permission-denied','You do not own a personal mailbox.');
     if(deployed&&box.deployed)throw new HttpsError('failed-precondition','Pack away your mailbox before moving it.');
     tx.update(mailboxRef,{deployed,updatedAt:Timestamp.now()});
     return {ok:true,mailbox:{owned:true,deployed}};
   });
 }
 if(action==='status'){
   const [waiting,box]=await Promise.all([mail.where('status','==','unclaimed').limit(1).get(),mailboxRef.get()]);
   const mailbox=box.data();
   return {ok:true,waiting:!waiting.empty,mailbox:mailbox?.owned===true?{owned:true,deployed:mailbox.deployed??null}:null};
 }
 if(action==='list'){
   const status='unclaimed';
   const [waiting,collected]=await Promise.all([mail.where('status','==',status).limit(50).get(),mail.where('status','==','claimed').limit(50).get()]);
   return {ok:true,letters:[...waiting.docs,...collected.docs].map(doc=>({id:doc.id,status:doc.data().status,
     title:typeof doc.data().title==='string'?doc.data().title.slice(0,160):'Dove quest reward',
     message:typeof doc.data().message==='string'?doc.data().message.slice(0,4000):'Your dove helped another player complete a quest. Here is your thank-you!',reward:doc.data().reward})),hasMore:waiting.size===50||collected.size===50};
 }
 if(action!=='collect')throw new HttpsError('invalid-argument','Unknown mail action');
 const id=requireString(p.mailId,'mailId',1,160);if(!/^[A-Za-z0-9_-]+$/.test(id))throw new HttpsError('invalid-argument','Invalid mail ID');
 const postId=requireString(p.postOfficeId,'postOfficeId',1,200);
 const location={latitude:requireFiniteNumber(p.latitude,'latitude',-90,90),longitude:requireFiniteNumber(p.longitude,'longitude',-180,180)};
 requireFiniteNumber(p.accuracyMetres,'accuracyMetres',0,100);
 return db.runTransaction(async tx=>{
   const letterRef=mail.doc(id),playerRef=db.collection('players').doc(uid),bagRef=db.collection('playerMarketInventories').doc(uid),scoreRef=db.collection('playerLeaderboardScores').doc(uid);
   const personal=postId===`personal-mailbox:${uid}`;
   const [letterDoc,playerDoc,bagDoc,scoreDoc,ownerDoc,poiDoc]=await Promise.all([tx.get(letterRef),tx.get(playerRef),tx.get(bagRef),tx.get(scoreRef),tx.get(owner),tx.get(personal?mailboxRef:db.collection(SHARED_POI_PINS_COLLECTION).doc(sharedWorldDocumentId(postId)))]);
   const box=poiDoc.data();
   const poi=personal?(box?.owned===true&&box.deployed?{id:postId,type:'poi',subcategory:'Post Office',...box.deployed}:null):box;
   if(!poi||poi.id!==postId||poi.type!=='poi'||poi.subcategory!=='Post Office'||!Number.isFinite(poi.lat)||!Number.isFinite(poi.lng)
     ||calculateHaversineDistanceMetres(location,{latitude:poi.lat,longitude:poi.lng})>200)
     throw new HttpsError('failed-precondition','Move within 200 metres of a post office to collect mail.');
   const letter=letterDoc.data();if(!letter||letter.schemaVersion!==1)throw new HttpsError('not-found','Mail not found');
   const player=readStoredPlayerDocument(playerDoc.data()),items=readMarketInventory(bagDoc.data());
   if(!player.profileComplete)throw new HttpsError('failed-precondition','Complete your profile first');
   if(letter.status==='claimed')return {ok:true,collectedNow:false,player:serializePlayerSnapshot(player),inventory:{items}};
   if(letter.status!=='unclaimed')throw new HttpsError('failed-precondition','This delivery needs support');
   const reward=letter.reward;
   const rewardCoins=reward?.coins??0;
   if(!reward||!Number.isSafeInteger(reward.xp)||reward.xp<0||!Number.isSafeInteger(reward.points)||reward.points<0
     ||!Number.isSafeInteger(rewardCoins)||rewardCoins<0
     ||!reward.items||typeof reward.items!=='object'||Array.isArray(reward.items)||reward.card)
     throw new HttpsError('failed-precondition','This delivery needs support; nothing has been collected.');
   for(const [item,quantity]of Object.entries(reward.items)){
     if(!inventoryItemIds.includes(item as typeof inventoryItemIds[number])||!Number.isSafeInteger(quantity)||(quantity as number)<0)
       throw new HttpsError('failed-precondition','Invalid delivery item; nothing has been collected.');
     const total=Number(items[item]||0)+(quantity as number);
     if(total>MARKET_MAX_ITEM_QUANTITY)throw new HttpsError('failed-precondition','Make room in your inventory before collecting this delivery.');
     items[item]=total;
   }
   const now=new Date(),at=Timestamp.fromDate(now),xp=player.xp+reward.xp;
   if(!Number.isSafeInteger(xp))throw new HttpsError('failed-precondition','Player XP needs support');
   const coins=player.coins+rewardCoins;
   if(!Number.isSafeInteger(coins))throw new HttpsError('failed-precondition','Coin balance needs support; nothing has been collected.');
   const next={...player,xp,coins,level:reward.xp>0?getPlayerLevelAfterXpGain({currentLevel:player.level,totalXp:xp}):player.level,updatedAt:now};
   const scores=readLeaderboardScoreDocument(scoreDoc.data()),day=getGrowGoUtcDayKey(now),season=getGrowGoSeasonAt(now).key;
   tx.update(playerRef,{xp,coins,level:next.level,updatedAt:at});
   tx.set(bagRef,{schemaVersion:1,items,updatedAt:at},{merge:true});
   if(reward.points>0)tx.set(scoreRef,buildLeaderboardScoreDocument({daily:{key:day,points:(scores.daily.key===day?scores.daily.points:0)+reward.points},seasonal:{key:season,points:(scores.seasonal.key===season?scores.seasonal.points:scores.seasonal.key===null?player.xp:0)+reward.points},achievementPoints:scores.achievementPoints,updatedAt:at}));
   tx.update(letterRef,{status:'claimed',claimedAt:at,claimedAtPostOffice:postId});
   if(ownerDoc.exists&&!letter.campaignId)tx.update(owner,{pendingMailCount:Math.max(0,Number(ownerDoc.data()?.pendingMailCount||0)-1)});
   return{ok:true,collectedNow:true,player:serializePlayerSnapshot(next),inventory:{items}};
 });
}
export const playerMail=onCall({region:runtimeConfig.region,enforceAppCheck:runtimeConfig.appCheck.enforceOnCallable},playerMailHandler);
