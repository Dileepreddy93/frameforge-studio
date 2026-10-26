// For machines that cannot reach cdn.jsdelivr.net (sandboxes, some CI proxies): serve the studio's pinned
// CDN libraries from a local npm folder instead. Set FRAMEFORGE_CDN_MIRROR to a folder holding
// node_modules/{three,onnxruntime-web,mediabunny,@mediabunny/aac-encoder} at the versions the studio pins.
// With the variable unset nothing is routed and the browser uses the real CDN.
const fs=require('node:fs');
const path=require('node:path');

const ESM={'mediabunny':'mediabunny/dist/bundles/mediabunny.mjs','@mediabunny/aac-encoder':'@mediabunny/aac-encoder/dist/bundles/mediabunny-aac-encoder.mjs'};
const TYPES={'.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json'};

async function useCdnMirror(context,dir=process.env.FRAMEFORGE_CDN_MIRROR){
 if(!dir)return false;
 const modules=path.join(dir,'node_modules');
 await context.route('https://cdn.jsdelivr.net/npm/**',async route=>{
  const m=new URL(route.request().url()).pathname.match(/^\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/]+)\/(.*)$/);
  if(!m)return route.abort();
  const [,name,version,rest]=m,root=path.join(modules,name);
  const pinned=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
  if(pinned!==version)throw new Error(`CDN mirror has ${name}@${pinned}, the studio asks for ${version}`);
  if(rest==='+esm'){
   // jsDelivr's +esm rewrites bare imports to CDN URLs; do the same for the one bare import we serve.
   const body=fs.readFileSync(path.join(modules,ESM[name]),'utf8')
    .replace(/from\s*["']mediabunny["']/g,`from "https://cdn.jsdelivr.net/npm/mediabunny@${version}/+esm"`);
   return route.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body});
  }
  const file=path.join(root,rest);
  if(!file.startsWith(root)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
  return route.fulfill({status:200,contentType:TYPES[path.extname(file)]||'application/octet-stream',
   headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(file)});
 });
 return true;
}
module.exports={useCdnMirror};
