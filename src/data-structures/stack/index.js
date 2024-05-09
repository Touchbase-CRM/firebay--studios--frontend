// Relative path: src/dataStructures/stack/index.js
export class Stack {
  constructor(items = []) {
    this.items = items;
    this.signature = "fsCustomClass";
  }

  push(element) {
    this.items.push(element);
  }

  pop() {
    if (this.isEmpty()) {
      return "Stack is empty";
    }
    return this.items.pop();
  }

  peek() {
    if (this.isEmpty()) {
      return "Stack is empty";
    }
    return this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  update(index, element) {
    if (index < 0 || index >= this.items.length) {
      return "Invalid index";
    }
    this.items[index] = element;
    return `Element at index ${index} updated`;
  }

  printStack() {
    return this.items.toString();
  }

  clone() {
    return new Stack([...this.items]);
  }

  serialize() {
    return JSON.stringify(this.items);
  }

  static deserialize(data) {
    const items = JSON.parse(data);
    return new Stack(items);
  }
}
