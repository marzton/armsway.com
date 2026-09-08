import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.ts';
test('homepage and assets use the assets binding',async()=>{
 const calls=[];const env={ASSETS:{fetch:async r=>{calls.push(new URL(r.url).pathname);return new Response('asset');}}};
 for(const path of ['/','/style.css','/assets/logo-armsway.svg']){const r=await worker.fetch(new Request('https://armsway.com'+path),env,{});assert.equal(await r.text(),'asset');}
 assert.deepEqual(calls,['/','/style.css','/assets/logo-armsway.svg']);
});
test('missing intake dependencies fail before any write',async()=>{
 let wrote=false;const env={AUDIT_DB:{prepare(){wrote=true;throw Error('must not write');}}};
 const r=await worker.fetch(new Request('https://armsway.com/api/contact',{method:'POST',body:new FormData()}),env,{});
 assert.equal(r.status,503);assert.equal((await r.json()).ok,false);assert.equal(wrote,false);
});
test('unknown APIs do not return the homepage',async()=>{
 const r=await worker.fetch(new Request('https://armsway.com/api/absent'),{},{});
 assert.equal(r.status,404);
});
