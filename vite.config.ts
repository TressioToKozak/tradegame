import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import media from "./src/product-media.json";

function offline(): Plugin {
  return {
    name: "offline-shell",
    generateBundle(_, bundle) {
      const collection = media.collection as { path: string }[];
      const files = [
        "./",
        "favicon.svg",
        "brand/jwcs.svg",
        "game-art/whisky-salon.png",
        "game-art/auction-room.png",
        ...Object.keys(bundle),
        ...collection.map((photo) => photo.path),
      ];
      const version = String(Date.now());
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const PREFIX='jw-v2-'+new URL(self.registration.scope).pathname+'-';
const CACHE=PREFIX+${JSON.stringify(version)};
const PHOTOS=CACHE+'-photos';
const FILES=${JSON.stringify(files)};
const MAX_PHOTOS=80;
let photoWrites=Promise.resolve();
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE&&key!==PHOTOS).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const shell=await caches.open(CACHE),hit=await shell.match(event.request,{ignoreVary:true});
  if(hit)return hit;
  const photo=url.pathname.includes('/images/whisky/');
  if(photo){
   const cache=await caches.open(PHOTOS),cached=await cache.match(event.request);
   if(cached)return cached;
   try{
    const response=await fetch(event.request);
    if(response.ok){
     const copy=response.clone();
     photoWrites=photoWrites.catch(()=>{}).then(async()=>{await cache.put(event.request,copy);const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-MAX_PHOTOS)))await cache.delete(key);});
     event.waitUntil(photoWrites);
    }
    return response;
   }catch{return Response.error();}
  }
  try{return await fetch(event.request)}catch{
   if(event.request.mode==='navigate')return (await shell.match('./'))||Response.error();
   return Response.error();
  }
 })());
});`,
      });
    },
  };
}
export default defineConfig({
  plugins: [react(), tailwindcss(), offline()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          motion: ["motion/react"],
          storage: ["dexie"],
        },
      },
    },
  },
});
