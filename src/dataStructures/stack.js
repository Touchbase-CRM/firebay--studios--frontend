export class Stack {
  constructor(items = []) {
    this.items = items;
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

  // Update an element at a given index
  update(index, element) {
    if (index < 0 || index >= this.items.length) {
      return "Invalid index";
    }
    this.items[index] = element;
    return `Element at index ${index} updated`;
  }

  // Display the stack
  printStack() {
    return this.items.toString();
  }

  /**
   * Clones the stack by creating a new stack with a copy of the current items.
   *Used for deep cloning to force re-rendering.
   * @return {Stack} A new stack with a copy of the current items.
   */
  clone() {
    return new Stack([...this.items]);
  }
}
