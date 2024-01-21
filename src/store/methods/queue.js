// src/store/methods/Queue.js
import { produce } from "immer";
import { Queue } from "../../dataStructures/queue";

export class QueueMethods {
  constructor(set) {
    this.set = set;

    // Binding all methods to the class instance
    this.enqueueSectionZustand = this.enqueueSectionZustand.bind(this);
    this.dequeueSectionZustand = this.dequeueSectionZustand.bind(this);
    this.resetSectionsQueueZustand = this.resetSectionsQueueZustand.bind(this);
  }
  enqueueSectionZustand(section) {
    this.set(
      produce((state) => {
        state.sectionsQueue.items.push(section);
      })
    );
  }

  dequeueSectionZustand() {
    this.set(
      produce((state) => {
        state.lastDequeuedItem = state.sectionsQueue.items.shift();
      })
    );
  }

  resetSectionsQueueZustand() {
    this.set({ sectionsQueue: new Queue() });
  }
}
