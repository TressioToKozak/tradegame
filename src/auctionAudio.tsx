import { useEffect, useRef, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { Auction } from "./engine";
let enabled = false;
try { enabled = localStorage.getItem("jw-sound") === "true"; } catch { /* Optional preference. */ }
let context: AudioContext | null = null;
const listeners = new Set<() => void>();
export function unlockAudio() {
  if (!enabled) return;
  try { context ??= new AudioContext(); void context.resume().catch(() => {}); } catch { /* Audio unavailable: gameplay continues. */ }
}
export function playAuctionSound(kind: "bid" | "outbid" | "tick" | "hammer" | "win") {
  if (!enabled || !context || context.state !== "running" || document.hidden) return;
  const notes = {bid:[440,660],outbid:[330,247],tick:[700],hammer:[110,75],win:[523,659,784]}[kind];
  notes.forEach((frequency, i) => {
    const oscillator=context!.createOscillator(), gain=context!.createGain(), start=context!.currentTime+i*.085;
    oscillator.type=kind==="hammer" ? "triangle" : "sine";
    oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.06,start+.008);gain.gain.exponentialRampToValueAtTime(.001,start+.13);
    oscillator.connect(gain);gain.connect(context!.destination);oscillator.start(start);oscillator.stop(start+.14);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  });
}
export function SoundToggle() {
  const on=useSyncExternalStore(callback=>{listeners.add(callback);return()=>{listeners.delete(callback);};},()=>enabled);
  return <button type="button" className="sound-toggle outline" role="switch" aria-label="Dźwięki gry" aria-checked={on} onClick={()=>{
    enabled=!enabled;try{localStorage.setItem("jw-sound",String(enabled));}catch{/* Preference is optional. */}
    if(enabled)unlockAudio();else if(context)void context.suspend().catch(()=>{});
    listeners.forEach(callback=>callback());
  }}>{on?<Volume2 size={17}/>:<VolumeX size={17}/>}<span>Dźwięk {on?"włączony":"wyłączony"}</span></button>;
}
export function useAuctionAudio(a: Auction, now: number) {
  const previous=useRef({id:a.id,bids:a.bids.length,status:a.status,leader:a.leader,seconds:Math.ceil((a.end-now)/1000)});
  useEffect(()=>{
    const old=previous.current, seconds=Math.ceil((a.end-now)/1000);
    if(old.id===a.id){
      if(old.status==="active" && a.status==="closed")playAuctionSound(a.leader==="player"?"win":"hammer");
      else if(a.bids.length>old.bids)playAuctionSound(old.leader==="player" && a.leader!=="player"?"outbid":"bid");
      else if(a.status==="active" && old.seconds>10 && seconds<=10 && seconds>0)playAuctionSound("tick");
    }
    previous.current={id:a.id,bids:a.bids.length,status:a.status,leader:a.leader,seconds};
  },[a.id,a.bids.length,a.status,a.leader,a.end,now]);
}
