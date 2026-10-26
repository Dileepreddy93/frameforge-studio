// Mixes an episode's soundtrack off the main thread (src/episode-mix.mjs): synthesising the score takes a moment.
import {mixEpisode} from './episode-mix.mjs';

self.onmessage=({data})=>{
 const {id,voice,shots,music}=data;
 try{
  const started=performance.now(),r=mixEpisode({voice,shots,music});
  self.postMessage({id,...r,ms:Math.round(performance.now()-started)},[r.left.buffer,r.right.buffer]);
 }catch(e){self.postMessage({id,error:e.message||String(e)});}
};
