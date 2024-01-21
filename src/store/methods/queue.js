// src/store/methods/Queue.js
import { produce } from "immer";
import { Queue } from "../../dataStructures/queue";

export class QueueMethods {
  constructor(set) {
    this.set = set;

    // Binding all methods to the class instance
    this.enqueueSection = this.enqueueSection.bind(this);
    this.dequeueSection = this.dequeueSection.bind(this);
    this.resetSectionsQueue = this.resetSectionsQueue.bind(this);
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
