// Offline cache for the studio: once it has loaded, it opens, voices lines and plays and exports the finished
// episodes with no connection. Our own files are network-first (edits show up at once) and pinned CDN libraries
// cache-first. Each finished episode's audio (its mastered mix and voice track) is kept too, and the audio
// element's range requests for it are answered from the cache when offline.
// The voice model is not cached here: the voice worker keeps it (src/kokoro-worker.js).
const CACHE='frameforge-shell-v3';
const SHELL=['studio.html','src/project-core.js','src/performance-core.js','src/speech-performance-core.js','src/dev-acting-core.js','src/robot-acting-core.js','design/robot-forms.js','design/robot-character.js',
 'src/kokoro-g2p.js','src/voice-emotion.js','src/kokoro-worker.js','src/sound-kit.mjs','src/episode-mix.mjs','src/mix-worker.js','design/dev-forms.js','design/dev-character.js','design/set-forms.js','design/set-arena.js','src/arena-set.js','assets/voice/en-us-lexicon.json','assets/voice/en-gb-lexicon.json',
 'projects/index.json','projects/zero-latency.frameforge.json','projects/dark-mode.frameforge.json','projects/mountain-mystery.frameforge.json',
 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js',
 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/ort.webgpu.bundle.min.mjs',
 'https://cdn.jsdelivr.net/npm/mediabunny@1.62.1/+esm','credits.html'];

// The audio of every finished episode listed in projects/index.json.
async function episodeAudio(){
 const index=await (await fetch('projects/index.json',{cache:'reload'})).json(),urls=[];
 for(const {file} of index.episodes){
  try{const p=await (await fetch('projects/'+file,{cache:'reload'})).json();urls.push(p.audio?.masterUrl,p.audio?.voiceUrl);}
  catch(e){console.warn('Offline cache skipped',file,e.message);}
 }
 return urls.filter(Boolean);
}

self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 // One missing file must not stop the rest from being kept.
 const audio=await episodeAudio().catch(e=>{console.warn('Offline cache skipped episode audio',e.message);return [];});
 await Promise.all([...SHELL,...audio].map(url=>cache.add(new Request(url,{cache:'reload'})).catch(e=>console.warn('Offline cache skipped',url,e.message))));
 await self.skipWaiting();
})()));
// Older shell caches go; the voice model and voiced-line caches belong to the voice worker and stay.
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith('frameforge-shell-')&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));

// "bytes=a-b", "bytes=a-" or "bytes=-n" of a cached file, as a 206 response.
async function cachedRange(request){
 const hit=await (await caches.open(CACHE)).match(request.url,{ignoreSearch:true});
 if(!hit)return Response.error();
 const blob=await hit.blob(),m=/bytes=(\d*)-(\d*)/.exec(request.headers.get('range')||'');
 let start=m?.[1]?Number(m[1]):0,end=m?.[2]?Number(m[2]):blob.size-1;
 if(m&&!m[1]&&m[2]){start=Math.max(0,blob.size-Number(m[2]));end=blob.size-1;}
 end=Math.min(end,blob.size-1);
 if(start>end)return new Response(null,{status:416,headers:{'content-range':'bytes */'+blob.size}});
 return new Response(blob.slice(start,end+1),{status:206,headers:{'content-type':hit.headers.get('content-type')||'audio/mpeg',
  'content-range':`bytes ${start}-${end}/${blob.size}`,'content-length':String(end-start+1),'accept-ranges':'bytes'}});
}

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
 if(request.method!=='GET')return;
 // Episode audio: the network when there is one, else a slice of the cached file. Other media seeks (Range
 // requests: the reference films) are left alone.
 if(request.headers.has('range')){
  if(url.origin===location.origin&&url.pathname.includes('/audio/'))event.respondWith(fetch(request).catch(()=>cachedRange(request)));
  return;
 }
 // The voice model and voiced lines are left alone.
 if(url.origin===location.origin){
  if(url.pathname.includes('/models/')||url.pathname.includes('/__voice-lines/'))return;
  event.respondWith(networkFirst(request));
 }else if(url.hostname==='cdn.jsdelivr.net'&&/@\d/.test(url.pathname))event.respondWith(cacheFirst(request));
});
