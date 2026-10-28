import "./AuctionRivals.css";
import { useState } from "react";
import { motion } from "motion/react";
import type { Auction, State } from "../engine";
export function avatarSeed(id: string) { const h=[...id].reduce((hash,c)=>Math.imul(hash^c.charCodeAt(0),16777619)>>>0,2166136261);return Math.imul(h^(h>>>16),2246822507)>>>0; }
export default function AuctionRivals({auction:a,state:s}:{auction:Auction;state:State}) {
  const [open,setOpen]=useState(()=>window.innerWidth>700);
  const participants=s.people.filter(p=>p.role==="bidder" && (a.bids.some(b=>b.actor===p.id) || a.watchers?.includes(p.id) || p.memory.some(m=>m.ref===a.id && ["watch","withdraw"].includes(m.kind))));
  return <details className="auction-rivals" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary>Uczestnicy aukcji <span>{participants.length}</span></summary>
    <div className="rival-list">{participants.map(p=>{
      const last=a.bids.filter(b=>b.actor===p.id).at(-1), memory=p.memory.filter(m=>m.ref===a.id && ["watch","withdraw"].includes(m.kind)).at(-1), withdrawn=memory?.kind==="withdraw" && (!last || memory.at>=last.at), leads=a.leader===p.id, seed=avatarSeed(p.id);
      return <motion.div key={p.id} className={`rival ${leads?"rival-leading":""} ${withdrawn&&!leads?"rival-withdrawn":""}`} data-actor={p.id}>
        <motion.span key={`${p.id}-${last?.at}-${last?.amount}`} className="rival-avatar" style={{backgroundColor:`hsl(${seed%360} 24% 28%)`}} initial={last && s.now-last.at<4000?{scale:.85}:false} animate={{scale:1}}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 48c0-17 38-17 38 0" fill="#d5b68b"/><ellipse cx="24" cy="20" rx="10" ry="12" fill="#e5c7a4"/><path d={seed%2?"M13 19V8l22 3v10l-6-8-9 2z":"M13 18Q12 1 28 5q11 1 7 17l-7-10-15 6"} fill="#342820"/>{seed%3===0 && <g fill="none" stroke="#59452e" strokeWidth="1.5"><circle cx="19" cy="20" r="4"/><circle cx="29" cy="20" r="4"/><path d="M23 20h2"/></g>}<circle cx="20" cy="20" r="1.2"/><circle cx="28" cy="20" r="1.2"/><path d="M21 27q3 2 6 0" fill="none" stroke="#795344"/></svg>
        </motion.span><div><strong>{p.name}</strong><small>{leads?"PROWADZI":withdrawn?"Wycofał się":last?"Przebity — oferta przyjęta wcześniej":"Obserwuje"}</small></div>
      </motion.div>;
    })}{!participants.length&&<p className="muted">Pierwsi uczestnicy jeszcze nie ujawnili się w tej aukcji.</p>}</div>
  </details>;
}
