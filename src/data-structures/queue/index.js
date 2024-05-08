// Relative path: src/dataStructures/queue/index.js
export class Queue {
  constructor() {
    this.items = [];
    this.signature = "fsCustomClass";
  }

  enqueue(element) {
    this.items.push(element);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}
