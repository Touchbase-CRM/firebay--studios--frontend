// src/store/methods/Queue.js
import { produce } from "immer";
import { Queue } from "../../dataStructures/queue";

export class QueueMethods {
  constructor(set) {
    this.set = set;
  }

  enqueueSection(section) {
    this.set(
      produce((state) => {
        state.sectionsQueue.items.push(section);
      })
    );
  }

  dequeueSection() {
    this.set(
      produce((state) => {
        state.lastDequeuedItem = state.sectionsQueue.items.shift();
      })
    );
  }

  resetSectionsQueue() {
    this.set({ sectionsQueue: new Queue() });
  }
}
