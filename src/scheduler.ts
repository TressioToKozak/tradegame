import type { Event } from "./engine";
const earlier = (a: Event, b: Event) =>
  a.at < b.at || (a.at === b.at && a.id < b.id);
/** Binary heap. Timestamp and registration ID form a total order, including equal deadlines. */
export class EventQueue {
  private heap: Event[] = [];
  constructor(events: Event[]) {
    for (const e of events) if (!e.done) this.push(e);
  }
  get first() {
    return this.heap[0];
  }
  push(e: Event) {
    let i = this.heap.push(e) - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!earlier(e, this.heap[p])) break;
      this.heap[i] = this.heap[p];
      i = p;
    }
    this.heap[i] = e;
  }
  pop() {
    const top = this.heap[0],
      last = this.heap.pop();
    if (this.heap.length && last) {
      let i = 0;
      while (i * 2 + 1 < this.heap.length) {
        let c = i * 2 + 1;
        if (c + 1 < this.heap.length && earlier(this.heap[c + 1], this.heap[c]))
          c++;
        if (!earlier(this.heap[c], last)) break;
        this.heap[i] = this.heap[c];
        i = c;
      }
      this.heap[i] = last;
    }
    return top;
  }
}
