export class Stack {
  constructor() {
    this.items = [];
  }

  // Add an element to the top of the stack
  push(element) {
    this.items.push(element);
  }

  // Remove the top element from the stack and return it
  pop() {
    if (this.isEmpty()) {
      return "Stack is empty";
    }
    return this.items.pop();
  }

  // View the top element of the stack without removing it
  peek() {
    if (this.isEmpty()) {
      return "Stack is empty";
    }
    return this.items[this.items.length - 1];
  }

  // Check if the stack is empty
  isEmpty() {
    return this.items.length === 0;
  }

  // Return the number of elements in the stack
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
}
