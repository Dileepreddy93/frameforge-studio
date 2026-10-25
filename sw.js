// Offline cache for the studio: once it has loaded, it opens and voices lines with no connection.
// Our own files are network-first (edits show up at once) and pinned CDN libraries cache-first.
// The voice model is not cached here: the voice worker keeps it (src/kokoro-worker.js).
const CACHE='frameforge-shell-v1';
const SHELL=['studio.html','src/project-core.js','src/performance-core.js','src/speech-performance-core.js','src/dev-acting-core.js',
 'src/kokoro-g2p.js','src/voice-emotion.js','src/kokoro-worker.js','design/dev-forms.js','design/dev-character.js','assets/voice/en-us-lexicon.json',
 'projects/index.json','projects/zero-latency.frameforge.json','projects/dark-mode.frameforge.json','projects/mountain-mystery.frameforge.json',
 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js',
 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.webgpu.bundle.min.mjs',
 'https://cdn.jsdelivr.net/npm/mediabunny@1.62.1/+esm'];

self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 // One missing file must not stop the rest from being kept.
 await Promise.all(SHELL.map(url=>cache.add(new Request(url,{cache:'reload'})).catch(e=>console.warn('Offline cache skipped',url,e.message))));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

async function networkFirst(request){
 const cache=await caches.open(CACHE);
 try{
  const response=await fetch(request);
  if(response.ok&&response.type==='basic')cache.put(request,response.clone());
  return response;
 }catch(e){
  const hit=await cache.match(request,{ignoreSearch:true});
  if(hit)return hit;
  throw e;
 }
}
async function cacheFirst(request){
 const cache=await caches.open(CACHE),hit=await cache.match(request);
 if(hit)return hit;
 const response=await fetch(request);
 if(response.ok)cache.put(request,response.clone());
 return response;
}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 // Media seeks (Range requests), the voice model and voiced lines are left alone.
 if(request.method!=='GET'||request.headers.has('range'))return;
 if(url.origin===location.origin){
  if(url.pathname.includes('/models/')||url.pathname.includes('/__voice-lines/'))return;
  event.respondWith(networkFirst(request));
 }else if(url.hostname==='cdn.jsdelivr.net'&&/@\d/.test(url.pathname))event.respondWith(cacheFirst(request));
});
