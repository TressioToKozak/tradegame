import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import media from "./src/product-media.json";

function offline(): Plugin {
  return {
    name: "offline-shell",
    generateBundle(_, bundle) {
      const photos = Object.values(media.products).flat() as { path: string }[];
      const collection = media.collection as { path: string }[];
      const files = [
        "./",
        ...Object.keys(bundle),
        ...[...photos, ...collection].map((photo) => photo.path),
      ];
      const version = String(Date.now());
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const PREFIX='jw-v2-'+new URL(self.registration.scope).pathname+'-';
const CACHE=PREFIX+${JSON.stringify(version)};
const FILES=${JSON.stringify(files)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const hit=await cache.match(event.request,{ignoreVary:true});
  if(hit)return hit;
  try{return await fetch(event.request)}catch(error){
   if(event.request.mode==='navigate')return (await cache.match('./'))||Response.error();
   return Response.error();
  }
 }));
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
