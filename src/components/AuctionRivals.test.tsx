// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { createGame } from "../engine";
import AuctionRivals, { avatarSeed } from "./AuctionRivals";
afterEach(cleanup);
it("tożsamość awatara jest stabilna i rozróżnia uczestników",()=>{expect(avatarSeed("p0")).toBe(avatarSeed("p0"));expect(avatarSeed("p0")).not.toBe(avatarSeed("p1"));});
it("pokazuje wyłącznie ujawnionych uczestników i rzeczywiste wycofanie, bez prywatnych danych",()=>{
  const s=createGame(1700000000000,42),a=s.auctions[0],p=s.people.find(p=>p.role==="bidder")!;
  s.people.forEach(p=>p.memory=[]);a.watchers=[];a.bids=[];a.leader=null;
  p.budget=987654321;a.limits[p.id]=876543210;
  const {container,rerender}=render(<AuctionRivals auction={a} state={s}/>);
  expect(container.textContent).not.toContain(p.name);
  a.bids.push({actor:p.id,at:s.now,amount:a.price});a.leader=p.id;
  rerender(<AuctionRivals auction={a} state={s}/>);expect(container.textContent).toContain("PROWADZI");
  a.leader="player";p.memory.push({at:s.now+1000,kind:"withdraw",ref:a.id,detail:"Tajny limit i budżet"});
  rerender(<AuctionRivals auction={a} state={s}/>);expect(container.textContent).toContain("Wycofał się");
  for(const secret of ["987654321","876543210","Tajny limit"])expect(container.textContent).not.toContain(secret);
});
