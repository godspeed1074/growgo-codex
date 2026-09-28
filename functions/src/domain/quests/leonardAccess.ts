export const LEONARD_OWNER='LkR8ugTK6lXGFfUlLvKSiqMoMBh1';
export function leonardTestPlayers(){return [...new Set((process.env.GROWGO_LEONARD_TEST_UIDS??'').split(',').map(s=>s.trim()).filter(s=>/^[A-Za-z0-9_-]{1,128}$/.test(s)))].slice(0,20);}
export function automaticLeonardEnabled(uid:string){return process.env.GROWGO_LEONARD_ALL_PLAYERS_ENABLED==='true'||leonardTestPlayers().includes(uid);}
export function leonardPlayerEnabled(uid:string){return automaticLeonardEnabled(uid)||(uid===LEONARD_OWNER&&process.env.GROWGO_LEONARD_PILOT_ENABLED==='true');}
