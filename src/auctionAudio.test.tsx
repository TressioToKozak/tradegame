// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SoundToggle, unlockAudio, playAuctionSound } from "./auctionAudio";
let starts=0, creations=0;
class FakeAudio {
  state="running"; currentTime=0; destination={};
  constructor(){creations++;}
  resume(){this.state="running";return Promise.resolve();}
  suspend(){this.state="suspended";return Promise.resolve();}
  createOscillator(){return {type:"sine",frequency:{value:0},connect(){},disconnect(){},start(){starts++;},stop(){}};}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
}
beforeEach(()=>{starts=0;creations=0;vi.stubGlobal("AudioContext",FakeAudio);});
afterEach(()=>{const toggle=screen.queryAllByRole("switch")[0];if(toggle?.getAttribute("aria-checked")==="true")fireEvent.click(toggle);cleanup();vi.unstubAllGlobals();});
it("nie tworzy audio ani nie gra domyślnie",()=>{render(<SoundToggle/>);unlockAudio();playAuctionSound("win");expect(creations).toBe(0);expect(starts).toBe(0);});
it("jedna preferencja synchronizuje oba przełączniki i zachowuje się lokalnie",()=>{render(<><SoundToggle/><SoundToggle/></>);const toggles=screen.getAllByRole("switch");fireEvent.click(toggles[0]);expect(toggles.every(t=>t.getAttribute("aria-checked")==="true")).toBe(true);expect(localStorage.getItem("jw-sound")).toBe("true");fireEvent.click(toggles[1]);expect(toggles.every(t=>t.getAttribute("aria-checked")==="false")).toBe(true);});
it("krótkie efekty działają dopiero po włączeniu, a wyłączenie je zatrzymuje",()=>{render(<SoundToggle/>);fireEvent.click(screen.getByRole("switch"));playAuctionSound("bid");playAuctionSound("outbid");playAuctionSound("tick");playAuctionSound("hammer");playAuctionSound("win");expect(starts).toBe(10);fireEvent.click(screen.getByRole("switch"));playAuctionSound("bid");expect(starts).toBe(10);});
