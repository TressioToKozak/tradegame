import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
/** Standalone game location, independent of the application's modal styles. */
export default function AuctionScreen({ title, onClose, className, children }: { title: string; onClose: () => void; className: string; children: ReactNode }) {
  const root=useRef<HTMLElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null, overflow=document.body.style.overflow;
    const background=Array.from(document.body.children).filter((node):node is HTMLElement=>node instanceof HTMLElement && !node.contains(root.current));
    const inert=background.map(node=>node.inert);
    background.forEach(node=>{node.inert=true;});document.body.style.overflow="hidden";root.current?.focus();
    const key=(event:KeyboardEvent)=>{
      const dialogs=document.querySelectorAll('[aria-modal="true"]');
      if(dialogs[dialogs.length-1]!==root.current)return;
      if(event.key==="Escape"){event.preventDefault();onClose();}
      if(event.key!=="Tab")return;
      const nodes=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),a[href],summary,[tabindex="0"]')??[]).filter(node=>node.getClientRects().length>0);
      const first=nodes[0],last=nodes.at(-1);
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===root.current)){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    };
    document.addEventListener("keydown",key);
    return()=>{document.removeEventListener("keydown",key);document.body.style.overflow=overflow;background.forEach((node,i)=>{node.inert=inert[i];});previous?.focus();};
  },[]);
  return createPortal(<section ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`auction-location ${className}`}>{children}</section>,document.body);
}
