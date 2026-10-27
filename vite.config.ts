import {defineConfig,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
function offline():Plugin{return {name:'offline-shell',generateBundle(_,bundle){const files=['./',...Object.keys(bundle)];const version='jw-'+Date.now();this.emitFile({type:'asset',fileName:'sw.js',source:`const CACHE=${JSON.stringify(version)};const FILES=${JSON.stringify(files)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('jw-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request,{ignoreVary:true}).then(hit=>hit||fetch(e.request).catch(()=>e.request.mode==='navigate'?caches.match('./'):Response.error())))});`});}}}
export default defineConfig({
 plugins:[react(),tailwindcss(),offline()],
 base:'./',
 build:{rollupOptions:{output:{manualChunks:{charts:['recharts'],motion:['motion/react'],storage:['dexie']}}}}
});
